#!/usr/bin/env node
/*
  Danger: Deletes ALL championships and related data (teams, players, games, goals).
  Usage:
    node scripts/delete-all-championships.js
*/
const path = require('path');
const dotenv = require('dotenv');
// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = require('../config/database');
const { Championship, Team, Player, Game, Goal } = require('../models');

(async () => {
  const t = await sequelize.transaction();
  try {
    console.log('⚠️  Deleting ALL championships and associated data...');

    // Get all championship ids
    const championships = await Championship.findAll({ attributes: ['id'], transaction: t });
    const ids = championships.map(c => c.id);
    if (ids.length === 0) {
      console.log('No championships to delete.');
      await t.rollback();
      process.exit(0);
    }

    // Find teams for those championships
    const teams = await Team.findAll({ where: { championshipId: ids }, attributes: ['id'], transaction: t });
    const teamIds = teams.map(ti => ti.id);

    // Delete goals for games in those championships
    const games = await Game.findAll({ where: { championshipId: ids }, attributes: ['id'], transaction: t });
    const gameIds = games.map(g => g.id);

    if (gameIds.length > 0) {
      await Goal.destroy({ where: { gameId: gameIds }, transaction: t });
      console.log(`🗑️  Deleted goals for ${gameIds.length} game(s)`);
    }

    // Delete games
    await Game.destroy({ where: { championshipId: ids }, transaction: t });
    console.log(`🗑️  Deleted ${games.length} game(s)`);

    // Delete players for those teams
    if (teamIds.length > 0) {
      const deletedPlayers = await Player.destroy({ where: { teamId: teamIds }, transaction: t });
      console.log(`🗑️  Deleted ${deletedPlayers} player(s)`);
    }

    // Delete teams
    const deletedTeams = await Team.destroy({ where: { championshipId: ids }, transaction: t });
    console.log(`🗑️  Deleted ${deletedTeams} team(s)`);

    // Finally delete championships
    const deletedChamps = await Championship.destroy({ where: { id: ids }, transaction: t });
    console.log(`🏁 Deleted ${deletedChamps} championship(s)`);

    await t.commit();
    console.log('✅ Done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to delete championships:', err);
    try { await t.rollback(); } catch {}
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
})();

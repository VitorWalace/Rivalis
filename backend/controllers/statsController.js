const { Player, Team, Goal, Game, Championship, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');

// GET /api/championships/:id/stats
exports.getChampionshipStats = async (req, res) => {
  try {
    // Desabilitar cache para estatísticas
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o campeonato pertence ao usuário
    const championship = await Championship.findOne({
      where: { id, createdBy: userId }
    });
    
    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }
    
    // Top artilheiros (com gols, assistências, jogos)
    const topScorers = await Player.findAll({
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      order: [['goals', 'DESC'], ['assists', 'DESC'], ['name', 'ASC']],
      limit: 10
    });
    
    // Top assistentes
    const topAssisters = await Player.findAll({
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      order: [['assists', 'DESC'], ['goals', 'DESC'], ['name', 'ASC']],
      limit: 10
    });
    
    // Jogadores mais disciplinados (menos cartões)
    const fairPlay = await Player.findAll({
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      order: [
        ['redCards', 'ASC'],
        ['yellowCards', 'ASC'],
        ['gamesPlayed', 'DESC'],
        ['name', 'ASC']
      ],
      limit: 10
    });
    
    // Jogadores com mais XP
    const topXP = await Player.findAll({
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      order: [['xp', 'DESC'], ['name', 'ASC']],
      limit: 10
    });
    
    // Log para debug de conquistas
    console.log('🏆 [stats] Conquistas dos jogadores:');
    topXP.forEach(player => {
      console.log(`   - ${player.name}: ${player.achievements ? JSON.stringify(player.achievements) : 'nenhuma'}`);
    });
    
    // Estatísticas gerais
    const totalGoals = await Goal.count({
      include: [{
        model: Game,
        as: 'game',
        where: { championshipId: id }
      }]
    });
    
    const totalGames = await Game.count({
      where: { 
        championshipId: id,
        status: 'finalizado'
      }
    });
    
    const totalPlayers = await Player.count({
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id }
      }]
    });
    
    // Gols por tipo
    const goalsByType = await Goal.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('type')), 'count']
      ],
      include: [{
        model: Game,
        as: 'game',
        where: { championshipId: id },
        attributes: []
      }],
      group: ['type'],
      raw: true
    });
    
    const avgGoalsPerGame = totalGames > 0 ? (totalGoals / totalGames).toFixed(2) : 0;
    
    // Cartões
    const totalYellowCards = await Player.sum('yellowCards', {
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id },
        attributes: []
      }]
    }) || 0;
    
    const totalRedCards = await Player.sum('redCards', {
      include: [{
        model: Team,
        as: 'team',
        where: { championshipId: id },
        attributes: []
      }]
    }) || 0;
    
    console.log('📊 [stats] Estatísticas carregadas para campeonato:', id);
    console.log('📊 [stats] topScorers:', topScorers.length, 'jogadores');
    console.log('📊 [stats] topAssisters:', topAssisters.length, 'jogadores');
    console.log('📊 [stats] fairPlay:', fairPlay.length, 'jogadores');
    console.log('📊 [stats] topXP:', topXP.length, 'jogadores');
    
    res.json({
      topScorers,
      topAssisters,
      fairPlay,
      topXP,
      summary: {
        totalGoals,
        totalGames,
        totalPlayers,
        avgGoalsPerGame,
        totalYellowCards,
        totalRedCards,
        goalsByType
      }
    });
    
  } catch (error) {
    console.error('❌ [stats] Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// GET /api/players/:id/stats
exports.getPlayerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const player = await Player.findByPk(id, {
      include: [{
        model: Team,
        as: 'team',
        include: [{
          model: Championship,
          where: { createdBy: userId }
        }]
      }]
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Jogador não encontrado' });
    }
    
    // Buscar histórico de gols
    const goals = await Goal.findAll({
      where: { playerId: id },
      include: [{
        model: Game,
        include: [
          { model: Team, as: 'homeTeam', attributes: ['name', 'color'] },
          { model: Team, as: 'awayTeam', attributes: ['name', 'color'] }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    // Buscar assistências
    const assists = await Goal.findAll({
      where: { assistPlayerId: id },
      include: [{
        model: Game,
        include: [
          { model: Team, as: 'homeTeam', attributes: ['name', 'color'] },
          { model: Team, as: 'awayTeam', attributes: ['name', 'color'] }
        ]
      }, {
        model: Player,
        as: 'player',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    // Calcular média por jogo
    const goalsPerGame = player.gamesPlayed > 0 ? (player.goals / player.gamesPlayed).toFixed(2) : 0;
    const assistsPerGame = player.gamesPlayed > 0 ? (player.assists / player.gamesPlayed).toFixed(2) : 0;
    const winRate = player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) : 0;
    
    // Calcular nível baseado em XP
    const levelInfo = calculateLevel(player.xp || 0);
    
    console.log('📊 [stats] Estatísticas do jogador:', player.name);
    
    res.json({
      player: player.toJSON(),
      stats: {
        goalsPerGame,
        assistsPerGame,
        winRate,
        levelInfo
      },
      history: {
        goals,
        assists
      }
    });
    
  } catch (error) {
    console.error('❌ [stats] Erro ao buscar estatísticas do jogador:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// Função auxiliar para calcular nível
function calculateLevel(xp) {
  let level = 1;
  let xpNeeded = 100;
  let totalXpForLevel = 0;
  
  while (xp >= totalXpForLevel + xpNeeded) {
    totalXpForLevel += xpNeeded;
    level++;
    xpNeeded = Math.floor(xpNeeded * 1.5); // 50% a mais por nível
  }
  
  return {
    level,
    currentXp: xp - totalXpForLevel,
    xpForNextLevel: xpNeeded,
    totalXp: xp,
    progress: ((xp - totalXpForLevel) / xpNeeded * 100).toFixed(1)
  };
}


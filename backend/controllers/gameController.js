const { Game, Championship, Team, Player, Goal } = require('../models');
const { sequelize } = require('../config/database');

const parseGameNotes = (notes) => {
  if (!notes) {
    return { states: {} };
  }

  if (typeof notes !== 'string') {
    return { legacy: notes, states: {} };
  }

  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (!parsed.states || typeof parsed.states !== 'object') {
        parsed.states = {};
      }
      return parsed;
    }
    return { legacy: parsed, states: {} };
  } catch (error) {
    console.warn('⚠️ [parseGameNotes] Conteúdo de notas não era JSON válido. Mantendo como texto.', error);
    return { legacy: notes, states: {} };
  }
};

const serializeGameNotes = (notesObject) => JSON.stringify(notesObject);

// Criar novo jogo
const createGame = async (req, res) => {
  try {
  const { championshipId, homeTeamId, awayTeamId, round, venue, scheduledAt, stage } = req.body;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const championship = await Championship.findOne({
      where: { id: championshipId, createdBy: userId },
    });

    if (!championship) {
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    // Verificar se os times pertencem ao campeonato
    let homeTeam = null;
    if (homeTeamId) {
      homeTeam = await Team.findOne({
        where: { id: homeTeamId, championshipId },
      });

      if (!homeTeam) {
        return res.status(400).json({
          success: false,
          message: 'Time da casa não encontrado no campeonato',
        });
      }
    }

    let awayTeam = null;
    if (awayTeamId) {
      awayTeam = await Team.findOne({
        where: { id: awayTeamId, championshipId },
      });

      if (!awayTeam) {
        return res.status(400).json({
          success: false,
          message: 'Time visitante não encontrado no campeonato',
        });
      }
    }

    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Um time não pode jogar contra si mesmo',
      });
    }

    const game = await Game.create({
      championshipId,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      round: round || 1,
      venue,
      date: scheduledAt, // Mapear scheduledAt para date
      stage,
      // Não enviar status, o modelo usa 'agendado' como padrão
    });

    const gameWithTeams = await Game.findByPk(game.id, {
      include: [
  { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color', 'logo'] },
  { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color', 'logo'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Jogo criado com sucesso',
      data: { game: gameWithTeams },
    });
  } catch (error) {
    console.error('Erro ao criar jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar jogos do campeonato
const getGamesByChampionship = async (req, res) => {
  try {
    const { championshipId } = req.params;
    const userId = req.user.id;

    // Verificar se o campeonato pertence ao usuário
    const championship = await Championship.findOne({
      where: { id: championshipId, createdBy: userId },
    });

    if (!championship) {
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    const games = await Game.findAll({
      where: { championshipId },
      include: [
  { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color', 'logo'] },
  { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color', 'logo'] },
      ],
      order: [['round', 'ASC'], ['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: { games },
    });
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar jogo por ID
const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
        { 
          model: Team, 
          as: 'homeTeam', 
          attributes: ['id', 'name', 'color', 'logo'],
          include: [
            { 
              model: Player, 
              as: 'players', 
              attributes: ['id', 'name', 'number', 'position'] 
            }
          ]
        },
        { 
          model: Team, 
          as: 'awayTeam', 
          attributes: ['id', 'name', 'color', 'logo'],
          include: [
            { 
              model: Player, 
              as: 'players', 
              attributes: ['id', 'name', 'number', 'position'] 
            }
          ]
        },
        {
          model: Goal,
          as: 'goals',
          include: [
            { model: Player, as: 'player', attributes: ['id', 'name', 'number'] },
            { model: Player, as: 'assistPlayer', attributes: ['id', 'name', 'number'] },
          ],
          order: [['minute', 'ASC']],
        },
      ],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    res.json({
      success: true,
      data: { game },
    });
  } catch (error) {
    console.error('Erro ao buscar jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Atualizar jogo
const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    await game.update(updateData);

    const updatedGame = await Game.findByPk(game.id, {
      include: [
  { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color', 'logo'] },
  { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color', 'logo'] },
      ],
    });

    res.json({
      success: true,
      message: 'Jogo atualizado com sucesso',
      data: { game: updatedGame },
    });
  } catch (error) {
    console.error('Erro ao atualizar jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

const saveGameState = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { type, data, updatedAt } = req.body;

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    const notesObject = parseGameNotes(game.notes);
    if (!notesObject.states) {
      notesObject.states = {};
    }

    notesObject.states[type] = {
      data,
      updatedAt: updatedAt || new Date().toISOString(),
      savedBy: userId,
    };

    await game.update({ notes: serializeGameNotes(notesObject) });

    res.json({
      success: true,
      message: 'Estado salvo com sucesso',
      data: {
        type,
        updatedAt: notesObject.states[type].updatedAt,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar estado do jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao salvar estado do jogo',
    });
  }
};

const getGameState = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const type = req.query.type ? String(req.query.type) : 'chess-state';

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    const notesObject = parseGameNotes(game.notes);
    const storedState = notesObject.states?.[type];

    if (!storedState) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum estado salvo para este jogo',
      });
    }

    res.json({
      success: true,
      data: storedState.data,
      meta: {
        type,
        updatedAt: storedState.updatedAt,
        savedBy: storedState.savedBy,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estado do jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar estado do jogo',
    });
  }
};

// Finalizar jogo
const finishGame = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
        { model: Team, as: 'homeTeam' },
        { model: Team, as: 'awayTeam' },
        { model: Goal, as: 'goals' },
      ],
    });

    if (!game) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    if (!game.homeTeam || !game.awayTeam) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Defina os times do confronto antes de finalizar a partida',
      });
    }

    if (game.status === 'finished') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Jogo já foi finalizado',
      });
    }

    // Contar gols
    const homeGoals = game.goals.filter(goal => goal.teamId === game.homeTeamId).length;
    const awayGoals = game.goals.filter(goal => goal.teamId === game.awayTeamId).length;

    // Coletar jogadores que participaram (marcar gol, assistência ou levar cartão)
    const homePlayersInGame = new Set();
    const awayPlayersInGame = new Set();

    game.goals.forEach(goal => {
      if (goal.teamId === game.homeTeamId) {
        if (goal.playerId) homePlayersInGame.add(goal.playerId);
        if (goal.assistPlayerId) homePlayersInGame.add(goal.assistPlayerId);
      } else if (goal.teamId === game.awayTeamId) {
        if (goal.playerId) awayPlayersInGame.add(goal.playerId);
        if (goal.assistPlayerId) awayPlayersInGame.add(goal.assistPlayerId);
      }
    });

    // Atualizar jogo
    await game.update({
      status: 'finished',
      homeScore: homeGoals,
      awayScore: awayGoals,
      finishedAt: new Date(),
      homeLineup: Array.from(homePlayersInGame),
      awayLineup: Array.from(awayPlayersInGame),
    }, { transaction });

    // Atualizar gamesPlayed dos jogadores que participaram
    for (const playerId of homePlayersInGame) {
      const player = await Player.findByPk(playerId, { transaction });
      if (player) {
        await player.update({
          gamesPlayed: player.gamesPlayed + 1,
          wins: homeGoals > awayGoals ? player.wins + 1 : player.wins,
        }, { transaction });
      }
    }

    for (const playerId of awayPlayersInGame) {
      const player = await Player.findByPk(playerId, { transaction });
      if (player) {
        await player.update({
          gamesPlayed: player.gamesPlayed + 1,
          wins: awayGoals > homeGoals ? player.wins + 1 : player.wins,
        }, { transaction });
      }
    }

    // Atualizar estatísticas dos times
    let homeTeamUpdate = {
      gamesPlayed: game.homeTeam.gamesPlayed + 1,
      goalsFor: game.homeTeam.goalsFor + homeGoals,
      goalsAgainst: game.homeTeam.goalsAgainst + awayGoals,
    };

    let awayTeamUpdate = {
      gamesPlayed: game.awayTeam.gamesPlayed + 1,
      goalsFor: game.awayTeam.goalsFor + awayGoals,
      goalsAgainst: game.awayTeam.goalsAgainst + homeGoals,
    };

    // Determinar resultado e pontos
    if (homeGoals > awayGoals) {
      // Vitória do time da casa
      homeTeamUpdate.wins = game.homeTeam.wins + 1;
      homeTeamUpdate.points = game.homeTeam.points + 3;
      awayTeamUpdate.losses = game.awayTeam.losses + 1;
    } else if (awayGoals > homeGoals) {
      // Vitória do time visitante
      awayTeamUpdate.wins = game.awayTeam.wins + 1;
      awayTeamUpdate.points = game.awayTeam.points + 3;
      homeTeamUpdate.losses = game.homeTeam.losses + 1;
    } else {
      // Empate
      homeTeamUpdate.draws = game.homeTeam.draws + 1;
      homeTeamUpdate.points = game.homeTeam.points + 1;
      awayTeamUpdate.draws = game.awayTeam.draws + 1;
      awayTeamUpdate.points = game.awayTeam.points + 1;
    }

  await game.homeTeam.update(homeTeamUpdate, { transaction });
  await game.awayTeam.update(awayTeamUpdate, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Jogo finalizado com sucesso',
      data: { game },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao finalizar jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Deletar jogo
const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    if (game.status === 'finished') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar um jogo já finalizado',
      });
    }

    await game.destroy();

    res.json({
      success: true,
      message: 'Jogo deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Avançar vencedor para próxima fase
const advanceWinnerToNextPhase = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { winnerId } = req.body;
    const userId = req.user.id;

    console.log('🎯 [advanceWinner] Iniciando...', { gameId, winnerId, userId });

    // Buscar o jogo atual
    const currentGame = await Game.findOne({
      where: { id: gameId },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!currentGame) {
      console.log('❌ [advanceWinner] Jogo não encontrado');
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    console.log('✅ [advanceWinner] Jogo encontrado:', {
      id: currentGame.id,
      status: currentGame.status,
      round: currentGame.round,
      homeScore: currentGame.homeScore,
      awayScore: currentGame.awayScore
    });

    if (currentGame.status !== 'finalizado') {
      console.log(`❌ [advanceWinner] Jogo não está finalizado. Status atual: ${currentGame.status}`);
      return res.status(400).json({
        success: false,
        message: 'Jogo precisa estar finalizado para avançar vencedor',
      });
    }

    const currentRound = currentGame.round;
    const championshipId = currentGame.championshipId;

    console.log(`📊 [advanceWinner] Rodada atual: ${currentRound}, Campeonato: ${championshipId}`);

    // Buscar todos os jogos da rodada atual (ordenados por criação)
    const currentRoundGames = await Game.findAll({
      where: {
        championshipId,
        round: currentRound,
      },
      order: [['createdAt', 'ASC']],
    });

    console.log(`📋 [advanceWinner] Jogos na rodada ${currentRound}:`, currentRoundGames.length);

    // Encontrar índice do jogo atual
    const currentGameIndex = currentRoundGames.findIndex(g => g.id === gameId);

    if (currentGameIndex === -1) {
      console.log('❌ [advanceWinner] Erro ao localizar índice do jogo');
      return res.status(500).json({
        success: false,
        message: 'Erro ao localizar índice do jogo',
      });
    }

    console.log(`📍 [advanceWinner] Índice do jogo atual: ${currentGameIndex}`);

    // Buscar jogos da próxima rodada
    const nextRound = currentRound + 1;
    let nextRoundGames = await Game.findAll({
      where: {
        championshipId,
        round: nextRound,
      },
      order: [['createdAt', 'ASC']],
    });

    console.log(`🎮 [advanceWinner] Jogos na próxima rodada ${nextRound}:`, nextRoundGames.length);

    // Se não existem jogos na próxima rodada, criar automaticamente!
    if (nextRoundGames.length === 0) {
      console.log('🆕 [advanceWinner] Próxima rodada vazia! Criando jogos automaticamente...');
      
      // Calcular quantos jogos precisamos criar (metade da rodada atual)
      const gamesInNextRound = Math.ceil(currentRoundGames.length / 2);
      
      console.log(`🔢 [advanceWinner] Jogos na rodada atual: ${currentRoundGames.length}, próxima rodada: ${gamesInNextRound}`);
      
      // Se só tinha 1 jogo na rodada atual, era a FINAL!
      if (currentRoundGames.length === 1 || gamesInNextRound === 0) {
        // É a final e não há mais rodadas
        console.log('🏆 [advanceWinner] ERA A FINAL - CAMPEÃO DEFINIDO!');
        return res.json({
          success: true,
          message: 'Campeão definido - torneio finalizado',
          isChampion: true,
          winner: winnerId,
        });
      }
      
      console.log(`🎲 [advanceWinner] Criando ${gamesInNextRound} jogos para rodada ${nextRound}...`);
      
      // Criar jogos vazios para a próxima rodada
      const newGames = [];
      for (let i = 0; i < gamesInNextRound; i++) {
        newGames.push({
          championshipId,
          homeTeamId: null,
          awayTeamId: null,
          round: nextRound,
          status: 'agendado',
        });
      }
      
      await Game.bulkCreate(newGames);
      
      // Buscar novamente os jogos criados
      nextRoundGames = await Game.findAll({
        where: {
          championshipId,
          round: nextRound,
        },
        order: [['createdAt', 'ASC']],
      });
      
      console.log(`✅ [advanceWinner] ${nextRoundGames.length} jogos criados na rodada ${nextRound}`);
    }

    // Calcular posição na próxima rodada
    const nextGameIndex = Math.floor(currentGameIndex / 2);
    const nextGame = nextRoundGames[nextGameIndex];

    console.log(`🎯 [advanceWinner] Índice do próximo jogo: ${nextGameIndex}`);

    if (!nextGame) {
      console.log('❌ [advanceWinner] Próximo jogo não encontrado');
      return res.status(404).json({
        success: false,
        message: 'Próximo jogo não encontrado',
      });
    }

    // Determinar se vai para home ou away (jogos pares -> home, ímpares -> away)
    const isEvenGame = currentGameIndex % 2 === 0;
    const updateData = {};

    if (isEvenGame) {
      updateData.homeTeamId = winnerId;
      console.log(`⬆️ [advanceWinner] Vencedor vai para homeTeam do jogo ${nextGame.id}`);
    } else {
      updateData.awayTeamId = winnerId;
      console.log(`⬇️ [advanceWinner] Vencedor vai para awayTeam do jogo ${nextGame.id}`);
    }

    // Atualizar o próximo jogo
    await nextGame.update(updateData);
    console.log('✅ [advanceWinner] Próximo jogo atualizado com sucesso!');

    // Buscar jogo atualizado com times
    const updatedGame = await Game.findByPk(nextGame.id, {
      include: [
  { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color', 'logo'] },
  { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color', 'logo'] },
      ],
    });

    console.log('🎉 [advanceWinner] Sucesso! Vencedor avançou para próxima fase');

    res.json({
      success: true,
      message: 'Vencedor avançou para próxima fase',
      isChampion: false,
      nextGame: updatedGame,
    });
  } catch (error) {
    console.error('❌ [advanceWinner] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao avançar vencedor para próxima fase',
    });
  }
};

// Definir escalação do jogo (titulares + substitutos)
const setGameLineup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { homeLineup, awayLineup } = req.body;

    const game = await Game.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
        { model: Team, as: 'homeTeam', include: [{ model: Player, as: 'players' }] },
        { model: Team, as: 'awayTeam', include: [{ model: Player, as: 'players' }] },
      ],
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    // Validar que os jogadores pertencem aos times corretos
    const homePlayerIds = game.homeTeam.players.map(p => p.id);
    const awayPlayerIds = game.awayTeam.players.map(p => p.id);

    if (homeLineup && homeLineup.some(id => !homePlayerIds.includes(id))) {
      return res.status(400).json({
        success: false,
        message: 'Um ou mais jogadores não pertencem ao time mandante',
      });
    }

    if (awayLineup && awayLineup.some(id => !awayPlayerIds.includes(id))) {
      return res.status(400).json({
        success: false,
        message: 'Um ou mais jogadores não pertencem ao time visitante',
      });
    }

    await game.update({
      homeLineup: homeLineup || game.homeLineup,
      awayLineup: awayLineup || game.awayLineup,
    });

    res.json({
      success: true,
      message: 'Escalação definida com sucesso',
      data: {
        homeLineup: game.homeLineup,
        awayLineup: game.awayLineup,
      },
    });
  } catch (error) {
    console.error('Erro ao definir escalação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

module.exports = {
  createGame,
  getGamesByChampionship,
  getGameById,
  updateGame,
  saveGameState,
  getGameState,
  finishGame,
  deleteGame,
  advanceWinnerToNextPhase,
  setGameLineup,
};
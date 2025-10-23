const { Goal, Game, Player, Team, Championship } = require('../models');
const sequelize = require('../config/database');
const { 
  checkAchievements, 
  updatePlayerProgress, 
  calculateXPForAction 
} = require('../utils/achievementsSystem');

// Adicionar gol
const addGoal = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const gameId = req.params.id; // Pega da URL
    const { playerId, teamId, minute, type, assistPlayerId } = req.body;
    const userId = req.user.id;

    // Verificar se o jogo pertence ao usuário
    const game = await Game.findOne({
      where: { id: gameId },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!game) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Jogo não encontrado',
      });
    }

    if (game.status === 'finished') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não é possível adicionar gols em um jogo finalizado',
      });
    }

    // Verificar se o jogador pertence ao time e ao campeonato
    // Para gol contra, o jogador pertence ao time adversário (não ao teamId)
    const isOwnGoal = type === 'own_goal';
    
    // Se for gol contra, buscar jogador em qualquer time do campeonato
    // Se não for, validar que pertence ao teamId informado
    const player = await Player.findOne({
      where: { id: playerId },
      include: [
        {
          model: Team,
          as: 'team',
          where: isOwnGoal 
            ? { championshipId: game.championshipId } // Gol contra: qualquer time do campeonato
            : { id: teamId, championshipId: game.championshipId }, // Gol normal: deve ser do teamId
        },
      ],
    });

    if (!player) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado no campeonato',
      });
    }
    
    // Para gol contra, validar que o jogador é do time adversário
    if (isOwnGoal) {
      const playerTeamId = player.team.id;
      if (playerTeamId !== game.homeTeamId && playerTeamId !== game.awayTeamId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Jogador não está em nenhum dos times da partida',
        });
      }
      // Validar que o teamId é realmente o time adversário
      if (playerTeamId === teamId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Para gol contra, o time beneficiado deve ser o adversário',
        });
      }
    }

    // Verificar se o time está no jogo
    if (teamId !== game.homeTeamId && teamId !== game.awayTeamId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Time não está participando deste jogo',
      });
    }

    // Verificar jogador da assistência se fornecido (não se aplica a gol contra)
    let assistPlayer = null;
    if (assistPlayerId && !isOwnGoal) {
      assistPlayer = await Player.findOne({
        where: { id: assistPlayerId, teamId },
      });

      if (!assistPlayer) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Jogador da assistência não encontrado no time',
        });
      }
    }

    const goal = await Goal.create({
      gameId,
      playerId,
      teamId,
      minute: minute || 0,
      type: type || 'normal',
      assistPlayerId,
    }, { transaction });

    // Atualizar estatísticas do jogador que marcou
    await player.increment('goals', { transaction });

    // XP por tipo de gol
    const xpForGoal = calculateXPForAction(`goal_${type || 'normal'}`);

    // Verificar quantos gols fez NESTE jogo
    const goalsInThisGame = await Goal.count({
      where: {
        gameId: gameId,
        playerId: playerId
      },
      transaction
    });

    // Preparar stats do jogo para verificação de conquistas
    const gameStats = {
      goalsInGame: goalsInThisGame,
      assistsInGame: 0,
      gotCard: false // TODO: verificar cartões do jogo
    };

    // Atualizar estatísticas do jogador da assistência
    if (assistPlayer) {
      await assistPlayer.increment('assists', { transaction });
      
      const xpForAssist = calculateXPForAction('assist');
      await updatePlayerProgress(assistPlayerId, xpForAssist, []);
    }

    await transaction.commit();

    // Recarregar player com stats atualizadas
    const updatedPlayer = await Player.findByPk(playerId);

    // Verificar conquistas
    const newAchievements = await checkAchievements(updatedPlayer, gameStats);
    const totalXp = xpForGoal + newAchievements.reduce((sum, a) => sum + a.xp, 0);

    // Atualizar progresso
    const progressUpdate = await updatePlayerProgress(playerId, totalXp, newAchievements);

    const goalWithDetails = await Goal.findByPk(goal.id, {
      include: [
        { model: Player, as: 'player', attributes: ['id', 'name', 'number'] },
        { model: Player, as: 'assistPlayer', attributes: ['id', 'name', 'number'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'color'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Gol adicionado com sucesso',
      data: { 
        goal: goalWithDetails,
        gamification: progressUpdate ? {
          xpGained: progressUpdate.xpGained,
          levelInfo: progressUpdate.levelInfo,
          achievements: progressUpdate.newAchievements
        } : null
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao adicionar gol:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar gols do jogo
const getGoalsByGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // Verificar se o jogo pertence ao usuário
    const game = await Game.findOne({
      where: { id: gameId },
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

    const goals = await Goal.findAll({
      where: { gameId },
      include: [
        { model: Player, as: 'player', attributes: ['id', 'name', 'number'] },
        { model: Player, as: 'assistPlayer', attributes: ['id', 'name', 'number'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'color'] },
      ],
      order: [['minute', 'ASC']],
    });

    res.json({
      success: true,
      data: { goals },
    });
  } catch (error) {
    console.error('Erro ao buscar gols:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar gols do jogador
const getGoalsByPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const userId = req.user.id;

    // Verificar se o jogador pertence ao usuário
    const player = await Player.findOne({
      where: { id: playerId },
      include: [
        {
          model: Team,
          as: 'team',
          include: [
            {
              model: Championship,
              as: 'championship',
              where: { createdBy: userId },
            },
          ],
        },
      ],
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Jogador não encontrado',
      });
    }

    const goals = await Goal.findAll({
      where: { playerId },
      include: [
        { 
          model: Game, 
          as: 'game',
          include: [
            { model: Team, as: 'homeTeam', attributes: ['id', 'name'] },
            { model: Team, as: 'awayTeam', attributes: ['id', 'name'] },
          ],
        },
        { model: Player, as: 'assistPlayer', attributes: ['id', 'name', 'number'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'color'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { goals },
    });
  } catch (error) {
    console.error('Erro ao buscar gols do jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Atualizar gol
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const goal = await Goal.findOne({
      where: { id },
      include: [
        {
          model: Game,
          as: 'game',
          include: [
            {
              model: Championship,
              as: 'championship',
              where: { createdBy: userId },
            },
          ],
        },
      ],
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Gol não encontrado',
      });
    }

    if (goal.game.status === 'finished') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar gols de um jogo finalizado',
      });
    }

    await goal.update(updateData);

    const updatedGoal = await Goal.findByPk(goal.id, {
      include: [
        { model: Player, as: 'player', attributes: ['id', 'name', 'number'] },
        { model: Player, as: 'assistPlayer', attributes: ['id', 'name', 'number'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'color'] },
      ],
    });

    res.json({
      success: true,
      message: 'Gol atualizado com sucesso',
      data: { goal: updatedGoal },
    });
  } catch (error) {
    console.error('Erro ao atualizar gol:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Deletar gol
const deleteGoal = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await Goal.findOne({
      where: { id },
      include: [
        {
          model: Game,
          as: 'game',
          include: [
            {
              model: Championship,
              as: 'championship',
              where: { createdBy: userId },
            },
          ],
        },
        { model: Player, as: 'player' },
        { model: Player, as: 'assistPlayer' },
      ],
    });

    if (!goal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Gol não encontrado',
      });
    }

    if (goal.game.status === 'finished') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar gols de um jogo finalizado',
      });
    }

    // Reverter estatísticas do jogador
    await goal.player.update({
      goals: Math.max(0, goal.player.goals - 1),
      xp: Math.max(0, goal.player.xp - 10),
    }, { transaction });

    // Reverter estatísticas do jogador da assistência
    if (goal.assistPlayer) {
      await goal.assistPlayer.update({
        assists: Math.max(0, goal.assistPlayer.assists - 1),
        xp: Math.max(0, goal.assistPlayer.xp - 5),
      }, { transaction });
    }

    await goal.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Gol deletado com sucesso',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao deletar gol:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

module.exports = {
  addGoal,
  getGoalsByGame,
  getGoalsByPlayer,
  updateGoal,
  deleteGoal,
};
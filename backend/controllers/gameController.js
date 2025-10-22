const { Game, Championship, Team, Player, Goal } = require('../models');
const { sequelize } = require('../config/database');

// Criar novo jogo
const createGame = async (req, res) => {
  try {
    const { championshipId, homeTeamId, awayTeamId, round, venue, scheduledAt } = req.body;
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
    const homeTeam = await Team.findOne({
      where: { id: homeTeamId, championshipId },
    });

    const awayTeam = await Team.findOne({
      where: { id: awayTeamId, championshipId },
    });

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({
        success: false,
        message: 'Times não encontrados no campeonato',
      });
    }

    if (homeTeamId === awayTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Um time não pode jogar contra si mesmo',
      });
    }

    const game = await Game.create({
      championshipId,
      homeTeamId,
      awayTeamId,
      round: round || 1,
      venue,
      scheduledAt,
      // Não enviar status, o modelo usa 'agendado' como padrão
    });

    const gameWithTeams = await Game.findByPk(game.id, {
      include: [
        { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color'] },
        { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color'] },
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
        { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color'] },
        { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color'] },
      ],
      order: [['round', 'ASC'], ['scheduledAt', 'ASC']],
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
          attributes: ['id', 'name', 'color'],
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
          attributes: ['id', 'name', 'color'],
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
        { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color'] },
        { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color'] },
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

    // Atualizar jogo
    await game.update({
      status: 'finished',
      homeScore: homeGoals,
      awayScore: awayGoals,
      finishedAt: new Date(),
    }, { transaction });

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

module.exports = {
  createGame,
  getGamesByChampionship,
  getGameById,
  updateGame,
  finishGame,
  deleteGame,
};
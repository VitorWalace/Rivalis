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
      status: 'scheduled',
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
        { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'color'] },
        { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'color'] },
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

// Atualizar status do jogo
const updateGameStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validar status
    const validStatuses = ['scheduled', 'live', 'paused', 'finished', 'cancelled', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido',
      });
    }

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

    // Lógica de transição de status
    const updateData = { status };
    
    // Quando o jogo começa
    if (status === 'live' && game.status !== 'live') {
      updateData.startTime = new Date();
    }
    
    // Quando o jogo termina
    if (status === 'finished' && game.status !== 'finished') {
      updateData.endTime = new Date();
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
      message: 'Status do jogo atualizado com sucesso',
      data: { game: updatedGame },
    });
  } catch (error) {
    console.error('Erro ao atualizar status do jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Gerar rodada automaticamente
const generateRound = async (req, res) => {
  try {
    const { championshipId } = req.params;
    const userId = req.user.id;

    console.log('🎯 Iniciando geração de rodada para campeonato:', championshipId, 'usuário:', userId);

    // Buscar campeonato com times e jogos existentes
    let championship;
    try {
      championship = await Championship.findOne({
        where: { id: championshipId },
        include: [
          {
            model: Team,
            as: 'teams',
            required: false
          },
          {
            model: Game,
            as: 'games',
            required: false
          }
        ]
      });
    } catch (error) {
      console.error('❌ Erro ao buscar campeonato:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar campeonato no banco de dados',
      });
    }

    if (!championship) {
      console.log('❌ Campeonato não encontrado:', championshipId);
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    // Verificar se o usuário tem permissão (se createdBy existir)
    if (championship.createdBy && championship.createdBy !== userId) {
      console.log('❌ Usuário sem permissão:', userId, 'vs', championship.createdBy);
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para gerenciar este campeonato',
      });
    }

    console.log('✅ Campeonato encontrado:', championship.name);
    console.log('✅ Times no campeonato:', championship.teams?.length || 0);
    console.log('✅ Jogos existentes:', championship.games?.length || 0);

    const teams = championship.teams || [];
    const existingGames = championship.games || [];
    
    if (teams.length < 2) {
      console.log('❌ Times insuficientes:', teams.length);
      return res.status(400).json({
        success: false,
        message: 'É necessário pelo menos 2 times para gerar uma rodada',
      });
    }

    // Determinar próxima rodada
    const lastRound = existingGames.length > 0 
      ? Math.max(...existingGames.map(game => game.round || 1))
      : 0;
    const nextRound = lastRound + 1;

    console.log('📅 Próxima rodada:', nextRound);

    // Algoritmo simples para gerar confrontos
    const newGames = [];
    const numTeams = teams.length;
    
    // Se número par de times, todos jogam
    if (numTeams % 2 === 0) {
      for (let i = 0; i < numTeams / 2; i++) {
        const homeTeam = teams[i];
        const awayTeam = teams[numTeams - 1 - i];
        
        // Verificar se já existe esse confronto
        const existingMatch = existingGames.find(game => 
          (game.homeTeamId === homeTeam.id && game.awayTeamId === awayTeam.id) ||
          (game.homeTeamId === awayTeam.id && game.awayTeamId === homeTeam.id)
        );

        if (!existingMatch) {
          newGames.push({
            championshipId: championshipId,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            round: nextRound,
            status: 'pending',
            homeScore: 0,
            awayScore: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    } else {
      // Número ímpar - um time fica de fora
      for (let i = 0; i < Math.floor(numTeams / 2); i++) {
        const homeTeam = teams[i];
        const awayTeam = teams[numTeams - 2 - i];
        
        const existingMatch = existingGames.find(game => 
          (game.homeTeamId === homeTeam.id && game.awayTeamId === awayTeam.id) ||
          (game.homeTeamId === awayTeam.id && game.awayTeamId === homeTeam.id)
        );

        if (!existingMatch) {
          newGames.push({
            championshipId: championshipId,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            round: nextRound,
            status: 'pending',
            homeScore: 0,
            awayScore: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (newGames.length === 0) {
      console.log('⚠️ Nenhum novo jogo para criar');
      return res.status(400).json({
        success: false,
        message: 'Todos os confrontos possíveis já foram criados para esta rodada',
      });
    }

    console.log('🎮 Criando', newGames.length, 'novos jogos');

    // Criar jogos um por um para evitar problemas
    const createdGames = [];
    for (const gameData of newGames) {
      try {
        const game = await Game.create(gameData);
        createdGames.push(game);
        console.log('✅ Jogo criado:', game.id);
      } catch (error) {
        console.error('❌ Erro ao criar jogo:', error.message);
        // Continuar criando outros jogos mesmo se um falhar
      }
    }

    if (createdGames.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar jogos',
      });
    }

    // Buscar jogos criados com informações dos times
    const gamesWithTeams = [];
    for (const game of createdGames) {
      try {
        const gameWithTeams = await Game.findByPk(game.id, {
          include: [
            {
              model: Team,
              as: 'homeTeam',
              attributes: ['id', 'name'],
              required: false
            },
            {
              model: Team,
              as: 'awayTeam',
              attributes: ['id', 'name'],
              required: false
            },
          ],
        });
        
        if (gameWithTeams) {
          gamesWithTeams.push(gameWithTeams);
        } else {
          // Se não conseguir buscar com teams, adicionar sem eles
          gamesWithTeams.push(game);
        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar jogo com times:', error.message);
        gamesWithTeams.push(game);
      }
    }

    console.log('🎉 Rodada', nextRound, 'gerada com sucesso!', gamesWithTeams.length, 'jogos criados');

    res.status(201).json({
      success: true,
      message: `Rodada ${nextRound} gerada com sucesso`,
      data: {
        round: nextRound,
        games: gamesWithTeams,
        totalGames: gamesWithTeams.length,
      },
    });

  } catch (error) {
    console.error('❌ Erro geral ao gerar rodada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createGame,
  getGamesByChampionship,
  getGameById,
  updateGame,
  updateGameStatus,
  finishGame,
  deleteGame,
  generateRound,
};
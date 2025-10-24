const { Championship, Team, Player, Game, Goal, User } = require('../models');
const { Op } = require('sequelize');

// Mapear valores do frontend (inglês) para backend (português)
const mapFrontendToBackend = (data) => {
  const mapped = { ...data };
  
  // Mapear sport (apenas futsal e xadrez)
  const sportMap = {
    'futsal': 'futsal',
    'chess': 'xadrez',
  };
  
  if (mapped.sport && sportMap[mapped.sport]) {
    mapped.sport = sportMap[mapped.sport];
  }
  
  // Mapear format (aceita tanto inglês quanto português)
  const formatMap = {
    'league': 'pontos-corridos',
    'knockout': 'eliminatorias',
    'group_knockout': 'grupos',
    // Aceitar valores já em português (passthrough)
    'pontos-corridos': 'pontos-corridos',
    'eliminatorias': 'eliminatorias',
    'grupos': 'grupos',
  };
  
  if (mapped.format && formatMap[mapped.format]) {
    mapped.format = formatMap[mapped.format];
  }
  
  // Mapear status (se fornecido)
  const statusMap = {
    'draft': 'rascunho',
    'active': 'ativo',
    'finished': 'finalizado',
  };
  
  if (mapped.status && statusMap[mapped.status]) {
    mapped.status = statusMap[mapped.status];
  }
  
  return mapped;
};

// Listar campeonatos do usuário
const getUserChampionships = async (req, res) => {
  try {
    const userId = req.user.id;

    const championships = await Championship.findAll({
      where: { createdBy: userId },
      include: [
        {
          model: Team,
          as: 'teams',
          include: [
            {
              model: Player,
              as: 'players',
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { championships },
    });
  } catch (error) {
    console.error('Erro ao buscar campeonatos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Criar novo campeonato
const createChampionship = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, sport, format, description, location, startDate, endDate, maxTeams } = req.body;

    // Mapear valores do frontend para backend
    const mappedData = mapFrontendToBackend({ sport, format });

    const championship = await Championship.create({
      name,
      sport: mappedData.sport,
      format: mappedData.format,
      description,
      location,
      startDate,
      endDate,
      maxTeams,
      // Começa ativo por padrão
      status: 'ativo',
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Campeonato criado com sucesso',
      data: { championship },
    });
  } catch (error) {
    console.error('Erro ao criar campeonato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar campeonato por ID
const getChampionshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const championship = await Championship.findOne({
      where: { 
        id,
        createdBy: userId,
      },
      include: [
        {
          model: Team,
          as: 'teams',
          include: [
            {
              model: Player,
              as: 'players',
            },
          ],
        },
        {
          model: Game,
          as: 'games',
          include: [
            { model: Team, as: 'homeTeam' },
            { model: Team, as: 'awayTeam' },
            {
              model: Goal,
              as: 'goals',
              include: [
                { model: Player, as: 'player' },
                { model: Player, as: 'assistPlayer' },
              ],
            },
          ],
        },
      ],
    });

    if (!championship) {
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    res.json({
      success: true,
      data: { championship },
    });
  } catch (error) {
    console.error('Erro ao buscar campeonato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Atualizar campeonato
const updateChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const championship = await Championship.findOne({
      where: { id, createdBy: userId },
    });

    if (!championship) {
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    // Mapear valores do frontend para backend
    const mappedData = mapFrontendToBackend(updateData);

    await championship.update(mappedData);

    res.json({
      success: true,
      message: 'Campeonato atualizado com sucesso',
      data: { championship },
    });
  } catch (error) {
    console.error('Erro ao atualizar campeonato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Deletar campeonato
const deleteChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const championship = await Championship.findOne({
      where: { id, createdBy: userId },
    });

    if (!championship) {
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    await championship.destroy();

    res.json({
      success: true,
      message: 'Campeonato deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar campeonato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Gerar jogos automaticamente
const generateGames = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const championship = await Championship.findOne({
      where: { id, createdBy: userId },
      include: [{ model: Team, as: 'teams' }],
    });

    if (!championship) {
      return res.status(404).json({
        success: false,
        message: 'Campeonato não encontrado',
      });
    }

    const teams = championship.teams;
    
    if (teams.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'É necessário pelo menos 2 times para gerar jogos',
      });
    }

    // Verificar se já existem jogos
    const existingGames = await Game.count({
      where: { championshipId: id },
    });

    if (existingGames > 0) {
      return res.status(400).json({
        success: false,
        message: 'Jogos já foram gerados para este campeonato',
      });
    }

    // Gerar jogos baseado no formato do campeonato
    const games = [];
    let totalRounds;

    if (championship.format === 'eliminatorias') {
      // MATA-MATA: Gerar TODAS as rodadas do bracket de uma vez
      console.log(`🏆 Gerando bracket de eliminatórias para ${teams.length} times`);
      
      const numTeams = teams.length;
      const totalBracketRounds = Math.ceil(Math.log2(numTeams));
      totalRounds = totalBracketRounds;
      
      console.log(`📊 Total de rodadas no bracket: ${totalRounds}`);
      
      // RODADA 1: Primeira fase com todos os times
      const teamsInFirstRound = numTeams;
      const gamesInFirstRound = Math.ceil(teamsInFirstRound / 2);
      
      console.log(`🎮 Rodada 1: ${gamesInFirstRound} jogos com ${teamsInFirstRound} times`);
      
      for (let i = 0; i < teamsInFirstRound; i += 2) {
        const homeTeam = teams[i];
        const awayTeam = teams[i + 1];
        
        games.push({
          championshipId: id,
          homeTeamId: homeTeam?.id || null,
          awayTeamId: awayTeam?.id || null,
          round: 1,
          status: homeTeam && awayTeam ? 'agendado' : 'agendado',
        });
      }
      
      // RODADAS SEGUINTES: Criar jogos vazios para semis, final, etc.
      let gamesInCurrentRound = gamesInFirstRound;
      
      for (let round = 2; round <= totalRounds; round++) {
        const gamesInNextRound = Math.ceil(gamesInCurrentRound / 2);
        console.log(`🎮 Rodada ${round}: ${gamesInNextRound} jogos (vazios, serão preenchidos)`);
        
        for (let i = 0; i < gamesInNextRound; i++) {
          games.push({
            championshipId: id,
            homeTeamId: null,  // Será preenchido quando vencedor avançar
            awayTeamId: null,  // Será preenchido quando vencedor avançar
            round: round,
            status: 'agendado',
          });
        }
        
        gamesInCurrentRound = gamesInNextRound;
      }
      
      console.log(`✅ Total de jogos criados: ${games.length}`);
      
    } else {
      // PONTOS CORRIDOS: Todos contra todos
      let round = 1;

      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          games.push({
            championshipId: id,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            round: round,
          });
        }
      }

      totalRounds = teams.length - 1;
    }
    
    await Game.bulkCreate(games);
    await championship.update({ 
      totalRounds,
      status: 'ativo',
    });

    res.json({
      success: true,
      message: `${games.length} jogos gerados com sucesso`,
      data: { 
        gamesCount: games.length,
        totalRounds,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar jogos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

module.exports = {
  getUserChampionships,
  // novos endpoints públicos
  getAllChampionships: async (req, res) => {
    try {
      const userId = req.user.id;
      const championships = await Championship.findAll({
        include: [
          { model: Team, as: 'teams', include: [{ model: Player, as: 'players' }] },
          { model: Game, as: 'games' },
          { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      const data = championships.map((c) => {
        const obj = c.toJSON();
        return { ...obj, isOwner: obj.createdBy === userId };
      });

      res.json({ success: true, data: { championships: data } });
    } catch (error) {
      console.error('Erro ao buscar todos campeonatos:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  },
  getAnyChampionshipById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const championship = await Championship.findOne({
        where: { id },
        include: [
          { model: Team, as: 'teams', include: [{ model: Player, as: 'players' }] },
          {
            model: Game,
            as: 'games',
            include: [
              { model: Team, as: 'homeTeam' },
              { model: Team, as: 'awayTeam' },
              { model: Goal, as: 'goals', include: [{ model: Player, as: 'player' }, { model: Player, as: 'assistPlayer' }] },
            ],
          },
          { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        ],
      });

      if (!championship) {
        return res.status(404).json({ success: false, message: 'Campeonato não encontrado' });
      }

      const obj = championship.toJSON();
      res.json({ success: true, data: { championship: { ...obj, isOwner: obj.createdBy === userId } } });
    } catch (error) {
      console.error('Erro ao buscar campeonato público por ID:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  },
  createChampionship,
  getChampionshipById,
  updateChampionship,
  deleteChampionship,
  generateGames,
};
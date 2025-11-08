const { Team, Player, Championship } = require('../models');

// Criar novo time
const createTeam = async (req, res) => {
  try {
  const { championshipId, name, color, logo, players } = req.body;
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

    // Verificar se já existe um time com o mesmo nome no campeonato
    const existingTeam = await Team.findOne({
      where: { championshipId, name },
    });

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um time com este nome no campeonato',
      });
    }

    const transaction = await Team.sequelize.transaction();

    try {
      const team = await Team.create(
        {
          championshipId,
          name,
          color,
          logo,
        },
        { transaction }
      );

      let createdPlayers = [];
      if (Array.isArray(players) && players.length > 0) {
        const payload = players
          .filter((player) => player && typeof player.name === 'string' && player.name.trim().length >= 2)
          .map((player) => {
            const trimmedName = player.name.trim();
            const normalizedNumber = Number.isFinite(Number(player.number))
              ? Number(player.number)
              : null;

            return {
              teamId: team.id,
              name: trimmedName,
              number: normalizedNumber,
              position: typeof player.position === 'string' ? player.position : null,
            };
          });

        if (payload.length > 0) {
          createdPlayers = await Player.bulkCreate(payload, {
            transaction,
            returning: true,
          });
        }
      }

      await transaction.commit();

      const teamWithPlayers = await Team.findOne({
        where: { id: team.id },
        include: [
          {
            model: Player,
            as: 'players',
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Time criado com sucesso',
        data: { team: teamWithPlayers || { ...team.toJSON(), players: createdPlayers } },
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Erro ao criar time:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Erro interno do servidor',
      details: error?.errors?.[0]?.message,
    });
  }
};

// Buscar times do campeonato
const getTeamsByChampionship = async (req, res) => {
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

    const teams = await Team.findAll({
      where: { championshipId },
      include: [
        {
          model: Player,
          as: 'players',
        },
      ],
      order: [['points', 'DESC'], ['goalsFor', 'DESC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error('Erro ao buscar times:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Erro interno do servidor',
      details: error?.errors?.[0]?.message,
    });
  }
};

// Buscar time por ID
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await Team.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
        {
          model: Player,
          as: 'players',
        },
      ],
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Time não encontrado',
      });
    }

    res.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error('Erro ao buscar time:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Erro interno do servidor',
      details: error?.errors?.[0]?.message,
    });
  }
};

// Atualizar time
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, logo, color, players } = req.body;

    const team = await Team.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
        {
          model: Player,
          as: 'players',
        },
      ],
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Time não encontrado',
      });
    }

    // Atualizar dados básicos do time
    await team.update({ name, logo, color });

    // Se houver jogadores, atualizar
    if (players && Array.isArray(players)) {
      // Deletar jogadores antigos
      await Player.destroy({ where: { teamId: id } });

      // Criar novos jogadores
      const newPlayers = await Player.bulkCreate(
        players.map(p => ({
          ...p,
          teamId: id,
        }))
      );

      team.players = newPlayers;
    }

    // Buscar o time atualizado com os jogadores
    const updatedTeam = await Team.findOne({
      where: { id },
      include: [
        {
          model: Player,
          as: 'players',
        },
      ],
    });

    res.json({
      success: true,
      message: 'Time atualizado com sucesso',
      data: { team: updatedTeam },
    });
  } catch (error) {
    console.error('Erro ao atualizar time:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Erro interno do servidor',
      details: error?.errors?.[0]?.message,
    });
  }
};

// Deletar time
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await Team.findOne({
      where: { id },
      include: [
        {
          model: Championship,
          as: 'championship',
          where: { createdBy: userId },
        },
      ],
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Time não encontrado',
      });
    }

    await team.destroy();

    res.json({
      success: true,
      message: 'Time deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar time:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Erro interno do servidor',
      details: error?.errors?.[0]?.message,
    });
  }
};

module.exports = {
  createTeam,
  getTeamsByChampionship,
  getTeamById,
  updateTeam,
  deleteTeam,
};
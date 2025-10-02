const { Player, Team, Championship } = require('../models');

// Criar novo jogador
const createPlayer = async (req, res) => {
  try {
    const { teamId, name, position, number } = req.body;
    const userId = req.user.id;

    // Verificar se o time pertence a um campeonato do usuário
    const team = await Team.findOne({
      where: { id: teamId },
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

    // Verificar se o número já está sendo usado no time
    if (number) {
      const existingPlayer = await Player.findOne({
        where: { teamId, number },
      });

      if (existingPlayer) {
        return res.status(409).json({
          success: false,
          message: 'Este número já está sendo usado por outro jogador',
        });
      }
    }

    const player = await Player.create({
      teamId,
      name,
      position,
      number,
    });

    res.status(201).json({
      success: true,
      message: 'Jogador criado com sucesso',
      data: { player },
    });
  } catch (error) {
    console.error('Erro ao criar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar jogadores do time
const getPlayersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Verificar se o time pertence ao usuário
    const team = await Team.findOne({
      where: { id: teamId },
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

    const players = await Player.findAll({
      where: { teamId },
      order: [['number', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: { players },
    });
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar todos os jogadores do campeonato
const getPlayersByChampionship = async (req, res) => {
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

    const players = await Player.findAll({
      include: [
        {
          model: Team,
          as: 'team',
          where: { championshipId },
          attributes: ['id', 'name', 'color'],
        },
      ],
      order: [['xp', 'DESC'], ['goals', 'DESC'], ['assists', 'DESC']],
    });

    res.json({
      success: true,
      data: { players },
    });
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Buscar jogador por ID
const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const player = await Player.findOne({
      where: { id },
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

    res.json({
      success: true,
      data: { player },
    });
  } catch (error) {
    console.error('Erro ao buscar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Atualizar jogador
const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const player = await Player.findOne({
      where: { id },
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

    // Verificar conflito de número se estiver sendo alterado
    if (updateData.number && updateData.number !== player.number) {
      const existingPlayer = await Player.findOne({
        where: { 
          teamId: player.teamId, 
          number: updateData.number,
          id: { [Player.sequelize.Op.ne]: id },
        },
      });

      if (existingPlayer) {
        return res.status(409).json({
          success: false,
          message: 'Este número já está sendo usado por outro jogador',
        });
      }
    }

    await player.update(updateData);

    res.json({
      success: true,
      message: 'Jogador atualizado com sucesso',
      data: { player },
    });
  } catch (error) {
    console.error('Erro ao atualizar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Deletar jogador
const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const player = await Player.findOne({
      where: { id },
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

    await player.destroy();

    res.json({
      success: true,
      message: 'Jogador deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar jogador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

module.exports = {
  createPlayer,
  getPlayersByTeam,
  getPlayersByChampionship,
  getPlayerById,
  updatePlayer,
  deletePlayer,
};
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  minute: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 120,
    },
  },
  type: {
    type: DataTypes.ENUM('normal', 'penalti', 'contra', 'falta'),
    allowNull: false,
    defaultValue: 'normal',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'goals',
  timestamps: true,
});

// Definir associações
Goal.associate = (models) => {
  // Um gol pertence a um jogo
  Goal.belongsTo(models.Game, {
    foreignKey: 'gameId',
    as: 'game',
  });

  // Um gol é marcado por um jogador
  Goal.belongsTo(models.Player, {
    foreignKey: 'playerId',
    as: 'player',
  });

  // Um gol pode ter uma assistência de outro jogador
  Goal.belongsTo(models.Player, {
    foreignKey: 'assistPlayerId',
    as: 'assistPlayer',
  });

  // Um gol é marcado a favor de um time
  Goal.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team',
  });
};

module.exports = Goal;
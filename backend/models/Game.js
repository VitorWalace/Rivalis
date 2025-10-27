const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  round: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('agendado', 'ao-vivo', 'finalizado', 'cancelado'),
    allowNull: false,
    defaultValue: 'agendado',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  venue: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Resultado
  homeScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  awayScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  // Controle do jogo
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'games',
  timestamps: true,
});

// Definir associações
Game.associate = (models) => {
  // Um jogo pertence a um campeonato
  Game.belongsTo(models.Championship, {
    foreignKey: 'championshipId',
    as: 'championship',
  });

  // Um jogo tem um time mandante
  Game.belongsTo(models.Team, {
    foreignKey: 'homeTeamId',
    as: 'homeTeam',
  });

  // Um jogo tem um time visitante
  Game.belongsTo(models.Team, {
    foreignKey: 'awayTeamId',
    as: 'awayTeam',
  });

  // Um jogo tem muitos gols
  Game.hasMany(models.Goal, {
    foreignKey: 'gameId',
    as: 'goals',
    onDelete: 'CASCADE',
  });
};

module.exports = Game;
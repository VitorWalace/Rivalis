const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Championship = sequelize.define('Championship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  sport: {
    type: DataTypes.ENUM('futsal', 'xadrez'),
    allowNull: false,
    defaultValue: 'futsal',
  },
  format: {
    type: DataTypes.ENUM('pontos-corridos', 'eliminatorias', 'grupos'),
    allowNull: false,
    defaultValue: 'pontos-corridos',
  },
  status: {
    type: DataTypes.ENUM('rascunho', 'ativo', 'finalizado', 'cancelado'),
    allowNull: false,
    defaultValue: 'ativo',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  maxTeams: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2,
      max: 32,
    },
  },
  currentRound: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  totalRounds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'championships',
  timestamps: true,
});

// Definir associações
Championship.associate = (models) => {
  // Um campeonato pertence a um usuário (criador)
  Championship.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator',
  });

  // Um campeonato tem muitos times
  Championship.hasMany(models.Team, {
    foreignKey: 'championshipId',
    as: 'teams',
    onDelete: 'CASCADE',
  });

  // Um campeonato tem muitos jogos
  Championship.hasMany(models.Game, {
    foreignKey: 'championshipId',
    as: 'games',
    onDelete: 'CASCADE',
  });
};

module.exports = Championship;
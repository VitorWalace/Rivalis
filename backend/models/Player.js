const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Player = sequelize.define('Player', {
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
  position: {
    type: DataTypes.ENUM('goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante'),
    allowNull: true,
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 99,
    },
  },
  // Estatísticas do jogador
  goals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  assists: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  yellowCards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  redCards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Sistema de XP
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  level: {
    type: DataTypes.VIRTUAL,
    get() {
      return Math.floor(this.xp / 100) + 1;
    },
  },
  // Conquistas (JSON array)
  achievements: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'players',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teamId', 'number'],
      where: {
        number: {
          [sequelize.Sequelize.Op.not]: null,
        },
      },
    },
  ],
});

// Definir associações
Player.associate = (models) => {
  // Um jogador pertence a um time
  Player.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team',
  });

  // Um jogador pode marcar gols em muitos jogos
  Player.hasMany(models.Goal, {
    foreignKey: 'playerId',
    as: 'goalsScored',
  });

  // Um jogador pode dar assistências em muitos jogos
  Player.hasMany(models.Goal, {
    foreignKey: 'assistPlayerId',
    as: 'assistsGiven',
  });
};

module.exports = Player;
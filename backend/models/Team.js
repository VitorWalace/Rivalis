const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50],
    },
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i,
    },
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Estatísticas do time
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  draws: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  goalsFor: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  goalsAgainst: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  goalDifference: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.goalsFor - this.goalsAgainst;
    },
  },
  gamesPlayed: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.wins + this.draws + this.losses;
    },
  },
}, {
  tableName: 'teams',
  timestamps: true,
});

// Definir associações
Team.associate = (models) => {
  // Um time pertence a um campeonato
  Team.belongsTo(models.Championship, {
    foreignKey: 'championshipId',
    as: 'championship',
  });

  // Um time tem muitos jogadores
  Team.hasMany(models.Player, {
    foreignKey: 'teamId',
    as: 'players',
    onDelete: 'CASCADE',
  });

  // Um time pode ser mandante em muitos jogos
  Team.hasMany(models.Game, {
    foreignKey: 'homeTeamId',
    as: 'homeGames',
  });

  // Um time pode ser visitante em muitos jogos
  Team.hasMany(models.Game, {
    foreignKey: 'awayTeamId',
    as: 'awayGames',
  });
};

module.exports = Team;
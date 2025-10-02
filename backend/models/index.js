const User = require('./User');
const Championship = require('./Championship');
const Team = require('./Team');
const Player = require('./Player');
const Game = require('./Game');
const Goal = require('./Goal');

// Criar objeto com todos os modelos
const models = {
  User,
  Championship,
  Team,
  Player,
  Game,
  Goal,
};

// Configurar associações
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
const express = require('express');
const router = express.Router();
const {
  createPlayer,
  getPlayersByTeam,
  getPlayersByChampionship,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController');
const { getPlayerStats } = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');
const { playerValidation, idValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de jogadores requerem autenticação
router.use(authMiddleware);

// Criar novo jogador
router.post('/', playerValidation, handleValidationErrors, createPlayer);

// Buscar jogadores por time
router.get('/team/:teamId', idValidation, handleValidationErrors, getPlayersByTeam);

// Buscar jogadores por campeonato
router.get('/championship/:championshipId', idValidation, handleValidationErrors, getPlayersByChampionship);

// Buscar jogador por ID
router.get('/:id', idValidation, handleValidationErrors, getPlayerById);

// Atualizar jogador
router.put('/:id', [...idValidation, ...playerValidation], handleValidationErrors, updatePlayer);

// Deletar jogador
router.delete('/:id', idValidation, handleValidationErrors, deletePlayer);

// Estatísticas do jogador
router.get('/:id/stats', idValidation, handleValidationErrors, getPlayerStats);

module.exports = router;
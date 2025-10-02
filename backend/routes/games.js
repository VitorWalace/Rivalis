const express = require('express');
const router = express.Router();
const {
  createGame,
  getGamesByChampionship,
  getGameById,
  updateGame,
  finishGame,
  deleteGame,
} = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');
const { gameValidation, idValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de jogos requerem autenticação
router.use(authMiddleware);

// Criar novo jogo
router.post('/', gameValidation, handleValidationErrors, createGame);

// Buscar jogos por campeonato
router.get('/championship/:championshipId', idValidation, handleValidationErrors, getGamesByChampionship);

// Buscar jogo por ID
router.get('/:id', idValidation, handleValidationErrors, getGameById);

// Atualizar jogo
router.put('/:id', [...idValidation, ...gameValidation], handleValidationErrors, updateGame);

// Finalizar jogo
router.post('/:id/finish', idValidation, handleValidationErrors, finishGame);

// Deletar jogo
router.delete('/:id', idValidation, handleValidationErrors, deleteGame);

module.exports = router;
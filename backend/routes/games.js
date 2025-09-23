const express = require('express');
const router = express.Router();
const {
  createGame,
  getGamesByChampionship,
  getGameById,
  updateGame,
  updateGameStatus,
  finishGame,
  deleteGame,
  generateRound,
} = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');
const { gameValidation, idValidation, championshipIdValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de jogos requerem autenticação
router.use(authMiddleware);

// Criar novo jogo
router.post('/', gameValidation, handleValidationErrors, createGame);

// Buscar jogos por campeonato
router.get('/championship/:championshipId', championshipIdValidation, handleValidationErrors, getGamesByChampionship);

// Buscar jogo por ID
router.get('/:id', idValidation, handleValidationErrors, getGameById);

// Atualizar jogo
router.put('/:id', [...idValidation, ...gameValidation], handleValidationErrors, updateGame);

// Atualizar status do jogo
router.patch('/:id/status', idValidation, handleValidationErrors, updateGameStatus);

// Finalizar jogo
router.post('/:id/finish', idValidation, handleValidationErrors, finishGame);

// Deletar jogo
router.delete('/:id', idValidation, handleValidationErrors, deleteGame);

// Gerar rodada automaticamente
router.post('/generate-round/:championshipId', championshipIdValidation, handleValidationErrors, generateRound);

// Rota alternativa (mais semântica) opcional: /championships/:id/generate-round
router.post('/championships/:championshipId/generate-round', championshipIdValidation, handleValidationErrors, generateRound);

module.exports = router;
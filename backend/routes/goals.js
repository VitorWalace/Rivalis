const express = require('express');
const router = express.Router();
const {
  addGoal,
  getGoalsByGame,
  getGoalsByPlayer,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController');
const authMiddleware = require('../middleware/auth');
const { goalValidation, idValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de gols requerem autenticação
router.use(authMiddleware);

// Adicionar novo gol
router.post('/', goalValidation, handleValidationErrors, addGoal);

// Buscar gols por jogo
router.get('/game/:gameId', idValidation, handleValidationErrors, getGoalsByGame);

// Buscar gols por jogador
router.get('/player/:playerId', idValidation, handleValidationErrors, getGoalsByPlayer);

// Atualizar gol
router.put('/:id', [...idValidation, ...goalValidation], handleValidationErrors, updateGoal);

// Deletar gol
router.delete('/:id', idValidation, handleValidationErrors, deleteGoal);

module.exports = router;
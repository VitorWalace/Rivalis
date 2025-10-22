const express = require('express');
const router = express.Router();
const {
  createChampionship,
  getUserChampionships,
  getChampionshipById,
  updateChampionship,
  deleteChampionship,
} = require('../controllers/championshipController');
const authMiddleware = require('../middleware/auth');
const { championshipValidation, championshipUpdateValidation, idValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de campeonatos requerem autenticação
router.use(authMiddleware);

// Criar novo campeonato
router.post('/', championshipValidation, handleValidationErrors, createChampionship);

// Buscar campeonatos do usuário
router.get('/', getUserChampionships);

// Buscar campeonato por ID
router.get('/:id', idValidation, handleValidationErrors, getChampionshipById);

// Atualizar campeonato
router.put('/:id', [...idValidation, ...championshipUpdateValidation], handleValidationErrors, updateChampionship);

// Deletar campeonato
router.delete('/:id', idValidation, handleValidationErrors, deleteChampionship);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createChampionship,
  getUserChampionships,
  getAllChampionships,
  getChampionshipById,
  getAnyChampionshipById,
  updateChampionship,
  deleteChampionship,
} = require('../controllers/championshipController');
const { getChampionshipStats } = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');
const { championshipValidation, championshipUpdateValidation, idValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de campeonatos requerem autenticação
router.use(authMiddleware);

// Rotas públicas (listagem sem restrição de proprietário)
router.get('/all', getAllChampionships);
router.get('/all/:id', idValidation, handleValidationErrors, getAnyChampionshipById);

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

// Estatísticas do campeonato
router.get('/:id/stats', idValidation, handleValidationErrors, getChampionshipStats);

module.exports = router;
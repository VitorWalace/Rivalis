const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeamsByChampionship,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require('../controllers/teamController');
const authMiddleware = require('../middleware/auth');
const { teamValidation, teamUpdateValidation, idValidation, championshipIdValidation, handleValidationErrors } = require('../middleware/validation');

// Todas as rotas de times requerem autenticação
router.use(authMiddleware);

// Criar novo time
router.post('/', teamValidation, handleValidationErrors, createTeam);

// Buscar times por campeonato
router.get('/championship/:championshipId', championshipIdValidation, handleValidationErrors, getTeamsByChampionship);

// Buscar time por ID
router.get('/:id', idValidation, handleValidationErrors, getTeamById);

// Atualizar time (validações opcionais)
router.put('/:id', [...idValidation, ...teamUpdateValidation], handleValidationErrors, updateTeam);

// Deletar time
router.delete('/:id', idValidation, handleValidationErrors, deleteTeam);

module.exports = router;
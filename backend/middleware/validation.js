const { body, param, validationResult } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
];

// Validações para Campeonatos (aceita inglês e português e normaliza)
const championshipValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do campeonato deve ter entre 2 e 100 caracteres'),
  body('sport')
    .customSanitizer((value) => {
      if (!value) return value;
      const map = {
        football: 'futebol', futebol: 'futebol',
        futsal: 'futsal',
        basketball: 'basquete', basquete: 'basquete',
        volleyball: 'volei', volei: 'volei'
      };
      return map[value] || value;
    })
    .isIn(['futebol','futsal','basquete','volei'])
    .withMessage('Esporte deve ser: futebol, futsal, basquete ou volei'),
  body('format')
    .customSanitizer((value) => {
      if (!value) return value;
      const map = {
        league: 'pontos-corridos', 'pontos-corridos': 'pontos-corridos', 'round-robin': 'pontos-corridos',
        knockout: 'eliminatorias', eliminatorias: 'eliminatorias',
        groups: 'grupos', group_knockout: 'grupos', grupos: 'grupos'
      };
      return map[value] || value;
    })
    .isIn(['pontos-corridos','eliminatorias','grupos'])
    .withMessage('Formato deve ser: pontos-corridos, eliminatorias ou grupos'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
];

// Validações para Times
const teamValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome do time deve ter entre 2 e 50 caracteres'),
  
  body('championshipId')
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
];

// Validações para Jogadores
const playerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do jogador deve ter entre 2 e 100 caracteres'),
  
  body('teamId')
    .isUUID()
    .withMessage('ID do time deve ser um UUID válido'),
  
  body('position')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Posição deve ter no máximo 50 caracteres'),
  
  body('number')
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage('Número da camisa deve ser entre 1 e 999'),
];

// Validações para Jogos
const gameValidation = [
  body('championshipId')
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),
  
  body('homeTeamId')
    .isUUID()
    .withMessage('ID do time da casa deve ser um UUID válido'),
  
  body('awayTeamId')
    .isUUID()
    .withMessage('ID do time visitante deve ser um UUID válido'),
  
  body('round')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Rodada deve ser um número positivo'),
  
  body('venue')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Local deve ter no máximo 200 caracteres'),
  
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601'),
];

// Validações para Gols
const goalValidation = [
  body('gameId')
    .isUUID()
    .withMessage('ID do jogo deve ser um UUID válido'),
  
  body('playerId')
    .isUUID()
    .withMessage('ID do jogador deve ser um UUID válido'),
  
  body('teamId')
    .isUUID()
    .withMessage('ID do time deve ser um UUID válido'),
  
  body('minute')
    .optional()
    .isInt({ min: 0, max: 200 })
    .withMessage('Minuto deve ser entre 0 e 200'),
  
  body('type')
    .optional()
    .isIn(['normal', 'penalty', 'own_goal'])
    .withMessage('Tipo de gol deve ser: normal, penalty ou own_goal'),
  
  body('assistPlayerId')
    .optional()
    .isUUID()
    .withMessage('ID do jogador da assistência deve ser um UUID válido'),
];

// Validação para parâmetros de ID
const idValidation = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
];

// Validação para parâmetros de ID em rotas específicas
const teamIdValidation = [
  param('teamId')
    .custom((value) => {
      // Aceitar UUIDs ou IDs no formato team_numero
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const teamIdRegex = /^team_\d+$/;
      
      if (uuidRegex.test(value) || teamIdRegex.test(value)) {
        return true;
      }
      
      throw new Error('ID do time deve ser um UUID válido ou no formato team_numero');
    }),
];

const championshipIdValidation = [
  param('championshipId')
    .custom((value) => {
      // Aceitar UUIDs ou IDs no formato champ_numero
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const champIdRegex = /^champ_\d+$/;
      
      if (uuidRegex.test(value) || champIdRegex.test(value)) {
        return true;
      }
      
      throw new Error('ID do campeonato deve ser um UUID válido ou no formato champ_numero');
    }),
];

const playerIdValidation = [
  param('playerId')
    .custom((value) => {
      // Aceitar UUIDs ou IDs no formato player_numero
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const playerIdRegex = /^player_\d+$/;
      
      if (uuidRegex.test(value) || playerIdRegex.test(value)) {
        return true;
      }
      
      throw new Error('ID do jogador deve ser um UUID válido ou no formato player_numero');
    }),
];

const gameIdValidation = [
  param('gameId')
    .isUUID()
    .withMessage('ID do jogo deve ser um UUID válido'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('Erros de validação:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  // Normalização adicional de status (draft/upcoming -> rascunho, active -> ativo, finished -> finalizado)
  if (req.body && req.body.status) {
    const statusMap = { draft: 'rascunho', upcoming: 'rascunho', active: 'ativo', finished: 'finalizado', rascunho: 'rascunho', ativo: 'ativo', finalizado: 'finalizado' };
    req.body.status = statusMap[req.body.status] || req.body.status;
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  championshipValidation,
  teamValidation,
  playerValidation,
  gameValidation,
  goalValidation,
  idValidation,
  teamIdValidation,
  championshipIdValidation,
  playerIdValidation,
  gameIdValidation,
  handleValidationErrors,
};
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

// Validações para Campeonatos
const championshipValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do campeonato deve ter entre 2 e 100 caracteres'),
  
  body('sport')
    .isIn(['futsal', 'chess'])
    .withMessage('Esporte deve ser: futsal ou chess'),
  
  body('format')
    .isIn(['league', 'knockout', 'group_knockout'])
    .withMessage('Formato deve ser: league, knockout ou group_knockout'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
];

// Validações para atualização de campeonato (campos opcionais)
const championshipUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do campeonato deve ter entre 2 e 100 caracteres'),
  
  body('sport')
    .optional()
    .isIn(['futsal', 'chess'])
    .withMessage('Esporte deve ser: futsal ou chess'),
  
  body('format')
    .optional()
    .custom((value) => {
      // Aceita tanto valores em inglês quanto em português
      const validFormats = [
        'league', 'knockout', 'group_knockout', // Inglês
        'pontos-corridos', 'eliminatorias', 'grupos' // Português
      ];
      return validFormats.includes(value);
    })
    .withMessage('Formato deve ser: league, knockout, group_knockout, pontos-corridos, eliminatorias ou grupos'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'finished', 'rascunho', 'ativo', 'finalizado'])
    .withMessage('Status deve ser válido'),
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

// Validação para atualização de jogos (campos opcionais)
const gameUpdateValidation = [
  body('championshipId')
    .optional()
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),
  
  body('homeTeamId')
    .optional()
    .isUUID()
    .withMessage('ID do time da casa deve ser um UUID válido'),
  
  body('awayTeamId')
    .optional()
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
    
  body('status')
    .optional()
    .isIn(['agendado', 'ao-vivo', 'finalizado'])
    .withMessage('Status deve ser: agendado, ao-vivo ou finalizado'),
    
  body('homeScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Placar da casa deve ser um número não-negativo'),
    
  body('awayScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Placar visitante deve ser um número não-negativo'),
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
    .isUUID()
    .withMessage('ID do time deve ser um UUID válido'),
];

const championshipIdValidation = [
  param('championshipId')
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),
];

const playerIdValidation = [
  param('playerId')
    .isUUID()
    .withMessage('ID do jogador deve ser um UUID válido'),
];

const gameIdValidation = [
  param('gameId')
    .isUUID()
    .withMessage('ID do jogo deve ser um UUID válido'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  championshipValidation,
  championshipUpdateValidation,
  teamValidation,
  playerValidation,
  gameValidation,
  gameUpdateValidation,
  goalValidation,
  idValidation,
  teamIdValidation,
  championshipIdValidation,
  playerIdValidation,
  gameIdValidation,
  handleValidationErrors,
};
const { body, param, validationResult } = require('express-validator');

const VALID_SPORTS = ['futsal', 'chess', 'xadrez'];
const VALID_FORMATS = [
  'league',
  'knockout',
  'group_knockout',
  'groupstageknockout',
  'group_stage_knockout',
  'group_knockout',
  'pontos-corridos',
  'eliminatorias',
  'grupos',
];
const VALID_GAME_STATUSES = ['scheduled', 'agendado', 'in-progress', 'ao-vivo', 'live', 'finished', 'finalizado', 'cancelled', 'cancelado', 'pending'];

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

const championshipValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do campeonato deve ter entre 2 e 100 caracteres'),

  body('sport')
    .notEmpty()
    .withMessage('Esporte é obrigatório')
    .custom((value) => VALID_SPORTS.includes(String(value).toLowerCase()))
    .withMessage('Esporte deve ser: futsal ou chess'),

  body('format')
    .notEmpty()
    .withMessage('Formato é obrigatório')
    .custom((value) => VALID_FORMATS.includes(String(value).toLowerCase()))
    .withMessage('Formato deve ser: league, knockout, group_knockout, pontos-corridos, eliminatorias ou grupos'),

  body('description')
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),

  body('location')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('Local deve ter no máximo 200 caracteres'),

  body('maxTeams')
    .optional({ nullable: true })
    .isInt({ min: 2, max: 128 })
    .withMessage('Número máximo de times deve estar entre 2 e 128'),
];

const championshipUpdateValidation = [
  body('name')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do campeonato deve ter entre 2 e 100 caracteres'),

  body('sport')
    .optional({ nullable: true })
    .custom((value) => VALID_SPORTS.includes(String(value).toLowerCase()))
    .withMessage('Esporte deve ser: futsal ou chess'),

  body('format')
    .optional({ nullable: true })
    .custom((value) => VALID_FORMATS.includes(String(value).toLowerCase()))
    .withMessage('Formato deve ser: league, knockout, group_knockout, pontos-corridos, eliminatorias ou grupos'),

  body('description')
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),

  body('location')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('Local deve ter no máximo 200 caracteres'),

  body('maxTeams')
    .optional({ nullable: true })
    .isInt({ min: 2, max: 128 })
    .withMessage('Número máximo de times deve estar entre 2 e 128'),
];

const teamValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome do time deve ter entre 2 e 50 caracteres'),

  body('championshipId')
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),

  body('color')
    .optional({ nullable: true })
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
];

const teamUpdateValidation = [
  body('name')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome do time deve ter entre 2 e 50 caracteres'),

  body('championshipId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),

  body('color')
    .optional({ nullable: true })
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
];

const playerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do jogador deve ter entre 2 e 100 caracteres'),

  body('teamId')
    .isUUID()
    .withMessage('ID do time deve ser um UUID válido'),

  body('position')
    .optional({ nullable: true })
    .isLength({ max: 100 })
    .withMessage('Posição deve ter no máximo 100 caracteres'),

  body('number')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 999 })
    .withMessage('Número da camisa deve ser entre 1 e 999'),
];

const gameValidation = [
  body('championshipId')
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),

  body('homeTeamId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do time da casa deve ser um UUID válido'),

  body('awayTeamId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do time visitante deve ser um UUID válido'),

  body('round')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Rodada deve ser um número positivo'),

  body('venue')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('Local deve ter no máximo 200 caracteres'),

  body('stage')
    .optional({ nullable: true })
    .isLength({ max: 120 })
    .withMessage('Fase/grupo deve ter no máximo 120 caracteres'),

  body('scheduledAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601'),
];

const gameUpdateValidation = [
  body('championshipId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do campeonato deve ser um UUID válido'),

  body('homeTeamId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do time da casa deve ser um UUID válido'),

  body('awayTeamId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do time visitante deve ser um UUID válido'),

  body('round')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Rodada deve ser um número positivo'),

  body('venue')
    .optional({ nullable: true })
    .isLength({ max: 200 })
    .withMessage('Local deve ter no máximo 200 caracteres'),

  body('stage')
    .optional({ nullable: true })
    .isLength({ max: 120 })
    .withMessage('Fase/grupo deve ter no máximo 120 caracteres'),

  body('scheduledAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601'),

  body('status')
    .optional({ nullable: true })
    .custom((value) => VALID_GAME_STATUSES.includes(String(value).toLowerCase()))
    .withMessage('Status de jogo inválido'),

  body('homeScore')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Placar da casa deve ser um número não-negativo'),

  body('awayScore')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Placar visitante deve ser um número não-negativo'),
];

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
    .optional({ nullable: true })
    .isInt({ min: 0, max: 200 })
    .withMessage('Minuto deve ser entre 0 e 200'),

  body('type')
    .optional({ nullable: true })
    .isIn(['normal', 'penalti', 'pênalti', 'penalty', 'falta', 'free_kick', 'free-kick', 'freekick', 'contra', 'own_goal', 'own-goal', 'owngoal'])
    .withMessage('Tipo de gol inválido. Aceitos: normal, (penalti|penalty), (falta|free_kick), (contra|own_goal).'),

  body('assistPlayerId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID do jogador da assistência deve ser um UUID válido'),
];

const idValidation = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
];

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

const advanceWinnerValidation = [
  body('winnerId')
    .notEmpty()
    .withMessage('ID do vencedor é obrigatório')
    .isUUID()
    .withMessage('ID do vencedor deve ser um UUID válido'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map((err) => ({
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
  teamUpdateValidation,
  playerValidation,
  gameValidation,
  gameUpdateValidation,
  goalValidation,
  idValidation,
  teamIdValidation,
  championshipIdValidation,
  playerIdValidation,
  gameIdValidation,
  advanceWinnerValidation,
  handleValidationErrors,
};
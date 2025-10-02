const express = require('express');
const {
  register,
  login,
  me,
  logout,
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Rotas protegidas
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

module.exports = router;
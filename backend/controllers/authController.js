const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Registro de usuário
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Normalizar email (evita problemas de case/collation em SQLite/MySQL)
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Usuário já cadastrado com este email',
      });
    }

    // Criar novo usuário
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
    });

    // Gerar token JWT
    if (!process.env.JWT_SECRET) {
      console.error('Configuração ausente: JWT_SECRET não definido.');
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor (JWT). Tente novamente em instantes.'
      });
    }
    const token = generateToken(user.id);

    // Atualizar último login
    await user.update({ lastLogin: new Date() });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Login de usuário
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Buscar usuário por email
    const user = await User.findOne({ where: { email: normalizedEmail } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.',
      });
    }

    // Verificar senha
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }

    // Gerar token JWT
    if (!process.env.JWT_SECRET) {
      console.error('Configuração ausente: JWT_SECRET não definido.');
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor (JWT). Tente novamente em instantes.'
      });
    }
    const token = generateToken(user.id);

    // Atualizar último login
    await user.update({ lastLogin: new Date() });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Verificar token e retornar dados do usuário
const me = async (req, res) => {
  try {
    const user = req.user; // Definido pelo middleware de autenticação

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Logout (invalidar token no frontend)
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
};

module.exports = {
  register,
  login,
  me,
  logout,
};
import express from 'express';
import cors from 'cors';
import bcryptjs from 'bcryptjs';

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());

// Base de dados temporária em memória
const users = [];

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rivalis API está funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso',
      });
    }
    
    // Hash da senha
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // Criar usuário
    const user = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    
    users.push(user);
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }
    
    // Verificar senha
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: 'fake-jwt-token-for-development',
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor temporário Rivalis rodando na porta ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Usuários registrados: ${users.length}`);
});
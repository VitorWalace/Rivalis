// Servidor simplificado para Rivalis
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middlewares básicos
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());

// Base de dados temporária em memória
const users = [];

// Health check
app.get('/health', (req, res) => {
  console.log('Health check requisitado');
  res.json({
    success: true,
    message: 'Rivalis API está funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Registro de usuário
app.post('/api/auth/register', (req, res) => {
  console.log('Tentativa de registro:', req.body);
  
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
    
    // Criar usuário (sem hash por simplicidade)
    const user = {
      id: users.length + 1,
      name,
      email,
      password, // Em produção, deve ser hasheada
      createdAt: new Date().toISOString(),
    };
    
    users.push(user);
    
    console.log('Usuário criado:', { id: user.id, name: user.name, email: user.email });
    
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
app.post('/api/auth/login', (req, res) => {
  console.log('Tentativa de login:', req.body);
  
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
      });
    }
    
    console.log('Login bem-sucedido:', { id: user.id, email: user.email });
    
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

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  console.log('Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🚀 Servidor Rivalis SIMPLIFICADO rodando!');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Health: http://localhost:${PORT}/health`);
  console.log(`👤 Usuários registrados: ${users.length}`);
  console.log('==========================================');
}).on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.log('💡 A porta 5000 já está em uso!');
    console.log('💡 Execute: taskkill /F /IM node.exe');
  }
});
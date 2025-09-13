const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middlewares básicos
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  console.log('Health check acessado');
  res.json({
    success: true,
    message: 'Rivalis API está funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Rotas de autenticação básicas
app.post('/api/auth/register', (req, res) => {
  console.log('Registro acessado', req.body);
  res.status(201).json({
    success: true,
    message: 'Usuário criado com sucesso!',
    user: {
      id: 1,
      name: req.body.name || 'Usuário',
      email: req.body.email || 'test@test.com'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login acessado', req.body);
  res.json({
    success: true,
    message: 'Login realizado com sucesso!',
    user: {
      id: 1,
      name: 'Usuário Teste',
      email: req.body.email || 'test@test.com'
    },
    token: 'fake-jwt-token-for-development'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// Iniciar servidor
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor SIMPLES Rivalis rodando na porta ${PORT}`);
  console.log(`🌍 Health check: http://127.0.0.1:${PORT}/health`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
});
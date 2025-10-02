const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middlewares básicos
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  console.log('Health check chamado');
  res.json({
    success: true,
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Rota de teste para login
app.post('/api/auth/login', (req, res) => {
  console.log('Login tentativa:', req.body);
  res.json({
    success: false,
    message: 'Teste - servidor funcionando mas sem autenticação',
    timestamp: new Date().toISOString(),
  });
});

// Rota de teste para registro
app.post('/api/auth/register', (req, res) => {
  console.log('Registro tentativa:', req.body);
  res.json({
    success: false,
    message: 'Teste - servidor funcionando mas sem autenticação',
    timestamp: new Date().toISOString(),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
});
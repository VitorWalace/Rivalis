console.log('=== INICIANDO SERVIDOR DE DEBUG PORTA 3001 ===');

const express = require('express');
const cors = require('cors');

console.log('Express carregado:', typeof express);

const app = express();
const PORT = 3001; // Mudando para porta 3001

console.log('App criado:', typeof app);

// Middlewares básicos
console.log('Configurando CORS...');
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

console.log('Configurando JSON parser...');
app.use(express.json());

// Health check
console.log('Configurando rotas...');
app.get('/health', (req, res) => {
  console.log('=== HEALTH CHECK RECEBIDO ===');
  res.json({
    success: true,
    message: 'Servidor funcionando na porta 3001!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  console.log('=== API HEALTH CHECK RECEBIDO ===');
  res.json({
    success: true,
    message: 'API funcionando na porta 3001!',
    timestamp: new Date().toISOString(),
  });
});

// Rota de teste para login
app.post('/api/auth/login', (req, res) => {
  console.log('=== LOGIN TENTATIVA ===', req.body);
  res.json({
    success: false,
    message: 'Teste - servidor funcionando na porta 3001 mas sem autenticação real',
    timestamp: new Date().toISOString(),
  });
});

// Rota de teste para registro
app.post('/api/auth/register', (req, res) => {
  console.log('=== REGISTRO TENTATIVA ===', req.body);
  res.json({
    success: false,
    message: 'Teste - servidor funcionando na porta 3001 mas sem autenticação real',
    timestamp: new Date().toISOString(),
  });
});

console.log('=== TENTANDO INICIAR SERVIDOR ===');

// Iniciar servidor
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor de debug rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(`📍 Servidor escutando em 127.0.0.1:${PORT} (IPv4)`);
});

server.on('error', (error) => {
  console.error('=== ERRO DO SERVIDOR ===', error);
});

server.on('listening', () => {
  console.log('=== SERVIDOR LISTENING ===');
  const addr = server.address();
  console.log('Endereço do servidor:', addr);
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('=== ERRO NÃO CAPTURADO ===', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== PROMISE REJEITADA ===', reason);
});

console.log('=== SCRIPT FINALIZADO - AGUARDANDO CONEXÕES ===');
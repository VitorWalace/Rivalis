const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sequelize = require('./config/database');
const { ensureGameSchema } = require('./utils/schemaUtils');
const authRoutes = require('./routes/auth');
const championshipRoutes = require('./routes/championships');
const teamRoutes = require('./routes/teams');
const playerRoutes = require('./routes/players');
const gameRoutes = require('./routes/games');
const goalRoutes = require('./routes/goals');

const app = express();
const PORT = Number(process.env.PORT) || 5001; // Porta local 5001 (alinha com frontend)

// Rate limiting - Configuração mais permissiva para desenvolvimento
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (mais rápido para reset em dev)
  max: 500, // máximo 500 requests por IP (mais permissivo)
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 1 minuto.',
  },
});

// Middlewares globais
// CORS deve vir ANTES do helmet para não ser bloqueado
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de origins permitidas
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:4173',
      'https://rivalis.vercel.app',
      'https://rivalis-git-main-vitorwalaces-projects.vercel.app',
      'https://rivalis-no69i3n7p-vitorwalaces-projects.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Verificar se é localhost, vercel, netlify, railway ou rede local (192.168.x.x, 10.x.x.x)
    const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?/.test(origin);
    const isVercel = origin.includes('.vercel.app') || origin === 'https://rivalis.vercel.app';
    
    if (isLocalNetwork ||
        isVercel ||
        origin.includes('.netlify.app') ||
        origin.includes('.railway.app') ||
        allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed origin:', origin);
      return callback(null, true);
    }
    
    // Log para debug
    console.log('🚫 CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Helmet depois do CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Handler para preflight requests (OPTIONS)
app.options('*', cors());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rivalis API está funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/championships', championshipRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/goals', goalRoutes);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Erro interno do servidor',
  });
});

// Helper: tentar escutar em uma porta, com fallback incremental
const listenOnAvailablePort = async (startPort, maxAttempts = 5) => {
  const tryListen = (port) => new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => resolve({ server, port }));
    server.on('error', reject);
  });

  let lastError = null;
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    try {
      const result = await tryListen(port);
      return result;
    } catch (err) {
      lastError = err;
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Porta ${port} em uso, tentando ${port + 1}...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Falha ao iniciar servidor em portas alternativas');
};

// Inicializar servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    } catch (dbError) {
      console.error('❌ Erro ao conectar ao banco MySQL:', dbError.message);
      console.log('🔄 Reconfigurando para usar SQLite...');
      
      // Reconfigurar para usar SQLite
      const { Sequelize } = require('sequelize');
      const newSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: false,
      });
      
      // Substituir a instância do sequelize
      Object.assign(sequelize, newSequelize);
      
      await sequelize.authenticate();
      console.log('✅ Usando SQLite como banco de dados!');
    }
    
    // Sincronizar modelos (criar tabelas se não existirem)
    // Usar apenas em desenvolvimento e sem alter para evitar problemas de índices
    await sequelize.sync({
      alter: false, // Desabilitado para evitar erro de "too many keys"
      force: false
    });
    console.log('✅ Modelos sincronizados com o banco de dados!');

    // Migrações de colunas rodam DEPOIS do sync: em banco novo as tabelas
    // já nascem no formato atual, e em banco antigo o ajuste é aplicado.
    try {
      await ensureGameSchema();
    } catch (schemaError) {
      console.error('❌ Erro ao ajustar esquema do banco:', schemaError.message);
      throw schemaError;
    }

    // Verificar se tabelas foram criadas
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log(`📊 ${tables.length} tabelas disponíveis no banco`);
    } catch (err) {
      console.log('⚠️ Não foi possível listar tabelas (normal em SQLite)', err.message);
    }
    
    // Iniciar servidor com fallback de porta em caso de EADDRINUSE
    const { port } = await listenOnAvailablePort(PORT, 5);
    console.log(`🚀 Servidor Rivalis rodando na porta ${port}`);
    console.log(`🌍 Health check local: http://localhost:${port}/health`);
    console.log(`📱 Acesso na rede: http://SEU-IP:${port}/health`);
    console.log(`   (Use 'ipconfig' no Windows ou 'ifconfig' no Mac/Linux para ver seu IP)`);
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

startServer();
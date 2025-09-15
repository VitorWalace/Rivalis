const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const championshipRoutes = require('./routes/championships');
const teamRoutes = require('./routes/teams');
const playerRoutes = require('./routes/players');
const gameRoutes = require('./routes/games');
const goalRoutes = require('./routes/goals');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
});

// Middlewares globais
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://rivalis-no69i3n7p-vitorwalaces-projects.vercel.app',
    'https://rivalis-c6b84lgwh-vitorwalaces-projects.vercel.app',
    'https://*.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Inicializar servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    
    // Sincronizar modelos (em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados com o banco de dados!');
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Rivalis rodando na porta ${PORT}`);
      console.log(`🌍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

startServer();
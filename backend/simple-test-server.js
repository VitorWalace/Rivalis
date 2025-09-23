const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Teste simples
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Importar rotas apenas se o módulo existir
try {
  const authRoutes = require('./routes/auth');
  const championshipRoutes = require('./routes/championships');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/championships', championshipRoutes);
  
  console.log('✅ Rotas carregadas com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar rotas:', error.message);
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔗 Teste: http://localhost:${PORT}/api/test`);
});
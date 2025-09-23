const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { Championship, Team, Game, User } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware simples de autenticação para teste
app.use((req, res, next) => {
  req.user = { id: '7ec26670-87b0-4b96-8a5c-4598e2191450' }; // ID do usuário teste
  next();
});

// Importar controller
const { generateRound } = require('./controllers/gameController');

// Rota para gerar rodada
app.post('/api/games/generate-round/:championshipId', generateRound);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

// Rota para listar campeonatos
app.get('/api/championships', async (req, res) => {
  try {
    const championships = await Championship.findAll({
      include: [
        {
          model: Team,
          as: 'teams',
          required: false
        }
      ]
    });
    res.json({ success: true, data: championships });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   GET  http://localhost:${PORT}/api/championships`);
  console.log(`   POST http://localhost:${PORT}/api/games/generate-round/:championshipId`);
});
console.log('=== SERVIDOR HTTP COMPLETO COM BANCO DE DADOS ===');

const http = require('http');
const sequelize = require('./config/database');
const User = require('./models/User');
const Championship = require('./models/Championship');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');
const Goal = require('./models/Goal');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Usar uma porta que normalmente não é bloqueada
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'rivalis_super_secret_key_change_in_production';

// Função para gerar JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Função para verificar JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware de autenticação
const authenticateUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
};

// Função para parse do corpo da requisição
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
  });
};

// Função para resposta JSON
const sendJSON = (res, statusCode, data) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

// Criar servidor HTTP básico
const server = http.createServer(async (req, res) => {
  console.log(`=== REQUISIÇÃO RECEBIDA ===`);
  console.log(`Método: ${req.method}`);
  console.log(`URL: ${req.url}`);
  
  // Configurar CORS muito permissivo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // === ROTAS DE AUTENTICAÇÃO ===
    
    if (path === '/api/auth/register' && method === 'POST') {
      const { name, email, password } = await parseBody(req);
      
      if (!name || !email || !password) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Nome, email e senha são obrigatórios' 
        });
      }

      // Verificar se usuário já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return sendJSON(res, 409, { 
          success: false, 
          message: 'Usuário já existe com este email' 
        });
      }

      // Criar usuário
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
      });

      const token = generateToken(newUser);
      
      return sendJSON(res, 201, {
        success: true,
        message: 'Usuário criado com sucesso!',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = await parseBody(req);
      
      if (!email || !password) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Email e senha são obrigatórios' 
        });
      }

      // Encontrar usuário
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return sendJSON(res, 401, { 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }

      // Verificar senha
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return sendJSON(res, 401, { 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }

      const token = generateToken(user);
      
      return sendJSON(res, 200, {
        success: true,
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }

    if (path === '/api/auth/verify' && method === 'GET') {
      const userPayload = authenticateUser(req);
      
      if (!userPayload) {
        return sendJSON(res, 401, { 
          success: false, 
          message: 'Token inválido' 
        });
      }

      const user = await User.findByPk(userPayload.id);
      if (!user) {
        return sendJSON(res, 404, { 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }

      return sendJSON(res, 200, {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }

    // === ROTAS DE CAMPEONATOS ===
    
    if (path === '/api/championships' && method === 'GET') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const championships = await Championship.findAll({
        where: { adminId: userPayload.id },
        include: [
          { model: Team, as: 'teams' },
          { model: Game, as: 'games' },
        ],
        order: [['createdAt', 'DESC']],
      });

      return sendJSON(res, 200, {
        success: true,
        data: championships,
      });
    }

    if (path === '/api/championships' && method === 'POST') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const { name, sport, format, description, maxTeams, settings } = await parseBody(req);
      
      if (!name || !sport) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Nome e esporte são obrigatórios' 
        });
      }

      const championship = await Championship.create({
        name,
        sport,
        format: format || 'pontos-corridos',
        description,
        maxTeams: maxTeams || 16,
        settings: settings || {},
        adminId: userPayload.id,
      });

      return sendJSON(res, 201, {
        success: true,
        message: 'Campeonato criado com sucesso!',
        data: championship,
      });
    }

    // Obter campeonato específico
    if (path.match(/^\/api\/championships\/[a-f0-9-]+$/) && method === 'GET') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const championshipId = path.split('/')[3];
      
      const championship = await Championship.findOne({
        where: { 
          id: championshipId,
          adminId: userPayload.id 
        },
        include: [
          { 
            model: Team, 
            as: 'teams',
            include: [{ model: Player, as: 'players' }]
          },
          { 
            model: Game, 
            as: 'games',
            include: [
              { model: Team, as: 'homeTeam' },
              { model: Team, as: 'awayTeam' },
            ]
          },
        ],
      });

      if (!championship) {
        return sendJSON(res, 404, { 
          success: false, 
          message: 'Campeonato não encontrado' 
        });
      }

      return sendJSON(res, 200, {
        success: true,
        data: championship,
      });
    }

    // === ROTAS DE TIMES ===
    
    if (path === '/api/teams' && method === 'POST') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const { name, color, championshipId } = await parseBody(req);
      
      if (!name || !championshipId) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Nome e ID do campeonato são obrigatórios' 
        });
      }

      // Verificar se o usuário é admin do campeonato
      const championship = await Championship.findOne({
        where: { id: championshipId, adminId: userPayload.id }
      });

      if (!championship) {
        return sendJSON(res, 403, { 
          success: false, 
          message: 'Você não tem permissão para criar times neste campeonato' 
        });
      }

      const team = await Team.create({
        name,
        color: color || '#3B82F6',
        championshipId,
      });

      return sendJSON(res, 201, {
        success: true,
        message: 'Time criado com sucesso!',
        data: team,
      });
    }

    // === ROTAS DE JOGADORES ===
    
    if (path === '/api/players' && method === 'POST') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const { name, position, number, teamId } = await parseBody(req);
      
      if (!name || !teamId) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Nome e ID do time são obrigatórios' 
        });
      }

      // Verificar se o usuário é admin do campeonato do time
      const team = await Team.findOne({
        where: { id: teamId },
        include: [{ 
          model: Championship, 
          as: 'championship',
          where: { adminId: userPayload.id }
        }]
      });

      if (!team) {
        return sendJSON(res, 403, { 
          success: false, 
          message: 'Você não tem permissão para adicionar jogadores neste time' 
        });
      }

      const player = await Player.create({
        name,
        position: position || 'midfielder',
        number,
        teamId,
      });

      return sendJSON(res, 201, {
        success: true,
        message: 'Jogador criado com sucesso!',
        data: player,
      });
    }

    // === ROTAS DE JOGOS ===
    
    if (path === '/api/games' && method === 'POST') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const { homeTeamId, awayTeamId, championshipId, scheduledDate, round } = await parseBody(req);
      
      if (!homeTeamId || !awayTeamId || !championshipId) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Times e ID do campeonato são obrigatórios' 
        });
      }

      // Verificar se o usuário é admin do campeonato
      const championship = await Championship.findOne({
        where: { id: championshipId, adminId: userPayload.id }
      });

      if (!championship) {
        return sendJSON(res, 403, { 
          success: false, 
          message: 'Você não tem permissão para criar jogos neste campeonato' 
        });
      }

      const game = await Game.create({
        homeTeamId,
        awayTeamId,
        championshipId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        round: round || 1,
      });

      return sendJSON(res, 201, {
        success: true,
        message: 'Jogo criado com sucesso!',
        data: game,
      });
    }

    // Atualizar resultado do jogo
    if (path.match(/^\/api\/games\/[a-f0-9-]+\/result$/) && method === 'PUT') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const gameId = path.split('/')[3];
      const { homeScore, awayScore, events, statistics } = await parseBody(req);

      if (homeScore === undefined || awayScore === undefined) {
        return sendJSON(res, 400, { 
          success: false, 
          message: 'Placares são obrigatórios' 
        });
      }

      // Verificar se o usuário é admin do campeonato do jogo
      const game = await Game.findOne({
        where: { id: gameId },
        include: [{ 
          model: Championship, 
          as: 'championship',
          where: { adminId: userPayload.id }
        }]
      });

      if (!game) {
        return sendJSON(res, 403, { 
          success: false, 
          message: 'Você não tem permissão para atualizar este jogo' 
        });
      }

      await game.update({
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: 'finished',
        finishedAt: new Date(),
        events: events || [],
        statistics: statistics || game.statistics,
      });

      // Atualizar estatísticas dos times
      const homeTeam = await Team.findByPk(game.homeTeamId);
      const awayTeam = await Team.findByPk(game.awayTeamId);

      if (homeTeam && awayTeam) {
        const homeWin = homeScore > awayScore;
        const awayWin = awayScore > homeScore;
        const draw = homeScore === awayScore;

        // Atualizar time da casa
        const homeStats = homeTeam.stats;
        await homeTeam.update({
          stats: {
            ...homeStats,
            games: homeStats.games + 1,
            wins: homeStats.wins + (homeWin ? 1 : 0),
            draws: homeStats.draws + (draw ? 1 : 0),
            losses: homeStats.losses + (awayWin ? 1 : 0),
            goalsFor: homeStats.goalsFor + homeScore,
            goalsAgainst: homeStats.goalsAgainst + awayScore,
            points: homeStats.points + (homeWin ? 3 : draw ? 1 : 0),
          }
        });

        // Atualizar time visitante
        const awayStats = awayTeam.stats;
        await awayTeam.update({
          stats: {
            ...awayStats,
            games: awayStats.games + 1,
            wins: awayStats.wins + (awayWin ? 1 : 0),
            draws: awayStats.draws + (draw ? 1 : 0),
            losses: awayStats.losses + (homeWin ? 1 : 0),
            goalsFor: awayStats.goalsFor + awayScore,
            goalsAgainst: awayStats.goalsAgainst + homeScore,
            points: awayStats.points + (awayWin ? 3 : draw ? 1 : 0),
          }
        });
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'Resultado do jogo atualizado com sucesso!',
        data: game,
      });
    }

    // === ROTAS DE DASHBOARD/ESTATÍSTICAS ===
    
    if (path === '/api/dashboard/stats' && method === 'GET') {
      const userPayload = authenticateUser(req);
      if (!userPayload) {
        return sendJSON(res, 401, { success: false, message: 'Não autorizado' });
      }

      const totalChampionships = await Championship.count({
        where: { adminId: userPayload.id }
      });

      const activeChampionships = await Championship.count({
        where: { 
          adminId: userPayload.id,
          status: 'ativo'
        }
      });

      const totalTeams = await Team.count({
        include: [{
          model: Championship,
          as: 'championship',
          where: { adminId: userPayload.id }
        }]
      });

      const totalPlayers = await Player.count({
        include: [{
          model: Team,
          as: 'team',
          include: [{
            model: Championship,
            as: 'championship',
            where: { adminId: userPayload.id }
          }]
        }]
      });

      const totalGames = await Game.count({
        include: [{
          model: Championship,
          as: 'championship',
          where: { adminId: userPayload.id }
        }]
      });

      const finishedGames = await Game.count({
        where: { status: 'finished' },
        include: [{
          model: Championship,
          as: 'championship',
          where: { adminId: userPayload.id }
        }]
      });

      return sendJSON(res, 200, {
        success: true,
        data: {
          totalChampionships,
          activeChampionships,
          totalTeams,
          totalPlayers,
          totalGames,
          finishedGames,
        },
      });
    }

    // === ROTA PADRÃO ===
    return sendJSON(res, 404, { 
      success: false, 
      message: 'Rota não encontrada' 
    });

  } catch (error) {
    console.error('=== ERRO NO SERVIDOR ===', error);
    return sendJSON(res, 500, {
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

// Função para inicializar o servidor
async function startServer() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida!');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Tabelas criadas/sincronizadas!');
    
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Servidor funcionando em 127.0.0.1:${PORT}`);
      console.log(`🗄️ Banco de dados: SQLite conectado`);
      console.log(`🔐 Autenticação: JWT habilitada`);
      console.log(`📊 Dashboard: Rotas completas disponíveis`);
      console.log('==============================================');
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Capturar sinais de encerramento
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Encerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

// Iniciar servidor
startServer();
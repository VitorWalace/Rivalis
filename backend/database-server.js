console.log('=== SERVIDOR HTTP COMPLETO COM BANCO DE DADOS ===');

const http = require('http');
const sequelize = require('./config/database');
const User = require('./models/User');
const Championship = require('./models/Championship');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');
const Goal = require('./models/Goal');

// Configurar associações
const models = { User, Championship, Team, Player, Game, Goal };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

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
  
  // Responder a OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('=== PREFLIGHT OPTIONS ===');
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Configurar resposta JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (req.url.startsWith('/health') || req.url === '/') {
      console.log('=== HEALTH CHECK ===');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: '🎉 SERVIDOR COM BANCO DE DADOS FUNCIONANDO!',
        timestamp: new Date().toISOString(),
        port: PORT,
        database: 'SQLite conectado',
        tip: 'Agora com autenticação real!'
      }));
      
    } else if (req.url.startsWith('/api/health')) {
      console.log('=== API HEALTH CHECK ===');
      
      // Testar conexão com banco
      try {
        await sequelize.authenticate();
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: '🚀 API e banco funcionando perfeitamente!',
          timestamp: new Date().toISOString(),
          port: PORT,
          database: 'Conectado e operacional'
        }));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          message: 'Erro na conexão com banco de dados',
          error: error.message
        }));
      }
      
    } else if (req.url.startsWith('/api/auth/register') && req.method === 'POST') {
      console.log('=== TENTATIVA DE REGISTRO ===');
      
      const data = await parseBody(req);
      console.log('Dados recebidos:', { ...data, password: '[OCULTO]' });
      
      try {
        // Verificar se usuário já existe
        const existingUser = await User.findOne({ where: { email: data.email } });
        if (existingUser) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'Email já cadastrado'
          }));
          return;
        }
        
        // Criar novo usuário
        const user = await User.create({
          name: data.name,
          email: data.email,
          password: data.password
        });
        
        // Gerar token
        const token = generateToken(user);
        
        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Usuário criado com sucesso!',
          data: {
            user: user.toJSON(),
            token: token
          }
        }));
        console.log('=== USUÁRIO CRIADO COM SUCESSO ===');
        
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: 'Erro ao criar usuário: ' + error.message
        }));
      }
      
    } else if (req.url.startsWith('/api/auth/login') && req.method === 'POST') {
      console.log('=== TENTATIVA DE LOGIN ===');
      
      const data = await parseBody(req);
      console.log('Dados recebidos:', { email: data.email, password: '[OCULTO]' });
      
      try {
        // Buscar usuário por email
        const user = await User.findOne({ where: { email: data.email } });
        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Email ou senha incorretos'
          }));
          return;
        }
        
        // Verificar senha
        const isValidPassword = await user.validatePassword(data.password);
        if (!isValidPassword) {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Email ou senha incorretos'
          }));
          return;
        }
        
        // Atualizar último login
        await user.update({ lastLogin: new Date() });
        
        // Gerar token
        const token = generateToken(user);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Login realizado com sucesso!',
          data: {
            user: user.toJSON(),
            token: token
          }
        }));
        console.log('=== LOGIN REALIZADO COM SUCESSO ===');
        
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          message: 'Erro interno do servidor'
        }));
      }
      
    } else if (req.url.startsWith('/api/auth/me') && req.method === 'GET') {
      console.log('=== VERIFICAÇÃO DE AUTENTICAÇÃO ===');
      
      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401);
        res.end(JSON.stringify({
          success: false,
          message: 'Token de acesso não fornecido'
        }));
        return;
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar usuário
        const user = await User.findByPk(decoded.id);
        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Usuário não encontrado'
          }));
          return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: {
            user: user.toJSON()
          }
        }));
        
      } catch (error) {
        res.writeHead(401);
        res.end(JSON.stringify({
          success: false,
          message: 'Token inválido'
        }));
      }
      
    } else if (req.url.startsWith('/api/auth/logout') && req.method === 'POST') {
      console.log('=== LOGOUT ===');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Logout realizado com sucesso'
      }));
      
    } else if (req.url.startsWith('/api/dashboard/stats') && req.method === 'GET') {
      console.log('=== DASHBOARD STATS ===');
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Token não fornecido' }));
        return;
      }
      
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar estatísticas com tratamento de erro para tabelas que não existem
        let stats = {
          totalChampionships: 0,
          activeChampionships: 0,
          totalTeams: 0,
          totalPlayers: 0,
          totalGames: 0,
          finishedGames: 0,
        };

        try {
          stats.totalChampionships = await Championship.count({
            where: { adminId: decoded.id }
          }) || 0;
        } catch (e) {
          console.log('Tabela championships não existe ainda');
        }

        try {
          stats.activeChampionships = await Championship.count({
            where: { 
              adminId: decoded.id,
              status: 'ativo'
            }
          }) || 0;
        } catch (e) {
          console.log('Tabela championships não existe ainda');
        }

        try {
          stats.totalTeams = await Team.count({
            include: [{
              model: Championship,
              where: { adminId: decoded.id }
            }]
          }) || 0;
        } catch (e) {
          console.log('Tabela teams não existe ainda');
        }

        try {
          stats.totalPlayers = await Player.count({
            include: [{
              model: Team,
              include: [{
                model: Championship,
                where: { adminId: decoded.id }
              }]
            }]
          }) || 0;
        } catch (e) {
          console.log('Tabela players não existe ainda');
        }

        try {
          stats.totalGames = await Game.count({
            include: [{
              model: Championship,
              where: { adminId: decoded.id }
            }]
          }) || 0;
        } catch (e) {
          console.log('Tabela games não existe ainda');
        }

        try {
          stats.finishedGames = await Game.count({
            where: { status: 'finished' },
            include: [{
              model: Championship,
              where: { adminId: decoded.id }
            }]
          }) || 0;
        } catch (e) {
          console.log('Tabela games não existe ainda');
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: stats
        }));
        
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Token inválido' }));
      }
      
    } else if (req.url.startsWith('/api/championships') && req.method === 'GET') {
      console.log('=== GET CHAMPIONSHIPS ===');
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Token não fornecido' }));
        return;
      }
      
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const championships = await Championship.findAll({
          where: { adminId: decoded.id },
          include: [
            { 
              model: Team,
              as: 'teams' 
            },
            { 
              model: Game,
              as: 'games' 
            }
          ],
          order: [['createdAt', 'DESC']]
        });

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: championships
        }));
        
      } catch (error) {
        console.error('Erro ao buscar campeonatos:', error);
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Token inválido' }));
      }
      
    } else if (req.url.startsWith('/api/championships') && req.method === 'POST') {
      console.log('=== CREATE CHAMPIONSHIP ===');
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Token não fornecido' }));
        return;
      }
      
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const data = await parseBody(req);
        
        const championship = await Championship.create({
          name: data.name,
          sport: data.sport || 'futebol',
          format: data.format || 'pontos-corridos',
          description: data.description,
          maxTeams: data.maxTeams || 16,
          adminId: decoded.id
        });

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Campeonato criado com sucesso!',
          data: championship
        }));
        
      } catch (error) {
        console.error('Erro ao criar campeonato:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: 'Erro ao criar campeonato: ' + error.message }));
      }
      
    } else {
      console.log('=== ROTA NÃO ENCONTRADA ===');
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        message: 'Rota não encontrada',
        url: req.url,
        availableRoutes: ['/health', '/api/health', '/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/auth/logout']
      }));
    }
  } catch (error) {
    console.error('=== ERRO GERAL ===', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }));
  }
});

// Tentar iniciar servidor em diferentes configurações
const configs = [
  { host: '127.0.0.1', port: 8000 },
  { host: '127.0.0.1', port: 3000 },  
  { host: 'localhost', port: 8000 },
  { host: 'localhost', port: 3000 },
  { host: '0.0.0.0', port: 8000 },
  { host: '0.0.0.0', port: 3000 },
];

let currentConfigIndex = 0;

function tryNextConfig() {
  if (currentConfigIndex >= configs.length) {
    console.error('❌ Não foi possível iniciar o servidor em nenhuma configuração!');
    console.log('📋 Soluções:');
    console.log('1. Execute o VS Code como Administrador');
    console.log('2. Desabilite temporariamente o Windows Defender Firewall');
    console.log('3. Adicione uma exceção no firewall para Node.js');
    return;
  }
  
  const config = configs[currentConfigIndex];
  console.log(`Tentando iniciar servidor em ${config.host}:${config.port}...`);
  
  const tempServer = http.createServer().listen(config.port, config.host, () => {
    tempServer.close(async () => {
      // Se chegou aqui, a porta está disponível
      try {
        // Testar conexão com banco antes de iniciar servidor
        await sequelize.authenticate();
        console.log('✅ Conexão com banco de dados estabelecida!');
        
        // Sincronizar todas as tabelas
        await sequelize.sync({ alter: true });
        console.log('✅ Tabelas criadas/sincronizadas!');
        
        server.listen(config.port, config.host, () => {
          console.log(`🚀 Servidor funcionando em ${config.host}:${config.port}`);
          console.log(`🌐 Teste: http://${config.host}:${config.port}/health`);
          console.log(`🗄️ Banco de dados: SQLite conectado`);
          console.log(`🔐 Autenticação: JWT habilitada`);
          if (config.host === 'localhost') {
            console.log(`🌐 Alternativo: http://127.0.0.1:${config.port}/health`);
          }
        });
      } catch (error) {
        console.error('❌ Erro na conexão com banco:', error.message);
        currentConfigIndex++;
        setTimeout(tryNextConfig, 100);
      }
    });
  });
  
  tempServer.on('error', (error) => {
    console.error(`❌ Erro em ${config.host}:${config.port}:`, error.code);
    currentConfigIndex++;
    setTimeout(tryNextConfig, 100);
  });
}

server.on('error', (error) => {
  console.error('=== ERRO DO SERVIDOR ===', error);
  currentConfigIndex++;
  setTimeout(tryNextConfig, 100);
});

server.on('listening', () => {
  console.log('=== SERVIDOR LISTENING ===');
  const addr = server.address();
  console.log('Endereço completo:', addr);
  console.log('🎯 Pronto para receber requisições de login/registro com banco real!');
});

// Capturar erros
process.on('uncaughtException', (error) => {
  console.error('=== ERRO NÃO CAPTURADO ===', error);
});

console.log('=== INICIANDO TESTES DE CONFIGURAÇÃO ===');
tryNextConfig();
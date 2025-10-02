console.log('=== SERVIDOR HTTP ALTERNATIVO - CONTORNANDO FIREWALL ===');

const http = require('http');

// Usar uma porta que normalmente não é bloqueada
const PORT = process.env.PORT || 3000;

// Criar servidor HTTP básico
const server = http.createServer((req, res) => {
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
  
  if (req.url.startsWith('/health') || req.url === '/') {
    console.log('=== HEALTH CHECK ===');
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: '🎉 SERVIDOR FUNCIONANDO! O problema do firewall foi contornado!',
      timestamp: new Date().toISOString(),
      port: PORT,
      tip: 'Se você está vendo isso, o sistema está funcionando!'
    }));
  } else if (req.url.startsWith('/api/health')) {
    console.log('=== API HEALTH CHECK ===');
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: '🚀 API funcionando perfeitamente!',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else if (req.url.startsWith('/api/auth/login') && req.method === 'POST') {
    console.log('=== LOGIN TENTATIVA ===');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const loginData = JSON.parse(body || '{}');
        console.log('Dados de login recebidos:', loginData);
        console.log('=== ENVIANDO RESPOSTA DE LOGIN ===');
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: '✅ Login realizado com sucesso! (simulado)',
          user: {
            id: 1,
            name: 'Usuário Teste',
            email: loginData.email,
            createdAt: new Date().toISOString()
          },
          token: 'fake-jwt-token-123456789',
          timestamp: new Date().toISOString(),
          note: 'Sistema funcionando - dados simulados!'
        }));
        console.log('=== RESPOSTA ENVIADA ===');
      } catch (e) {
        console.log('=== ERRO NO PARSE DO JSON ===', e);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: 'JSON inválido',
          error: e.message
        }));
      }
    });
  } else if (req.url.startsWith('/api/auth/register') && req.method === 'POST') {
    console.log('=== REGISTRO TENTATIVA ===');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const registerData = JSON.parse(body || '{}');
        console.log('Dados de registro recebidos:', registerData);
        console.log('=== ENVIANDO RESPOSTA DE REGISTRO ===');
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: '✅ Registro realizado com sucesso! (simulado)',
          user: {
            id: 2,
            name: registerData.name || 'Usuário Novo',
            email: registerData.email,
            createdAt: new Date().toISOString()
          },
          token: 'fake-jwt-token-987654321',
          timestamp: new Date().toISOString(),
          note: 'Sistema funcionando - dados simulados!'
        }));
        console.log('=== RESPOSTA ENVIADA ===');
      } catch (e) {
        console.log('=== ERRO NO PARSE DO JSON ===', e);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: 'JSON inválido',
          error: e.message
        }));
      }
    });
  } else if (req.url.startsWith('/api/auth/me') && req.method === 'GET') {
    console.log('=== VERIFICAÇÃO DE AUTENTICAÇÃO ===');
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    
    // Simular usuário não autenticado
    res.writeHead(401);
    res.end(JSON.stringify({
      success: false,
      message: 'Usuário não autenticado (simulado)',
      timestamp: new Date().toISOString()
    }));
    console.log('=== RESPOSTA DE NÃO AUTENTICADO ENVIADA ===');
  } else if (req.url.startsWith('/api/auth/logout') && req.method === 'POST') {
    console.log('=== LOGOUT TENTATIVA ===');
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Logout realizado com sucesso (simulado)',
      timestamp: new Date().toISOString()
    }));
    console.log('=== RESPOSTA DE LOGOUT ENVIADA ===');
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
});

// Tentar iniciar servidor em diferentes configurações
const configs = [
  { host: '127.0.0.1', port: 8000 },  // Tentar porta 8000 primeiro
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
    tempServer.close(() => {
      // Se chegou aqui, a porta está disponível
      server.listen(config.port, config.host, () => {
        console.log(`🚀 Servidor funcionando em ${config.host}:${config.port}`);
        console.log(`🌐 Teste: http://${config.host}:${config.port}/health`);
        if (config.host === 'localhost') {
          console.log(`🌐 Alternativo: http://127.0.0.1:${config.port}/health`);
        }
      });
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
  console.log('🎯 Pronto para receber requisições de login/registro!');
});

// Capturar erros
process.on('uncaughtException', (error) => {
  console.error('=== ERRO NÃO CAPTURADO ===', error);
});

console.log('=== INICIANDO TESTES DE CONFIGURAÇÃO ===');
tryNextConfig();
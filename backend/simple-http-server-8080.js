console.log('=== SERVIDOR HTTP PURO NODE.JS - PORTA 8080 ===');

const http = require('http');

const PORT = 8080; // Porta mais alta

// Criar servidor HTTP básico
const server = http.createServer((req, res) => {
  console.log(`=== REQUISIÇÃO RECEBIDA ===`);
  console.log(`Método: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, req.headers);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder a OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Configurar resposta JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health') {
    console.log('=== HEALTH CHECK ===');
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Servidor HTTP puro funcionando na porta 8080!',
      timestamp: new Date().toISOString(),
      port: PORT,
      message2: 'Se você está vendo isso, o problema estava na porta!'
    }));
  } else if (req.url === '/api/health') {
    console.log('=== API HEALTH CHECK ===');
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'API HTTP pura funcionando na porta 8080!',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else if (req.url === '/api/auth/login' && req.method === 'POST') {
    console.log('=== LOGIN TENTATIVA ===');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Body da requisição:', body);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: false,
        message: 'Teste - servidor HTTP puro funcionando na porta 8080, sem autenticação real',
        timestamp: new Date().toISOString(),
        receivedData: JSON.parse(body || '{}')
      }));
    });
  } else {
    console.log('=== ROTA NÃO ENCONTRADA ===');
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      message: 'Rota não encontrada',
      url: req.url
    }));
  }
});

// Tentar diferentes endereços
const addresses = ['127.0.0.1', 'localhost', '0.0.0.0'];
let currentAddressIndex = 0;

function tryNextAddress() {
  if (currentAddressIndex >= addresses.length) {
    console.error('❌ Não foi possível iniciar o servidor em nenhum endereço!');
    return;
  }
  
  const address = addresses[currentAddressIndex];
  console.log(`Tentando iniciar servidor em ${address}:${PORT}...`);
  
  server.listen(PORT, address, () => {
    console.log(`🚀 Servidor HTTP puro rodando em ${address}:${PORT}`);
    console.log(`🌐 Health check: http://${address}:${PORT}/health`);
    console.log(`📍 Endereço: ${address}:${PORT}`);
  });
}

server.on('error', (error) => {
  console.error(`=== ERRO DO SERVIDOR em ${addresses[currentAddressIndex]} ===`, error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso em ${addresses[currentAddressIndex]}!`);
  } else if (error.code === 'EACCES') {
    console.error(`Sem permissão para usar a porta ${PORT} em ${addresses[currentAddressIndex]}!`);
  }
  
  currentAddressIndex++;
  setTimeout(tryNextAddress, 1000);
});

server.on('listening', () => {
  console.log('=== SERVIDOR LISTENING ===');
  const addr = server.address();
  console.log('Endereço completo:', addr);
});

// Capturar erros
process.on('uncaughtException', (error) => {
  console.error('=== ERRO NÃO CAPTURADO ===', error);
});

console.log('=== SCRIPT INICIANDO ===');
tryNextAddress();
const http = require('http');

const token = process.argv[2];

if (!token) {
  console.error('❌ Uso: node test-create-championship.js <TOKEN>');
  console.log('Faça login primeiro e copie o token da resposta.');
  process.exit(1);
}

function request(method, path, body, authToken) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : undefined;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? data.length : 0,
        'Authorization': authToken ? `Bearer ${authToken}` : undefined,
      },
    }, (res) => {
      let chunks = '';
      res.on('data', (d) => chunks += d.toString());
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('➡️ Teste criar campeonato');
  const create = await request('POST', '/api/championships', {
    name: `Campeonato Teste ${Date.now()}`,
    sport: 'futebol',
    format: 'pontos-corridos',
    description: 'Teste de criação via API',
    maxTeams: 8,
  }, token);
  console.log('CREATE', create.status);
  console.log(create.body);

  console.log('\n➡️ Teste listar campeonatos');
  const list = await request('GET', '/api/championships', null, token);
  console.log('LIST', list.status);
  const parsed = JSON.parse(list.body);
  console.log(`Total: ${parsed.data?.championships?.length || 0} campeonatos`);
})();

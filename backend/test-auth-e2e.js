const http = require('http');

function request(method, path, body) {
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
  console.log('➡️ Teste registro (pode dar 409 se já existir)');
  const email = `e2e_${Date.now()}@test.com`;
  const reg = await request('POST', '/api/auth/register', { name: 'E2E', email, password: 'Aa123456' });
  console.log('REGISTER', reg.status, reg.body);

  console.log('➡️ Teste login (usuário teste)');
  const login = await request('POST', '/api/auth/login', { email: 'teste@teste.com', password: '123456' });
  console.log('LOGIN', login.status, login.body);
})();

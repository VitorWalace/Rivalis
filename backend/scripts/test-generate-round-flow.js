// Teste rápido end-to-end do fluxo de gerar rodada
require('dotenv').config();
const fetch = require('node-fetch');

const BASE = process.env.TEST_BASE_URL || 'http://127.0.0.1:5000/api';

async function run() {
  try {
    console.log('▶ Iniciando teste generateRound');

    // 1. Registrar usuário
    const email = `test_${Date.now()}@exemplo.com`;
    const registerResp = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Teste', email, password: 'senha123' })
    }).then(r => r.json());

    if (!registerResp.success) throw new Error('Falha ao registrar usuário');

    // 2. Login
    const loginResp = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'senha123' })
    }).then(r => r.json());

    if (!loginResp.success) throw new Error('Falha login');
    const token = loginResp.data.token;

    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 3. Criar campeonato
    const champResp = await fetch(`${BASE}/championships`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Teste Rodada', sport: 'futsal', format: 'pontos-corridos' })
    }).then(r => r.json());
    if (!champResp.success) throw new Error('Falha criar campeonato');
    const championshipId = champResp.data.championship.id;

    // 4. Criar dois times
    for (const nome of ['Time A', 'Time B']) {
      const teamResp = await fetch(`${BASE}/teams`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: nome, championshipId })
      }).then(r => r.json());
      if (!teamResp.success) throw new Error('Falha criar time ' + nome);
    }

    // 5. Chamar generate-round
    const genResp = await fetch(`${BASE}/games/generate-round/${championshipId}`, {
      method: 'POST',
      headers: authHeaders
    }).then(r => r.json());

    console.log('Resultado geração:', genResp);
    if (!genResp.success) throw new Error('Falha ao gerar rodada');

    console.log('✅ Teste OK: rodada', genResp.data.round, 'jogos:', genResp.data.totalGames);
  } catch (e) {
    console.error('❌ Erro no teste:', e.message);
    process.exit(1);
  }
}

run();

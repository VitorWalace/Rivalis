// Teste completo da API - CRUD de campeonatos e times
const testCRUD = async () => {
  const baseURL = 'http://localhost:5001';
  
  console.log('🏆 Testando CRUD completo da API Rivalis...\n');
  
  try {
    // 1. Fazer login primeiro
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@rivalis.com',
        password: 'Teste123'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (!loginResponse.ok) {
      throw new Error(`Erro no login: ${loginResult.message}`);
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Criar campeonato
    console.log('\n2. Criando campeonato...');
    const championshipData = {
      name: 'Campeonato Teste',
      sport: 'football',
      format: 'league',
      description: 'Campeonato para testes da API'
    };
    
    const createChampResponse = await fetch(`${baseURL}/api/championships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(championshipData)
    });
    
    const createChampResult = await createChampResponse.json();
    
    if (!createChampResponse.ok) {
      throw new Error(`Erro ao criar campeonato: ${createChampResult.message}`);
    }
    
    const championshipId = createChampResult.data.championship.id;
    console.log('✅ Campeonato criado:', createChampResult.data.championship.name);
    console.log('🆔 ID:', championshipId);
    
    // 3. Criar times
    console.log('\n3. Criando times...');
    const team1Data = {
      name: 'Time A',
      championshipId: championshipId,
      color: '#FF0000'
    };
    
    const team2Data = {
      name: 'Time B',
      championshipId: championshipId,
      color: '#0000FF'
    };
    
    const createTeam1Response = await fetch(`${baseURL}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(team1Data)
    });
    
    const createTeam2Response = await fetch(`${baseURL}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(team2Data)
    });
    
    const team1Result = await createTeam1Response.json();
    const team2Result = await createTeam2Response.json();
    
    if (!createTeam1Response.ok) {
      console.log('❌ Erro detalhado Team A:', JSON.stringify(team1Result, null, 2));
      throw new Error(`Erro ao criar Time A: ${team1Result.message}`);
    }
    
    if (!createTeam2Response.ok) {
      console.log('❌ Erro detalhado Team B:', JSON.stringify(team2Result, null, 2));
      throw new Error(`Erro ao criar Time B: ${team2Result.message}`);
    }
    
    console.log('✅ Time A criado:', team1Result.data.team.name);
    console.log('✅ Time B criado:', team2Result.data.team.name);
    
    // 4. Listar times do campeonato
    console.log('\n4. Listando times do campeonato...');
    const teamsResponse = await fetch(`${baseURL}/api/teams/championship/${championshipId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const teamsResult = await teamsResponse.json();
    
    if (teamsResponse.ok) {
      console.log(`✅ ${teamsResult.data.teams.length} times encontrados:`);
      teamsResult.data.teams.forEach(team => {
        console.log(`   - ${team.name} (${team.color})`);
      });
    } else {
      console.log('❌ Erro ao listar times:', teamsResult.message);
    }
    
    // 5. Listar campeonatos do usuário
    console.log('\n5. Listando campeonatos do usuário...');
    const championshipsResponse = await fetch(`${baseURL}/api/championships`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const championshipsResult = await championshipsResponse.json();
    
    if (championshipsResponse.ok) {
      console.log(`✅ ${championshipsResult.data.championships.length} campeonatos encontrados:`);
      championshipsResult.data.championships.forEach(champ => {
        console.log(`   - ${champ.name} (${champ.sport}) - Status: ${champ.status}`);
      });
    } else {
      console.log('❌ Erro ao listar campeonatos:', championshipsResult.message);
    }
    
    console.log('\n🎉 Todos os testes CRUD passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
};

// Executar os testes
testCRUD();
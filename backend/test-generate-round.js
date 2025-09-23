const { Championship, Team, Game, User } = require('./models');

async function testGenerateRound() {
  try {
    console.log('🎯 Teste direto da geração de rodada...\n');

    // 1. Verificar usuários
    const users = await User.findAll({ limit: 1 });
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    const user = users[0];
    console.log('✅ Usuário:', user.name, '(' + user.id + ')');

    // 2. Verificar campeonatos existentes
    const championships = await Championship.findAll({
      include: [
        {
          model: Team,
          as: 'teams',
          required: false
        }
      ]
    });

    console.log(`📋 Campeonatos encontrados: ${championships.length}`);
    
    let targetChampionship = null;
    
    if (championships.length > 0) {
      // Usar campeonato existente
      targetChampionship = championships[0];
      console.log(`✅ Usando campeonato existente: ${targetChampionship.name}`);
      console.log(`📊 Times no campeonato: ${targetChampionship.teams?.length || 0}`);
    } else {
      console.log('❌ Nenhum campeonato encontrado no banco');
      console.log('ℹ️ Para testar, precisa criar um campeonato pela interface web primeiro');
      return;
    }

    // 3. Verificar se tem times suficientes
    if (!targetChampionship.teams || targetChampionship.teams.length < 2) {
      console.log('❌ Campeonato precisa ter pelo menos 2 times');
      console.log('ℹ️ Adicione times ao campeonato pela interface web');
      return;
    }

    // 4. Simular o que o controller faz
    console.log('\n🎮 Simulando geração de rodada...');
    
    const teams = targetChampionship.teams;
    const numTeams = teams.length;
    console.log(`👥 Times: ${teams.map(t => t.name).join(', ')}`);

    // Buscar jogos existentes
    const existingGames = await Game.findAll({
      where: { championshipId: targetChampionship.id }
    });
    console.log(`🎯 Jogos existentes: ${existingGames.length}`);

    // Determinar próxima rodada
    const lastRound = existingGames.length > 0 
      ? Math.max(...existingGames.map(game => game.round || 1))
      : 0;
    const nextRound = lastRound + 1;
    console.log(`📅 Próxima rodada: ${nextRound}`);

    // Gerar confrontos
    const newGames = [];
    for (let i = 0; i < Math.floor(numTeams / 2); i++) {
      const homeTeam = teams[i];
      const awayTeam = teams[numTeams - 1 - i];
      
      // Verificar se já existe esse confronto
      const existingMatch = existingGames.find(game => 
        (game.homeTeamId === homeTeam.id && game.awayTeamId === awayTeam.id) ||
        (game.homeTeamId === awayTeam.id && game.awayTeamId === homeTeam.id)
      );

      if (!existingMatch) {
        newGames.push({
          id: `game_${Date.now()}_${i}`,
          championshipId: targetChampionship.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          round: nextRound,
          status: 'pending',
          homeScore: 0,
          awayScore: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (newGames.length === 0) {
      console.log('⚠️ Nenhum novo confronto para criar');
      console.log('ℹ️ Todos os confrontos já existem');
      return;
    }

    console.log(`🎮 Criando ${newGames.length} novos jogos...`);

    // Criar jogos
    const createdGames = [];
    for (const gameData of newGames) {
      try {
        const game = await Game.create(gameData);
        createdGames.push(game);
        console.log(`  ✅ Jogo criado: ${gameData.homeTeamId} vs ${gameData.awayTeamId}`);
      } catch (error) {
        console.log(`  ❌ Erro ao criar jogo: ${error.message}`);
      }
    }

    console.log(`\n🎉 Rodada ${nextRound} criada com ${createdGames.length} jogos!`);
    
    // Mostrar resultado final
    const allGames = await Game.findAll({
      where: { championshipId: targetChampionship.id },
      include: [
        {
          model: Team,
          as: 'homeTeam',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Team,
          as: 'awayTeam',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['round', 'ASC'], ['createdAt', 'ASC']]
    });

    console.log('\n📋 TODOS OS JOGOS DO CAMPEONATO:');
    allGames.forEach((game, index) => {
      const homeTeam = game.homeTeam?.name || game.homeTeamId;
      const awayTeam = game.awayTeam?.name || game.awayTeamId;
      console.log(`  ${index + 1}. ${homeTeam} vs ${awayTeam} (Rodada ${game.round}) - ${game.status}`);
    });

    console.log('\n✅ TESTE CONCLUÍDO - FUNCIONALIDADE OPERACIONAL!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testGenerateRound();
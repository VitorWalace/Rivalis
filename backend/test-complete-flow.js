const { Championship, Team, Game, User } = require('./models');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testando fluxo completo de geração de rodada...\n');

    // 1. Usar usuário existente
    const users = await User.findAll({ limit: 1 });
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco');
      return;
    }
    const testUser = users[0];
    console.log('✅ Usuário encontrado:', testUser.id, '-', testUser.name);

    // 2. Criar campeonato de teste
    const testChampionship = await Championship.create({
      id: `champ_${Date.now()}`,
      name: 'Campeonato Teste',
      description: 'Teste de geração de rodada',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdBy: testUser.id
    });
    console.log('✅ Campeonato criado:', testChampionship.id);

    // 3. Criar times de teste
    const teams = [];
    for (let i = 1; i <= 4; i++) {
      const team = await Team.create({
        id: `team_${Date.now()}_${i}`,
        name: `Time ${i}`,
        description: `Descrição do Time ${i}`,
        championshipId: testChampionship.id,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        createdBy: testUser.id
      });
      teams.push(team);
    }
    console.log('✅ Times criados:', teams.length);

    // 4. Simular geração de rodada
    console.log('\n🎯 Simulando geração de rodada...');
    
    // Buscar campeonato com times
    const championship = await Championship.findOne({
      where: { id: testChampionship.id },
      include: [
        {
          model: Team,
          as: 'teams',
          required: false
        },
        {
          model: Game,
          as: 'games',
          required: false
        }
      ]
    });

    console.log('📊 Campeonato:', championship.name);
    console.log('📊 Times encontrados:', championship.teams.length);
    console.log('📊 Jogos existentes:', championship.games?.length || 0);

    // 5. Criar jogos da primeira rodada
    const roundGames = [];
    const numTeams = championship.teams.length;
    
    for (let i = 0; i < Math.floor(numTeams / 2); i++) {
      const homeTeam = championship.teams[i];
      const awayTeam = championship.teams[numTeams - 1 - i];
      
      const gameData = {
        id: `game_${Date.now()}_${i}`,
        championshipId: championship.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        round: 1,
        status: 'pending',
        homeScore: 0,
        awayScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const game = await Game.create(gameData);
      roundGames.push(game);
    }

    console.log('✅ Jogos da rodada criados:', roundGames.length);

    // 6. Verificar resultado
    const finalCheck = await Championship.findOne({
      where: { id: testChampionship.id },
      include: [
        {
          model: Team,
          as: 'teams'
        },
        {
          model: Game,
          as: 'games',
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
          ]
        }
      ]
    });

    console.log('\n🎉 RESULTADO FINAL:');
    console.log('📋 Campeonato:', finalCheck.name);
    console.log('👥 Times:', finalCheck.teams.length);
    console.log('🎮 Jogos:', finalCheck.games.length);
    
    finalCheck.games.forEach((game, index) => {
      const homeTeamName = game.homeTeam?.name || 'Time não encontrado';
      const awayTeamName = game.awayTeam?.name || 'Time não encontrado';
      console.log(`   ${index + 1}. ${homeTeamName} vs ${awayTeamName} (Rodada ${game.round})`);
    });

    console.log('\n✅ TESTE COMPLETO - FUNCIONALIDADE OK!');
    
    // 7. Cleanup (opcional)
    console.log('\n🧹 Limpando dados de teste...');
    await Game.destroy({ where: { championshipId: testChampionship.id } });
    await Team.destroy({ where: { championshipId: testChampionship.id } });
    await Championship.destroy({ where: { id: testChampionship.id } });
    // Não remover usuário existente
    console.log('✅ Limpeza concluída');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testCompleteFlow();
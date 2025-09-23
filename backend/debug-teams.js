const { Championship, Team, User } = require('./models');

async function debugTeams() {
  try {
    console.log('🔍 Debugging teams...');
    
    // Buscar todos os campeonatos
    const championships = await Championship.findAll({
      include: [
        {
          model: Team,
          as: 'teams',
          required: false
        }
      ]
    });
    
    console.log('📊 Total de campeonatos encontrados:', championships.length);
    
    championships.forEach((champ, index) => {
      console.log(`\n${index + 1}. Campeonato: ${champ.name} (${champ.id})`);
      console.log(`   - CreatedBy: ${champ.createdBy}`);
      console.log(`   - Times: ${champ.teams?.length || 0}`);
      
      if (champ.teams && champ.teams.length > 0) {
        champ.teams.forEach((team, teamIndex) => {
          console.log(`     ${teamIndex + 1}. ${team.name} (${team.id})`);
        });
      } else {
        console.log('     ❌ Nenhum time encontrado');
      }
    });
    
    // Buscar todos os times soltos
    const allTeams = await Team.findAll();
    console.log(`\n🏈 Total de times na base: ${allTeams.length}`);
    
    if (allTeams.length > 0) {
      console.log('\nTimes encontrados:');
      allTeams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name} - Championship: ${team.championshipId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

debugTeams();
// Teste de debug para o erro 500
console.log('🔍 Debugando erro 500...');

// Simular o processo de gerar rodada
const testGenerateRound = async () => {
  try {
    console.log('1. Testando importação do sequelize...');
    const sequelize = require('./config/database');
    console.log('✅ Sequelize importado:', typeof sequelize);

    console.log('2. Testando conexão com banco...');
    await sequelize.authenticate();
    console.log('✅ Conexão com banco OK');

    console.log('3. Testando importação dos modelos...');
    const { Championship, Team, Game } = require('./models');
    console.log('✅ Modelos importados:', { 
      Championship: typeof Championship, 
      Team: typeof Team, 
      Game: typeof Game 
    });

    console.log('4. Testando busca de campeonato...');
    const championship = await Championship.findOne({
      where: { id: 'champ_1758468568495' },
      include: [
        { model: Team, as: 'teams' },
        { model: Game, as: 'games' }
      ]
    });
    
    if (championship) {
      console.log('✅ Campeonato encontrado:', championship.name);
      console.log('✅ Times:', championship.teams?.length || 0);
      console.log('✅ Jogos:', championship.games?.length || 0);
    } else {
      console.log('❌ Campeonato não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro encontrado:', error.message);
    console.error('Stack:', error.stack);
  }
};

testGenerateRound();
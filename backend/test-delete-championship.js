// Teste da funcionalidade de exclusão de campeonato
require('dotenv').config();
const sequelize = require('./config/database');
const { Championship } = require('./models');

async function testDeleteChampionship() {
  try {
    console.log('🔍 Testando conexão com o banco...');
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');

    console.log('\n📋 Listando campeonatos existentes...');
    const championships = await Championship.findAll({
      attributes: ['id', 'name', 'createdBy'],
      raw: true
    });
    
    console.log('Campeonatos encontrados:', championships.length);
    championships.forEach(c => {
      console.log(`- ID: ${c.id}, Nome: ${c.name}, Criador: ${c.createdBy}`);
    });

    if (championships.length > 0) {
      const testId = championships[0].id;
      const testCreatedBy = championships[0].createdBy;
      
      console.log(`\n🗑️ Testando exclusão do campeonato ${testId} criado por ${testCreatedBy}...`);
      
      // Simular verificação de propriedade
      const championship = await Championship.findOne({
        where: { id: testId, createdBy: testCreatedBy },
      });

      if (championship) {
        console.log('✅ Campeonato encontrado e pertence ao usuário');
        console.log('⚠️ Não vou excluir na verdade - apenas teste');
        // await championship.destroy(); // Comentado para não excluir de verdade
      } else {
        console.log('❌ Campeonato não encontrado ou não pertence ao usuário');
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testDeleteChampionship();
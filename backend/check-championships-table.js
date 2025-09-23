// Verificar estrutura da tabela championships
const sequelize = require('./config/database');

const checkChampionshipsTable = async () => {
  try {
    console.log('🔍 Verificando estrutura da tabela championships...');
    
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'championships'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas da tabela championships:');
    results.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar registros existentes
    console.log('\n🔍 Verificando IDs existentes...');
    const [championships] = await sequelize.query(`
      SELECT id, name FROM championships LIMIT 5;
    `);
    
    console.log('📋 Campeonatos encontrados:');
    championships.forEach(champ => {
      console.log(`- ID: ${champ.id} | Nome: ${champ.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela championships:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkChampionshipsTable();
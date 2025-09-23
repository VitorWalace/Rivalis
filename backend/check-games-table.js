// Verificar estrutura da tabela games
const sequelize = require('./config/database');

const checkGamesTable = async () => {
  try {
    console.log('🔍 Verificando estrutura da tabela games...');
    
    // Query para listar colunas da tabela games
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Games'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas encontradas na tabela Games:');
    results.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar especificamente se scheduledAt existe
    const hasScheduledAt = results.some(col => col.column_name === 'scheduledAt');
    console.log(`\n🎯 Coluna 'scheduledAt' existe: ${hasScheduledAt ? '✅' : '❌'}`);
    
    if (!hasScheduledAt) {
      console.log('\n🔧 Precisa adicionar a coluna scheduledAt à tabela Games');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkGamesTable();
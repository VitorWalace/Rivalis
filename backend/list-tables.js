// Verificar nomes das tabelas
const sequelize = require('./config/database');

const checkTables = async () => {
  try {
    console.log('🔍 Listando todas as tabelas...');
    
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas:');
    results.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkTables();
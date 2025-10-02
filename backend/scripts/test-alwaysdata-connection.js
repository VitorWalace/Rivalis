const sequelize = require('../config/database');
require('dotenv').config();

async function testAlwaysDataConnection() {
  console.log('🔧 Testando conexão com AlwaysData...');
  console.log('Configuração:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    dialect: process.env.DB_DIALECT
  });

  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com AlwaysData estabelecida com sucesso!');
    
    // Sincronizar modelos (criar tabelas se não existirem)
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados com sucesso!');
    
    // Listar tabelas
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('📊 Tabelas no banco:', results.map(r => Object.values(r)[0]));
    
    await sequelize.close();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    console.error('Detalhes do erro:', error.message);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testAlwaysDataConnection();
}

module.exports = { testAlwaysDataConnection };
// Legacy filename mantido por compatibilidade. Agora testa MySQL.
const sequelize = require('../config/database');
require('dotenv').config();

async function testMysqlConnection() {
  console.log('🔧 Testando conexão com MySQL...');
  console.log('Configuração:', {
    url: process.env.MYSQL_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    dialect: process.env.DB_DIALECT
  });

  try {
    console.log('📡 Tentando conectar...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');

    console.log('📊 Verificando tabelas existentes...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    const names = tables
      .map(table => typeof table === 'string' ? table : table.tableName || table.name || JSON.stringify(table));
    console.log('📋 Tabelas encontradas:', names);

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Modelos sincronizados com sucesso!');

    const tablesAfter = await sequelize.getQueryInterface().showAllTables();
    const namesAfter = tablesAfter
      .map(table => typeof table === 'string' ? table : table.tableName || table.name || JSON.stringify(table));
    console.log('📊 Tabelas após sincronização:', namesAfter);

    await sequelize.close();
    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.name);
    console.error('📋 Detalhes:', error.message);

    if (error.message.includes('ENOTFOUND')) {
      console.error('🔗 Verifique se o HOST está correto no .env');
    }
    if (error.message.includes('Access denied')) {
      console.error('🔐 Verifique usuário/senha do banco');
    }
    if (error.message.includes('Unknown database')) {
      console.error('🗃️ Verifique se o DATABASE existe');
    }
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  testMysqlConnection();
}

module.exports = { testMysqlConnection };
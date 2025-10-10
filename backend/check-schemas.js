const sequelize = require('./config/database');

async function checkTables() {
  console.log('🔎 Dialeto atual:', sequelize.getDialect());

  try {
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida');

    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('\n📊 Tabelas disponíveis:');
    tables
      .map(table => typeof table === 'string' ? table : table.tableName || table.name || JSON.stringify(table))
      .sort()
      .forEach(name => console.log('  -', name));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
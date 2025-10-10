const sequelize = require('./config/database');

async function testDatabase() {
  console.log('🔍 Testando conexão com banco de dados...');
  console.log('📊 Ambiente:', process.env.NODE_ENV);
  console.log('🔗 Dialeto detectado:', sequelize.getDialect());

  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');

    const [version] = await sequelize.query('SELECT VERSION() AS version;');
    console.log('🗄️ Versão do MySQL:', version[0].version);

    const tables = await sequelize.getQueryInterface().showAllTables();
    const normalized = tables.map(table => typeof table === 'string' ? table : table.tableName || table.name || JSON.stringify(table));
    console.log('📦 Tabelas encontradas:', normalized);

    const hasUsers = normalized.includes('users');
    console.log('👥 Tabela users existe:', hasUsers);

    if (hasUsers) {
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users;');
      console.log('👤 Número de usuários na base:', userCount[0].count);
    } else {
      console.log('⚠️ Tabela users não encontrada. Execute `npm run init-db`.');
    }
  } catch (error) {
    console.error('❌ Erro na conexão com banco de dados:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexão encerrada');
  }
}

testDatabase();
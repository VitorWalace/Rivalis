const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log,
});

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    
    // Listar tabelas
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('📋 Tabelas no banco:', results.map(r => r.name));
    
    // Verificar se a tabela users existe
    const [userTable] = await sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='users';");
    if (userTable.length > 0) {
      console.log('👤 Estrutura da tabela users:', userTable[0].sql);
      
      // Contar usuários
      const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM users;");
      console.log('👥 Total de usuários:', userCount[0].count);
    } else {
      console.log('⚠️ Tabela users não encontrada');
    }
    
    await sequelize.close();
    console.log('✅ Teste completo!');
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
  }
}

testDatabase();
const sequelize = require('../config/database');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔧 Testando conexão com Supabase...');
  console.log('Configuração:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    dialect: process.env.DB_DIALECT
  });

  try {
    // Testar conexão
    console.log('📡 Tentando conectar...');
    await sequelize.authenticate();
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    
    // Listar tabelas existentes
    console.log('📊 Verificando tabelas existentes...');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas:', results.map(r => r.table_name));
    
    // Sincronizar modelos (criar tabelas se não existirem)
    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Modelos sincronizados com sucesso!');
    
    // Verificar tabelas criadas
    const [newResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tabelas após sincronização:', newResults.map(r => r.table_name));
    
    await sequelize.close();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.name);
    console.error('📋 Detalhes:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('🔗 Verifique se o HOST está correto no .env');
    }
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Verifique se a SENHA está correta no .env');
    }
    if (error.message.includes('does not exist')) {
      console.error('🗃️ Verifique se o DATABASE existe');
    }
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection };
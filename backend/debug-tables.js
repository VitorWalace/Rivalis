const { Sequelize } = require('sequelize');
require('dotenv').config();

async function debugTables() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  });
  
  try {
    console.log('🔍 Verificando onde está a tabela users...');
    
    const [allTables] = await sequelize.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE tablename LIKE '%user%' 
      ORDER BY schemaname, tablename;
    `);
    
    console.log('\n📋 Tabelas relacionadas a users:');
    allTables.forEach(t => {
      console.log(`  - ${t.schemaname}.${t.tablename}`);
    });
    
    // Vamos tentar acessar a tabela users diretamente
    console.log('\n🔍 Tentando acessar auth.users...');
    try {
      const [authUsers] = await sequelize.query('SELECT id, email FROM auth.users LIMIT 3;');
      console.log('✅ Usuários em auth.users:');
      authUsers.forEach(u => console.log(`  - ${u.email} (${u.id})`));
    } catch (err) {
      console.log('❌ Erro ao acessar auth.users:', err.message);
    }
    
    console.log('\n🔍 Tentando acessar public.users...');
    try {
      const [publicUsers] = await sequelize.query('SELECT id, email FROM public.users LIMIT 3;');
      console.log('✅ Usuários em public.users:');
      publicUsers.forEach(u => console.log(`  - ${u.email} (${u.id})`));
    } catch (err) {
      console.log('❌ Erro ao acessar public.users:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugTables();
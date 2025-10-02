const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkSchemas() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  });
  
  try {
    const [schemas] = await sequelize.query('SELECT schema_name FROM information_schema.schemata;');
    console.log('📊 Schemas disponíveis:');
    schemas.forEach(s => console.log('  -', s.schema_name));
    
    const [publicTables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log('\n🏗️ Tabelas no schema public:');
    publicTables.forEach(t => console.log('  -', t.table_name));
    
    try {
      const [authTables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth';");
      console.log('\n🔐 Tabelas no schema auth:');
      authTables.forEach(t => console.log('  -', t.table_name));
    } catch (err) {
      console.log('\n🔐 Schema auth não encontrado ou inacessível');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkSchemas();
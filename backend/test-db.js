const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testDatabase() {
  console.log('🔍 Testando conexão com banco de dados...');
  console.log('📊 Environment:', process.env.NODE_ENV);
  console.log('🔗 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('🔗 POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
  
  let sequelize;

  if (process.env.POSTGRES_URL) {
    console.log('🚀 Usando POSTGRES_URL');
    sequelize = new Sequelize(process.env.POSTGRES_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: console.log,
    });
  } else if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')) {
    console.log('🚀 Usando DATABASE_URL (Supabase)');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
      },
    });
  } else {
    console.log('❌ Nenhuma URL de banco de dados encontrada');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    
    // Testar uma query simples
    const [results] = await sequelize.query("SELECT version();");
    console.log('🗄️ Versão do PostgreSQL:', results[0].version);
    
    // Verificar se a tabela users existe
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='users';");
    console.log('👥 Tabela users existe:', tables.length > 0);
    
    if (tables.length > 0) {
      const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM users;");
      console.log('👤 Número de usuários na base:', userCount[0].count);
    } else {
      console.log('⚠️ Tabela users não encontrada. Pode ser necessário rodar migrations.');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão com banco de dados:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Conexão fechada');
    }
  }
}

testDatabase();
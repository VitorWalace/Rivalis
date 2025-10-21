const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testando conexão com MySQL...\n');

  // Verificar variáveis de ambiente
  console.log('📋 Variáveis de ambiente:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado');
  console.log('  MYSQL_URL:', process.env.MYSQL_URL ? '✅ Configurado' : '❌ Não configurado');
  console.log('  DB_HOST:', process.env.DB_HOST || '❌ Não configurado');
  console.log('  DB_USER:', process.env.DB_USER || '❌ Não configurado');
  console.log('  DB_NAME:', process.env.DB_NAME || '❌ Não configurado');
  console.log('');

  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (!connectionUrl && !process.env.DB_HOST) {
    console.log('⚠️  Nenhuma configuração MySQL encontrada!');
    console.log('');
    console.log('📝 Para usar MySQL, configure uma das opções no arquivo .env:');
    console.log('');
    console.log('OPÇÃO 1 - MySQL Local (XAMPP, WAMP, etc):');
    console.log('  DB_HOST=localhost');
    console.log('  DB_PORT=3306');
    console.log('  DB_NAME=rivalis');
    console.log('  DB_USER=root');
    console.log('  DB_PASSWORD=sua_senha');
    console.log('');
    console.log('OPÇÃO 2 - MySQL Railway (copie do Railway):');
    console.log('  DATABASE_URL=mysql://user:password@host:port/database');
    console.log('');
    console.log('💡 Se não configurar nada, o sistema usará SQLite automaticamente.');
    process.exit(1);
  }

  let sequelize;

  try {
    if (connectionUrl) {
      console.log('🔗 Tentando conectar via DATABASE_URL...');
      sequelize = new Sequelize(connectionUrl, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          connectTimeout: 10000,
          ssl: {
            rejectUnauthorized: false
          }
        }
      });
    } else {
      console.log('🔗 Tentando conectar via credenciais separadas...');
      sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: false,
          dialectOptions: {
            connectTimeout: 10000,
          }
        }
      );
    }

    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    console.log('');
    
    // Mostrar informações da conexão
    const [results] = await sequelize.query('SELECT VERSION() as version, DATABASE() as db_name');
    console.log('📊 Informações do banco:');
    console.log('  Versão MySQL:', results[0].version);
    console.log('  Database:', results[0].db_name);
    console.log('');

    await sequelize.close();
    console.log('🎉 Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:');
    console.error('');
    console.error('Detalhes do erro:', error.message);
    console.error('');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Dicas:');
      console.log('  1. Verifique se o MySQL está rodando');
      console.log('  2. Confirme o host e porta (geralmente localhost:3306)');
      console.log('  3. Se usar XAMPP/WAMP, inicie o MySQL');
    } else if (error.message.includes('Access denied')) {
      console.log('💡 Dicas:');
      console.log('  1. Verifique o usuário e senha no .env');
      console.log('  2. Confirme se o usuário tem permissão no banco');
    } else if (error.message.includes('Unknown database')) {
      console.log('💡 Dicas:');
      console.log('  1. Crie o banco de dados no MySQL');
      console.log('  2. Execute: CREATE DATABASE rivalis;');
    }
    
    console.log('');
    console.log('⚠️  O servidor continuará usando SQLite como fallback.');
    process.exit(1);
  }
}

testConnection();

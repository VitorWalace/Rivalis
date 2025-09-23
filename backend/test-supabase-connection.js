const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Testando conexão com Supabase...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL não definida no .env');
    return;
  }

  // Teste com diferentes configurações
  const configs = [
    {
      name: 'Configuração 1 - SSL obrigatório',
      config: {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: console.log
      }
    },
    {
      name: 'Configuração 2 - SSL opcional',
      config: {
        dialect: 'postgres',
        dialectOptions: {
          ssl: false
        },
        logging: console.log
      }
    },
    {
      name: 'Configuração 3 - Sem SSL',
      config: {
        dialect: 'postgres',
        logging: console.log
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`\n📡 Testando ${name}...`);
      const sequelize = new Sequelize(process.env.DATABASE_URL, config);
      
      await sequelize.authenticate();
      console.log(`✅ ${name} - Conexão estabelecida com sucesso!`);
      
      await sequelize.close();
      return true;
    } catch (error) {
      console.log(`❌ ${name} - Erro:`, error.message);
    }
  }
  
  console.log('\n🔄 Todas as configurações falharam. Tentando credenciais alternativas...');
  
  // URLs alternativas baseadas no histórico
  const alternativeUrls = [
    'postgresql://postgres.wqtvofgzpilkqzdjpzqy:Vitor2001!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres:Vitor2001!@db.wqtvofgzpilkqzdjpzqy.supabase.co:5432/postgres'
  ];
  
  for (const url of alternativeUrls) {
    try {
      console.log(`\n📡 Testando URL alternativa...`);
      const sequelize = new Sequelize(url, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: console.log
      });
      
      await sequelize.authenticate();
      console.log(`✅ URL alternativa funcionou! Use esta: ${url}`);
      
      await sequelize.close();
      return true;
    } catch (error) {
      console.log(`❌ URL alternativa falhou:`, error.message);
    }
  }
  
  return false;
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Pelo menos uma configuração funcionou!');
  } else {
    console.log('\n💡 Nenhuma configuração funcionou. Considere:');
    console.log('1. Verificar se as credenciais do Supabase estão corretas');
    console.log('2. Verificar se o projeto Supabase está ativo');
    console.log('3. Usar SQLite como fallback temporário');
  }
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro durante o teste:', error);
  process.exit(1);
});
const { Sequelize } = require('sequelize');
require('dotenv').config();

// CONFIGURAÇÃO HÍBRIDA: TENTA SUPABASE, FALLBACK PARA SQLITE
console.log('🗃️ Configurando banco de dados...');

let sequelize;

async function createSequelizeInstance() {
  if (process.env.DATABASE_URL) {
    console.log('📡 Tentando conectar ao Supabase PostgreSQL...');
    
    // Configuração para Supabase
    const supabaseSequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 60000,
        idle: 10000
      }
    });

    try {
      // Testa a conexão
      await supabaseSequelize.authenticate();
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      return supabaseSequelize;
    } catch (error) {
      console.log('❌ Falha na conexão com Supabase:', error.message);
      console.log('🔄 Fazendo fallback para SQLite...');
      
      // Fecha a conexão falhada
      await supabaseSequelize.close().catch(() => {});
    }
  }

  // Fallback para SQLite
  console.log('🗃️ Usando SQLite como banco de dados');
  const sqliteSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });

  try {
    await sqliteSequelize.authenticate();
    console.log('✅ Conexão com SQLite estabelecida com sucesso!');
    return sqliteSequelize;
  } catch (error) {
    console.error('💥 Falha crítica: Não foi possível conectar nem ao Supabase nem ao SQLite');
    throw error;
  }
}

// Criar instância de forma síncrona para compatibilidade
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

// Função para testar e fazer fallback se necessário
sequelize.fallbackToSQLite = async function() {
  try {
    await this.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
  } catch (error) {
    if (this.getDialect() === 'postgres') {
      console.log('❌ Falha na conexão PostgreSQL:', error.message);
      console.log('🔄 Fazendo fallback para SQLite...');
      
      // Criar nova instância SQLite
      const sqliteSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      });
      
      await sqliteSequelize.authenticate();
      console.log('✅ Fallback para SQLite estabelecido!');
      
      // Substituir a instância global
      Object.setPrototypeOf(sequelize, Object.getPrototypeOf(sqliteSequelize));
      Object.assign(sequelize, sqliteSequelize);
    } else {
      throw error;
    }
  }
};

module.exports = sequelize;
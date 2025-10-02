const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Detectar ambiente e configurar banco adequadamente
if (process.env.DATABASE_URL) {
  // Railway, Render, Supabase ou qualquer provider com DATABASE_URL
  console.log('🐘 Conectando ao PostgreSQL via DATABASE_URL');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else if (process.env.POSTGRES_URL) {
  // Vercel Postgres (Produção)
  console.log('🐘 Conectando ao Vercel Postgres');
  sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else if (process.env.DB_HOST && process.env.DB_NAME) {
  // PostgreSQL com credenciais separadas (desenvolvimento local)
  console.log('🐘 Conectando ao PostgreSQL local');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
      },
    }
  );
} else if (process.env.DB_DIALECT === 'mysql' && process.env.DB_HOST && process.env.DB_NAME) {
  // MySQL AlwaysData (Produção/Desenvolvimento)
  sequelize = new Sequelize(
    process.env.DATABASE_URL || {
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
    },
    {
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
      },
    }
  );
} else if (process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_NAME)) {
  // PostgreSQL tradicional (Desenvolvimento)
  sequelize = new Sequelize(
    process.env.DATABASE_URL || {
      database: process.env.DB_NAME || 'rivalis_db',
      username: process.env.DB_USER || 'usuario',
      password: process.env.DB_PASSWORD || 'senha',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
    },
    {
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  // SQLite (Fallback para desenvolvimento local)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

module.exports = sequelize;
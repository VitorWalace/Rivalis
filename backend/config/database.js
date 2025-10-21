const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isDev = process.env.NODE_ENV === 'development';

const poolConfig = {
  max: Number(process.env.DB_POOL_MAX || 10),
  min: Number(process.env.DB_POOL_MIN || 0),
  acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
  idle: Number(process.env.DB_POOL_IDLE || 10000),
};

const shouldUseSsl = () => {
  const flag = (process.env.DB_SSL || process.env.MYSQL_SSL || '').toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'on';
};

const buildMysqlOptions = () => {
  const options = {
    dialect: 'mysql',
    logging: isDev ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    timezone: process.env.DB_TIMEZONE || '+00:00',
    dialectOptions: {
      connectTimeout: 60000,
      ssl: {
        rejectUnauthorized: false
      },
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /PROTOCOL_CONNECTION_LOST/,
      ],
      max: 3
    }
  };

  return options;
};

const inferDialectFromUrl = (url) => {
  try {
    const protocol = new URL(url).protocol.replace(':', '');
    return protocol;
  } catch (err) {
    return null;
  }
};

let sequelize;

const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const forcedDialect = (process.env.DB_DIALECT || '').toLowerCase();

if (connectionUrl) {
  const inferredDialect = inferDialectFromUrl(connectionUrl);
  if (inferredDialect && !inferredDialect.startsWith('mysql')) {
    throw new Error(`A aplicação agora suporta apenas MySQL. Atualize sua DATABASE_URL (dialeto detectado: ${inferredDialect}).`);
  }

  console.log('🐬 Conectando ao MySQL via DATABASE_URL');
  sequelize = new Sequelize(connectionUrl, buildMysqlOptions());
} else if ((forcedDialect === 'mysql' || !forcedDialect) && process.env.DB_HOST && process.env.DB_NAME) {
  console.log('🐬 Conectando ao MySQL com variáveis separadas');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      ...buildMysqlOptions(),
    }
  );
} else {
  console.warn('⚠️ Nenhuma configuração MySQL encontrada. Usando SQLite local como fallback.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: isDev ? console.log : false,
  });
}

module.exports = sequelize;
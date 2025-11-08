const sequelize = require('../config/database');

async function addLineupColumns() {
  try {
    console.log('🔄 Verificando e adicionando colunas homeLineup e awayLineup...');

    // Verificar se homeLineup já existe
    const [homeResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'games' 
      AND COLUMN_NAME = 'homeLineup'
    `);

    if (homeResults.length === 0) {
      console.log('➕ Adicionando coluna homeLineup...');
      await sequelize.query(`
        ALTER TABLE games 
        ADD COLUMN homeLineup JSON DEFAULT (JSON_ARRAY())
        COMMENT 'Array de IDs dos jogadores do time mandante que participaram'
      `);
      console.log('✅ Coluna homeLineup adicionada');
    } else {
      console.log('✅ Coluna homeLineup já existe');
    }

    // Verificar se awayLineup já existe
    const [awayResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'games' 
      AND COLUMN_NAME = 'awayLineup'
    `);

    if (awayResults.length === 0) {
      console.log('➕ Adicionando coluna awayLineup...');
      await sequelize.query(`
        ALTER TABLE games 
        ADD COLUMN awayLineup JSON DEFAULT (JSON_ARRAY())
        COMMENT 'Array de IDs dos jogadores do time visitante que participaram'
      `);
      console.log('✅ Coluna awayLineup adicionada');
    } else {
      console.log('✅ Coluna awayLineup já existe');
    }

    console.log('✅ Processo concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

addLineupColumns();

// Script para garantir que a coluna createdBy exista em championships
const { sequelize } = require('../config/database');

async function ensureColumn() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'championships' AND column_name = 'createdBy';
    `);

    if (results.length === 0) {
      console.log('🛠  Adicionando coluna createdBy em championships...');
      await sequelize.query(`ALTER TABLE championships ADD COLUMN "createdBy" UUID NULL;`);
      console.log('✅ Coluna criada.');
    } else {
      console.log('✅ Coluna createdBy já existe.');
    }

    process.exit(0);
  } catch (e) {
    console.error('❌ Erro ao garantir coluna createdBy:', e.message);
    process.exit(1);
  }
}

ensureColumn();

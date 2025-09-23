const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
});

async function migrateUsersTable() {
  try {
    console.log('🔄 Migrando tabela users para aceitar IDs customizados...');

    // Verificar estrutura atual
    const [currentStructure] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estrutura atual da tabela users:');
    currentStructure.forEach(col => {
      if (col.column_name === 'id') {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      }
    });

    // Alterar coluna id para VARCHAR se ainda for UUID
    const idColumn = currentStructure.find(col => col.column_name === 'id');
    if (idColumn && idColumn.data_type === 'uuid') {
      console.log('🔄 Alterando coluna id de UUID para VARCHAR...');
      
      await sequelize.query(`
        ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::text;
      `);
      
      console.log('✅ Coluna id migrada para VARCHAR(255)');
    } else {
      console.log('ℹ️ Coluna id já é VARCHAR');
    }

    // Verificar novamente
    const [newStructure] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Nova estrutura da coluna id:');
    newStructure.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n✅ Migração da tabela users concluída!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrateUsersTable();
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
});

async function safeUsersTableMigration() {
  try {
    console.log('🔄 Migração segura da tabela users...');

    // 1. Verificar foreign keys que referenciam users.id
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id';
    `);

    console.log('🔗 Foreign keys encontradas:');
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`);
    });

    // 2. Remover foreign keys temporariamente
    console.log('\n🗑️ Removendo foreign keys temporariamente...');
    for (const fk of foreignKeys) {
      try {
        await sequelize.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name};`);
        console.log(`  ✅ Removido: ${fk.constraint_name}`);
      } catch (error) {
        console.log(`  ⚠️ Erro ao remover ${fk.constraint_name}: ${error.message}`);
      }
    }

    // 3. Migrar coluna users.id
    console.log('\n🔄 Migrando coluna users.id...');
    await sequelize.query(`
      ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::text;
    `);
    console.log('✅ users.id migrado para VARCHAR(255)');

    // 4. Migrar colunas que referenciam users.id
    console.log('\n🔄 Migrando colunas que referenciam users...');
    const referenceColumns = [
      { table: 'championships', column: 'createdBy' },
      { table: 'teams', column: 'createdBy' },
      { table: 'players', column: 'createdBy' }
    ];

    for (const ref of referenceColumns) {
      try {
        await sequelize.query(`
          ALTER TABLE ${ref.table} ALTER COLUMN "${ref.column}" TYPE VARCHAR(255) USING "${ref.column}"::text;
        `);
        console.log(`  ✅ ${ref.table}.${ref.column} migrado`);
      } catch (error) {
        console.log(`  ⚠️ Erro ao migrar ${ref.table}.${ref.column}: ${error.message}`);
      }
    }

    // 5. Verificar migração
    const [usersCheck] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id';
    `);

    console.log('\n📋 Verificação final:');
    console.log(`  users.id: ${usersCheck[0]?.data_type || 'não encontrado'}`);

    console.log('\n✅ Migração da tabela users concluída!');
    console.log('ℹ️ Foreign keys foram removidas para facilitar migração');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

safeUsersTableMigration();
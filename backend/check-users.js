const sequelize = require('./config/database');

async function checkUserTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida');

    const [columns] = await sequelize.query('DESCRIBE users;');
    console.log('📋 Estrutura da tabela users:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    const [recentUsers] = await sequelize.query(`
      SELECT id, name, email, createdAt, isActive
      FROM users
      ORDER BY createdAt DESC
      LIMIT 3;
    `);

    console.log('\n👤 Usuários recentes:');
    recentUsers.forEach(user => {
      console.log(`  ${user.name} (${user.email}) - ${user.createdAt} - Ativo: ${user.isActive}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUserTable();
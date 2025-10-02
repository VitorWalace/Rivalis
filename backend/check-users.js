const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkUserTable() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  });
  
  try {
    const [tables] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura da tabela users:');
    tables.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verificar se há algum erro recente ao criar usuários
    const [recentUsers] = await sequelize.query(`
      SELECT id, name, email, "createdAt", "isActive"
      FROM users 
      ORDER BY "createdAt" DESC 
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
const sequelize = require('./config/database');
const User = require('./models/User');

async function createTestUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Sincronizar modelos
    await sequelize.sync();
    console.log('✅ Modelos sincronizados');

    // Verificar se já existe um usuário
    const existingUser = await User.findOne({ where: { email: 'teste@teste.com' } });
    
    if (existingUser) {
      console.log('ℹ️ Usuário de teste já existe:');
      console.log({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      });
      return;
    }

    // Criar usuário de teste
    const user = await User.create({
      name: 'Usuário Teste',
      email: 'teste@teste.com',
      password: '123456',
    });

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '123456 (senha original)',
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createTestUser();

const sequelize = require('./config/database');
const User = require('./models/User');

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    await sequelize.sync();

    const user = await User.findOne({ where: { email: 'teste@teste.com' } });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }

    // Atualizar senha - o hook beforeUpdate vai criptografar automaticamente
    await user.update({ password: '123456' });

    console.log('✅ Senha atualizada com sucesso!');
    console.log('Email: teste@teste.com');
    console.log('Senha: 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

resetPassword();

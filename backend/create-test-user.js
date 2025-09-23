const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    await sequelize.sync({ force: true }); // FORCE TRUE para recriar tabelas
    console.log('✅ Tabelas criadas/recriadas');
    
    const User = require('./models/User');
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await User.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Usuário Teste',
      email: 'teste@teste.com',
      password: hashedPassword,
      isActive: true
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email: teste@teste.com');
    console.log('🔑 Senha: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();
const sequelize = require('./config/database');

(async () => {
  try {
    console.log('🔧 Inicializando banco SQLite...');
    
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Força recriar todas as tabelas
    await sequelize.drop();
    console.log('✅ Tabelas antigas removidas');
    
    await sequelize.sync({ force: true });
    console.log('✅ Novas tabelas criadas');
    
    console.log('🎉 Banco SQLite inicializado com sucesso!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();
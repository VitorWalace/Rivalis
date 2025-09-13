const sequelize = require('../config/database');
const User = require('../models/User');

const initDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida!');
    
    // Sincronizar modelos (criar tabelas)
    await sequelize.sync({ force: false });
    console.log('✅ Tabelas criadas/sincronizadas!');
    
    console.log('🎉 Banco de dados inicializado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
};

initDatabase();
const sequelize = require('../config/database');
// Importar TODOS os modelos para criar todas as tabelas
const User = require('../models/User');
const Championship = require('../models/Championship');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Game = require('../models/Game');
const Goal = require('../models/Goal');

const initDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    console.log('📦 Banco:', sequelize.config.database || 'SQLite');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Sincronizar todos os modelos (criar todas as tabelas)
    console.log('📋 Criando tabelas...');
    await sequelize.sync({ force: false, alter: false });
    
    // Listar tabelas criadas
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n✅ Tabelas criadas/sincronizadas:');
    results.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n🎉 Banco de dados inicializado com sucesso!');
    console.log('\n📊 Estrutura criada:');
    console.log('  ├─ users (Usuários)');
    console.log('  ├─ championships (Campeonatos)');
    console.log('  ├─ teams (Times)');
    console.log('  ├─ players (Jogadores)');
    console.log('  ├─ games (Partidas)');
    console.log('  └─ goals (Gols)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

initDatabase();
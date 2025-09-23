// Migração para alterar tipo de ID das tabelas
const sequelize = require('./config/database');

const migrateIdTypes = async () => {
  try {
    console.log('🔧 Alterando tipos de ID para permitir strings customizadas...');
    
    // Alterar championships.id para VARCHAR
    await sequelize.query(`
      ALTER TABLE "championships" 
      ALTER COLUMN "id" TYPE VARCHAR(255);
    `);
    console.log('✅ championships.id alterado para VARCHAR');
    
    // Alterar teams.id para VARCHAR
    await sequelize.query(`
      ALTER TABLE "teams" 
      ALTER COLUMN "id" TYPE VARCHAR(255);
    `);
    console.log('✅ teams.id alterado para VARCHAR');
    
    // Alterar players.id para VARCHAR
    await sequelize.query(`
      ALTER TABLE "players" 
      ALTER COLUMN "id" TYPE VARCHAR(255);
    `);
    console.log('✅ players.id alterado para VARCHAR');
    
    // Alterar chaves estrangeiras relacionadas
    await sequelize.query(`
      ALTER TABLE "teams" 
      ALTER COLUMN "championshipId" TYPE VARCHAR(255);
    `);
    console.log('✅ teams.championshipId alterado para VARCHAR');
    
    await sequelize.query(`
      ALTER TABLE "players" 
      ALTER COLUMN "teamId" TYPE VARCHAR(255);
    `);
    console.log('✅ players.teamId alterado para VARCHAR');
    
    await sequelize.query(`
      ALTER TABLE "games" 
      ALTER COLUMN "championshipId" TYPE VARCHAR(255);
    `);
    console.log('✅ games.championshipId alterado para VARCHAR');
    
    await sequelize.query(`
      ALTER TABLE "games" 
      ALTER COLUMN "homeTeamId" TYPE VARCHAR(255);
    `);
    console.log('✅ games.homeTeamId alterado para VARCHAR');
    
    await sequelize.query(`
      ALTER TABLE "games" 
      ALTER COLUMN "awayTeamId" TYPE VARCHAR(255);
    `);
    console.log('✅ games.awayTeamId alterado para VARCHAR');
    
    await sequelize.query(`
      ALTER TABLE "goals" 
      ALTER COLUMN "gameId" TYPE VARCHAR(255);
    `);
    console.log('✅ goals.gameId alterado para VARCHAR');
    
    await sequelize.query(`
      ALTER TABLE "goals" 
      ALTER COLUMN "playerId" TYPE VARCHAR(255);
    `);
    console.log('✅ goals.playerId alterado para VARCHAR');
    
    console.log('\n🎉 Migração de tipos de ID concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
  } finally {
    await sequelize.close();
  }
};

migrateIdTypes();
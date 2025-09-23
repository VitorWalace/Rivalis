// Migração segura removendo constraints primeiro
const sequelize = require('./config/database');

const safeIdMigration = async () => {
  try {
    console.log('🔧 Migração segura de tipos de ID...');
    
    // 1. Remover todas as foreign key constraints
    console.log('1️⃣ Removendo constraints...');
    
    const dropConstraints = [
      'ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_championshipId_fkey"',
      'ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_teamId_fkey"', 
      'ALTER TABLE "games" DROP CONSTRAINT IF EXISTS "games_championshipId_fkey"',
      'ALTER TABLE "games" DROP CONSTRAINT IF EXISTS "games_homeTeamId_fkey"',
      'ALTER TABLE "games" DROP CONSTRAINT IF EXISTS "games_awayTeamId_fkey"',
      'ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_gameId_fkey"',
      'ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_playerId_fkey"'
    ];
    
    for (const constraint of dropConstraints) {
      try {
        await sequelize.query(constraint);
        console.log(`✅ Constraint removida`);
      } catch (error) {
        console.log(`ℹ️ Constraint não existia ou já removida`);
      }
    }
    
    // 2. Alterar tipos de coluna
    console.log('2️⃣ Alterando tipos de coluna...');
    
    const alterColumns = [
      'ALTER TABLE "championships" ALTER COLUMN "id" TYPE VARCHAR(255)',
      'ALTER TABLE "teams" ALTER COLUMN "id" TYPE VARCHAR(255)',
      'ALTER TABLE "teams" ALTER COLUMN "championshipId" TYPE VARCHAR(255)',
      'ALTER TABLE "players" ALTER COLUMN "id" TYPE VARCHAR(255)',
      'ALTER TABLE "players" ALTER COLUMN "teamId" TYPE VARCHAR(255)',
      'ALTER TABLE "games" ALTER COLUMN "championshipId" TYPE VARCHAR(255)',
      'ALTER TABLE "games" ALTER COLUMN "homeTeamId" TYPE VARCHAR(255)',
      'ALTER TABLE "games" ALTER COLUMN "awayTeamId" TYPE VARCHAR(255)',
      'ALTER TABLE "goals" ALTER COLUMN "gameId" TYPE VARCHAR(255)',
      'ALTER TABLE "goals" ALTER COLUMN "playerId" TYPE VARCHAR(255)'
    ];
    
    for (const alter of alterColumns) {
      try {
        await sequelize.query(alter);
        console.log(`✅ Coluna alterada`);
      } catch (error) {
        console.error(`❌ Erro ao alterar coluna:`, error.message);
      }
    }
    
    console.log('\n🎉 Migração de tipos concluída!');
    console.log('⚠️ Foreign keys foram removidas para evitar conflitos');
    console.log('📝 Recomenda-se recriar as foreign keys após confirmar que tudo funciona');
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
  } finally {
    await sequelize.close();
  }
};

safeIdMigration();
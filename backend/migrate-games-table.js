// Migração para adicionar colunas faltantes na tabela Games
const sequelize = require('./config/database');

const addMissingColumns = async () => {
  try {
    console.log('🔧 Adicionando colunas faltantes na tabela Games...');
    
    // Adicionar coluna scheduledAt
    await sequelize.query(`
      ALTER TABLE "games" 
      ADD COLUMN "scheduledAt" TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Coluna scheduledAt adicionada');
    
    // Adicionar coluna venue se não existir
    try {
      await sequelize.query(`
        ALTER TABLE "games" 
        ADD COLUMN "venue" VARCHAR(255);
      `);
      console.log('✅ Coluna venue adicionada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna venue já existe');
      } else {
        console.error('❌ Erro ao adicionar venue:', error.message);
      }
    }
    
    // Verificar se as colunas startTime e endTime existem
    try {
      await sequelize.query(`
        ALTER TABLE "games" 
        ADD COLUMN "startTime" TIMESTAMP WITH TIME ZONE;
      `);
      console.log('✅ Coluna startTime adicionada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna startTime já existe');
      } else {
        console.error('❌ Erro ao adicionar startTime:', error.message);
      }
    }
    
    try {
      await sequelize.query(`
        ALTER TABLE "games" 
        ADD COLUMN "endTime" TIMESTAMP WITH TIME ZONE;
      `);
      console.log('✅ Coluna endTime adicionada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna endTime já existe');
      } else {
        console.error('❌ Erro ao adicionar endTime:', error.message);
      }
    }
    
    // Verificar se status tem todos os valores necessários
    try {
      await sequelize.query(`
        ALTER TABLE "games" 
        ALTER COLUMN "status" TYPE VARCHAR(50);
      `);
      console.log('✅ Tipo da coluna status atualizado');
    } catch (error) {
      console.log('ℹ️ Status column type:', error.message);
    }
    
    console.log('\n🎉 Migração concluída! Teste a funcionalidade novamente.');
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
  } finally {
    await sequelize.close();
  }
};

addMissingColumns();
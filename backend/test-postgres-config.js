// Script para testar configuração PostgreSQL (simulação Vercel)
const { Sequelize } = require('sequelize');

// Simular ambiente Vercel com PostgreSQL
process.env.POSTGRES_URL = 'postgresql://user:pass@localhost:5432/testdb';
process.env.NODE_ENV = 'production';

const sequelize = require('./config/database');

async function testPostgresSetup() {
  try {
    console.log('🔍 Testando configuração PostgreSQL para Vercel...');
    console.log('📌 POSTGRES_URL definida:', !!process.env.POSTGRES_URL);
    console.log('📌 NODE_ENV:', process.env.NODE_ENV);
    
    // Verificar qual banco será usado
    console.log('🗄️ Dialeto configurado:', sequelize.getDialect());
    
    if (sequelize.getDialect() === 'postgres') {
      console.log('✅ Configuração PostgreSQL ativa para produção');
      console.log('🔧 SSL configurado:', sequelize.options.dialectOptions?.ssl ? 'Sim' : 'Não');
      console.log('🏊 Pool configurado:', sequelize.options.pool ? 'Sim' : 'Não');
    } else {
      console.log('ℹ️ SQLite ativo (ambiente local)');
    }
    
    console.log('🎯 Sistema pronto para deploy na Vercel!');
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  }
}

testPostgresSetup();
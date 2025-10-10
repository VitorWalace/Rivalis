// Script para testar configuração MySQL (simulação de produção)

process.env.MYSQL_URL = 'mysql://user:pass@localhost:3306/testdb';
process.env.NODE_ENV = 'production';

const sequelize = require('./config/database');

async function testMysqlSetup() {
  try {
    console.log('🔍 Testando configuração MySQL...');
    console.log('📌 MYSQL_URL definida:', !!process.env.MYSQL_URL);
    console.log('📌 NODE_ENV:', process.env.NODE_ENV);
    console.log('🗄️ Dialeto configurado:', sequelize.getDialect());

    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');

    if (sequelize.getDialect() === 'mysql') {
      console.log('✅ MySQL ativo para produção');
    } else {
      console.log('⚠️ Atenção: dialeto diferente do esperado');
    }

    console.log('🎯 Sistema pronto para deploy na Vercel!');
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  } finally {
    await sequelize.close();
  }
}

testMysqlSetup();

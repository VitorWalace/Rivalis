const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testando login...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'teste@teste.com',
      password: '123456',
    });

    console.log('✅ Login bem-sucedido!');
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erro no login:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testLogin();

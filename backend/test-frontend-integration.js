// Teste de integração frontend-backend
async function testFrontendIntegration() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Testando integração frontend-backend...\n');
  
  try {
    // Simular o comportamento do axios com interceptor
    const testRegister = async (userData) => {
      const response = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw data; // Simular o que o interceptor do axios faria
      }
      
      return data; // Simular response.data do interceptor
    };
    
    // Dados de teste
    const testUser = {
      name: 'Usuário Frontend Test',
      email: `frontend-test-${Date.now()}@rivalis.com`,
      password: 'MinhaSenh@123'
    };
    
    console.log('📝 Dados de teste:', testUser);
    console.log('');
    
    // Testar registro
    console.log('1. Testando registro...');
    const registerResult = await testRegister(testUser);
    
    if (registerResult.success) {
      console.log('✅ Registro funcionou!');
      console.log('👤 Usuário:', registerResult.data.user.name);
      console.log('📧 Email:', registerResult.data.user.email);
      console.log('🔑 Token recebido:', registerResult.data.token ? 'Sim' : 'Não');
      
      // Testar login
      console.log('\n2. Testando login...');
      const loginResponse = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      const loginResult = await loginResponse.json();
      
      if (loginResult.success) {
        console.log('✅ Login funcionou!');
        console.log('🔑 Token de login:', loginResult.data.token ? 'Sim' : 'Não');
      } else {
        console.log('❌ Erro no login:', loginResult.message);
      }
      
    } else {
      console.log('❌ Erro no registro:', registerResult.message);
    }
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error);
    
    if (error.errors) {
      console.log('Erros de validação:');
      error.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    }
  }
}

// Executar teste
testFrontendIntegration();
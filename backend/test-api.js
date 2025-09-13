// Teste simples da API
const testAPI = async () => {
  const baseURL = 'http://localhost:5001';
  
  console.log('🔍 Testando endpoints da API Rivalis...\n');
  
  try {
    // 1. Testar health check
    console.log('1. Testando health check...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('');
    
    // 2. Testar registro de usuário
    console.log('2. Testando registro de usuário...');
    const registerData = {
      name: 'Usuário Teste',
      email: 'teste@rivalis.com',
      password: 'Teste123'
    };
    
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Registro realizado:', registerResult.message);
      console.log('📧 Email:', registerResult.data.user.email);
      console.log('🔑 Token obtido!');
      
      // 3. Testar login
      console.log('\n3. Testando login...');
      const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      });
      
      const loginResult = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login realizado:', loginResult.message);
        console.log('🔑 Token:', loginResult.data.token.substring(0, 20) + '...');
        
        // 4. Testar endpoint protegido
        console.log('\n4. Testando endpoint protegido (/api/auth/me)...');
        const meResponse = await fetch(`${baseURL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginResult.data.token}`
          }
        });
        
        const meResult = await meResponse.json();
        
        if (meResponse.ok) {
          console.log('✅ Dados do usuário obtidos:', meResult.data.user.name);
        } else {
          console.log('❌ Erro ao obter dados do usuário:', meResult.message);
        }
        
      } else {
        console.log('❌ Erro no login:', loginResult.message);
      }
      
    } else {
      console.log('❌ Erro no registro:', registerResult.message);
      if (registerResult.errors) {
        registerResult.errors.forEach(error => {
          console.log(`   - ${error.field}: ${error.message}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
};

// Executar os testes
testAPI();
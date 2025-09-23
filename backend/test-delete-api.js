// Teste da API de exclusão de campeonato
require('dotenv').config();
const axios = require('axios');

async function testDeleteAPI() {
  try {
    const baseURL = 'http://127.0.0.1:5000/api';
    
    console.log('🔍 Testando API de exclusão...');
    
    // Primeiro, fazer login para obter token
    console.log('🔑 Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@example.com', // Substitua por um usuário válido
      password: 'senha123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtido:', token.substring(0, 20) + '...');
    
    // Listar campeonatos
    console.log('\n📋 Listando campeonatos...');
    const listResponse = await axios.get(`${baseURL}/championships`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const championships = listResponse.data.data || listResponse.data;
    console.log(`Campeonatos encontrados: ${championships.length}`);
    
    if (championships.length > 0) {
      const testChampionship = championships[0];
      console.log(`\n🗑️ Testando exclusão do campeonato: ${testChampionship.name} (ID: ${testChampionship.id})`);
      
      // CUIDADO: Isso vai excluir de verdade!
      console.log('⚠️ ATENÇÃO: Esta é uma exclusão real!');
      console.log('⏸️ Abortando teste para não excluir campeonatos...');
      return;
      
      // Descomente apenas se quiser testar a exclusão real:
      /*
      const deleteResponse = await axios.delete(`${baseURL}/championships/${testChampionship.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Resposta da exclusão:', deleteResponse.data);
      */
    } else {
      console.log('❌ Nenhum campeonato encontrado para testar');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste da API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDeleteAPI();
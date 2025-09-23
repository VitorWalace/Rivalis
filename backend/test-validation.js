// Teste rápido da validação
const { championshipIdValidation } = require('./middleware/validation');

// Simular um req object
const req = {
  params: {
    championshipId: 'champ_1758468568495'
  }
};

console.log('Testando validação para ID:', req.params.championshipId);

// Testar a validação
championshipIdValidation.forEach(validation => {
  const result = validation.run(req);
  console.log('Resultado da validação:', result);
});

console.log('Teste finalizado');
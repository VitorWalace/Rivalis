const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..')));

// Rota para servir o HTML de teste
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'test-api.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor de teste rodando em http://localhost:${PORT}/test`);
});
# 🔧 Como Resolver o Erro "Network Error"

Se você está recebendo um erro de **Network Error** ao tentar fazer login ou criar conta, isso significa que o backend não está rodando. Aqui estão as instruções para resolver:

## 📋 Pré-requisitos
- Node.js instalado (versão 16 ou superior)
- NPM ou Yarn

## 🚀 Passos para Iniciar o Backend

### 1. Abrir Terminal no Diretório Backend
```bash
cd backend
```

### 2. Instalar Dependências (se necessário)
```bash
npm install
```

### 3. Iniciar o Servidor
```bash
npm start
```

**OU alternativamente:**
```bash
node server.js
```

### 4. Verificar se Está Funcionando
O terminal deve mostrar:
```
✅ Conexão com banco de dados estabelecida com sucesso!
🚀 Servidor Rivalis rodando na porta 5000
🌍 Health check: http://localhost:5000/health
```

## 🔍 Diagnóstico de Problemas

### Problema: "Cannot find module"
**Solução:** Certifique-se de estar no diretório `backend` antes de executar os comandos.

### Problema: "Port already in use"
**Solução:** 
1. Finalizar processos Node.js existentes:
   ```bash
   taskkill /F /IM node.exe
   ```
2. Tentar novamente

### Problema: "Missing script: start"
**Solução:** Verificar se está no diretório correto (`backend`) e não no diretório raiz do projeto.

## 🌐 Testando a Conexão

Após iniciar o servidor, você pode testar se está funcionando abrindo no navegador:
```
http://localhost:5000/health
```

Deve retornar:
```json
{
  "success": true,
  "message": "Rivalis API está funcionando!",
  "timestamp": "2025-09-13T..."
}
```

## 📁 Estrutura de Diretórios

Certifique-se de que sua estrutura está assim:
```
Rivalis/
├── src/                    (Frontend)
├── backend/               (Backend - EXECUTAR AQUI)
│   ├── server.js
│   ├── package.json
│   └── ...
└── package.json          (Frontend)
```

## 🔄 Reiniciando Tudo

Se nada funcionar, tente:

1. **Parar todos os processos:**
   ```bash
   taskkill /F /IM node.exe
   ```

2. **Navegar para backend:**
   ```bash
   cd Rivalis/backend
   ```

3. **Reinstalar dependências:**
   ```bash
   npm install
   ```

4. **Iniciar servidor:**
   ```bash
   npm start
   ```

5. **Em outro terminal, iniciar frontend:**
   ```bash
   cd .. 
   npm run dev
   ```

## ✅ Status dos Serviços

Quando tudo estiver funcionando:
- **Frontend:** http://localhost:5174
- **Backend:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

---

💡 **Dica:** Mantenha sempre o terminal do backend aberto para ver os logs de requisições e possíveis erros.
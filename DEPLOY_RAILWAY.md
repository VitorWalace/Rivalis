# 🚀 Deploy Backend Real - Railway

## 📋 Passo a Passo

### 1. Fazer Deploy no Railway

1. **Acesse o Railway**
   - Vá para: https://railway.app
   - Faça login com sua conta GitHub

2. **Criar Novo Projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha o repositório "Rivalis"

3. **Configurar Build**
   - O Railway detectará automaticamente o Node.js
   - Root Directory: `/backend` (importante!)
   - Build Command: `npm install`
   - Start Command: `npm start`

### 2. Configurar Banco MySQL

1. **Adicionar MySQL Plugin**
   - No seu projeto Railway, clique em "Add Plugin"
   - Selecione "MySQL"
   - Aguarde a criação do banco

2. **Copiar MYSQL_URL**
   - Clique no plugin MySQL
   - Vá para aba "Connect"
   - Copie a "MYSQL URL"

### 3. Configurar Variáveis de Ambiente

No Railway, adicione estas variáveis:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=rivalis_jwt_secret_muito_forte_e_segura_123456789abcdef
MYSQL_URL=mysql://user:senha@containers-xxx.railway.app:3306/railway
DB_SSL=false
FRONTEND_URL=https://rivalis.vercel.app
```

### 4. Atualizar Frontend

Após o deploy, você receberá uma URL como:
`https://rivalis-backend-production.up.railway.app`

**Atualize esta URL no código:**

1. Abra `src/services/api.ts`
2. Substitua a URL na linha 5:
```typescript
: 'https://SUA-URL-RAILWAY.up.railway.app/api';
```

3. Faça o mesmo em `src/services/enhancedApi.ts`

### 5. Deploy Frontend Atualizado

```bash
git add .
git commit -m "feat: Conectar ao backend real no Railway"
git push origin main
```

O Vercel fará deploy automaticamente.

### 6. Teste Final

1. Acesse seu site no Vercel
2. Crie uma conta nova
3. Faça login
4. Crie um campeonato
5. ✅ **Tudo funcionando com dados reais!**

## 🔧 URLs de Exemplo

- **Backend Railway**: `https://rivalis-backend-production.up.railway.app`
- **Frontend Vercel**: `https://rivalis.vercel.app`
- **API Health**: `https://rivalis-backend-production.up.railway.app/health`

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se FRONTEND_URL está correta
- Verifique se a URL tem https:// e não http://

### Erro de Banco
- Verifique se MYSQL_URL está correta
- Aguarde alguns minutos para o banco inicializar

### Backend não inicia
- Verifique os logs no Railway
- Confirme que NODE_ENV=production está definido
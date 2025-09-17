# Deploy do Backend Rivalis

Este guia mostra como fazer deploy do backend em diferentes plataformas cloud.

## Railway (Recomendado - Grátis)

1. **Criar conta no Railway**
   - Acesse: https://railway.app
   - Faça login com GitHub

2. **Criar novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Conecte este repositório

3. **Configurar variáveis de ambiente**
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=rivalis_jwt_secret_key_muito_forte_e_segura_123456789
   FRONTEND_URL=https://sua-app.vercel.app
   ```

4. **Configurar banco PostgreSQL**
   - No Railway, clique em "Add Plugin"
   - Selecione "PostgreSQL"
   - Copie a DATABASE_URL gerada

5. **Deploy automático**
   - O Railway fará deploy automático
   - URL será algo como: `https://seu-projeto.up.railway.app`

## Render (Alternativa - Grátis)

1. **Criar conta no Render**
   - Acesse: https://render.com
   - Faça login com GitHub

2. **Criar Web Service**
   - Clique em "New" > "Web Service"
   - Conecte o repositório GitHub

3. **Configurar build**
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: `Node`

4. **Configurar variáveis**
   - Mesmas variáveis do Railway

## Após o deploy

1. **Copiar URL do backend**
2. **Atualizar frontend** (próximo passo)
3. **Testar funcionamento**

## URLs de exemplo:
- Railway: `https://rivalis-backend-production.up.railway.app`
- Render: `https://rivalis-backend.onrender.com`
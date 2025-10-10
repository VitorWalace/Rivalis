# 🚀 Como Resolver o Erro de CORS no Railway

## ❌ Problema Atual
O backend no Railway está retornando `Access-Control-Allow-Origin: https://railway.com` em vez de aceitar `https://rivalis.vercel.app`.

## ✅ Solução

### Opção 1: Deploy Automático via GitHub (RECOMENDADO)

1. **Acesse Railway**: https://railway.app
2. **Faça login** com sua conta
3. **Clique em "New Project"**
4. **Selecione "Deploy from GitHub repo"**
5. **Escolha o repositório**: `VitorWalace/Rivalis`
6. **Configure o serviço**:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

7. **Adicione as variáveis de ambiente**:
   ```env
   DATABASE_URL=mysql://root:cKnLQRPgqKypidVQXAjIsfRJVNNhqeTH@nozomi.proxy.rlwy.net:38501/railway
   JWT_SECRET=rivalis_secret_key_2024_railway_mysql
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://rivalis.vercel.app
   ```

8. **Deploy**: Railway vai fazer deploy automaticamente

9. **Copie a URL do deploy**: Algo como `https://seu-app.up.railway.app`

10. **Atualize no Vercel**:
    - Vá em Settings > Environment Variables
    - Atualize `VITE_API_URL` para a URL do Railway + `/api`

### Opção 2: Atualizar Deploy Existente

Se você já tem um projeto no Railway:

1. **Vá no dashboard do Railway**
2. **Selecione seu projeto backend**
3. **Vá em Settings > Variables**
4. **Adicione/atualize**:
   ```
   FRONTEND_URL=https://rivalis.vercel.app
   ```
5. **Vá em Deployments**
6. **Clique em "Redeploy"** ou faça um push no GitHub

### Opção 3: Usar Backend Local Temporariamente

Enquanto configura o Railway, use o backend local:

1. **No `vercel.json`**, mude para:
   ```json
   "VITE_API_URL": "http://localhost:5000/api"
   ```

2. **Execute o backend localmente**:
   ```bash
   cd backend
   node server.js
   ```

3. **Teste no navegador em**: `http://localhost:5173`

## 📝 Checklist

- [ ] Backend deployado no Railway com código atualizado
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] URL do backend atualizada no Vercel
- [ ] CORS permitindo `https://rivalis.vercel.app`
- [ ] Teste de login funcionando

## 🔗 Links Úteis

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Documentação Railway: https://docs.railway.app/

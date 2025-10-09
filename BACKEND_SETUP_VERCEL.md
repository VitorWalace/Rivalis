# 🚀 Configuração do Backend para Vercel

## ⚠️ PROBLEMA IDENTIFICADO

Quando você cria conta no Vercel e acessa de outro dispositivo, aparece erro de conexão com o servidor porque:

1. **No localhost (seu computador)**: funciona porque conecta em `http://127.0.0.1:5000/api`
2. **Em produção (outros dispositivos)**: tenta conectar ao Railway que pode não estar configurado

## ✅ SOLUÇÃO

### Passo 1: Escolher onde hospedar o BACKEND

O Vercel **NÃO hospeda backends Node.js tradicionais**. Você precisa escolher:

#### Opção A: Railway (Recomendado - Grátis)
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Click em "New Project" > "Deploy from GitHub repo"
4. Selecione o repositório Rivalis
5. Configure o diretório raiz como `/backend`
6. Adicione as variáveis de ambiente:
   ```
   NODE_ENV=production
   JWT_SECRET=rivalis_super_secret_key_change_in_production
   PORT=5000
   ```
7. Railway vai gerar uma URL tipo: `https://rivalis-production.up.railway.app`

#### Opção B: Render (Grátis com limitações)
1. Acesse: https://render.com
2. Faça login com GitHub
3. Click em "New +" > "Web Service"
4. Selecione o repositório
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Adicione as variáveis de ambiente (mesmas do Railway)
7. Render vai gerar uma URL tipo: `https://rivalis-backend.onrender.com`

#### Opção C: Backend Local (Apenas para testes)
⚠️ **NÃO recomendado para produção** - só funciona quando seu computador está ligado

### Passo 2: Configurar Frontend no Vercel

Depois de ter a URL do backend:

1. Acesse seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** > **Environment Variables**
3. Adicione a variável:
   ```
   Name: VITE_API_URL
   Value: https://SUA-URL-DO-BACKEND.railway.app/api
   ```
   (substitua pela URL real do Railway ou Render)

4. Clique em **Save**
5. Vá em **Deployments** > ⋯ (três pontos) > **Redeploy**

### Passo 3: Testar

Após o redeploy:
1. Acesse seu site do Vercel de outro dispositivo
2. Tente criar uma conta
3. Deve funcionar! 🎉

## 🔍 Como Verificar se Está Funcionando

Abra o console do navegador (F12) e procure por:
```
🔗 API Base URL: https://sua-url.railway.app/api
🌐 Hostname: seu-app.vercel.app
🔧 VITE_API_URL: https://sua-url.railway.app/api
```

## 📝 Resumo Rápido

```bash
# 1. Fazer deploy do BACKEND no Railway/Render
# 2. Pegar a URL gerada (ex: https://rivalis.railway.app)
# 3. No Vercel, adicionar variável de ambiente:
VITE_API_URL=https://rivalis.railway.app/api
# 4. Fazer redeploy no Vercel
# 5. Pronto! ✅
```

## ⚡ Atalho para Desenvolvimento Rápido

Se você só quer testar rapidamente sem backend:

1. Use o **modo demo** que já existe no código
2. Ou use um **backend compartilhado temporário** (não recomendado para produção)

## 🆘 Precisa de Ajuda?

Se ainda tiver problemas:
1. Verifique se o backend está online: `https://sua-url.railway.app/health`
2. Veja os logs no console do navegador (F12)
3. Verifique se a variável VITE_API_URL está correta no Vercel
4. Certifique-se de ter feito redeploy após adicionar a variável

## 📚 Documentação Completa

- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Vercel Environment Variables: https://vercel.com/docs/environment-variables

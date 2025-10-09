# 🔧 Correção: Erro de Conexão em Outros Dispositivos

## 🚨 Problema
Quando você cria conta no Vercel funciona no seu computador, mas em outros dispositivos dá erro de conexão.

## ✅ Causa
O frontend estava tentando conectar ao Railway, mas você não tem o backend lá ativo.

## 🎯 Solução Implementada

### Arquivos Alterados:
1. ✅ `src/services/api.ts` - Agora usa `VITE_API_URL`
2. ✅ `src/services/enhancedApi.ts` - Agora usa `VITE_API_URL`
3. ✅ `src/store/authStore.ts` - Logs atualizados
4. ✅ `.env.example` - Documentação criada
5. ✅ `vercel.json` - Configuração de env adicionada

### O que foi mudado:
**ANTES:**
```typescript
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:5000/api'
  : 'https://rivalis-production.up.railway.app/api'; // ❌ Hardcoded!
```

**DEPOIS:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:5000/api'
    : 'https://rivalis-production.up.railway.app/api'); // Fallback
```

## 📋 Próximos Passos

### 1️⃣ Fazer Deploy do Backend

Escolha uma opção:

**Opção A: Railway (Mais Fácil)**
```bash
# 1. Acesse: https://railway.app
# 2. Conecte com GitHub
# 3. Deploy from repo > escolha "backend" folder
# 4. Adicione variáveis de ambiente:
#    - NODE_ENV=production
#    - JWT_SECRET=sua_chave_secreta
#    - PORT=5000
# 5. Copie a URL gerada (ex: https://rivalis.railway.app)
```

**Opção B: Render**
```bash
# 1. Acesse: https://render.com
# 2. New Web Service > GitHub repo
# 3. Configure:
#    - Root Directory: backend
#    - Build: npm install
#    - Start: npm start
# 4. Adicione as mesmas variáveis de ambiente
# 5. Copie a URL gerada
```

### 2️⃣ Configurar no Vercel

```bash
# No dashboard do Vercel:
# Settings > Environment Variables > Add New

VITE_API_URL=https://sua-url-backend.railway.app/api

# ⚠️ IMPORTANTE: Adicione /api no final!
# Depois: Deployments > Redeploy
```

### 3️⃣ Testar

```bash
# Acesse de outro dispositivo
# Abra console (F12) e veja:
🔗 API Base URL: https://sua-url-backend.railway.app/api ✅
🔧 VITE_API_URL: https://sua-url-backend.railway.app/api ✅
```

## 🆘 Atalho Rápido

Se você já tem backend no Railway ou Render:

1. Copie a URL do backend
2. Vercel Dashboard > Settings > Environment Variables
3. Adicione: `VITE_API_URL` = `https://sua-url.railway.app/api`
4. Salve e faça Redeploy
5. Pronto! 🎉

## 📖 Documentação Completa

Veja arquivo: `BACKEND_SETUP_VERCEL.md`

## ✅ Checklist

- [ ] Backend deployado no Railway/Render
- [ ] URL do backend copiada
- [ ] Variável `VITE_API_URL` adicionada no Vercel
- [ ] Redeploy feito no Vercel
- [ ] Testado em outro dispositivo
- [ ] Funciona! 🚀

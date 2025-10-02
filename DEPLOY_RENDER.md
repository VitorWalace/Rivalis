# 🎨 Deploy Backend no Render - Guia Completo

## 🚀 Passo a Passo (5-10 minutos)

### **1. Acessar Render**
👉 **Vá para**: https://render.com
- Clique em **"Get Started"**
- **Login com GitHub**

### **2. Criar Web Service**
- Clique em **"New +"** 
- Selecione **"Web Service"**
- Clique em **"Connect account"** (GitHub)
- Procure e selecione: **"Rivalis"**

### **3. Configurar Build Settings**

```bash
Name: rivalis-backend
Region: Ohio (US East)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### **4. Configurar Environment Variables**

Adicione estas variáveis:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=rivalis_super_secret_key_2024_muito_forte_e_segura
FRONTEND_URL=https://rivalis-vitorwalaces-projects.vercel.app
```

### **5. Configurar PostgreSQL**

**Após o Web Service:**
- Clique em **"New +"** novamente
- Selecione **"PostgreSQL"**
- Name: `rivalis-db`
- Region: **Ohio (US East)** (mesma do backend)
- Clique **"Create Database"**

### **6. Conectar Banco ao Backend**

1. **Copie a Database URL:**
   - Na página do PostgreSQL, vá para **"Connect"**
   - Copie a **"External Database URL"**

2. **Adicione no Backend:**
   - Volte para o Web Service
   - Vá para **"Environment"**
   - Adicione: `DATABASE_URL=postgresql://...` (cole a URL)

### **7. Deploy!**
- Clique **"Create Web Service"**
- Aguarde o build (2-3 minutos)
- ✅ **Sua URL será**: `https://rivalis-backend.onrender.com`

## 📋 **URLs de Exemplo:**

- **Backend**: `https://rivalis-backend.onrender.com`
- **Health Check**: `https://rivalis-backend.onrender.com/health`
- **API Base**: `https://rivalis-backend.onrender.com/api`

## 🔧 **Próximo Passo:**

Após o deploy, **atualize o frontend** com a nova URL.

## 🐛 **Troubleshooting:**

### ❌ Build falha
- Verifique se **Root Directory** = `backend`
- Confirme **Start Command** = `npm start`

### ❌ Não conecta banco
- Verifique se DATABASE_URL está correta
- Confirme que ambos estão na mesma região

### ❌ Erro CORS
- Confirme FRONTEND_URL está correta
- Use https:// (não http://)

---

**🎯 Total: ~10 minutos para tudo funcionando!**
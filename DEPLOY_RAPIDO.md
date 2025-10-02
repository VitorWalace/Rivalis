# 🚀 Guia Rápido: Deploy Rivalis no Vercel

## ✅ **Sistema Pronto para Deploy!**

O Rivalis foi adaptado para funcionar perfeitamente no Vercel:
- ✅ SQLite para desenvolvimento local (zero configuração)
- ✅ Vercel Postgres para produção
- ✅ Configuração automática de ambiente

## 🔥 **Deploy em 5 Passos:**

### 1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

### 2. **Fazer Login**
```bash
vercel login
```

### 3. **Deploy do Frontend**
```bash
# Na pasta raiz
npm run build
vercel --prod
```

### 4. **Criar Banco Postgres**
```bash
vercel postgres create
```

### 5. **Deploy do Backend**
```bash
# Configurar variáveis de ambiente automaticamente
vercel env add JWT_SECRET
# Digite: rivalis_jwt_secret_super_seguro

# Deploy final
vercel --prod
```

## 🎯 **URLs Resultantes:**

Após o deploy você terá:
- **Frontend:** `https://rivalis-seu-usuario.vercel.app`
- **Backend API:** `https://rivalis-seu-usuario.vercel.app/api/`

## 📱 **Teste Rápido:**

1. Acesse sua URL do Vercel
2. Clique em "Cadastre-se"
3. Crie uma conta
4. Faça login
5. Crie um campeonato

## 💡 **Benefícios do Setup Atual:**

✅ **Desenvolvimento:** SQLite (sem instalação)  
✅ **Produção:** Vercel Postgres (escalável)  
✅ **Deploy:** Um comando  
✅ **Free Tier:** Generoso da Vercel  
✅ **SSL:** Automático  
✅ **CDN:** Global  
✅ **Backups:** Automáticos  

## 🔧 **Desenvolvimento Local:**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
npm run dev
```

Agora o sistema usa SQLite localmente - **sem precisar instalar PostgreSQL!**

---

**🎉 Pronto! Seu Rivalis está otimizado para Vercel!**
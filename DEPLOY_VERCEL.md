# 🚀 Deploy do Rivalis no Vercel

## 📋 Pré-requisitos

1. **Conta no Vercel** (gratuita): https://vercel.com
2. **Vercel CLI** instalado globalmente:
```bash
npm install -g vercel
```

## 🔧 Setup para Deploy

### 1. **Instalar SQLite para desenvolvimento local**
```bash
cd backend
npm install sqlite3
```

### 2. **Fazer login no Vercel**
```bash
vercel login
```

### 3. **Criar Vercel Postgres**
```bash
# Na pasta raiz do projeto
vercel postgres create
```

### 4. **Conectar projeto ao Vercel**
```bash
vercel link
```

### 5. **Configurar variáveis de ambiente**
```bash
# Adicionar variáveis do banco Postgres (será feito automaticamente)
vercel env pull .env.local

# Adicionar JWT secret
vercel env add JWT_SECRET
# Digite: rivalis_super_secret_key_change_in_production

# Adicionar NODE_ENV
vercel env add NODE_ENV
# Digite: production
```

## 🚀 **Deploy**

### Deploy de desenvolvimento:
```bash
vercel
```

### Deploy de produção:
```bash
vercel --prod
```

## 🔍 **Verificar Deploy**

Após o deploy, o Vercel fornecerá URLs como:
- **Preview:** https://rivalis-abc123.vercel.app
- **Produção:** https://rivalis.vercel.app (se configurou domínio)

### Testar endpoints:
- Health check: `https://seu-app.vercel.app/api/health`
- Registro: `POST https://seu-app.vercel.app/api/auth/register`
- Login: `POST https://seu-app.vercel.app/api/auth/login`

## ⚙️ **Configuração Local para Desenvolvimento**

### Opção 1: PostgreSQL (se já tiver instalado)
```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rivalis_db
DB_USER=usuario
DB_PASSWORD=senha
JWT_SECRET=rivalis_super_secret_key
NODE_ENV=development
```

### Opção 2: SQLite (mais simples)
```env
# .env
JWT_SECRET=rivalis_super_secret_key
NODE_ENV=development
# Não precisa configurar banco - SQLite é automático
```

## 🔄 **Workflow Completo**

### 1. **Desenvolvimento Local**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 2. **Deploy**
```bash
# Build do frontend
npm run build

# Deploy completo
vercel --prod
```

## 🐛 **Troubleshooting**

### **Erro de conexão com banco**
- Verifique se as variáveis do Vercel Postgres estão configuradas
- Use `vercel env ls` para listar variáveis

### **Erro de CORS**
- Configure `FRONTEND_URL` no Vercel:
```bash
vercel env add FRONTEND_URL
# Digite: https://seu-app.vercel.app
```

### **Erro de build**
- Verifique se todas as dependências estão no `package.json`
- Use `vercel logs` para ver logs detalhados

## 📊 **Monitoramento**

- **Dashboard Vercel:** https://vercel.com/dashboard
- **Banco de dados:** https://vercel.com/storage/postgres
- **Logs:** `vercel logs [deployment-url]`

---

**🎉 Pronto! Seu Rivalis estará online e escalável no Vercel!**
# 🚀 Deploy Rivalis na Vercel com Postgres

## 📋 **Status:** Pronto para Deploy ✅

Este projeto está **100% configurado** para deploy na Vercel com **Vercel Postgres**.

### 🏗️ **Arquitetura:**
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + Sequelize
- **Banco Local:** SQLite (desenvolvimento)
- **Banco Produção:** PostgreSQL (Vercel Postgres)

---

## 🎯 **Deploy na Vercel - Passos:**

### 1. **Conectar Repositório**
1. Vá para [vercel.com](https://vercel.com)
2. **New Project** → **Import Git Repository**
3. Selecione este repositório
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `.` (raiz)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 2. **Configurar Vercel Postgres**
1. Na dashboard do projeto → **Storage**
2. **Create** → **Postgres** 
3. **Connect** ao projeto
4. ✅ Variável `POSTGRES_URL` criada automaticamente

### 3. **Configurar Variáveis de Ambiente**
Na aba **Settings** → **Environment Variables**, adicionar:

```env
NODE_ENV=production
JWT_SECRET=rivalis_super_secret_production_key_2025_change_this
FRONTEND_URL=https://seu-projeto.vercel.app
```

### 4. **Deploy Automático** 🚀
- Deploy acontece automaticamente
- Tabelas são criadas automaticamente
- Sistema funciona igual ao local

---

## 🛠️ **Comandos Locais:**

```bash
# Desenvolvimento
npm run dev          # Frontend na porta 5174
cd backend && node server.js  # Backend na porta 5000

# Build para produção
npm run build        # Gera dist/ para deploy
```

---

## 🗄️ **Banco de Dados:**

### **Local (SQLite):**
- Arquivo: `backend/database.sqlite`
- Automático: Zero configuração

### **Produção (PostgreSQL):**
- Vercel Postgres integrado
- SSL configurado automaticamente
- Migrations automáticas

---

## 📁 **Estrutura do Projeto:**

```
rivalis/
├── src/                 # Frontend React
├── backend/             # API Node.js
│   ├── server.js       # Servidor principal
│   ├── config/         # Configurações
│   ├── models/         # Modelos Sequelize
│   ├── routes/         # Rotas da API
│   └── scripts/        # Scripts utilitários
├── dist/               # Build produção (gerado)
├── vercel.json         # Config Vercel
└── package.json        # Dependências
```

---

## ✅ **Checklist Deploy:**

- [x] Build funcionando (`npm run build`)
- [x] Configuração dual banco (SQLite/PostgreSQL)
- [x] CORS configurado
- [x] Variáveis de ambiente preparadas
- [x] vercel.json otimizado
- [x] .gitignore configurado
- [x] Sistema testado localmente

---

## 🎉 **Após Deploy:**

1. **URL gerada:** `https://rivalis-xxx.vercel.app`
2. **Health check:** `https://rivalis-xxx.vercel.app/health`
3. **Sistema funcionando** igual ao local
4. **Banco PostgreSQL** automático

---

## 💰 **Custos:**
- **Vercel:** Gratuito (Hobby plan)
- **Postgres:** Gratuito até 500MB
- **Total:** **$0/mês** 🎯

---

**Projeto pronto para deploy em produção!** 🚀
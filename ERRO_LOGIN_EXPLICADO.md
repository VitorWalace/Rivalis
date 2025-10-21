# 🔴 Problema de Login/Registro – Explicado e Corrigido

## ✅ Situação atual (20/10/2025)

- Corrigimos a autenticação para lidar com variações de maiúsculas/minúsculas no email e com a falta de `JWT_SECRET`.
- Testes locais de registro e login passaram com sucesso.

Principais ajustes:
- Normalização de email para lowercase no controller e no model (garante match mesmo se o usuário digitar com maiúsculas).
- Validação de configuração: se `JWT_SECRET` estiver ausente, retornamos um 500 com log claro em vez de falhar silenciosamente.

---

## 📊 Análise de logs (causas prováveis antes da correção):

```
Executing (default): SELECT ... FROM `users` WHERE `User`.`email` = 'vitorwalace123@gmail.com';
127.0.0.1 - - [16/Oct/2025:20:52:10 +0000] "POST /api/auth/login HTTP/1.1" 401 55
```

**Significado:**
- Backend recebeu requisição de login com email `vitorwalace123@gmail.com`
- Buscou no banco de dados
- **NÃO ENCONTROU** esse usuário
- Retornou 401 (não autorizado) - comportamento correto!

Outras possíveis causas que corrigimos/prevenimos:
- Email salvo/consultado com case diferente (ex.: `Vitor@...` vs `vitor@...`).
- `JWT_SECRET` ausente causando 500 no registro.

---

## ✅ Backend testado agora:

```
🚀 Servidor Rivalis rodando na porta 5000
✅ Modelos sincronizados com o banco de dados!
📊 6 tabelas disponíveis no banco
✅ CORS allowed origin: http://localhost:5173
```

Teste E2E executado:

```
REGISTER 201 { success: true, message: 'Usuário criado com sucesso', ... }
LOGIN 200 { success: true, message: 'Login realizado com sucesso', ... }
```

---

## 🔧 Como usar/testar agora:

Você tem 2 opções rápidas:

### **Opção 1: Usar o usuário de teste que já existe**
```
Email: teste@teste.com
Senha: 123456
```

### **Opção 2: Criar seu próprio usuário**

#### **A. Via Tela de Registro:**
1. Vá em http://localhost:5173
2. Clique em "Criar Conta" (ou "Registrar")
3. Preencha:
   - Nome: Vitor Walace
   - Email: vitorwalace123@gmail.com
   - Senha: sua-senha
4. Clique em "Cadastrar"

#### **B. Via Script (Backend):**

1. Crie o arquivo `backend/create-vitor-user.js`:

```javascript
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar: DataTypes.STRING,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: DataTypes.DATE,
});

async function createUser() {
  try {
    await sequelize.sync();
    
    const email = 'vitorwalace123@gmail.com';
    const password = 'sua-senha-aqui'; // ⚠️ MUDE PARA SUA SENHA!
    
    // Verificar se já existe
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('✅ Usuário já existe!');
      return;
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar
    await User.create({
      name: 'Vitor Walace',
      email,
      password: hashedPassword,
      isActive: true,
    });
    
    console.log('✅ Usuário criado!');
    console.log('Email:', email);
    console.log('Senha:', password);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

createUser();
```

2. **Execute:**
```
cd C:\Users\Pichau\OneDrive - Instituição Adventista de Ensino\Área de Trabalho\Rivalis\backend
node create-vitor-user.js
```

---

## 🎯 RESUMO:

✅ Backend: FUNCIONANDO
✅ Banco de dados: FUNCIONANDO
❌ Usuário `vitorwalace123@gmail.com`: NÃO EXISTE

**Use `teste@teste.com` / `123456` ou crie seu usuário!**

---

## 🔐 Notas de configuração (importante para produção)

- Defina `JWT_SECRET` no ambiente (Render, Vercel, Railway, etc.). Sem isso o registro falha com 500.
- Variáveis padrão locais estão em `backend/.env` (apenas para desenvolvimento). Não use o mesmo segredo em produção.

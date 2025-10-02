# 🚀 Setup do Backend Rivalis

## Pré-requisitos

### 1. Instalar PostgreSQL
- Windows: Baixar do site oficial https://www.postgresql.org/download/windows/
- Durante a instalação, definir senha do usuário `postgres`

### 2. Configurar Banco de Dados

1. Abra o pgAdmin ou terminal PostgreSQL
2. Crie o banco de dados:
```sql
CREATE DATABASE rivalis_db;
CREATE USER usuario WITH PASSWORD 'senha';
GRANT ALL PRIVILEGES ON DATABASE rivalis_db TO usuario;
```

### 3. Configurar Variáveis de Ambiente

1. Navegue até a pasta backend:
```bash
cd backend
```

2. Copie o arquivo de exemplo:
```bash
copy .env.example .env
```

3. Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rivalis_db
DB_USER=usuario
DB_PASSWORD=sua_senha_aqui

# Configurações JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Configurações do Servidor
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

## 🛠️ Comandos para Executar

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Inicializar Banco de Dados
```bash
npm run init-db
```

### 3. Executar Servidor de Desenvolvimento
```bash
npm run dev
```

### 4. Executar Servidor de Produção
```bash
npm start
```

## 📡 Endpoints da API

### Autenticação

#### POST /api/auth/register
Criar nova conta de usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_aqui"
  }
}
```

#### POST /api/auth/login
Fazer login na aplicação.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_aqui"
  }
}
```

#### GET /api/auth/me
Obter dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer jwt_token_aqui
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /api/auth/logout
Fazer logout da aplicação.

**Headers:**
```
Authorization: Bearer jwt_token_aqui
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

## 🔐 Validações de Registro

### Nome
- Mínimo: 2 caracteres
- Máximo: 100 caracteres

### Email
- Deve ser um email válido
- Único no sistema

### Senha
- Mínimo: 6 caracteres
- Deve conter pelo menos:
  - 1 letra minúscula
  - 1 letra maiúscula  
  - 1 número

## 🚨 Tratamento de Erros

### Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado
- **409**: Conflito (email já existe)
- **500**: Erro interno do servidor

### Exemplo de Resposta de Erro
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email deve ser válido"
    },
    {
      "field": "password",
      "message": "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número"
    }
  ]
}
```

## 🔧 Troubleshooting

### Erro de Conexão com PostgreSQL
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Teste a conexão manualmente

### Erro de JWT
1. Verifique se `JWT_SECRET` está definido no `.env`
2. Certifique-se de que o token está sendo enviado corretamente

### Erro de CORS
1. Verifique se `FRONTEND_URL` está correto no `.env`
2. Confirme que o frontend está rodando na porta correta

---

**Criado em:** 13 de setembro de 2025  
**Versão:** 1.0.0  
**Projeto:** Rivalis - Sistema de Gerenciamento de Campeonatos
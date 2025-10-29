# 🚀 Setup do Backend Rivalis

## Pré-requisitos

### 1. Instalar MySQL 8+
- Windows: Baixar do site oficial https://dev.mysql.com/downloads/installer/
- Durante a instalação, crie um usuário administrador (ex.: `root`) com senha segura

### 2. Criar Banco de Dados e Usuário

No terminal MySQL ou MySQL Workbench, execute:
```sql
CREATE DATABASE rivalis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rivalis'@'%' IDENTIFIED BY 'senha_super_segura';
GRANT ALL PRIVILEGES ON rivalis_db.* TO 'rivalis'@'%';
FLUSH PRIVILEGES;
```

### 3. Configurar Variáveis de Ambiente

1. Navegue até a pasta backend:
```bash
cd backend
```

2. Copie o arquivo de exemplo (Windows CMD):
```bat
copy .env.example .env
```

3. Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Banco de Dados (MySQL)
# Use APENAS UMA das opções abaixo (a app aceita ambas):
# MYSQL_URL  (recomendado no Railway)
# DATABASE_URL (alternativa)
MYSQL_URL=
DATABASE_URL=
DB_SSL=false

# (Opcional) Config via variáveis separadas para MySQL local
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rivalis_db
DB_USER=rivalis
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

4. Atalho (opcional, faz uma vez por máquina Windows): defina o MYSQL_URL de forma global

Se você não quiser editar o arquivo `.env` em cada PC, crie a variável de ambiente do usuário no Windows. Abra o Prompt de Comando (CMD) e rode:

```cmd
setx MYSQL_URL "mysql://usuario:senha@host:porta/railway"
```

Observações:
- Feche e reabra o terminal após usar `setx`.
- Você também pode usar `setx DATABASE_URL "..."` se preferir esse nome.
- A app buscará primeiro `MYSQL_URL`, depois `DATABASE_URL`. Se nenhuma existir e as variáveis separadas (DB_HOST, etc.) não estiverem presentes, ela cai para SQLite local automaticamente.

## � Rodar usando banco do Railway (sem perrengue)

Siga estes passos para usar o MySQL do Railway com o backend local:

1) Criar o arquivo `.env` (Windows):

```bat
cd backend
copy .env.example .env
```

2) Cole a URL do MySQL do Railway no `.env` em UMA destas variáveis (a aplicação aceita ambas):

```env
MYSQL_URL=mysql://usuario:senha@host:porta/railway
# ou
DATABASE_URL=mysql://usuario:senha@host:porta/railway
```

3) Defina um segredo JWT e a URL do frontend (se já tiver):

```env
JWT_SECRET=sua_chave_super_segura
FRONTEND_URL=http://localhost:5173
```

4) Teste a conexão com o MySQL do Railway:

```bat
cd backend
npm run test:mysql
```

Se aparecer "✅ Conexão com MySQL estabelecida com sucesso!", está tudo certo.

5) Rode o servidor:

```bat
cd backend
npm start
```

6) Alternativa para não editar `.env` em cada PC (Windows): defina a variável de ambiente uma vez e reabra o terminal depois:

```cmd
setx MYSQL_URL "mysql://usuario:senha@host:porta/railway"
```

Observações:
- Você também pode usar `setx DATABASE_URL "..."` se preferir esse nome.
- Se `MYSQL_URL`/`DATABASE_URL` não estiverem definidos e as variáveis separadas (DB_HOST, etc.) não existirem, o backend usa SQLite local automaticamente.

## �🛠️ Comandos para Executar

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

## ❓ E se eu não tiver a URL do Railway?

Você tem três opções para desenvolver sem acesso às credenciais privadas do projeto:

1) Rodar sem MySQL (zero configuração, usa SQLite automaticamente)
- Simplesmente rode:
  ```bat
  cd backend
  npm start
  ```
- Se nenhuma variável `MYSQL_URL`/`DATABASE_URL` e nenhum `DB_HOST` forem encontrados, o backend usa `database.sqlite` local automaticamente.
- Dica: Rode `npm run init-db` para criar as tabelas, e use os scripts em `backend/` como `create-test-user.js` para popular dados de teste.

2) Criar sua própria instância no Railway (gratuito com limites)
- Passos resumidos:
  1. Crie uma conta em https://railway.app e crie um novo projeto.
  2. Adicione um banco MySQL (Provision MySQL).
  3. Copie os dados de conexão (HOST, PORT, USER, PASSWORD, DATABASE) e monte a URL:
     ```
     mysql://USER:PASSWORD@HOST:PORT/DATABASE
     ```
  4. No `backend/.env`, defina `MYSQL_URL` com essa URL.
  5. Rode `npm run test:mysql` para validar.

3) Usar MySQL local (XAMPP/WAMP/MySQL Installer)
- Preencha no `backend/.env` as variáveis separadas:
  ```env
  DB_DIALECT=mysql
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=rivalis_db
  DB_USER=seu_usuario
  DB_PASSWORD=sua_senha
  ```

Arquivos úteis neste repositório:
- `RAILWAY_VARIABLES.txt` e `railway-env.txt`: modelos de variáveis para usar no Railway.

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

### Erro de Conexão com MySQL
1. Verifique se o serviço MySQL está ativo (`services.msc` no Windows)
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
# 🔄 Migração do Banco para MySQL

## ✅ O que mudou
- Backend agora usa **MySQL** como banco principal (antes: PostgreSQL/Supabase).
- `Sequelize` está configurado para aceitar `MYSQL_URL` ou variáveis individuais (`DB_HOST`, `DB_USER`, etc.).
- Scripts utilitários (`init-database`, `check-schemas`, `test-db`) foram atualizados para funcionar com MySQL e com fallback automático para SQLite em desenvolvimento.
- Documentos e exemplos de `.env` agora refletem as novas variáveis (`MYSQL_URL`, `DB_SSL`, ...).

## 📦 Novas variáveis suportadas
```env
MYSQL_URL=mysql://usuario:senha@host:3306/banco
DB_DIALECT=mysql
DB_HOST=host
DB_PORT=3306
DB_NAME=banco
DB_USER=usuario
DB_PASSWORD=senha
DB_SSL=false
```

> O fallback para SQLite permanece ativo quando nenhum dado MySQL é informado.

## 🚀 Passo a passo no Railway
1. **Criar service MySQL**: Project → *Add Plugin* → MySQL.
2. **Copiar credenciais** (aba *Connect*):
   - URL completa (`MYSQL_URL`) ou dados separados.
3. **Service do backend** → *Variables*:
   - `MYSQL_URL` (cole a connection string completa)
   - `DB_SSL=false` (Railway não exige SSL para MySQL atualmente)
   - `NODE_ENV=production`
   - `JWT_SECRET`, `FRONTEND_URL`, etc.
4. **Build settings** (somente backend):
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Redeploy** o serviço para aplicar as mudanças.
6. **One-off command** (apenas na primeira vez):
   ```bash
   npm run init-db
   ```
   Isso cria as tabelas dentro do banco MySQL.

## 🔍 Como validar
- **Logs do backend** devem mostrar algo como:
  ```
  🐬 Conectando ao MySQL via DATABASE_URL
  ✅ Conexão com banco de dados estabelecida com sucesso!
  ✅ Modelos sincronizados com o banco de dados!
  📊 6 tabelas disponíveis no banco
  ```
- **Railway → MySQL → Data**: precisa listar `users`, `championships`, `teams`, `players`, `games`, `goals`.
- Rodar o script localmente (usa SQLite se não houver credenciais):
  ```bash
  cd backend
  npm run init-db
  ```

## 🧪 Dica para testar localmente com MySQL
1. Instale MySQL 8 na máquina.
2. Crie banco e usuário dedicados:
   ```sqlnpm run init-db
   CREATE DATABASE rivalis_db CHARACTER SET utf8mb4;
   CREATE USER 'rivalis'@'localhost' IDENTIFIED BY 'senha';
   GRANT ALL PRIVILEGES ON rivalis_db.* TO 'rivalis'@'localhost';
   ```
3. Ajuste `.env` na pasta `backend`:
   ```env
   MYSQL_URL=mysql://rivalis:senha@localhost:3306/rivalis_db
   DB_SSL=false
   NODE_ENV=development
   ```
4. Rode `npm run init-db` e `npm run dev`.

## 🔁 O que fazer com dados antigos (PostgreSQL)
- Faça backup (`pg_dump`) antes de migrar.
- Exporte dados essenciais (usuários, campeonatos) em CSV ou JSON.
- Reimporte usando scripts ou via painel MySQL.
- Ajuste endpoints customizados que dependiam de funções específicas do PostgreSQL (não há nenhuma no código principal).

## 🗒️ Próximos passos sugeridos
- Atualizar todos os documentos antigos mencionando PostgreSQL (marcados com aviso).
- Configurar tarefa de migração para copiar dados do antigo banco se necessário.
- Criar testes automatizados com banco em memória (ex.: `mysql2` + contêiner Docker) para garantir compatibilidade contínua.

Se precisar de ajuda para importar os dados antigos ou validar a conexão no Railway, é só avisar! 🚀

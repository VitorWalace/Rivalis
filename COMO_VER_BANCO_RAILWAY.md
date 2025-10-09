# 🗄️ Como Ver Tabelas do Banco de Dados no Railway

## 📊 Opção 1: Usando o Railway Dashboard (Mais Fácil)

### Passo 1: Acessar o Banco de Dados

1. **Acesse:** https://railway.app
2. **Login** com sua conta
3. **Selecione seu projeto** "Rivalis"
4. **Click no serviço do Banco de Dados** (PostgreSQL)
   - Geralmente aparece como "Postgres" ou "Database"

### Passo 2: Ver Dados

Railway oferece duas opções:

#### Opção A: Railway Built-in Database Viewer (Recomendado)
1. No serviço do banco, click na aba **"Data"**
2. Você verá:
   - Lista de todas as tabelas
   - Número de registros
   - Estrutura das colunas
3. Click em qualquer tabela para ver os dados
4. Pode filtrar, buscar e editar diretamente

#### Opção B: Via Query
1. Na mesma aba **"Data"**
2. Click em **"Query"** 
3. Digite SQL:
   ```sql
   -- Ver todas as tabelas
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Ver dados de uma tabela específica
   SELECT * FROM users;
   SELECT * FROM championships;
   SELECT * FROM teams;
   SELECT * FROM players;
   SELECT * FROM games;
   SELECT * FROM goals;
   ```

---

## 💻 Opção 2: Conectar com Cliente de Banco de Dados

### Ferramentas Populares:
- **DBeaver** (Grátis, multiplataforma) ⭐ Recomendado
- **pgAdmin** (Grátis, focado em PostgreSQL)
- **TablePlus** (Pago, bonito)
- **DataGrip** (Pago, JetBrains)

### Passo a Passo com DBeaver:

#### 1. Instalar DBeaver
- Download: https://dbeaver.io/download/
- Versão Community (grátis) é suficiente

#### 2. Pegar Credenciais do Railway

No Railway:
1. **Selecione o serviço PostgreSQL**
2. Click na aba **"Variables"** ou **"Connect"**
3. Você verá algo como:

```
DATABASE_URL=postgresql://user:password@host:port/database

Ou separado:
PGHOST=containers-us-west-xxx.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=xxxxx
PGDATABASE=railway
```

#### 3. Conectar no DBeaver

1. **Abra DBeaver**
2. **Nova Conexão:** Click em "Nova Conexão" (ícone de plug)
3. **Selecione:** PostgreSQL
4. **Preencha:**
   ```
   Host: containers-us-west-xxx.railway.app (do Railway)
   Port: 5432
   Database: railway (ou o nome que aparece)
   Username: postgres (do Railway)
   Password: (cole a senha do Railway)
   ```
5. **Marque:** "SSL" se Railway usar (geralmente sim)
   - SSL mode: `require`
6. **Test Connection**
7. **Finish**

#### 4. Ver Tabelas

No DBeaver:
1. Expanda a conexão
2. `Databases` > `railway` (ou seu DB)
3. `Schemas` > `public`
4. `Tables` - **Aqui estão suas tabelas!**
5. Click direito em qualquer tabela > "View Data" para ver os registros

---

## 🔍 Opção 3: Via Terminal (Para Desenvolvedores)

### Conectar via psql (PostgreSQL CLI)

#### No Railway:
1. Vá no serviço PostgreSQL
2. Click em **"Connect"**
3. Copie o comando que aparece:

```bash
psql postgresql://postgres:senha@host:5432/railway
```

#### Execute no Terminal:

```bash
# Windows (PowerShell ou WSL)
# Linux / Mac
psql postgresql://postgres:senha@host:5432/railway

# Dentro do psql:
\dt              # Listar todas as tabelas
\d users         # Descrever estrutura da tabela users
SELECT * FROM users;    # Ver dados
SELECT * FROM championships;
```

---

## 📋 Tabelas do Rivalis

Seu banco deve ter estas tabelas:

### Tabelas Principais:
- `users` - Usuários do sistema
- `championships` - Campeonatos
- `teams` - Times
- `players` - Jogadores
- `games` - Partidas
- `goals` - Gols marcados

### Comandos SQL Úteis:

```sql
-- Ver todos os usuários
SELECT id, name, email, created_at FROM users;

-- Ver todos os campeonatos
SELECT id, name, sport, format, created_at FROM championships;

-- Ver times de um campeonato
SELECT t.name, t.logo, c.name as championship
FROM teams t
JOIN championships c ON t.championship_id = c.id;

-- Ver estatísticas de jogadores
SELECT p.name, p.stats, t.name as team
FROM players p
JOIN teams t ON p.team_id = t.id;

-- Contar registros por tabela
SELECT 
  'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'championships', COUNT(*) FROM championships
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'games', COUNT(*) FROM games
UNION ALL
SELECT 'goals', COUNT(*) FROM goals;
```

---

## 🎯 Recomendação por Situação

### Para Ver Rapidamente:
✅ **Use Railway Dashboard** → Aba "Data"
- Mais rápido
- Interface simples
- Boa para verificações rápidas

### Para Trabalhar com Dados:
✅ **Use DBeaver** ou **pgAdmin**
- Interface completa
- Pode editar dados facilmente
- Visualizações complexas
- Export/Import de dados

### Para Scripts/Automação:
✅ **Use psql via Terminal**
- Comandos rápidos
- Pode fazer scripts
- Bom para CI/CD

---

## 📸 Como Encontrar as Credenciais no Railway

### Caminho Visual:

```
Railway Dashboard
  ↓
Seu Projeto "Rivalis"
  ↓
Click no serviço "Postgres" (ícone de banco de dados)
  ↓
Aba "Variables" ou "Connect"
  ↓
Verá: DATABASE_URL ou credenciais individuais
```

### Variáveis que você vai encontrar:
```
DATABASE_URL=postgresql://postgres:xxxxx@containers-us-west-xxx.railway.app:5432/railway

Ou separadas:
PGHOST=containers-us-west-xxx.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=xxxxxxxxx
PGDATABASE=railway
```

---

## 🆘 Troubleshooting

### "Não vejo a aba Data"
- Certifique-se que clicou no **serviço do banco**, não no serviço do Node.js
- Alguns planos podem não ter essa feature

### "Connection refused"
- Verifique se Railway está rodando o banco
- Confirme que copiou as credenciais corretas
- Teste com o comando psql antes

### "SSL required"
- No DBeaver/pgAdmin: Marque "Use SSL"
- SSL Mode: `require` ou `prefer`

### "Não tenho PostgreSQL local"
- Não precisa! DBeaver já vem com drivers
- Ou use direto no Railway Dashboard

---

## 🎓 Dica Extra: Backup do Banco

Para fazer backup pelo Railway:

```bash
# Exportar todas as tabelas
pg_dump postgresql://postgres:senha@host:5432/railway > backup.sql

# Importar depois
psql postgresql://postgres:senha@host:5432/railway < backup.sql
```

---

**Qual opção você prefere usar?** 
- Railway Dashboard (mais simples) ⭐
- DBeaver (mais completo)
- Terminal (mais rápido)

Posso te ajudar com qualquer uma! 🚀

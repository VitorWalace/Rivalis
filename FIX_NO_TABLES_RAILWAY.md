# 🔧 SOLUÇÃO - "You have no tables" no Railway (MySQL)

## 🐛 Problema
O Railway mostra **"You have no tables"** porque o banco foi criado mas as **tabelas não foram sincronizadas** pelo backend.

## ✅ Solução - 3 Métodos

---

### Método 1: Sincronizar automaticamente (Recomendado) ⭐

O backend está preparado para **criar as tabelas automaticamente** quando sobe com as variáveis MySQL corretas.

#### Passo a passo

1. Garanta que o serviço tenha `MYSQL_URL` (ou `DB_HOST`, `DB_USER`, etc.) configurados.
2. Faça um redeploy do backend no Railway.
3. Acompanhe os logs até ver mensagens semelhantes a:
   ```
   🐬 Conectando ao MySQL via DATABASE_URL
   ✅ Conexão com banco de dados estabelecida com sucesso!
   ✅ Modelos sincronizados com o banco de dados!
   📊 6 tabelas disponíveis no banco
   ```
4. Atualize a página **Railway → MySQL → Data** e confirme a lista de tabelas.

---

### Método 2: Rodar o script `init-db`

Caso o deploy não sincronize as tabelas automaticamente:

1. Abra o serviço do backend no Railway.
2. Vá em **Settings → One-off Commands**.
3. Execute:
   ```bash
   npm run init-db
   ```
4. Aguarde a finalização e confira os logs (o script lista todas as tabelas encontradas).

> Preferiu usar a CLI? `railway run npm run init-db` funciona da mesma forma.

---

### Método 3: Criar tabelas via SQL

Se você precisa de controle manual, use o editor SQL do Railway:

1. Vá em **Railway → MySQL → Query**.
2. Cole e execute o SQL abaixo.

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  isActive TINYINT(1) DEFAULT 1,
  lastLogin DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Championships
CREATE TABLE IF NOT EXISTS championships (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport ENUM('futebol','futsal','basquete','volei') NOT NULL DEFAULT 'futebol',
  format ENUM('pontos-corridos','eliminatorias','grupos') NOT NULL DEFAULT 'pontos-corridos',
  status ENUM('rascunho','ativo','finalizado','cancelado') NOT NULL DEFAULT 'rascunho',
  startDate DATETIME NULL,
  endDate DATETIME NULL,
  description TEXT NULL,
  maxTeams INT NULL,
  currentRound INT DEFAULT 1,
  totalRounds INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy CHAR(36) NULL,
  CONSTRAINT fk_championships_users FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  logo TEXT NULL,
  points INT DEFAULT 0,
  wins INT DEFAULT 0,
  draws INT DEFAULT 0,
  losses INT DEFAULT 0,
  goalsFor INT DEFAULT 0,
  goalsAgainst INT DEFAULT 0,
  championshipId CHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teams_championships FOREIGN KEY (championshipId) REFERENCES championships(id) ON DELETE CASCADE
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position ENUM('goleiro','zagueiro','lateral','volante','meia','atacante') NULL,
  number INT NULL,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  yellowCards INT DEFAULT 0,
  redCards INT DEFAULT 0,
  gamesPlayed INT DEFAULT 0,
  wins INT DEFAULT 0,
  xp INT DEFAULT 0,
  achievements JSON DEFAULT (JSON_ARRAY()),
  teamId CHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_players_teams FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id CHAR(36) PRIMARY KEY,
  round INT NOT NULL DEFAULT 1,
  status ENUM('agendado','ao-vivo','finalizado','cancelado') NOT NULL DEFAULT 'agendado',
  date DATETIME NULL,
  venue VARCHAR(255) NULL,
  homeScore INT NULL,
  awayScore INT NULL,
  startTime DATETIME NULL,
  endTime DATETIME NULL,
  notes TEXT NULL,
  championshipId CHAR(36) NULL,
  homeTeamId CHAR(36) NULL,
  awayTeamId CHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_games_championships FOREIGN KEY (championshipId) REFERENCES championships(id) ON DELETE CASCADE,
  CONSTRAINT fk_games_home_team FOREIGN KEY (homeTeamId) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_games_away_team FOREIGN KEY (awayTeamId) REFERENCES teams(id) ON DELETE SET NULL
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id CHAR(36) PRIMARY KEY,
  minute INT NULL,
  type ENUM('normal','penalti','contra','falta') NOT NULL DEFAULT 'normal',
  description VARCHAR(255) NULL,
  gameId CHAR(36) NULL,
  playerId CHAR(36) NULL,
  assistPlayerId CHAR(36) NULL,
  teamId CHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goals_games FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
  CONSTRAINT fk_goals_player FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_goals_assist FOREIGN KEY (assistPlayerId) REFERENCES players(id) ON DELETE SET NULL,
  CONSTRAINT fk_goals_team FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teams_championship ON teams(championshipId);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(teamId);
CREATE INDEX IF NOT EXISTS idx_games_championship ON games(championshipId);
CREATE INDEX IF NOT EXISTS idx_goals_game ON goals(gameId);
CREATE INDEX IF NOT EXISTS idx_goals_player ON goals(playerId);
```

3. Atualize a aba **Data** e confirme as tabelas.

---

## 🔍 Como conferir

1. **Railway → MySQL → Data** deve listar: `users`, `championships`, `teams`, `players`, `games`, `goals`.
2. No editor SQL, execute:
   ```sql
   SHOW TABLES;
   ```
3. Verifique os logs do backend (procure por "Modelos sincronizados").

---

## 🎯 Checklist

- [ ] Variáveis MySQL configuradas
- [ ] Redeploy realizado
- [ ] Logs confirmam sincronização
- [ ] Tabelas visíveis na aba Data
- [ ] Teste de criação de usuário concluído

---

## 🆘 Se ainda não der certo

- **Erro "ER_ACCESS_DENIED_ERROR"**: verifique usuário/senha na `MYSQL_URL`.
- **Erro "Handshake inactivity timeout"**: confirme host/porta e se o banco está online.
- **Erro "Unknown database"**: crie manualmente a base (Railway → MySQL → Settings → Create Database) ou ajuste o nome informado.

---

## 💡 Dicas Extras

1. Teste a API após criar as tabelas: `https://sua-url.railway.app/api/health` deve responder `success: true`.
2. Crie um usuário via Postman/Insomnia e confirme em `SELECT * FROM users LIMIT 5;`.
3. Para resetar tudo, execute `DROP DATABASE nome; CREATE DATABASE nome;` e rode `npm run init-db` novamente.

---

Escolha o método que preferir e me avise se precisar de ajuda! 🎯

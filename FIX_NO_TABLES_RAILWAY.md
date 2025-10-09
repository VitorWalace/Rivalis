# 🔧 SOLUÇÃO - "You have no tables" no Railway

## 🐛 Problema
O Railway mostra **"You have no tables"** porque o banco foi criado mas as **tabelas não foram inicializadas**.

## ✅ Solução - 3 Métodos

---

### Método 1: Inicializar Automaticamente (Recomendado) ⭐

O backend agora foi atualizado para **criar as tabelas automaticamente** ao iniciar.

#### Passo a Passo:

1. **Faça commit das mudanças:**
   ```bash
   git add .
   git commit -m "fix: auto create database tables on startup"
   git push
   ```

2. **Railway vai fazer redeploy automaticamente**
   - Aguarde 1-2 minutos
   - Veja os logs no Railway

3. **Verifique os logs no Railway:**
   ```
   ✅ Conexão com banco de dados estabelecida
   ✅ Modelos sincronizados com o banco de dados!
   📊 6 tabelas disponíveis no banco
   🚀 Servidor Rivalis rodando na porta 5000
   ```

4. **Atualize a página do banco:**
   - Railway > Postgres > Database > Aba "Data"
   - Pressione F5 ou atualize a página
   - ✅ Deve aparecer as 6 tabelas!

---

### Método 2: Executar Script Manual no Railway

Se o método 1 não funcionar:

#### Via Railway CLI:

1. **Instale Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Link ao projeto:**
   ```bash
   railway link
   ```

3. **Execute o script:**
   ```bash
   railway run npm run init-db
   ```

#### Via Railway Dashboard:

1. **Vá no serviço do Node.js (backend)**
2. **Settings > One-off Commands**
3. **Execute:**
   ```bash
   npm run init-db
   ```

---

### Método 3: Executar SQL Manualmente

Se preferir criar as tabelas manualmente:

#### No Railway:

1. **Postgres > Database > Aba "Query"**
2. **Cole e execute este SQL:**

```sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Campeonatos
CREATE TABLE IF NOT EXISTS championships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  format VARCHAR(100),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Times
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  championship_id UUID REFERENCES championships(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Jogadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  number INTEGER,
  position VARCHAR(100),
  avatar TEXT,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  stats JSONB DEFAULT '{}',
  achievements JSONB DEFAULT '[]',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Partidas
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id UUID REFERENCES championships(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'scheduled',
  round INTEGER,
  date TIMESTAMP,
  location VARCHAR(255),
  events JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Gols
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  minute INTEGER,
  type VARCHAR(50) DEFAULT 'normal',
  assist_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_championships_user ON championships(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_championship ON teams(championship_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_games_championship ON games(championship_id);
CREATE INDEX IF NOT EXISTS idx_goals_game ON goals(game_id);
CREATE INDEX IF NOT EXISTS idx_goals_player ON goals(player_id);
```

3. **Execute** (click no botão "Run")
4. **Atualize a página** (F5)
5. ✅ Tabelas criadas!

---

## 🔍 Como Verificar se Funcionou

### 1. Via Railway Dashboard:
```
Postgres > Database > Aba "Data"
```
Deve mostrar:
- ✅ users
- ✅ championships
- ✅ teams
- ✅ players
- ✅ games
- ✅ goals

### 2. Via Railway Query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 3. Via Logs do Backend:
```
✅ Modelos sincronizados com o banco de dados!
📊 6 tabelas disponíveis no banco
```

---

## 🎯 Checklist

- [ ] Código atualizado (commit e push)
- [ ] Railway fez redeploy automático
- [ ] Logs mostram "Modelos sincronizados"
- [ ] Refresh na página do banco (F5)
- [ ] 6 tabelas aparecem na lista
- [ ] Testou criar usuário no app

---

## 🆘 Se Ainda Não Funcionar

### Erro: "relation does not exist"
**Causa:** Tabelas não foram criadas  
**Solução:** Execute Método 2 ou 3

### Erro: "permission denied"
**Causa:** Credenciais do banco  
**Solução:** Verifique variáveis DATABASE_URL no Railway

### Erro: "timeout"
**Causa:** Banco demorou para responder  
**Solução:** 
1. Railway > Postgres > Restart
2. Aguarde 30s e tente novamente

---

## 💡 Dicas

1. **Após criar tabelas, teste:**
   ```
   https://sua-url.railway.app/api/health
   ```

2. **Crie um usuário teste via Postman/Insomnia:**
   ```
   POST https://sua-url.railway.app/api/auth/register
   {
     "name": "Teste",
     "email": "teste@teste.com",
     "password": "123456"
   }
   ```

3. **Verifique no Railway:**
   ```
   Postgres > Data > users
   ```
   Deve aparecer o usuário criado! ✅

---

## 🚀 Próximos Passos

Após as tabelas criadas:
1. ✅ Teste criar conta no frontend
2. ✅ Verifique se usuário aparece no banco
3. ✅ Configure VITE_API_URL no Vercel
4. ✅ Pronto para usar!

---

**Qual método você quer usar?**
- Método 1 (automático) ⭐ Recomendado
- Método 2 (script manual)
- Método 3 (SQL direto)

Me avise se precisar de ajuda! 🎯

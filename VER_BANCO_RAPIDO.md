# 🚀 GUIA RÁPIDO - Ver Banco de Dados Railway

## ⚡ Método Mais Rápido (30 segundos)

### 1. Acesse Railway
```
https://railway.app
```

### 2. Entre no Projeto
- Click no projeto "Rivalis"

### 3. Selecione o Banco
- Click no serviço **"Postgres"** (ícone 🗄️)
- **NÃO** no serviço do Node.js

### 4. Veja os Dados
- Click na aba **"Data"**
- Pronto! Você verá:
  - ✅ Lista de todas as tabelas
  - ✅ Número de registros
  - ✅ Dados de cada tabela

### 5. Explore
- Click em qualquer tabela para ver os dados
- Use a busca para filtrar
- Pode editar direto se precisar

---

## 📊 O Que Você Deve Ver

### Tabelas do Rivalis:

```
📋 users             → Usuários cadastrados
📋 championships     → Campeonatos criados
📋 teams             → Times dos campeonatos
📋 players           → Jogadores dos times
📋 games             → Partidas realizadas
📋 goals             → Gols marcados
```

---

## 🔍 Consultas SQL Úteis

Se preferir usar SQL na aba "Query":

### Ver todos os usuários:
```sql
SELECT * FROM users;
```

### Ver campeonatos ativos:
```sql
SELECT id, name, sport, status, created_at 
FROM championships 
ORDER BY created_at DESC;
```

### Ver times e quantos jogadores tem:
```sql
SELECT 
  t.name as time,
  c.name as campeonato,
  COUNT(p.id) as total_jogadores
FROM teams t
LEFT JOIN championships c ON t.championship_id = c.id
LEFT JOIN players p ON p.team_id = t.id
GROUP BY t.id, t.name, c.name;
```

### Estatísticas gerais:
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM championships) as campeonatos,
  (SELECT COUNT(*) FROM teams) as times,
  (SELECT COUNT(*) FROM players) as jogadores,
  (SELECT COUNT(*) FROM games) as partidas,
  (SELECT COUNT(*) FROM goals) as gols;
```

---

## 🎯 Atalhos

### Railway Dashboard → Banco de Dados:
```
Dashboard > Projeto > Click em "Postgres" > Aba "Data"
```

### Para conectar ferramentas externas:
```
Dashboard > Postgres > Aba "Variables" > Copie DATABASE_URL
```

---

## 💡 Dica

Se você está procurando:
- ✅ **Ver dados rapidamente** → Use Railway Dashboard (aba Data)
- ✅ **Fazer queries complexas** → Use Railway Query ou DBeaver
- ✅ **Editar dados** → Railway Dashboard permite edição inline
- ✅ **Fazer backup** → Use pg_dump (veja COMO_VER_BANCO_RAILWAY.md)

---

**Precisa de ajuda mais detalhada?**  
Veja o arquivo: `COMO_VER_BANCO_RAILWAY.md` 📚

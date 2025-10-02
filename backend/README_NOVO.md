# Rivalis Backend

Backend completo da aplicação Rivalis - Sistema de gerenciamento de campeonatos esportivos.

## 🚀 Status do Projeto

✅ **CONCLUÍDO** - Backend totalmente funcional com:
- Autenticação JWT completa
- CRUD para todas as entidades (Campeonatos, Times, Jogadores, Jogos, Gols)
- Validação de dados robusta
- Sistema de pontuação automático
- Estatísticas e ranking
- Sistema de XP para jogadores
- Banco de dados SQLite (desenvolvimento) com suporte a PostgreSQL (produção)

## 🏗️ Arquitetura

- **Framework**: Node.js + Express
- **ORM**: Sequelize v6
- **Banco de Dados**: SQLite (dev) / PostgreSQL (prod)
- **Autenticação**: JWT + bcrypt
- **Validação**: express-validator
- **Segurança**: helmet, cors, rate-limiting

## 📊 Modelos de Dados

### User
- ID, nome, email, senha (hash)
- Data de criação e último login
- Relacionamento com campeonatos criados

### Championship
- ID, nome, esporte, formato, status
- Descrição, data de início/fim
- Relacionamento com times e jogos

### Team
- ID, nome, cor, logo
- Estatísticas: pontos, vitórias, empates, derrotas
- Gols feitos/sofridos, diferença de gols
- Relacionamento com jogadores e jogos

### Player
- ID, nome, posição, número da camisa
- Estatísticas: gols, assistências, XP
- Nível calculado automaticamente
- Relacionamento com times e gols

### Game
- ID, times da casa/visitante, rodada
- Placar, status, data/hora
- Local do jogo
- Relacionamento com gols

### Goal
- ID, jogador, time, jogo
- Minuto, tipo (normal/pênalti/contra)
- Jogador da assistência
- Atualização automática de estatísticas

## 🔧 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Configuração

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
cp .env.example .env
# Editar .env conforme necessário
```

3. **Executar o servidor**:
```bash
# Desenvolvimento (porta 5001)
PORT=5001 node server.js

# Ou usando npm script (se configurado)
npm start
```

### Configuração do Banco

**SQLite (Padrão - Desenvolvimento)**:
- Não requer configuração adicional
- Banco criado automaticamente em `database.sqlite`

**PostgreSQL (Produção)**:
```bash
# No arquivo .env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/rivalis_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rivalis_db
DB_USER=usuario
DB_PASSWORD=senha
```

## 🧪 Testes

### Testes Manuais
```bash
# Testar autenticação
node test-api.js

# Testar CRUD completo
node test-crud.js
```

### Health Check
```
GET http://localhost:5001/health
```

## 📡 API Endpoints

Consulte o arquivo `API_ENDPOINTS.md` para documentação completa dos endpoints.

### Principais Rotas:
- **Auth**: `/api/auth/*` - Registro, login, validação
- **Campeonatos**: `/api/championships/*` - CRUD campeonatos
- **Times**: `/api/teams/*` - CRUD times
- **Jogadores**: `/api/players/*` - CRUD jogadores
- **Jogos**: `/api/games/*` - CRUD jogos e finalização
- **Gols**: `/api/goals/*` - CRUD gols com estatísticas

## 🔐 Autenticação

Sistema JWT com:
- Registro com validação de senha forte
- Login com verificação de credenciais
- Middleware de proteção de rotas
- Expiração configurável de tokens
- Refresh de tokens via re-login

## ✅ Validação de Dados

Validação robusta usando express-validator:
- Campos obrigatórios e opcionais
- Tipos de dados (UUID, email, números)
- Comprimento de strings
- Formatos específicos (cores hex, datas ISO)
- Validação de relacionamentos

## 📈 Características Avançadas

### Sistema de Pontuação
- Automático na finalização de jogos
- Vitória: 3 pontos
- Empate: 1 ponto
- Derrota: 0 pontos

### Sistema de XP
- Gols: +10 XP
- Assistências: +5 XP
- Cálculo automático de nível

### Estatísticas Automáticas
- Times: W/D/L, gols, saldo, pontos
- Jogadores: gols, assistências, XP, nível
- Classificação por pontos e critérios de desempate

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Configurar Vercel Postgres
# Atualizar .env com credenciais de produção
vercel deploy
```

### Outras Plataformas
- Railway
- Heroku
- DigitalOcean
- AWS

## 🔧 Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Configuração Sequelize
├── controllers/
│   ├── authController.js    # Autenticação
│   ├── championshipController.js
│   ├── teamController.js
│   ├── playerController.js
│   ├── gameController.js
│   └── goalController.js
├── middleware/
│   ├── auth.js              # JWT verification
│   └── validation.js        # express-validator rules
├── models/
│   ├── index.js             # Associações
│   ├── User.js
│   ├── Championship.js
│   ├── Team.js
│   ├── Player.js
│   ├── Game.js
│   └── Goal.js
├── routes/
│   ├── auth.js
│   ├── championships.js
│   ├── teams.js
│   ├── players.js
│   ├── games.js
│   └── goals.js
├── utils/
│   └── jwt.js               # JWT utilities
├── .env                     # Environment variables
├── .env.example             # Template
├── server.js                # Entry point
└── package.json
```

## 🐛 Troubleshooting

### Porta em uso
```bash
# Usar porta diferente
PORT=5001 node server.js
```

### Problemas de CORS
Verificar `FRONTEND_URL` no `.env`

### Erro de associação
Verificar modelos e relacionamentos no `models/index.js`

### Banco de dados
```bash
# Resetar SQLite
rm database.sqlite
# Reiniciar servidor para recriar
```

## 📝 TODO/Melhorias Futuras

- [ ] Testes automatizados (Jest/Mocha)
- [ ] Documentação OpenAPI/Swagger
- [ ] Cache com Redis
- [ ] Upload de imagens (times/jogadores)
- [ ] Notificações em tempo real
- [ ] Logs estruturados
- [ ] Monitoramento de performance
- [ ] Backup automático do banco

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para detalhes.
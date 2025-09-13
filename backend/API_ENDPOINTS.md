# API Endpoints - Rivalis Backend

Base URL: `http://localhost:5001`

## Autenticação

### POST `/api/auth/register`
Registrar novo usuário
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@email.com",
  "password": "MinhaSenh@123"
}
```

### POST `/api/auth/login`
Fazer login
```json
{
  "email": "usuario@email.com",
  "password": "MinhaSenh@123"
}
```

### GET `/api/auth/me`
Obter dados do usuário logado (requer token)

### POST `/api/auth/logout`
Fazer logout (requer token)

## Campeonatos

### POST `/api/championships`
Criar novo campeonato (requer token)
```json
{
  "name": "Nome do Campeonato",
  "sport": "football",
  "format": "league",
  "description": "Descrição opcional"
}
```

### GET `/api/championships`
Listar campeonatos do usuário (requer token)

### GET `/api/championships/:id`
Buscar campeonato por ID (requer token)

### PUT `/api/championships/:id`
Atualizar campeonato (requer token)

### DELETE `/api/championships/:id`
Deletar campeonato (requer token)

## Times

### POST `/api/teams`
Criar novo time (requer token)
```json
{
  "name": "Nome do Time",
  "championshipId": "uuid-do-campeonato",
  "color": "#FF0000"
}
```

### GET `/api/teams/championship/:championshipId`
Listar times de um campeonato (requer token)

### GET `/api/teams/:id`
Buscar time por ID (requer token)

### PUT `/api/teams/:id`
Atualizar time (requer token)

### DELETE `/api/teams/:id`
Deletar time (requer token)

## Jogadores

### POST `/api/players`
Criar novo jogador (requer token)
```json
{
  "name": "Nome do Jogador",
  "teamId": "uuid-do-time",
  "position": "Atacante",
  "number": 10
}
```

### GET `/api/players/team/:teamId`
Listar jogadores de um time (requer token)

### GET `/api/players/championship/:championshipId`
Listar jogadores de um campeonato (requer token)

### GET `/api/players/:id`
Buscar jogador por ID (requer token)

### PUT `/api/players/:id`
Atualizar jogador (requer token)

### DELETE `/api/players/:id`
Deletar jogador (requer token)

## Jogos

### POST `/api/games`
Criar novo jogo (requer token)
```json
{
  "championshipId": "uuid-do-campeonato",
  "homeTeamId": "uuid-do-time-casa",
  "awayTeamId": "uuid-do-time-visitante",
  "round": 1,
  "venue": "Estádio XYZ",
  "scheduledAt": "2024-01-15T15:00:00Z"
}
```

### GET `/api/games/championship/:championshipId`
Listar jogos de um campeonato (requer token)

### GET `/api/games/:id`
Buscar jogo por ID (requer token)

### PUT `/api/games/:id`
Atualizar jogo (requer token)

### POST `/api/games/:id/finish`
Finalizar jogo e calcular pontuação (requer token)

### DELETE `/api/games/:id`
Deletar jogo (requer token)

## Gols

### POST `/api/goals`
Adicionar novo gol (requer token)
```json
{
  "gameId": "uuid-do-jogo",
  "playerId": "uuid-do-jogador",
  "teamId": "uuid-do-time",
  "minute": 45,
  "type": "normal",
  "assistPlayerId": "uuid-do-assistente"
}
```

### GET `/api/goals/game/:gameId`
Listar gols de um jogo (requer token)

### GET `/api/goals/player/:playerId`
Listar gols de um jogador (requer token)

### PUT `/api/goals/:id`
Atualizar gol (requer token)

### DELETE `/api/goals/:id`
Deletar gol (requer token)

## Utilitários

### GET `/health`
Health check da API

## Autenticação
Todos os endpoints exceto `/health` e `/api/auth/register` e `/api/auth/login` requerem autenticação via Bearer Token no header:
```
Authorization: Bearer <token>
```

## Códigos de Status
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `409` - Conflito (ex: dados duplicados)
- `500` - Erro interno do servidor

## Formatos de Resposta
Todas as respostas seguem o padrão:
```json
{
  "success": boolean,
  "message": "string",
  "data": object,
  "errors": array
}
```
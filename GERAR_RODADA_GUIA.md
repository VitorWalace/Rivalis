# Guia Rápido - Gerar Rodadas no Rivalis

## Passos para fazer o botão "Gerar Rodada" funcionar:

### 1. Configurar Backend
```bash
cd backend
node scripts/ensure-createdBy-column.js
node server.js
```

### 2. Criar Campeonato Válido
- Use o Wizard ou Dashboard para criar campeonato
- Agora usa POST /championships com enums corretos
- Retorna UUID real em vez de ID fake "champ_..."

### 3. Adicionar Times
- Adicione pelo menos 2 times ao campeonato
- Cada time deve ser criado via POST /teams
- Times devem ter championshipId correto

### 4. Gerar Rodadas
- Acesse página do campeonato
- Sincronização automática busca dados reais do backend
- Botão habilitado quando teams.length >= 2
- Clique gera POST /games/generate-round/:id
- Jogos aparecem sem reload da página

## Endpoints Principais
- `POST /championships` - Criar campeonato
- `GET /championships/:id` - Buscar campeonato com times/jogos
- `POST /teams` - Criar time
- `POST /games/generate-round/:id` - Gerar rodada

## Troubleshooting
- Se "Campeonato não encontrado": ID deve ser UUID, não champ_xxx
- Se botão desabilitado: Confirme que backend retorna >= 2 times
- Se erro 400: Verifique se times existem no championshipId correto

## Scripts de Teste
```bash
# Teste end-to-end completo
node scripts/test-generate-round-flow.js

# Garantir coluna createdBy
node scripts/ensure-createdBy-column.js
```

## Correções Aplicadas
✅ Middleware aceita enums inglês/português  
✅ Frontend sincroniza com backend  
✅ IDs reais em vez de fake  
✅ Atualização sem reload  
✅ Permissões flexíveis para registros antigos  
# Teste Manual do Avanço de Fase

## Como testar

1. **Abra o console do navegador** (F12 → Console)
2. **Finalize uma partida** de eliminatórias
3. **Observe os logs** no console

## Logs esperados

### ✅ SUCESSO
```
🔄 Salvando resultado da partida...
✅ Resultado salvo com sucesso!
🚀 Iniciando avanço para próxima fase...
📊 Dados do jogo: { winnerId, round, championshipFormat, championshipId }
🎯 Avançando vencedor... { gameId, currentRound, winnerId, winnerName }
📨 Resposta do backend: { success: true, ... }
✨ [Time] avançou para a próxima fase!
```

### ❌ ERRO - Jogo não finalizado
```
❌ Erro ao avançar vencedor: ...
📄 Detalhes do erro: { status: 400, data: { message: "Jogo precisa estar finalizado..." } }
```

### ❌ ERRO - Próximo jogo não encontrado
```
❌ Erro ao avançar vencedor: ...
📄 Detalhes do erro: { status: 404, data: { message: "Próximo jogo não encontrado" } }
```

## O que fazer se der erro

1. **Copie TODOS os logs do console** (especialmente os ❌)
2. **Copie os logs do terminal do backend** (onde está rodando `npm start`)
3. **Me envie para análise**

## Verificar estrutura do bracket

Execute no console do navegador:
```javascript
// Ver o jogo atual
console.log(window.game);

// Deve ter:
// - id
// - round (número da rodada)
// - status (deve ficar 'finalizado' após salvar)
// - championship (objeto com format: 'eliminatorias')
// - championshipId
```

# 🏆 Sistema de Visualização de Mata-Mata (Knockout Bracket)

## Visão Geral

Sistema completo para visualização e gerenciamento de campeonatos no formato **Mata-Mata (Eliminatórias)** com interface intuitiva e profissional.

## ✨ Funcionalidades

### 1. **Dois Modos de Visualização**
- **📋 Modo Lista**: Visualização detalhada por fases com cards expandidos
- **🌳 Modo Bracket**: Árvore de eliminação horizontal tradicional

### 2. **Timeline de Progresso**
- Barra de progresso geral do campeonato
- Indicadores visuais de cada fase (Concluída ✅ | Em Andamento ⏱ | Aguardando 🔒)
- Destaque da fase atual
- Mensagem especial ao concluir o campeonato 🏆

### 3. **Cards de Confronto Melhorados**
- Status visual com cores e ícones
- Destaque do vencedor com borda verde
- Placar grande e legível
- Indicador de próxima fase
- Informações de data e local
- Sistema de dependências (aguardando resultado de partida anterior)

### 4. **Organização por Fases**
- Agrupamento automático: Final, Semifinal, Quartas, Oitavas, etc.
- Progress bar individual por fase
- Contador de partidas concluídas
- Emojis distintivos (🏆 🥇 🥈 🥉 ⚡)

### 5. **Visualização Bracket**
- Layout horizontal com scroll
- Controles de zoom (50% - 200%)
- Cards compactos otimizados
- Espaçamento dinâmico entre níveis
- Sticky headers das fases

## 📦 Componentes Criados

### `KnockoutBracket.tsx`
Componente principal que integra tudo.

```tsx
import KnockoutBracket from '@/components/KnockoutBracket';
import type { BracketMatch } from '@/types/bracket';

<KnockoutBracket
  phases={phases}
  onMatchClick={(match: BracketMatch) => {
    console.log('Partida clicada:', match);
    // Navegar para detalhes, editar, etc.
  }}
/>
```

### `ProgressTimeline.tsx`
Timeline de progresso do campeonato.

```tsx
import ProgressTimeline from '@/components/ProgressTimeline';

<ProgressTimeline phases={phases} />
```

### `PhaseSection.tsx`
Seção de cada fase no modo lista.

```tsx
import PhaseSection from '@/components/PhaseSection';

<PhaseSection 
  phase={phase} 
  onMatchClick={handleMatchClick}
/>
```

### `MatchupCard.tsx`
Card de confronto individual.

```tsx
import MatchupCard from '@/components/MatchupCard';

<MatchupCard
  match={match}
  nextPhaseName="Semifinal"
  onMatchClick={handleMatchClick}
/>
```

### `BracketView.tsx`
Visualização em árvore de eliminação.

```tsx
import BracketView from '@/components/BracketView';

<BracketView
  phases={phases}
  onMatchClick={handleMatchClick}
/>
```

## 🛠️ Utilitários (bracketHelpers.ts)

### `groupMatchesByPhase(matches: BracketMatch[]): Phase[]`
Agrupa partidas por fase/rodada.

```tsx
import { groupMatchesByPhase } from '@/utils/bracketHelpers';

const phases = groupMatchesByPhase(allMatches);
```

### `calculateBracketProgress(phases: Phase[])`
Calcula progresso geral do campeonato.

```tsx
import { calculateBracketProgress } from '@/utils/bracketHelpers';

const { percentage, currentPhase, completedPhases } = calculateBracketProgress(phases);
```

### `buildBracketTree(matches: BracketMatch[]): BracketNode | null`
Constrói árvore hierárquica para visualização bracket.

```tsx
import { buildBracketTree } from '@/utils/bracketHelpers';

const tree = buildBracketTree(allMatches);
```

### `getMatchStatusInfo(match: BracketMatch)`
Retorna informações visuais do status da partida.

```tsx
import { getMatchStatusInfo } from '@/utils/bracketHelpers';

const { label, color, icon } = getMatchStatusInfo(match);
// { label: 'Finalizada', color: 'text-green-600...', icon: '✅' }
```

### `generateKnockoutMatches(teamIds: string[], startDate?: Date): BracketMatch[]`
Gera estrutura de partidas de mata-mata.

```tsx
import { generateKnockoutMatches } from '@/utils/bracketHelpers';

const matches = generateKnockoutMatches(
  ['team1', 'team2', 'team3', 'team4', 'team5', 'team6', 'team7', 'team8'],
  new Date()
);
// Retorna 7 partidas (4 quartas + 2 semis + 1 final)
```

## 📘 Tipos TypeScript (bracket.ts)

### `BracketMatch`
```typescript
interface BracketMatch {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore?: number;
  awayScore?: number;
  status: 'pending' | 'scheduled' | 'live' | 'finished' | 'locked';
  winner?: Team;
  nextMatchId?: string; // ID da partida seguinte
  dependsOn?: string[]; // IDs das partidas que definem os times
  round: number; // 1 = final, 2 = semi, 3 = quartas, etc.
  position: number;
  scheduledDate?: Date | string;
  location?: string;
}
```

### `Phase`
```typescript
interface Phase {
  name: string; // "Final", "Semifinal", etc.
  displayName: string; // "🏆 FINAL", "🥇 SEMIFINAL", etc.
  round: number;
  matches: BracketMatch[];
  isCompleted: boolean;
  isCurrent: boolean;
  totalMatches: number;
  completedMatches: number;
}
```

### `BracketNode`
```typescript
interface BracketNode {
  match: BracketMatch;
  children?: [BracketNode | null, BracketNode | null];
  level: number;
  position: number;
}
```

## 🎨 Estados Visuais

### Status de Partida
- ✅ **Finalizada**: Verde, mostra vencedor
- 🔴 **Ao Vivo**: Azul, animação
- 🕐 **Agendada**: Amarelo
- 🔒 **Aguardando**: Cinza, travada
- ⏳ **Pendente**: Cinza

### Fases
- 🏆 **Final**: Ícone troféu, destaque dourado
- 🥇 **Semifinal**: Medalha de ouro
- 🥈 **Quartas**: Medalha de prata
- 🥉 **Oitavas**: Medalha de bronze
- ⚡ **Outras**: Raio

## 📱 Responsividade

### Desktop (≥1024px)
- Bracket horizontal completo
- Grid de 3 colunas no modo lista
- Todos os recursos habilitados

### Tablet (768px - 1023px)
- Bracket com scroll horizontal
- Grid de 2 colunas no modo lista
- Controles de zoom disponíveis

### Mobile (<768px)
- Modo lista recomendado
- Grid de 1 coluna
- Cards otimizados para toque

## 🚀 Exemplo Completo de Uso

```tsx
import { useState, useEffect } from 'react';
import KnockoutBracket from '@/components/KnockoutBracket';
import { groupMatchesByPhase, generateKnockoutMatches } from '@/utils/bracketHelpers';
import type { BracketMatch, Phase } from '@/types/bracket';

export default function ChampionshipPage() {
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    // Buscar ou gerar partidas
    const teamIds = ['team1', 'team2', 'team3', 'team4', 'team5', 'team6', 'team7', 'team8'];
    const matches = generateKnockoutMatches(teamIds, new Date());
    
    // Agrupar por fase
    const groupedPhases = groupMatchesByPhase(matches);
    setPhases(groupedPhases);
  }, []);

  const handleMatchClick = (match: BracketMatch) => {
    console.log('Navegar para detalhes da partida:', match.id);
    // Implementar navegação ou modal
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Campeonato de Futsal</h1>
      
      <KnockoutBracket
        phases={phases}
        onMatchClick={handleMatchClick}
      />
    </div>
  );
}
```

## 🎯 Integração com Backend

### Estrutura de Dados Esperada

```typescript
// GET /api/championships/:id/matches
{
  success: true,
  data: {
    matches: [
      {
        id: "match1",
        homeTeamId: "team1",
        awayTeamId: "team2",
        homeScore: 3,
        awayScore: 2,
        status: "finished",
        round: 3, // Quartas
        position: 0,
        winnerId: "team1",
        nextMatchId: "match5",
        dependsOn: null,
        scheduledDate: "2025-10-25T14:00:00Z",
        location: "Ginásio Municipal"
      },
      // ...
    ]
  }
}
```

### Mapeamento de Status

```typescript
// Backend → Frontend
const statusMap = {
  'pending': 'pending',
  'scheduled': 'scheduled',
  'in_progress': 'live',
  'finished': 'finished',
  'awaiting_teams': 'locked',
};
```

## 🔧 Customização

### Cores do Tema
Edite as classes Tailwind nos componentes:
- `bg-primary-500` → Cor principal
- `bg-green-500` → Sucesso/Concluído
- `bg-yellow-500` → Aguardando
- `bg-gray-500` → Desabilitado

### Espaçamento do Bracket
Ajuste em `BracketView.tsx`:
```tsx
style={{
  gap: `${Math.pow(2, phaseIndex) * 20}px`, // Altere o multiplicador
}}
```

### Emojis das Fases
Edite `bracketHelpers.ts`:
```typescript
const phaseNames: Record<number, { name: string; displayName: string }> = {
  1: { name: 'Final', displayName: '🏆 FINAL' },
  2: { name: 'Semifinal', displayName: '🥇 SEMIFINAL' },
  // ...
};
```

## 📄 Licença

Este código faz parte do projeto Rivalis.

---

**Desenvolvido com ❤️ para melhorar a experiência de visualização de campeonatos de Mata-Mata!** 🏆

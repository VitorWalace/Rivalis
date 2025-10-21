# 🚀 Guia Rápido: Como Integrar o Bracket no ChampionshipDetailPage

## Passo 1: Verificar se o campeonato é Mata-Mata

```tsx
// No ChampionshipDetailPage.tsx
const isKnockout = championship?.format === 'knockout' || 
                   championship?.format === 'mata-mata' ||
                   championship?.format === 'eliminatoria';
```

## Passo 2: Importar componentes e helpers

```tsx
import KnockoutBracket from '../components/KnockoutBracket';
import { groupMatchesByPhase } from '../utils/bracketHelpers';
import type { BracketMatch, Phase } from '../types/bracket';
```

## Passo 3: Buscar partidas do backend

```tsx
const [knockoutPhases, setKnockoutPhases] = useState<Phase[]>([]);

useEffect(() => {
  if (isKnockout && championship?.id) {
    fetchKnockoutMatches();
  }
}, [championship?.id, isKnockout]);

const fetchKnockoutMatches = async () => {
  try {
    // Buscar partidas do backend
    const response = await fetch(`/api/championships/${championship.id}/matches`);
    const data = await response.json();
    
    // Converter para formato BracketMatch
    const bracketMatches: BracketMatch[] = data.matches.map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam || null,
      awayTeam: m.awayTeam || null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: mapStatusFromBackend(m.status),
      winner: m.winner || undefined,
      nextMatchId: m.nextMatchId,
      dependsOn: m.dependsOn || [],
      round: m.round,
      position: m.position,
      scheduledDate: m.scheduledDate,
      location: m.location,
    }));
    
    // Agrupar por fase
    const phases = groupMatchesByPhase(bracketMatches);
    setKnockoutPhases(phases);
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
  }
};

// Mapear status do backend para frontend
const mapStatusFromBackend = (status: string) => {
  const map: Record<string, BracketMatch['status']> = {
    'pending': 'pending',
    'scheduled': 'scheduled',
    'in_progress': 'live',
    'live': 'live',
    'finished': 'finished',
    'completed': 'finished',
    'awaiting_teams': 'locked',
    'locked': 'locked',
  };
  return map[status] || 'pending';
};
```

## Passo 4: Renderizar o componente

```tsx
return (
  <div>
    {/* Header e outros componentes... */}
    
    {/* Condicional: Se for mata-mata, mostra bracket */}
    {isKnockout ? (
      <KnockoutBracket
        phases={knockoutPhases}
        onMatchClick={(match) => {
          console.log('Partida clicada:', match);
          // Navegar para edição/detalhes
          // navigate(`/match/${match.id}/edit`);
          // ou abrir modal
        }}
      />
    ) : (
      // Visualização normal (tabela de classificação, etc.)
      <div>
        {/* Componentes atuais para outros formatos */}
      </div>
    )}
  </div>
);
```

## Exemplo Completo de Integração

```tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import KnockoutBracket from '../components/KnockoutBracket';
import { groupMatchesByPhase } from '../utils/bracketHelpers';
import type { BracketMatch, Phase } from '../types/bracket';
import type { Championship } from '../types';

export default function ChampionshipDetailPage() {
  const { id } = useParams();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [knockoutPhases, setKnockoutPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChampionship();
  }, [id]);

  const loadChampionship = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do campeonato
      const champResponse = await fetch(`/api/championships/${id}`);
      const champData = await champResponse.json();
      setChampionship(champData.championship);
      
      // Se for mata-mata, buscar partidas
      if (isKnockoutFormat(champData.championship.format)) {
        const matchesResponse = await fetch(`/api/championships/${id}/knockout-matches`);
        const matchesData = await matchesResponse.json();
        
        const bracketMatches = convertToBracketMatches(matchesData.matches);
        const phases = groupMatchesByPhase(bracketMatches);
        setKnockoutPhases(phases);
      }
    } catch (error) {
      console.error('Erro ao carregar campeonato:', error);
    } finally {
      setLoading(false);
    }
  };

  const isKnockoutFormat = (format: string) => {
    return ['knockout', 'mata-mata', 'eliminatoria'].includes(format);
  };

  const convertToBracketMatches = (matches: any[]): BracketMatch[] => {
    return matches.map(m => ({
      id: m.id,
      homeTeam: m.homeTeam || null,
      awayTeam: m.awayTeam || null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: mapStatus(m.status),
      winner: m.winner,
      nextMatchId: m.nextMatchId,
      dependsOn: m.dependsOn || [],
      round: m.round,
      position: m.position,
      scheduledDate: m.scheduledDate,
      location: m.location,
    }));
  };

  const mapStatus = (status: string): BracketMatch['status'] => {
    const statusMap: Record<string, BracketMatch['status']> = {
      'pending': 'pending',
      'scheduled': 'scheduled',
      'in_progress': 'live',
      'finished': 'finished',
      'locked': 'locked',
    };
    return statusMap[status] || 'pending';
  };

  const handleMatchClick = (match: BracketMatch) => {
    console.log('Abrir detalhes/edição da partida:', match.id);
    // Implementar navegação ou modal
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!championship) {
    return <div>Campeonato não encontrado</div>;
  }

  const isKnockout = isKnockoutFormat(championship.format);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{championship.name}</h1>
          <p className="text-gray-600">{championship.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isKnockout ? (
          // Visualização Mata-Mata
          <KnockoutBracket
            phases={knockoutPhases}
            onMatchClick={handleMatchClick}
          />
        ) : (
          // Visualização para outros formatos
          <div>
            <p>Visualização para formato: {championship.format}</p>
            {/* Componentes de tabela, grupos, etc. */}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Estrutura de Dados do Backend

### Endpoint: GET /api/championships/:id/knockout-matches

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match1",
        "homeTeamId": "team1",
        "homeTeam": {
          "id": "team1",
          "name": "Time A",
          "logo": "🔵",
          "championshipId": "champ1",
          "players": [],
          "stats": {...}
        },
        "awayTeamId": "team2",
        "awayTeam": {
          "id": "team2",
          "name": "Time B",
          "logo": "🔴",
          "championshipId": "champ1",
          "players": [],
          "stats": {...}
        },
        "homeScore": 3,
        "awayScore": 1,
        "status": "finished",
        "winnerId": "team1",
        "winner": { "id": "team1", "name": "Time A", ... },
        "round": 3,
        "position": 0,
        "nextMatchId": "match5",
        "dependsOn": null,
        "scheduledDate": "2025-10-25T14:00:00Z",
        "location": "Ginásio Municipal"
      },
      // ... mais partidas
    ]
  }
}
```

## Alternativa: Usar Dados Mockados (Para Testar)

```tsx
import { getMockPhases } from '../mocks/bracketMockData';

// No componente:
const phases = getMockPhases();

<KnockoutBracket
  phases={phases}
  onMatchClick={handleMatchClick}
/>
```

## Checklist de Integração

- [ ] Verificar formato do campeonato (knockout/mata-mata)
- [ ] Criar endpoint no backend (se ainda não existir)
- [ ] Buscar partidas e converter para BracketMatch[]
- [ ] Usar groupMatchesByPhase() para agrupar
- [ ] Renderizar KnockoutBracket
- [ ] Implementar onMatchClick para navegação/edição
- [ ] Testar em diferentes tamanhos de tela
- [ ] Verificar performance com muitas partidas

## Troubleshooting

### Partidas não aparecem
- Verificar se `round` e `position` estão corretos
- Verificar se formato do campeonato é 'knockout'
- Checar console para erros de API

### Bracket parece quebrado
- Verificar estrutura de dependências (`dependsOn`)
- Garantir que `nextMatchId` está correto
- Verificar se número de times é potência de 2

### Status não atualiza
- Verificar mapeamento de status (backend → frontend)
- Garantir que estado está sendo atualizado após edição

---

**Pronto! Agora você pode integrar o sistema de bracket em qualquer campeonato de mata-mata!** 🚀

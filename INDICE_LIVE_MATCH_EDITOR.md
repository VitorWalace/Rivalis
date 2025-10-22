# 📁 ÍNDICE DE ARQUIVOS - Live Match Editor

## 🎯 NAVEGAÇÃO RÁPIDA

### **📖 Documentação**
```
/
├── LIVE_MATCH_EDITOR_README.md          → Documentação completa (800+ linhas)
├── GUIA_RAPIDO_LIVE_EDITOR.md           → Guia de uso rápido (300+ linhas)
├── LIVE_MATCH_EDITOR_COMPLETO.md        → Resumo do projeto (500+ linhas)
└── INDICE_LIVE_MATCH_EDITOR.md          → Este arquivo (índice)
```

### **⚛️ Componentes React**
```
frontend/src/components/
├── LiveScoreboard.tsx          → Placar ao vivo (185 linhas)
├── MatchControlPanel.tsx       → Controle de tempo (200 linhas)
├── EventButtons.tsx            → Botões de ação (95 linhas)
├── EventModal.tsx              → Modal de eventos (520 linhas)
├── EventTimeline.tsx           → Linha do tempo (230 linhas)
├── TeamLineup.tsx              → Escalação dos times (240 linhas)
└── BasicStats.tsx              → Estatísticas (180 linhas)
```

### **📄 Páginas**
```
frontend/src/pages/
└── LiveMatchEditorPage.tsx     → Página principal (380 linhas)
```

### **🛣️ Roteamento**
```
frontend/src/
└── App.tsx                     → Rota adicionada (linha ~120)
```

---

## 📂 ESTRUTURA DETALHADA

### **1. LiveScoreboard.tsx**
**Caminho:** `frontend/src/components/LiveScoreboard.tsx`  
**Linhas:** 185  
**Responsabilidade:** Exibir placar ao vivo com logos, status e tempo

**Imports:**
```typescript
import type { Team } from '../types';
```

**Props:**
```typescript
interface LiveScoreboardProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status?: 'pending' | 'scheduled' | 'in-progress' | 'finished' | 'postponed';
  period?: string;
  time?: string;
}
```

**Funcionalidades:**
- ✅ Placar gigante (8xl font)
- ✅ Logos dos times ou iniciais
- ✅ Status com badges animados (🔴 AO VIVO pulsando)
- ✅ Destaque do vencedor com troféu 🏆
- ✅ Indicadores Casa (🏠) vs Visitante (🚗)

---

### **2. MatchControlPanel.tsx**
**Caminho:** `frontend/src/components/MatchControlPanel.tsx`  
**Linhas:** 200  
**Responsabilidade:** Controlar tempo e períodos da partida

**Props:**
```typescript
interface MatchControlPanelProps {
  status: 'pending' | 'in-progress' | 'finished';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndPeriod: () => void;
  onFinish: () => void;
  initialTime?: number;
}
```

**Funcionalidades:**
- ✅ Cronômetro auto-incrementante (MM:SS)
- ✅ Botões: ▶️ Iniciar, ⏸️ Pausar, ▶️ Retomar, ⏭️ Próximo, 🏁 Finalizar
- ✅ Botões de tempo adicional: +1min, +3min, +5min
- ✅ Gerenciamento de períodos (1º TEMPO → INTERVALO → 2º TEMPO)

---

### **3. EventButtons.tsx**
**Caminho:** `frontend/src/components/EventButtons.tsx`  
**Linhas:** 95  
**Responsabilidade:** Botões rápidos para registrar eventos

**Props:**
```typescript
interface EventButtonsProps {
  onGoal: () => void;
  onYellowCard: () => void;
  onRedCard: () => void;
  onSubstitution: () => void;
  disabled?: boolean;
}
```

**Funcionalidades:**
- ✅ 4 botões grandes com gradientes
- ⚽ GOL (verde)
- 🟨 AMARELO (amarelo)
- 🟥 VERMELHO (vermelho)
- 🔄 SUBSTITUIÇÃO (azul)
- ✅ Hover effects (scale 105%)
- ✅ Desabilitado quando jogo não está em progresso

---

### **4. EventModal.tsx**
**Caminho:** `frontend/src/components/EventModal.tsx`  
**Linhas:** 520  
**Responsabilidade:** Modal dinâmico para registro de eventos

**Props:**
```typescript
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  currentMinute: number;
  onSave: (eventData: EventData) => void;
}
```

**Funcionalidades:**
- ✅ Formulário adaptativo por tipo de evento
- ✅ Seleção de time com logos
- ✅ Busca de jogador com search
- ✅ Validação completa
- ✅ Preview antes de confirmar
- ✅ Headless UI + Framer Motion

**Formulários:**
- **Gol:** Time, jogador, minuto, assistência, tipo (normal/pênalti/contra/falta)
- **Cartão:** Time, jogador, minuto, motivo
- **Substituição:** Time, jogador sai, jogador entra, minuto

---

### **5. EventTimeline.tsx**
**Caminho:** `frontend/src/components/EventTimeline.tsx`  
**Linhas:** 230  
**Responsabilidade:** Exibir timeline cronológica de eventos

**Props:**
```typescript
interface EventTimelineProps {
  events: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
  onEdit: (event: MatchEvent) => void;
  onDelete: (eventId: string) => void;
}
```

**Funcionalidades:**
- ✅ Lista reversa (mais recente primeiro)
- ✅ Cada evento com ícone, minuto, badge, descrição
- ✅ Botões de ação (✏️ editar, 🗑️ excluir)
- ✅ Linha conectora vertical
- ✅ Scroll vertical (max-height 600px)
- ✅ Footer com contadores rápidos

---

### **6. TeamLineup.tsx**
**Caminho:** `frontend/src/components/TeamLineup.tsx`  
**Linhas:** 240  
**Responsabilidade:** Exibir escalação do time com status

**Props:**
```typescript
interface TeamLineupProps {
  team: Team;
  events: any[];
  isHome?: boolean;
}
```

**Funcionalidades:**
- ✅ Status de jogadores:
  - ⚽ EM CAMPO (verde)
  - 🪑 BANCO (cinza)
  - ⬆️ SUBSTITUÍDO (âmbar)
  - 🟥 EXPULSO (vermelho)
- ✅ Atualização dinâmica conforme eventos
- ✅ Cores diferentes para Casa (azul) vs Visitante (roxo)
- ✅ Contador no header

---

### **7. BasicStats.tsx**
**Caminho:** `frontend/src/components/BasicStats.tsx`  
**Linhas:** 180  
**Responsabilidade:** Estatísticas comparativas entre times

**Props:**
```typescript
interface BasicStatsProps {
  events: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
}
```

**Funcionalidades:**
- ✅ Comparação visual com barras de progresso
- ✅ 4 métricas: ⚽ Gols, 🟨 Amarelos, 🟥 Vermelhos, 🔄 Substituições
- ✅ Porcentagens calculadas automaticamente
- ✅ Valores numéricos gigantes nas pontas
- ✅ Footer com total de eventos por time

---

### **8. LiveMatchEditorPage.tsx**
**Caminho:** `frontend/src/pages/LiveMatchEditorPage.tsx`  
**Linhas:** 380  
**Responsabilidade:** Página principal que integra todos os componentes

**Imports:**
```typescript
import LiveScoreboard from '../components/LiveScoreboard';
import MatchControlPanel from '../components/MatchControlPanel';
import EventButtons from '../components/EventButtons';
import EventModal from '../components/EventModal';
import EventTimeline from '../components/EventTimeline';
import TeamLineup from '../components/TeamLineup';
import BasicStats from '../components/BasicStats';
import type { Game, Team } from '../types';
import api from '../services/api';
```

**Estado Principal:**
```typescript
const [game, setGame] = useState<Game | null>(null);
const [homeTeam, setHomeTeam] = useState<Team | null>(null);
const [awayTeam, setAwayTeam] = useState<Team | null>(null);
const [homeScore, setHomeScore] = useState(0);
const [awayScore, setAwayScore] = useState(0);
const [status, setStatus] = useState<'pending' | 'in-progress' | 'finished'>('pending');
const [currentTime, setCurrentTime] = useState(0);
const [period, setPeriod] = useState('1º TEMPO');
const [events, setEvents] = useState<MatchEvent[]>([]);
```

**Funções Principais:**
- `fetchGameData()` - Carrega partida e times da API
- `handleStartMatch()` - Inicia o jogo
- `handlePauseMatch()` - Pausa o cronômetro
- `handleResumeMatch()` - Retoma o jogo
- `handleEndPeriod()` - Avança para próximo período
- `handleFinishMatch()` - Finaliza e salva no backend
- `handleOpenEventModal()` - Abre modal de evento
- `handleSaveEvent()` - Salva novo evento
- `handleEditEvent()` - Edita evento existente (TODO)
- `handleDeleteEvent()` - Remove evento

**Layout:**
```
┌─────────────────────────────────────────┐
│     Header (Voltar | Título | Finalizar) │
├─────────────────────────────────────────┤
│              LiveScoreboard              │
├─────────────────────────────────────────┤
│           MatchControlPanel              │
├─────────────────────────────────────────┤
│              EventButtons                │
├─────────────────────┬───────────────────┤
│   EventTimeline     │    TeamLineup     │
│   (2/3 width)       │    (1/3 width)    │
├─────────────────────┴───────────────────┤
│              BasicStats                  │
└─────────────────────────────────────────┘
```

---

### **9. App.tsx (Modificado)**
**Caminho:** `frontend/src/App.tsx`  
**Linhas Modificadas:** ~8 linhas (linha 13 + linha 120)

**Import Adicionado:**
```typescript
import LiveMatchEditorPage from './pages/LiveMatchEditorPage';
```

**Rota Adicionada:**
```typescript
<Route
  path="/games/:gameId/live-editor"
  element={
    <ProtectedRoute>
      <LiveMatchEditorPage />
    </ProtectedRoute>
  }
/>
```

---

## 📊 RESUMO DE LINHAS

| Arquivo | Linhas | Tipo |
|---------|--------|------|
| **LiveScoreboard.tsx** | 185 | Componente |
| **MatchControlPanel.tsx** | 200 | Componente |
| **EventButtons.tsx** | 95 | Componente |
| **EventModal.tsx** | 520 | Componente |
| **EventTimeline.tsx** | 230 | Componente |
| **TeamLineup.tsx** | 240 | Componente |
| **BasicStats.tsx** | 180 | Componente |
| **LiveMatchEditorPage.tsx** | 380 | Página |
| **App.tsx** | +8 | Roteamento |
| **TOTAL CÓDIGO** | **2038** | TypeScript |
| | | |
| **LIVE_MATCH_EDITOR_README.md** | 800+ | Documentação |
| **GUIA_RAPIDO_LIVE_EDITOR.md** | 300+ | Guia |
| **LIVE_MATCH_EDITOR_COMPLETO.md** | 500+ | Resumo |
| **INDICE_LIVE_MATCH_EDITOR.md** | 200+ | Índice |
| **TOTAL DOCS** | **1800+** | Markdown |

**GRANDE TOTAL:** 3838+ linhas

---

## 🔗 DEPENDÊNCIAS ENTRE ARQUIVOS

```
App.tsx
  └── LiveMatchEditorPage.tsx
       ├── LiveScoreboard.tsx
       ├── MatchControlPanel.tsx
       ├── EventButtons.tsx
       ├── EventModal.tsx
       ├── EventTimeline.tsx
       ├── TeamLineup.tsx
       └── BasicStats.tsx
```

---

## 📦 IMPORTS EXTERNOS

### **Todas as Dependências**
```typescript
// React
import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Heroicons
import { ArrowLeftIcon, XMarkIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

// Headless UI
import { Dialog, Transition } from '@headlessui/react';

// Toast
import toast from 'react-hot-toast';

// Tipos
import type { Game, Team, Player } from '../types';

// Serviços
import api from '../services/api';
```

---

## 🎨 CONVENÇÕES DE CÓDIGO

### **Nomenclatura**
- **Componentes:** PascalCase (ex: `LiveScoreboard`)
- **Arquivos:** PascalCase.tsx (ex: `LiveScoreboard.tsx`)
- **Funções:** camelCase (ex: `handleStartMatch`)
- **Interfaces:** PascalCase + Props (ex: `LiveScoreboardProps`)
- **Tipos:** type EventType = 'goal' | 'yellow_card' | ...

### **Estrutura de Componente**
```typescript
// 1. Imports
import { ... } from '...';

// 2. Tipos/Interfaces
type EventType = ...;
interface ComponentProps { ... }

// 3. Componente
export default function Component({ props }: ComponentProps) {
  // 4. Estados
  const [state, setState] = useState(...);
  
  // 5. Efeitos
  useEffect(() => { ... }, [deps]);
  
  // 6. Funções
  const handleAction = () => { ... };
  
  // 7. Render
  return ( ... );
}
```

### **Classes CSS**
- TailwindCSS utilities
- Gradientes: `bg-gradient-to-r from-X to-Y`
- Responsivo: `md:`, `lg:`
- Estados: `hover:`, `focus:`, `disabled:`

---

## 🔍 BUSCA RÁPIDA

### **Por Funcionalidade**
- **Placar:** `LiveScoreboard.tsx`
- **Cronômetro:** `MatchControlPanel.tsx`
- **Registrar Evento:** `EventButtons.tsx` + `EventModal.tsx`
- **Ver Eventos:** `EventTimeline.tsx`
- **Escalação:** `TeamLineup.tsx`
- **Estatísticas:** `BasicStats.tsx`
- **Integração:** `LiveMatchEditorPage.tsx`
- **Rota:** `App.tsx`

### **Por Cor**
- **Verde (Gol):** `EventButtons.tsx`, `EventModal.tsx`, `BasicStats.tsx`
- **Amarelo (Cartão):** `EventButtons.tsx`, `EventModal.tsx`, `BasicStats.tsx`
- **Vermelho (Expulsão):** `EventButtons.tsx`, `EventModal.tsx`, `BasicStats.tsx`, `TeamLineup.tsx`
- **Azul (Substituição):** `EventButtons.tsx`, `EventModal.tsx`, `BasicStats.tsx`
- **Azul (Casa):** `LiveScoreboard.tsx`, `TeamLineup.tsx`, `BasicStats.tsx`
- **Roxo (Visitante):** `LiveScoreboard.tsx`, `TeamLineup.tsx`, `BasicStats.tsx`

### **Por Palavra-Chave**
- **"status":** `LiveScoreboard.tsx`, `MatchControlPanel.tsx`, `LiveMatchEditorPage.tsx`, `TeamLineup.tsx`
- **"minute":** `EventModal.tsx`, `EventTimeline.tsx`, `LiveMatchEditorPage.tsx`
- **"events":** Todos os componentes
- **"team":** Todos os componentes
- **"player":** `EventModal.tsx`, `EventTimeline.tsx`, `TeamLineup.tsx`

---

## 🚀 ACESSO RÁPIDO

### **URLs**
```
Desenvolvimento: http://localhost:5173/games/:gameId/live-editor
Produção: https://seu-dominio.com/games/:gameId/live-editor
```

### **Comandos Úteis**
```bash
# Abrir componente específico
code frontend/src/components/LiveScoreboard.tsx

# Buscar string no projeto
grep -r "handleStartMatch" frontend/src/

# Ver todos os componentes
ls frontend/src/components/*.tsx

# Ver documentação
cat LIVE_MATCH_EDITOR_README.md
cat GUIA_RAPIDO_LIVE_EDITOR.md
```

---

## ✅ CHECKLIST DE ARQUIVOS

- [x] LiveScoreboard.tsx
- [x] MatchControlPanel.tsx
- [x] EventButtons.tsx
- [x] EventModal.tsx
- [x] EventTimeline.tsx
- [x] TeamLineup.tsx
- [x] BasicStats.tsx
- [x] LiveMatchEditorPage.tsx
- [x] App.tsx (modificado)
- [x] LIVE_MATCH_EDITOR_README.md
- [x] GUIA_RAPIDO_LIVE_EDITOR.md
- [x] LIVE_MATCH_EDITOR_COMPLETO.md
- [x] INDICE_LIVE_MATCH_EDITOR.md (este arquivo)

**Total: 13 arquivos (8 código + 4 docs + 1 modificação)**

---

**📌 Bookmark este arquivo para navegação rápida!**

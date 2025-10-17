# 🏆 Editor de Partidas Rivalis

Sistema completo de registro e visualização de partidas esportivas com interfaces específicas para cada esporte.

## 🎮 Esportes Suportados

### 🏐 Vôlei
- Registro rápido de pontos por set
- Visualização de sets completos
- Indicador de set point
- Progresso visual até 25 pontos
- Estatísticas automáticas

### 🏀 Basquete
- Registro de cestas (1, 2 ou 3 pontos)
- Placar por quarter
- Gráficos comparativos
- Estatísticas de aproveitamento (FG%)
- Input opcional de jogador

### ⚽ Futsal
- Registro de gols com jogador
- Cartões amarelos e vermelhos
- Visualização do campo com gols marcados
- Timeline de eventos
- Cronômetro integrado
- Estatísticas por tempo

### 🤾 Handebol
- Mesma interface do Futsal
- Registro de gols e cartões
- Timeline completa
- Estatísticas detalhadas

### 🏓 Tênis de Mesa
- Sistema automático de pontos
- Cálculo de sets (11 pontos com diferença de 2)
- Indicador visual de saque
- Alternância automática de saque
- Alerta de deuce (10x10)

### ♟️ Xadrez
- Input de notação algébrica
- Lista de movimentos formatada
- Tabuleiro visual
- Timers para cada jogador
- Registro de peças capturadas
- Exemplos de notação

## 🚀 Como Usar

### 1. Criar Nova Partida

```bash
# Acesse a rota
/match/editor

# Ou adicione um botão em alguma página
<Link to="/match/editor">Nova Partida</Link>
```

### 2. Selecione o Esporte
- Clique no card do esporte desejado
- Preencha os dados:
  - Time Mandante / Jogador A
  - Time Visitante / Jogador B
  - Campeonato (opcional)
  - Data

### 3. Registre os Eventos
- Use os botões grandes para registrar eventos
- A visualização atualiza automaticamente
- Estatísticas são calculadas em tempo real

### 4. Salvar Partida
- Clique em "Salvar Partida" quando terminar
- Os dados serão enviados para o backend
- A partida fica disponível para visualização

## ⌨️ Atalhos de Teclado

### Vôlei
- `1` - Ponto para o mandante
- `2` - Ponto para o visitante
- `Enter` - Fim do set

### Basquete
- `1/2/3` - Pontos para o mandante
- `4/5/6` - Pontos para o visitante

### Futsal/Handebol
- `G` - Registrar gol
- `C` - Registrar cartão
- `Space` - Pausar/Retomar cronômetro

### Tênis de Mesa
- `A` - Ponto para jogador A
- `B` - Ponto para jogador B

### Xadrez
- Digite a jogada e `Enter` - Adicionar movimento
- `T` - Alternar timer

## 📊 Estrutura de Dados

### Exemplo: Vôlei
```json
{
  "id": "uuid",
  "sport": "volei",
  "homeTeam": "Cobras EC",
  "awayTeam": "Panteras FC",
  "date": "2025-10-17",
  "championship": "Liga Nacional",
  "status": "live",
  "sets": [
    { "set": 1, "homeScore": 25, "awayScore": 23, "duration": "18:45" },
    { "set": 2, "homeScore": 22, "awayScore": 25, "duration": "22:10" }
  ],
  "currentSet": 3,
  "events": [
    { "timestamp": "2025-10-17T14:30:00", "type": "point", "team": "home", "setNumber": 1 }
  ]
}
```

## 🎨 Componentes Reutilizáveis

### EventButton
Botão grande para registrar eventos:
```tsx
<EventButton
  icon={Target}
  label="⚽ GOL"
  color="green"
  size="large"
  onClick={handleGoal}
/>
```

### ScoreDisplay
Placar animado principal:
```tsx
<ScoreDisplay
  homeTeam="Time A"
  awayTeam="Time B"
  homeScore={3}
  awayScore={2}
  sport="FUTSAL"
  animated={true}
/>
```

### Timeline
Linha do tempo de eventos:
```tsx
<Timeline events={[
  { time: '03:45', icon: Target, text: 'Gol de João', color: 'green' }
]} />
```

### StatCard
Card de estatística:
```tsx
<StatCard
  icon={Award}
  label="Gols"
  value="5 - 3"
  color="green"
/>
```

### Chronometer
Cronômetro configurável:
```tsx
<Chronometer
  initialTime="20:00"
  counting="up"
  pausable={true}
  onTimeUpdate={(time) => console.log(time)}
/>
```

## 🛠️ Tecnologias Utilizadas

- **React 19** - Framework principal
- **TypeScript** - Tipagem estática
- **Zustand** - Gerenciamento de estado
- **Framer Motion** - Animações
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações

## 📱 Responsividade

- **Desktop (1024px+)**: Layout lado a lado (visualização + controles)
- **Tablet (768-1023px)**: Abas alternadas
- **Mobile (< 768px)**: Controles empilhados, scroll vertical

## 🔄 Próximas Melhorias

- [ ] Integração completa com backend/API
- [ ] Sistema de autosave automático
- [ ] Modo offline com sincronização
- [ ] Exportação de PDF com relatório
- [ ] Compartilhamento em redes sociais
- [ ] Transmissão ao vivo com WebRTC
- [ ] Análise de estatísticas com IA
- [ ] Integração com engine de xadrez (Stockfish.js)
- [ ] Gráficos avançados com Chart.js/Recharts
- [ ] Replay builder para highlights

## 📄 Licença

Parte do projeto Rivalis - Sistema de Gestão Esportiva

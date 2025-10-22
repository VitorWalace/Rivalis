# 🎮 SISTEMA DE ESTATÍSTICAS E GAMIFICAÇÃO - RIVALIS

## 📋 Contexto do Projeto

**Aplicação:** Rivalis - Sistema de gerenciamento de campeonatos esportivos
**Stack:** 
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express + Sequelize ORM
- Banco: MySQL (Railway)

**Estrutura Atual:**
- `/backend/models/Player.js` - Já possui campos: `goals`, `assists`, `yellowCards`, `redCards`, `gamesPlayed`, `wins`, `xp`, `achievements`
- `/backend/models/Goal.js` - Registra gols com jogador, assistente, minuto, tipo
- `/frontend/src/pages/ChampionshipDetailPage.tsx` - Possui aba "Estatísticas" mas não implementada
- `/frontend/src/pages/LiveMatchEditorPage.tsx` - Editor ao vivo onde gols são registrados

## 🎯 Objetivo

Implementar sistema completo de:
1. **Estatísticas detalhadas** por jogador e time
2. **Sistema de XP e níveis** baseado em desempenho
3. **Conquistas (achievements)** automáticas com condições específicas
4. **Ranking de artilheiros, assistentes, cartões**
5. **Dashboard visual** com gráficos e métricas

---

## 📊 PARTE 1: Sistema de Estatísticas

### Backend - Endpoints de Estatísticas

**Criar arquivo:** `/backend/controllers/statsController.js`

```javascript
const { Player, Team, Goal, Game, Championship } = require('../models');
const { Op } = require('sequelize');

// GET /api/championships/:id/stats
exports.getChampionshipStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o campeonato pertence ao usuário
    const championship = await Championship.findOne({
      where: { id, createdBy: userId }
    });
    
    if (!championship) {
      return res.status(404).json({ error: 'Campeonato não encontrado' });
    }
    
    // Top artilheiros (com gols, assistências, jogos)
    const topScorers = await Player.findAll({
      include: [{
        model: Team,
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      where: {
        goals: { [Op.gt]: 0 }
      },
      order: [['goals', 'DESC'], ['assists', 'DESC']],
      limit: 10
    });
    
    // Top assistentes
    const topAssisters = await Player.findAll({
      include: [{
        model: Team,
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      where: {
        assists: { [Op.gt]: 0 }
      },
      order: [['assists', 'DESC'], ['goals', 'DESC']],
      limit: 10
    });
    
    // Jogadores mais disciplinados (menos cartões)
    const fairPlay = await Player.findAll({
      include: [{
        model: Team,
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      where: {
        gamesPlayed: { [Op.gte]: 3 } // Mínimo 3 jogos
      },
      order: [
        ['redCards', 'ASC'],
        ['yellowCards', 'ASC'],
        ['gamesPlayed', 'DESC']
      ],
      limit: 10
    });
    
    // Jogadores com mais XP
    const topXP = await Player.findAll({
      include: [{
        model: Team,
        where: { championshipId: id },
        attributes: ['name', 'color', 'logo']
      }],
      where: {
        xp: { [Op.gt]: 0 }
      },
      order: [['xp', 'DESC']],
      limit: 10
    });
    
    // Estatísticas gerais
    const totalGoals = await Goal.count({
      include: [{
        model: Game,
        where: { championshipId: id }
      }]
    });
    
    const totalGames = await Game.count({
      where: { 
        championshipId: id,
        status: 'finalizado'
      }
    });
    
    const totalPlayers = await Player.count({
      include: [{
        model: Team,
        where: { championshipId: id }
      }]
    });
    
    // Gols por tipo
    const goalsByType = await Goal.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count']
      ],
      include: [{
        model: Game,
        where: { championshipId: id },
        attributes: []
      }],
      group: ['type']
    });
    
    const avgGoalsPerGame = totalGames > 0 ? (totalGoals / totalGames).toFixed(2) : 0;
    
    // Cartões
    const totalYellowCards = await Player.sum('yellowCards', {
      include: [{
        model: Team,
        where: { championshipId: id },
        attributes: []
      }]
    }) || 0;
    
    const totalRedCards = await Player.sum('redCards', {
      include: [{
        model: Team,
        where: { championshipId: id },
        attributes: []
      }]
    }) || 0;
    
    res.json({
      topScorers,
      topAssisters,
      fairPlay,
      topXP,
      summary: {
        totalGoals,
        totalGames,
        totalPlayers,
        avgGoalsPerGame,
        totalYellowCards,
        totalRedCards,
        goalsByType
      }
    });
    
  } catch (error) {
    console.error('❌ [stats] Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// GET /api/players/:id/stats
exports.getPlayerStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const player = await Player.findByPk(id, {
      include: [{
        model: Team,
        include: [{
          model: Championship,
          where: { createdBy: userId }
        }]
      }]
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Jogador não encontrado' });
    }
    
    // Buscar histórico de gols
    const goals = await Goal.findAll({
      where: { playerId: id },
      include: [{
        model: Game,
        include: [
          { model: Team, as: 'homeTeam', attributes: ['name', 'color'] },
          { model: Team, as: 'awayTeam', attributes: ['name', 'color'] }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    // Buscar assistências
    const assists = await Goal.findAll({
      where: { assistPlayerId: id },
      include: [{
        model: Game,
        include: [
          { model: Team, as: 'homeTeam', attributes: ['name', 'color'] },
          { model: Team, as: 'awayTeam', attributes: ['name', 'color'] }
        ]
      }, {
        model: Player,
        as: 'player',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    // Calcular média por jogo
    const goalsPerGame = player.gamesPlayed > 0 ? (player.goals / player.gamesPlayed).toFixed(2) : 0;
    const assistsPerGame = player.gamesPlayed > 0 ? (player.assists / player.gamesPlayed).toFixed(2) : 0;
    const winRate = player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) : 0;
    
    // Calcular nível baseado em XP
    const levelInfo = calculateLevel(player.xp || 0);
    
    res.json({
      player: player.toJSON(),
      stats: {
        goalsPerGame,
        assistsPerGame,
        winRate,
        levelInfo
      },
      history: {
        goals,
        assists
      }
    });
    
  } catch (error) {
    console.error('❌ [stats] Erro ao buscar estatísticas do jogador:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// Função auxiliar para calcular nível
function calculateLevel(xp) {
  let level = 1;
  let xpNeeded = 100;
  let totalXpForLevel = 0;
  
  while (xp >= totalXpForLevel + xpNeeded) {
    totalXpForLevel += xpNeeded;
    level++;
    xpNeeded = Math.floor(xpNeeded * 1.5); // 50% a mais por nível
  }
  
  return {
    level,
    currentXp: xp - totalXpForLevel,
    xpForNextLevel: xpNeeded,
    totalXp: xp,
    progress: ((xp - totalXpForLevel) / xpNeeded * 100).toFixed(1)
  };
}
```

**Adicionar rotas:** `/backend/routes/index.js`

```javascript
const statsController = require('../controllers/statsController');

// Estatísticas
router.get('/championships/:id/stats', authenticate, statsController.getChampionshipStats);
router.get('/players/:id/stats', authenticate, statsController.getPlayerStats);
```

---

## 🎮 PARTE 2: Sistema de Gamificação

### Backend - Sistema de XP e Conquistas

**Criar arquivo:** `/backend/utils/achievementsSystem.js`

```javascript
// Definição de conquistas disponíveis
const ACHIEVEMENTS = {
  // ⚽ Gols
  FIRST_GOAL: {
    id: 'first_goal',
    name: '⚽ Primeiro Gol',
    description: 'Marque seu primeiro gol',
    xp: 50,
    rarity: 'common',
    condition: (player) => player.goals >= 1
  },
  
  GOAL_MACHINE_5: {
    id: 'goal_machine_5',
    name: '🔥 Artilheiro Iniciante',
    description: 'Marque 5 gols no campeonato',
    xp: 100,
    rarity: 'common',
    condition: (player) => player.goals >= 5
  },
  
  GOAL_MACHINE_10: {
    id: 'goal_machine_10',
    name: '⚡ Goleador',
    description: 'Marque 10 gols no campeonato',
    xp: 250,
    rarity: 'rare',
    condition: (player) => player.goals >= 10
  },
  
  HAT_TRICK: {
    id: 'hat_trick',
    name: '🎩 Hat-trick',
    description: 'Marque 3 gols em uma única partida',
    xp: 200,
    rarity: 'rare'
  },
  
  POKER: {
    id: 'poker',
    name: '🃏 Poker',
    description: 'Marque 4 gols em uma única partida',
    xp: 400,
    rarity: 'epic'
  },
  
  ARTILHEIRO: {
    id: 'top_scorer',
    name: '👑 Artilheiro do Campeonato',
    description: 'Seja o maior artilheiro do campeonato',
    xp: 500,
    rarity: 'legendary'
  },
  
  // 🤝 Assistências
  FIRST_ASSIST: {
    id: 'first_assist',
    name: '🤝 Primeira Assistência',
    description: 'Dê sua primeira assistência',
    xp: 50,
    rarity: 'common',
    condition: (player) => player.assists >= 1
  },
  
  PLAYMAKER: {
    id: 'playmaker',
    name: '🎯 Craque',
    description: 'Dê 5 assistências no campeonato',
    xp: 150,
    rarity: 'rare',
    condition: (player) => player.assists >= 5
  },
  
  MAESTRO: {
    id: 'maestro',
    name: '🎼 Maestro',
    description: 'Dê 10 assistências no campeonato',
    xp: 300,
    rarity: 'epic',
    condition: (player) => player.assists >= 10
  },
  
  // 🏃 Jogos
  DEBUT: {
    id: 'debut',
    name: '🌟 Estreia',
    description: 'Jogue sua primeira partida',
    xp: 25,
    rarity: 'common',
    condition: (player) => player.gamesPlayed >= 1
  },
  
  REGULAR: {
    id: 'regular',
    name: '💪 Jogador Regular',
    description: 'Jogue 5 partidas',
    xp: 75,
    rarity: 'common',
    condition: (player) => player.gamesPlayed >= 5
  },
  
  VETERAN: {
    id: 'veteran',
    name: '🏅 Veterano',
    description: 'Jogue 10 partidas',
    xp: 150,
    rarity: 'rare',
    condition: (player) => player.gamesPlayed >= 10
  },
  
  LEGEND: {
    id: 'legend',
    name: '⭐ Lenda',
    description: 'Jogue 20 partidas',
    xp: 300,
    rarity: 'epic',
    condition: (player) => player.gamesPlayed >= 20
  },
  
  // ✨ Vitórias
  FIRST_WIN: {
    id: 'first_win',
    name: '✨ Primeira Vitória',
    description: 'Vença sua primeira partida',
    xp: 50,
    rarity: 'common',
    condition: (player) => player.wins >= 1
  },
  
  WINNER: {
    id: 'winner',
    name: '🎖️ Vencedor',
    description: 'Vença 5 partidas',
    xp: 100,
    rarity: 'rare',
    condition: (player) => player.wins >= 5
  },
  
  CHAMPION: {
    id: 'champion',
    name: '🏆 Campeão',
    description: 'Vença um campeonato',
    xp: 1000,
    rarity: 'legendary'
  },
  
  // 😇 Fair Play
  FAIR_PLAYER: {
    id: 'fair_player',
    name: '😇 Jogador Limpo',
    description: 'Jogue 5 partidas sem levar cartão',
    xp: 100,
    rarity: 'rare'
  },
  
  GENTLEMAN: {
    id: 'gentleman',
    name: '🎩 Cavalheiro',
    description: 'Jogue 10 partidas sem levar cartão vermelho',
    xp: 150,
    rarity: 'rare'
  },
  
  // 💎 Especiais
  PERFECT_GAME: {
    id: 'perfect_game',
    name: '💎 Jogo Perfeito',
    description: 'Marque gol, dê assistência e não leve cartão na mesma partida',
    xp: 250,
    rarity: 'epic'
  },
  
  COMPLETE_PLAYER: {
    id: 'complete_player',
    name: '🌟 Jogador Completo',
    description: 'Tenha pelo menos 5 gols E 5 assistências no campeonato',
    xp: 300,
    rarity: 'epic',
    condition: (player) => player.goals >= 5 && player.assists >= 5
  },
  
  FREE_KICK_MASTER: {
    id: 'free_kick_master',
    name: '🎯 Especialista em Faltas',
    description: 'Marque 3 gols de falta',
    xp: 200,
    rarity: 'rare'
  },
  
  PENALTY_EXPERT: {
    id: 'penalty_expert',
    name: '🎪 Expert em Pênaltis',
    description: 'Marque 5 gols de pênalti',
    xp: 150,
    rarity: 'rare'
  }
};

// Sistema de níveis com progressão exponencial
const calculateLevel = (xp) => {
  let level = 1;
  let xpNeeded = 100; // XP para nível 2
  let totalXpForLevel = 0;
  
  while (xp >= totalXpForLevel + xpNeeded) {
    totalXpForLevel += xpNeeded;
    level++;
    xpNeeded = Math.floor(xpNeeded * 1.5); // 50% a mais por nível
  }
  
  return {
    level,
    currentXp: xp - totalXpForLevel,
    xpForNextLevel: xpNeeded,
    totalXp: xp,
    progress: ((xp - totalXpForLevel) / xpNeeded * 100).toFixed(1)
  };
};

// Verificar conquistas desbloqueadas
const checkAchievements = async (player, gameStats = {}) => {
  const newAchievements = [];
  const currentAchievements = player.achievements || [];
  
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    // Se já tem, pula
    if (currentAchievements.includes(achievement.id)) continue;
    
    let unlocked = false;
    
    // Verifica condição padrão baseada nas stats do jogador
    if (achievement.condition) {
      unlocked = achievement.condition(player, gameStats);
    }
    
    // Conquistas especiais baseadas em eventos do jogo
    if (achievement.id === 'hat_trick' && gameStats.goalsInGame >= 3) unlocked = true;
    if (achievement.id === 'poker' && gameStats.goalsInGame >= 4) unlocked = true;
    if (achievement.id === 'perfect_game' && 
        gameStats.goalsInGame > 0 && 
        gameStats.assistsInGame > 0 && 
        !gameStats.gotCard) unlocked = true;
    if (achievement.id === 'fair_player' && 
        player.gamesPlayed >= 5 && 
        player.yellowCards === 0 && 
        player.redCards === 0) unlocked = true;
    
    if (unlocked) {
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
};

// Atualizar XP e conquistas do jogador
const updatePlayerProgress = async (playerId, xpGained, newAchievements = []) => {
  const { Player } = require('../models');
  
  const player = await Player.findByPk(playerId);
  if (!player) return null;
  
  const currentAchievements = player.achievements || [];
  const updatedAchievements = [
    ...currentAchievements,
    ...newAchievements.map(a => a.id)
  ];
  
  const newXp = (player.xp || 0) + xpGained;
  
  await player.update({
    xp: newXp,
    achievements: updatedAchievements
  });
  
  const levelInfo = calculateLevel(newXp);
  
  console.log(`🎮 [achievements] Jogador ${player.name} ganhou ${xpGained} XP (Total: ${newXp})`);
  if (newAchievements.length > 0) {
    console.log(`🏆 [achievements] Novas conquistas:`, newAchievements.map(a => a.name).join(', '));
  }
  
  return {
    player: await Player.findByPk(playerId), // Recarregar player atualizado
    levelInfo,
    xpGained,
    newAchievements
  };
};

// Calcular XP baseado em ação
const calculateXPForAction = (actionType, details = {}) => {
  const xpTable = {
    goal_normal: 30,
    goal_penalty: 20,
    goal_free_kick: 40,
    goal_own_goal: -10,
    assist: 20,
    yellow_card: -5,
    red_card: -20,
    win: 50,
    draw: 20,
    loss: 10
  };
  
  return xpTable[actionType] || 0;
};

module.exports = {
  ACHIEVEMENTS,
  calculateLevel,
  checkAchievements,
  updatePlayerProgress,
  calculateXPForAction
};
```

### Backend - Integrar Gamificação no Controlador de Gols

**Modificar:** `/backend/controllers/gameController.js`

Adicionar no início do arquivo:
```javascript
const { 
  checkAchievements, 
  updatePlayerProgress, 
  calculateXPForAction 
} = require('../utils/achievementsSystem');
```

Modificar a função `addGoal`:

```javascript
// Dentro da função addGoal, após criar o gol:

// Atualizar estatísticas do jogador que marcou
const player = await Player.findByPk(playerId);
await player.increment('goals');

// XP por tipo de gol
const xpForGoal = calculateXPForAction(`goal_${type}`, { playerId, gameId });

// Verificar quantos gols fez NESTE jogo
const goalsInThisGame = await Goal.count({
  where: {
    gameId: gameId,
    playerId: playerId
  }
});

// Verificar se levou cartão neste jogo (implementar depois)
const gotCard = false; // TODO: verificar cartões do jogo

// Preparar stats do jogo para verificação de conquistas
const gameStats = {
  goalsInGame: goalsInThisGame,
  assistsInGame: 0,
  gotCard: gotCard
};

// Atualizar assistência
if (assistPlayerId) {
  const assistPlayer = await Player.findByPk(assistPlayerId);
  await assistPlayer.increment('assists');
  
  const xpForAssist = calculateXPForAction('assist');
  await updatePlayerProgress(assistPlayerId, xpForAssist, []);
}

// Recarregar player com stats atualizadas
const updatedPlayer = await Player.findByPk(playerId);

// Verificar conquistas
const newAchievements = await checkAchievements(updatedPlayer, gameStats);
const totalXp = xpForGoal + newAchievements.reduce((sum, a) => sum + a.xp, 0);

// Atualizar progresso
const progressUpdate = await updatePlayerProgress(playerId, totalXp, newAchievements);

// Retornar com info de gamificação
res.status(201).json({
  goal,
  gamification: progressUpdate ? {
    xpGained: progressUpdate.xpGained,
    levelInfo: progressUpdate.levelInfo,
    achievements: progressUpdate.newAchievements
  } : null
});
```

---

## 🎨 PARTE 3: Frontend - Aba de Estatísticas

**Modificar:** `/frontend/src/pages/ChampionshipDetailPage.tsx`

Adicionar imports:
```typescript
import { ChartBarIcon, TrophyIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid';
```

Adicionar estados:
```typescript
const [stats, setStats] = useState<any>(null);
const [loadingStats, setLoadingStats] = useState(false);
```

Adicionar função para carregar estatísticas:
```typescript
const loadStats = async () => {
  if (!championship?.id) return;
  
  setLoadingStats(true);
  try {
    const response = await api.get(`/championships/${championship.id}/stats`);
    setStats(response.data);
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    toast.error('Erro ao carregar estatísticas');
  } finally {
    setLoadingStats(false);
  }
};

// Carregar quando aba for "stats"
useEffect(() => {
  if (activeTab === 'stats' && championship?.id) {
    loadStats();
  }
}, [activeTab, championship?.id]);
```

Renderizar aba de estatísticas (substituir o conteúdo da aba 'stats'):

```typescript
{activeTab === 'stats' && (
  <div className="space-y-6">
    {loadingStats ? (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    ) : (
      <>
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <span className="text-2xl">⚽</span>
              </div>
              <div className="text-sm opacity-90">Gols</div>
            </div>
            <div className="text-4xl font-bold">{stats?.summary?.totalGoals || 0}</div>
            <div className="text-sm text-blue-100 mt-1">
              Média: {stats?.summary?.avgGoalsPerGame || 0} por jogo
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <div className="text-sm opacity-90">Partidas</div>
            </div>
            <div className="text-4xl font-bold">{stats?.summary?.totalGames || 0}</div>
            <div className="text-sm text-green-100 mt-1">Finalizadas</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-sm opacity-90">Jogadores</div>
            </div>
            <div className="text-4xl font-bold">{stats?.summary?.totalPlayers || 0}</div>
            <div className="text-sm text-purple-100 mt-1">No campeonato</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <span className="text-2xl">🟨</span>
              </div>
              <div className="text-sm opacity-90">Cartões</div>
            </div>
            <div className="text-4xl font-bold">
              {(stats?.summary?.totalYellowCards || 0) + (stats?.summary?.totalRedCards || 0)}
            </div>
            <div className="text-sm text-orange-100 mt-1">
              {stats?.summary?.totalYellowCards || 0} amarelos • {stats?.summary?.totalRedCards || 0} vermelhos
            </div>
          </div>
        </div>

        {/* Top Artilheiros */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-3xl">⚽</span>
            Top Artilheiros
          </h3>
          
          {stats?.topScorers?.length > 0 ? (
            <div className="space-y-2">
              {stats.topScorers.map((player: any, index: number) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all hover:shadow-md"
                >
                  {/* Posição */}
                  <div className={`text-2xl font-bold w-8 ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-600' :
                    'text-slate-400'
                  }`}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}º`}
                  </div>
                  
                  {/* Time Color */}
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: player.Team?.color || '#3B82F6' }}
                  />
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{player.name}</div>
                    <div className="text-sm text-slate-500">{player.Team?.name}</div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    {/* Gols */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{player.goals}</div>
                      <div className="text-xs text-slate-500">gols</div>
                    </div>
                    
                    {/* Assistências */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">{player.assists}</div>
                      <div className="text-xs text-slate-500">assist.</div>
                    </div>
                    
                    {/* Jogos */}
                    <div className="text-right">
                      <div className="text-sm text-slate-400">{player.gamesPlayed} jogos</div>
                      <div className="text-xs text-slate-500">
                        {(player.goals / Math.max(player.gamesPlayed, 1)).toFixed(2)}/jogo
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl mb-2 block">⚽</span>
              Nenhum gol marcado ainda
            </div>
          )}
        </div>

        {/* Top Assistentes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-3xl">🤝</span>
            Top Assistentes
          </h3>
          
          {stats?.topAssisters?.length > 0 ? (
            <div className="space-y-2">
              {stats.topAssisters.map((player: any, index: number) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all hover:shadow-md"
                >
                  <div className={`text-2xl font-bold w-8 ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-600' :
                    'text-slate-400'
                  }`}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}º`}
                  </div>
                  
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: player.Team?.color || '#3B82F6' }}
                  />
                  
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{player.name}</div>
                    <div className="text-sm text-slate-500">{player.Team?.name}</div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{player.assists}</div>
                      <div className="text-xs text-slate-500">assist.</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">{player.goals}</div>
                      <div className="text-xs text-slate-500">gols</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl mb-2 block">🤝</span>
              Nenhuma assistência ainda
            </div>
          )}
        </div>

        {/* Fair Play */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-3xl">😇</span>
            Fair Play
          </h3>
          
          {stats?.fairPlay?.length > 0 ? (
            <div className="space-y-2">
              {stats.fairPlay.map((player: any, index: number) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-all hover:shadow-md"
                >
                  <div className="text-2xl font-bold w-8 text-green-600">
                    {index + 1}º
                  </div>
                  
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: player.Team?.color || '#3B82F6' }}
                  />
                  
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{player.name}</div>
                    <div className="text-sm text-slate-500">{player.Team?.name}</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">{player.gamesPlayed} jogos</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">🟨</span>
                      <span className="font-semibold">{player.yellowCards}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">🟥</span>
                      <span className="font-semibold">{player.redCards}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl mb-2 block">😇</span>
              Dados insuficientes
            </div>
          )}
        </div>

        {/* Top XP */}
        {stats?.topXP?.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <SparklesIcon className="w-8 h-8" />
              Ranking de XP
            </h3>
            
            <div className="space-y-2">
              {stats.topXP.slice(0, 5).map((player: any, index: number) => {
                const level = Math.floor(Math.sqrt(player.xp / 100)) + 1;
                return (
                  <div 
                    key={player.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                  >
                    <div className="text-2xl font-bold w-8">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `${index + 1}º`}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{player.name}</div>
                      <div className="text-sm text-purple-100">{player.Team?.name}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold">{player.xp} XP</div>
                      <div className="text-sm text-purple-200">Nível {level}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    )}
  </div>
)}
```

---

## 🏆 PARTE 4: Notificação de Conquistas

**Criar componente:** `/frontend/src/components/AchievementNotification.tsx`

```typescript
import { useEffect, useState } from 'react';
import { TrophyIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXp: number;
  progress: string;
}

interface Props {
  achievements: Achievement[];
  xpGained: number;
  levelInfo?: LevelInfo;
  onClose: () => void;
}

export default function AchievementNotification({ 
  achievements, 
  xpGained, 
  levelInfo,
  onClose 
}: Props) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 7000); // 7 segundos
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };
  
  const getRarityColor = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'from-yellow-400 via-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 via-purple-600 to-pink-500';
      case 'rare': return 'from-blue-500 via-blue-600 to-cyan-500';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };
  
  const getRarityBorder = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'epic': return 'border-purple-500';
      case 'rare': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right max-w-sm">
      <div className={`bg-white rounded-xl shadow-2xl overflow-hidden border-4 ${getRarityBorder(achievements[0]?.rarity)}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-300 animate-bounce" />
            <h3 className="text-xl font-bold text-white">
              {achievements.length > 1 ? 'Conquistas Desbloqueadas!' : 'Conquista Desbloqueada!'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Conquistas */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} p-4 rounded-lg text-white shadow-lg transform hover:scale-105 transition-transform`}
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{achievement.name.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="text-lg font-bold">{achievement.name}</div>
                  <div className="text-sm opacity-90 mt-1">{achievement.description}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="font-semibold">+{achievement.xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* XP Total e Nível */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-2xl font-bold text-indigo-600">+{xpGained} XP</div>
              <div className="text-sm text-slate-500">Total ganho</div>
            </div>
            {levelInfo && (
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">Nível {levelInfo.level}</div>
                <div className="text-sm text-slate-500">{levelInfo.totalXp} XP total</div>
              </div>
            )}
          </div>
          
          {/* Barra de Progresso */}
          {levelInfo && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>{levelInfo.currentXp} XP</span>
                <span className="font-semibold">{levelInfo.progress}%</span>
                <span>{levelInfo.xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <div className="text-xs text-center text-slate-500 mt-1">
                Próximo nível: {levelInfo.level + 1}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Adicionar animação no Tailwind config (`tailwind.config.js`):

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out'
      }
    }
  }
}
```

---

## 🎯 Integração no LiveMatchEditor

**Modificar:** `/frontend/src/pages/LiveMatchEditorPage.tsx`

Adicionar imports:
```typescript
import AchievementNotification from '../components/AchievementNotification';
```

Adicionar estado:
```typescript
const [achievementNotification, setAchievementNotification] = useState<any>(null);
```

Modificar função `handleAddGoal` para capturar gamificação:

```typescript
const handleAddGoal = async (data: any) => {
  try {
    const response = await api.post(`/games/${gameId}/goals`, data);
    
    // Verificar se retornou gamificação
    if (response.data.gamification) {
      const { xpGained, levelInfo, achievements } = response.data.gamification;
      
      if (achievements && achievements.length > 0) {
        setAchievementNotification({
          achievements,
          xpGained,
          levelInfo
        });
      }
      
      // Toast com XP ganho
      toast.success(`⚽ Gol! +${xpGained} XP`, { duration: 3000 });
    } else {
      toast.success('⚽ Gol registrado!');
    }
    
    // Recarregar jogo
    await loadGame();
    
  } catch (error) {
    console.error('Erro ao adicionar gol:', error);
    toast.error('Erro ao registrar gol');
  }
};
```

Renderizar notificação:

```typescript
{/* Notificação de Conquistas */}
{achievementNotification && (
  <AchievementNotification
    achievements={achievementNotification.achievements}
    xpGained={achievementNotification.xpGained}
    levelInfo={achievementNotification.levelInfo}
    onClose={() => setAchievementNotification(null)}
  />
)}
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar `/backend/controllers/statsController.js`
- [ ] Criar `/backend/utils/achievementsSystem.js`
- [ ] Adicionar rotas de estatísticas em `/backend/routes/index.js`
- [ ] Modificar `gameController.addGoal` para integrar gamificação
- [ ] Testar endpoints no Postman:
  - `GET /api/championships/:id/stats`
  - `GET /api/players/:id/stats`
- [ ] Testar registro de gol com retorno de XP e conquistas

### Frontend
- [ ] Criar componente `/frontend/src/components/AchievementNotification.tsx`
- [ ] Modificar `ChampionshipDetailPage.tsx` - Implementar aba Estatísticas
- [ ] Modificar `LiveMatchEditorPage.tsx` - Adicionar notificação de conquistas
- [ ] Adicionar animações no `tailwind.config.js`
- [ ] Testar visualização de estatísticas
- [ ] Testar notificações de conquistas ao marcar gol

### Testes End-to-End
- [ ] Criar campeonato com times e jogadores
- [ ] Registrar gols e verificar XP ganho
- [ ] Verificar desbloqueio de "Primeiro Gol"
- [ ] Fazer hat-trick e verificar conquista
- [ ] Ver rankings de artilheiros
- [ ] Verificar progressão de nível
- [ ] Testar conquista "Jogo Perfeito"

---

## 🚀 Próximos Passos

1. **Badges Visuais**: Criar ícones personalizados SVG para cada conquista
2. **Perfil do Jogador**: Página dedicada mostrando todas conquistas
3. **Ranking Global**: Leaderboard entre todos os campeonatos
4. **Eventos Especiais**: Conquistas temporárias em datas comemorativas
5. **Streaks**: Sequências de vitórias, gols consecutivos
6. **Recompensas Visuais**: Desbloquear avatares, cores, badges personalizados

---

## 📝 Notas Técnicas

- O sistema de XP usa progressão exponencial (50% a mais por nível)
- Conquistas são armazenadas como array JSON no campo `achievements` do Player
- Nível é calculado dinamicamente baseado no XP total
- Notificações aparecem por 7 segundos e podem ser fechadas manualmente
- Estatísticas são recalculadas em tempo real a cada consulta
- Sistema suporta diferentes tipos de gol (normal, pênalti, falta, contra)

---

**Bora implementar e transformar o Rivalis em um app viciante! 🎮🏆**

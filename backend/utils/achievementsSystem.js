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

  GOAL_MACHINE_15: {
    id: 'goal_machine_15',
    name: '🚀 Matador Implacável',
    description: 'Marque 15 gols no campeonato',
    xp: 350,
    rarity: 'epic',
    condition: (player) => player.goals >= 15
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

  ASSIST_ARTIST: {
    id: 'assist_artist',
    name: '🧠 Visão de Jogo',
    description: 'Dê 8 assistências no campeonato',
    xp: 220,
    rarity: 'rare',
    condition: (player) => player.assists >= 8
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

  XP_ASCENT: {
    id: 'xp_1500',
    name: '🌠 Estrela em Ascensão',
    description: 'Alcance 1500 pontos de XP',
    xp: 200,
    rarity: 'rare',
    condition: (player) => (player.xp || 0) >= 1500
  },

  XP_ICON: {
    id: 'xp_3000',
    name: '🏟️ Ídolo da Torcida',
    description: 'Alcance 3000 pontos de XP',
    xp: 400,
    rarity: 'legendary',
    condition: (player) => (player.xp || 0) >= 3000
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

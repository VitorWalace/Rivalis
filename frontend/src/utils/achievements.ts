import type { Achievement, Player, Game } from '../types/index.ts';
import { generateId } from '../utils';

// Função auxiliar para selecionar conquistas baseado no esporte
export function getAchievementsBySport(sportId: string): Record<string, { name: string; description: string; icon: string; xpReward: number }> {
  if (sportId === 'chess') {
    return CHESS_ACHIEVEMENTS;
  }
  return ACHIEVEMENT_ID_MAP; // Default: futsal
}

export function getAchievementDefinitionsBySport(sportId: string): Omit<Achievement, 'id' | 'unlockedAt'>[] {
  if (sportId === 'chess') {
    return CHESS_ACHIEVEMENT_DEFINITIONS;
  }
  return ACHIEVEMENT_DEFINITIONS; // Default: futsal
}

// Conquistas específicas para XADREZ
export const CHESS_ACHIEVEMENTS: Record<string, { name: string; description: string; icon: string; xpReward: number }> = {
  'first_win': {
    name: 'Primeira Vitória',
    description: 'Vença sua primeira partida',
    icon: '♟️',
    xpReward: 20,
  },
  'checkmate_master': {
    name: 'Mestre do Xeque-Mate',
    description: 'Vença 5 partidas',
    icon: '♔',
    xpReward: 50,
  },
  'grandmaster_path': {
    name: 'Caminho do Grande Mestre',
    description: 'Vença 10 partidas',
    icon: '👑',
    xpReward: 100,
  },
  'perfect_game': {
    name: 'Jogo Perfeito',
    description: 'Vença sem perder peças',
    icon: '💎',
    xpReward: 150,
  },
  'tournament_veteran': {
    name: 'Veterano de Torneio',
    description: 'Jogue 15 partidas',
    icon: '🏛️',
    xpReward: 75,
  },
  'winning_streak_3': {
    name: 'Sequência Vitoriosa',
    description: 'Vença 3 partidas seguidas',
    icon: '🔥',
    xpReward: 80,
  },
  'comeback_king': {
    name: 'Rei do Comeback',
    description: 'Vire uma partida em desvantagem',
    icon: '⚡',
    xpReward: 120,
  },
  'strategic_mind': {
    name: 'Mente Estratégica',
    description: 'Alcance 500 pontos de rating',
    icon: '🧠',
    xpReward: 60,
  },
  'chess_legend': {
    name: 'Lenda do Xadrez',
    description: 'Alcance 1000 pontos de rating',
    icon: '⭐',
    xpReward: 150,
  },
  'undefeated': {
    name: 'Invicto',
    description: 'Mantenha-se invicto por 5 jogos',
    icon: '🛡️',
    xpReward: 100,
  },
};

// Mapeamento de IDs salvos no banco para definições completas (FUTSAL)
export const ACHIEVEMENT_ID_MAP: Record<string, { name: string; description: string; icon: string; xpReward: number }> = {
  'first_goal': {
    name: 'Primeiro Gol',
    description: 'Marque seu primeiro gol no campeonato',
    icon: '⚽',
    xpReward: 20,
  },
  'hat_trick': {
    name: 'Hat-Trick',
    description: 'Marque 3 gols no mesmo jogo',
    icon: '🎩',
    xpReward: 100,
  },
  'poker': {
    name: 'Poker',
    description: 'Marque 4 gols no mesmo jogo',
    icon: '🃏',
    xpReward: 150,
  },
  'goal_machine_5': {
    name: 'Artilheiro Nato',
    description: 'Marque 5 gols no campeonato',
    icon: '🔥',
    xpReward: 50,
  },
  'goal_machine_10': {
    name: 'Máquina de Gols',
    description: 'Marque 10 gols no campeonato',
    icon: '⚡',
    xpReward: 80,
  },
  'goal_machine_15': {
    name: 'Matador Implacável',
    description: 'Marque 15 gols no campeonato',
    icon: '🚀',
    xpReward: 120,
  },
  'first_assist': {
    name: 'Primeira Assistência',
    description: 'Dê sua primeira assistência',
    icon: '🤝',
    xpReward: 15,
  },
  'assist_master_5': {
    name: 'Garçom',
    description: 'Alcance 5 assistências no campeonato',
    icon: '🍽️',
    xpReward: 40,
  },
  'assist_master_8': {
    name: 'Visão de Jogo',
    description: 'Alcance 8 assistências no campeonato',
    icon: '🧠',
    xpReward: 110,
  },
  'first_game': {
    name: 'Estreante',
    description: 'Jogue sua primeira partida',
    icon: '🌟',
    xpReward: 10,
  },
  'veteran_10': {
    name: 'Veterano',
    description: 'Jogue 10 partidas',
    icon: '👴',
    xpReward: 75,
  },
  'winning_goal': {
    name: 'Decisivo',
    description: 'Marque o gol da vitória',
    icon: '🏆',
    xpReward: 30,
  },
  'xp_1000': {
    name: 'Craque',
    description: 'Alcance 1000 pontos de XP',
    icon: '⭐',
    xpReward: 100,
  },
  'xp_1500': {
    name: 'Estrela em Ascensão',
    description: 'Alcance 1500 pontos de XP',
    icon: '🌠',
    xpReward: 150,
  },
  'xp_3000': {
    name: 'Ídolo da Torcida',
    description: 'Alcance 3000 pontos de XP',
    icon: '🏟️',
    xpReward: 250,
  },
};

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'unlockedAt'>[] = [
  {
    name: 'Primeiro Gol',
    description: 'Marque seu primeiro gol no campeonato',
    icon: '⚽',
    type: 'goal',
    condition: 'goals >= 1',
    xpReward: 20,
  },
  {
    name: 'Artilheiro Nato',
    description: 'Marque 5 gols no campeonato',
    icon: '🔥',
    type: 'goal',
    condition: 'goals >= 5',
    xpReward: 50,
  },
  {
    name: 'Máquina de Gols',
    description: 'Marque 10 gols no campeonato',
    icon: '⚡',
    type: 'goal',
    condition: 'goals >= 10',
    xpReward: 80,
  },
  {
    name: 'Matador Implacável',
    description: 'Marque 15 gols no campeonato',
    icon: '🚀',
    type: 'goal',
    condition: 'goals >= 15',
    xpReward: 120,
  },
  {
    name: 'Hat-Trick',
    description: 'Marque 3 gols no mesmo jogo',
    icon: '🎩',
    type: 'goal',
    condition: 'goals_in_game >= 3',
    xpReward: 100,
  },
  {
    name: 'Poker',
    description: 'Marque 4 gols no mesmo jogo',
    icon: '🃏',
    type: 'goal',
    condition: 'goals_in_game >= 4',
    xpReward: 150,
  },
  {
    name: 'Primeira Assistência',
    description: 'Dê sua primeira assistência',
    icon: '🤝',
    type: 'assist',
    condition: 'assists >= 1',
    xpReward: 15,
  },
  {
    name: 'Garçom',
    description: 'Alcance 5 assistências no campeonato',
    icon: '🍽️',
    type: 'assist',
    condition: 'assists >= 5',
    xpReward: 40,
  },
  {
    name: 'Visão de Jogo',
    description: 'Alcance 8 assistências no campeonato',
    icon: '🧠',
    type: 'assist',
    condition: 'assists >= 8',
    xpReward: 110,
  },
  {
    name: 'Decisivo',
    description: 'Marque o gol da vitória',
    icon: '🏆',
    type: 'special',
    condition: 'winning_goal',
    xpReward: 30,
  },
  {
    name: 'Estreante',
    description: 'Jogue sua primeira partida',
    icon: '🌟',
    type: 'game',
    condition: 'games >= 1',
    xpReward: 10,
  },
  {
    name: 'Veterano',
    description: 'Jogue 10 partidas',
    icon: '👴',
    type: 'game',
    condition: 'games >= 10',
    xpReward: 75,
  },
  {
    name: 'Craque',
    description: 'Alcance 1000 pontos de XP',
    icon: '⭐',
    type: 'special',
    condition: 'xp >= 1000',
    xpReward: 100,
  },
  {
    name: 'Estrela em Ascensão',
    description: 'Alcance 1500 pontos de XP',
    icon: '🌠',
    type: 'special',
    condition: 'xp >= 1500',
    xpReward: 150,
  },
  {
    name: 'Ídolo da Torcida',
    description: 'Alcance 3000 pontos de XP',
    icon: '🏟️',
    type: 'special',
    condition: 'xp >= 3000',
    xpReward: 250,
  },
  {
    name: 'Artilheiro da Rodada',
    description: 'Seja o maior pontuador da rodada',
    icon: '🥇',
    type: 'special',
    condition: 'round_mvp',
    xpReward: 25,
  },
];

// Conquistas para XADREZ
export const CHESS_ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'unlockedAt'>[] = [
  {
    name: 'Primeira Vitória',
    description: 'Vença sua primeira partida',
    icon: '♟️',
    type: 'game',
    condition: 'wins >= 1',
    xpReward: 20,
  },
  {
    name: 'Mestre do Xeque-Mate',
    description: 'Vença 5 partidas',
    icon: '♔',
    type: 'game',
    condition: 'wins >= 5',
    xpReward: 50,
  },
  {
    name: 'Caminho do Grande Mestre',
    description: 'Vença 10 partidas',
    icon: '👑',
    type: 'game',
    condition: 'wins >= 10',
    xpReward: 100,
  },
  {
    name: 'Veterano de Torneio',
    description: 'Jogue 15 partidas',
    icon: '🏛️',
    type: 'game',
    condition: 'games >= 15',
    xpReward: 75,
  },
  {
    name: 'Mente Estratégica',
    description: 'Alcance 1000 pontos de XP',
    icon: '🧠',
    type: 'special',
    condition: 'xp >= 1000',
    xpReward: 100,
  },
  {
    name: 'Lenda do Xadrez',
    description: 'Alcance 2000 pontos de XP',
    icon: '⭐',
    type: 'special',
    condition: 'xp >= 2000',
    xpReward: 200,
  },
  {
    name: 'Grande Mestre',
    description: 'Alcance 3500 pontos de XP',
    icon: '♛',
    type: 'special',
    condition: 'xp >= 3500',
    xpReward: 300,
  },
  {
    name: 'Invicto',
    description: 'Vença 5 partidas sem perder nenhuma',
    icon: '🛡️',
    type: 'special',
    condition: 'win_streak_5',
    xpReward: 100,
  },
  {
    name: 'Dominação Total',
    description: 'Mantenha 80% de aproveitamento em 10+ jogos',
    icon: '👑',
    type: 'special',
    condition: 'win_rate_80',
    xpReward: 150,
  },
  {
    name: 'Participação Exemplar',
    description: 'Jogue 20 partidas',
    icon: '🎖️',
    type: 'game',
    condition: 'games >= 20',
    xpReward: 120,
  },
];

export function checkAchievements(player: Player, game?: Game): Achievement[] {
  const newAchievements: Achievement[] = [];
  const existingAchievementNames = player.achievements.map(a => a.name);

  for (const achievementDef of ACHIEVEMENT_DEFINITIONS) {
    if (existingAchievementNames.includes(achievementDef.name)) {
      continue; // Já possui esta conquista
    }

    let shouldUnlock = false;

    switch (achievementDef.condition) {
      case 'goals >= 5':
        shouldUnlock = player.stats.goals >= 5;
        break;
      case 'goals >= 15':
        shouldUnlock = player.stats.goals >= 15;
        break;
      case 'assists >= 5':
        shouldUnlock = player.stats.assists >= 5;
        break;
      case 'assists >= 8':
        shouldUnlock = player.stats.assists >= 8;
        break;
      case 'games >= 1':
        shouldUnlock = player.stats.games >= 1;
        break;
      case 'games >= 10':
        shouldUnlock = player.stats.games >= 10;
        break;
      case 'xp >= 1000':
        shouldUnlock = player.xp >= 1000;
        break;
      case 'xp >= 1500':
        shouldUnlock = player.xp >= 1500;
        break;
      case 'xp >= 3000':
        shouldUnlock = player.xp >= 3000;
        break;
      case 'goals_in_game >= 3':
        if (game) {
          const playerGoalsInGame = (game.goals ?? []).filter(g => g.playerId === player.id).length;
          shouldUnlock = playerGoalsInGame >= 3;
        }
        break;
      // Adicionar mais condições conforme necessário
    }

    if (shouldUnlock) {
      newAchievements.push({
        ...achievementDef,
        id: generateId(),
        unlockedAt: new Date(),
      });
    }
  }

  return newAchievements;
}

export function calculateXP(action: 'goal' | 'assist' | 'win' | 'play'): number {
  const xpValues = {
    play: 10,
    goal: 20,
    assist: 15,
    win: 25,
  };
  
  return xpValues[action];
}
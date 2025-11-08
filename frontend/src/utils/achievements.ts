import type { Achievement, Player, Game } from '../types/index.ts';
import { generateId } from '../utils';

// Mapeamento de IDs salvos no banco para definições completas
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
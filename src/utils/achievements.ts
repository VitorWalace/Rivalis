import type { Achievement, Player, Game } from '../types/index.ts';
import { generateId } from '../utils';

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'unlockedAt'>[] = [
  {
    name: 'Artilheiro Nato',
    description: 'Marque 5 gols no campeonato',
    icon: '⚽',
    type: 'goal',
    condition: 'goals >= 5',
    xpReward: 50,
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
    name: 'Garçom',
    description: 'Alcance 5 assistências no campeonato',
    icon: '🍽️',
    type: 'assist',
    condition: 'assists >= 5',
    xpReward: 40,
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
      case 'assists >= 5':
        shouldUnlock = player.stats.assists >= 5;
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
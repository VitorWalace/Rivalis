import { create } from 'zustand';
import type { Match, CreateMatchData } from '../types/match';

interface MatchEditorState {
  currentMatch: Match | null;
  isEditing: boolean;
  championshipId: string | null;
  gameId: string | null;
  
  // Actions
  createMatch: (data: CreateMatchData, championshipId?: string, gameId?: string) => void;
  updateMatch: (match: Match) => void;
  finishMatch: () => void;
  resetMatch: () => void;
  
  // Sport-specific actions
  addVoleiPoint: (team: 'home' | 'away') => void;
  addBasquetePoints: (team: 'home' | 'away', points: 1 | 2 | 3, player?: string) => void;
  addFutsalGoal: (team: 'home' | 'away', player?: string) => void;
  addFutsalCard: (team: 'home' | 'away', type: 'yellow' | 'red', player?: string) => void;
  addTenisMesaPoint: (player: 'playerA' | 'playerB') => void;
  addXadrezMove: (move: string) => void;
  toggleXadrezTimer: () => void;
}

export const useMatchEditor = create<MatchEditorState>((set, get) => ({
  currentMatch: null,
  isEditing: false,
  championshipId: null,
  gameId: null,
  
  createMatch: (data: CreateMatchData, championshipId?: string, gameId?: string) => {
    const baseMatch = {
      id: crypto.randomUUID(),
      ...data,
      status: 'live' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    let match: Match;
    
    switch (data.sport) {
      case 'volei':
        match = {
          ...baseMatch,
          sport: 'volei',
          sets: [],
          currentSet: 1,
          events: [],
        };
        break;
        
      case 'basquete':
        match = {
          ...baseMatch,
          sport: 'basquete',
          quarters: [],
          currentQuarter: 1,
          events: [],
          stats: {
            home: { onePoint: { made: 0, attempts: 0 }, twoPoints: { made: 0, attempts: 0 }, threePoints: { made: 0, attempts: 0 } },
            away: { onePoint: { made: 0, attempts: 0 }, twoPoints: { made: 0, attempts: 0 }, threePoints: { made: 0, attempts: 0 } },
          },
        };
        break;
        
      case 'futsal':
        match = {
          ...baseMatch,
          sport: 'futsal',
          events: [],
          score: { home: 0, away: 0 },
          halves: [],
          currentHalf: 1,
        };
        break;
        
      case 'handebol':
        match = {
          ...baseMatch,
          sport: 'handebol',
          events: [],
          score: { home: 0, away: 0 },
          halves: [],
          currentHalf: 1,
        };
        break;
        
      case 'tenis_mesa':
        match = {
          ...baseMatch,
          sport: 'tenis_mesa',
          sets: [],
          currentSet: { playerA: 0, playerB: 0, serving: 'playerA' },
          events: [],
        };
        break;
        
      case 'xadrez':
        match = {
          ...baseMatch,
          sport: 'xadrez',
          moves: [],
          parsedMoves: [],
          times: {
            white: { remaining: '15:00', initial: '15:00' },
            black: { remaining: '15:00', initial: '15:00' },
          },
          captured: { white: [], black: [] },
          currentPosition: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting FEN
        };
        break;
    }
    
    set({ currentMatch: match, isEditing: true });
    
    if (championshipId) {
      set({ championshipId });
    }
    
    if (gameId) {
      set({ gameId });
    }
  },
  
  updateMatch: (match: Match) => {
    set({ currentMatch: { ...match, updatedAt: new Date().toISOString() } });
  },
  
  finishMatch: () => {
    const match = get().currentMatch;
    if (!match) return;
    
    set({
      currentMatch: {
        ...match,
        status: 'finished',
        updatedAt: new Date().toISOString(),
      },
      isEditing: false,
    });
  },
  
  resetMatch: () => {
    set({ currentMatch: null, isEditing: false, championshipId: null, gameId: null });
  },
  
  // VÔLEI
  addVoleiPoint: (team: 'home' | 'away') => {
    const match = get().currentMatch;
    if (!match || match.sport !== 'volei') return;
    
    const currentSetData = match.sets.find(s => s.set === match.currentSet) || {
      set: match.currentSet,
      homeScore: 0,
      awayScore: 0,
      duration: '0:00',
    };
    
    const updatedSet = {
      ...currentSetData,
      [team === 'home' ? 'homeScore' : 'awayScore']: currentSetData[team === 'home' ? 'homeScore' : 'awayScore'] + 1,
    };
    
    const updatedSets = match.sets.filter(s => s.set !== match.currentSet);
    updatedSets.push(updatedSet);
    updatedSets.sort((a, b) => a.set - b.set);
    
    const newEvent = {
      timestamp: new Date().toISOString(),
      type: 'point' as const,
      team,
      setNumber: match.currentSet,
    };
    
    set({
      currentMatch: {
        ...match,
        sets: updatedSets,
        events: [...match.events, newEvent],
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  // BASQUETE
  addBasquetePoints: (team: 'home' | 'away', points: 1 | 2 | 3, player?: string) => {
    const match = get().currentMatch;
    if (!match || match.sport !== 'basquete') return;
    
    const currentQuarterData = match.quarters.find(q => q.quarter === match.currentQuarter) || {
      quarter: match.currentQuarter,
      homeScore: 0,
      awayScore: 0,
      duration: '10:00',
    };
    
    const updatedQuarter = {
      ...currentQuarterData,
      [team === 'home' ? 'homeScore' : 'awayScore']: currentQuarterData[team === 'home' ? 'homeScore' : 'awayScore'] + points,
    };
    
    const updatedQuarters = match.quarters.filter(q => q.quarter !== match.currentQuarter);
    updatedQuarters.push(updatedQuarter);
    updatedQuarters.sort((a, b) => a.quarter - b.quarter);
    
    const newEvent = {
      timestamp: new Date().toISOString(),
      quarter: match.currentQuarter,
      type: 'basket' as const,
      points,
      team,
      player,
    };
    
    // Update stats
    const statsKey = points === 1 ? 'onePoint' : points === 2 ? 'twoPoints' : 'threePoints';
    const updatedStats = {
      ...match.stats,
      [team]: {
        ...match.stats[team],
        [statsKey]: {
          made: match.stats[team][statsKey].made + 1,
          attempts: match.stats[team][statsKey].attempts + 1,
        },
      },
    };
    
    set({
      currentMatch: {
        ...match,
        quarters: updatedQuarters,
        events: [...match.events, newEvent],
        stats: updatedStats,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  // FUTSAL
  addFutsalGoal: (team: 'home' | 'away', player?: string) => {
    const match = get().currentMatch;
    if (!match || match.sport !== 'futsal') return;
    
    const newEvent = {
      timestamp: new Date().toISOString(),
      type: 'goal' as const,
      team,
      player,
      half: match.currentHalf,
      minuteGame: '0:00', // TODO: calculate from timer
    };
    
    set({
      currentMatch: {
        ...match,
        score: {
          ...match.score,
          [team]: match.score[team] + 1,
        },
        events: [...match.events, newEvent],
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  addFutsalCard: (team: 'home' | 'away', type: 'yellow' | 'red', player?: string) => {
    const match = get().currentMatch;
    if (!match || match.sport !== 'futsal') return;
    
    const newEvent = {
      timestamp: new Date().toISOString(),
      type: (type === 'yellow' ? 'yellow_card' : 'red_card') as 'yellow_card' | 'red_card',
      team,
      player,
      half: match.currentHalf,
      minuteGame: '0:00', // TODO: calculate from timer
    };
    
    set({
      currentMatch: {
        ...match,
        events: [...match.events, newEvent],
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  // TÊNIS DE MESA
  addTenisMesaPoint: (player: 'playerA' | 'playerB') => {
    const match = get().currentMatch;
    if (!match || match.sport !== 'tenis_mesa') return;
    
    const newScore = {
      ...match.currentSet,
      [player]: match.currentSet[player] + 1,
    };
    
    // Check if set is won (11 points with 2 point difference)
    const playerAScore = newScore.playerA;
    const playerBScore = newScore.playerB;
    const setWon = (playerAScore >= 11 || playerBScore >= 11) && Math.abs(playerAScore - playerBScore) >= 2;
    
    if (setWon) {
      const completedSet = {
        set: match.sets.length + 1,
        playerA: playerAScore,
        playerB: playerBScore,
        duration: '0:00', // TODO: calculate
      };
      
      set({
        currentMatch: {
          ...match,
          sets: [...match.sets, completedSet],
          currentSet: { playerA: 0, playerB: 0, serving: 'playerA' },
          updatedAt: new Date().toISOString(),
        },
      });
    } else {
      // Toggle serving every 2 points
      const totalPoints = playerAScore + playerBScore;
      const serving = totalPoints % 2 === 0 ? newScore.serving : (newScore.serving === 'playerA' ? 'playerB' : 'playerA');
      
      set({
        currentMatch: {
          ...match,
          currentSet: { ...newScore, serving },
          updatedAt: new Date().toISOString(),
        },
      });
    }
  },
  
  // XADREZ
  addXadrezMove: (move: string) => {
    const match = get().currentMatch;
    if (!match || match.sport !== 'xadrez') return;
    
    const updatedMoves = [...match.moves, move];
    
    // Parse moves into pairs
    const parsedMoves = [];
    for (let i = 0; i < updatedMoves.length; i += 2) {
      parsedMoves.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: updatedMoves[i],
        black: updatedMoves[i + 1],
      });
    }
    
    set({
      currentMatch: {
        ...match,
        moves: updatedMoves,
        parsedMoves,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  toggleXadrezTimer: () => {
    // TODO: Implement timer logic
    console.log('Toggle chess timer');
  },
}));

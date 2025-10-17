// Tipos para o sistema de partidas

export type SportType = 'volei' | 'basquete' | 'futsal' | 'handebol' | 'tenis_mesa' | 'xadrez';

export interface BaseMatch {
  id: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  date: string;
  championship: string;
  status: 'scheduled' | 'live' | 'finished';
  createdAt: string;
  updatedAt: string;
}

// VÔLEI
export interface VoleiSet {
  set: number;
  homeScore: number;
  awayScore: number;
  duration: string;
}

export interface VoleiMatch extends BaseMatch {
  sport: 'volei';
  sets: VoleiSet[];
  currentSet: number;
  events: VoleiEvent[];
  result?: {
    winner: 'home' | 'away';
    score: string; // "3-1"
  };
}

export interface VoleiEvent {
  timestamp: string;
  type: 'point' | 'timeout';
  team: 'home' | 'away';
  setNumber: number;
}

// BASQUETE
export interface BasqueteQuarter {
  quarter: number;
  homeScore: number;
  awayScore: number;
  duration: string;
}

export interface BasqueteEvent {
  timestamp: string;
  quarter: number;
  type: 'basket';
  points: 1 | 2 | 3;
  team: 'home' | 'away';
  player?: string;
}

export interface BasqueteMatch extends BaseMatch {
  sport: 'basquete';
  quarters: BasqueteQuarter[];
  currentQuarter: number;
  events: BasqueteEvent[];
  stats: {
    home: BasqueteStats;
    away: BasqueteStats;
  };
  result?: {
    winner: 'home' | 'away';
    finalScore: string;
  };
}

export interface BasqueteStats {
  onePoint: { made: number; attempts: number };
  twoPoints: { made: number; attempts: number };
  threePoints: { made: number; attempts: number };
}

// FUTSAL
export interface FutsalEvent {
  timestamp: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  team: 'home' | 'away';
  player?: string;
  half: 1 | 2;
  minuteGame: string;
}

export interface FutsalHalf {
  half: 1 | 2;
  homeScore: number;
  awayScore: number;
  duration: string;
}

export interface FutsalMatch extends BaseMatch {
  sport: 'futsal';
  events: FutsalEvent[];
  score: {
    home: number;
    away: number;
  };
  halves: FutsalHalf[];
  currentHalf: 1 | 2;
  result?: {
    winner: 'home' | 'away' | 'draw';
    finalScore: string;
  };
}

// HANDEBOL (mesma estrutura que futsal)
export type HandebolEvent = FutsalEvent;
export type HandebolHalf = FutsalHalf;
export interface HandebolMatch extends BaseMatch {
  sport: 'handebol';
  events: HandebolEvent[];
  score: {
    home: number;
    away: number;
  };
  halves: HandebolHalf[];
  currentHalf: 1 | 2;
  result?: {
    winner: 'home' | 'away' | 'draw';
    finalScore: string;
  };
}

// TÊNIS DE MESA
export interface TenisMesaSet {
  set: number;
  playerA: number;
  playerB: number;
  duration: string;
}

export interface TenisMesaEvent {
  setNumber: number;
  point: number;
  scorer: 'playerA' | 'playerB';
  timestamp: string;
}

export interface TenisMesaMatch extends BaseMatch {
  sport: 'tenis_mesa';
  sets: TenisMesaSet[];
  currentSet: {
    playerA: number;
    playerB: number;
    serving: 'playerA' | 'playerB';
  };
  events: TenisMesaEvent[];
  result?: {
    winner: 'playerA' | 'playerB';
    score: string; // "3-1"
  };
}

// XADREZ
export interface XadrezMove {
  moveNumber: number;
  white?: string;
  black?: string;
  whiteTime?: string;
  blackTime?: string;
}

export interface XadrezMatch extends BaseMatch {
  sport: 'xadrez';
  moves: string[];
  parsedMoves: XadrezMove[];
  times: {
    white: { remaining: string; initial: string };
    black: { remaining: string; initial: string };
  };
  captured: {
    white: string[];
    black: string[];
  };
  currentPosition: string; // FEN notation
  result?: {
    winner: 'white' | 'black' | 'draw';
    method: 'checkmate' | 'time' | 'resignation' | 'agreement' | 'stalemate';
    totalMoves: number;
  };
}

// Union type para todos os tipos de partida
export type Match = 
  | VoleiMatch 
  | BasqueteMatch 
  | FutsalMatch 
  | HandebolMatch 
  | TenisMesaMatch 
  | XadrezMatch;

// Tipo para criar nova partida
export interface CreateMatchData {
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  date: string;
  championship: string;
}

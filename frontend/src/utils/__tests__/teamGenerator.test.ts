import { describe, expect, it } from 'vitest';
import type { Team } from '../../types';
import {
  AUTO_TEAM_GENERATION_LIMIT,
  DEFAULT_PLAYERS_PER_TEAM,
  evaluateGenerationCapacity,
  generateTeamsForTesting,
} from '../teamGenerator';

const createStubTeam = (id: string): Team => ({
  id,
  name: `Stub ${id}`,
  championshipId: 'champ-1',
  players: [],
  stats: {
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    games: 0,
    position: 0,
  },
});

describe('teamGenerator utilities', () => {
  it('limits auto-generation to default maximum when no cap is configured', () => {
    const context = evaluateGenerationCapacity({ id: 'champ-1', teams: [] });

    expect(context.allowableCount).toBe(AUTO_TEAM_GENERATION_LIMIT);
    expect(context.canGenerate).toBe(true);
    expect(context.nextOrder).toBe(1);
  });

  it('respects championship max teams when smaller than default limit', () => {
    const context = evaluateGenerationCapacity({
      id: 'champ-1',
      teams: [createStubTeam('t1'), createStubTeam('t2')],
      maxTeams: 5,
    });

    expect(context.allowableCount).toBe(3);
    expect(context.canGenerate).toBe(true);
    expect(context.nextOrder).toBe(3);
  });

  it('returns no generation capacity when limit already reached', () => {
    const context = evaluateGenerationCapacity({
      id: 'champ-1',
      teams: Array.from({ length: 5 }, (_, index) => createStubTeam(`t${index}`)),
      maxTeams: 5,
    });

    expect(context.allowableCount).toBe(0);
    expect(context.canGenerate).toBe(false);
  });

  it('generates teams with players matching manual structure', () => {
    const { generatedTeams, context } = generateTeamsForTesting({ id: 'champ-1', teams: [], maxTeams: 3 });

    expect(context.allowableCount).toBe(3);
    expect(generatedTeams).toHaveLength(3);
    const firstTeam = generatedTeams[0];
    expect(firstTeam.players).toHaveLength(DEFAULT_PLAYERS_PER_TEAM);
    expect(firstTeam.players[0]).toMatchObject({
      name: 'Jogador 1-1',
      number: 1,
      position: 'Goleiro',
    });
  });

  it('stops generation when championship has no room left', () => {
    const baseTeams = Array.from({ length: 8 }, (_, index) => createStubTeam(`team-${index + 1}`));
    const { generatedTeams, context } = generateTeamsForTesting({
      id: 'champ-1',
      teams: baseTeams,
      maxTeams: 8,
    });

    expect(context.canGenerate).toBe(false);
    expect(generatedTeams).toHaveLength(0);
  });
});

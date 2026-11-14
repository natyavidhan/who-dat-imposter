import { describe, expect, it } from '@jest/globals';

import { BUILT_IN_CATEGORIES, DEFAULT_CATEGORY_IDS, TOTAL_BUILT_IN_WORDS } from '@/data/categories';

import {
  addPoints,
  buildPool,
  CHAOS_CHANCE,
  cleanName,
  createRound,
  CREW_POINTS,
  effectiveImposters,
  IMPOSTER_POINTS,
  imposterHint,
  judgeAccusation,
  maxImposters,
  outcomeAfterAccusation,
  outcomeAfterGuess,
  parseWordList,
  pickWord,
  requiredAccusations,
  seededRng,
  shuffle,
  speakingOrder,
  type Rng,
} from './engine';
import type { Category, Player, Round, Settings } from './types';

const SETTINGS: Settings = {
  imposterCount: 1,
  hintMode: 'category',
  timerSeconds: 0,
  chaosMode: false,
  lastChance: true,
  haptics: false,
};

const players = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));

const TINY: Category = {
  id: 'tiny',
  name: 'Tiny',
  emoji: '🧪',
  color: 'lime',
  words: [{ word: 'Alpha', hint: 'First' }, { word: 'Beta' }, { word: 'Gamma', hint: 'Third' }],
};

function makeRound(overrides: Partial<Settings> = {}, count = 5, rng: Rng = seededRng(7)): Round {
  return createRound({
    id: 'r1',
    number: 1,
    players: players(count),
    settings: { ...SETTINGS, ...overrides },
    pool: buildPool([TINY], ['tiny']),
    recent: [],
    rng,
  }).round;
}

/** An rng that replays fixed values, for steering specific branches. */
function scripted(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('imposter limits', () => {
  it('keeps imposters outnumbered by the crew', () => {
    expect(maxImposters(3)).toBe(1);
    expect(maxImposters(4)).toBe(1);
    expect(maxImposters(5)).toBe(2);
    expect(maxImposters(15)).toBe(7);
    for (let n = 3; n <= 15; n++) {
      expect(maxImposters(n) * 2).toBeLessThan(n);
    }
  });

  it('clamps the requested imposter count', () => {
    expect(effectiveImposters(3, 4)).toBe(1);
    expect(effectiveImposters(0, 8)).toBe(1);
    expect(effectiveImposters(2, 8)).toBe(2);
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input, seededRng(3));
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...output].sort()).toEqual(input);
  });
});

describe('word pool', () => {
  it('only includes selected categories and skips duplicates', () => {
    const dupes: Category = { ...TINY, id: 'dupes', words: [{ word: 'Echo' }, { word: ' echo ' }, { word: '' }] };
    const pool = buildPool([TINY, dupes], ['dupes']);
    expect(pool.map((e) => e.word)).toEqual(['Echo']);
  });

  it('does not repeat a word until the pool is used up', () => {
    const pool = buildPool([TINY], ['tiny']);
    const rng = seededRng(11);
    let recent: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      const pick = pickWord(pool, recent, rng);
      recent = pick.recent;
      expect(seen.has(pick.entry.key)).toBe(false);
      seen.add(pick.entry.key);
    }
    expect(seen.size).toBe(pool.length);
  });

  it('starts over once exhausted, without an immediate repeat', () => {
    const pool = buildPool([TINY], ['tiny']);
    const rng = seededRng(5);
    let recent: string[] = [];
    let last = '';
    for (let i = 0; i < 30; i++) {
      const pick = pickWord(pool, recent, rng);
      expect(pick.entry.key).not.toBe(last);
      last = pick.entry.key;
      recent = pick.recent;
    }
  });

  it('refuses an empty pool', () => {
    expect(() => pickWord([], [], seededRng(1))).toThrow();
  });
});

describe('createRound', () => {
  it('deals the configured number of imposters', () => {
    for (let seed = 1; seed < 40; seed++) {
      const round = makeRound({ imposterCount: 2 }, 6, seededRng(seed));
      expect(round.imposterIds).toHaveLength(2);
      expect(new Set(round.imposterIds).size).toBe(2);
      expect(round.chaos).toBe(false);
      expect(round.players.map((p) => p.id)).toContain(round.starterId);
    }
  });

  it('never deals more imposters than the table allows', () => {
    const round = makeRound({ imposterCount: 5 }, 4);
    expect(round.imposterIds).toHaveLength(1);
    expect(round.announcedImposters).toBe(1);
  });

  it('turns everyone into an imposter on a chaos roll', () => {
    const round = makeRound({ chaosMode: true }, 5, scripted([0.5, CHAOS_CHANCE / 2]));
    expect(round.chaos).toBe(true);
    expect(round.imposterIds).toHaveLength(5);
    expect(round.announcedImposters).toBe(1);
  });

  it('never rolls chaos while chaos mode is off', () => {
    for (let seed = 1; seed < 60; seed++) {
      expect(makeRound({ chaosMode: false }, 5, seededRng(seed)).chaos).toBe(false);
    }
  });

  it('requires at least three players', () => {
    expect(() => makeRound({}, 2)).toThrow();
  });

  it('snapshots settings and starts in the reveal phase', () => {
    const round = makeRound({ timerSeconds: 120, lastChance: false, hintMode: 'clue' });
    expect(round.phase).toBe('reveal');
    expect(round.revealIndex).toBe(0);
    expect(round.timerSeconds).toBe(120);
    expect(round.lastChance).toBe(false);
    expect(round.hintMode).toBe('clue');
    expect(round.outcome).toBeNull();
  });
});

describe('imposter hints', () => {
  const base = makeRound();
  it('respects the hint mode', () => {
    expect(imposterHint({ ...base, hintMode: 'off' })).toBeNull();
    expect(imposterHint({ ...base, hintMode: 'category' })).toEqual({ label: 'Category', text: '🧪 Tiny' });
    expect(imposterHint({ ...base, hintMode: 'clue', clue: 'First' })).toEqual({ label: 'Clue', text: 'First' });
  });

  it('falls back to the category when a word has no clue', () => {
    expect(imposterHint({ ...base, hintMode: 'clue', clue: null })).toEqual({ label: 'Category', text: '🧪 Tiny' });
  });
});

describe('speaking order', () => {
  it('starts with the starter and wraps around the circle', () => {
    const round = { ...makeRound(), starterId: 'p3' };
    expect(speakingOrder(round).map((p) => p.id)).toEqual(['p3', 'p4', 'p5', 'p1', 'p2']);
  });
});

describe('accusations and scoring', () => {
  const round: Round = { ...makeRound({ imposterCount: 2 }, 6), imposterIds: ['p2', 'p5'], lastChance: false };

  it('asks for one suspect per announced imposter', () => {
    expect(requiredAccusations(round)).toBe(2);
    expect(requiredAccusations({ ...round, announcedImposters: 1 })).toBe(1);
  });

  it('judges who was caught', () => {
    expect(judgeAccusation(round, ['p2', 'p5']).allCaught).toBe(true);
    const partial = judgeAccusation(round, ['p2', 'p1']);
    expect(partial).toEqual({ caught: ['p2'], innocent: ['p1'], allCaught: false });
  });

  it('gives the crew a point each when every imposter is caught', () => {
    const outcome = outcomeAfterAccusation(round, ['p5', 'p2']);
    expect(outcome?.winner).toBe('crew');
    expect(outcome?.points).toEqual({ p1: CREW_POINTS, p3: CREW_POINTS, p4: CREW_POINTS, p6: CREW_POINTS });
  });

  it('lets the imposters win when one slips away', () => {
    const outcome = outcomeAfterAccusation(round, ['p2', 'p3']);
    expect(outcome).toMatchObject({ winner: 'imposters', reason: 'escaped' });
    expect(outcome?.points).toEqual({ p2: IMPOSTER_POINTS, p5: IMPOSTER_POINTS });
  });

  it('waits for the last-chance guess when enabled', () => {
    const withGuess = { ...round, lastChance: true };
    expect(outcomeAfterAccusation(withGuess, ['p2', 'p5'])).toBeNull();
    expect(outcomeAfterGuess(withGuess, true)).toMatchObject({ winner: 'imposters', reason: 'stole' });
    expect(outcomeAfterGuess(withGuess, false)).toMatchObject({ winner: 'crew', reason: 'caught' });
  });

  it('scores nothing for skipped votes and chaos rounds', () => {
    expect(outcomeAfterAccusation(round, [])).toEqual({ winner: 'none', reason: 'skipped', points: {} });
    const chaos = { ...round, chaos: true, imposterIds: round.players.map((p) => p.id) };
    expect(outcomeAfterAccusation(chaos, ['p1', 'p2'])).toEqual({ winner: 'chaos', reason: 'chaos', points: {} });
  });

  it('adds points onto existing scores', () => {
    expect(addPoints({ p1: 2 }, { p1: 1, p2: 2 })).toEqual({ p1: 3, p2: 2 });
  });
});

describe('text helpers', () => {
  it('cleans player names', () => {
    expect(cleanName('   Big   Sam  ')).toBe('Big Sam');
    expect(cleanName('a'.repeat(30))).toHaveLength(16);
  });

  it('parses pasted word lists', () => {
    expect(parseWordList('pizza, Tacos\nsushi;; pizza', ['Sushi'])).toEqual(['pizza', 'Tacos']);
  });
});

describe('built-in word packs', () => {
  it('ships plenty of words', () => {
    expect(BUILT_IN_CATEGORIES.length).toBeGreaterThanOrEqual(15);
    expect(TOTAL_BUILT_IN_WORDS).toBeGreaterThanOrEqual(600);
  });

  it('has unique category ids and valid defaults', () => {
    const ids = BUILT_IN_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of DEFAULT_CATEGORY_IDS) expect(ids).toContain(id);
  });

  it('never lists the same word twice', () => {
    const seen = new Map<string, string>();
    for (const category of BUILT_IN_CATEGORIES) {
      for (const { word } of category.words) {
        const key = word.toLowerCase();
        expect(`${word} in ${seen.get(key) ?? category.id}`).toBe(`${word} in ${category.id}`);
        seen.set(key, category.id);
      }
    }
  });

  it('gives every word a clue that does not spoil it', () => {
    for (const category of BUILT_IN_CATEGORIES) {
      expect(category.words.length).toBeGreaterThanOrEqual(40);
      for (const { word, hint } of category.words) {
        expect(hint).toBeTruthy();
        const w = word.toLowerCase();
        const h = (hint ?? '').toLowerCase();
        const spoils = w.includes(h) || h.includes(w);
        expect(spoils ? `${word} → ${hint}` : 'ok').toBe('ok');
      }
    }
  });
});

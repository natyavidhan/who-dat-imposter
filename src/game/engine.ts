/**
 * Pure game rules. Nothing in here touches React, storage or the clock, so
 * every rule can be unit tested with a seeded random number generator.
 */
import type {
  Category,
  Outcome,
  OutcomeReason,
  Player,
  Round,
  Settings,
  Winner,
  WordEntry,
} from './types';

export type Rng = () => number;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 15;
export const MAX_NAME_LENGTH = 16;
/** Chance that a round becomes a chaos round when chaos mode is on. */
export const CHAOS_CHANCE = 0.15;
/** How many recently used words are remembered to avoid repeats. */
export const RECENT_LIMIT = 400;
export const CREW_POINTS = 1;
export const IMPOSTER_POINTS = 2;

export function randomInt(maxExclusive: number, rng: Rng): number {
  return Math.min(maxExclusive - 1, Math.floor(rng() * maxExclusive));
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Imposters must always be outnumbered by the crew. */
export function maxImposters(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

export function effectiveImposters(requested: number, playerCount: number): number {
  return Math.min(Math.max(1, Math.round(requested)), maxImposters(playerCount));
}

export type PoolEntry = WordEntry & { key: string; category: Category };

export function wordKey(categoryId: string, word: string): string {
  return `${categoryId}:${word.trim().toLowerCase()}`;
}

export function buildPool(categories: readonly Category[], selectedIds: readonly string[]): PoolEntry[] {
  const selected = new Set(selectedIds);
  const seen = new Set<string>();
  const pool: PoolEntry[] = [];
  for (const category of categories) {
    if (!selected.has(category.id)) continue;
    for (const entry of category.words) {
      const word = entry.word.trim();
      if (!word) continue;
      const key = wordKey(category.id, word);
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push({ word, hint: entry.hint?.trim() || undefined, key, category });
    }
  }
  return pool;
}

/**
 * Picks a word that hasn't come up recently. Once every word in the pool has
 * been used, the pool's history is cleared (while still avoiding an
 * immediate repeat of the last word).
 */
export function pickWord(
  pool: readonly PoolEntry[],
  recent: readonly string[],
  rng: Rng,
): { entry: PoolEntry; recent: string[] } {
  if (pool.length === 0) {
    throw new Error('Cannot pick a word from an empty pool');
  }
  const recentSet = new Set(recent);
  let candidates = pool.filter((entry) => !recentSet.has(entry.key));
  let nextRecent = [...recent];

  if (candidates.length === 0) {
    const lastKey = recent[recent.length - 1];
    const poolKeys = new Set(pool.map((entry) => entry.key));
    nextRecent = nextRecent.filter((key) => !poolKeys.has(key));
    candidates = pool.length > 1 ? pool.filter((entry) => entry.key !== lastKey) : [...pool];
  }

  const entry = candidates[randomInt(candidates.length, rng)];
  nextRecent.push(entry.key);
  if (nextRecent.length > RECENT_LIMIT) {
    nextRecent = nextRecent.slice(-RECENT_LIMIT);
  }
  return { entry, recent: nextRecent };
}

export type CreateRoundInput = {
  id: string;
  number: number;
  players: readonly Player[];
  settings: Settings;
  pool: readonly PoolEntry[];
  recent: readonly string[];
  rng: Rng;
};

export function createRound(input: CreateRoundInput): { round: Round; recent: string[] } {
  const { players, settings, rng } = input;
  if (players.length < MIN_PLAYERS) {
    throw new Error(`At least ${MIN_PLAYERS} players are needed`);
  }

  const { entry, recent } = pickWord(input.pool, input.recent, rng);
  const ids = players.map((player) => player.id);
  const announcedImposters = effectiveImposters(settings.imposterCount, players.length);
  const chaos = settings.chaosMode && rng() < CHAOS_CHANCE;
  const imposterIds = chaos ? [...ids] : shuffle(ids, rng).slice(0, announcedImposters);
  const starterId = ids[randomInt(ids.length, rng)];

  return {
    round: {
      id: input.id,
      number: input.number,
      players: players.map((player) => ({ ...player })),
      categoryId: entry.category.id,
      categoryName: entry.category.name,
      categoryEmoji: entry.category.emoji,
      categoryColor: entry.category.color,
      word: entry.word,
      clue: entry.hint ?? null,
      hintMode: settings.hintMode,
      imposterIds,
      announcedImposters,
      chaos,
      starterId,
      timerSeconds: Math.max(0, Math.round(settings.timerSeconds)),
      lastChance: settings.lastChance,
      phase: 'reveal',
      revealIndex: 0,
      accusedIds: [],
      awaitingGuess: false,
      outcome: null,
    },
    recent,
  };
}

export function isImposter(round: Round, playerId: string): boolean {
  return round.imposterIds.includes(playerId);
}

export type ImposterHint = { label: string; text: string };

/** The hint printed on an imposter's card, or null when hints are off. */
export function imposterHint(round: Round): ImposterHint | null {
  const category = `${round.categoryEmoji} ${round.categoryName}`;
  switch (round.hintMode) {
    case 'off':
      return null;
    case 'category':
      return { label: 'Category', text: category };
    case 'clue':
      return round.clue ? { label: 'Clue', text: round.clue } : { label: 'Category', text: category };
  }
}

/** Players in clue-giving order: the starter first, then around the circle. */
export function speakingOrder(round: Round): Player[] {
  const start = Math.max(
    0,
    round.players.findIndex((player) => player.id === round.starterId),
  );
  return [...round.players.slice(start), ...round.players.slice(0, start)];
}

export function playerName(round: Round, playerId: string): string {
  return round.players.find((player) => player.id === playerId)?.name ?? 'Someone';
}

/** How many suspects the table must accuse (one per announced imposter). */
export function requiredAccusations(round: Round): number {
  return Math.max(1, Math.min(round.announcedImposters, round.players.length - 1));
}

export function judgeAccusation(round: Round, accusedIds: readonly string[]) {
  const imposters = new Set(round.imposterIds);
  const caught = accusedIds.filter((id) => imposters.has(id));
  const innocent = accusedIds.filter((id) => !imposters.has(id));
  const allCaught =
    accusedIds.length > 0 &&
    (round.chaos || round.imposterIds.every((id) => accusedIds.includes(id)));
  return { caught, innocent, allCaught };
}

export function computePoints(round: Round, winner: Winner): Record<string, number> {
  const points: Record<string, number> = {};
  if (winner === 'crew') {
    for (const player of round.players) {
      if (!isImposter(round, player.id)) points[player.id] = CREW_POINTS;
    }
  } else if (winner === 'imposters') {
    for (const id of round.imposterIds) points[id] = IMPOSTER_POINTS;
  }
  return points;
}

function makeOutcome(round: Round, winner: Winner, reason: OutcomeReason): Outcome {
  return { winner, reason, points: computePoints(round, winner) };
}

/**
 * Settles a round right after the accusation. Returns null when every
 * imposter was caught and they still get a last-chance guess at the word.
 */
export function outcomeAfterAccusation(round: Round, accusedIds: readonly string[]): Outcome | null {
  if (round.chaos) return makeOutcome(round, 'chaos', 'chaos');
  if (accusedIds.length === 0) return makeOutcome(round, 'none', 'skipped');
  const { allCaught } = judgeAccusation(round, accusedIds);
  if (!allCaught) return makeOutcome(round, 'imposters', 'escaped');
  if (round.lastChance) return null;
  return makeOutcome(round, 'crew', 'caught');
}

export function outcomeAfterGuess(round: Round, guessedRight: boolean): Outcome {
  return guessedRight ? makeOutcome(round, 'imposters', 'stole') : makeOutcome(round, 'crew', 'caught');
}

export function addPoints(
  scores: Readonly<Record<string, number>>,
  points: Readonly<Record<string, number>>,
): Record<string, number> {
  const next = { ...scores };
  for (const [id, value] of Object.entries(points)) {
    next[id] = (next[id] ?? 0) + value;
  }
  return next;
}

/** Deterministic PRNG (mulberry32), handy for tests and reproducible rounds. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

/** Splits pasted text ("pizza, tacos\nsushi") into unique, trimmed words. */
export function parseWordList(raw: string, existing: readonly string[] = []): string[] {
  const seen = new Set(existing.map((word) => word.toLowerCase()));
  const out: string[] = [];
  for (const piece of raw.split(/[,\n;]+/)) {
    const word = piece.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!word || seen.has(word.toLowerCase())) continue;
    seen.add(word.toLowerCase());
    out.push(word);
  }
  return out;
}

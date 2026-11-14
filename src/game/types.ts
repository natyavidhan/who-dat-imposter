import type { Swatch } from '@/theme';

export type Player = {
  id: string;
  name: string;
};

/** What the imposter gets to see on their card. */
export type HintMode = 'off' | 'category' | 'clue';

export type Settings = {
  imposterCount: number;
  hintMode: HintMode;
  /** Discussion timer length in seconds; 0 turns the timer off. */
  timerSeconds: number;
  /** Occasionally deal everyone the imposter card. */
  chaosMode: boolean;
  /** Caught imposters can steal the win by guessing the word. */
  lastChance: boolean;
  haptics: boolean;
};

export type WordEntry = {
  word: string;
  /** Loosely related clue shown to the imposter in "clue" hint mode. */
  hint?: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: Swatch;
  words: WordEntry[];
  custom?: boolean;
};

export type Phase = 'reveal' | 'discuss' | 'vote' | 'result';

export type Winner = 'crew' | 'imposters' | 'chaos' | 'none';
export type OutcomeReason = 'caught' | 'escaped' | 'stole' | 'chaos' | 'skipped';

export type Outcome = {
  winner: Winner;
  reason: OutcomeReason;
  /** Points earned this round, keyed by player id. */
  points: Record<string, number>;
};

export type Round = {
  id: string;
  number: number;
  /** Snapshot of the players in seating order (the order the phone is passed). */
  players: Player[];
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: Swatch;
  word: string;
  clue: string | null;
  hintMode: HintMode;
  imposterIds: string[];
  /** How many imposters the table was told about (the lobby setting). */
  announcedImposters: number;
  /** Everyone is secretly the imposter this round. */
  chaos: boolean;
  starterId: string;
  timerSeconds: number;
  lastChance: boolean;
  phase: Phase;
  revealIndex: number;
  accusedIds: string[];
  /** True while caught imposters are making their last-chance guess. */
  awaitingGuess: boolean;
  outcome: Outcome | null;
};

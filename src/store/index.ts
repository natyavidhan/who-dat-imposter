import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BUILT_IN_CATEGORIES, DEFAULT_CATEGORY_IDS } from '@/data/categories';
import {
  addPoints,
  buildPool,
  cleanName,
  createRound,
  MAX_PLAYERS,
  MIN_PLAYERS,
  outcomeAfterAccusation,
  outcomeAfterGuess,
  parseWordList,
} from '@/game/engine';
import type { Category, Phase, Player, Round, Settings } from '@/game/types';
import type { Swatch } from '@/theme';

export function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_SETTINGS: Settings = {
  imposterCount: 1,
  hintMode: 'category',
  timerSeconds: 0,
  chaosMode: false,
  lastChance: true,
  haptics: true,
};

const DEFAULT_PLAYERS: Player[] = [1, 2, 3, 4].map((n) => ({ id: `p${n}`, name: `Player ${n}` }));

type PersistedState = {
  players: Player[];
  settings: Settings;
  selectedCategoryIds: string[];
  customCategories: Category[];
  scores: Record<string, number>;
  recentWords: string[];
  roundsPlayed: number;
};

export type CustomCategoryInput = {
  id?: string;
  name: string;
  emoji: string;
  color: Swatch;
  words: string[];
};

export type StartResult = { ok: true } | { ok: false; reason: string };

type Actions = {
  addPlayer: (name?: string) => void;
  renamePlayer: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  movePlayer: (id: string, delta: -1 | 1) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleCategory: (id: string) => void;
  setSelectedCategories: (ids: string[]) => void;
  saveCustomCategory: (input: CustomCategoryInput) => string;
  deleteCustomCategory: (id: string) => void;
  startRound: () => StartResult;
  nextReveal: () => void;
  setPhase: (phase: Phase) => void;
  accuse: (accusedIds: string[]) => void;
  resolveGuess: (guessedRight: boolean) => void;
  resetScores: () => void;
};

type State = PersistedState & Actions & { round: Round | null };

function uniqueName(desired: string, players: readonly Player[], ignoreId?: string): string {
  const taken = new Set(
    players.filter((p) => p.id !== ignoreId).map((p) => p.name.toLowerCase()),
  );
  if (!taken.has(desired.toLowerCase())) return desired;
  for (let n = 2; ; n++) {
    const suffix = ` ${n}`;
    const candidate = `${desired.slice(0, 16 - suffix.length)}${suffix}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

function nextDefaultName(players: readonly Player[]): string {
  const taken = new Set(players.map((p) => p.name.toLowerCase()));
  for (let n = players.length + 1; ; n++) {
    const candidate = `Player ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

export function allCategories(custom: readonly Category[]): Category[] {
  return [...BUILT_IN_CATEGORIES, ...custom];
}

export const useGame = create<State>()(
  persist(
    (set, get) => ({
      players: DEFAULT_PLAYERS,
      settings: DEFAULT_SETTINGS,
      selectedCategoryIds: DEFAULT_CATEGORY_IDS,
      customCategories: [],
      scores: {},
      recentWords: [],
      roundsPlayed: 0,
      round: null,

      addPlayer: (name) =>
        set((state) => {
          if (state.players.length >= MAX_PLAYERS) return state;
          const cleaned = cleanName(name ?? '');
          const finalName = cleaned
            ? uniqueName(cleaned, state.players)
            : nextDefaultName(state.players);
          return { players: [...state.players, { id: makeId(), name: finalName }] };
        }),

      renamePlayer: (id, name) =>
        set((state) => {
          const cleaned = cleanName(name);
          if (!cleaned) return state;
          const finalName = uniqueName(cleaned, state.players, id);
          return {
            players: state.players.map((p) => (p.id === id ? { ...p, name: finalName } : p)),
          };
        }),

      removePlayer: (id) =>
        set((state) => {
          const scores = { ...state.scores };
          delete scores[id];
          return { players: state.players.filter((p) => p.id !== id), scores };
        }),

      movePlayer: (id, delta) =>
        set((state) => {
          const index = state.players.findIndex((p) => p.id === id);
          const target = index + delta;
          if (index < 0 || target < 0 || target >= state.players.length) return state;
          const players = [...state.players];
          [players[index], players[target]] = [players[target], players[index]];
          return { players };
        }),

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

      toggleCategory: (id) =>
        set((state) => ({
          selectedCategoryIds: state.selectedCategoryIds.includes(id)
            ? state.selectedCategoryIds.filter((c) => c !== id)
            : [...state.selectedCategoryIds, id],
        })),

      setSelectedCategories: (ids) => set({ selectedCategoryIds: [...new Set(ids)] }),

      saveCustomCategory: (input) => {
        const id = input.id ?? `custom-${makeId()}`;
        const category: Category = {
          id,
          name: input.name.trim().slice(0, 28) || 'My words',
          emoji: input.emoji,
          color: input.color,
          words: parseWordList(input.words.join('\n')).map((word) => ({ word })),
          custom: true,
        };
        set((state) => {
          const exists = state.customCategories.some((c) => c.id === id);
          return {
            customCategories: exists
              ? state.customCategories.map((c) => (c.id === id ? category : c))
              : [...state.customCategories, category],
            selectedCategoryIds: state.selectedCategoryIds.includes(id)
              ? state.selectedCategoryIds
              : [...state.selectedCategoryIds, id],
          };
        });
        return id;
      },

      deleteCustomCategory: (id) =>
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
          selectedCategoryIds: state.selectedCategoryIds.filter((c) => c !== id),
        })),

      startRound: () => {
        const state = get();
        if (state.players.length < MIN_PLAYERS) {
          return { ok: false, reason: `Add at least ${MIN_PLAYERS} players to play.` };
        }
        const pool = buildPool(allCategories(state.customCategories), state.selectedCategoryIds);
        if (pool.length === 0) {
          return { ok: false, reason: 'Pick at least one category with words in it.' };
        }
        const { round, recent } = createRound({
          id: makeId(),
          number: state.roundsPlayed + 1,
          players: state.players,
          settings: state.settings,
          pool,
          recent: state.recentWords,
          rng: Math.random,
        });
        set({ round, recentWords: recent });
        return { ok: true };
      },

      nextReveal: () =>
        set((state) => {
          const round = state.round;
          if (!round || round.phase !== 'reveal') return state;
          const isLast = round.revealIndex >= round.players.length - 1;
          return {
            round: isLast
              ? { ...round, phase: 'discuss' }
              : { ...round, revealIndex: round.revealIndex + 1 },
          };
        }),

      setPhase: (phase) =>
        set((state) => (state.round ? { round: { ...state.round, phase } } : state)),

      accuse: (accusedIds) =>
        set((state) => {
          const round = state.round;
          if (!round || round.outcome) return state;
          const outcome = outcomeAfterAccusation(round, accusedIds);
          const nextRound: Round = {
            ...round,
            phase: 'result',
            accusedIds: [...accusedIds],
            awaitingGuess: outcome === null,
            outcome,
          };
          if (!outcome) return { round: nextRound };
          return {
            round: nextRound,
            scores: addPoints(state.scores, outcome.points),
            roundsPlayed: state.roundsPlayed + 1,
          };
        }),

      resolveGuess: (guessedRight) =>
        set((state) => {
          const round = state.round;
          if (!round || !round.awaitingGuess || round.outcome) return state;
          const outcome = outcomeAfterGuess(round, guessedRight);
          return {
            round: { ...round, awaitingGuess: false, outcome },
            scores: addPoints(state.scores, outcome.points),
            roundsPlayed: state.roundsPlayed + 1,
          };
        }),

      resetScores: () => set({ scores: {}, roundsPlayed: 0 }),
    }),
    {
      name: 'who-dat-imposter',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedState => ({
        players: state.players,
        settings: state.settings,
        selectedCategoryIds: state.selectedCategoryIds,
        customCategories: state.customCategories,
        scores: state.scores,
        recentWords: state.recentWords,
        roundsPlayed: state.roundsPlayed,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          ...saved,
          settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        };
      },
    },
  ),
);

/** True once saved players, settings and categories have been loaded from disk. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGame.persist.onFinishHydration(onChange),
    () => useGame.persist.hasHydrated(),
    () => false,
  );
}

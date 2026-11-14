import type { ReactNode } from 'react';

import type { Round } from '@/game/types';

export type PhaseProps = {
  round: Round;
  /** Shared top bar (round number, phase name, quit button). */
  topBar: ReactNode;
  /** Leave the game and go back to the lobby. */
  onExit: () => void;
};

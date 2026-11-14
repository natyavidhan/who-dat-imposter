import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { IconButton } from '@/components/Button';
import { ConfirmDialog } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { DiscussPhase } from '@/features/game/DiscussPhase';
import { ResultPhase } from '@/features/game/ResultPhase';
import { RevealPhase } from '@/features/game/RevealPhase';
import type { PhaseProps } from '@/features/game/types';
import { VotePhase } from '@/features/game/VotePhase';
import type { Phase } from '@/game/types';
import { useScreenAwake } from '@/lib/useScreenAwake';
import { useGame } from '@/store';
import { colors, radius, space } from '@/theme';

const PHASE_LABEL: Record<Phase, string> = {
  reveal: 'Secret roles',
  discuss: 'Clue time',
  vote: 'The vote',
  result: 'The verdict',
};

export default function GameScreen() {
  const router = useRouter();
  const round = useGame((s) => s.round);
  const [confirmQuit, setConfirmQuit] = useState(false);
  useScreenAwake();

  const settled = round?.outcome != null;

  const exit = useCallback(() => {
    setConfirmQuit(false);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const requestExit = useCallback(() => {
    if (settled) exit();
    else setConfirmQuit(true);
  }, [settled, exit]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        requestExit();
        return true;
      });
      return () => subscription.remove();
    }, [requestExit]),
  );

  if (!round) return <Redirect href="/" />;

  const topBar = (
    <View style={styles.topBar}>
      <View style={styles.roundPill}>
        <Txt variant="label">Round {round.number}</Txt>
      </View>
      <Txt variant="smallStrong" color={colors.inkSoft} style={styles.flex}>
        {PHASE_LABEL[round.phase]}
      </Txt>
      <IconButton
        icon="close"
        size={40}
        label={settled ? 'Back to lobby' : 'End round'}
        onPress={requestExit}
      />
    </View>
  );

  const props: PhaseProps = { round, topBar, onExit: exit };

  return (
    <View style={styles.flex}>
      <Animated.View
        key={`${round.id}-${round.phase}`}
        entering={FadeIn.duration(240)}
        style={styles.flex}>
        {round.phase === 'reveal' ? <RevealPhase {...props} /> : null}
        {round.phase === 'discuss' ? <DiscussPhase {...props} /> : null}
        {round.phase === 'vote' ? <VotePhase {...props} /> : null}
        {round.phase === 'result' ? <ResultPhase {...props} /> : null}
      </Animated.View>

      <ConfirmDialog
        visible={confirmQuit}
        emoji="🚪"
        title="End this round?"
        message="Nobody scores, and the secret word stays secret."
        confirmLabel="End round"
        destructive
        onCancel={() => setConfirmQuit(false)}
        onConfirm={exit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
  },
  roundPill: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});

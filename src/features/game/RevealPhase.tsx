import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { fitVariant, Txt } from '@/components/Txt';
import { isImposter } from '@/game/engine';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, space } from '@/theme';

import { RoleCard } from './RoleCard';
import type { PhaseProps } from './types';

export function RevealPhase({ round, topBar }: PhaseProps) {
  const nextReveal = useGame((s) => s.nextReveal);
  const [revealed, setRevealed] = useState(false);
  const player = round.players[round.revealIndex];
  const next = round.players[round.revealIndex + 1];

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    if (isImposter(round, player.id)) haptic.warning();
    else haptic.tap();
  };

  const pass = () => {
    setRevealed(false);
    haptic.tick();
    nextReveal();
  };

  return (
    <Screen
      header={topBar}
      scroll={false}
      footer={
        revealed ? (
          <Button
            size="lg"
            variant="dark"
            icon="eye-off"
            label={next ? `Hide & pass to ${next.name}` : 'Hide & start the clues'}
            onPress={pass}
          />
        ) : (
          <Button
            size="lg"
            variant="violet"
            icon="finger-print"
            label={`I'm ${player.name}, show me`}
            onPress={reveal}
          />
        )
      }>
      <View style={styles.head}>
        <ProgressDots total={round.players.length} index={round.revealIndex} />
        <Txt variant="label" align="center" color={colors.inkSoft}>
          {round.revealIndex === 0 ? 'Hand the phone to' : 'Pass the phone to'}
        </Txt>
        <Animated.View key={player.id} entering={FadeInDown.duration(260)}>
          <Txt
            variant={fitVariant(player.name, ['display', 'display', 'h1'])}
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit>
            {player.name}
          </Txt>
        </Animated.View>
      </View>
      <RoleCard
        key={player.id}
        round={round}
        playerId={player.id}
        revealed={revealed}
        onReveal={reveal}
      />
    </Screen>
  );
}

function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={`Player ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotCurrent]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: space.xs,
    paddingTop: space.xs,
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: space.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.card,
  },
  dotDone: {
    backgroundColor: colors.ink,
  },
  dotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.lime,
  },
});

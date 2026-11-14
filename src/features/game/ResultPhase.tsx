import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { fitVariant, Txt } from '@/components/Txt';
import { isImposter, judgeAccusation, playerName } from '@/game/engine';
import type { Outcome, OutcomeReason, Round, Winner } from '@/game/types';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, radius, space } from '@/theme';

import type { PhaseProps } from './types';

type Stage = 'verdict' | 'guess' | 'final';

const STAMP_DELAY = 650;
const STAMP_GAP = 650;

export function ResultPhase({ round, topBar, onExit }: PhaseProps) {
  const [stage, setStage] = useState<Stage>(round.accusedIds.length > 0 ? 'verdict' : 'final');

  if (stage === 'verdict') {
    return (
      <Verdict
        round={round}
        topBar={topBar}
        onContinue={() => setStage(round.awaitingGuess ? 'guess' : 'final')}
      />
    );
  }
  if (stage === 'guess' && round.awaitingGuess) {
    return <LastChance round={round} topBar={topBar} onDone={() => setStage('final')} />;
  }
  return <FinalResult round={round} topBar={topBar} onExit={onExit} />;
}

function Verdict({ round, topBar, onContinue }: { round: Round; topBar: PhaseProps['topBar']; onContinue: () => void }) {
  const accused = round.accusedIds;
  const { allCaught, caught } = judgeAccusation(round, accused);
  const summaryDelay = STAMP_DELAY + accused.length * STAMP_GAP;

  useEffect(() => {
    const timers = accused.map((id, i) =>
      setTimeout(
        () => (isImposter(round, id) ? haptic.success() : haptic.error()),
        STAMP_DELAY + i * STAMP_GAP,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [accused, round]);

  let summary: string;
  if (round.chaos) summary = '🤡 Plot twist! EVERYONE was the imposter.';
  else if (allCaught)
    summary = round.awaitingGuess
      ? 'Busted! But wait, they get one last shot…'
      : round.imposterIds.length > 1
        ? 'Every imposter caught!'
        : 'Imposter caught!';
  else if (caught.length > 0) summary = 'So close! An imposter slipped through.';
  else summary = accused.length > 1 ? 'Wrong! Those two are innocent.' : 'Wrong! Totally innocent.';

  return (
    <Screen
      header={topBar}
      footer={
        <Button
          size="lg"
          iconRight="arrow-forward"
          label={round.awaitingGuess ? "Imposter's last chance" : 'See the results'}
          onPress={onContinue}
        />
      }>
      <View style={styles.stack}>
        <Txt variant="h1">{accused.length > 1 ? 'The accused are…' : 'The accused is…'}</Txt>
        {accused.map((id, i) => {
          const guilty = isImposter(round, id);
          return (
            <Pop key={id} radius={radius.lg} contentStyle={styles.accusedRow}>
              <Avatar id={id} name={playerName(round, id)} size={48} />
              <Txt
                variant={playerName(round, id).length > 10 ? 'h3' : 'h2'}
                numberOfLines={2}
                style={styles.flex}>
                {playerName(round, id)}
              </Txt>
              <Animated.View entering={ZoomIn.delay(STAMP_DELAY + i * STAMP_GAP).springify()}>
                <View style={[styles.stamp, { backgroundColor: guilty ? colors.coral : colors.mint }]}>
                  <Txt variant="label">{guilty ? 'Imposter' : 'Innocent'}</Txt>
                </View>
              </Animated.View>
            </Pop>
          );
        })}
        <Animated.View entering={FadeInDown.delay(summaryDelay).duration(320)}>
          <Pop
            color={round.chaos ? colors.violet : allCaught ? colors.lime : colors.coral}
            radius={radius.lg}
            contentStyle={styles.summary}>
            <Txt variant="h2" align="center">
              {summary}
            </Txt>
          </Pop>
        </Animated.View>
      </View>
    </Screen>
  );
}

function LastChance({ round, topBar, onDone }: { round: Round; topBar: PhaseProps['topBar']; onDone: () => void }) {
  const resolveGuess = useGame((s) => s.resolveGuess);
  const names = round.imposterIds.map((id) => playerName(round, id));
  const plural = names.length > 1;

  const decide = (guessedRight: boolean) => {
    if (guessedRight) haptic.warning();
    else haptic.success();
    resolveGuess(guessedRight);
    onDone();
  };

  return (
    <Screen
      header={topBar}
      footer={
        <View style={styles.row}>
          <Button label="Wrong 🎉" variant="primary" size="lg" onPress={() => decide(false)} style={styles.flex} />
          <Button label="Nailed it 😈" variant="danger" size="lg" onPress={() => decide(true)} style={styles.flex} />
        </View>
      }>
      <View style={[styles.stack, styles.center]}>
        <Mascot size={120} mood="shocked" badge />
        <Txt variant="display" align="center">
          Last chance!
        </Txt>
        <Txt variant="h3" align="center">
          {names.join(' & ')}, {plural ? 'you have' : 'you’ve'} been caught, but you can still steal
          the win.
        </Txt>
        <Pop color={colors.sun} radius={radius.lg} contentStyle={styles.summary}>
          <Txt variant="h2" align="center">
            Guess the secret word out loud!
          </Txt>
          <Txt variant="body" align="center">
            Everyone else: did {plural ? 'they' : names[0]} get it right?
          </Txt>
        </Pop>
      </View>
    </Screen>
  );
}

const BANNER: Record<Winner, { color: string; emoji: string }> = {
  crew: { color: colors.lime, emoji: '🎉' },
  imposters: { color: colors.coral, emoji: '😈' },
  chaos: { color: colors.violet, emoji: '🤡' },
  none: { color: colors.sun, emoji: '🔍' },
};

function bannerTitle(winner: Winner, imposterCount: number): string {
  switch (winner) {
    case 'crew':
      return 'Crew wins!';
    case 'imposters':
      return imposterCount > 1 ? 'Imposters win!' : 'Imposter wins!';
    case 'chaos':
      return 'Chaos round!';
    case 'none':
      return 'Round over';
  }
}

function reasonText(reason: OutcomeReason, imposterCount: number): string {
  const many = imposterCount > 1;
  switch (reason) {
    case 'caught':
      return many ? 'Every imposter was caught red-handed.' : 'The imposter was caught red-handed.';
    case 'escaped':
      return many ? 'At least one imposter slipped away.' : 'The imposter slipped away unnoticed.';
    case 'stole':
      return 'Caught, but they named the word and stole the win!';
    case 'chaos':
      return 'Everyone was the imposter, so nobody knew the word!';
    case 'skipped':
      return 'No vote this time, so no points.';
  }
}

function FinalResult({ round, topBar, onExit }: { round: Round; topBar: PhaseProps['topBar']; onExit: () => void }) {
  const router = useRouter();
  const startRound = useGame((s) => s.startRound);
  const outcome: Outcome = round.outcome ?? { winner: 'none', reason: 'skipped', points: {} };
  const banner = BANNER[outcome.winner];
  const imposters = round.players.filter((p) => isImposter(round, p.id));
  const scorers = round.players.filter((p) => (outcome.points[p.id] ?? 0) > 0);

  useEffect(() => {
    if (outcome.winner === 'crew') haptic.success();
    else if (outcome.winner === 'imposters') haptic.warning();
  }, [outcome.winner]);

  const nextRound = () => {
    const result = startRound();
    if (result.ok) haptic.thump();
    else onExit();
  };

  return (
    <Screen
      header={topBar}
      footer={
        <View style={styles.footer}>
          <Button size="lg" icon="refresh" label="Next round" onPress={nextRound} />
          <View style={styles.row}>
            <Button
              variant="plain"
              icon="trophy"
              label="Scores"
              onPress={() => router.push('/scores')}
              style={styles.flex}
            />
            <Button variant="plain" icon="home" label="Lobby" onPress={onExit} style={styles.flex} />
          </View>
        </View>
      }>
      <View style={styles.stack}>
        <Animated.View entering={ZoomIn.springify()}>
          <Pop color={banner.color} radius={radius.xl} lift={7} contentStyle={styles.banner}>
            <Txt style={styles.bannerEmoji}>{banner.emoji}</Txt>
            <Txt variant="h1" align="center" style={styles.bannerTitle}>
              {bannerTitle(outcome.winner, round.imposterIds.length)}
            </Txt>
            <Txt variant="bodyStrong" align="center">
              {reasonText(outcome.reason, round.imposterIds.length)}
            </Txt>
          </Pop>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Pop radius={radius.lg} contentStyle={styles.wordCard}>
            <Txt variant="label">{round.chaos ? 'The word nobody got' : 'The secret word was'}</Txt>
            <Txt
              variant={fitVariant(round.word, ['display', 'display', 'h1'])}
              align="center"
              numberOfLines={3}
              adjustsFontSizeToFit>
              {round.word}
            </Txt>
            <View style={styles.chip}>
              <Txt variant="smallStrong">
                {round.categoryEmoji} {round.categoryName}
              </Txt>
            </View>
          </Pop>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(300)}>
          <Pop radius={radius.lg} contentStyle={styles.listCard}>
            <Txt variant="label">
              {round.chaos ? 'The imposters' : imposters.length > 1 ? 'The imposters' : 'The imposter'}
            </Txt>
            {round.chaos ? (
              <Txt variant="h3">Literally everybody 🤡</Txt>
            ) : (
              imposters.map((player) => (
                <View key={player.id} style={styles.personRow}>
                  <Avatar id={player.id} name={player.name} size={36} />
                  <Txt variant="h3">{player.name}</Txt>
                </View>
              ))
            )}
          </Pop>
        </Animated.View>

        {scorers.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(500).duration(300)}>
            <Pop color={colors.bgDeep} lift={0} radius={radius.lg} contentStyle={styles.listCard}>
              <Txt variant="label">Points this round</Txt>
              <View style={styles.pointChips}>
                {scorers.map((player) => (
                  <View key={player.id} style={styles.pointChip}>
                    <Txt variant="smallStrong">+{outcome.points[player.id]}</Txt>
                    <Txt variant="smallStrong" color={colors.inkSoft}>
                      {player.name}
                    </Txt>
                  </View>
                ))}
              </View>
            </Pop>
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  stack: {
    gap: space.lg,
  },
  center: {
    alignItems: 'center',
    paddingTop: space.lg,
  },
  footer: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  accusedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md + 2,
  },
  stamp: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    transform: [{ rotate: '-6deg' }],
  },
  summary: {
    padding: space.lg,
    gap: space.sm,
  },
  banner: {
    alignItems: 'center',
    padding: space.xl,
    gap: space.xs,
  },
  bannerTitle: {
    fontSize: 36,
    lineHeight: 40,
  },
  bannerEmoji: {
    fontSize: 44,
    lineHeight: 54,
  },
  wordCard: {
    alignItems: 'center',
    padding: space.lg,
    gap: space.sm,
  },
  chip: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  listCard: {
    padding: space.lg,
    gap: space.sm + 2,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  pointChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pointChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

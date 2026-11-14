import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { CREW_POINTS, IMPOSTER_POINTS } from '@/game/engine';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, radius, space } from '@/theme';

export default function ScoresScreen() {
  const router = useRouter();
  const players = useGame((s) => s.players);
  const scores = useGame((s) => s.scores);
  const roundsPlayed = useGame((s) => s.roundsPlayed);
  const resetScores = useGame((s) => s.resetScores);
  const [confirmReset, setConfirmReset] = useState(false);

  const scoreOf = (id: string) => scores[id] ?? 0;
  const ranked = [...players].sort((a, b) => scoreOf(b.id) - scoreOf(a.id));
  const best = ranked.length > 0 ? scoreOf(ranked[0].id) : 0;
  const anyPoints = best > 0;

  return (
    <Screen
      title="Scoreboard"
      onBack={() => router.back()}
      right={
        <IconButton
          icon="refresh"
          label="Reset scores"
          disabled={!anyPoints && roundsPlayed === 0}
          onPress={() => setConfirmReset(true)}
        />
      }>
      <View style={styles.stack}>
        <Txt variant="bodyStrong" color={colors.inkSoft}>
          {roundsPlayed === 0
            ? 'No rounds played yet.'
            : `${roundsPlayed} round${roundsPlayed === 1 ? '' : 's'} played`}
        </Txt>

        {!anyPoints ? (
          <Pop radius={radius.lg} contentStyle={styles.empty}>
            <Mascot size={84} mood="shocked" />
            <Txt variant="h2" align="center">
              Nobody&apos;s on the board yet
            </Txt>
            <Txt variant="body" align="center" color={colors.inkSoft}>
              Points show up here after every vote.
            </Txt>
          </Pop>
        ) : null}

        {ranked.map((player, index) => {
          const score = scoreOf(player.id);
          const leader = anyPoints && score === best;
          return (
            <Pop
              key={player.id}
              radius={radius.md}
              lift={leader ? 5 : 3}
              color={leader ? colors.sun : colors.card}
              contentStyle={styles.row}>
              <Txt variant="h3" style={styles.rank}>
                {leader ? '👑' : `${index + 1}`}
              </Txt>
              <Avatar id={player.id} name={player.name} size={40} />
              <Txt variant="h3" numberOfLines={1} style={styles.name}>
                {player.name}
              </Txt>
              <Txt variant="h1">{score}</Txt>
              <Txt variant="smallStrong" color={colors.inkSoft}>
                pts
              </Txt>
            </Pop>
          );
        })}

        <Pop color={colors.bgDeep} lift={0} radius={radius.md} contentStyle={styles.rules}>
          <Txt variant="label">How points work</Txt>
          <Txt variant="small">
            🎉 Crew catches every imposter: +{CREW_POINTS} for each crew member.
          </Txt>
          <Txt variant="small">
            😈 Imposter escapes, or gets caught but names the word: +{IMPOSTER_POINTS} for each
            imposter.
          </Txt>
          <Txt variant="small">🤡 Chaos rounds and skipped votes score nothing.</Txt>
        </Pop>
      </View>

      <ConfirmDialog
        visible={confirmReset}
        emoji="🧽"
        title="Wipe the scoreboard?"
        message="Everyone goes back to zero. Players and categories stay."
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          haptic.warning();
          resetScores();
          setConfirmReset(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.md,
  },
  empty: {
    alignItems: 'center',
    padding: space.xl,
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rank: {
    width: 30,
    textAlign: 'center',
  },
  name: {
    flex: 1,
  },
  rules: {
    padding: space.lg,
    gap: space.sm,
    marginTop: space.sm,
  },
});

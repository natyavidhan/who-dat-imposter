import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { CREW_POINTS, IMPOSTER_POINTS, MAX_PLAYERS, MIN_PLAYERS } from '@/game/engine';
import { colors, radius, space } from '@/theme';

const STEPS = [
  {
    color: colors.sky,
    title: 'Gather the suspects',
    body: `Add ${MIN_PLAYERS} to ${MAX_PLAYERS} players, pick some categories and decide how many imposters are hiding among you.`,
  },
  {
    color: colors.violet,
    title: 'Pass the phone',
    body: 'Each player taps the card in secret. Everyone sees the same secret word, except the imposter, who only finds out they are the imposter.',
  },
  {
    color: colors.sun,
    title: 'One word each',
    body: 'Starting with the chosen player, go around the circle and say ONE word linked to the secret word. Too obvious and the imposter catches on. Too vague and you look suspicious.',
  },
  {
    color: colors.coral,
    title: 'Point fingers',
    body: 'Go around as many times as you like, argue it out, then vote. Pick your suspect on the phone and watch the verdict.',
  },
  {
    color: colors.lime,
    title: 'Last chance',
    body: 'A caught imposter can still steal the win by guessing the secret word out loud. You can turn this off in the house rules.',
  },
];

const EXTRAS = [
  ['🔎 Imposter hint', 'Give the imposter the category or a vague clue word. Clue words are perfect for younger players.'],
  ['⏱️ Timer', 'Put a countdown on the discussion. You can pause it or add 30 seconds.'],
  ['🤡 Chaos rounds', 'Every so often, everyone is secretly the imposter. Watch the whole table bluff at once.'],
  ['✍️ Custom categories', 'Make your own word lists for inside jokes, school subjects or your favorite shows.'],
];

export default function HowToPlayScreen() {
  const router = useRouter();
  return (
    <Screen
      title="How to play"
      onBack={() => router.back()}
      backIcon="close"
      footer={<Button size="lg" label="Got it, let's play" icon="play" onPress={() => router.back()} />}>
      <View style={styles.stack}>
        <View style={styles.hero}>
          <Mascot size={92} badge />
          <Txt variant="h2" style={styles.heroText}>
            Everyone knows the word, except the imposter. Find them before they figure it out.
          </Txt>
        </View>

        {STEPS.map((step, index) => (
          <Pop key={step.title} color={step.color} radius={radius.lg} contentStyle={styles.step}>
            <View style={styles.stepNumber}>
              <Txt variant="h3" color={colors.white}>
                {index + 1}
              </Txt>
            </View>
            <View style={styles.stepText}>
              <Txt variant="h3">{step.title}</Txt>
              <Txt variant="body">{step.body}</Txt>
            </View>
          </Pop>
        ))}

        <Pop radius={radius.lg} contentStyle={styles.scoring}>
          <Txt variant="label">Scoring</Txt>
          <Txt variant="body">
            🎉 The crew catches every imposter: <Txt variant="bodyStrong">+{CREW_POINTS}</Txt> each
            for the crew.
          </Txt>
          <Txt variant="body">
            😈 An imposter escapes or steals the win: <Txt variant="bodyStrong">+{IMPOSTER_POINTS}</Txt>{' '}
            each for the imposters.
          </Txt>
        </Pop>

        <View style={styles.extras}>
          <Txt variant="h2">Spice it up</Txt>
          {EXTRAS.map(([title, body]) => (
            <View key={title} style={styles.extra}>
              <Txt variant="bodyStrong">{title}</Txt>
              <Txt variant="small" color={colors.inkSoft}>
                {body}
              </Txt>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.md + 2,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    marginBottom: space.sm,
  },
  heroText: {
    flex: 1,
  },
  step: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    gap: 4,
  },
  scoring: {
    padding: space.lg,
    gap: space.sm,
  },
  extras: {
    gap: space.md,
    marginTop: space.sm,
  },
  extra: {
    gap: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.ink,
    paddingLeft: space.md,
  },
});

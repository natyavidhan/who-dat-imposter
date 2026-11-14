import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { OptionRow, Segmented, Stepper, Toggle } from '@/components/Controls';
import { Mascot } from '@/components/Mascot';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { effectiveImposters, maxImposters, MIN_PLAYERS } from '@/game/engine';
import type { HintMode } from '@/game/types';
import { haptic } from '@/lib/haptics';
import { allCategories, useGame } from '@/store';
import { colors, radius, space } from '@/theme';

const HINT_OPTIONS: { value: HintMode; label: string }[] = [
  { value: 'off', label: 'None' },
  { value: 'category', label: 'Category' },
  { value: 'clue', label: 'Clue word' },
];

const HINT_COPY: Record<HintMode, string> = {
  off: 'The imposter gets nothing. Pure bluffing!',
  category: "The imposter sees the word's category.",
  clue: 'The imposter gets a vague clue word. Great for kids.',
};

const TIMER_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
];

const MAX_AVATARS = 7;

export default function LobbyScreen() {
  const router = useRouter();
  const players = useGame((s) => s.players);
  const settings = useGame((s) => s.settings);
  const selectedIds = useGame((s) => s.selectedCategoryIds);
  const customCategories = useGame((s) => s.customCategories);
  const updateSettings = useGame((s) => s.updateSettings);
  const startRound = useGame((s) => s.startRound);
  const [error, setError] = useState<string | null>(null);

  const selected = allCategories(customCategories).filter((c) => selectedIds.includes(c.id));
  const wordCount = selected.reduce((sum, c) => sum + c.words.length, 0);
  const imposters = effectiveImposters(settings.imposterCount, players.length);
  const imposterCap = maxImposters(players.length);
  const missingPlayers = MIN_PLAYERS - players.length;

  const blocker =
    missingPlayers > 0
      ? `Add ${missingPlayers} more player${missingPlayers === 1 ? '' : 's'} to start`
      : wordCount === 0
        ? 'Pick at least one category to start'
        : null;

  const start = () => {
    const result = startRound();
    if (!result.ok) {
      setError(result.reason);
      haptic.error();
      return;
    }
    setError(null);
    haptic.thump();
    router.push('/game');
  };

  return (
    <Screen
      header={
        <View style={styles.brandRow}>
          <Mascot size={54} badge />
          <View style={styles.brandText}>
            <Txt variant="h1" style={styles.wordmark}>
              Who Dat
            </Txt>
            <Txt variant="h1" style={styles.wordmark}>
              Imposter<Txt variant="h1" color={colors.coral} style={styles.wordmark}>?</Txt>
            </Txt>
          </View>
          <IconButton icon="help" label="How to play" onPress={() => router.push('/how-to-play')} />
          <IconButton
            icon="trophy"
            label="Scoreboard"
            color={colors.sun}
            onPress={() => router.push('/scores')}
          />
        </View>
      }
      footer={
        <View style={styles.footer}>
          {blocker || error ? (
            <Txt variant="smallStrong" align="center" color={colors.inkSoft}>
              {blocker ?? error}
            </Txt>
          ) : null}
          <Button
            size="lg"
            label="Start round"
            icon="play"
            disabled={!!blocker}
            onPress={start}
            testID="start-round"
          />
        </View>
      }>
      <View style={styles.stack}>
        <Pop
          color={colors.sky}
          radius={radius.lg}
          onPress={() => router.push('/players')}
          accessibilityLabel={`Players: ${players.length}. Edit players`}
          contentStyle={styles.card}>
          <View style={styles.cardHead}>
            <Txt variant="label">Players</Txt>
            <Ionicons name="chevron-forward" size={22} color={colors.ink} />
          </View>
          <View style={styles.cardBody}>
            <Txt variant="display">{players.length}</Txt>
            <View style={styles.avatarStack}>
              {players.slice(0, MAX_AVATARS).map((player, i) => (
                <Avatar
                  key={player.id}
                  id={player.id}
                  name={player.name}
                  size={36}
                  style={i > 0 ? styles.avatarOverlap : undefined}
                />
              ))}
              {players.length > MAX_AVATARS ? (
                <View style={[styles.moreBubble, styles.avatarOverlap]}>
                  <Txt variant="smallStrong">+{players.length - MAX_AVATARS}</Txt>
                </View>
              ) : null}
            </View>
          </View>
          <Txt variant="small" color={colors.inkSoft} numberOfLines={1}>
            {players.length > 0 ? players.map((p) => p.name).join(' · ') : 'Tap to add players'}
          </Txt>
        </Pop>

        <Pop
          color={colors.sun}
          radius={radius.lg}
          onPress={() => router.push('/categories')}
          accessibilityLabel={`Categories: ${selected.length} picked. Edit categories`}
          contentStyle={styles.card}>
          <View style={styles.cardHead}>
            <Txt variant="label">Categories</Txt>
            <Ionicons name="chevron-forward" size={22} color={colors.ink} />
          </View>
          <View style={styles.cardBody}>
            <Txt variant="display">{selected.length}</Txt>
            <Txt variant="bodyStrong" color={colors.inkSoft} style={styles.flex}>
              picked · {wordCount} words in the mix
            </Txt>
          </View>
          <View style={styles.emojiRow}>
            {selected.slice(0, 9).map((c) => (
              <View key={c.id} style={styles.emojiBubble}>
                <Txt style={styles.emoji}>{c.emoji}</Txt>
              </View>
            ))}
            {selected.length === 0 ? (
              <Txt variant="small" color={colors.inkSoft}>
                Tap to choose what the secret words are about
              </Txt>
            ) : null}
          </View>
        </Pop>

        <Pop radius={radius.lg} contentStyle={styles.rules}>
          <Txt variant="label" style={styles.rulesLabel}>
            House rules
          </Txt>
          <OptionRow
            title="Imposters"
            description={
              imposterCap === 1
                ? 'Add 5+ players to allow more'
                : `Up to ${imposterCap} with ${players.length} players`
            }
            control={
              <Stepper
                label="imposters"
                value={imposters}
                min={1}
                max={imposterCap}
                onChange={(value) => updateSettings({ imposterCount: value })}
              />
            }
          />
          <OptionRow
            stacked
            title="Imposter hint"
            description={HINT_COPY[settings.hintMode]}
            control={
              <Segmented
                options={HINT_OPTIONS}
                value={settings.hintMode}
                onChange={(hintMode) => updateSettings({ hintMode })}
              />
            }
          />
          <OptionRow
            stacked
            title="Discussion timer"
            description="Counts down while everyone argues."
            control={
              <Segmented
                options={TIMER_OPTIONS}
                value={settings.timerSeconds}
                accent={colors.sky}
                onChange={(timerSeconds) => updateSettings({ timerSeconds })}
              />
            }
          />
          <OptionRow
            title="Chaos rounds 🤡"
            description="Every so often, everyone secretly gets the imposter card."
            control={
              <Toggle
                label="Chaos rounds"
                value={settings.chaosMode}
                onChange={(chaosMode) => updateSettings({ chaosMode })}
              />
            }
          />
          <OptionRow
            title="Last-chance guess"
            description="A caught imposter can steal the win by naming the word."
            control={
              <Toggle
                label="Last-chance guess"
                value={settings.lastChance}
                onChange={(lastChance) => updateSettings({ lastChance })}
              />
            }
          />
          <OptionRow
            last
            title="Vibration"
            control={
              <Toggle
                label="Vibration"
                value={settings.haptics}
                onChange={(haptics) => updateSettings({ haptics })}
              />
            }
          />
        </Pop>

        <Txt variant="small" align="center" color={colors.muted}>
          Every category and mode is free.
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  brandText: {
    flex: 1,
  },
  wordmark: {
    fontSize: 27,
    lineHeight: 29,
  },
  footer: {
    gap: space.sm,
  },
  stack: {
    gap: space.md + 2,
    paddingTop: space.xs,
  },
  card: {
    padding: space.lg,
    gap: space.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  moreBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emojiBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  rules: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xs,
  },
  rulesLabel: {
    marginBottom: space.xs,
  },
});

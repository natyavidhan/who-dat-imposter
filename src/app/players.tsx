import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS } from '@/game/engine';
import type { Player } from '@/game/types';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, fonts, radius, space } from '@/theme';

export default function PlayersScreen() {
  const router = useRouter();
  const players = useGame((s) => s.players);
  const addPlayer = useGame((s) => s.addPlayer);
  const [draft, setDraft] = useState('');
  const full = players.length >= MAX_PLAYERS;

  const submit = () => {
    if (full) return;
    addPlayer(draft);
    setDraft('');
    haptic.tap();
  };

  return (
    <Screen
      title="Players"
      onBack={() => router.back()}
      right={
        <View style={styles.counter}>
          <Txt variant="smallStrong">
            {players.length}/{MAX_PLAYERS}
          </Txt>
        </View>
      }
      footer={
        <View style={styles.footer}>
          {players.length < MIN_PLAYERS ? (
            <Txt variant="smallStrong" align="center" color={colors.inkSoft}>
              You need at least {MIN_PLAYERS} players
            </Txt>
          ) : null}
          <Button size="lg" label="Done" icon="checkmark" onPress={() => router.back()} />
        </View>
      }>
      <View style={styles.stack}>
        <Pop radius={radius.lg} contentStyle={styles.addRow} disabled={full}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            submitBehavior="submit"
            returnKeyType="done"
            placeholder={full ? 'The table is full!' : 'Type a name…'}
            placeholderTextColor={colors.muted}
            maxLength={MAX_NAME_LENGTH}
            editable={!full}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="New player name"
          />
          <Button
            size="sm"
            label="Add"
            icon="person-add"
            disabled={full}
            onPress={submit}
          />
        </Pop>

        <Txt variant="small" color={colors.muted}>
          The phone gets passed in this order, so list people the way you’re sitting. Tap a name
          to rename it, or tap Add with no name for a quick placeholder.
        </Txt>

        {players.map((player, index) => (
          <Animated.View
            key={player.id}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition.duration(200)}>
            <PlayerRow player={player} index={index} total={players.length} />
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

function PlayerRow({ player, index, total }: { player: Player; index: number; total: number }) {
  const renamePlayer = useGame((s) => s.renamePlayer);
  const removePlayer = useGame((s) => s.removePlayer);
  const movePlayer = useGame((s) => s.movePlayer);

  return (
    <Pop radius={radius.md} lift={4} contentStyle={styles.row}>
      <Avatar id={player.id} name={player.name} size={38} />
      <TextInput
        key={player.name}
        defaultValue={player.name}
        onEndEditing={(e) => renamePlayer(player.id, e.nativeEvent.text)}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        style={styles.nameInput}
        accessibilityLabel={`Player ${index + 1} name`}
      />
      <View style={styles.rowButtons}>
        <IconButton
          icon="chevron-up"
          size={32}
          label={`Move ${player.name} up`}
          disabled={index === 0}
          onPress={() => movePlayer(player.id, -1)}
        />
        <IconButton
          icon="chevron-down"
          size={32}
          label={`Move ${player.name} down`}
          disabled={index === total - 1}
          onPress={() => movePlayer(player.id, 1)}
        />
        <IconButton
          icon="close"
          size={32}
          color={colors.coral}
          label={`Remove ${player.name}`}
          onPress={() => {
            haptic.tap();
            removePlayer(player.id);
          }}
        />
      </View>
    </Pop>
  );
}

const styles = StyleSheet.create({
  counter: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.card,
  },
  footer: {
    gap: space.sm,
  },
  stack: {
    gap: space.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.lg,
    paddingRight: space.sm,
    paddingVertical: space.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    paddingLeft: space.md,
    paddingRight: space.sm,
    paddingVertical: space.sm,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.ink,
  },
  rowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});

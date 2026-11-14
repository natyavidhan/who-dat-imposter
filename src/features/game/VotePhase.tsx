import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { playerName, requiredAccusations } from '@/game/engine';
import type { Player } from '@/game/types';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, radius, space } from '@/theme';

import type { PhaseProps } from './types';

export function VotePhase({ round, topBar }: PhaseProps) {
  const accuse = useGame((s) => s.accuse);
  const need = requiredAccusations(round);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const ready = picked.length === need;

  const toggle = (id: string) => {
    haptic.tick();
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (need === 1) return [id];
      return current.length < need ? [...current, id] : current;
    });
  };

  const names = picked.map((id) => playerName(round, id));
  const label = ready
    ? `Accuse ${names.join(' & ')}!`
    : need === 1
      ? 'Pick a suspect'
      : `Pick ${need - picked.length} more suspect${need - picked.length === 1 ? '' : 's'}`;

  return (
    <Screen
      header={topBar}
      footer={
        <View style={styles.footer}>
          <Button
            size="lg"
            variant="danger"
            icon="skull"
            label={label}
            disabled={!ready}
            onPress={() => {
              haptic.thump();
              accuse(picked);
            }}
          />
          <Pressable
            onPress={() => setConfirmSkip(true)}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.skip}>
            <Txt variant="smallStrong" color={colors.inkSoft} style={styles.underline}>
              Skip the vote and just reveal
            </Txt>
          </Pressable>
        </View>
      }>
      <View style={styles.stack}>
        <Txt variant="h1">{need === 1 ? "Who's the imposter?" : `Find the ${need} imposters`}</Txt>
        <Txt variant="body" color={colors.inkSoft}>
          Argue it out, then agree on {need === 1 ? 'one suspect' : `${need} suspects`} and tap{' '}
          {need === 1 ? 'them' : 'each one'}.
        </Txt>
        <View style={styles.grid}>
          {round.players.map((player) => (
            <SuspectTile
              key={player.id}
              player={player}
              selected={picked.includes(player.id)}
              onPress={() => toggle(player.id)}
            />
          ))}
        </View>
      </View>

      <ConfirmDialog
        visible={confirmSkip}
        emoji="🙈"
        title="Reveal without a vote?"
        message="Nobody scores this round. The imposter and the word are shown right away."
        confirmLabel="Reveal"
        onCancel={() => setConfirmSkip(false)}
        onConfirm={() => {
          setConfirmSkip(false);
          accuse([]);
        }}
      />
    </Screen>
  );
}

function SuspectTile({ player, selected, onPress }: { player: Player; selected: boolean; onPress: () => void }) {
  return (
    <Pop
      radius={20}
      lift={selected ? 6 : 3}
      color={selected ? colors.coral : colors.card}
      onPress={onPress}
      style={styles.tile}
      contentStyle={styles.tileFace}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Accuse ${player.name}`}>
      <Avatar id={player.id} name={player.name} size={52} />
      <Txt variant="h3" align="center" numberOfLines={1} adjustsFontSizeToFit>
        {player.name}
      </Txt>
      <View style={[styles.badge, selected && styles.badgeOn]}>
        <Ionicons name={selected ? 'locate' : 'help'} size={13} color={selected ? colors.white : colors.ink} />
        <Txt variant="label" color={selected ? colors.white : colors.ink}>
          {selected ? 'Suspect' : 'Innocent?'}
        </Txt>
      </View>
    </Pop>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: space.sm,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  stack: {
    gap: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.md,
    marginTop: space.sm,
  },
  tile: {
    width: '48.5%',
  },
  tileFace: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: colors.bg,
  },
  badgeOn: {
    backgroundColor: colors.ink,
  },
});

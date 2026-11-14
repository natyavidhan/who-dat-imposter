import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { Dialog } from '@/components/Sheet';
import { fitVariant, Txt } from '@/components/Txt';
import { playerName, speakingOrder } from '@/game/engine';
import type { Round } from '@/game/types';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, radius, space } from '@/theme';

import { RoleFace, roleColor } from './RoleCard';
import type { PhaseProps } from './types';
import { formatClock, useCountdown } from './useCountdown';

const TIPS = [
  'Say ONE word that links to the secret word.',
  'Too obvious? The imposter works it out.',
  'Too vague? Everyone starts staring at you.',
  'Go around as many times as you like.',
];

export function DiscussPhase({ round, topBar }: PhaseProps) {
  const setPhase = useGame((s) => s.setPhase);
  const [peekOpen, setPeekOpen] = useState(false);
  const order = speakingOrder(round);
  const starter = order[0];

  return (
    <Screen
      header={topBar}
      footer={
        <Button
          size="lg"
          variant="danger"
          icon="hand-left"
          label="Time to vote"
          onPress={() => {
            haptic.thump();
            setPhase('vote');
          }}
        />
      }>
      <View style={styles.stack}>
        <Pop color={colors.sun} radius={radius.lg} contentStyle={styles.starter}>
          <Txt variant="label">First clue goes to</Txt>
          <View style={styles.starterRow}>
            <Avatar id={starter.id} name={starter.name} size={52} />
            <Txt
              variant={fitVariant(starter.name, ['display', 'h1', 'h1'])}
              numberOfLines={2}
              adjustsFontSizeToFit
              style={styles.flex}>
              {starter.name}
            </Txt>
          </View>
          <Txt variant="body">Then go around the circle, one word each.</Txt>
        </Pop>

        {round.timerSeconds > 0 ? <Countdown seconds={round.timerSeconds} /> : null}

        <View style={styles.section}>
          <Txt variant="label">Clue order</Txt>
          <View style={styles.order}>
            {order.map((player, index) => (
              <View key={player.id} style={[styles.orderChip, index === 0 && styles.orderChipFirst]}>
                <Txt variant="smallStrong" color={colors.inkSoft}>
                  {index + 1}
                </Txt>
                <Avatar id={player.id} name={player.name} size={24} />
                <Txt variant="smallStrong">{player.name}</Txt>
              </View>
            ))}
          </View>
        </View>

        <Pop radius={radius.lg} contentStyle={styles.tips}>
          <Txt variant="label">House tips</Txt>
          {TIPS.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.bullet} />
              <Txt variant="body" style={styles.flex}>
                {tip}
              </Txt>
            </View>
          ))}
        </Pop>

        <Button
          variant="plain"
          size="sm"
          icon="eye"
          label="Someone forgot their word?"
          onPress={() => setPeekOpen(true)}
          style={styles.peekButton}
        />
      </View>

      <PeekDialog visible={peekOpen} round={round} onClose={() => setPeekOpen(false)} />
    </Screen>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const timer = useCountdown(seconds);
  const pct = Math.min(100, (timer.left / Math.max(1, timer.total)) * 100);
  const status = timer.finished ? "Time's up! Vote now" : timer.running ? 'Discussion time' : 'Paused';

  return (
    <Pop
      color={timer.finished ? colors.coral : colors.card}
      radius={radius.lg}
      contentStyle={styles.timer}>
      <View style={styles.timerHead}>
        <Txt variant="label" style={styles.flex}>
          {status}
        </Txt>
        {!timer.finished ? (
          <IconButton
            icon={timer.running ? 'pause' : 'play'}
            size={40}
            label={timer.running ? 'Pause timer' : 'Resume timer'}
            onPress={timer.running ? timer.pause : timer.resume}
          />
        ) : null}
        <Button size="sm" variant="sky" label="+30s" onPress={() => timer.addTime(30)} />
      </View>
      <Txt variant="mega" style={styles.clock} accessibilityLiveRegion="polite">
        {formatClock(timer.left)}
      </Txt>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </Pop>
  );
}

function PeekDialog({ visible, round, onClose }: { visible: boolean; round: Round; onClose: () => void }) {
  const [who, setWho] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  const close = () => {
    setWho(null);
    setShown(false);
    onClose();
  };

  let body;
  if (who === null) {
    body = (
      <>
        <Txt variant="h2">Who forgot?</Txt>
        <Txt variant="body" color={colors.inkSoft}>
          Only that player gets to look at the screen.
        </Txt>
        <ScrollView style={styles.peekList} contentContainerStyle={styles.peekListContent}>
          {round.players.map((player) => (
            <Pop
              key={player.id}
              lift={3}
              radius={radius.md}
              onPress={() => setWho(player.id)}
              contentStyle={styles.peekRow}>
              <Avatar id={player.id} name={player.name} size={32} />
              <Txt variant="bodyStrong">{player.name}</Txt>
            </Pop>
          ))}
        </ScrollView>
        <Button variant="plain" label="Never mind" onPress={close} />
      </>
    );
  } else if (!shown) {
    body = (
      <>
        <Txt variant="h2">{playerName(round, who)}, ready?</Txt>
        <Txt variant="body" color={colors.inkSoft}>
          Everyone else, look away!
        </Txt>
        <View style={styles.dialogActions}>
          <Button variant="plain" label="Back" onPress={() => setWho(null)} style={styles.flex} />
          <Button
            variant="violet"
            icon="eye"
            label="Show"
            onPress={() => {
              haptic.tap();
              setShown(true);
            }}
            style={styles.flex}
          />
        </View>
      </>
    );
  } else {
    body = (
      <>
        <Pop color={roleColor(round, who)} radius={radius.lg} contentStyle={styles.peekCard}>
          <RoleFace round={round} playerId={who} compact />
        </Pop>
        <Button variant="dark" icon="eye-off" label="Hide it" onPress={close} />
      </>
    );
  }

  return (
    <Dialog visible={visible} onClose={close}>
      {body}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  stack: {
    gap: space.lg,
  },
  starter: {
    padding: space.lg,
    gap: space.sm,
  },
  starterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  section: {
    gap: space.sm,
  },
  order: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 4,
  },
  orderChipFirst: {
    backgroundColor: colors.sun,
  },
  tips: {
    padding: space.lg,
    gap: space.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm + 2,
  },
  bullet: {
    width: 10,
    height: 10,
    marginTop: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.ink,
    transform: [{ rotate: '45deg' }],
  },
  peekButton: {
    alignSelf: 'center',
  },
  timer: {
    padding: space.lg,
    gap: space.sm,
  },
  timerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  clock: {
    fontVariant: ['tabular-nums'],
    fontSize: 72,
    lineHeight: 78,
  },
  bar: {
    height: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.ink,
  },
  peekList: {
    maxHeight: 340,
  },
  peekListContent: {
    gap: space.sm,
  },
  peekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  peekCard: {
    padding: space.lg,
  },
});

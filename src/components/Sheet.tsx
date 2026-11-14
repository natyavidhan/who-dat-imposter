import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pop } from '@/components/Pop';
import { Txt } from '@/components/Txt';
import { colors, radius, space } from '@/theme';

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  color?: string;
};

/** Centered modal card on a dimmed backdrop. Tapping outside closes it. */
export function Dialog({ visible, onClose, children, color = colors.card }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Pop color={color} radius={radius.lg} style={styles.card} contentStyle={styles.cardFace}>
          {children}
        </Pop>
      </View>
    </Modal>
  );
}

type ConfirmProps = {
  visible: boolean;
  title: string;
  message?: string;
  emoji?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  emoji,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Dialog visible={visible} onClose={onCancel}>
      {emoji ? <Txt style={styles.emoji}>{emoji}</Txt> : null}
      <Txt variant="h2">{title}</Txt>
      {message ? (
        <Txt variant="body" color={colors.inkSoft}>
          {message}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={cancelLabel} variant="plain" onPress={onCancel} style={styles.flex} />
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={onConfirm}
          style={styles.flex}
        />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 19, 31, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  cardFace: {
    padding: space.xl - 2,
    gap: space.md,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  actions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  flex: {
    flex: 1,
  },
});

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useGame } from '@/store';

function enabled(): boolean {
  return Platform.OS !== 'web' && useGame.getState().settings.haptics;
}

function run(effect: () => Promise<void>): void {
  if (!enabled()) return;
  effect().catch(() => {
    // Haptics are a nicety; devices without a vibration motor just stay quiet.
  });
}

export const haptic = {
  tick: () => run(() => Haptics.selectionAsync()),
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  thump: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { colors, maxContentWidth, space } from '@/theme';

type ScreenProps = {
  title?: string;
  onBack?: () => void;
  backIcon?: 'chevron-back' | 'close';
  right?: ReactNode;
  /** Replaces the default title row entirely. */
  header?: ReactNode;
  children: ReactNode;
  /** Pinned to the bottom, above the home indicator. */
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  background?: string;
};

export function Screen({
  title,
  onBack,
  backIcon = 'chevron-back',
  right,
  header,
  children,
  footer,
  scroll = true,
  contentStyle,
  background = colors.bg,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const headerNode =
    header ??
    (title || onBack || right ? (
      <View style={styles.header}>
        {onBack ? (
          <IconButton icon={backIcon} label={backIcon === 'close' ? 'Close' : 'Back'} onPress={onBack} />
        ) : null}
        <Txt variant="h1" numberOfLines={1} style={styles.title}>
          {title}
        </Txt>
        {right}
      </View>
    ) : null);

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.staticContent, contentStyle]}>
      <View style={[styles.column, styles.flex]}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {headerNode ? <View style={styles.headerWrap}>{headerNode}</View> : null}
        {body}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) + space.sm }]}>
            <View style={styles.column}>{footer}</View>
          </View>
        ) : (
          <View style={{ height: insets.bottom }} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: space.lg + 2,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 52,
  },
  title: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.lg + 2,
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
  staticContent: {
    paddingHorizontal: space.lg + 2,
    paddingTop: space.sm,
  },
  column: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: space.lg + 2,
    paddingTop: space.md,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
    backgroundColor: colors.bgDeep,
  },
});

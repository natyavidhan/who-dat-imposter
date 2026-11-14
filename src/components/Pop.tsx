import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, lift as defaultLift, radius as radii, stroke } from '@/theme';

export type PopProps = {
  children?: ReactNode;
  /** Face color. */
  color?: string;
  radius?: number;
  /** Hard-shadow offset; the face sinks into it when pressed. */
  lift?: number;
  /** Color of the hard shadow (defaults to ink). */
  shadowColor?: string;
  borderWidth?: number;
  dashed?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Outer wrapper: margins, flex, width. */
  style?: StyleProp<ViewStyle>;
  /** The face itself: padding and layout of the children. */
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  testID?: string;
};

/**
 * The app's core surface: an ink-outlined block sitting on a hard offset
 * shadow. Pressable when given onPress, pressing pushes it into its shadow.
 */
export function Pop({
  children,
  color = colors.card,
  radius = radii.md,
  lift = defaultLift,
  shadowColor = colors.ink,
  borderWidth = stroke,
  dashed,
  onPress,
  onLongPress,
  disabled,
  style,
  contentStyle,
  accessibilityRole,
  ...a11y
}: PopProps) {
  const renderFace = (pressed: boolean) => (
    <>
      {lift > 0 ? (
        <View
          style={[
            styles.shadow,
            { top: lift, left: lift, borderRadius: radius, backgroundColor: shadowColor },
            disabled && styles.shadowDisabled,
          ]}
        />
      ) : null}
      <View
        style={[
          styles.face,
          {
            backgroundColor: disabled ? colors.disabled : color,
            borderRadius: radius,
            borderWidth,
            borderStyle: dashed ? 'dashed' : 'solid',
            borderColor: disabled ? colors.disabledInk : colors.ink,
          },
          pressed && { transform: [{ translateX: lift }, { translateY: lift }] },
          contentStyle,
        ]}>
        {children}
      </View>
    </>
  );

  const outer = [{ paddingRight: lift, paddingBottom: lift }, style];

  if (!onPress && !onLongPress) {
    return <View style={outer}>{renderFace(false)}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? 'button'}
      style={outer}
      {...a11y}
      accessibilityState={{ disabled: !!disabled, ...a11y.accessibilityState }}>
      {({ pressed }) => renderFace(pressed && !disabled)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.ink,
    pointerEvents: 'none',
  },
  shadowDisabled: {
    backgroundColor: colors.disabledInk,
    opacity: 0.35,
  },
  face: {
    flexGrow: 1,
    overflow: 'hidden',
  },
});

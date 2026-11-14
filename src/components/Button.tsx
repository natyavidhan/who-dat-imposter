import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Pop } from '@/components/Pop';
import { Txt } from '@/components/Txt';
import { colors, radius } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Variant = 'primary' | 'danger' | 'plain' | 'dark' | 'sun' | 'violet' | 'sky' | 'mint';
type Size = 'lg' | 'md' | 'sm';

const FILL: Record<Variant, string> = {
  primary: colors.lime,
  danger: colors.coral,
  plain: colors.card,
  dark: colors.ink,
  sun: colors.sun,
  violet: colors.violet,
  sky: colors.sky,
  mint: colors.mint,
};

const SIZES: Record<Size, { height: number; font: 'h3' | 'bodyStrong' | 'smallStrong'; icon: number; pad: number }> = {
  lg: { height: 62, font: 'h3', icon: 22, pad: 22 },
  md: { height: 52, font: 'bodyStrong', icon: 19, pad: 18 },
  sm: { height: 42, font: 'smallStrong', icon: 16, pad: 14 },
};

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const dims = SIZES[size];
  const textColor = disabled ? colors.disabledInk : variant === 'dark' ? colors.white : colors.ink;
  return (
    <Pop
      onPress={onPress}
      disabled={disabled}
      color={FILL[variant]}
      radius={size === 'sm' ? radius.sm : radius.md}
      lift={size === 'sm' ? 4 : 5}
      shadowColor={variant === 'dark' ? colors.lime : colors.ink}
      style={style}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      contentStyle={[styles.face, { minHeight: dims.height, paddingHorizontal: dims.pad }]}>
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={dims.icon} color={textColor} /> : null}
        <Txt variant={dims.font} color={textColor} numberOfLines={1} style={styles.label}>
          {label}
        </Txt>
        {iconRight ? <Ionicons name={iconRight} size={dims.icon} color={textColor} /> : null}
      </View>
    </Pop>
  );
}

export type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.card,
  size = 44,
  disabled,
  style,
}: IconButtonProps) {
  const iconColor = disabled ? colors.disabledInk : color === colors.ink ? colors.white : colors.ink;
  return (
    <Pop
      onPress={onPress}
      disabled={disabled}
      color={color}
      radius={size / 2}
      lift={size >= 40 ? 4 : 3}
      borderWidth={size >= 40 ? 3 : 2.5}
      style={style}
      accessibilityLabel={label}
      contentStyle={[styles.iconFace, { width: size, height: size }]}>
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={iconColor} />
    </Pop>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
  },
  iconFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

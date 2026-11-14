import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/Txt';
import { colorForId, colors, fonts } from '@/theme';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}

type AvatarProps = {
  id: string;
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ id, name, size = 40, color, style }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size >= 36 ? 2.5 : 2,
          backgroundColor: color ?? colorForId(id),
        },
        style,
      ]}>
      <Txt
        style={{ fontFamily: fonts.black, fontSize: size * 0.38, lineHeight: size * 0.46 }}
        numberOfLines={1}>
        {initials(name)}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

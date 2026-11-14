import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

export type TxtVariant =
  | 'mega'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'label';

export type TxtProps = TextProps & {
  variant?: TxtVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

/**
 * Picks the largest of three headline sizes that a string can use without
 * overflowing a phone-width card. Native platforms also auto-shrink text, but
 * web does not, so long words step down a size up front.
 */
export function fitVariant(text: string, sizes: [TxtVariant, TxtVariant, TxtVariant]): TxtVariant {
  const longestWord = Math.max(0, ...text.split(/\s+/).map((word) => word.length));
  if (text.length <= 8) return sizes[0];
  if (longestWord <= 11 && text.length <= 18) return sizes[1];
  return sizes[2];
}

export function Txt({ variant = 'body', color = colors.ink, align, style, ...rest }: TxtProps) {
  return (
    <Text
      maxFontSizeMultiplier={1.35}
      style={[styles[variant], { color }, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  mega: { fontFamily: fonts.black, fontSize: 56, lineHeight: 58, letterSpacing: -1.5 },
  display: { fontFamily: fonts.black, fontSize: 42, lineHeight: 46, letterSpacing: -1 },
  h1: { fontFamily: fonts.black, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19 },
  smallStrong: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

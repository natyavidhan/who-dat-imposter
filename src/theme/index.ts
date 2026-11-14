/**
 * Visual language: warm cream paper, near-black ink outlines, hard offset
 * shadows and loud party colors. Every color pairing below keeps ink text
 * at 5:1 contrast or better.
 */

export const colors = {
  bg: '#FFF3DF',
  bgDeep: '#F8E3BF',
  ink: '#17131F',
  inkSoft: '#3B3548',
  muted: '#6E6680',
  card: '#FFFFFF',
  disabled: '#EADFCB',
  disabledInk: '#9C93A8',
  lime: '#C6F432',
  coral: '#FF5D4A',
  violet: '#9A8BFF',
  sky: '#6CCBFF',
  sun: '#FFCB3D',
  pink: '#FF93C9',
  mint: '#52E3B4',
  orange: '#FF9B42',
  hood: '#17131F',
  hoodFace: '#3A3150',
  white: '#FFFFFF',
} as const;

export const swatchNames = ['lime', 'coral', 'violet', 'sky', 'sun', 'pink', 'mint', 'orange'] as const;
export type Swatch = (typeof swatchNames)[number];

export function swatch(name: Swatch): string {
  return colors[name];
}

/** Stable color for a player, derived from their id so it never shifts when the list changes. */
export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return colors[swatchNames[hash % swatchNames.length]];
}

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  black: 'BricolageGrotesque_800ExtraBold',
} as const;

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Border width of chunky elements. */
export const stroke = 3;
/** Offset of the hard drop shadow. */
export const lift = 5;
export const maxContentWidth = 560;

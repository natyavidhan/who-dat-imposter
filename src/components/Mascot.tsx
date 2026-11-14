import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Txt } from '@/components/Txt';
import { colors, fonts } from '@/theme';

type MascotProps = {
  size?: number;
  /** sneaky: half-lidded side-eye. shocked: wide open. */
  mood?: 'sneaky' | 'shocked';
  /** Pupils dart left and right. */
  shifty?: boolean;
  /** Draws the little "?" badge. */
  badge?: boolean;
  hoodColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * "Dat", the app's hooded suspect. Built from plain views so it scales
 * crisply at any size without image assets.
 */
export function Mascot({
  size = 96,
  mood = 'sneaky',
  shifty = true,
  badge = false,
  hoodColor = colors.hood,
  style,
}: MascotProps) {
  const look = useSharedValue(0);

  useEffect(() => {
    if (!shifty) {
      look.set(0);
      return;
    }
    const move = (to: number) => withTiming(to, { duration: 260, easing: Easing.out(Easing.quad) });
    look.set(
      withRepeat(
        withSequence(withDelay(900, move(-1)), withDelay(1100, move(1)), withDelay(700, move(0))),
        -1,
        false,
      ),
    );
  }, [shifty, look]);

  const S = size;
  const eyeW = S * 0.2;
  const eyeH = mood === 'shocked' ? S * 0.22 : S * 0.17;
  const pupil = S * 0.09;
  const travel = (eyeW - pupil) / 2 - S * 0.012;

  const pupilStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: look.get() * travel }],
  }));

  return (
    <View style={[{ width: S * 1.08, height: S * 1.08 }, style]} accessible={false}>
      <View
        style={[
          styles.hood,
          {
            width: S,
            height: S,
            top: S * 0.08,
            backgroundColor: hoodColor,
            borderTopLeftRadius: S * 0.5,
            borderTopRightRadius: S * 0.5,
            borderBottomLeftRadius: S * 0.2,
            borderBottomRightRadius: S * 0.2,
          },
        ]}>
        <View
          style={[
            styles.face,
            {
              width: S * 0.74,
              height: S * 0.44,
              top: S * 0.27,
              left: S * 0.13,
              borderRadius: S * 0.22,
            },
          ]}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={[
                styles.eye,
                {
                  width: eyeW,
                  height: eyeH,
                  borderRadius: eyeW / 2,
                  left: i === 0 ? S * 0.12 : S * 0.42,
                  top: (S * 0.44 - eyeH) / 2,
                },
              ]}>
              <Animated.View
                style={[
                  styles.pupil,
                  {
                    width: pupil,
                    height: pupil,
                    borderRadius: pupil / 2,
                    top: (eyeH - pupil) / 2 + (mood === 'sneaky' ? S * 0.018 : 0),
                    left: (eyeW - pupil) / 2,
                  },
                  pupilStyle,
                ]}
              />
              {mood === 'sneaky' ? (
                <View style={[styles.lid, { height: eyeH * 0.42, transform: [{ rotate: i === 0 ? '8deg' : '-8deg' }] }]} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            {
              width: S * 0.36,
              height: S * 0.36,
              borderRadius: S * 0.18,
              borderWidth: Math.max(2, S * 0.03),
              right: -S * 0.02,
              top: 0,
            },
          ]}>
          <Txt style={{ fontFamily: fonts.black, fontSize: S * 0.24, lineHeight: S * 0.3 }}>?</Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hood: {
    position: 'absolute',
    left: 0,
  },
  face: {
    position: 'absolute',
    backgroundColor: colors.hoodFace,
    overflow: 'hidden',
  },
  eye: {
    position: 'absolute',
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pupil: {
    position: 'absolute',
    backgroundColor: colors.ink,
  },
  lid: {
    position: 'absolute',
    top: -2,
    left: -4,
    right: -4,
    backgroundColor: colors.hoodFace,
  },
  badge: {
    position: 'absolute',
    backgroundColor: colors.coral,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
});

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Mascot } from '@/components/Mascot';
import { Pop } from '@/components/Pop';
import { fitVariant, Txt } from '@/components/Txt';
import { imposterHint, isImposter } from '@/game/engine';
import type { Round } from '@/game/types';
import { colors, radius, space } from '@/theme';

export function roleColor(round: Round, playerId: string): string {
  return isImposter(round, playerId) ? colors.coral : colors.lime;
}

type RoleFaceProps = {
  round: Round;
  playerId: string;
  compact?: boolean;
};

/** What a player sees once they flip their card: the word, or the bad news. */
export function RoleFace({ round, playerId, compact }: RoleFaceProps) {
  const { width } = useWindowDimensions();
  // Small phones (and the compact dialog) get one size smaller headlines.
  const small = compact || width < 380;

  if (isImposter(round, playerId)) {
    const hint = imposterHint(round);
    return (
      <View style={styles.faceInner}>
        <Mascot size={compact ? 60 : 88} mood="sneaky" />
        <Txt variant="label">Shhh… you&apos;re the</Txt>
        <Txt
          variant={small ? 'display' : 'mega'}
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}>
          IMPOSTER
        </Txt>
        {hint ? (
          <View style={styles.hintBox}>
            <Txt variant="label" color={colors.inkSoft}>
              {hint.label}
            </Txt>
            <Txt variant="h2" align="center">
              {hint.text}
            </Txt>
          </View>
        ) : (
          <Txt variant="bodyStrong" align="center">
            No hint this time. Bluff like a pro!
          </Txt>
        )}
        <Txt variant="small" align="center">
          Blend in, listen closely and work out the word.
        </Txt>
      </View>
    );
  }

  return (
    <View style={styles.faceInner}>
      <Txt variant="label">The secret word is</Txt>
      <Txt
        variant={fitVariant(round.word, small ? ['display', 'h1', 'h2'] : ['mega', 'display', 'h1'])}
        align="center"
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.5}>
        {round.word}
      </Txt>
      <View style={styles.categoryChip}>
        <Txt variant="smallStrong">
          {round.categoryEmoji} {round.categoryName}
        </Txt>
      </View>
      <Txt variant="small" align="center">
        Give a clue that proves you know it, without handing it to the imposter.
      </Txt>
    </View>
  );
}

function QuestionPattern() {
  return (
    <View style={styles.pattern}>
      {Array.from({ length: 48 }, (_, i) => (
        <Txt key={i} variant="h1" color={colors.ink} style={styles.patternGlyph}>
          ?
        </Txt>
      ))}
    </View>
  );
}

type RoleCardProps = {
  round: Round;
  playerId: string;
  revealed: boolean;
  onReveal: () => void;
};

const CARD_RATIO = 0.74;

/** A face-down card that flips over to show the player's role. */
export function RoleCard({ round, playerId, revealed, onReveal }: RoleCardProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const flip = useSharedValue(0);

  useEffect(() => {
    flip.set(withTiming(revealed ? 1 : 0, { duration: 460, easing: Easing.out(Easing.cubic) }));
  }, [revealed, flip]);

  const frontStyle = useAnimatedStyle(() => {
    const value = flip.get();
    return {
      opacity: value < 0.5 ? 1 : 0,
      transform: [{ perspective: 1400 }, { rotateY: `${value * 180}deg` }],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const value = flip.get();
    return {
      opacity: value < 0.5 ? 0 : 1,
      transform: [{ perspective: 1400 }, { rotateY: `${value * 180 - 180}deg` }],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  };

  const width = Math.floor(Math.min(box.width, box.height * CARD_RATIO, 400));
  const height = Math.floor(width / CARD_RATIO);

  return (
    <View style={styles.area} onLayout={onLayout}>
      {width > 0 ? (
        <Pressable
          onPress={onReveal}
          disabled={revealed}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Your secret role' : 'Tap to reveal your secret role'}
          style={{ width, height }}>
          <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
            <Pop
              color={colors.violet}
              radius={radius.xl}
              lift={7}
              style={styles.fill}
              contentStyle={styles.faceFill}>
              <QuestionPattern />
              <View style={styles.faceInner}>
                <Mascot size={Math.round(width * 0.32)} badge />
                <Txt variant="h1" align="center">
                  Tap to reveal
                </Txt>
                <Txt variant="bodyStrong" align="center">
                  Make sure nobody else is peeking 👀
                </Txt>
              </View>
            </Pop>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
            {revealed ? (
              <Pop
                color={roleColor(round, playerId)}
                radius={radius.xl}
                lift={7}
                style={styles.fill}
                contentStyle={styles.faceFill}>
                <RoleFace round={round} playerId={playerId} />
              </Pop>
            ) : null}
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
  },
  fill: {
    flex: 1,
  },
  faceFill: {
    flex: 1,
    padding: space.xl - 2,
    justifyContent: 'center',
  },
  faceInner: {
    alignItems: 'center',
    gap: space.sm + 2,
  },
  hintBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  categoryChip: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-around',
    justifyContent: 'space-around',
    opacity: 0.1,
    transform: [{ rotate: '-12deg' }, { scale: 1.3 }],
  },
  patternGlyph: {
    width: '16%',
    textAlign: 'center',
  },
});

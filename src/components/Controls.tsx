import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { IconButton } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme';

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
};

export function Stepper({ value, min, max, onChange, label }: StepperProps) {
  const change = (next: number) => {
    if (next < min || next > max) return;
    haptic.tick();
    onChange(next);
  };
  return (
    <View style={styles.stepper}>
      <IconButton
        icon="remove"
        size={38}
        label={`Fewer ${label}`}
        disabled={value <= min}
        onPress={() => change(value - 1)}
      />
      <Txt variant="h2" align="center" style={styles.stepperValue} accessibilityLabel={`${value} ${label}`}>
        {value}
      </Txt>
      <IconButton
        icon="add"
        size={38}
        label={`More ${label}`}
        disabled={value >= max}
        onPress={() => change(value + 1)}
      />
    </View>
  );
}

export type SegmentOption<T extends string | number> = { value: T; label: string };

type SegmentedProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: string;
};

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accent = colors.lime,
}: SegmentedProps<T>) {
  return (
    <View style={styles.segmentTrack} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              haptic.tick();
              onChange(option.value);
            }}
            style={[styles.segment, selected && { backgroundColor: accent, borderColor: colors.ink }]}>
            <Txt variant="smallStrong" color={selected ? colors.ink : colors.inkSoft} numberOfLines={1}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

export function Toggle({ value, onChange, label }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(value ? 1 : 0, { duration: 170 }));
  }, [value, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * 22 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => {
        haptic.tick();
        onChange(!value);
      }}
      style={[styles.toggle, { backgroundColor: value ? colors.lime : colors.card }]}>
      <Animated.View style={[styles.knob, knobStyle]} />
    </Pressable>
  );
}

type OptionRowProps = {
  title: string;
  description?: string;
  control?: ReactNode;
  /** Renders the control under the text instead of beside it. */
  stacked?: boolean;
  last?: boolean;
};

export function OptionRow({ title, description, control, stacked, last }: OptionRowProps) {
  return (
    <View style={[styles.optionRow, stacked && styles.optionStacked, !last && styles.optionDivider]}>
      <View style={styles.optionText}>
        <Txt variant="bodyStrong">{title}</Txt>
        {description ? (
          <Txt variant="small" color={colors.muted}>
            {description}
          </Txt>
        ) : null}
      </View>
      {control}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  stepperValue: {
    minWidth: 34,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    width: 58,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + 2,
  },
  optionStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: space.sm + 2,
  },
  optionDivider: {
    borderBottomWidth: 2,
    borderBottomColor: colors.bgDeep,
  },
  optionText: {
    flexShrink: 1,
    flexGrow: 1,
    gap: 2,
  },
});

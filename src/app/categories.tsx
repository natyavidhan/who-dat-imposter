import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { BUILT_IN_CATEGORIES } from '@/data/categories';
import type { Category } from '@/game/types';
import { haptic } from '@/lib/haptics';
import { allCategories, useGame } from '@/store';
import { colors, radius, space, swatch } from '@/theme';

export default function CategoriesScreen() {
  const router = useRouter();
  const customCategories = useGame((s) => s.customCategories);
  const selectedIds = useGame((s) => s.selectedCategoryIds);
  const toggleCategory = useGame((s) => s.toggleCategory);
  const setSelected = useGame((s) => s.setSelectedCategories);

  const all = allCategories(customCategories);
  const selected = all.filter((c) => selectedIds.includes(c.id));
  const wordCount = selected.reduce((sum, c) => sum + c.words.length, 0);
  const everything = all.length > 0 && selected.length === all.length;

  const toggle = (id: string) => {
    haptic.tick();
    toggleCategory(id);
  };

  const edit = (id?: string) =>
    router.push(id ? { pathname: '/category-editor', params: { id } } : '/category-editor');

  return (
    <Screen
      title="Categories"
      onBack={() => router.back()}
      right={
        <Button
          size="sm"
          variant="plain"
          label={everything ? 'None' : 'All'}
          onPress={() => {
            haptic.tick();
            setSelected(everything ? [] : all.map((c) => c.id));
          }}
        />
      }
      footer={
        <Button
          size="lg"
          icon="checkmark"
          label={selected.length > 0 ? `Done · ${wordCount} words` : 'Pick at least one'}
          disabled={selected.length === 0}
          onPress={() => router.back()}
        />
      }>
      <View style={styles.stack}>
        <Txt variant="small" color={colors.muted}>
          Mix as many as you like. Each round, the secret word is drawn from everything you pick.
        </Txt>

        <View style={styles.grid}>
          {BUILT_IN_CATEGORIES.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              selected={selectedIds.includes(category.id)}
              onPress={() => toggle(category.id)}
            />
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Txt variant="h2">Your own words</Txt>
          <Txt variant="small" color={colors.muted}>
            Inside jokes, friends’ names, your favorite shows. Anything goes.
          </Txt>
        </View>

        <View style={styles.grid}>
          {customCategories.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              selected={selectedIds.includes(category.id)}
              onPress={() => toggle(category.id)}
              onEdit={() => edit(category.id)}
            />
          ))}
          <Pop
            dashed
            lift={0}
            radius={20}
            color={colors.bg}
            style={styles.tile}
            contentStyle={[styles.tileFace, styles.newTile]}
            onPress={() => edit()}
            accessibilityLabel="Create a new category">
            <Ionicons name="add-circle" size={36} color={colors.ink} />
            <Txt variant="bodyStrong" align="center">
              New category
            </Txt>
          </Pop>
        </View>
      </View>
    </Screen>
  );
}

type TileProps = {
  category: Category;
  selected: boolean;
  onPress: () => void;
  onEdit?: () => void;
};

function CategoryTile({ category, selected, onPress, onEdit }: TileProps) {
  return (
    <Pop
      radius={20}
      lift={selected ? 5 : 3}
      color={selected ? swatch(category.color) : colors.card}
      onPress={onPress}
      onLongPress={onEdit}
      style={styles.tile}
      contentStyle={styles.tileFace}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${category.name}, ${category.words.length} words`}>
      <View style={styles.tileTop}>
        <Txt style={styles.tileEmoji}>{category.emoji}</Txt>
        <View style={[styles.check, selected && styles.checkOn]}>
          {selected ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
        </View>
      </View>
      <Txt variant="bodyStrong" numberOfLines={2}>
        {category.name}
      </Txt>
      <View style={styles.tileBottom}>
        <Txt variant="small" color={colors.inkSoft}>
          {category.words.length} words
        </Txt>
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${category.name}`}
            style={styles.editChip}>
            <Ionicons name="pencil" size={13} color={colors.ink} />
            <Txt variant="smallStrong">Edit</Txt>
          </Pressable>
        ) : null}
      </View>
    </Pop>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.md,
  },
  tile: {
    width: '48.5%',
  },
  tileFace: {
    minHeight: 128,
    padding: space.md + 2,
    gap: 4,
  },
  newTile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tileEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: colors.ink,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.ink,
  },
  tileBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.card,
  },
  sectionHead: {
    gap: 2,
    marginTop: space.sm,
  },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Pop } from '@/components/Pop';
import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { parseWordList } from '@/game/engine';
import { haptic } from '@/lib/haptics';
import { useGame } from '@/store';
import { colors, fonts, radius, space, swatch, swatchNames, type Swatch } from '@/theme';

const EMOJIS = [
  '🎲', '🎯', '🧠', '🔥', '🌮', '🎮', '🏆', '🎭', '🚀', '🌈', '🍦', '🐶',
  '🎨', '📚', '🏖️', '👽', '🦄', '🍕', '🎤', '⚡', '🌶️', '💎', '🧩', '👑',
];

const MIN_WORDS = 3;
const SEPARATORS = /[,\n;]/;

export default function CategoryEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useGame((s) => s.customCategories.find((c) => c.id === id));
  const saveCustomCategory = useGame((s) => s.saveCustomCategory);
  const deleteCustomCategory = useGame((s) => s.deleteCustomCategory);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? EMOJIS[0]);
  const [color, setColor] = useState<Swatch>(existing?.color ?? 'violet');
  const [words, setWords] = useState<string[]>(() => existing?.words.map((w) => w.word) ?? []);
  const [draft, setDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addWords = (raw: string) => {
    const added = parseWordList(raw, words);
    if (added.length > 0) {
      setWords([...words, ...added]);
      haptic.tick();
    }
  };

  const onDraftChange = (text: string) => {
    // Typing a comma (or pasting a list) turns everything before it into chips.
    if (SEPARATORS.test(text)) {
      const pieces = text.split(SEPARATORS);
      const rest = pieces.pop() ?? '';
      addWords(pieces.join('\n'));
      setDraft(rest);
    } else {
      setDraft(text);
    }
  };

  const commitDraft = () => {
    addWords(draft);
    setDraft('');
  };

  const pendingWords = parseWordList(draft, words).length;
  const totalWords = words.length + pendingWords;
  const canSave = name.trim().length > 0 && totalWords >= MIN_WORDS;

  const save = () => {
    const finalWords = [...words, ...parseWordList(draft, words)];
    saveCustomCategory({ id: existing?.id, name, emoji, color, words: finalWords });
    haptic.success();
    router.back();
  };

  return (
    <Screen
      title={existing ? 'Edit category' : 'New category'}
      onBack={() => router.back()}
      backIcon="close"
      right={
        existing ? (
          <IconButton
            icon="trash"
            color={colors.coral}
            label="Delete category"
            onPress={() => setConfirmDelete(true)}
          />
        ) : null
      }
      footer={
        <View style={styles.footer}>
          {!canSave ? (
            <Txt variant="smallStrong" align="center" color={colors.inkSoft}>
              {name.trim().length === 0
                ? 'Give your category a name'
                : `Add ${MIN_WORDS - totalWords} more word${MIN_WORDS - totalWords === 1 ? '' : 's'}`}
            </Txt>
          ) : null}
          <Button size="lg" icon="save" label="Save category" disabled={!canSave} onPress={save} />
        </View>
      }>
      <View style={styles.stack}>
        <Pop color={swatch(color)} radius={radius.lg} contentStyle={styles.preview}>
          <View style={styles.previewEmoji}>
            <Txt style={styles.bigEmoji}>{emoji}</Txt>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Category name"
            placeholderTextColor={colors.inkSoft}
            maxLength={28}
            autoCapitalize="words"
            style={styles.nameInput}
            accessibilityLabel="Category name"
          />
        </Pop>

        <View style={styles.section}>
          <Txt variant="label">Icon</Txt>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((item) => {
              const active = item === emoji;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    haptic.tick();
                    setEmoji(item);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Icon ${item}`}
                  style={[styles.emojiCell, active && styles.emojiCellActive]}>
                  <Txt style={styles.cellEmoji}>{item}</Txt>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Txt variant="label">Color</Txt>
          <View style={styles.swatchRow}>
            {swatchNames.map((item) => {
              const active = item === color;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    haptic.tick();
                    setColor(item);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Color ${item}`}
                  style={[styles.swatch, { backgroundColor: swatch(item) }, active && styles.swatchActive]}>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.ink} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Txt variant="label">Words · {words.length}</Txt>
          <Pop radius={radius.md} lift={4} contentStyle={styles.addRow}>
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              onSubmitEditing={commitDraft}
              submitBehavior="submit"
              returnKeyType="done"
              placeholder="Type a word, or paste a list"
              placeholderTextColor={colors.muted}
              autoCapitalize="sentences"
              style={styles.wordInput}
              accessibilityLabel="New word"
            />
            <Button size="sm" label="Add" icon="add" disabled={!draft.trim()} onPress={commitDraft} />
          </Pop>
          <Txt variant="small" color={colors.muted}>
            Separate words with commas to add a bunch at once. Imposters get the category name as
            their hint for custom words.
          </Txt>
          <View style={styles.chips}>
            {words.map((word) => (
              <View key={word} style={styles.chip}>
                <Txt variant="smallStrong">{word}</Txt>
                <Pressable
                  hitSlop={10}
                  onPress={() => setWords(words.filter((w) => w !== word))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${word}`}>
                  <Ionicons name="close-circle" size={18} color={colors.ink} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        emoji="🗑️"
        title="Delete this category?"
        message={`“${existing?.name ?? name}” and its ${words.length} words will be gone for good.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (existing) deleteCustomCategory(existing.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: space.sm,
  },
  stack: {
    gap: space.xl,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
  },
  previewEmoji: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigEmoji: {
    fontSize: 34,
    lineHeight: 42,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.ink,
  },
  section: {
    gap: space.sm + 2,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiCell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellActive: {
    borderColor: colors.ink,
    backgroundColor: colors.card,
  },
  cellEmoji: {
    fontSize: 24,
    lineHeight: 32,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 4,
    transform: [{ scale: 1.08 }],
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.md + 2,
    paddingRight: space.sm,
    paddingVertical: space.sm,
  },
  wordInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
  },
});

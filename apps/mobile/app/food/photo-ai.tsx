import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ArrowLeft, Camera, Image as ImageIcon, Trash2, Plus } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { useFoodStore } from '../../stores/useFoodStore';
import { saveFoodItem } from '../../services/foodItemRepository';
import { trpcClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MealType } from '@cherryfit/shared';

type Screen = 'capture' | 'loading' | 'review';

interface FoodItem {
  food_name: string;
  estimated_portion: string;
  confidence: 'low' | 'medium' | 'high';
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string;
  sugar_g: string;
  sodium_mg: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: colors.accent.mint,
  medium: colors.accent.lavender,
  low: colors.accent.yellow,
};

const MEAL_OPTIONS: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function PhotoAiScreen(): React.JSX.Element {
  const router = useRouter();
  const addFoodLog = useFoodStore((s) => s.addFoodLog);

  const [screen, setScreen] = useState<Screen>('capture');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [isSaving, setIsSaving] = useState(false);

  const processImage = useCallback(async (uri: string) => {
    setScreen('loading');

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await trpcClient.food.analyzePhoto.mutate({
        image: base64,
        mediaType: 'image/jpeg',
      });

      if (result.items.length === 0) {
        Alert.alert(
          'No Food Found',
          'Could not identify any food items in the photo. Please try again with a clearer image.',
          [{ text: 'OK', onPress: () => setScreen('capture') }],
        );
        return;
      }

      setItems(
        result.items.map((item) => ({
          food_name: item.food_name,
          estimated_portion: item.estimated_portion,
          confidence: item.confidence,
          calories: String(item.calories),
          protein_g: String(item.protein_g),
          carbs_g: String(item.carbs_g),
          fat_g: String(item.fat_g),
          fiber_g: item.fiber_g != null ? String(item.fiber_g) : '',
          sugar_g: item.sugar_g != null ? String(item.sugar_g) : '',
          sodium_mg: item.sodium_mg != null ? String(item.sodium_mg) : '',
        })),
      );
      setScreen('review');
    } catch {
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the photo. Please try again or use manual entry.',
        [{ text: 'OK', onPress: () => setScreen('capture') }],
      );
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take food photos.');
        return;
      }

      const picked = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!picked.canceled && picked.assets[0]) {
        await processImage(picked.assets[0].uri);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Camera Error', `Could not open camera: ${message}`);
    }
  }, [processImage]);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick food photos.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!picked.canceled && picked.assets[0]) {
      await processImage(picked.assets[0].uri);
    }
  }, [processImage]);

  const updateItem = useCallback((index: number, field: keyof FoodItem, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index]!, [field]: value };
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addBlankItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        food_name: '',
        estimated_portion: '1 serving',
        confidence: 'low' as const,
        calories: '0',
        protein_g: '0',
        carbs_g: '0',
        fat_g: '0',
        fiber_g: '',
        sugar_g: '',
        sodium_mg: '',
      },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving || items.length === 0) return;
    setIsSaving(true);

    try {
      for (const item of items) {
        const confidenceValue =
          item.confidence === 'high' ? 0.9 : item.confidence === 'medium' ? 0.7 : 0.4;

        await addFoodLog({
          food_name: item.food_name || 'Unknown food',
          meal_type: mealType,
          source: 'photo_ai',
          serving_size: item.estimated_portion || '1 serving',
          servings: 1,
          calories: parseFloat(item.calories) || 0,
          protein_g: parseFloat(item.protein_g) || 0,
          carbs_g: parseFloat(item.carbs_g) || 0,
          fat_g: parseFloat(item.fat_g) || 0,
          fiber_g: item.fiber_g ? parseFloat(item.fiber_g) : null,
          sugar_g: item.sugar_g ? parseFloat(item.sugar_g) : null,
          sodium_mg: item.sodium_mg ? parseFloat(item.sodium_mg) : null,
          ai_confidence: confidenceValue,
        });

        await saveFoodItem({
          name: item.food_name || 'Unknown food',
          calories: parseFloat(item.calories) || 0,
          protein_g: parseFloat(item.protein_g) || 0,
          carbs_g: parseFloat(item.carbs_g) || 0,
          fat_g: parseFloat(item.fat_g) || 0,
          fiber_g: item.fiber_g ? parseFloat(item.fiber_g) : null,
          sugar_g: item.sugar_g ? parseFloat(item.sugar_g) : null,
          sodium_mg: item.sodium_mg ? parseFloat(item.sodium_mg) : null,
          serving_size: item.estimated_portion || '1 serving',
        });
      }

      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save food entries. Please try again.');
      setIsSaving(false);
    }
  }, [isSaving, items, mealType, addFoodLog, router]);

  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.mint} />
          <ThemedText variant="h2" style={styles.loadingText}>
            Analyzing your meal...
          </ThemedText>
          <ThemedText variant="body" color="secondary">
            AI is identifying food items
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'capture') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">AI Food Photo</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.captureContainer}>
          <ThemedText variant="body" color="secondary" style={styles.captureHint}>
            Take a photo of your meal and AI will identify the foods and estimate nutrition
          </ThemedText>
          <View style={styles.captureButtons}>
            <Pressable style={styles.captureButton} onPress={takePhoto}>
              <Camera size={32} color={colors.bg.primary} strokeWidth={1.5} />
              <ThemedText variant="h2" style={styles.captureButtonText}>
                Take Photo
              </ThemedText>
            </Pressable>
            <Pressable style={styles.galleryButton} onPress={pickFromGallery}>
              <ImageIcon size={28} color={colors.accent.mint} strokeWidth={1.5} />
              <ThemedText variant="body" color="mint">
                Pick from Gallery
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Review screen
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setScreen('capture')} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">Review Items</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.disclaimerContainer}>
          <ThemedText variant="caption" color="secondary" style={styles.disclaimerText}>
            These are AI estimates. Tap any value to adjust.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText variant="caption" color="secondary">Meal Type</ThemedText>
          <View style={styles.pillRow}>
            {MEAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.pill, mealType === opt.value && styles.pillActive]}
                onPress={() => setMealType(opt.value)}
              >
                <ThemedText
                  variant="caption"
                  color={mealType === opt.value ? 'primary' : 'secondary'}
                  style={mealType === opt.value ? styles.pillTextActive : undefined}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {items.length === 0 && (
            <View style={styles.emptyState}>
              <ThemedText variant="body" color="muted" style={styles.emptyStateText}>
                No food items. Add one manually or go back to take another photo.
              </ThemedText>
            </View>
          )}

          {items.map((item, index) => (
            <FoodItemCard
              key={index}
              item={item}
              index={index}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}

          <Pressable style={styles.addItemButton} onPress={addBlankItem}>
            <Plus size={20} color={colors.accent.mint} strokeWidth={1.5} />
            <ThemedText variant="body" color="mint">
              Add another item
            </ThemedText>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, items.length === 0 && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || items.length === 0}
          >
            <ThemedText variant="h2" style={styles.saveButtonText}>
              {isSaving
                ? 'Saving...'
                : `Save ${items.length} item${items.length !== 1 ? 's' : ''}`}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FoodItemCard({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: FoodItem;
  index: number;
  onUpdate: (index: number, field: keyof FoodItem, value: string) => void;
  onRemove: (index: number) => void;
}): React.JSX.Element {
  const badgeColor = CONFIDENCE_COLORS[item.confidence] ?? colors.accent.yellow;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.nameRow}>
          <TextInput
            style={cardStyles.nameInput}
            value={item.food_name}
            onChangeText={(v) => onUpdate(index, 'food_name', v)}
            placeholder="Food name"
            placeholderTextColor={colors.text.muted}
          />
          <View style={[cardStyles.badge, { backgroundColor: badgeColor }]}>
            <ThemedText variant="overline" style={cardStyles.badgeText}>
              {item.confidence}
            </ThemedText>
          </View>
        </View>
        <Pressable onPress={() => onRemove(index)} hitSlop={8} style={cardStyles.removeButton}>
          <Trash2 size={18} color={colors.accent.cherry} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ThemedText variant="caption" color="muted" style={cardStyles.portion}>
        {item.estimated_portion}
      </ThemedText>

      <View style={cardStyles.macroGrid}>
        <MacroField
          label="Cal"
          value={item.calories}
          onChange={(v) => onUpdate(index, 'calories', v)}
        />
        <MacroField
          label="Protein"
          value={item.protein_g}
          onChange={(v) => onUpdate(index, 'protein_g', v)}
        />
        <MacroField
          label="Carbs"
          value={item.carbs_g}
          onChange={(v) => onUpdate(index, 'carbs_g', v)}
        />
        <MacroField
          label="Fat"
          value={item.fat_g}
          onChange={(v) => onUpdate(index, 'fat_g', v)}
        />
      </View>
    </View>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <View style={cardStyles.macroField}>
      <ThemedText variant="caption" color="muted">
        {label}
      </ThemedText>
      <TextInput
        style={cardStyles.macroInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.text.muted}
      />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: typography.h2.fontFamily,
    fontSize: typography.h2.fontSize,
    padding: 0,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: colors.bg.primary,
    fontSize: 10,
  },
  removeButton: {
    padding: spacing.xs,
  },
  portion: {
    marginTop: -spacing.xs,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  macroField: {
    flex: 1,
    gap: 2,
  },
  macroInput: {
    backgroundColor: colors.bg.cardElevated,
    borderRadius: radius.sm,
    padding: spacing.sm,
    textAlign: 'center',
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  captureHint: {
    textAlign: 'center',
  },
  captureButtons: {
    gap: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: colors.accent.mint,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
  },
  captureButtonText: {
    color: colors.bg.primary,
  },
  galleryButton: {
    borderWidth: 1,
    borderColor: colors.accent.mint,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  disclaimerContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    fontStyle: 'italic',
  },
  section: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accent.mint,
    borderColor: colors.accent.mint,
  },
  pillTextActive: {
    color: colors.bg.primary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.mint,
    borderStyle: 'dashed',
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.accent.mint,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.bg.primary,
  },
});

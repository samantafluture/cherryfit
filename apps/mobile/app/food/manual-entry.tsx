import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { useFoodStore } from '../../stores/useFoodStore';
import { saveFoodItem } from '../../services/foodItemRepository';
import { estimateCalories } from '../../utils/macros';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MealType } from '@cherryfit/shared';

const MEAL_OPTIONS: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function ManualEntryScreen(): React.JSX.Element {
  const router = useRouter();
  const addFoodLog = useFoodStore((s) => s.addFoodLog);

  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [servingSize, setServingSize] = useState('1 serving');
  const [servings, setServings] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const estimatedCal = estimateCalories(
    parseFloat(protein) || 0,
    parseFloat(carbs) || 0,
    parseFloat(fat) || 0,
  );
  const showEstimate = !calories && (protein || carbs || fat) && estimatedCal > 0;

  const canSave = foodName.trim().length > 0 && (parseFloat(calories) > 0 || estimatedCal > 0);

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    const calValue = parseFloat(calories) || estimatedCal;

    await addFoodLog({
      food_name: foodName.trim(),
      meal_type: mealType,
      source: 'manual',
      serving_size: servingSize,
      servings: parseFloat(servings) || 1,
      calories: calValue,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
      fiber_g: fiber ? parseFloat(fiber) : null,
      sugar_g: sugar ? parseFloat(sugar) : null,
      sodium_mg: sodium ? parseFloat(sodium) : null,
    });

    await saveFoodItem({
      name: foodName.trim(),
      calories: calValue,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
      fiber_g: fiber ? parseFloat(fiber) : null,
      sugar_g: sugar ? parseFloat(sugar) : null,
      sodium_mg: sodium ? parseFloat(sodium) : null,
      serving_size: servingSize,
    });

    router.back();
  }, [
    canSave, isSaving, calories, estimatedCal, foodName, mealType,
    servingSize, servings, protein, carbs, fat, fiber, sugar, sodium,
    addFoodLog, router,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">Manual Entry</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <ThemedText variant="caption" color="secondary">Food Name</ThemedText>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g., Grilled chicken breast"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          <View style={styles.section}>
            <ThemedText variant="caption" color="secondary">Meal Type</ThemedText>
            <View style={styles.pillRow}>
              {MEAL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.pill,
                    mealType === opt.value && styles.pillActive,
                  ]}
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

          <View style={styles.row}>
            <View style={[styles.section, styles.flex]}>
              <ThemedText variant="caption" color="secondary">Serving Size</ThemedText>
              <TextInput
                style={styles.input}
                value={servingSize}
                onChangeText={setServingSize}
                placeholder="e.g., 100g"
                placeholderTextColor={colors.text.muted}
              />
            </View>
            <View style={styles.section}>
              <ThemedText variant="caption" color="secondary">Servings</ThemedText>
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={servings}
                onChangeText={setServings}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.text.muted}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText variant="caption" color="secondary">Calories</ThemedText>
            <TextInput
              style={[styles.input, styles.calorieInput]}
              value={calories}
              onChangeText={setCalories}
              keyboardType="decimal-pad"
              placeholder={showEstimate ? `~${estimatedCal} (estimated)` : '0'}
              placeholderTextColor={showEstimate ? colors.accent.mint : colors.text.muted}
            />
            {showEstimate && (
              <ThemedText variant="caption" color="mint">
                Estimated from macros: {estimatedCal} cal
              </ThemedText>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText variant="h2">Macros</ThemedText>
            <View style={styles.macroGrid}>
              <MacroInput label="Protein (g)" value={protein} onChange={setProtein} />
              <MacroInput label="Carbs (g)" value={carbs} onChange={setCarbs} />
              <MacroInput label="Fat (g)" value={fat} onChange={setFat} />
              <MacroInput label="Fiber (g)" value={fiber} onChange={setFiber} />
              <MacroInput label="Sugar (g)" value={sugar} onChange={setSugar} />
              <MacroInput label="Sodium (mg)" value={sodium} onChange={setSodium} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave || isSaving}
          >
            <ThemedText variant="h2" style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <View style={macroStyles.container}>
      <ThemedText variant="caption" color="secondary">{label}</ThemedText>
      <TextInput
        style={macroStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.text.muted}
      />
    </View>
  );
}

const macroStyles = StyleSheet.create({
  container: {
    width: '48%',
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border,
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
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calorieInput: {
    fontSize: 24,
    fontFamily: typography.h1.fontFamily,
  },
  smallInput: {
    width: 80,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
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
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
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
    opacity: 0.4,
  },
  saveButtonText: {
    color: colors.bg.primary,
  },
});

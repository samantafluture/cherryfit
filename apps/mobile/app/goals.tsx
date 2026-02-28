import { useState, useEffect, useCallback } from 'react';
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
import { ThemedText } from '../components/ui/ThemedText';
import { Card } from '../components/ui/Card';
import { useGoalStore } from '../stores/useGoalStore';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';

interface MacroPreset {
  label: string;
  protein: number;
  carbs: number;
  fat: number;
}

const PRESETS: MacroPreset[] = [
  { label: 'Balanced', protein: 30, carbs: 40, fat: 30 },
  { label: 'High Protein', protein: 40, carbs: 30, fat: 30 },
  { label: 'Low Carb', protein: 35, carbs: 20, fat: 45 },
];

function gramsFromPercent(calories: number, percent: number, calPerGram: number): number {
  return Math.round((calories * (percent / 100)) / calPerGram);
}

export default function GoalsScreen(): React.JSX.Element {
  const router = useRouter();
  const { goals, updateGoals } = useGoalStore();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goals) {
      setCalories(String(goals.calories));
      setProtein(String(goals.protein_g));
      setCarbs(String(goals.carbs_g));
      setFat(String(goals.fat_g));
      setFiber(goals.fiber_g != null ? String(goals.fiber_g) : '');
      setSugar(goals.sugar_g != null ? String(goals.sugar_g) : '');
      setSodium(goals.sodium_mg != null ? String(goals.sodium_mg) : '');
    }
  }, [goals]);

  const applyPreset = useCallback(
    (preset: MacroPreset) => {
      const cal = parseFloat(calories) || 2000;
      setProtein(String(gramsFromPercent(cal, preset.protein, 4)));
      setCarbs(String(gramsFromPercent(cal, preset.carbs, 4)));
      setFat(String(gramsFromPercent(cal, preset.fat, 9)));
    },
    [calories],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await updateGoals({
      calories: parseFloat(calories) || 2000,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
      fiber_g: fiber ? parseFloat(fiber) : null,
      sugar_g: sugar ? parseFloat(sugar) : null,
      sodium_mg: sodium ? parseFloat(sodium) : null,
    });
    setIsSaving(false);
    router.back();
  }, [calories, protein, carbs, fat, fiber, sugar, sodium, updateGoals, router]);

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
          <ThemedText variant="h1">Daily Goals</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <ThemedText variant="h2">Calorie Target</ThemedText>
            <TextInput
              style={styles.calorieInput}
              value={calories}
              onChangeText={setCalories}
              keyboardType="decimal-pad"
              placeholder="2000"
              placeholderTextColor={colors.text.muted}
            />
            <ThemedText variant="caption" color="secondary">
              calories per day
            </ThemedText>
          </Card>

          <Card>
            <ThemedText variant="h2">Macro Split Presets</ThemedText>
            <View style={styles.presetRow}>
              {PRESETS.map((preset) => (
                <Pressable
                  key={preset.label}
                  style={styles.presetPill}
                  onPress={() => applyPreset(preset)}
                >
                  <ThemedText variant="caption" color="mint">
                    {preset.label}
                  </ThemedText>
                  <ThemedText variant="caption" color="muted">
                    {preset.protein}P/{preset.carbs}C/{preset.fat}F
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <ThemedText variant="h2">Macro Targets (grams)</ThemedText>
            <View style={styles.macroGrid}>
              <GoalInput label="Protein" value={protein} onChange={setProtein} />
              <GoalInput label="Carbs" value={carbs} onChange={setCarbs} />
              <GoalInput label="Fat" value={fat} onChange={setFat} />
            </View>
          </Card>

          <Card>
            <ThemedText variant="h2">Secondary Targets</ThemedText>
            <View style={styles.macroGrid}>
              <GoalInput label="Fiber (g)" value={fiber} onChange={setFiber} />
              <GoalInput label="Sugar (g)" value={sugar} onChange={setSugar} />
              <GoalInput label="Sodium (mg)" value={sodium} onChange={setSodium} />
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            <ThemedText variant="h2" style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Goals'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoalInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <View style={goalInputStyles.container}>
      <ThemedText variant="caption" color="secondary">{label}</ThemedText>
      <TextInput
        style={goalInputStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.text.muted}
      />
    </View>
  );
}

const goalInputStyles = StyleSheet.create({
  container: {
    width: '30%',
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
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
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  calorieInput: {
    fontSize: 40,
    fontFamily: typography.display.fontFamily,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  presetPill: {
    borderWidth: 1,
    borderColor: colors.accent.mint,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'space-between',
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
  saveButtonText: {
    color: colors.bg.primary,
  },
});

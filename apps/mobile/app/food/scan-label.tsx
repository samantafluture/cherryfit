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
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { useFoodStore } from '../../stores/useFoodStore';
import { saveFoodItem } from '../../services/foodItemRepository';
import { trpcClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MealType } from '@cherryfit/shared';

type Screen = 'capture' | 'loading' | 'review';

interface ScanResult {
  food_name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
}

const MEAL_OPTIONS: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function ScanLabelScreen(): React.JSX.Element {
  const router = useRouter();
  const addFoodLog = useFoodStore((s) => s.addFoodLog);

  const [screen, setScreen] = useState<Screen>('capture');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [servings, setServings] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  const [editedName, setEditedName] = useState('');
  const [editedCalories, setEditedCalories] = useState('');
  const [editedProtein, setEditedProtein] = useState('');
  const [editedCarbs, setEditedCarbs] = useState('');
  const [editedFat, setEditedFat] = useState('');
  const [editedFiber, setEditedFiber] = useState('');
  const [editedSugar, setEditedSugar] = useState('');
  const [editedSodium, setEditedSodium] = useState('');

  const processImage = useCallback(async (uri: string) => {
    setScreen('loading');

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const scanResult = await trpcClient.food.scanLabel.mutate({
        image: base64,
        mediaType: 'image/jpeg',
      });

      setResult(scanResult);
      setEditedName(scanResult.food_name);
      setEditedCalories(String(scanResult.calories));
      setEditedProtein(String(scanResult.protein_g));
      setEditedCarbs(String(scanResult.carbs_g));
      setEditedFat(String(scanResult.fat_g));
      setEditedFiber(scanResult.fiber_g != null ? String(scanResult.fiber_g) : '');
      setEditedSugar(scanResult.sugar_g != null ? String(scanResult.sugar_g) : '');
      setEditedSodium(scanResult.sodium_mg != null ? String(scanResult.sodium_mg) : '');
      setScreen('review');
    } catch {
      Alert.alert(
        'Scan Failed',
        'Could not read the nutrition label. Please try again or use manual entry.',
        [{ text: 'OK', onPress: () => setScreen('capture') }],
      );
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to scan labels.');
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!picked.canceled && picked.assets[0]) {
      await processImage(picked.assets[0].uri);
    }
  }, [processImage]);

  const pickFromGallery = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!picked.canceled && picked.assets[0]) {
      await processImage(picked.assets[0].uri);
    }
  }, [processImage]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    const servingSize = result?.serving_size ?? '1 serving';

    await addFoodLog({
      food_name: editedName,
      meal_type: mealType,
      source: 'label_scan',
      serving_size: servingSize,
      servings: parseFloat(servings) || 1,
      calories: parseFloat(editedCalories) || 0,
      protein_g: parseFloat(editedProtein) || 0,
      carbs_g: parseFloat(editedCarbs) || 0,
      fat_g: parseFloat(editedFat) || 0,
      fiber_g: editedFiber ? parseFloat(editedFiber) : null,
      sugar_g: editedSugar ? parseFloat(editedSugar) : null,
      sodium_mg: editedSodium ? parseFloat(editedSodium) : null,
    });

    await saveFoodItem({
      name: editedName,
      calories: parseFloat(editedCalories) || 0,
      protein_g: parseFloat(editedProtein) || 0,
      carbs_g: parseFloat(editedCarbs) || 0,
      fat_g: parseFloat(editedFat) || 0,
      fiber_g: editedFiber ? parseFloat(editedFiber) : null,
      sugar_g: editedSugar ? parseFloat(editedSugar) : null,
      sodium_mg: editedSodium ? parseFloat(editedSodium) : null,
      serving_size: servingSize,
    });

    router.back();
  }, [
    isSaving, result, editedName, mealType, servings, editedCalories,
    editedProtein, editedCarbs, editedFat, editedFiber, editedSugar,
    editedSodium, addFoodLog, router,
  ]);

  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.mint} />
          <ThemedText variant="h2" style={styles.loadingText}>
            Scanning label...
          </ThemedText>
          <ThemedText variant="body" color="secondary">
            AI is extracting nutrition data
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
          <ThemedText variant="h1">Scan Label</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.captureContainer}>
          <ThemedText variant="body" color="secondary" style={styles.captureHint}>
            Take a photo of the nutrition label or pick from gallery
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
          <ThemedText variant="h1">Review Scan</ThemedText>
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
              value={editedName}
              onChangeText={setEditedName}
              placeholderTextColor={colors.text.muted}
            />
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

          <ReviewField label="Calories" value={editedCalories} onChange={setEditedCalories} />
          <ReviewField label="Protein (g)" value={editedProtein} onChange={setEditedProtein} />
          <ReviewField label="Carbs (g)" value={editedCarbs} onChange={setEditedCarbs} />
          <ReviewField label="Fat (g)" value={editedFat} onChange={setEditedFat} />
          <ReviewField label="Fiber (g)" value={editedFiber} onChange={setEditedFiber} />
          <ReviewField label="Sugar (g)" value={editedSugar} onChange={setEditedSugar} />
          <ReviewField label="Sodium (mg)" value={editedSodium} onChange={setEditedSodium} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            <ThemedText variant="h2" style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Looks good — Save'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <View style={reviewStyles.row}>
      <ThemedText variant="body" color="secondary" style={reviewStyles.label}>
        {label}
      </ThemedText>
      <TextInput
        style={reviewStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.text.muted}
      />
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
    width: 100,
    textAlign: 'center',
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
  content: {
    padding: spacing.md,
    gap: spacing.md,
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
  smallInput: {
    width: 80,
    textAlign: 'center',
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

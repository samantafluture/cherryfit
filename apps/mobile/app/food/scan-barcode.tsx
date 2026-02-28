import { useState, useCallback, useRef } from 'react';
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
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ArrowLeft, ScanBarcode, Keyboard } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { useFoodStore } from '../../stores/useFoodStore';
import { saveFoodItem, findByBarcode } from '../../services/foodItemRepository';
import { trpcClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MealType } from '@cherryfit/shared';

type Screen = 'scanning' | 'loading' | 'review' | 'not-found';

const MEAL_OPTIONS: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function ScanBarcodeScreen(): React.JSX.Element {
  const router = useRouter();
  const addFoodLog = useFoodStore((s) => s.addFoodLog);
  const [permission, requestPermission] = useCameraPermissions();

  const [screen, setScreen] = useState<Screen>('scanning');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scanCooldownRef = useRef(false);

  // Review state
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
  const [editedServingSize, setEditedServingSize] = useState('');
  const [resultBarcode, setResultBarcode] = useState('');

  const processBarcode = useCallback(async (barcode: string) => {
    setScreen('loading');
    setScannedBarcode(barcode);

    try {
      // Check local cache first
      const cached = await findByBarcode(barcode);
      if (cached) {
        setEditedName(cached.name);
        setEditedCalories(String(cached.calories));
        setEditedProtein(String(cached.protein_g));
        setEditedCarbs(String(cached.carbs_g));
        setEditedFat(String(cached.fat_g));
        setEditedFiber(cached.fiber_g != null ? String(cached.fiber_g) : '');
        setEditedSugar(cached.sugar_g != null ? String(cached.sugar_g) : '');
        setEditedSodium(cached.sodium_mg != null ? String(cached.sodium_mg) : '');
        setEditedServingSize(cached.serving_size);
        setResultBarcode(barcode);
        setScreen('review');
        return;
      }

      // Look up via backend (Open Food Facts)
      const result = await trpcClient.food.lookupBarcode.query({ barcode });

      if (!result) {
        setScreen('not-found');
        return;
      }

      setEditedName(result.food_name);
      setEditedCalories(String(result.calories));
      setEditedProtein(String(result.protein_g));
      setEditedCarbs(String(result.carbs_g));
      setEditedFat(String(result.fat_g));
      setEditedFiber(result.fiber_g != null ? String(result.fiber_g) : '');
      setEditedSugar(result.sugar_g != null ? String(result.sugar_g) : '');
      setEditedSodium(result.sodium_mg != null ? String(result.sodium_mg) : '');
      setEditedServingSize(result.serving_size);
      setResultBarcode(barcode);
      setScreen('review');
    } catch {
      Alert.alert(
        'Lookup Failed',
        'Could not look up this barcode. Please try again or use manual entry.',
        [{ text: 'OK', onPress: () => setScreen('scanning') }],
      );
    }
  }, []);

  const handleBarcodeScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanCooldownRef.current) return;
      scanCooldownRef.current = true;

      void processBarcode(result.data);

      // Reset cooldown after 3 seconds
      setTimeout(() => {
        scanCooldownRef.current = false;
      }, 3000);
    },
    [processBarcode],
  );

  const handleManualLookup = useCallback(() => {
    const barcode = manualBarcode.trim();
    if (barcode.length >= 8) {
      void processBarcode(barcode);
    }
  }, [manualBarcode, processBarcode]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    const servingSize = editedServingSize || '1 serving';

    await addFoodLog({
      food_name: editedName,
      meal_type: mealType,
      source: 'barcode',
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
      barcode: resultBarcode || null,
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
    isSaving, editedName, mealType, servings, editedCalories,
    editedProtein, editedCarbs, editedFat, editedFiber, editedSugar,
    editedSodium, editedServingSize, resultBarcode, addFoodLog, router,
  ]);

  // Loading screen
  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.mint} />
          <ThemedText variant="h2" style={styles.loadingText}>
            Looking up barcode...
          </ThemedText>
          <ThemedText variant="body" color="secondary">
            {scannedBarcode}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Not found screen
  if (screen === 'not-found') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setScreen('scanning')} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">Not Found</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFoundContainer}>
          <ScanBarcode size={48} color={colors.text.muted} strokeWidth={1.5} />
          <ThemedText variant="h2" style={styles.notFoundTitle}>
            Product not found
          </ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.notFoundText}>
            Barcode {scannedBarcode} is not in the database.
          </ThemedText>
          <Pressable
            style={styles.fallbackButton}
            onPress={() => setScreen('scanning')}
          >
            <ThemedText variant="body" color="mint">
              Try scanning again
            </ThemedText>
          </Pressable>
          <Pressable
            style={styles.fallbackButton}
            onPress={() => router.replace('/food/scan-label')}
          >
            <ThemedText variant="body" color="mint">
              Scan nutrition label instead
            </ThemedText>
          </Pressable>
          <Pressable
            style={styles.fallbackButton}
            onPress={() => router.replace('/food/manual-entry')}
          >
            <ThemedText variant="body" color="mint">
              Enter manually
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Scanning screen
  if (screen === 'scanning') {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
            </Pressable>
            <ThemedText variant="h1">Scan Barcode</ThemedText>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.permissionContainer}>
            <ThemedText variant="body" color="secondary" style={styles.permissionText}>
              Camera access is needed to scan barcodes.
            </ThemedText>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <ThemedText variant="h2" style={styles.permissionButtonText}>
                Grant Camera Access
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">Scan Barcode</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
            }}
            onBarcodeScanned={handleBarcodeScan}
          />
          <View style={styles.overlay}>
            <View style={styles.scanTarget} />
          </View>
        </View>
        <View style={styles.scanFooter}>
          <ThemedText variant="body" color="secondary" style={styles.scanHint}>
            Point camera at a barcode
          </ThemedText>
          {showManualInput ? (
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                value={manualBarcode}
                onChangeText={setManualBarcode}
                placeholder="Enter barcode number"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                autoFocus
              />
              <Pressable style={styles.manualGoButton} onPress={handleManualLookup}>
                <ThemedText variant="caption" style={styles.manualGoText}>
                  Go
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.manualToggle}
              onPress={() => setShowManualInput(true)}
            >
              <Keyboard size={18} color={colors.accent.mint} strokeWidth={1.5} />
              <ThemedText variant="caption" color="mint">
                Type barcode manually
              </ThemedText>
            </Pressable>
          )}
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
          <Pressable onPress={() => setScreen('scanning')} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">Review Product</ThemedText>
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  permissionText: {
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.accent.mint,
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  permissionButtonText: {
    color: colors.bg.primary,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 280,
    height: 160,
    borderWidth: 2,
    borderColor: colors.accent.mint,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  scanFooter: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  scanHint: {
    textAlign: 'center',
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  manualInput: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualGoButton: {
    backgroundColor: colors.accent.mint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  manualGoText: {
    color: colors.bg.primary,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  notFoundTitle: {
    marginTop: spacing.sm,
  },
  notFoundText: {
    textAlign: 'center',
  },
  fallbackButton: {
    paddingVertical: spacing.sm,
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

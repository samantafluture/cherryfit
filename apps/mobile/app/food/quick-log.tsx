import { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Star, X } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { useFoodStore } from '../../stores/useFoodStore';
import {
  getRecentFoodItems,
  getFavoriteFoodItems,
  toggleFavorite,
  incrementUseCount,
  searchFoodItems,
} from '../../services/foodItemRepository';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { LocalFoodItem } from '../../types/database';
import type { MealType } from '@cherryfit/shared';

type Tab = 'recent' | 'favorites';

const MEAL_OPTIONS: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function QuickLogScreen(): React.JSX.Element {
  const router = useRouter();
  const addFoodLog = useFoodStore((s) => s.addFoodLog);

  const [tab, setTab] = useState<Tab>('recent');
  const [items, setItems] = useState<LocalFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<LocalFoodItem | null>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [servings, setServings] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    if (searchQuery.trim()) {
      const results = await searchFoodItems(searchQuery.trim());
      setItems(results);
    } else if (tab === 'favorites') {
      const favs = await getFavoriteFoodItems();
      setItems(favs);
    } else {
      const recent = await getRecentFoodItems(20);
      setItems(recent);
    }
    setIsLoading(false);
  }, [tab, searchQuery]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleToggleFavorite = useCallback(
    async (item: LocalFoodItem) => {
      const newFavorite = item.is_favorite === 0;
      await toggleFavorite(item.id, newFavorite);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_favorite: newFavorite ? 1 : 0 } : i,
        ),
      );
    },
    [],
  );

  const handleQuickLog = useCallback(async () => {
    if (!selectedItem || isSaving) return;
    setIsSaving(true);

    await addFoodLog({
      food_name: selectedItem.name,
      meal_type: mealType,
      source: 'quick_log',
      serving_size: selectedItem.serving_size,
      servings: parseFloat(servings) || 1,
      calories: selectedItem.calories,
      protein_g: selectedItem.protein_g,
      carbs_g: selectedItem.carbs_g,
      fat_g: selectedItem.fat_g,
      fiber_g: selectedItem.fiber_g,
      sugar_g: selectedItem.sugar_g,
      sodium_mg: selectedItem.sodium_mg,
    });

    await incrementUseCount(selectedItem.id);

    router.back();
  }, [selectedItem, isSaving, servings, mealType, addFoodLog, router]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  function renderItem({ item }: { item: LocalFoodItem }): React.JSX.Element {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.itemCard,
          pressed && styles.itemCardPressed,
        ]}
        onPress={() => {
          setSelectedItem(item);
          setServings('1');
        }}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <ThemedText variant="body" style={styles.itemName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <Pressable
              onPress={() => handleToggleFavorite(item)}
              hitSlop={12}
              style={styles.starButton}
            >
              <Star
                size={18}
                color={item.is_favorite ? colors.accent.yellow : colors.text.muted}
                fill={item.is_favorite ? colors.accent.yellow : 'none'}
                strokeWidth={1.5}
              />
            </Pressable>
          </View>
          <View style={styles.itemMacros}>
            <ThemedText variant="caption" color="mint">
              {item.calories} cal
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              P {item.protein_g}g
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              C {item.carbs_g}g
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              F {item.fat_g}g
            </ThemedText>
          </View>
          {item.serving_size !== '1 serving' && (
            <ThemedText variant="caption" color="muted">
              {item.serving_size}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  }

  // Confirmation panel when an item is selected
  if (selectedItem) {
    const mult = parseFloat(servings) || 1;
    const adjustedCal = Math.round(selectedItem.calories * mult);

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedItem(null)} hitSlop={12}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <ThemedText variant="h1">Quick Log</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.confirmContainer}>
          <View style={styles.confirmCard}>
            <ThemedText variant="h2">{selectedItem.name}</ThemedText>
            <ThemedText variant="caption" color="secondary">
              {selectedItem.serving_size}
            </ThemedText>

            <View style={styles.confirmMacros}>
              <View style={styles.confirmMacroItem}>
                <ThemedText variant="display" color="mint">
                  {adjustedCal}
                </ThemedText>
                <ThemedText variant="caption" color="secondary">
                  calories
                </ThemedText>
              </View>
              <View style={styles.confirmMacroRow}>
                <View style={styles.confirmMacroPill}>
                  <ThemedText variant="caption" color="secondary">
                    P {Math.round(selectedItem.protein_g * mult)}g
                  </ThemedText>
                </View>
                <View style={styles.confirmMacroPill}>
                  <ThemedText variant="caption" color="secondary">
                    C {Math.round(selectedItem.carbs_g * mult)}g
                  </ThemedText>
                </View>
                <View style={styles.confirmMacroPill}>
                  <ThemedText variant="caption" color="secondary">
                    F {Math.round(selectedItem.fat_g * mult)}g
                  </ThemedText>
                </View>
              </View>
            </View>
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
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.saveButton}
            onPress={handleQuickLog}
            disabled={isSaving}
          >
            <ThemedText variant="h2" style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Log It'}
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
        <ThemedText variant="h1">Quick Log</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.muted} strokeWidth={1.5} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search foods..."
            placeholderTextColor={colors.text.muted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <X size={16} color={colors.text.muted} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </View>

      {!searchQuery && (
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, tab === 'recent' && styles.tabActive]}
            onPress={() => setTab('recent')}
          >
            <ThemedText
              variant="caption"
              color={tab === 'recent' ? 'mint' : 'secondary'}
            >
              Recent
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'favorites' && styles.tabActive]}
            onPress={() => setTab('favorites')}
          >
            <ThemedText
              variant="caption"
              color={tab === 'favorites' ? 'mint' : 'secondary'}
            >
              Favorites
            </ThemedText>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.mint} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText variant="body" color="secondary" style={styles.emptyText}>
            {searchQuery
              ? 'No foods match your search'
              : tab === 'favorites'
                ? 'No favorites yet — star a food to save it'
                : 'No recent foods — log something first'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
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
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    borderColor: colors.accent.mint,
    backgroundColor: 'rgba(46, 207, 160, 0.1)',
  },
  list: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCardPressed: {
    backgroundColor: colors.bg.cardElevated,
  },
  itemContent: {
    gap: spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  itemMacros: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  // Confirm screen styles
  confirmContainer: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.lg,
  },
  confirmCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmMacros: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  confirmMacroItem: {
    alignItems: 'center',
  },
  confirmMacroRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmMacroPill: {
    backgroundColor: colors.bg.cardElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  section: {
    gap: spacing.xs,
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

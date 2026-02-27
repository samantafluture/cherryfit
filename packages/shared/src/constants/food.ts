export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const FOOD_SOURCES = [
  'label_scan',
  'barcode',
  'photo_ai',
  'restaurant',
  'manual',
  'quick_log',
] as const;

export const MACRO_NAMES = [
  'calories',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
  'sugar_g',
  'sodium_mg',
] as const;

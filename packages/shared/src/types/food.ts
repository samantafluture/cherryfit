export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodSource =
  | 'label_scan'
  | 'barcode'
  | 'photo_ai'
  | 'restaurant'
  | 'manual'
  | 'quick_log';

export interface Macros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: MealType;
  source: FoodSource;
  serving_size: string;
  servings: number;
  macros: Macros;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

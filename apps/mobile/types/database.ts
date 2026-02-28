import type { MealType, FoodSource } from '@cherryfit/shared';

export interface LocalFoodLog {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: MealType;
  source: FoodSource;
  serving_size: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  photo_url: string | null;
  ai_confidence: number | null;
  fitbit_synced: number;
  synced: number;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface LocalFoodItem {
  id: string;
  user_id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  serving_size: string;
  is_favorite: number;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface LocalDailyGoal {
  id: string;
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodLogInput {
  food_name: string;
  meal_type: MealType;
  source: FoodSource;
  serving_size: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  photo_url?: string | null;
  ai_confidence?: number | null;
  logged_at?: string;
}

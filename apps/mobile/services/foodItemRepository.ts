import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { LocalFoodItem } from '../types/database';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function saveFoodItem(item: {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  serving_size?: string;
}): Promise<LocalFoodItem> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO food_database (
      id, user_id, barcode, name, brand,
      calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
      serving_size, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    DEFAULT_USER_ID,
    item.barcode ?? null,
    item.name,
    item.brand ?? null,
    item.calories,
    item.protein_g,
    item.carbs_g,
    item.fat_g,
    item.fiber_g ?? null,
    item.sugar_g ?? null,
    item.sodium_mg ?? null,
    item.serving_size ?? '1 serving',
    now,
    now,
  );

  return {
    id,
    user_id: DEFAULT_USER_ID,
    barcode: item.barcode ?? null,
    name: item.name,
    brand: item.brand ?? null,
    calories: item.calories,
    protein_g: item.protein_g,
    carbs_g: item.carbs_g,
    fat_g: item.fat_g,
    fiber_g: item.fiber_g ?? null,
    sugar_g: item.sugar_g ?? null,
    sodium_mg: item.sodium_mg ?? null,
    serving_size: item.serving_size ?? '1 serving',
    is_favorite: 0,
    use_count: 0,
    created_at: now,
    updated_at: now,
  };
}

export async function getRecentFoodItems(limit: number = 20): Promise<LocalFoodItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalFoodItem>(
    'SELECT * FROM food_database ORDER BY updated_at DESC LIMIT ?',
    limit,
  );
}

export async function getFavoriteFoodItems(): Promise<LocalFoodItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalFoodItem>(
    'SELECT * FROM food_database WHERE is_favorite = 1 ORDER BY use_count DESC',
  );
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE food_database SET is_favorite = ?, updated_at = ? WHERE id = ?',
    isFavorite ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export async function incrementUseCount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE food_database SET use_count = use_count + 1, updated_at = ? WHERE id = ?',
    new Date().toISOString(),
    id,
  );
}

export async function searchFoodItems(query: string): Promise<LocalFoodItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalFoodItem>(
    'SELECT * FROM food_database WHERE name LIKE ? OR brand LIKE ? ORDER BY use_count DESC LIMIT 50',
    `%${query}%`,
    `%${query}%`,
  );
}

export async function findByBarcode(barcode: string): Promise<LocalFoodItem | null> {
  const db = await getDatabase();
  return db.getFirstAsync<LocalFoodItem>(
    'SELECT * FROM food_database WHERE barcode = ?',
    barcode,
  );
}

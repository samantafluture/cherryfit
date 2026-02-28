import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { LocalFoodLog, CreateFoodLogInput } from '../types/database';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

function generateId(): string {
  return Crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

export async function createFoodLog(input: CreateFoodLogInput): Promise<LocalFoodLog> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();
  const loggedAt = input.logged_at ?? now;

  await db.runAsync(
    `INSERT INTO food_logs (
      id, user_id, food_name, meal_type, source, serving_size, servings,
      calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
      photo_url, ai_confidence, logged_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    DEFAULT_USER_ID,
    input.food_name,
    input.meal_type,
    input.source,
    input.serving_size,
    input.servings,
    input.calories,
    input.protein_g,
    input.carbs_g,
    input.fat_g,
    input.fiber_g,
    input.sugar_g,
    input.sodium_mg,
    input.photo_url ?? null,
    input.ai_confidence ?? null,
    loggedAt,
    now,
    now,
  );

  return {
    id,
    user_id: DEFAULT_USER_ID,
    food_name: input.food_name,
    meal_type: input.meal_type,
    source: input.source,
    serving_size: input.serving_size,
    servings: input.servings,
    calories: input.calories,
    protein_g: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g,
    fiber_g: input.fiber_g,
    sugar_g: input.sugar_g,
    sodium_mg: input.sodium_mg,
    photo_url: input.photo_url ?? null,
    ai_confidence: input.ai_confidence ?? null,
    fitbit_synced: 0,
    synced: 0,
    logged_at: loggedAt,
    created_at: now,
    updated_at: now,
  };
}

export async function getFoodLogsByDate(date: string): Promise<LocalFoodLog[]> {
  const db = await getDatabase();
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  return db.getAllAsync<LocalFoodLog>(
    `SELECT * FROM food_logs
     WHERE logged_at >= ? AND logged_at <= ?
     ORDER BY logged_at ASC`,
    startOfDay,
    endOfDay,
  );
}

export async function updateFoodLog(
  id: string,
  updates: Partial<CreateFoodLogInput>,
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value as string | number | null);
  }

  fields.push('updated_at = ?');
  values.push(now);

  fields.push('synced = ?');
  values.push(0);

  values.push(id);

  await db.runAsync(
    `UPDATE food_logs SET ${fields.join(', ')} WHERE id = ?`,
    ...values,
  );
}

export async function deleteFoodLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM food_logs WHERE id = ?', id);
}

export async function getUnsyncedFoodLogs(): Promise<LocalFoodLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalFoodLog>(
    'SELECT * FROM food_logs WHERE synced = 0 ORDER BY created_at ASC',
  );
}

export async function markFoodLogsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE food_logs SET synced = 1 WHERE id IN (${placeholders})`,
    ...ids,
  );
}

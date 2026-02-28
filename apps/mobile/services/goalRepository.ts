import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { LocalDailyGoal } from '../types/database';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_GOALS: Omit<LocalDailyGoal, 'id' | 'created_at' | 'updated_at'> = {
  user_id: DEFAULT_USER_ID,
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fat_g: 67,
  fiber_g: 30,
  sugar_g: 50,
  sodium_mg: 2300,
};

export async function getDailyGoal(): Promise<LocalDailyGoal> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<LocalDailyGoal>(
    'SELECT * FROM daily_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    DEFAULT_USER_ID,
  );

  if (existing) return existing;

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO daily_goals (
      id, user_id, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    DEFAULT_GOALS.user_id,
    DEFAULT_GOALS.calories,
    DEFAULT_GOALS.protein_g,
    DEFAULT_GOALS.carbs_g,
    DEFAULT_GOALS.fat_g,
    DEFAULT_GOALS.fiber_g,
    DEFAULT_GOALS.sugar_g,
    DEFAULT_GOALS.sodium_mg,
    now,
    now,
  );

  return { id, ...DEFAULT_GOALS, created_at: now, updated_at: now };
}

export async function updateDailyGoal(updates: {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
}): Promise<LocalDailyGoal> {
  const current = await getDailyGoal();
  const db = await getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value as string | number | null);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(current.id);

  await db.runAsync(
    `UPDATE daily_goals SET ${fields.join(', ')} WHERE id = ?`,
    ...values,
  );

  return { ...current, ...updates, updated_at: now };
}

import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { LocalHealthMetric, HealthMetricType } from '../types/database';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function saveHealthMetric(
  metricType: HealthMetricType,
  value: number,
  recordedAt: string,
  source: string = 'health_connect',
): Promise<LocalHealthMetric> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO health_metrics (id, user_id, metric_type, value, recorded_at, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    DEFAULT_USER_ID,
    metricType,
    value,
    recordedAt,
    source,
    now,
  );

  return {
    id,
    user_id: DEFAULT_USER_ID,
    metric_type: metricType,
    value,
    recorded_at: recordedAt,
    source,
    synced: 0,
    created_at: now,
  };
}

export async function getHealthMetricsByDateRange(
  metricType: HealthMetricType,
  startDate: string,
  endDate: string,
): Promise<LocalHealthMetric[]> {
  const db = await getDatabase();
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  return db.getAllAsync<LocalHealthMetric>(
    `SELECT * FROM health_metrics
     WHERE metric_type = ? AND recorded_at >= ? AND recorded_at <= ?
     ORDER BY recorded_at ASC`,
    metricType,
    start,
    end,
  );
}

export async function getLatestMetric(
  metricType: HealthMetricType,
): Promise<LocalHealthMetric | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<LocalHealthMetric>(
    `SELECT * FROM health_metrics
     WHERE metric_type = ?
     ORDER BY recorded_at DESC
     LIMIT 1`,
    metricType,
  );
  return result ?? null;
}

export async function getTodayMetric(
  metricType: HealthMetricType,
): Promise<LocalHealthMetric | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0] as string;
  const start = `${today}T00:00:00.000Z`;
  const end = `${today}T23:59:59.999Z`;

  const result = await db.getFirstAsync<LocalHealthMetric>(
    `SELECT * FROM health_metrics
     WHERE metric_type = ? AND recorded_at >= ? AND recorded_at <= ?
     ORDER BY recorded_at DESC
     LIMIT 1`,
    metricType,
    start,
    end,
  );
  return result ?? null;
}

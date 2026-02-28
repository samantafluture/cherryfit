import { getDatabase } from './database';
import { trpcClient } from './api';

interface UnsyncedLog {
  id: string;
  food_name: string;
  fitbit_synced: number;
}

export async function getUnsyncedForFitbit(): Promise<UnsyncedLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<UnsyncedLog>(
    `SELECT id, food_name, fitbit_synced FROM food_logs
     WHERE fitbit_synced = 0 AND synced = 1
     ORDER BY logged_at ASC
     LIMIT 50`,
  );
}

export async function syncToFitbit(): Promise<{ synced: number; total: number }> {
  const unsynced = await getUnsyncedForFitbit();

  if (unsynced.length === 0) {
    return { synced: 0, total: 0 };
  }

  const logIds = unsynced.map((l) => l.id);
  const result = await trpcClient.health.syncFoodToFitbit.mutate({ logIds });

  // Mark locally as fitbit_synced
  if (result.synced > 0) {
    const db = await getDatabase();
    const syncedIds = logIds.slice(0, result.synced);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE food_logs SET fitbit_synced = 1 WHERE id IN (${placeholders})`,
      ...syncedIds,
    );
  }

  return result;
}

import { getUnsyncedFoodLogs, markFoodLogsSynced } from './foodLogRepository';
import { trpcClient } from './api';

export async function syncFoodLogs(): Promise<{ synced: number; failed: number }> {
  const unsynced = await getUnsyncedFoodLogs();

  if (unsynced.length === 0) {
    return { synced: 0, failed: 0 };
  }

  try {
    const result = await trpcClient.food.syncBatch.mutate({
      logs: unsynced.map((log) => ({
        id: log.id,
        food_name: log.food_name,
        meal_type: log.meal_type,
        source: log.source,
        serving_size: log.serving_size,
        servings: log.servings,
        calories: log.calories,
        protein_g: log.protein_g,
        carbs_g: log.carbs_g,
        fat_g: log.fat_g,
        fiber_g: log.fiber_g,
        sugar_g: log.sugar_g,
        sodium_mg: log.sodium_mg,
        photo_url: log.photo_url,
        ai_confidence: log.ai_confidence,
        logged_at: log.logged_at,
        created_at: log.created_at,
        updated_at: log.updated_at,
      })),
    });

    if (result.synced.length > 0) {
      await markFoodLogsSynced(result.synced);
    }

    return { synced: result.synced.length, failed: result.failed };
  } catch {
    // Silently fail — will retry on next sync cycle
    return { synced: 0, failed: unsynced.length };
  }
}

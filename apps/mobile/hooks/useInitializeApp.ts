import { useEffect, useState } from 'react';
import { getDatabase } from '../services/database';
import { useFoodStore } from '../stores/useFoodStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useHealthStore } from '../stores/useHealthStore';

export function useInitializeApp(): { isReady: boolean } {
  const [isReady, setIsReady] = useState(false);
  const loadTodayLogs = useFoodStore((s) => s.loadTodayLogs);
  const loadGoals = useGoalStore((s) => s.loadGoals);
  const loadTodayMetrics = useHealthStore((s) => s.loadTodayMetrics);

  useEffect(() => {
    async function init(): Promise<void> {
      await getDatabase();
      await Promise.all([loadTodayLogs(), loadGoals(), loadTodayMetrics()]);
      setIsReady(true);
    }
    init();
  }, [loadTodayLogs, loadGoals, loadTodayMetrics]);

  return { isReady };
}

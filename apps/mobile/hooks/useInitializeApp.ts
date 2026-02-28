import { useEffect, useState } from 'react';
import { getDatabase } from '../services/database';
import { useFoodStore } from '../stores/useFoodStore';
import { useGoalStore } from '../stores/useGoalStore';

export function useInitializeApp(): { isReady: boolean } {
  const [isReady, setIsReady] = useState(false);
  const loadTodayLogs = useFoodStore((s) => s.loadTodayLogs);
  const loadGoals = useGoalStore((s) => s.loadGoals);

  useEffect(() => {
    async function init(): Promise<void> {
      await getDatabase();
      await Promise.all([loadTodayLogs(), loadGoals()]);
      setIsReady(true);
    }
    init();
  }, [loadTodayLogs, loadGoals]);

  return { isReady };
}

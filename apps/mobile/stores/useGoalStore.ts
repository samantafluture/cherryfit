import { create } from 'zustand';
import type { LocalDailyGoal } from '../types/database';
import { getDailyGoal, updateDailyGoal } from '../services/goalRepository';

interface GoalStoreState {
  goals: LocalDailyGoal | null;
  isLoading: boolean;
  loadGoals: () => Promise<void>;
  updateGoals: (updates: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number | null;
    sugar_g?: number | null;
    sodium_mg?: number | null;
  }) => Promise<void>;
}

export const useGoalStore = create<GoalStoreState>((set) => ({
  goals: null,
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true });
    const goals = await getDailyGoal();
    set({ goals, isLoading: false });
  },

  updateGoals: async (updates) => {
    const updated = await updateDailyGoal(updates);
    set({ goals: updated });
  },
}));

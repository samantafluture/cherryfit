import { create } from 'zustand';
import type { LocalFoodLog, CreateFoodLogInput } from '../types/database';
import {
  createFoodLog,
  getFoodLogsByDate,
  updateFoodLog,
  deleteFoodLog,
} from '../services/foodLogRepository';

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

interface FoodStoreState {
  todayLogs: LocalFoodLog[];
  isLoading: boolean;
  selectedDate: string;
  loadLogsForDate: (date: string) => Promise<void>;
  loadTodayLogs: () => Promise<void>;
  addFoodLog: (input: CreateFoodLogInput) => Promise<LocalFoodLog>;
  updateLog: (id: string, updates: Partial<CreateFoodLogInput>) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
}

export const useFoodStore = create<FoodStoreState>((set, get) => ({
  todayLogs: [],
  isLoading: false,
  selectedDate: todayDateString(),

  loadLogsForDate: async (date: string) => {
    set({ isLoading: true, selectedDate: date });
    const logs = await getFoodLogsByDate(date);
    set({ todayLogs: logs, isLoading: false });
  },

  loadTodayLogs: async () => {
    const date = todayDateString();
    set({ isLoading: true, selectedDate: date });
    const logs = await getFoodLogsByDate(date);
    set({ todayLogs: logs, isLoading: false });
  },

  addFoodLog: async (input: CreateFoodLogInput) => {
    const newLog = await createFoodLog(input);
    const { selectedDate } = get();
    const logDate = newLog.logged_at.split('T')[0];
    if (logDate === selectedDate) {
      set((state) => ({ todayLogs: [...state.todayLogs, newLog] }));
    }
    return newLog;
  },

  updateLog: async (id: string, updates: Partial<CreateFoodLogInput>) => {
    await updateFoodLog(id, updates);
    const { selectedDate, loadLogsForDate } = get();
    await loadLogsForDate(selectedDate);
  },

  removeLog: async (id: string) => {
    await deleteFoodLog(id);
    set((state) => ({
      todayLogs: state.todayLogs.filter((log) => log.id !== id),
    }));
  },
}));

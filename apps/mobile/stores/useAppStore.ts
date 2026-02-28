import { create } from 'zustand';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface AppStoreState {
  selectedDate: string;
  syncStatus: SyncStatus;
  isOnline: boolean;
  setSelectedDate: (date: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setIsOnline: (online: boolean) => void;
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export const useAppStore = create<AppStoreState>((set) => ({
  selectedDate: todayDateString(),
  syncStatus: 'idle',
  isOnline: true,

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),
  setIsOnline: (online: boolean) => set({ isOnline: online }),
}));

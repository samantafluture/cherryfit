/**
 * Mock Health Connect service for Expo Go testing.
 * Returns demo data so UI can be developed without a dev build.
 */

export interface HealthConnectData {
  steps: number;
  sleepMinutes: number;
  restingHr: number;
  activeMinutes: number;
  caloriesBurned: number;
}

export function isHealthConnectAvailable(): boolean {
  return false;
}

export async function requestPermissions(): Promise<boolean> {
  // Mock: always returns true
  return true;
}

export async function readTodayData(): Promise<HealthConnectData> {
  // Return realistic demo data
  return {
    steps: 8432,
    sleepMinutes: 452, // ~7.5 hrs
    restingHr: 62,
    activeMinutes: 34,
    caloriesBurned: 1840,
  };
}

export async function readSteps(_startDate: string, _endDate: string): Promise<number> {
  return 8432;
}

export async function readSleepMinutes(_startDate: string, _endDate: string): Promise<number> {
  return 452;
}

export async function readRestingHeartRate(): Promise<number> {
  return 62;
}

export async function readActiveMinutes(_startDate: string, _endDate: string): Promise<number> {
  return 34;
}

export async function readCaloriesBurned(_startDate: string, _endDate: string): Promise<number> {
  return 1840;
}

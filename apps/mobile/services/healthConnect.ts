/**
 * Real Health Connect service.
 * Uses react-native-health-connect for Android Health Connect API.
 * Only works in dev builds, NOT in Expo Go.
 */

import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export interface HealthConnectData {
  steps: number;
  sleepMinutes: number;
  restingHr: number;
  activeMinutes: number;
  caloriesBurned: number;
}

const PERMISSIONS = [
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'SleepSession' as const },
  { accessType: 'read' as const, recordType: 'HeartRate' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
];

let initialized = false;

export async function isHealthConnectAvailable(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function initializeHealthConnect(): Promise<boolean> {
  if (initialized) return true;
  try {
    const result = await initialize();
    initialized = result;
    return result;
  } catch {
    return false;
  }
}

export async function requestPermissions(): Promise<boolean> {
  try {
    // Safety net: ensure initialized before requesting permissions
    await initializeHealthConnect();
    const granted = await requestPermission(PERMISSIONS);
    return granted.length > 0;
  } catch {
    return false;
  }
}

function todayRange(): { startTime: string; endTime: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    startTime: start.toISOString(),
    endTime: now.toISOString(),
  };
}

export async function readTodaySteps(): Promise<number> {
  try {
    const { startTime, endTime } = todayRange();
    const result = await readRecords('Steps', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });

    return result.records.reduce((total, record) => total + record.count, 0);
  } catch {
    return 0;
  }
}

export async function readSleepMinutes(): Promise<number> {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0); // From 6 PM yesterday

    const result = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: yesterday.toISOString(),
        endTime: now.toISOString(),
      },
    });

    let totalMinutes = 0;
    for (const session of result.records) {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      totalMinutes += (end - start) / 60000;
    }
    return Math.round(totalMinutes);
  } catch {
    return 0;
  }
}

export async function readRestingHeartRate(): Promise<number> {
  try {
    const { startTime, endTime } = todayRange();
    const result = await readRecords('HeartRate', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });

    if (result.records.length === 0) return 0;

    const allBpms: number[] = [];
    for (const record of result.records) {
      for (const sample of record.samples) {
        allBpms.push(sample.beatsPerMinute);
      }
    }

    if (allBpms.length === 0) return 0;
    // Resting HR ≈ lowest 20th percentile average
    allBpms.sort((a, b) => a - b);
    const cutoff = Math.max(1, Math.floor(allBpms.length * 0.2));
    const restingBpms = allBpms.slice(0, cutoff);
    return Math.round(restingBpms.reduce((a, b) => a + b, 0) / restingBpms.length);
  } catch {
    return 0;
  }
}

export async function readActiveMinutes(): Promise<number> {
  try {
    const { startTime, endTime } = todayRange();
    const result = await readRecords('ExerciseSession', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });

    let totalMinutes = 0;
    for (const session of result.records) {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      totalMinutes += (end - start) / 60000;
    }
    return Math.round(totalMinutes);
  } catch {
    return 0;
  }
}

export async function readCaloriesBurned(): Promise<number> {
  try {
    const { startTime, endTime } = todayRange();
    const result = await readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });

    return Math.round(
      result.records.reduce((total, record) => total + record.energy.inKilocalories, 0),
    );
  } catch {
    return 0;
  }
}

export async function readTodayData(): Promise<HealthConnectData> {
  const [steps, sleepMinutes, restingHr, activeMinutes, caloriesBurned] = await Promise.all([
    readTodaySteps(),
    readSleepMinutes(),
    readRestingHeartRate(),
    readActiveMinutes(),
    readCaloriesBurned(),
  ]);

  return { steps, sleepMinutes, restingHr, activeMinutes, caloriesBurned };
}

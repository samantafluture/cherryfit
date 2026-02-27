export type HealthMetricType =
  | 'steps'
  | 'sleep_minutes'
  | 'heart_rate_resting'
  | 'heart_rate_avg'
  | 'active_minutes'
  | 'calories_burned'
  | 'weight_kg'
  | 'body_fat_percent';

export interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: HealthMetricType;
  value: number;
  recorded_at: string;
  source: string;
  created_at: string;
}

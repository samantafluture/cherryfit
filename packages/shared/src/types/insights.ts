export type InsightCategory =
  | 'nutrition'
  | 'recovery'
  | 'trend_alert'
  | 'goal_progress'
  | 'blood_test';

export interface AiInsight {
  id: string;
  user_id: string;
  category: InsightCategory;
  title: string;
  body: string;
  data_references: Record<string, unknown>;
  generated_at: string;
  created_at: string;
}

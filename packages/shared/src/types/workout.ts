export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  exercises: Array<{
    exercise_id: string;
    order: number;
    target_sets: number;
    target_reps: string;
    rest_seconds: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  sets: WorkoutSet[];
  created_at: string;
  updated_at: string;
}

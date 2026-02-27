import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  jsonb,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);

export const foodSourceEnum = pgEnum('food_source', [
  'label_scan',
  'barcode',
  'photo_ai',
  'restaurant',
  'manual',
  'quick_log',
]);

export const healthMetricTypeEnum = pgEnum('health_metric_type', [
  'steps',
  'sleep_minutes',
  'heart_rate_resting',
  'heart_rate_avg',
  'active_minutes',
  'calories_burned',
  'weight_kg',
  'body_fat_percent',
]);

export const insightCategoryEnum = pgEnum('insight_category', [
  'nutrition',
  'recovery',
  'trend_alert',
  'goal_progress',
  'blood_test',
]);

// Tables
export const foodLogs = pgTable('food_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  source: foodSourceEnum('source').notNull(),
  foodName: varchar('food_name', { length: 255 }).notNull(),
  calories: decimal('calories', { precision: 8, scale: 2 }).notNull(),
  proteinG: decimal('protein_g', { precision: 8, scale: 2 }).notNull(),
  carbsG: decimal('carbs_g', { precision: 8, scale: 2 }).notNull(),
  fatG: decimal('fat_g', { precision: 8, scale: 2 }).notNull(),
  fiberG: decimal('fiber_g', { precision: 8, scale: 2 }),
  sugarG: decimal('sugar_g', { precision: 8, scale: 2 }),
  sodiumMg: decimal('sodium_mg', { precision: 8, scale: 2 }),
  servingSize: varchar('serving_size', { length: 100 }).notNull(),
  servings: decimal('servings', { precision: 5, scale: 2 }).notNull().default('1'),
  photoUrl: varchar('photo_url', { length: 500 }),
  fitbitSynced: boolean('fitbit_synced').notNull().default(false),
  aiConfidence: decimal('ai_confidence', { precision: 4, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const foodDatabase = pgTable('food_database', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  barcode: varchar('barcode', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 255 }),
  defaultMacros: jsonb('default_macros').notNull(),
  isFavorite: boolean('is_favorite').notNull().default(false),
  useCount: integer('use_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workoutTemplates = pgTable('workout_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  exercises: jsonb('exercises').notNull(),
  muscleGroups: text('muscle_groups').array(),
  estimatedDuration: integer('estimated_duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  templateId: uuid('template_id'),
  name: varchar('name', { length: 255 }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  exerciseName: varchar('exercise_name', { length: 255 }).notNull(),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weightKg: decimal('weight_kg', { precision: 6, scale: 2 }),
  restSeconds: integer('rest_seconds'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bloodTests = pgTable('blood_tests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  testDate: date('test_date').notNull(),
  labName: varchar('lab_name', { length: 255 }),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  parsedResults: jsonb('parsed_results').notNull(),
  aiAnalysis: text('ai_analysis'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const healthMetrics = pgTable('health_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  metricType: healthMetricTypeEnum('metric_type').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  category: insightCategoryEnum('category').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  dataReferences: jsonb('data_references'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dailyGoals = pgTable('daily_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  calories: decimal('calories', { precision: 8, scale: 2 }).notNull(),
  proteinG: decimal('protein_g', { precision: 8, scale: 2 }).notNull(),
  carbsG: decimal('carbs_g', { precision: 8, scale: 2 }).notNull(),
  fatG: decimal('fat_g', { precision: 8, scale: 2 }).notNull(),
  fiberG: decimal('fiber_g', { precision: 8, scale: 2 }),
  sugarG: decimal('sugar_g', { precision: 8, scale: 2 }),
  sodiumMg: decimal('sodium_mg', { precision: 8, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

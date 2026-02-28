import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('cherryfit.db');
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
      food_name TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      source TEXT NOT NULL CHECK (source IN ('label_scan', 'barcode', 'photo_ai', 'restaurant', 'manual', 'quick_log')),
      serving_size TEXT NOT NULL,
      servings REAL NOT NULL DEFAULT 1,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      fiber_g REAL,
      sugar_g REAL,
      sodium_mg REAL,
      photo_url TEXT,
      ai_confidence REAL,
      fitbit_synced INTEGER NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      logged_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS food_database (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
      barcode TEXT,
      name TEXT NOT NULL,
      brand TEXT,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      fiber_g REAL,
      sugar_g REAL,
      sodium_mg REAL,
      serving_size TEXT NOT NULL DEFAULT '1 serving',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      use_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      fiber_g REAL,
      sugar_g REAL,
      sodium_mg REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON food_logs(logged_at);
    CREATE INDEX IF NOT EXISTS idx_food_logs_meal_type ON food_logs(meal_type);
    CREATE INDEX IF NOT EXISTS idx_food_logs_synced ON food_logs(synced);
    CREATE INDEX IF NOT EXISTS idx_food_database_barcode ON food_database(barcode);
    CREATE INDEX IF NOT EXISTS idx_food_database_use_count ON food_database(use_count DESC);

    CREATE TABLE IF NOT EXISTS health_metrics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
      metric_type TEXT NOT NULL CHECK (metric_type IN (
        'steps', 'sleep_minutes', 'heart_rate_resting', 'heart_rate_avg',
        'active_minutes', 'calories_burned', 'weight_kg', 'body_fat_percent'
      )),
      value REAL NOT NULL,
      recorded_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'health_connect',
      synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_health_metrics_type_date ON health_metrics(metric_type, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_health_metrics_synced ON health_metrics(synced);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

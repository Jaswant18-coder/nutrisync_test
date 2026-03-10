-- ============================================================
-- NutriSync — Cloudflare D1 Schema
-- Run this via the Cloudflare dashboard D1 console, or
-- via: `npm run migrate` (calls the seed/migrate script).
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password         TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'doctor',
  patient_id       TEXT,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id                    TEXT PRIMARY KEY,
  patient_id            TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  age                   INTEGER NOT NULL,
  gender                TEXT NOT NULL,
  room_number           TEXT,
  ward                  TEXT,
  height                REAL NOT NULL,
  weight                REAL NOT NULL,
  bmi                   REAL NOT NULL,
  bmi_category          TEXT NOT NULL,
  bmr                   REAL NOT NULL,
  activity_level        TEXT NOT NULL DEFAULT 'sedentary',
  diagnosis             TEXT NOT NULL DEFAULT '[]',  -- JSON array
  allergies             TEXT NOT NULL DEFAULT '[]',  -- JSON array
  dietary_restrictions  TEXT NOT NULL DEFAULT '[]',  -- JSON array
  food_preferences      TEXT NOT NULL DEFAULT '[]',  -- JSON array
  current_diet_type     TEXT NOT NULL DEFAULT 'regular',
  texture               TEXT NOT NULL DEFAULT 'regular',
  nutrition_targets     TEXT NOT NULL DEFAULT '{}',  -- JSON object
  admission_date        TEXT NOT NULL,
  discharge_date        TEXT,
  phone                 TEXT,
  is_active             INTEGER NOT NULL DEFAULT 1,
  doctor_id             TEXT NOT NULL,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  category          TEXT NOT NULL,
  unit              TEXT NOT NULL DEFAULT 'g',
  calories_per_100  REAL NOT NULL DEFAULT 0,
  protein_per_100   REAL NOT NULL DEFAULT 0,
  carbs_per_100     REAL NOT NULL DEFAULT 0,
  fat_per_100       REAL NOT NULL DEFAULT 0,
  sodium_per_100    REAL NOT NULL DEFAULT 0,
  potassium_per_100 REAL NOT NULL DEFAULT 0,
  fiber_per_100     REAL NOT NULL DEFAULT 0,
  stock_qty         REAL NOT NULL DEFAULT 0,
  stock_unit        TEXT NOT NULL DEFAULT 'kg',
  reorder_level     REAL NOT NULL DEFAULT 5,
  is_available      INTEGER NOT NULL DEFAULT 1,
  is_vegetarian     INTEGER NOT NULL DEFAULT 0,
  is_vegan          INTEGER NOT NULL DEFAULT 0,
  is_gluten_free    INTEGER NOT NULL DEFAULT 0,
  common_allergen   TEXT NOT NULL DEFAULT '[]',  -- JSON array
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id              TEXT PRIMARY KEY,
  patient_id      TEXT NOT NULL,
  diet_group_id   TEXT,
  week_start_date TEXT NOT NULL,
  week_end_date   TEXT NOT NULL,
  days            TEXT NOT NULL DEFAULT '[]',  -- JSON array of day plans
  status          TEXT NOT NULL DEFAULT 'draft',
  generated_by    TEXT NOT NULL DEFAULT 'manual',
  ai_prompt_used  TEXT,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_tracking (
  id                      TEXT PRIMARY KEY,
  patient_id              TEXT NOT NULL,
  meal_plan_id            TEXT NOT NULL,
  date                    TEXT NOT NULL,
  consumption             TEXT NOT NULL DEFAULT '[]',  -- JSON array
  total_calories_consumed REAL NOT NULL DEFAULT 0,
  total_protein_consumed  REAL NOT NULL DEFAULT 0,
  total_carbs_consumed    REAL NOT NULL DEFAULT 0,
  total_fat_consumed      REAL NOT NULL DEFAULT 0,
  compliance_score        REAL NOT NULL DEFAULT 0,
  has_alert               INTEGER NOT NULL DEFAULT 0,
  alert_message           TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL,
  UNIQUE(patient_id, date)
);

CREATE TABLE IF NOT EXISTS diet_groups (
  id                TEXT PRIMARY KEY,
  group_code        TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  diet_type         TEXT NOT NULL,
  texture           TEXT NOT NULL DEFAULT 'regular',
  calorie_range_min REAL NOT NULL DEFAULT 0,
  calorie_range_max REAL NOT NULL DEFAULT 0,
  restrictions      TEXT NOT NULL DEFAULT '[]',  -- JSON array
  preference_type   TEXT NOT NULL DEFAULT 'non-vegetarian',
  members           TEXT NOT NULL DEFAULT '[]',  -- JSON array
  base_meal_plan_id TEXT,
  ward              TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL,
  patient_name      TEXT NOT NULL,
  message           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'new',       -- new | acknowledged | considered | responded
  response          TEXT,
  responded_by      TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL,
  role              TEXT NOT NULL,              -- user | assistant
  content           TEXT NOT NULL,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kitchen_order_status (
  id         TEXT PRIMARY KEY,
  group_code TEXT NOT NULL,
  meal_type  TEXT NOT NULL,
  date       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',   -- pending | preparing | done
  updated_at TEXT NOT NULL,
  UNIQUE(group_code, meal_type, date)
);

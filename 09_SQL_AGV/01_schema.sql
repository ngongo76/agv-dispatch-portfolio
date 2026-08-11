-- Schema AGV Dispatch System — chuyển thể từ 06_DataModel_AGV.md
-- Dialect: SQLite (dễ chạy thử, tương thích gần như 1-1 với PostgreSQL)

CREATE TABLE zone (
  zone_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('storage','staging','charging','restricted','packing','shipping')),
  x REAL NOT NULL,
  y REAL NOT NULL,
  restricted_flag INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE robot (
  robot_id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('idle','moving','picking','delivering','charging','error','unknown')),
  battery_level REAL NOT NULL,
  current_zone_id TEXT REFERENCES zone(zone_id),
  current_task_id TEXT,
  last_maintenance_date TEXT,
  last_telemetry_at TEXT NOT NULL
);

CREATE TABLE app_user (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator','manager','technician')),
  email TEXT UNIQUE
);

CREATE TABLE task (
  task_id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('transport','return-to-charge')),
  priority TEXT NOT NULL CHECK (priority IN ('normal','urgent')),
  status TEXT NOT NULL CHECK (status IN ('pending','assigned','in-progress','paused','on-hold','exception','completed','failed')),
  source TEXT NOT NULL CHECK (source IN ('manual','wms','ai-agent')),
  pickup_zone_id TEXT NOT NULL REFERENCES zone(zone_id),
  dropoff_zone_id TEXT NOT NULL REFERENCES zone(zone_id),
  assigned_robot_id TEXT REFERENCES robot(robot_id),
  created_by_user_id TEXT REFERENCES app_user(user_id),
  created_at TEXT NOT NULL,
  assigned_at TEXT,
  completed_at TEXT,
  deadline TEXT
);

CREATE TABLE path_segment (
  segment_id TEXT PRIMARY KEY,
  from_zone_id TEXT NOT NULL REFERENCES zone(zone_id),
  to_zone_id TEXT NOT NULL REFERENCES zone(zone_id),
  distance REAL NOT NULL,
  occupancy_status TEXT NOT NULL CHECK (occupancy_status IN ('free','occupied','blocked')),
  occupied_by_robot_id TEXT REFERENCES robot(robot_id)
);

CREATE TABLE charging_station (
  station_id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES zone(zone_id),
  status TEXT NOT NULL CHECK (status IN ('available','occupied')),
  current_robot_id TEXT REFERENCES robot(robot_id)
);

CREATE TABLE telemetry_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  robot_id TEXT NOT NULL REFERENCES robot(robot_id),
  ts TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  battery_level REAL NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('normal','obstacle-detected','battery-low','comm-timeout','error'))
);

CREATE TABLE exception_event (
  event_id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES task(task_id),
  robot_id TEXT REFERENCES robot(robot_id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  raised_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution_status TEXT NOT NULL CHECK (resolution_status IN ('open','resolved','escalated'))
);

CREATE TABLE maintenance_record (
  record_id TEXT PRIMARY KEY,
  robot_id TEXT NOT NULL REFERENCES robot(robot_id),
  technician_id TEXT REFERENCES app_user(user_id),
  issue_type TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  resolved_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('reported','in-progress','resolved'))
);

CREATE INDEX idx_task_status_priority ON task(status, priority, created_at);
CREATE INDEX idx_robot_status_zone ON robot(status, current_zone_id);

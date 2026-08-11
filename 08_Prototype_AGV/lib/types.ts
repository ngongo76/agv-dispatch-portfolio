// Kiểu dữ liệu lõi — ánh xạ trực tiếp từ 06_DataModel_AGV.md

export type RobotStatus =
  | "idle"
  | "moving"
  | "picking"
  | "delivering"
  | "charging"
  | "error"
  | "unknown";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in-progress"
  | "paused"
  | "on-hold"
  | "exception"
  | "completed"
  | "failed";

export type TaskPriority = "normal" | "urgent";
export type TaskSource = "manual" | "wms" | "ai-agent";

export interface Zone {
  zone_id: string;
  name: string;
  zone_type: "storage" | "staging" | "charging" | "restricted" | "packing" | "shipping";
  x: number;
  y: number;
  restricted_flag: boolean;
}

export interface Robot {
  robot_id: string;
  model: string;
  status: RobotStatus;
  battery_level: number; // 0-100
  x: number;
  y: number;
  current_zone_id: string;
  current_task_id: string | null;
  target_zone_id: string | null;
  progress: number; // 0-1 tiến độ di chuyển giữa 2 điểm
  last_telemetry_at: string;
}

export interface Task {
  task_id: string;
  type: "transport" | "return-to-charge";
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  pickup_zone_id: string;
  dropoff_zone_id: string;
  assigned_robot_id: string | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  note?: string;
}

export interface ExceptionEvent {
  event_id: string;
  task_id: string | null;
  robot_id: string | null;
  type:
    | "battery-depleted"
    | "priority-preemption"
    | "path-blocked"
    | "scheduling-conflict";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  raised_at: string;
}

export interface SimState {
  zones: Zone[];
  robots: Robot[];
  tasks: Task[];
  events: ExceptionEvent[];
  tick: number;
}

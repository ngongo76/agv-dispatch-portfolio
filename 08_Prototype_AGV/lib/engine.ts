// Engine mô phỏng — hiện thực hóa BR-02, BR-04, BR-05, BR-06 (FR-B, FR-E, FR-F, FR-G)
// Lưu ý: state lưu trong bộ nhớ tiến trình Next.js (in-memory singleton), chỉ dùng cho demo.
// Trong hệ thống thật, đây sẽ là service backend riêng + database (xem 06_DataModel_AGV.md).

import { Zone, Robot, Task, ExceptionEvent, SimState, TaskPriority, TaskSource } from "./types";

const BATTERY_DRAIN_PER_TICK = 3.2; // % pin tiêu hao mỗi tick khi di chuyển
const BATTERY_CHARGE_PER_TICK = 14; // % pin nạp mỗi tick khi sạc
const BATTERY_SAFETY_MARGIN = 12; // % biên an toàn cộng thêm (FR-E1)
const PROGRESS_STEP = 0.22; // tốc độ di chuyển giữa 2 zone mỗi tick
const MIN_IDLE_BATTERY_TO_ASSIGN = 20; // % tối thiểu để nhận task mới

function nowIso() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

const ZONES: Zone[] = [
  { zone_id: "STORAGE-A", name: "Kho lưu trữ A", zone_type: "storage", x: 8, y: 12, restricted_flag: false },
  { zone_id: "STORAGE-B", name: "Kho lưu trữ B", zone_type: "storage", x: 8, y: 48, restricted_flag: false },
  { zone_id: "PACKING", name: "Khu đóng gói", zone_type: "packing", x: 50, y: 12, restricted_flag: false },
  { zone_id: "SHIPPING", name: "Khu xuất hàng", zone_type: "shipping", x: 50, y: 48, restricted_flag: false },
  { zone_id: "CHARGE-1", name: "Trạm sạc 1", zone_type: "charging", x: 92, y: 12, restricted_flag: false },
  { zone_id: "CHARGE-2", name: "Trạm sạc 2", zone_type: "charging", x: 92, y: 48, restricted_flag: false },
];

function zoneById(id: string): Zone {
  const z = ZONES.find((z) => z.zone_id === id);
  if (!z) throw new Error(`Unknown zone ${id}`);
  return z;
}

function distance(aZoneId: string, bZoneId: string): number {
  const a = zoneById(aZoneId);
  const b = zoneById(bZoneId);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestChargeZone(zoneId: string): Zone {
  const charges = ZONES.filter((z) => z.zone_type === "charging");
  return charges.reduce((best, z) =>
    distance(zoneId, z.zone_id) < distance(zoneId, best.zone_id) ? z : best
  , charges[0]);
}

// --- Trạng thái ban đầu (mô phỏng minh họa) ---
function initialState(): SimState {
  const robots: Robot[] = [
    mkRobot("AGV-01", "STORAGE-A", 82),
    mkRobot("AGV-02", "PACKING", 65),
    mkRobot("AGV-03", "CHARGE-1", 95),
    mkRobot("AGV-04", "STORAGE-B", 26), // pin thấp sẵn để minh họa EX1 nhanh trong demo
  ];
  return { zones: ZONES, robots, tasks: [], events: [], tick: 0 };
}

function mkRobot(id: string, zoneId: string, battery: number): Robot {
  const z = zoneById(zoneId);
  return {
    robot_id: id,
    model: "AGV-Standard-1",
    status: "idle",
    battery_level: battery,
    x: z.x,
    y: z.y,
    current_zone_id: zoneId,
    current_task_id: null,
    target_zone_id: null,
    progress: 0,
    last_telemetry_at: nowIso(),
  };
}

// Singleton toàn cục (giữ nguyên qua các lần gọi API trong cùng tiến trình dev server)
const globalAny = global as unknown as { __agvState?: SimState };
if (!globalAny.__agvState) {
  globalAny.__agvState = initialState();
}
const state = globalAny.__agvState;

function logEvent(ev: Omit<ExceptionEvent, "event_id" | "raised_at">) {
  state.events.unshift({ ...ev, event_id: genId("EVT"), raised_at: nowIso() });
  state.events = state.events.slice(0, 30);
}

// FR-A1/FR-A2 — tạo task (thủ công, WMS, hoặc AI Dispatcher)
export function createTask(
  pickup_zone_id: string,
  dropoff_zone_id: string,
  priority: TaskPriority,
  source: TaskSource,
  note?: string
): Task {
  if (!ZONES.find((z) => z.zone_id === pickup_zone_id)) {
    throw new Error(`Khu vực lấy hàng "${pickup_zone_id}" không tồn tại`);
  }
  if (!ZONES.find((z) => z.zone_id === dropoff_zone_id)) {
    throw new Error(`Khu vực giao hàng "${dropoff_zone_id}" không tồn tại`);
  }
  if (pickup_zone_id === dropoff_zone_id) {
    throw new Error("Điểm lấy và điểm giao không được trùng nhau");
  }
  const task: Task = {
    task_id: genId("TASK"),
    type: "transport",
    priority,
    status: "pending",
    source,
    pickup_zone_id,
    dropoff_zone_id,
    assigned_robot_id: null,
    created_at: nowIso(),
    assigned_at: null,
    completed_at: null,
    note,
  };
  state.tasks.unshift(task);
  return task;
}

// FR-E1 — ngưỡng pin an toàn động
function dynamicBatteryThreshold(robotZoneId: string, task: Task): number {
  const legToPickup = distance(robotZoneId, task.pickup_zone_id);
  const legToDropoff = distance(task.pickup_zone_id, task.dropoff_zone_id);
  const nearestCharge = nearestChargeZone(task.dropoff_zone_id);
  const legToCharge = distance(task.dropoff_zone_id, nearestCharge.zone_id);
  const totalDistance = legToPickup + legToDropoff + legToCharge;
  // quy đổi khoảng cách sang % pin dùng cùng hệ số tiêu hao
  const batteryNeeded = (totalDistance / (PROGRESS_STEP * 60)) * BATTERY_DRAIN_PER_TICK;
  return Math.min(90, batteryNeeded + BATTERY_SAFETY_MARGIN);
}

// FR-B1 — chọn robot phù hợp nhất cho 1 task
function pickBestRobot(task: Task): Robot | null {
  const candidates = state.robots.filter(
    (r) => r.status === "idle" && r.battery_level >= MIN_IDLE_BATTERY_TO_ASSIGN
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const da = distance(a.current_zone_id, task.pickup_zone_id);
    const db = distance(b.current_zone_id, task.pickup_zone_id);
    if (Math.abs(da - db) > 0.01) return da - db;
    return b.battery_level - a.battery_level;
  });
  return candidates[0];
}

// EX4/FR-G2-G4 — chèn ưu tiên khẩn cấp khi không có robot idle
function tryPreempt(task: Task): Robot | null {
  const preemptable = state.robots.filter(
    (r) =>
      r.status === "moving" &&
      r.current_task_id &&
      r.progress < 0.5 &&
      state.tasks.find(
        (t) => t.task_id === r.current_task_id && t.status === "assigned" && t.priority === "normal"
      )
  );
  if (preemptable.length === 0) return null;
  const robot = preemptable[0];
  const oldTask = state.tasks.find((t) => t.task_id === robot.current_task_id)!;
  oldTask.status = "pending";
  oldTask.assigned_robot_id = null;
  oldTask.assigned_at = null;
  logEvent({
    task_id: oldTask.task_id,
    robot_id: robot.robot_id,
    type: "priority-preemption",
    severity: "medium",
    message: `Task ${oldTask.task_id} (normal) bị hoãn để robot ${robot.robot_id} nhận task khẩn ${task.task_id}`,
  });
  robot.progress = 0;
  return robot;
}

function assignRobotToTask(robot: Robot, task: Task) {
  task.status = "assigned";
  task.assigned_robot_id = robot.robot_id;
  task.assigned_at = nowIso();
  robot.status = "moving";
  robot.current_task_id = task.task_id;
  robot.target_zone_id = task.pickup_zone_id;
  robot.progress = 0;
}

// FR-B2/FR-B3 — vòng lặp điều phối chính, chạy mỗi tick
function dispatchLoop() {
  const pending = state.tasks
    .filter((t) => t.status === "pending")
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
      return a.created_at.localeCompare(b.created_at);
    });

  for (const task of pending) {
    const robot = pickBestRobot(task);
    if (robot) {
      assignRobotToTask(robot, task);
      continue;
    }
    if (task.priority === "urgent") {
      const preempted = tryPreempt(task);
      if (preempted) {
        assignRobotToTask(preempted, task);
      }
    }
  }
}

// FR-E2/EX1 — kiểm tra pin trong lúc robot đang thực thi
function batteryGuard(robot: Robot) {
  if (robot.status !== "moving" || !robot.current_task_id) return;
  const task = state.tasks.find((t) => t.task_id === robot.current_task_id);
  if (!task) return;
  const threshold = dynamicBatteryThreshold(robot.current_zone_id, task);
  if (robot.battery_level < threshold) {
    const chargeZone = nearestChargeZone(robot.current_zone_id);
    const canReachCharge =
      robot.battery_level > (distance(robot.current_zone_id, chargeZone.zone_id) / (PROGRESS_STEP * 60)) * BATTERY_DRAIN_PER_TICK;

    task.status = "paused";
    task.assigned_robot_id = null;
    task.assigned_at = null;
    robot.current_task_id = null;

    if (canReachCharge) {
      robot.status = "moving";
      robot.target_zone_id = chargeZone.zone_id;
      robot.progress = 0;
      (robot as any)._returning_to_charge = true;
      logEvent({
        task_id: task.task_id,
        robot_id: robot.robot_id,
        type: "battery-depleted",
        severity: "high",
        message: `${robot.robot_id} pin thấp (${robot.battery_level.toFixed(0)}%) — tạm dừng task ${task.task_id}, quay về ${chargeZone.name}`,
      });
    } else {
      robot.status = "error";
      logEvent({
        task_id: task.task_id,
        robot_id: robot.robot_id,
        type: "battery-depleted",
        severity: "critical",
        message: `${robot.robot_id} không đủ pin về trạm sạc — cần can thiệp thủ công`,
      });
    }
    task.status = "pending"; // đưa lại hàng đợi cho robot khác (FR-E3)
  }
}

function movementStep(robot: Robot) {
  if (robot.status !== "moving" || !robot.target_zone_id) return;
  robot.progress += PROGRESS_STEP;
  robot.battery_level = Math.max(0, robot.battery_level - BATTERY_DRAIN_PER_TICK);

  const from = zoneById(robot.current_zone_id);
  const to = zoneById(robot.target_zone_id);
  const t = Math.min(1, robot.progress);
  robot.x = from.x + (to.x - from.x) * t;
  robot.y = from.y + (to.y - from.y) * t;

  if (robot.progress >= 1) {
    robot.current_zone_id = robot.target_zone_id;
    robot.progress = 0;

    if ((robot as any)._returning_to_charge) {
      (robot as any)._returning_to_charge = false;
      robot.status = "charging";
      robot.target_zone_id = null;
      return;
    }

    const task = robot.current_task_id
      ? state.tasks.find((t) => t.task_id === robot.current_task_id)
      : null;

    if (task && task.status === "assigned" && robot.current_zone_id === task.pickup_zone_id) {
      robot.status = "picking";
      return;
    }
    if (task && task.status === "in-progress" && robot.current_zone_id === task.dropoff_zone_id) {
      task.status = "completed";
      task.completed_at = nowIso();
      robot.status = "idle";
      robot.current_task_id = null;
      robot.target_zone_id = null;
      return;
    }
    robot.status = "idle";
  }
}

function pickingStep(robot: Robot) {
  if (robot.status !== "picking" || !robot.current_task_id) return;
  const task = state.tasks.find((t) => t.task_id === robot.current_task_id);
  if (!task) {
    robot.status = "idle";
    return;
  }
  task.status = "in-progress";
  robot.status = "moving";
  robot.target_zone_id = task.dropoff_zone_id;
  robot.progress = 0;
}

function chargingStep(robot: Robot) {
  if (robot.status !== "charging") return;
  robot.battery_level = Math.min(100, robot.battery_level + BATTERY_CHARGE_PER_TICK);
  if (robot.battery_level >= 90) {
    robot.status = "idle";
  }
}

export function tick(): SimState {
  state.tick += 1;
  for (const robot of state.robots) {
    robot.last_telemetry_at = nowIso();
    batteryGuard(robot);
    movementStep(robot);
    pickingStep(robot);
    chargingStep(robot);
  }
  dispatchLoop();
  return state;
}

export function getState(): SimState {
  return state;
}

export function getZones(): Zone[] {
  return ZONES;
}

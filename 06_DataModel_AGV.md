# Data Model chi tiết — Hệ thống điều phối AGV

| | |
|---|---|
| **Phiên bản** | 1.0 |
| **Tác giả** | Kevin Ngo — Business Analyst (portfolio project) |
| **Ngày** | 11/08/2026 |
| **File ERD kèm theo** | `05_ERD_AGV.drawio` (mở bằng draw.io/diagrams.net), `05_ERD_preview.png` |

Tài liệu này chuẩn hóa data model sơ bộ ở `AGV_Nghiep_vu_Dao_sau.md` thành data dictionary đầy đủ kiểu dữ liệu, ràng buộc, và ví dụ JSON — dùng làm input trực tiếp cho việc thiết kế database của prototype.

---

## 1. Robot

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| robot_id | VARCHAR(20) | PK | Ví dụ: `AGV-001` |
| model | VARCHAR(50) | NOT NULL | |
| status | ENUM | NOT NULL, default `idle` | idle, moving, picking, delivering, charging, error, unknown |
| battery_level | DECIMAL(5,2) | 0–100 | % |
| current_x, current_y | DECIMAL(10,2) | NOT NULL | Tọa độ trên bản đồ kho |
| current_zone_id | VARCHAR(20) | FK → Zone.zone_id | |
| current_task_id | VARCHAR(20) | FK → Task.task_id, NULLABLE | |
| last_maintenance_date | DATE | NULLABLE | |
| last_telemetry_at | TIMESTAMP | NOT NULL | Dùng để phát hiện mất kết nối (EX5) |

**Index đề xuất:** `status`, `current_zone_id` (truy vấn robot khả dụng nhanh — FR-B1)

## 2. Task

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| task_id | VARCHAR(20) | PK | |
| type | ENUM | NOT NULL | transport, return-to-charge |
| priority | ENUM | NOT NULL, default `normal` | normal, urgent |
| status | ENUM | NOT NULL, default `pending` | pending, assigned, in-progress, paused, on-hold, exception, completed, failed |
| source | ENUM | NOT NULL | manual, wms, ai-agent |
| pickup_zone_id | VARCHAR(20) | FK → Zone.zone_id | |
| dropoff_zone_id | VARCHAR(20) | FK → Zone.zone_id | |
| assigned_robot_id | VARCHAR(20) | FK → Robot.robot_id, NULLABLE | |
| created_by_user_id | VARCHAR(20) | FK → User.user_id, NULLABLE | NULL nếu tạo tự động từ WMS/AI |
| created_at | TIMESTAMP | NOT NULL | |
| assigned_at | TIMESTAMP | NULLABLE | |
| completed_at | TIMESTAMP | NULLABLE | |
| deadline | TIMESTAMP | NULLABLE | |

**Index đề xuất:** `status + priority + created_at` (phục vụ truy vấn hàng đợi điều phối — FR-B1/FR-B2)

## 3. Zone

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| zone_id | VARCHAR(20) | PK | |
| name | VARCHAR(50) | NOT NULL | |
| zone_type | ENUM | NOT NULL | storage, staging, charging, restricted, intersection |
| x, y, width, height | DECIMAL(10,2) | NOT NULL | Vùng hình chữ nhật trên bản đồ |
| capacity | INT | NULLABLE | Số robot tối đa cùng lúc (nếu áp dụng) |
| restricted_flag | BOOLEAN | NOT NULL, default false | Dùng cho EX7 |

## 4. PathSegment

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| segment_id | VARCHAR(20) | PK | |
| from_zone_id | VARCHAR(20) | FK → Zone.zone_id | |
| to_zone_id | VARCHAR(20) | FK → Zone.zone_id | |
| distance | DECIMAL(10,2) | NOT NULL | |
| occupancy_status | ENUM | NOT NULL, default `free` | free, occupied, blocked |
| occupied_by_robot_id | VARCHAR(20) | FK → Robot.robot_id, NULLABLE | Dùng cho mutex EX3/FR-F1 |

## 5. ChargingStation

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| station_id | VARCHAR(20) | PK | |
| zone_id | VARCHAR(20) | FK → Zone.zone_id | |
| status | ENUM | NOT NULL, default `available` | available, occupied |
| current_robot_id | VARCHAR(20) | FK → Robot.robot_id, NULLABLE | |

## 6. TelemetryLog

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| log_id | BIGINT | PK, auto-increment | Volume cao — cân nhắc partition theo ngày |
| robot_id | VARCHAR(20) | FK → Robot.robot_id | |
| timestamp | TIMESTAMP | NOT NULL | |
| x, y | DECIMAL(10,2) | NOT NULL | |
| battery_level | DECIMAL(5,2) | NOT NULL | |
| event_type | ENUM | NOT NULL, default `normal` | normal, obstacle-detected, battery-low, comm-timeout, error |

## 7. ExceptionEvent

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| event_id | VARCHAR(20) | PK | |
| task_id | VARCHAR(20) | FK → Task.task_id, NULLABLE | |
| robot_id | VARCHAR(20) | FK → Robot.robot_id, NULLABLE | |
| type | ENUM | NOT NULL | battery-depleted, path-blocked, scheduling-conflict, priority-preemption, comm-lost, sensor-fault, zone-restricted |
| severity | ENUM | NOT NULL | low, medium, high, critical |
| raised_at | TIMESTAMP | NOT NULL | |
| resolved_at | TIMESTAMP | NULLABLE | |
| resolution_status | ENUM | NOT NULL, default `open` | open, resolved, escalated |

## 8. MaintenanceRecord

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| record_id | VARCHAR(20) | PK | |
| robot_id | VARCHAR(20) | FK → Robot.robot_id | |
| technician_id | VARCHAR(20) | FK → User.user_id, NULLABLE | |
| issue_type | VARCHAR(100) | NOT NULL | |
| reported_at | TIMESTAMP | NOT NULL | |
| resolved_at | TIMESTAMP | NULLABLE | |
| status | ENUM | NOT NULL, default `reported` | reported, in-progress, resolved |

## 9. User

| Field | Type | Ràng buộc | Ghi chú |
|---|---|---|---|
| user_id | VARCHAR(20) | PK | |
| name | VARCHAR(100) | NOT NULL | |
| role | ENUM | NOT NULL | operator, manager, technician |
| email | VARCHAR(100) | UNIQUE | |

---

## 10. Ví dụ JSON (API tạo task — FR-A2)

```json
{
  "task_id": "TASK-2026-00123",
  "type": "transport",
  "priority": "urgent",
  "status": "pending",
  "source": "wms",
  "pickup_zone_id": "ZONE-STORAGE-04",
  "dropoff_zone_id": "ZONE-PACKING-01",
  "created_by_user_id": null,
  "created_at": "2026-08-11T09:30:00+07:00",
  "deadline": "2026-08-11T10:00:00+07:00"
}
```

## 11. Ví dụ JSON (Telemetry robot — FR-D1)

```json
{
  "robot_id": "AGV-003",
  "timestamp": "2026-08-11T09:31:02+07:00",
  "x": 152.4,
  "y": 88.7,
  "battery_level": 34.5,
  "status": "moving",
  "current_task_id": "TASK-2026-00123",
  "event_type": "normal"
}
```

---

**Sơ đồ ERD trực quan:** xem `05_ERD_AGV.drawio` (editable) hoặc `05_ERD_preview.png` (ảnh xem nhanh).

**Bước tiếp theo:** dùng schema này làm input thiết kế database cho prototype (khuyến nghị SQLite/PostgreSQL cho demo — đủ để thể hiện quan hệ, không cần NoSQL).

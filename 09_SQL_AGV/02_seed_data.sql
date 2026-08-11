-- Dữ liệu mẫu — mô phỏng 1 ngày vận hành, dùng để test các câu query ở 03_queries.sql

INSERT INTO zone VALUES
 ('STORAGE-A','Kho lưu trữ A','storage',8,12,0),
 ('STORAGE-B','Kho lưu trữ B','storage',8,48,0),
 ('PACKING','Khu đóng gói','packing',50,12,0),
 ('SHIPPING','Khu xuất hàng','shipping',50,48,0),
 ('CHARGE-1','Trạm sạc 1','charging',92,12,0),
 ('CHARGE-2','Trạm sạc 2','charging',92,48,0);

INSERT INTO app_user VALUES
 ('U1','Nguyen Van A','operator','a.nguyen@agv.local'),
 ('U2','Tran Thi B','manager','b.tran@agv.local'),
 ('U3','Le Van C','technician','c.le@agv.local');

INSERT INTO robot (robot_id, model, status, battery_level, current_zone_id, current_task_id, last_maintenance_date, last_telemetry_at) VALUES
 ('AGV-01','AGV-Standard-1','idle',82,'STORAGE-A',NULL,'2026-07-20','2026-08-11T09:00:00'),
 ('AGV-02','AGV-Standard-1','moving',48,'PACKING','TASK-1003','2026-07-15','2026-08-11T09:00:05'),
 ('AGV-03','AGV-Standard-1','idle',95,'CHARGE-1',NULL,'2026-07-28','2026-08-11T09:00:02'),
 ('AGV-04','AGV-Standard-1','charging',26,'CHARGE-2',NULL,'2026-06-30','2026-08-11T09:00:01');

INSERT INTO task (task_id,type,priority,status,source,pickup_zone_id,dropoff_zone_id,assigned_robot_id,created_by_user_id,created_at,assigned_at,completed_at,deadline) VALUES
 ('TASK-1001','transport','normal','completed','manual','STORAGE-A','PACKING','AGV-01','U1','2026-08-11T07:50:00','2026-08-11T07:50:10','2026-08-11T08:02:00',NULL),
 ('TASK-1002','transport','urgent','completed','ai-agent','STORAGE-B','SHIPPING','AGV-03','U1','2026-08-11T08:10:00','2026-08-11T08:10:05','2026-08-11T08:25:00','2026-08-11T08:30:00'),
 ('TASK-1003','transport','normal','in-progress','wms',  'STORAGE-A','PACKING','AGV-02','U2','2026-08-11T08:55:00','2026-08-11T08:55:03',NULL,NULL),
 ('TASK-1004','transport','urgent','pending','manual','STORAGE-B','SHIPPING',NULL,'U1','2026-08-11T09:01:00',NULL,NULL,'2026-08-11T09:15:00'),
 ('TASK-1005','transport','normal','pending','wms','STORAGE-A','SHIPPING',NULL,NULL,'2026-08-11T08:40:00',NULL,NULL,NULL),
 ('TASK-1006','transport','normal','paused','manual','STORAGE-B','SHIPPING','AGV-04','U1','2026-08-11T08:20:00','2026-08-11T08:20:05',NULL,NULL);

INSERT INTO exception_event VALUES
 ('EVT-1','TASK-1006','AGV-04','battery-depleted','high','2026-08-11T08:31:00',NULL,'open'),
 ('EVT-2',NULL,'AGV-02','path-blocked','medium','2026-08-11T08:58:00','2026-08-11T08:59:10','resolved');

INSERT INTO maintenance_record VALUES
 ('MR-1','AGV-04','U3','Pin xuống cấp nhanh hơn định mức','2026-08-05T10:00:00','2026-08-05T15:00:00','resolved');

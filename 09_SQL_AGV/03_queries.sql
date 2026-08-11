-- Các câu query minh họa cách BA dùng SQL để trả lời câu hỏi vận hành thực tế
-- (mỗi query có comment nêu rõ câu hỏi nghiệp vụ nó trả lời)

-- Q1: Những task nào đang chờ gán quá 10 phút? (phục vụ FR-B2 — cảnh báo quản lý)
SELECT task_id, priority, pickup_zone_id, dropoff_zone_id, created_at
FROM task
WHERE status = 'pending'
  AND (strftime('%s','2026-08-11T09:15:00') - strftime('%s', created_at)) > 600
ORDER BY priority DESC, created_at;

-- Q2: Robot nào đang có pin dưới 30% và đang làm nhiệm vụ (rủi ro EX1 - hết pin giữa đường)?
SELECT r.robot_id, r.battery_level, r.status, t.task_id, t.dropoff_zone_id
FROM robot r
LEFT JOIN task t ON t.task_id = r.current_task_id
WHERE r.battery_level < 30 AND r.status != 'idle';

-- Q3: Tỷ lệ hoàn thành task theo mức ưu tiên trong ngày
SELECT priority,
       COUNT(*) AS total_task,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 1) AS completion_rate_pct
FROM task
GROUP BY priority;

-- Q4: Thời gian xử lý trung bình (từ lúc tạo đến khi hoàn thành) theo từng robot
SELECT assigned_robot_id AS robot_id,
       COUNT(*) AS completed_tasks,
       ROUND(AVG((strftime('%s', completed_at) - strftime('%s', created_at)) / 60.0), 1) AS avg_minutes
FROM task
WHERE status = 'completed'
GROUP BY assigned_robot_id;

-- Q5: Top khu vực (zone) phát sinh nhiều task lấy hàng nhất — phục vụ phân tích luồng hàng hóa
SELECT pickup_zone_id, COUNT(*) AS num_tasks
FROM task
GROUP BY pickup_zone_id
ORDER BY num_tasks DESC;

-- Q6: Danh sách sự kiện ngoại lệ đang mở (chưa xử lý), sắp theo mức độ nghiêm trọng
SELECT e.event_id, e.type, e.severity, e.robot_id, e.task_id, e.raised_at
FROM exception_event e
WHERE e.resolution_status = 'open'
ORDER BY CASE e.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END;

-- Q7: Robot nào đang có yêu cầu bảo trì chưa xử lý xong, không nên gán task mới (FR-J3)
SELECT r.robot_id, m.issue_type, m.status, m.reported_at
FROM robot r
JOIN maintenance_record m ON m.robot_id = r.robot_id
WHERE m.status IN ('reported','in-progress');

-- Q8: Số lượng task theo nguồn tạo (manual / wms / ai-agent) — đánh giá mức độ tự động hóa
SELECT source, COUNT(*) AS num_tasks
FROM task
GROUP BY source
ORDER BY num_tasks DESC;

-- Q9: Danh sách robot đang rảnh (idle) đủ điều kiện nhận task mới ngay bây giờ, sắp theo pin giảm dần
SELECT robot_id, battery_level, current_zone_id
FROM robot
WHERE status = 'idle' AND battery_level >= 20
ORDER BY battery_level DESC;

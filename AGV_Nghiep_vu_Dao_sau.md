# Đào sâu nghiệp vụ AGV — Hệ thống robot vận chuyển tự hành trong kho

> Portfolio project — ứng tuyển vị trí Business Analyst, đơn vị robotics Viettel
> Giai đoạn: đào sâu use case / actor / exception flow trước khi viết SRS/FRD và dựng prototype

---

## 1. Bối cảnh & phạm vi

Hệ thống AGV (Automated Guided Vehicle) vận chuyển hàng hóa giữa các khu vực trong kho/nhà máy (lưu trữ, đóng gói, xuất hàng) mà không cần người lái. Phạm vi phân tích bao gồm: tạo yêu cầu vận chuyển, điều phối và gán task cho robot, robot thực thi (di chuyển — lấy hàng — giao hàng), giám sát real-time, quản lý pin/sạc, xử lý ngoại lệ vận hành, và bảo trì.

Ngoài phạm vi (out of scope) ở giai đoạn này: thiết kế cơ khí robot, thuật toán path-planning chi tiết (SLAM, A*...), tích hợp phần cứng cảm biến thực tế — chỉ mô hình hóa ở mức nghiệp vụ/luồng dữ liệu.

---

## 2. Actors & Stakeholders

| Actor | Loại | Vai trò chính |
|---|---|---|
| Nhân viên kho (Warehouse Operator) | Con người, chính | Tạo yêu cầu vận chuyển thủ công, xác nhận nhận/giao hàng, xử lý sự cố tại chỗ |
| Hệ thống WMS/ERP | Hệ thống ngoài | Tự động sinh đơn vận chuyển từ đơn hàng/kế hoạch sản xuất, gửi qua API |
| Dispatch System (bộ điều phối) | Hệ thống lõi | Nhận task, chọn robot phù hợp, gán task, giải quyết xung đột lịch/đường đi |
| AGV Robot | Thiết bị/actor chính | Thực thi task: di chuyển, lấy hàng, giao hàng, báo cáo trạng thái/pin |
| Kỹ thuật viên bảo trì (Maintenance Technician) | Con người | Nhận báo lỗi, sửa chữa, cập nhật trạng thái robot sau bảo trì |
| Quản lý kho/vận hành (Operations Manager) | Con người | Giám sát toàn cục, override thủ công, duyệt ưu tiên đặc biệt, xem báo cáo |
| Trạm sạc (Charging Station) | Tài nguyên/actor phụ | Cấp nguồn, báo trạng thái available/occupied |
| AI Dispatcher Agent | Hệ thống mở rộng (điểm nhấn prototype) | Nhận yêu cầu bằng ngôn ngữ tự nhiên, diễn giải thành task, đề xuất gán robot |

Ghi chú: Dispatch System và AI Dispatcher Agent là hai actor hệ thống khác nhau — AI Agent là lớp giao tiếp ngôn ngữ tự nhiên nằm phía trước, cuối cùng vẫn tạo task và gọi Dispatch System để gán.

---

## 3. Use Case Diagram (mô tả để vẽ trên Draw.io/Lucidchart)

**Nhóm 1 — Vòng đời task:**
- UC1: Tạo yêu cầu vận chuyển
- UC2: Điều phối & gán task cho robot
- UC3: Robot di chuyển đến điểm lấy hàng
- UC4: Robot lấy hàng
- UC5: Robot di chuyển đến điểm giao hàng
- UC6: Robot giao hàng & xác nhận hoàn thành

**Nhóm 2 — Vận hành & giám sát:**
- UC7: Giám sát vị trí & trạng thái đội robot real-time
- UC8: Quản lý pin & tự động về trạm sạc
- UC13: Override thủ công / dừng khẩn cấp

**Nhóm 3 — Ngoại lệ (extend các UC ở nhóm 1):**
- UC9: Xử lý va chạm/tắc nghẽn đường đi
- UC10: Chèn ưu tiên khẩn cấp (Priority Preemption)
- UC11: Báo lỗi & yêu cầu bảo trì

**Nhóm 4 — Bảo trì:**
- UC12: Thực hiện bảo trì robot

**Nhóm 5 — Mở rộng AI (điểm nhấn prototype):**
- UC14: Ra lệnh cho AI Dispatcher bằng ngôn ngữ tự nhiên

**Quan hệ include/extend:**
- UC2 `<<include>>` UC7 — phải biết trạng thái/vị trí/pin của tất cả robot mới chọn được robot phù hợp
- UC9, UC10, UC11 `<<extend>>` UC3/UC5 — chỉ kích hoạt khi có điều kiện bất thường trong lúc robot đang di chuyển
- UC8 `<<extend>>` UC3/UC4/UC5/UC6 — kích hoạt khi pin xuống dưới ngưỡng bất kỳ lúc nào đang thực thi
- UC11 `<<include>>` gọi tới UC12 (tạo yêu cầu, kỹ thuật viên xử lý ở UC12)
- UC14 `<<include>>` UC1 và UC2 — AI Agent tạo task rồi vẫn đi qua đúng luồng điều phối chuẩn (không bypass logic nghiệp vụ)

---

## 4. Đặc tả chính (main flow) cho các Use Case cốt lõi

### UC1 — Tạo yêu cầu vận chuyển
- **Actor chính:** Nhân viên kho / WMS (hệ thống)
- **Tiền điều kiện:** Người dùng đã đăng nhập / WMS đã xác thực API
- **Luồng chính:**
  1. Actor cung cấp: điểm lấy hàng, điểm giao hàng, loại hàng, mức ưu tiên (thường/gấp), deadline (nếu có)
  2. Hệ thống validate: điểm lấy/giao có tồn tại trong bản đồ kho, không trùng điểm, hàng có nằm trong tải trọng cho phép của AGV
  3. Hệ thống tạo Task với trạng thái `pending`, gán `task_id`
  4. Task được đẩy vào hàng đợi của Dispatch System
- **Hậu điều kiện:** Task tồn tại ở trạng thái `pending`, sẵn sàng để UC2 xử lý
- **Business rule:** Task từ WMS mặc định ưu tiên `normal` trừ khi có cờ `urgent` đi kèm đơn hàng gốc

### UC2 — Điều phối & gán task cho robot
- **Actor chính:** Dispatch System
- **Tiền điều kiện:** Có ít nhất 1 task `pending`, có dữ liệu real-time của toàn bộ robot (UC7)
- **Luồng chính:**
  1. Dispatch System lấy task có ưu tiên cao nhất / đến trước trong hàng đợi
  2. Lọc robot khả dụng: trạng thái `idle`, pin ≥ ngưỡng tối thiểu để hoàn thành round-trip ước tính
  3. Chọn robot theo tiêu chí: khoảng cách gần nhất đến điểm lấy hàng, sau đó đến mức pin cao hơn
  4. Gán task cho robot, chuyển trạng thái task → `assigned`, robot → `moving`
  5. Gửi lệnh di chuyển đến robot (kích hoạt UC3)
- **Hậu điều kiện:** Task `assigned`, robot bắt đầu di chuyển
- **Ngoại lệ liên quan:** Không có robot khả dụng → task giữ `pending`, hệ thống cảnh báo Operations Manager nếu chờ quá X phút

### UC7 — Giám sát vị trí & trạng thái đội robot real-time
- **Actor chính:** Robot (nguồn dữ liệu) → hiển thị cho Quản lý/Dispatch System
- **Luồng chính:** Robot gửi telemetry định kỳ (vị trí x/y, pin, trạng thái, task hiện tại) → hệ thống cập nhật bảng trạng thái đội robot → hiển thị trên dashboard
- **Business rule:** Nếu không nhận được telemetry sau N giây → kích hoạt UC (mất kết nối, xem mục 5 EX5)

---

## 5. Exception / Alternate Flows chi tiết

### EX1 — Hết pin giữa đường (Battery Depleted Mid-Route)
- **Trigger:** Pin robot giảm xuống dưới ngưỡng an toàn (ví dụ 15%) trong lúc đang thực thi task
- **Luồng xử lý:**
  1. Robot phát cảnh báo pin thấp kèm vị trí hiện tại
  2. Dispatch System kiểm tra: robot có đủ pin về trạm sạc gần nhất không?
     - Nếu đủ: robot tạm dừng task hiện tại (task → `paused`), di chuyển về trạm sạc gần nhất
     - Nếu không đủ (trường hợp hiếm, lỗi dự báo pin): robot dừng tại chỗ, phát cảnh báo khẩn, yêu cầu can thiệp thủ công
  3. Task bị `paused` được Dispatch System gán lại (re-assign) cho robot khác nếu có, hoặc giữ hàng đợi ưu tiên chờ chính robot đó quay lại
  4. Sau khi sạc đủ ngưỡng tối thiểu, robot quay về trạng thái `idle`, sẵn sàng nhận task mới
- **Business rule:** Ngưỡng pin an toàn phải được tính động theo khoảng cách còn lại của task + khoảng cách từ điểm hiện tại đến trạm sạc gần nhất, không phải hằng số cố định

### EX2 — Tắc đường / phát hiện chướng ngại vật (Path Blocked / Obstacle Detected)
- **Trigger:** Cảm biến robot phát hiện vật cản (người, hàng hóa rơi, robot khác đứng yên) trên đường đi
- **Luồng xử lý:**
  1. Robot dừng khẩn cấp trong bán kính an toàn
  2. Robot thử tìm đường đi thay thế (nếu bản đồ cho phép reroute cục bộ)
     - Có đường thay thế: robot đổi lộ trình, tiếp tục task, ghi log sự kiện
     - Không có đường thay thế trong X giây: robot báo cáo Dispatch System
  3. Dispatch System đánh dấu tạm thời segment đường bị chặn là `unavailable`, tính lại route cho robot (và các robot khác đang dùng chung segment)
  4. Nếu chặn kéo dài quá ngưỡng (ví dụ 5 phút) → cảnh báo Operations Manager để xử lý vật lý
- **Business rule:** Robot không tự ý đi vòng qua khu vực chưa được xác nhận an toàn trong bản đồ (an toàn > tốc độ)

### EX3 — Xung đột lịch giữa nhiều task / deadlock giao lộ (Scheduling Conflict / Intersection Deadlock)
- **Trigger:** Hai hoặc nhiều robot cùng có nhu cầu đi qua một segment/giao lộ hẹp tại cùng thời điểm
- **Luồng xử lý:**
  1. Dispatch System (hoặc traffic controller module) phát hiện xung đột trước khi robot vào segment, dựa trên lịch di chuyển dự kiến
  2. Áp dụng quy tắc ưu tiên: task ưu tiên cao hơn đi trước; nếu bằng ưu tiên, robot đến gần giao lộ hơn đi trước
  3. Robot còn lại nhận lệnh chờ tại điểm chờ an toàn gần nhất
  4. Sau khi giao lộ trống, robot chờ được cấp phép tiếp tục
- **Business rule:** Không cho phép 2 robot cùng chiếm 1 segment tại cùng thời điểm (mutex theo segment) — đây là quy tắc bắt buộc để tránh va chạm, không phải tùy chọn tối ưu

### EX4 — Đơn ưu tiên gấp chen ngang (Priority Task Preemption)
- **Trigger:** Task mới được tạo với cờ `urgent` trong khi các robot đều đang bận với task `normal`
- **Luồng xử lý:**
  1. Dispatch System đánh giá: có robot nào sắp hoàn thành task hiện tại (gần điểm giao hàng) không?
     - Có: chờ robot đó rảnh, gán ngay task urgent tiếp theo (không preempt giữa chừng)
     - Không: xét robot đang ở giai đoạn đầu task `normal` (mới bắt đầu di chuyển, chưa lấy hàng) → cho phép preempt: robot bỏ dở, task `normal` quay về hàng đợi với trạng thái `pending` (giữ nguyên thứ tự ưu tiên gốc), robot chuyển sang task `urgent`
  2. Task bị preempt được ghi log rõ lý do, không bị mất khỏi hệ thống
- **Business rule:** Không được preempt một robot đã lấy hàng lên (UC4 hoàn tất) — tránh việc hàng bị "treo" giữa đường; trong trường hợp này task urgent phải chờ hoặc gán robot khác đang idle dù xa hơn

### EX5 — Mất kết nối robot (Robot Connection Lost / Communication Timeout)
- **Trigger:** Không nhận được telemetry từ robot sau N giây (ví dụ 10s)
- **Luồng xử lý:**
  1. Hệ thống đánh dấu robot ở trạng thái `unknown`, ngừng gán task mới cho robot này
  2. Nếu robot đang giữ task, task được đóng băng ở trạng thái `blocked` — không tự động re-assign ngay (tránh 2 robot cùng đi lấy 1 đơn hàng nếu robot cũ thực ra vẫn đang chạy)
  3. Sau ngưỡng thời gian dài hơn (ví dụ 2 phút) không có tín hiệu → cảnh báo kỹ thuật viên đi kiểm tra vật lý, và Operations Manager có quyền override để re-assign task
- **Business rule:** Không tự động hủy/gán lại task chỉ vì mất tín hiệu ngắn hạn — cần phân biệt "mất kết nối" với "robot hỏng"

### EX6 — Lỗi cảm biến / nhận diện sai hàng khi lấy hàng (Sensor Fault / Load Mismatch)
- **Trigger:** Robot đến điểm lấy hàng nhưng cảm biến/camera không xác nhận được đúng loại hàng hoặc không phát hiện hàng
- **Luồng xử lý:**
  1. Robot chờ tại vị trí, phát cảnh báo tại chỗ (đèn/âm thanh) và gửi thông báo đến nhân viên kho gần nhất
  2. Nhân viên kho xác nhận thủ công (đặt lại hàng đúng vị trí, hoặc xác nhận bằng tay trên thiết bị di động/màn hình robot)
  3. Nếu xác nhận thành công trong X phút → robot tiếp tục UC4; nếu không → task chuyển trạng thái `exception`, cảnh báo Operations Manager
- **Business rule:** Robot không được rời điểm lấy hàng khi chưa xác nhận đúng hàng — tránh giao sai hàng

### EX7 — Khu vực tạm thời bị hạn chế (Zone Temporarily Restricted)
- **Trigger:** Khu vực trong kho được đánh dấu tạm cấm (đang dọn dẹp, có người làm việc, sự cố an toàn)
- **Luồng xử lý:**
  1. Quản lý kho đánh dấu zone là `restricted` trên hệ thống
  2. Dispatch System loại bỏ mọi route đi qua zone này khỏi tính toán, tính lại route cho robot đang trên đường nếu bị ảnh hưởng
  3. Task có điểm lấy/giao nằm trong zone bị cấm → chuyển trạng thái `on-hold`, thông báo actor tạo task
  4. Khi zone được gỡ cấm, các route/task liên quan tự động khả dụng trở lại

---

## 6. Activity Diagram — mô tả luồng để vẽ (swimlane theo actor)

### 6.1 Luồng chính (happy path) — "Từ tạo yêu cầu đến giao hàng thành công"

**Swimlane: Nhân viên kho / WMS**
1. Tạo yêu cầu vận chuyển (điểm lấy, điểm giao, ưu tiên)

**Swimlane: Dispatch System**
2. Validate yêu cầu → tạo Task (`pending`)
3. Kiểm tra danh sách robot khả dụng (đọc trạng thái real-time)
4. Chọn robot phù hợp nhất (gần nhất + đủ pin)
5. Gán task cho robot (`assigned`) → gửi lệnh di chuyển

**Swimlane: AGV Robot**
6. Di chuyển đến điểm lấy hàng
7. [Decision] Phát hiện chướng ngại vật? → Không → tiếp tục
8. Đến điểm lấy hàng, xác nhận đúng hàng, nâng/gắp hàng
9. Di chuyển đến điểm giao hàng
10. [Decision] Pin đủ để hoàn thành? → Có → tiếp tục
11. Đến điểm giao hàng, hạ hàng
12. Gửi tín hiệu xác nhận hoàn thành

**Swimlane: Dispatch System**
13. Cập nhật Task → `completed`
14. Cập nhật robot → `idle`, sẵn sàng nhận task tiếp theo

**Swimlane: Nhân viên kho (tùy chọn)**
15. Xác nhận nhận hàng tại điểm đích (nếu quy trình yêu cầu double-check)

### 6.2 Luồng ngoại lệ tiêu biểu #1 — "Hết pin giữa đường" (nhánh từ bước 10 ở trên)
- [Decision tại bước 10] Pin đủ? → **Không**
  → Robot phát cảnh báo pin thấp
  → Dispatch System kiểm tra pin có đủ về trạm sạc gần nhất không
     → Đủ: Task chuyển `paused`, robot di chuyển về trạm sạc → sạc đến ngưỡng tối thiểu → robot `idle` → Dispatch System re-assign task còn dang dở (có thể cho robot khác)
     → Không đủ: robot dừng tại chỗ, phát cảnh báo khẩn → Operations Manager can thiệp thủ công (kéo/hỗ trợ robot)

### 6.3 Luồng ngoại lệ tiêu biểu #2 — "Đơn ưu tiên gấp chen ngang" (kích hoạt song song với luồng chính đang chạy)
- WMS/Nhân viên kho tạo Task với cờ `urgent`
- Dispatch System quét đội robot đang hoạt động
  → [Decision] Có robot đang ở giai đoạn đầu task thường (chưa lấy hàng)? 
     → Có: preempt — robot dừng, task thường quay về `pending`, robot nhận task urgent, di chuyển đến điểm lấy hàng mới
     → Không: task urgent chờ trong hàng đợi ưu tiên cao nhất, được gán ngay khi có robot đầu tiên rảnh (kể cả robot mới hoàn thành task khác)

---

## 7. Data Model sơ bộ

### 7.1 Các thực thể (entities) chính

**Robot**
- `robot_id` (PK)
- `model`
- `status`: idle | moving | picking | delivering | charging | error | unknown
- `battery_level` (%)
- `current_location` (x, y, zone_id)
- `current_task_id` (FK → Task, nullable)
- `last_maintenance_date`
- `last_telemetry_at`

**Task**
- `task_id` (PK)
- `type`: transport | return-to-charge
- `priority`: normal | urgent
- `status`: pending | assigned | in-progress | paused | on-hold | exception | completed | failed
- `source`: manual | wms | ai-agent
- `pickup_zone_id` (FK → Zone)
- `dropoff_zone_id` (FK → Zone)
- `assigned_robot_id` (FK → Robot, nullable)
- `created_at`, `assigned_at`, `completed_at`
- `deadline` (nullable)

**Zone** (thuộc WarehouseMap)
- `zone_id` (PK)
- `zone_type`: storage | staging | charging | restricted | intersection
- `coordinates`
- `capacity`
- `restricted_flag` (bool)

**PathSegment**
- `segment_id` (PK)
- `from_zone_id`, `to_zone_id` (FK → Zone)
- `distance`
- `occupancy_status`: free | occupied | blocked
- `occupied_by_robot_id` (FK → Robot, nullable)

**ChargingStation**
- `station_id` (PK)
- `zone_id` (FK → Zone)
- `status`: available | occupied
- `current_robot_id` (FK → Robot, nullable)

**TelemetryLog**
- `log_id` (PK)
- `robot_id` (FK → Robot)
- `timestamp`
- `location` (x, y)
- `battery_level`
- `event_type`: normal | obstacle-detected | battery-low | comm-timeout | error

**ExceptionEvent**
- `event_id` (PK)
- `task_id` (FK → Task, nullable)
- `robot_id` (FK → Robot, nullable)
- `type`: battery-depleted | path-blocked | scheduling-conflict | priority-preemption | comm-lost | sensor-fault | zone-restricted
- `severity`: low | medium | high | critical
- `raised_at`, `resolved_at`
- `resolution_status`: open | resolved | escalated

**MaintenanceRecord**
- `record_id` (PK)
- `robot_id` (FK → Robot)
- `technician_id` (FK → User)
- `issue_type`
- `reported_at`, `resolved_at`
- `status`: reported | in-progress | resolved

**User**
- `user_id` (PK)
- `name`
- `role`: operator | manager | technician

### 7.2 Quan hệ chính
- Robot 1—N Task (một robot xử lý nhiều task theo thời gian; tại một thời điểm chỉ 1 task active)
- Robot 1—N TelemetryLog
- Robot 1—N MaintenanceRecord
- Task 1—N ExceptionEvent (một task có thể phát sinh nhiều sự kiện ngoại lệ trong vòng đời)
- Zone 1—N PathSegment (segment nối 2 zone)
- Zone 1—1 ChargingStation (một zone loại `charging` có thể chứa 1 hoặc nhiều trạm)
- User(technician) 1—N MaintenanceRecord

---

## 8. Giả định & câu hỏi mở cần chốt tiếp

1. Một robot có thể mang nhiều task/nhiều kiện hàng cùng lúc (batch/multi-load) hay chỉ 1 task tại 1 thời điểm? — hiện đang giả định **1 task/1 thời điểm** để giữ mô hình đơn giản cho portfolio; có thể ghi rõ đây là giả định trong BRD.
2. Ngưỡng pin an toàn và thời gian timeout (mất kết nối, chờ giao lộ...) — cần liệt kê thành bảng "Business Rules / Configurable Parameters" riêng trong SRS, không hard-code trong narrative.
3. AI Dispatcher Agent (UC14) có quyền tự động gán task hay chỉ đề xuất và chờ người duyệt? — quyết định này ảnh hưởng lớn đến mức độ "autonomy" thể hiện trong prototype, nên chốt sớm.
4. Có cần mô hình hóa nhiều robot với năng lực khác nhau (tải trọng, tốc độ) hay coi đội robot đồng nhất? — đồng nhất sẽ giúp scope gọn cho bản đầu tiên.

---

**Bước tiếp theo đề xuất:** dùng tài liệu này làm input để viết Business Requirements Document (bối cảnh, pain point, stakeholder) và SRS/FRD (đặc tả chức năng chi tiết theo từng UC ở mục 4–5), sau đó mới vẽ chính thức Use Case Diagram/Activity Diagram trên Draw.io và thiết kế schema DB đầy đủ từ mục 7.

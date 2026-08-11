# Software Requirements Specification (SRS) & Functional Requirements Document (FRD)
## Hệ thống điều phối AGV — Robot vận chuyển tự hành trong kho

| | |
|---|---|
| **Phiên bản** | 1.0 |
| **Tác giả** | Kevin Ngo — Business Analyst (portfolio project) |
| **Ngày** | 11/08/2026 |
| **Tài liệu nguồn** | 01_BRD_AGV.md, AGV_Nghiep_vu_Dao_sau.md |

---

## 1. Giới thiệu

### 1.1 Mục đích
Đặc tả chi tiết các yêu cầu chức năng (Functional Requirements) và phi chức năng (Non-functional Requirements) của hệ thống điều phối AGV, làm cơ sở để thiết kế kỹ thuật và xây dựng prototype.

### 1.2 Phạm vi
Bao phủ toàn bộ 14 use case đã xác định ở giai đoạn đào sâu nghiệp vụ, ánh xạ trực tiếp từ 10 yêu cầu nghiệp vụ cấp cao (BR-01 → BR-10) trong BRD.

### 1.3 Thuật ngữ & viết tắt

| Thuật ngữ | Giải thích |
|---|---|
| AGV | Automated Guided Vehicle — robot vận chuyển tự hành |
| Task | Một yêu cầu vận chuyển từ điểm A đến điểm B |
| Dispatch | Hành động chọn và gán robot cho một task |
| Zone | Khu vực trong bản đồ kho (lưu trữ, sạc, trung chuyển, cấm) |
| Segment | Đoạn đường nối hai zone, đơn vị nhỏ nhất để quản lý xung đột giao thông |
| Preemption | Việc chèn task ưu tiên cao hơn, buộc dừng/hoãn task đang chạy |
| MoSCoW | Mức ưu tiên: Must have / Should have / Could have / Won't have (giai đoạn này) |

### 1.4 Tài liệu tham chiếu
- `AGV_Nghiep_vu_Dao_sau.md` — actor, use case, exception flow, data model sơ bộ
- `01_BRD_AGV.md` — yêu cầu nghiệp vụ cấp cao BR-01 → BR-10

---

## 2. Mô tả tổng quan

### 2.1 Góc nhìn sản phẩm
Hệ thống gồm 3 lớp: (1) lớp điều phối trung tâm (Dispatch System) chạy dạng service backend, (2) lớp giao tiếp robot (giả lập trong phạm vi prototype), (3) lớp giao diện giám sát/dashboard cho người vận hành, có thêm module AI Dispatcher nhận lệnh ngôn ngữ tự nhiên.

### 2.2 Nhóm người dùng (User Classes)
- Nhân viên kho (tạo task, xác nhận giao/nhận)
- Quản lý vận hành (giám sát, override, duyệt ngoại lệ)
- Kỹ thuật viên bảo trì (xử lý sự cố phần cứng)
- Hệ thống ngoài (WMS/ERP — giao tiếp qua API)

### 2.3 Ràng buộc thiết kế
- Prototype xây dựng bằng Next.js + Anthropic API (Claude) cho module AI Dispatcher
- Dữ liệu robot/vị trí trong prototype là dữ liệu mô phỏng (simulated), không kết nối phần cứng thật
- Giao tiếp giữa các module theo mô hình event-driven ở mức khái niệm (task status thay đổi → trigger action tương ứng)

---

## 3. Yêu cầu chức năng (Functional Requirements)

Mỗi FR có mã theo module, mức ưu tiên MoSCoW, mô tả, tiêu chí chấp nhận (acceptance criteria) tóm tắt, và liên kết ngược tới BR/UC nguồn.

### Module A — Quản lý Task (nguồn: BR-01, UC1)

**FR-A1** [Must] Hệ thống phải cho phép nhân viên kho tạo task vận chuyển thủ công với các trường bắt buộc: điểm lấy hàng, điểm giao hàng, loại hàng, mức ưu tiên.
- *Acceptance:* Task không được tạo nếu thiếu điểm lấy hoặc điểm giao; hệ thống trả lỗi validation rõ ràng.

**FR-A2** [Must] Hệ thống phải cung cấp API nhận task tự động từ hệ thống WMS/ERP ngoài.
- *Acceptance:* API nhận đúng định dạng JSON quy định, phản hồi mã trạng thái xác nhận đã tạo task hoặc lỗi.

**FR-A3** [Should] Hệ thống phải validate điểm lấy/giao có tồn tại hợp lệ trong bản đồ kho trước khi tạo task.
- *Acceptance:* Task với zone không tồn tại bị từ chối, kèm thông báo lý do.

**FR-A4** [Must] Task mới luôn khởi tạo ở trạng thái `pending` và được đưa vào hàng đợi điều phối theo thứ tự ưu tiên rồi đến thời gian tạo.

### Module B — Điều phối & Gán task (nguồn: BR-02, UC2)

**FR-B1** [Must] Hệ thống phải chọn robot có trạng thái `idle`, đủ pin cho round-trip ước tính, gần điểm lấy hàng nhất để gán task.
- *Acceptance:* Với ≥2 robot idle đủ điều kiện, hệ thống chọn robot có khoảng cách ngắn nhất; nếu bằng khoảng cách, chọn robot pin cao hơn.

**FR-B2** [Must] Nếu không có robot khả dụng, task giữ trạng thái `pending` và hệ thống phải cảnh báo quản lý vận hành nếu thời gian chờ vượt ngưỡng cấu hình.

**FR-B3** [Must] Khi gán task thành công, hệ thống cập nhật task → `assigned`, robot → `moving`, và gửi lệnh di chuyển đến robot.

### Module C — Thực thi task trên robot (nguồn: UC3–UC6)

**FR-C1** [Must] Robot phải xác nhận đã đến điểm lấy hàng và xác nhận đúng loại hàng trước khi thực hiện thao tác gắp/nâng hàng (liên kết EX6).

**FR-C2** [Must] Robot phải cập nhật trạng thái task theo từng giai đoạn: `assigned` → `in-progress` (đang lấy hàng) → `in-progress` (đang giao hàng) → `completed`.

**FR-C3** [Should] Hệ thống phải cho phép nhân viên kho xác nhận thủ công việc nhận hàng tại điểm đích (double-check tùy chọn theo cấu hình).

### Module D — Giám sát đội robot real-time (nguồn: BR-03, UC7)

**FR-D1** [Must] Robot phải gửi telemetry (vị trí, pin, trạng thái, task hiện tại) định kỳ theo khoảng thời gian cấu hình (mặc định đề xuất: mỗi 2 giây).

**FR-D2** [Must] Dashboard phải hiển thị vị trí toàn bộ robot trên bản đồ kho, cập nhật gần thời gian thực (độ trễ hiển thị ≤ 3 giây so với telemetry gốc).

**FR-D3** [Should] Dashboard phải hiển thị lịch sử trạng thái robot trong khoảng thời gian có thể lọc (ví dụ 1 giờ gần nhất).

### Module E — Quản lý pin & sạc (nguồn: BR-04, UC8, EX1)

**FR-E1** [Must] Hệ thống phải tính ngưỡng pin an toàn động = pin cần thiết để hoàn thành task còn lại + pin cần thiết để về trạm sạc gần nhất + biên an toàn cấu hình được.

**FR-E2** [Must] Khi pin robot xuống dưới ngưỡng an toàn giữa lúc thực thi task, hệ thống phải:
  - Nếu đủ pin về trạm sạc: chuyển task → `paused`, điều hướng robot về trạm sạc gần nhất
  - Nếu không đủ: dừng robot tại chỗ, phát cảnh báo mức `critical` đến quản lý vận hành

**FR-E3** [Must] Task ở trạng thái `paused` do hết pin phải được đưa lại vào hàng đợi điều phối để gán cho robot khác hoặc chính robot đó sau khi sạc xong.

**FR-E4** [Should] Hệ thống phải quản lý hàng đợi trạm sạc khi nhiều robot cùng cần sạc và số trạm có hạn.

### Module F — Xử lý giao thông & xung đột (nguồn: BR-05, UC9, EX2, EX3)

**FR-F1** [Must] Hệ thống phải áp dụng mutex theo segment: không cho phép 2 robot cùng chiếm 1 segment đường tại cùng thời điểm.

**FR-F2** [Must] Khi phát hiện xung đột giao lộ, hệ thống phải áp dụng quy tắc: task ưu tiên cao hơn đi trước; nếu bằng ưu tiên, robot gần giao lộ hơn đi trước.

**FR-F3** [Must] Khi robot phát hiện vật cản không xác định trước (EX2), robot phải dừng an toàn và hệ thống phải thử tính lại lộ trình thay thế trong thời gian cấu hình trước khi báo cáo ngoại lệ.

**FR-F4** [Should] Hệ thống phải đánh dấu segment bị chặn kéo dài là `unavailable` và tính lại route cho tất cả robot bị ảnh hưởng.

### Module G — Quản lý ưu tiên (nguồn: BR-06, UC10, EX4)

**FR-G1** [Must] Hệ thống phải cho phép gắn cờ `urgent` cho task khi tạo.

**FR-G2** [Must] Khi có task `urgent` mới và không có robot rảnh, hệ thống phải ưu tiên gán cho robot sắp hoàn thành task hiện tại trước khi xét đến preemption.

**FR-G3** [Must] Hệ thống chỉ được phép preempt robot đang ở giai đoạn di chuyển tới điểm lấy hàng (chưa gắp hàng — trạng thái trước FR-C1 hoàn tất). Không được preempt robot đã lấy hàng lên.

**FR-G4** [Must] Task bị preempt phải quay lại hàng đợi với trạng thái `pending`, giữ nguyên độ ưu tiên gốc, không bị mất dữ liệu.

### Module H — Kết nối & xử lý lỗi (nguồn: BR-07, EX5, EX6)

**FR-H1** [Must] Nếu không nhận được telemetry từ robot sau N giây (cấu hình được), hệ thống đánh dấu robot `unknown` và ngừng gán task mới cho robot đó.

**FR-H2** [Must] Task đang gán cho robot `unknown` phải chuyển sang trạng thái `blocked`, không tự động re-assign ngay để tránh trùng lặp xử lý.

**FR-H3** [Should] Sau ngưỡng thời gian mất kết nối dài hơn (cấu hình được, ví dụ 2 phút), hệ thống phải cảnh báo kỹ thuật viên và cho phép quản lý override để re-assign thủ công.

**FR-H4** [Must] Nếu robot không xác nhận đúng hàng tại điểm lấy (lỗi cảm biến/sai hàng — EX6), hệ thống phải giữ robot tại chỗ, thông báo nhân viên kho gần nhất, và không cho phép robot rời vị trí khi chưa xác nhận.

### Module I — Quản lý khu vực (nguồn: EX7)

**FR-I1** [Must] Quản lý vận hành phải có khả năng đánh dấu một zone là `restricted` theo thời gian thực.

**FR-I2** [Must] Khi một zone bị đánh dấu `restricted`, hệ thống phải loại bỏ mọi route đi qua zone đó và tính lại route cho robot đang di chuyển bị ảnh hưởng.

**FR-I3** [Must] Task có điểm lấy/giao nằm trong zone bị hạn chế phải chuyển trạng thái `on-hold` và thông báo cho actor đã tạo task.

### Module J — Bảo trì (nguồn: BR-09, UC11, UC12)

**FR-J1** [Must] Hệ thống phải cho phép robot hoặc người dùng tạo yêu cầu bảo trì gắn với robot cụ thể, kèm loại lỗi.

**FR-J2** [Must] Hệ thống phải ghi nhận lịch sử bảo trì đầy đủ theo từng robot (thời gian báo cáo, kỹ thuật viên xử lý, thời gian giải quyết).

**FR-J3** [Should] Robot có yêu cầu bảo trì đang mở (`status = reported/in-progress`) không được gán task mới.

### Module K — Override thủ công (nguồn: BR-08, UC13)

**FR-K1** [Must] Quản lý vận hành phải có nút dừng khẩn cấp cho từng robot hoặc toàn bộ đội robot, có hiệu lực ngay lập tức, ưu tiên cao hơn mọi lệnh khác trong hệ thống.

**FR-K2** [Should] Sau override dừng khẩn cấp, hệ thống phải yêu cầu xác nhận thủ công trước khi robot được phép hoạt động trở lại.

### Module L — AI Dispatcher (nguồn: BR-10, UC14) — điểm nhấn prototype

**FR-L1** [Must] Hệ thống phải cung cấp giao diện nhận lệnh bằng ngôn ngữ tự nhiên (tiếng Việt/Anh), ví dụ: "Chuyển 5 thùng hàng từ khu A sang khu đóng gói, ưu tiên gấp".

**FR-L2** [Must] AI Dispatcher phải diễn giải lệnh thành task hợp lệ (điểm lấy, điểm giao, mức ưu tiên) và đi qua đúng luồng FR-A1 → FR-A4, không bypass validation.

**FR-L3** [Should] Nếu lệnh ngôn ngữ tự nhiên thiếu thông tin bắt buộc (ví dụ không rõ điểm giao), AI Dispatcher phải hỏi lại người dùng thay vì tự suy đoán.

**FR-L4** [Could] AI Dispatcher có thể đề xuất robot phù hợp kèm giải thích lý do lựa chọn (khoảng cách, pin) hiển thị cho người dùng trước khi xác nhận gán — quyết định "tự động gán hoàn toàn" hay "đề xuất chờ duyệt" cần chốt ở bước thiết kế chi tiết (xem mục 7).

---

## 4. Yêu cầu phi chức năng (Non-functional Requirements)

| Mã | Nhóm | Yêu cầu |
|---|---|---|
| NFR-1 | Hiệu năng | Độ trễ cập nhật vị trí robot trên dashboard ≤ 3 giây |
| NFR-2 | Độ tin cậy | Hệ thống không được để 2 robot cùng chiếm 1 segment (an toàn > tốc độ xử lý) |
| NFR-3 | Khả năng mở rộng | Kiến trúc phải hỗ trợ tăng số lượng robot mô phỏng mà không đổi thiết kế lõi (thiết kế cho ~20–50 robot ở bản demo) |
| NFR-4 | Khả dụng | Module AI Dispatcher phải xử lý lỗi gọi API (timeout, rate limit) một cách graceful, không làm crash luồng dispatch chính |
| NFR-5 | Bảo mật | API nhận task từ WMS/ERP phải yêu cầu xác thực (API key/token) |
| NFR-6 | Khả năng theo dõi | Mọi thay đổi trạng thái task/robot phải được ghi log kèm timestamp để phục vụ truy vết sự cố |
| NFR-7 | Khả năng sử dụng | Dashboard phải hiển thị được trên màn hình desktop chuẩn (1920×1080), ưu tiên rõ ràng, dễ đọc hơn là nhiều tính năng |

---

## 5. Yêu cầu giao diện ngoài (External Interface Requirements)

- **API nhận task (WMS/ERP → Dispatch System):** REST endpoint, method POST, payload JSON gồm pickup_zone, dropoff_zone, priority, item_type
- **Giao diện dashboard:** bản đồ kho dạng grid/2D, danh sách robot kèm trạng thái/pin, ô nhập lệnh ngôn ngữ tự nhiên cho AI Dispatcher, panel cảnh báo ngoại lệ đang mở
- **Giao diện robot (giả lập):** mỗi robot mô phỏng gửi telemetry theo interval cấu hình, nhận lệnh di chuyển/dừng từ Dispatch System

---

## 6. Yêu cầu dữ liệu

Tham chiếu chi tiết entity/quan hệ tại `AGV_Nghiep_vu_Dao_sau.md`, mục 7 (Data Model sơ bộ). SRS này không lặp lại toàn bộ schema, chỉ xác nhận: mọi FR ở mục 3 đều thao tác trên các entity Robot, Task, Zone, PathSegment, ChargingStation, TelemetryLog, ExceptionEvent, MaintenanceRecord, User đã định nghĩa.

---

## 7. Business Rules / Tham số cấu hình (Configurable Parameters)

| Tham số | Mô tả | Giá trị đề xuất (demo) |
|---|---|---|
| `battery_safety_margin` | Biên an toàn pin cộng thêm vào ngưỡng động (FR-E1) | 10% |
| `telemetry_interval` | Tần suất robot gửi telemetry | 2 giây |
| `comm_timeout_short` | Ngưỡng đánh dấu `unknown` (FR-H1) | 10 giây |
| `comm_timeout_long` | Ngưỡng cảnh báo kỹ thuật viên (FR-H3) | 120 giây |
| `obstacle_reroute_timeout` | Thời gian robot tự tìm đường thay thế trước khi báo cáo (FR-F3) | 15 giây |
| `wait_queue_alert_threshold` | Thời gian task chờ trước khi cảnh báo quản lý (FR-B2) | 5 phút |
| `ai_dispatcher_mode` | `propose-only` hoặc `auto-assign` (FR-L4) | **Cần chốt** — đề xuất mặc định `propose-only` cho bản demo để an toàn và dễ trình bày với nhà tuyển dụng |

---

## 8. Ma trận truy vết (Traceability Matrix — rút gọn)

| BR | FR liên quan | UC nguồn |
|---|---|---|
| BR-01 | FR-A1 → FR-A4 | UC1 |
| BR-02 | FR-B1 → FR-B3 | UC2 |
| BR-03 | FR-D1 → FR-D3 | UC7 |
| BR-04 | FR-E1 → FR-E4 | UC8, EX1 |
| BR-05 | FR-F1 → FR-F4 | UC9, EX2, EX3 |
| BR-06 | FR-G1 → FR-G4 | UC10, EX4 |
| BR-07 | FR-H1 → FR-H4 | EX5, EX6 |
| BR-08 | FR-K1 → FR-K2 | UC13 |
| BR-09 | FR-J1 → FR-J3 | UC11, UC12 |
| BR-10 | FR-L1 → FR-L4 | UC14 |

---

**Tiếp theo:** Vẽ chính thức Use Case Diagram + Activity Diagram trên Draw.io dựa trên mục 3 và tài liệu đào sâu nghiệp vụ; song song hoàn thiện Data Model chi tiết (ERD).

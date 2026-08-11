# User Stories — Hệ thống điều phối AGV (chuẩn Agile/Scrum)

| | |
|---|---|
| **Phiên bản** | 1.0 |
| **Tác giả** | Kevin Ngo — Business Analyst (portfolio project) |
| **Ngày** | 11/08/2026 |

Định dạng: *As a [role], I want [goal], so that [benefit]*. Acceptance criteria viết theo Gherkin (Given/When/Then). Story points ước lượng theo Fibonacci (1,2,3,5,8). Ưu tiên theo MoSCoW.

---

## Epic 1 — Quản lý Task (nguồn: FR-A, BR-01)

**US-01** | Must | 3 điểm
> Là **nhân viên kho**, tôi muốn **tạo yêu cầu vận chuyển thủ công với điểm lấy/giao, loại hàng, mức ưu tiên**, để **hàng hóa được robot vận chuyển thay vì phải tự đẩy xe**.
- Given tôi đã đăng nhập vào hệ thống
- When tôi nhập điểm lấy hàng, điểm giao hàng, loại hàng và nhấn "Tạo yêu cầu"
- Then hệ thống tạo task ở trạng thái `pending` và hiển thị mã task cho tôi

**US-02** | Must | 5 điểm
> Là **hệ thống WMS**, tôi muốn **gửi task vận chuyển tự động qua API**, để **đơn hàng được xử lý ngay khi phát sinh mà không cần nhân viên nhập tay**.
- Given hệ thống AGV đã cung cấp API endpoint với xác thực hợp lệ
- When WMS gửi POST request với đầy đủ trường bắt buộc
- Then hệ thống tạo task và trả về mã xác nhận trong vòng 500ms

**US-03** | Should | 2 điểm
> Là **nhân viên kho**, tôi muốn **nhận thông báo lỗi rõ ràng khi nhập sai điểm lấy/giao**, để **tôi sửa ngay thay vì tạo task không hợp lệ**.
- Given tôi nhập một zone_id không tồn tại trong bản đồ kho
- When tôi nhấn "Tạo yêu cầu"
- Then hệ thống từ chối và hiển thị thông báo "Khu vực không tồn tại"

---

## Epic 2 — Điều phối & Gán task (nguồn: FR-B, BR-02)

**US-04** | Must | 8 điểm
> Là **hệ thống điều phối**, tôi muốn **tự động chọn robot gần nhất và đủ pin để gán task**, để **thời gian xử lý đơn hàng được tối ưu mà không cần con người can thiệp**.
- Given có ≥1 task ở trạng thái pending và ≥1 robot idle đủ pin
- When bộ điều phối chạy chu kỳ gán task
- Then task được gán cho robot gần điểm lấy hàng nhất trong số các robot đủ điều kiện

**US-05** | Must | 3 điểm
> Là **quản lý vận hành**, tôi muốn **được cảnh báo khi task chờ quá lâu không có robot xử lý**, để **tôi can thiệp kịp thời (thêm robot, điều chỉnh ưu tiên)**.
- Given task ở trạng thái pending quá 5 phút (tham số cấu hình)
- When ngưỡng thời gian bị vượt
- Then hệ thống gửi cảnh báo đến dashboard của quản lý vận hành

---

## Epic 3 — Thực thi task trên robot (nguồn: FR-C, UC3-UC6)

**US-06** | Must | 5 điểm
> Là **nhân viên kho**, tôi muốn **robot chỉ lấy hàng sau khi xác nhận đúng loại hàng**, để **tránh giao nhầm hàng cho khách/khu vực khác**.
- Given robot đã đến điểm lấy hàng
- When cảm biến/camera xác nhận đúng mã hàng khớp với task
- Then robot mới được phép nâng/gắp hàng và tiếp tục di chuyển

**US-07** | Should | 2 điểm
> Là **nhân viên kho**, tôi muốn **xác nhận thủ công việc nhận hàng tại điểm đích (tùy chọn)**, để **có thêm một lớp kiểm tra double-check khi cần**.
- Given cấu hình double-check được bật cho zone đích
- When robot giao hàng đến nơi
- Then task chỉ chuyển `completed` sau khi nhân viên xác nhận trên thiết bị/màn hình

---

## Epic 4 — Giám sát đội robot real-time (nguồn: FR-D, BR-03)

**US-08** | Must | 5 điểm
> Là **quản lý vận hành**, tôi muốn **xem vị trí và trạng thái của toàn bộ robot trên bản đồ kho theo thời gian thực**, để **nắm được tình hình vận hành tổng thể mà không cần đi kiểm tra trực tiếp**.
- Given dashboard đang mở
- When robot gửi telemetry mới
- Then vị trí robot trên bản đồ được cập nhật trong vòng 3 giây

**US-09** | Could | 3 điểm
> Là **quản lý vận hành**, tôi muốn **xem lại lịch sử di chuyển của một robot trong khoảng thời gian nhất định**, để **phân tích hiệu suất hoặc điều tra sự cố**.

---

## Epic 5 — Quản lý pin & sạc (nguồn: FR-E, BR-04, EX1)

**US-10** | Must | 8 điểm
> Là **hệ thống điều phối**, tôi muốn **tự động điều hướng robot về trạm sạc khi pin sắp không đủ hoàn thành task + về trạm**, để **robot không bị "chết" giữa kho gây tắc nghẽn**.
- Given robot đang thực thi task và pin giảm xuống dưới ngưỡng an toàn động
- When hệ thống tính toán robot vẫn đủ pin về trạm sạc gần nhất
- Then task chuyển `paused`, robot được điều hướng về trạm sạc, và task được đưa lại hàng đợi để gán robot khác nếu cần

**US-11** | Must | 3 điểm
> Là **quản lý vận hành**, tôi muốn **nhận cảnh báo khẩn khi robot hết pin ở nơi không kịp về trạm sạc**, để **tôi cử người hỗ trợ vật lý ngay**.

---

## Epic 6 — Xử lý giao thông & xung đột (nguồn: FR-F, BR-05, EX2, EX3)

**US-12** | Must | 8 điểm
> Là **hệ thống điều phối**, tôi muốn **ngăn hai robot cùng chiếm một đoạn đường tại cùng thời điểm**, để **không xảy ra va chạm giữa các robot**.
- Given robot A đang chiếm segment X
- When robot B có lộ trình cần đi qua segment X
- Then robot B phải chờ tại điểm chờ an toàn cho đến khi segment X trống

**US-13** | Should | 5 điểm
> Là **robot**, tôi muốn **tự tìm đường thay thế khi phát hiện vật cản bất ngờ**, để **giảm số lần phải dừng chờ con người can thiệp**.

---

## Epic 7 — Quản lý ưu tiên (nguồn: FR-G, BR-06, EX4)

**US-14** | Must | 8 điểm
> Là **quản lý vận hành**, tôi muốn **task được gắn cờ "gấp" được ưu tiên xử lý mà không làm mất dữ liệu task đang chạy**, để **đáp ứng đơn hàng khẩn cấp mà vẫn đảm bảo công bằng cho các task khác**.
- Given không có robot idle và có robot đang di chuyển tới điểm lấy hàng (chưa gắp hàng) của task thường
- When một task `urgent` mới phát sinh
- Then robot đó bị chuyển hướng sang task urgent, và task thường quay lại hàng đợi ở trạng thái `pending` giữ nguyên độ ưu tiên gốc

**US-15** | Must | 3 điểm
> Là **hệ thống điều phối**, tôi muốn **không bao giờ preempt robot đã lấy hàng lên**, để **tránh tình trạng hàng bị "treo" giữa đường**.

---

## Epic 8 — Kết nối & xử lý lỗi (nguồn: FR-H, BR-07, EX5, EX6)

**US-16** | Must | 5 điểm
> Là **hệ thống điều phối**, tôi muốn **phân biệt robot mất tín hiệu tạm thời với sự cố thực sự**, để **không hủy/gán lại task một cách vội vàng gây trùng lặp xử lý**.

**US-17** | Should | 3 điểm
> Là **kỹ thuật viên bảo trì**, tôi muốn **được cảnh báo khi một robot mất kết nối quá lâu**, để **tôi đi kiểm tra vật lý kịp thời**.

---

## Epic 9 — Quản lý khu vực (nguồn: FR-I, EX7)

**US-18** | Must | 3 điểm
> Là **quản lý vận hành**, tôi muốn **đánh dấu tạm thời một khu vực là "cấm"**, để **robot tự động tránh khu vực đang có người làm việc hoặc sự cố an toàn**.

---

## Epic 10 — Bảo trì (nguồn: FR-J, BR-09)

**US-19** | Must | 3 điểm
> Là **kỹ thuật viên bảo trì**, tôi muốn **xem lịch sử bảo trì đầy đủ của từng robot**, để **chẩn đoán lỗi lặp lại nhanh hơn**.

**US-20** | Should | 2 điểm
> Là **hệ thống điều phối**, tôi muốn **không gán task mới cho robot đang có yêu cầu bảo trì mở**, để **tránh robot lỗi tiếp tục hoạt động gây rủi ro**.

---

## Epic 11 — Override & An toàn (nguồn: FR-K, BR-08)

**US-21** | Must | 5 điểm
> Là **quản lý vận hành**, tôi muốn **có nút dừng khẩn cấp cho một robot hoặc toàn bộ đội robot**, để **xử lý ngay lập tức khi có tình huống nguy hiểm**.
- Given tôi nhấn nút dừng khẩn cấp
- When lệnh được gửi đi
- Then robot (hoặc toàn bộ đội) dừng lại ngay, ưu tiên cao hơn mọi lệnh khác đang xử lý

---

## Epic 12 — AI Dispatcher / Ra lệnh ngôn ngữ tự nhiên (nguồn: FR-L, BR-10) — điểm nhấn prototype

**US-22** | Must | 8 điểm
> Là **nhân viên kho**, tôi muốn **ra lệnh vận chuyển bằng câu tiếng Việt tự nhiên**, để **không phải điền form phức tạp cho các yêu cầu đơn giản**.
- Given tôi gõ "Chuyển 5 thùng hàng từ khu A sang khu đóng gói, ưu tiên gấp" vào ô lệnh AI
- When AI Dispatcher xử lý câu lệnh
- Then hệ thống tạo task với pickup=Khu A, dropoff=Khu đóng gói, priority=urgent, và task đi qua đúng luồng validate chuẩn (US-01 → US-04)

**US-23** | Should | 5 điểm
> Là **nhân viên kho**, tôi muốn **AI Dispatcher hỏi lại khi lệnh của tôi thiếu thông tin**, để **task được tạo đúng thay vì AI tự đoán sai**.
- Given tôi gõ "Chuyển hàng sang khu đóng gói" (thiếu điểm lấy)
- When AI Dispatcher không xác định được pickup_zone
- Then hệ thống hỏi lại "Bạn muốn lấy hàng từ khu vực nào?" thay vì tự tạo task với dữ liệu thiếu

**US-24** | Could | 3 điểm
> Là **nhân viên kho**, tôi muốn **xem AI Dispatcher giải thích vì sao chọn một robot cụ thể**, để **tin tưởng vào quyết định tự động của hệ thống**.

---

## Tổng hợp Backlog (tóm tắt)

| Epic | Số story | Tổng điểm ước lượng |
|---|---|---|
| 1. Quản lý Task | 3 | 10 |
| 2. Điều phối & gán task | 2 | 11 |
| 3. Thực thi task | 2 | 7 |
| 4. Giám sát real-time | 2 | 8 |
| 5. Pin & sạc | 2 | 11 |
| 6. Giao thông & xung đột | 2 | 13 |
| 7. Ưu tiên | 2 | 11 |
| 8. Kết nối & lỗi | 2 | 8 |
| 9. Quản lý khu vực | 1 | 3 |
| 10. Bảo trì | 2 | 5 |
| 11. Override & an toàn | 1 | 5 |
| 12. AI Dispatcher | 3 | 16 |
| **Tổng** | **24** | **108** |

Với velocity giả định ~15–20 điểm/sprint (2 tuần), backlog này tương đương khoảng 6 sprint — hợp lý để trình bày như một roadmap Agile trong portfolio, dù prototype thực tế sẽ chỉ hiện thực hóa một tập con ưu tiên cao (xem mục tiếp theo).

**Khuyến nghị chọn cho prototype (MVP demo):** US-01, US-02, US-04, US-08, US-10, US-14, US-22, US-23 — đủ để minh họa luồng chính + 2 ngoại lệ tiêu biểu (pin, ưu tiên) + điểm nhấn AI Dispatcher, mà không cần cài đặt toàn bộ 24 story.

---

**Bước tiếp theo:** Dựng prototype kỹ thuật dựa trên tập MVP story đã chọn ở trên.

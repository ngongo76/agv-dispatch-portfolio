# Business Requirements Document (BRD)
## Hệ thống AGV — Robot vận chuyển tự hành trong kho/nhà máy

| | |
|---|---|
| **Phiên bản** | 1.0 |
| **Tác giả** | Kevin Ngo — Business Analyst (portfolio project) |
| **Ngày** | 11/08/2026 |
| **Trạng thái** | Draft |

---

## 1. Tóm tắt điều hành (Executive Summary)

Tài liệu này đặc tả yêu cầu nghiệp vụ cho một hệ thống điều phối robot vận chuyển tự hành (AGV) trong kho/nhà máy, nhằm thay thế một phần công việc vận chuyển hàng hóa thủ công giữa các khu vực lưu trữ, đóng gói và xuất hàng. Dự án được xây dựng dưới dạng portfolio nhằm minh họa năng lực phân tích nghiệp vụ (thu thập yêu cầu, mô hình hóa use case, thiết kế dữ liệu) áp dụng vào lĩnh vực robotics/tự động hóa — phù hợp định hướng đơn vị robotics thuộc khối công nghiệp quốc phòng.

## 2. Bối cảnh & Vấn đề nghiệp vụ (Business Problem)

Trong vận hành kho truyền thống, nhân viên di chuyển hàng hóa thủ công giữa các khu vực bằng xe đẩy/xe nâng. Vấn đề phát sinh:

- Thời gian xử lý đơn hàng kéo dài do phụ thuộc lịch trình con người, dễ tắc nghẽn vào giờ cao điểm
- Chi phí nhân công vận hành kho tại Việt Nam tăng trung bình 8–10%/năm, gây áp lực biên lợi nhuận cho doanh nghiệp logistics/sản xuất
- Thiếu dữ liệu real-time về vị trí/trạng thái hàng hóa đang di chuyển, gây khó khăn cho việc tối ưu luồng vận hành
- Rủi ro an toàn lao động khi con người thao tác lặp lại trong môi trường kho có xe nâng, hàng hóa nặng

Xu hướng thị trường xác nhận đây là vấn đề đang được đầu tư giải quyết ở quy mô lớn: thị trường AGV toàn cầu được định giá khoảng 6–6,5 tỷ USD năm 2026, tăng trưởng khoảng 8,5–10,6% CAGR trong giai đoạn 2026–2034, dẫn dắt bởi nhu cầu tự động hóa kho vận và thiếu hụt lao động ([Fortune Business Insights](https://www.fortunebusinessinsights.com/automated-guided-vehicle-agv-market-101966); [MarketsandMarkets](https://www.marketsandmarkets.com/Market-Reports/automated-guided-vehicle-market-27462395.html)). Tại Việt Nam, tốc độ lắp đặt robot công nghiệp thuộc nhóm nhanh nhất khu vực (~27% năm 2025), và các trung tâm kho vận tại Hà Nội, Hải Phòng, TP.HCM đã ứng dụng AGV giúp rút ngắn thời gian xử lý đơn hàng từ 24 giờ xuống còn 6–12 giờ ([RMIT Việt Nam](https://www.rmit.edu.vn/vi/tin-tuc/tat-ca-tin-tuc/2026/apr/co-hoi-cua-viet-nam-trong-chuoi-gia-tri-san-xuat-robot)).

## 3. Mục tiêu dự án (Business Goals)

1. Tự động hóa luồng vận chuyển hàng hóa nội bộ giữa các khu vực trong kho, giảm phụ thuộc vào nhân công cho tác vụ di chuyển lặp lại
2. Cung cấp khả năng giám sát real-time vị trí, trạng thái, pin của toàn bộ đội robot
3. Đảm bảo hệ thống xử lý được các tình huống ngoại lệ vận hành thực tế (hết pin, tắc đường, xung đột lịch, đơn ưu tiên gấp) mà không cần can thiệp thủ công trong đa số trường hợp
4. Thử nghiệm lớp giao tiếp ngôn ngữ tự nhiên (AI Dispatcher) cho phép người vận hành ra lệnh bằng tiếng Việt/tiếng Anh tự nhiên thay vì thao tác qua form/giao diện phức tạp

## 4. Phạm vi (Scope)

**Trong phạm vi:**
- Luồng tạo, điều phối, gán và thực thi task vận chuyển giữa robot và các điểm trong kho
- Giám sát trạng thái đội robot real-time
- Quản lý pin/sạc tự động
- Xử lý 7 nhóm ngoại lệ vận hành chính (xem tài liệu đào sâu nghiệp vụ, mục 5)
- Bảo trì cơ bản: báo lỗi, ghi nhận lịch sử bảo trì
- Prototype: dashboard trực quan hóa bản đồ kho + AI Dispatcher nhận lệnh ngôn ngữ tự nhiên

**Ngoài phạm vi:**
- Thiết kế cơ khí/phần cứng robot thực tế
- Thuật toán path-planning chi tiết ở mức thuật toán (SLAM, A*, v.v.) — chỉ mô hình hóa ở mức nghiệp vụ
- Tích hợp phần cứng cảm biến thật (camera, LiDAR) — mô phỏng dữ liệu trong prototype
- Tích hợp thực tế với hệ thống WMS/ERP của một doanh nghiệp cụ thể

## 5. Phân tích Stakeholder

| Stakeholder | Vai trò trong dự án | Mối quan tâm chính | Mức ảnh hưởng |
|---|---|---|---|
| Nhân viên kho (Warehouse Operator) | Người dùng cuối, tạo/xác nhận task | Dễ dùng, giảm việc tay chân, không bị robot cản trở lối đi | Cao |
| Quản lý kho/vận hành (Operations Manager) | Người ra quyết định vận hành, duyệt ngoại lệ | Hiệu suất tổng thể, khả năng giám sát, kiểm soát rủi ro | Cao |
| Kỹ thuật viên bảo trì | Xử lý sự cố phần cứng | Cảnh báo lỗi rõ ràng, kịp thời, dễ truy vết lịch sử | Trung bình |
| Hệ thống WMS/ERP | Nguồn task tự động | Tích hợp API ổn định, dữ liệu nhất quán | Trung bình |
| Ban lãnh đạo/đầu tư | Phê duyệt ngân sách đầu tư AGV | ROI, thời gian hoàn vốn, rủi ro triển khai | Cao |
| (Trong bối cảnh tuyển dụng) Nhà tuyển dụng — BA Manager | Đánh giá năng lực ứng viên | Tính logic, đầy đủ, đúng chuẩn tài liệu BA | Cao |

## 6. Yêu cầu nghiệp vụ cấp cao (High-level Business Requirements)

| Mã | Yêu cầu nghiệp vụ | Use case liên quan |
|---|---|---|
| BR-01 | Hệ thống phải cho phép tạo yêu cầu vận chuyển thủ công hoặc tự động từ WMS | UC1 |
| BR-02 | Hệ thống phải tự động chọn và gán robot phù hợp nhất cho mỗi task dựa trên khoảng cách và mức pin | UC2 |
| BR-03 | Hệ thống phải hiển thị trạng thái/vị trí toàn bộ đội robot theo thời gian thực | UC7 |
| BR-04 | Hệ thống phải tự động điều hướng robot về trạm sạc khi pin xuống dưới ngưỡng an toàn, có tính đến khoảng cách còn lại của task | UC8, EX1 |
| BR-05 | Hệ thống phải phát hiện và xử lý xung đột lộ trình giữa nhiều robot mà không xảy ra va chạm | UC9, EX2, EX3 |
| BR-06 | Hệ thống phải cho phép chèn task ưu tiên khẩn cấp theo quy tắc rõ ràng, không làm mất task đang xử lý | UC10, EX4 |
| BR-07 | Hệ thống phải ghi nhận và cảnh báo khi mất kết nối với robot, phân biệt mất tín hiệu tạm thời và sự cố thực sự | EX5 |
| BR-08 | Hệ thống phải cho phép quản lý thực hiện override/dừng khẩn cấp thủ công bất kỳ lúc nào | UC13 |
| BR-09 | Hệ thống phải ghi nhận lịch sử bảo trì theo từng robot | UC11, UC12 |
| BR-10 | Hệ thống (prototype) phải cho phép người vận hành ra lệnh vận chuyển bằng ngôn ngữ tự nhiên và tự động chuyển thành task hợp lệ | UC14 |

*(Tham chiếu chi tiết luồng chính/luồng ngoại lệ: file `AGV_Nghiep_vu_Dao_sau.md`)*

## 7. SWOT Analysis — Đầu tư triển khai AGV

| | Có lợi | Bất lợi |
|---|---|---|
| **Nội bộ** | **Strengths**<br>- Giảm chi phí nhân công lặp lại về dài hạn<br>- Vận hành liên tục 24/7, không giới hạn ca làm việc<br>- Dữ liệu vận hành real-time hỗ trợ ra quyết định<br>- Payback trong nhóm tự động hóa picking/vận chuyển thường 12–24 tháng theo dữ liệu ngành ([SVRC](https://www.roboticscenter.ai/blog/warehouse-robot-roi)) | **Weaknesses**<br>- Chi phí đầu tư ban đầu cao (phần cứng, tích hợp WMS, đào tạo)<br>- Chi phí vận hành/bảo trì hàng năm ước tính 10–15% giá trị phần cứng ban đầu, cộng dồn 50–75% tổng chi phí sở hữu sau 5 năm ([ISDDD/nguồn tổng hợp ngành](https://www.isddd.com/warehouse-automation-roi-calculator/))<br>- Cần tái cấu trúc luồng vận hành và mặt bằng kho để phù hợp AGV |
| **Bên ngoài** | **Opportunities**<br>- Thị trường AGV toàn cầu tăng trưởng 8,5–10,6% CAGR đến 2034 ([Fortune Business Insights](https://www.fortunebusinessinsights.com/automated-guided-vehicle-agv-market-101966))<br>- Việt Nam thuộc nhóm tăng trưởng lắp đặt robot công nghiệp nhanh nhất khu vực (~27% năm 2025) ([RMIT Việt Nam](https://www.rmit.edu.vn/vi/tin-tuc/tat-ca-tin-tuc/2026/apr/co-hoi-cua-viet-nam-trong-chuoi-gia-tri-san-xuat-robot))<br>- Áp lực chi phí nhân công tăng 8–10%/năm thúc đẩy nhu cầu tự động hóa | **Threats**<br>- Việt Nam chưa chủ động công nghệ lõi (cảm biến, chip điều khiển, phần mềm điều phối), phụ thuộc nhập khẩu ([RMIT Việt Nam](https://www.rmit.edu.vn/vi/tin-tuc/tat-ca-tin-tuc/2026/apr/co-hoi-cua-viet-nam-trong-chuoi-gia-tri-san-xuat-robot))<br>- Cạnh tranh từ các nhà cung cấp AGV/AMR quốc tế đã có hệ sinh thái trưởng thành (Geek+, Locus Robotics, Vecna...)<br>- Rủi ro an toàn/pháp lý khi robot vận hành gần con người trong không gian chung |

**Ghi chú ROI (tham khảo, không phải cam kết):** Các triển khai AMR/AGV thực tế trong ngành ghi nhận payback dưới 24 tháng và ROI trên 250% ở một số trường hợp tối ưu tốt; với các hệ thống kho tự động hóa toàn diện, payback có thể kéo dài trên 5 năm tùy độ phức tạp ([SVRC](https://www.roboticscenter.ai/blog/warehouse-robot-roi); [Transport Works](https://www.transportworks.com/post/warehouse-automation-roi-do-robots-pay-back-numbers-not-buzzwords)). Con số cụ thể cho từng doanh nghiệp phụ thuộc quy mô kho, số lượng robot, và mức độ tích hợp — phần này nên được làm chi tiết hơn nếu có dữ liệu vận hành thật của một kho tham chiếu.

## 8. Giả định & Ràng buộc (Assumptions & Constraints)

- Một robot xử lý 1 task tại 1 thời điểm (không mang nhiều đơn cùng lúc) — giả định để giữ scope portfolio gọn
- Đội robot được coi là đồng nhất về tải trọng/tốc độ ở giai đoạn đầu
- AI Dispatcher (UC14) đưa ra đề xuất gán task; quyết định tự động hóa hoàn toàn hay cần người duyệt sẽ chốt ở giai đoạn thiết kế SRS
- Ngưỡng pin an toàn, thời gian timeout kết nối... sẽ được liệt kê là tham số cấu hình (Configurable Business Rules) trong SRS, không hard-code
- Không có dữ liệu vận hành thật từ một kho cụ thể — các con số ROI/thị trường trong tài liệu này mang tính tham khảo ngành, dùng để minh họa năng lực phân tích, không phải số liệu tài chính thực tế của một dự án đầu tư cụ thể

## 9. Rủi ro (Risks)

| Rủi ro | Mức độ | Giải pháp giảm thiểu |
|---|---|---|
| Va chạm robot-robot hoặc robot-người | Cao | Business rule mutex theo segment (EX3), vùng an toàn, dừng khẩn cấp (UC13) |
| Task bị "treo" do robot mất kết nối | Trung bình | Cơ chế phân biệt mất tín hiệu tạm thời/lâu dài (EX5), không tự động hủy task ngay |
| Chi phí đầu tư vượt ngân sách dự kiến | Trung bình | Thiết kế modular, triển khai thí điểm (pilot) trước khi mở rộng toàn kho |
| Phụ thuộc công nghệ lõi nhập khẩu | Trung bình | Ngoài phạm vi giải quyết của BA, ghi nhận là rủi ro chiến lược cấp doanh nghiệp |

## 10. Tiêu chí thành công (Success Criteria)

- Toàn bộ 14 use case ở tài liệu đào sâu nghiệp vụ được đặc tả đầy đủ trong SRS/FRD
- Prototype minh họa được ít nhất luồng chính (happy path) + 2 luồng ngoại lệ tiêu biểu (hết pin, ưu tiên khẩn)
- Bộ tài liệu đạt chuẩn để một BA/PM khác có thể đọc và hiểu được toàn bộ nghiệp vụ mà không cần giải thích thêm

---

**Tài liệu tham chiếu:** `AGV_Nghiep_vu_Dao_sau.md` (actor, use case, exception flow, data model sơ bộ)

**Tiếp theo:** SRS/FRD — đặc tả chi tiết từng yêu cầu chức năng dựa trên BR-01 → BR-10 ở trên.

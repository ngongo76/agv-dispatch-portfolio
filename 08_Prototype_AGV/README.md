# AGV Dispatch Dashboard — Prototype

Prototype kỹ thuật cho portfolio Business Analyst — mô phỏng hệ thống điều phối AGV trong kho,
kèm **AI Dispatcher** nhận lệnh bằng ngôn ngữ tự nhiên (dùng Claude API).

Đây là phần "điểm nhấn khác biệt" trong bộ hồ sơ, hiện thực hóa một phần các tài liệu nghiệp vụ:
`01_BRD_AGV.md`, `02_SRS_FRD_AGV.md`, `06_DataModel_AGV.md`, `07_UserStories_AGV.md`.

## Chạy thử

```bash
npm install
cp .env.local.example .env.local
# Mở .env.local, dán API key lấy tại https://console.anthropic.com/settings/keys
npm run dev
```

Mở http://localhost:3000 — dashboard tự động poll `/api/state` mỗi 1.5s để mô phỏng real-time.

Nếu chưa có `ANTHROPIC_API_KEY`, toàn bộ dashboard (bản đồ, robot, task thủ công, xử lý pin/ưu tiên)
vẫn chạy bình thường — chỉ riêng ô lệnh AI Dispatcher sẽ báo lỗi thiếu key.

## Kiến trúc

```
app/
  page.tsx              → Dashboard chính (client component, poll /api/state)
  api/state/route.ts     → GET: tiến 1 tick mô phỏng, trả toàn bộ state (FR-D1/D2)
  api/tasks/route.ts      → POST: tạo task thủ công (FR-A1, US-01)
  api/dispatch/route.ts    → POST: AI Dispatcher — NLP → task hợp lệ (FR-L1-L3, UC14)
lib/
  types.ts               → Kiểu dữ liệu, ánh xạ trực tiếp từ 06_DataModel_AGV.md
  engine.ts               → Toàn bộ logic nghiệp vụ: dispatch, di chuyển, pin, ưu tiên (xem bên dưới)
components/
  WarehouseMap.tsx, RobotPanel.tsx, TaskQueue.tsx, EventLog.tsx, CommandBar.tsx, ManualTaskForm.tsx
```

State mô phỏng lưu **in-memory** (biến singleton trong tiến trình Node), reset khi restart server —
phù hợp cho demo, không phải thiết kế production (production sẽ dùng DB thật theo schema ở
`06_DataModel_AGV.md`).

## Logic nghiệp vụ đã hiện thực hóa trong `lib/engine.ts`

| Tính năng | Mã yêu cầu | Đã test |
|---|---|---|
| Tạo task thủ công/AI, validate zone tồn tại | FR-A1, FR-A3 | ✅ |
| Chọn robot gần nhất, đủ pin để gán task | FR-B1 | ✅ |
| Luồng chính: assigned → picking → in-progress → completed | UC3-UC6 | ✅ |
| Ngưỡng pin an toàn động + tự động về trạm sạc gần nhất | FR-E1, FR-E2 (EX1) | ✅ |
| Task pin-paused được đưa lại hàng đợi, gán robot khác | FR-E3 | ✅ |
| Sạc pin, robot trở lại idle khi đủ ngưỡng | FR-E4 (rút gọn) | ✅ |
| Chèn ưu tiên khẩn cấp (preemption trước khi lấy hàng) | FR-G1-G4 (EX4) | Có cài đặt, chưa test kịch bản trong phiên này |
| AI Dispatcher: NLP → task, hỏi lại khi thiếu thông tin | FR-L1-L3 (UC14) | Cài đặt xong — **cần bạn tự test bằng API key thật** |

Các phần **chưa** hiện thực hóa trong prototype (out of scope demo, đã ghi trong BRD mục "Ngoài phạm vi"):
xung đột giao lộ nhiều-robot (EX3 — mutex segment), mất kết nối robot (EX5), lỗi cảm biến (EX6), zone
tạm cấm (EX7), bảo trì (UC11/UC12), override thủ công (UC13). Đây là lựa chọn scope có chủ đích để giữ
prototype gọn — nên nêu rõ điều này khi trình bày với nhà tuyển dụng, thể hiện khả năng **ưu tiên scope**
chứ không phải thiếu sót.

## Đã verify trong quá trình xây dựng

- `npx tsc --noEmit` — không có lỗi type
- `npm run build` — build production thành công
- Chạy server thật + gọi API `/api/state`, `/api/tasks` bằng curl, theo dõi log tick-by-tick, xác nhận:
  - Luồng chính hoàn thành đúng: pending → assigned → in-progress → completed, pin giảm đúng tốc độ
  - Kịch bản hết pin (EX1): robot tự động rẽ hướng về trạm sạc, task được gán lại cho robot khác ngay
    lập tức, robot cũ sạc xong quay lại `idle`
- **Chưa test được**: lệnh gọi AI Dispatcher thật (`/api/dispatch`) vì môi trường xây dựng không có
  `ANTHROPIC_API_KEY`. Code dùng đúng pattern chính thức của `@anthropic-ai/sdk` (tool use để ép output
  có cấu trúc) — bạn cần tự chạy thử với key thật và báo lại nếu có lỗi.

## Bước tiếp theo (không cần Chrome)

- Test AI Dispatcher với API key thật, tinh chỉnh system prompt nếu cần
- (Tùy chọn) thêm kịch bản demo cho EX4 (ưu tiên khẩn cấp) để trình diễn đầy đủ hơn

## Bước tiếp theo (**cần Chrome** — sẽ xin quyền truy cập khi tới bước này)

- Tạo GitHub repo, push code
- Deploy lên Vercel để có link demo sống
- Gắn link vào hồ sơ ứng tuyển

# SQL — Truy vấn dữ liệu vận hành AGV

Bổ sung cho bộ hồ sơ BA: chuyển `06_DataModel_AGV.md` thành schema SQL thật (SQLite,
tương thích gần 1-1 với PostgreSQL), nạp dữ liệu mẫu mô phỏng 1 ngày vận hành, và viết
9 câu truy vấn trả lời đúng các câu hỏi nghiệp vụ mà một BA/PM thường cần biết mỗi ngày
(task nào đang chờ quá lâu, robot nào sắp hết pin, tỷ lệ hoàn thành theo độ ưu tiên...).

## File

- `01_schema.sql` — 9 bảng, khóa chính/khóa ngoại, CHECK constraint theo đúng enum trong data model
- `02_seed_data.sql` — dữ liệu mẫu để test
- `03_queries.sql` — 9 câu query, mỗi câu có comment nêu rõ câu hỏi nghiệp vụ nó trả lời

## Chạy thử

```bash
sqlite3 agv.db < 01_schema.sql
sqlite3 agv.db < 02_seed_data.sql
sqlite3 agv.db < 03_queries.sql
```

Hoặc bằng Python (không cần cài sqlite3 CLI):

```python
import sqlite3
con = sqlite3.connect("agv.db")
con.executescript(open("01_schema.sql").read())
con.executescript(open("02_seed_data.sql").read())
print(con.execute(open("03_queries.sql").read().split(";")[0]).fetchall())
```

Đã chạy thử toàn bộ 9 câu query trên dữ liệu mẫu, tất cả trả về kết quả đúng như kỳ vọng
(ví dụ Q1 lọc đúng 2 task chờ quá 10 phút, Q2 phát hiện đúng robot pin thấp, Q7 trả về rỗng
vì robot duy nhất có bảo trì đã ở trạng thái "resolved").

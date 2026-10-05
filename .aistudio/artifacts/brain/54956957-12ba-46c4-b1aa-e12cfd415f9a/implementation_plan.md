# Kế Hoạch Triển Khai: Chế Độ Dịch Theo Lô (Batch-Glossary Pipeline Mode)

## 📋 Mục Tiêu
Bổ sung tùy chọn Cài đặt **Chế độ đường ống dịch (Translation Pipeline Mode)** giúp người dùng linh hoạt chọn giữa:
1. **Chế độ Kết hợp (Mặc định cũ):** 1 Request dịch + bóc từ điển từng chương cùng lúc.
2. **Chế độ Lô Hai Bước (Batch-Glossary Mode mới):** Gọi 1 Request bóc tách Từ điển cho một lô N chương (20, 30, 50, 100 chương), sau đó dịch thuần túy N chương đó không chứa thẻ định dạng và cấm 100% chữ Hán.

---

## 🛠️ Kế Hoạch Thay Đổi Kiến Trúc & Code

### 1. Cấu Hình Cài Đặt (UI & Storage)
* **Thêm SharedPreferences Keys:**
  * `pref_translation_pipeline_mode`: Giá trị `"COMBINED"` (chế độ cũ) hoặc `"BATCH_GLOSSARY"` (chế độ hai bước).
  * `pref_batch_glossary_size`: Số chương gom lô (`20`, `30`, `50`, `100` - Mặc định: `50`).
* **Bổ sung UI ở Tab Cài Đặt (`MainActivity.java`):**
  * Thêm mục **"Chế độ đường ống dịch (Pipeline Mode)"** với Spinner / Dropdown chọn 2 chế độ.
  * Thêm mục **"Kích thước lô bóc từ điển (Batch Size)"** khi ở chế độ Batch-Glossary.
  * Thêm nút `?` giải thích hai chế độ ngắn gọn, dễ hiểu cho người mới dùng.

### 2. Nâng Cấp Engine AI (`GeminiEngine.java`)
* **Phương thức Bóc Từ Điển Theo Lô (`extractBatchGlossary`):**
  * Gom N chương thô truyền vào 1 Request duy nhất với `system_instruction` đóng vai trò Đại Sư Ngôn Ngữ trích xuất danh từ riêng unique.
  * Truyền kèm danh sách **Master Glossary hiện có từ các lô trước** vào Prompt.
  * Yêu cầu AI: *"Chỉ nhặt ra thuật ngữ hoàn toàn MỚI chưa từng có trong Glossary. Tuyệt đối không thay đổi hay ghi đè các tên riêng đã tồn tại."*
* **Phương thức Dịch Thuần Túy (`translateChapterPure`):**
  * Đưa toàn bộ quy tắc chống lọt chữ Hán vào `system_instruction`.
  * Trả về **100% văn bản dịch sạch**, bỏ hoàn toàn các thẻ `===TRANSLATION===` và `===NEW_GLOSSARY===`.

### 3. Điều Phối Tiến Trình Dịch (`TranslationForegroundService.java`) & Quy Tắc Kế Thừa (KEEP_OLD)
* Khi ở Chế độ Batch-Glossary:
  * Trước khi dịch một đợt chương mới (ví dụ từ Chương 1 đến 50), chạy tác vụ ngầm bóc tách Glossary cho cả lô 50 chương trước.
  * **Chế độ Giữ Cũ Bỏ Mới (KEEP_OLD):** Khi hợp nhất thuật ngữ mới bóc tách được vào Master Glossary, áp dụng quy tắc kiểm tra trùng lặp nghiêm ngặt: Nếu từ gốc Chữ Hán đã tồn tại trong Master Glossary từ các lô trước, **GIỮ NGUYÊN NGHĨA CŨ, BỎ NGHĨA MỚI**. Điều này đảm bảo tên nhân vật từ Chương 1 đến cuối bộ truyện hoàn toàn nhất quán.
  * Tiến hành dịch tuần tự từng chương trong lô bằng hàm `translateChapterPure`.
  * Đã xong 50 chương, tiếp tục gọi bóc Glossary cho lô 50 chương kế tiếp (Chương 51 đến 100) lũy tiến từ điển.

---

## 🧪 Kế Hoạch Kiểm Thử (Verification Plan)
1. **Kiểm tra cú pháp & Biên dịch Java:** Chạy `npx tsx verify-java-final.mjs`.
2. **Đồng bộ dữ liệu Native App:** Chạy `node scripts/sync-native-project-data.mjs`.
3. **Lint & Biên dịch Applet:** Chạy `lint_applet` và `compile_applet` đảm bảo không có lỗi build.

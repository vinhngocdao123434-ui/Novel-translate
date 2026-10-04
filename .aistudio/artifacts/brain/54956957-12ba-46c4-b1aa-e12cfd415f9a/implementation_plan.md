# Kế Hoạch Cập Nhật Code: Sửa Lỗi Hiển Thị Dự Án & Xử Lý HTTP 503 Gemini 3.6 Flash

## 1. Phân Tích & Nguyên Nhân 2 Lỗi

### Lỗi 1: Tên dự án trên Header không thay đổi khi đổi truyện (Duyệt theo ảnh chụp)
- **Phát hiện:** Trong `MainActivity.java`, biến `tvCurrentProjectName` bị gán đè (re-assigned) 2 lần:
  - Lần 1: Tại Header Tầng 3 (`tvCurrentProjectName = new TextView(this)`).
  - Lần 2: Tại Tab 2 Card 1 (`tvCurrentProjectName = new TextView(this)`).
- **Hậu quả:** Khi chọn đổi dự án, lệnh `tvCurrentProjectName.setText(...)` chỉ cập nhật TextView ở Tab 2, còn TextView ở Header Tầng 3 bị mất tham chiếu nên giữ nguyên tên truyện cũ (`Dai_Quan_Gia_Ma_Hoang ▾`).

### Lỗi 2: Xử lý lỗi HTTP 503 (Service Unavailable) khi dùng Gemini 3.6 Flash
- **Phát hiện:** HTTP 503 xuất hiện khi mô hình `gemini-3.6-flash` quá tải tạm thời trên Google API. `GeminiEngine.java` hiện chưa tự động xoay Key và chưa lùi thời gian lặp (exponential backoff), dẫn đến gửi dồn dập và bị từ chối liên tục.

---

## 2. Giải Pháp Thực Hiện

### Bước 1: Sửa Triệt Để Lỗi Hiển Thị Tên Dự Án Trên Header (`MainActivity.java`)
- Khai báo 2 biến riêng biệt:
  - `tvHeaderProjectName` (cho Header Tầng 3).
  - `tvTab2ProjectName` (cho Tab 2 Card 1).
- Tạo phương thức tập trung `updateProjectNameUI()`:
  ```java
  private void updateProjectNameUI() {
      if (tvHeaderProjectName != null) {
          tvHeaderProjectName.setText(currentProjectName + " ▾");
      }
      if (tvTab2ProjectName != null) {
          tvTab2ProjectName.setText("📖 Dự án: " + currentProjectName);
      }
  }
  ```
- Gọi `updateProjectNameUI()` bất cứ khi nào đổi dự án (`showSwitchProjectDialog`), tạo mới (`showNewProjectDialog`), xóa dự án (`deleteProject`), hoặc mở ứng dụng.

### Bước 2: Nâng Cấp `GeminiEngine.java` với Thuật Toán Exponential Backoff & Key Rotation
- **Xử lý HTTP 503 / 500 / 502 / 504 / 429:**
  - Bóc tách nội dung lỗi `error.message` từ Google API để hiển thị log chi tiết.
  - Tự động gán `COOLDOWN` (20 giây) cho Key bị lỗi để hệ thống lập tức chuyển sang Key tiếp theo trong Pool.
  - Tính thời gian chờ lùi lũy thừa `(2 ^ attempts) * 1000ms + Jitter (0-500ms)` trước khi gửi request tiếp theo.
- **Thêm `maxOutputTokens`:** Thêm `genConfig.addProperty("maxOutputTokens", 8192);` cho mô hình Gemini 3.6 Flash.

### Bước 3: Kiểm Tra Biên Dịch & Xác Nhận 100% Không Lỗi
- Chạy `verify-java-final.mjs` kiểm tra cú pháp 10 file Java.
- Đồng bộ dữ liệu native qua `scripts/sync-native-project-data.mjs`.
- Chạy `lint_applet` và `compile_applet`.

---

## 3. Kết Quả Dự Kiến
- Header Tầng 3 và Tab 2 luôn hiển thị đồng bộ 100% đúng tên dự án đang chọn ngay khi chuyển truyện.
- Dịch thuật và Làm mượt Final qua mô hình **Gemini 3.6 Flash** hoạt động trơn tru, tự động vượt lỗi HTTP 503 bằng cơ chế xoay Key và lùi thời gian thông minh.

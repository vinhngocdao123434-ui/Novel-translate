# Kế Hoạch Sửa Lỗi Lưu Trữ Vĩnh Cửu, Chống Crash & Hỗ Trợ 5 Định Dạng Nhập/Xuất (TXT, EPUB, HTML, MOBI, AZW3)

Giải quyết triệt để 2 lỗi nghiêm trọng (mất dữ liệu khi dịch lại/thoát app và crash khi xuất file) cùng tính năng nâng cấp mở rộng 5 định dạng Ebook cho cả chiều Nhập và Xuất.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **1. Nguyên nhân cốt lõi gây mất dữ liệu và phương án sửa triệt để:**
> - *Nguyên nhân:* Hiện tại app đang lưu toàn bộ các chương truyện và từ điển vào `SharedPreferences` dưới dạng chuỗi JSON khổng lồ. Khi truyện đạt vài chục chương hoặc dịch lại làm tăng kích thước vượt quá giới hạn bộ đệm XML của Android (~1.5MB), hệ điều hành sẽ âm thầm hủy bỏ lệnh ghi (`TransactionTooLargeException` / file truncation). Khi mở lại app, file cấu hình bị rỗng nên app tưởng dự án mới tinh và mất trắng!
> - *Khắc phục:* Chuyển đổi toàn bộ cơ chế lưu trữ dự án sang **Hệ thống tệp tin chuyên biệt (Atomic File Storage)** tại `context.getFilesDir()/projects/<project_id>.json`. Mỗi chương dịch xong được ghi tức thì ra tệp độc lập, có sao lưu dự phòng `.bak`, đảm bảo **BẢO TOÀN DỮ LIỆU VĨNH CỬU 100%**, không bao giờ bị mất dù máy tắt nguồn đột ngột hay khởi động lại.
>
> **2. Nguyên nhân Crash khi xuất file và phương án sửa triệt để:**
> - *Nguyên nhân:* App đang gọi trực tiếp `Environment.getExternalStoragePublicDirectory()` mà không qua Scoped Storage API của Android 10+ (Android 11, 12, 13, 14, 15, 16), gây ra lỗi `SecurityException` làm app văng ngay lập tức.
> - *Khắc phục:* Áp dụng chuẩn **Scoped Storage & MediaStore Downloads / FileProvider / Share Sheet Chooser**. Khi xuất file, app tạo tệp an toàn và mở hộp thoại chọn ứng dụng (Lưu vào Download, Mở bằng Moon+ Reader, Kindle, Gửi qua Zalo, Drive...) **KHÔNG BAO GIỜ CRASH**.
>
> **3. Hỗ trợ đầy đủ 5 định dạng (1 TXT + 4 Ebook: EPUB, HTML, MOBI, AZW3) cho cả NHẬP và XUẤT:**
> - Nhập: Tự động nhận diện và bóc tách nội dung từ `.txt`, `.epub`, `.html`, `.mobi`, `.azw3`.
> - Xuất: Hộp thoại lựa chọn định dạng chuyên nghiệp với 5 lựa chọn (TXT, EPUB có mục lục chuẩn, HTML trang đọc offline sang trọng, MOBI, AZW3 chuẩn Kindle).

---

### 1. Kiến Trúc Lưu Trữ Dữ Liệu Mới (Chống Mất Dữ Liệu Vĩnh Cửu)

```
/data/data/com.droidtranslator.app/files/
  ├── config_global.json         (Key Pool, Thẻ Prompt, Cài đặt chung)
  └── projects/
      ├── Dai_Quan_Gia_Ma_Hoang.json       (Dữ liệu dự án)
      ├── Dai_Quan_Gia_Ma_Hoang.json.bak   (File dự phòng chống ngắt nguồn)
      └── ...
```
- **Tự động lưu (Auto-Flush)**: Ngay khi 1 chương dịch xong $\rightarrow$ Ghi đĩa ngay.
- **Lifecycle Guard**: Ghi đĩa trong `onPause()`, `onStop()`, `onDestroy()`.

---

### 2. Chi Tiết 5 Định Dạng Nhập / Xuất

| Định dạng | Nhập (Import) | Xuất (Export) |
| :--- | :--- | :--- |
| **📄 TXT (Plain Text)** | Hỗ trợ UTF-8, UTF-16, GBK, GB2312 (tự nhận diện bảng mã) | File văn bản phân cách chương rõ ràng |
| **📚 EPUB (Standard Ebook)** | Giải nén ZIP, phân tích `content.opf`, `toc.ncx` | Đóng gói EPUB chuẩn có TOC mục lục, bìa, CSS căn lề đẹp |
| **🌐 HTML (Offline Reader)** | Bóc tách thẻ `<p>`, `<br>`, `<h1>-<h6>` | Đóng gói file HTML5 có Menu mục lục bên trái, giao diện Đen/Sáng |
| **📱 MOBI (Kindle Legacy)** | Trích xuất stream PalmDOC HTML | Đóng gói PalmDOC text/header tương thích máy Kindle cũ |
| **⚡ AZW3 (Kindle KF8)** | Trích xuất KF8 container | Đóng gói KF8 chuẩn hiển thị mục lục và typography trên Kindle |

---

### 3. Kế Hoạch Triển Khai
1. **Tạo `ProjectStorageManager.java`**: Xây dựng module lưu trữ Atomic File Storage chuyên biệt cho Android.
2. **Tạo `EbookFormatEngine.java`**: Xử lý giải mã và đóng gói 5 định dạng (TXT, EPUB, HTML, MOBI, AZW3).
3. **Cập nhật `MainActivity.java`**:
   - Thay thế toàn bộ code lưu trữ cũ sang `ProjectStorageManager`.
   - Viết lại hàm xuất file với hộp thoại Modal chọn 5 định dạng + Share Sheet an toàn tuyệt đối.
   - Thêm bộ lọc file đa định dạng (`.txt`, `.epub`, `.html`, `.htm`, `.mobi`, `.azw3`) khi chọn file truyện gốc.
4. **Cập nhật Web Preview (`AndroidPhoneSimulator.tsx` / `ebook-parser.ts`)**: Đồng bộ 100% tính năng nhập/xuất 5 định dạng.
5. **Kiểm thử và xác minh cú pháp**: Chạy `verify-java-final.mjs` và build applet.

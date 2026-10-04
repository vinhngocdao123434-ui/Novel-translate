# Kế Hoạch Đại Tu Tab Cài Đặt & Bổ Sung Model 3.5 Flash Lite

Nâng cấp trải nghiệm toàn diện cho ứng dụng DroidTranslator: Thêm lại model **3.5 Flash Lite** vào danh mục Model của Tab Key & Prompt, đại tu **Tab Cài Đặt** với giao diện nút gạt Switch xanh ngọc hiện đại, bộ tăng giảm số `[-] [+]` chống vỡ chữ và hệ thống popup hướng dẫn `(?)` siêu dễ hiểu cho người mới.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Toàn bộ yêu cầu bổ sung đã được ghi nhận:
> 1. **Tab 1 - Key & Prompt**: Thêm lại model `gemini-3.5-flash-lite` (3.5 Flash Lite) và giữ trọn vẹn toàn bộ 4 model hiện có (3.6 Flash, 2.5 Flash, 2.5 Flash Lite, 2.5 Pro).
> 2. **Tab 4 - Cài Đặt**:
>    - Chuyển toàn bộ các tính năng Bật/Tắt sang **Nút gạt Switch xanh ngọc (`#10B981`)** nằm ở góc phải mỗi hàng.
>    - Thay thế 12 nút vuông bị ngắt chữ (`≥ 4 LẦ N`) bằng **Bộ tăng giảm số nhanh `[ - ]` Số `[ + ]`**.
>    - Bổ sung nút tròn **`(?)`** ở tất cả các mục cấu hình.
>    - Toàn bộ nội dung popup **`(?)`** được viết lại theo phong cách tiếng Việt đời thường, cực kỳ ngắn gọn, giải thích rõ công dụng và đưa ra lời khuyên nên BẬT hay TẮT.

---

### 1. Danh Sách Model Tại Tab Key & Prompt (Đầy Đủ 5 Model)

1. **3.6 Flash** (`gemini-3.6-flash`): *Model Siêu Cấp 2026* — Chuyên gia xử lý Hán Việt & Làm mượt toàn văn tuyệt đối.
2. **2.5 Flash** (`gemini-2.5-flash`): *Mặc định - Siêu tốc* — Cân bằng tốc độ và độ mượt văn phong.
3. **2.5 Flash Lite** (`gemini-2.5-flash-lite`): *Tiết kiệm Quota* — Rất nhanh, ít tốn RPM/TPM.
4. **3.5 Flash Lite** (`gemini-3.5-flash-lite`): *Thế hệ mới Siêu nhẹ* — Tốc độ phản hồi tức thì, tối ưu chi phí & hạn ngạch.
5. **2.5 Pro** (`gemini-2.5-pro`): *Chuyên sâu* — Dành cho chương văn học phức tạp cần lập luận sâu.

---

### 2. Chi Tiết Thay Đổi Giao Diện Tab Cài Đặt

| Vị trí | Hiện trạng cũ | Nâng cấp mới (Pixel-Perfect) |
| :--- | :--- | :--- |
| **Độ dài chữ Hán & Tần suất lặp** | 6 nút vuông ép ngang gây vỡ chữ thành 3 dòng (`≥ 4 LẦ N`) + nút LƯU xanh to | Hộp chọn số tinh tế: `[ - ]` `  2 ký tự  ` `[ + ]` và `[ - ]` `  ≥ 4 lần  ` `[ + ]` |
| **Chống lọt chữ Hán 2 lớp** | Nút dài to đùng bấm đổi chữ | Hàng ngang: Tiêu đề + Phụ đề + **Nút gạt Switch xanh ngọc** bên phải |
| **Tự động sửa lỗi / Dịch bù** | Nút dài to đùng màu xám/xanh | Hàng ngang: Tiêu đề + Phụ đề + **Nút gạt Switch xanh ngọc** bên phải |
| **Xung đột nghĩa từ điển** | Nút to đùng chữ in hoa dài dòng | Khối lựa chọn 2 tùy chọn rõ ràng kèm nút `(?)` giải thích |
| **Nút `(?)` Hướng dẫn** | Thiếu ở nhiều mục, nội dung dài dòng khó hiểu | Có mặt ở tất cả các mục, nội dung dân dã, chỉ rõ nên bật hay tắt |

---

### 3. Nội Dung Các Popup Hướng Dẫn `(?)` Siêu Dễ Hiểu

1. **Độ dài chữ Hán tối thiểu `(?)`**:
   - *Tác dụng:* Chọn từ có bao nhiêu chữ thì máy mới lưu vào danh sách nhớ.
   - *Khuyên dùng:* Nên để **2 hoặc 3**. Để 1 sẽ bị lưu nhiều chữ rác (như "tôi", "nó").
2. **Tần suất lặp lại tối thiểu `(?)`**:
   - *Tác dụng:* Từ đó phải xuất hiện bao nhiêu lần trong truyện thì máy mới tính là từ quan trọng (tên nhân vật, chiêu thức).
   - *Khuyên dùng:* Nên để **2 đến 4 lần**.
3. **Bộ lọc chống chữ Hán sót `(?)`**:
   - *Tác dụng:* Tự động quét và dịch nốt các chữ tiếng Trung còn sót lại trong bản dịch.
   - *Khuyên dùng:* **NÊN BẬT** để đọc truyện không bao giờ bị vướng chữ Tàu.
4. **Tự động dịch lại khi lỗi nặng `(?)`**:
   - *Tác dụng:* Nếu mạng yếu hoặc dịch thiếu đoạn, app sẽ tự đổi chìa khóa (Key) khác để dịch bù ngay lập tức.
   - *Khuyên dùng:* **NÊN BẬT** để không phải bấm dịch lại bằng tay.
5. **Xử lý xung đột nghĩa từ điển `(?)`**:
   - *Tác dụng:* Khi một từ tiếng Trung ở chương sau có nghĩa khác với chương trước thì ưu tiên cái nào.
   - *Khuyên dùng:* Nên chọn **Giữ nghĩa cũ** để tên nhân vật xuyên suốt không bị đổi giữa chừng.

---

### 4. Kế Hoạch Thực Hiện
1. Cập nhật mảng model trong `MainActivity.java` và Web Preview để thêm `gemini-3.5-flash-lite`.
2. Tạo component / helper `createSwitchRow()` và `createStepperRow()` trong `MainActivity.java` và Web Preview.
3. Viết lại hàm `showSettingsHelpDialog()` với bộ từ điển giải thích mới siêu dễ hiểu.
4. Đại tu toàn bộ hàm `createTabSettingsView()` và `refreshSettingsUI()`.
5. Đồng bộ dữ liệu sang `src/native-project-data.ts`, kiểm tra cú pháp và build applet.

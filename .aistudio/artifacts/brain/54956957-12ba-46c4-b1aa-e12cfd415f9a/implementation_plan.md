# Kế Hoạch Đại Tu Giao Diện DroidTranslator Native (100% Pure Java & XML)

Đại tu toàn diện giao diện ứng dụng Android Native thuần Java từ phong cách thô sơ cũ sang thiết kế **OLED Dark Glass** cao cấp, tinh tế, mượt mà như Flutter, tương đồng 100% với bản Web Preview nhưng chạy Native 100% không tốn RAM.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Toàn bộ các quyết định đã được xác nhận qua phỏng vấn người dùng:
> - **Phong cách thiết kế**: OLED Dark Glass với bo góc 20dp, viền Glow tinh tế và màu sắc hiện đại.
> - **Cảm giác vuốt chạm**: Flutter-like Physics với chuyển cảnh mượt mà, phản hồi rung Haptic và hiệu ứng Ripple bo góc.
> - **Thanh điều hướng**: Floating Navigation Bar bo tròn nổi phía trên đáy màn hình với icon phát sáng.

---

### 1. Overview & Core Concept

- **Mục tiêu**: Nâng tầm trải nghiệm người dùng trên thiết bị Android thực tế, biến DroidTranslator từ giao diện hình hộp đơn giản thành một ứng dụng dịch truyện hiện đại, sang xịn mịn, trực quan và nịnh mắt.
- **Đối tượng**: Người đọc và dịch tiểu thuyết chuyên nghiệp dịch liên tục hàng trăm chương, cần giao diện tối ưu ban đêm (OLED Dark), không mỏi mắt, thao tác 1 tay thuận tiện.
- **Giá trị cốt lõi**: Tốc độ xử lý Native siêu tốc (0% lag) kết hợp cùng visual đẳng cấp Flutter/iOS.

---

### 2. User Experience & Visual Design

#### A. Hệ Thống Màu & Gradient (OLED Dark Glass Palette)
- **Background Canvas**: `#0B0F17` (Deep Midnight OLED).
- **Surface / Card Background**: `#131B2A` kết hợp stroke viền phát sáng nhẹ `1dp solid #1F2E47` và `20dp` corner radius.
- **Primary Accent**: Gradient Cam Rực Rỡ `#FF6B00` $\rightarrow$ `#FFA100` cho nút Dịch & Nạp Key.
- **Secondary Accent**: Gradient Xanh Ngọc / Cyan `#00D2FF` $\rightarrow$ `#0072FF` cho Model & Tiến trình.
- **Success & Status**: `#10B981` (Emerald) với hiệu ứng Glow mờ.
- **Danger Zone**: `#EF4444` với viền cảnh báo tinh tế `#7F1D1D`.

#### B. Nâng Cấp Tương Tác & Cảm Giác Vuốt Chạm (Tactile & Physics)
- **Haptic Feedback**: Rung siêu nhẹ (`performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)`) khi bấm phím, chọn model hoặc chuyển tab.
- **Ripple & Press State**: Toàn bộ nút bấm và card sử dụng `RippleDrawable` với góc bo tròn mềm mại, độ co nhẹ (`scale 0.98`) khi nhấn giữ.
- **OverScroll Physics**: Tích hợp cuộn đàn hồi mượt mà cho toàn bộ `NestedScrollView` và `RecyclerView`.
- **Floating Bottom Navigation**: Thanh điều hướng nổi dạng Capsule bo góc `28dp`, đổ bóng `Elevation 12dp`, nền Glassmorphism mờ `#162032DD` với indicator phát sáng dưới icon active.

---

### 3. Chi Tiết Các Tab Giao Diện Mới

```
┌──────────────────────────────────────────────────────────┐
│  [⚡ DroidTranslator]  • God-Mode: Sẵn sàng   [ROOT #]   │ Header Status Glass
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 📖 Dự án: Đại Quản Gia Ma Hoàng         [+ Đổi Truyện]│ │ Project Pill Card
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 🔑 Multi-Key Pool (12 Keys)           [▶ Test Tất Cả]│ │
│ │ [ Dán Key tại đây...                               ] │ │
│ │ [       + THÊM API KEY VÀO POOL (GRADIENT)        ] │ │ Card Bo Góc 20dp
│ │  1. ...XYZ12345    [ ACTIVE ]   [⟳]   [🗑]          │ │ Viền Glow 1dp
│ │  2. ...ABC67890    [ ACTIVE ]   [⟳]   [🗑]          │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ✨ Chọn Dòng Model Gemini              [gemini-2.5-pro] │ │ Model Card
│ │ [3.6 Flash - Siêu Cấp 2026] [2.5 Flash - Mặc Định]  │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│     ┌──────────────────────────────────────────────┐     │
│     │  🔑 Key&Prompt  ⚡ Dịch  📚 Thư Viện  ⚙️ Cài Đặt │     │ Floating Bottom Bar
│     └──────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

#### Tab 1: Key & Prompt Pool
- Nâng cấp ô nhập Key thành Card Glass bo cong 20dp, placeholder rõ ràng.
- Danh sách Key dạng Card Item bo góc 14dp, gắn Badge trạng thái Active màu xanh ngọc phát sáng, nút Test và nút Xóa bo tròn gọn gàng.
- Khu vực chọn Model dạng danh sách thẻ chọn (Selection Cards) với icon AI, subtitle mô tả ưu điểm từng model.

#### Tab 2: Dịch Thuật & Glossary AI
- Box nhập file & chọn tệp dạng Drag/Drop Area phong cách hiện đại với nút chọn file to bản.
- Thanh hiển thị tiến độ dịch dạng Gradient Progress Bar mượt mà, số chương hoàn thành dạng lớn trực quan.
- Cụm nút điều khiển Dịch / Tạm Dừng / Hủy dạng Gradient nổi bật.
- Bảng Master Glossary thu gọn với phân trang mượt mà.

#### Tab 3: Kho Bản Dịch & AMOLED Reader
- Danh sách chương dạng Card List sang trọng, trạng thái "Đã Dịch" / "Chưa Dịch" hiển thị bằng icon tinh tế thay vì bảng chữ màu xanh đơn điệu.
- Bộ đọc truyện AMOLED Reader Fullscreen với cử chỉ vuốt lật chương tự nhiên, chỉnh cỡ chữ, nền Sepia / OLED Black.

#### Tab 4: Cài Đặt & Quản Lý Dự Án
- Cụm Switch & Slider thiết kế bo cong hiện đại.
- Thẻ thông tin dự án hiện tại với nút Xóa màu đỏ Ruby sang trọng, có hộp thoại xác nhận kiểu Bottom Sheet.

---

### 4. Technical Architecture & File Modifications

#### A. Kiến trúc Giao Diện Native (Pure Java + XML Drawables)
- **Không dùng thư viện bên ngoài nặng nề**: Tận dụng triệt để `MaterialCardView`, `ShapeAppearanceModel`, `LayerDrawable`, `GradientDrawable`, `StateListDrawable` chuẩn Android Jetpack.
- **Tối ưu RAM & Rendering**: Không phân bổ bitmap thừa, 100% vector drawables và XML gradients nhẹ < 50KB, giữ nguyên chuẩn OOM -1000 siêu nhẹ.

#### B. Các Tệp Sẽ Được Nâng Cấp:
1. `android/app/src/main/res/values/colors.xml`: Bổ sung toàn bộ bảng màu OLED Dark Glass (`colorGlassSurface`, `colorGlassBorder`, `colorAccentGradientStart`, `colorAccentGradientEnd`, v.v.).
2. `android/app/src/main/res/values/styles.xml`: Định nghĩa style bo góc `ShapeAppearance.App.LargeCard` (20dp), `ShapeAppearance.App.Pill` (50dp).
3. `android/app/src/main/res/drawable/`: Tạo bộ drawable mới:
   - `bg_card_glass.xml` (Card kính viền glow)
   - `bg_btn_gradient_primary.xml` (Nút bấm gradient cam)
   - `bg_floating_bottom_bar.xml` (Thanh bar nổi bo tròn)
   - `bg_badge_active.xml` (Badge trạng thái phát sáng)
   - `ripple_round_card.xml` (Hiệu ứng chạm mềm mại)
4. `android/app/src/main/res/layout/activity_main.xml`: Thiết kế lại layout phân tầng hiện đại, tích hợp Floating Bottom Navigation Bar.
5. `android/app/src/main/java/com/droidtranslator/app/MainActivity.java`: Cập nhật logic render giao diện mới, animation chuyển tab, haptic feedback và ripple tương tác.
6. `src/native-project-data.ts`: Đồng bộ hóa toàn bộ mã nguồn APK mới vào hệ thống preview và bộ cài.

---

### 5. Kế Hoạch Triển Khai (Verification & Execution)
- Chạy kiểm tra Java Syntax và tính toàn vẹn XML sau khi viết code.
- Chạy `compile_applet` và `lint_applet` để đảm bảo hệ thống không có bất kỳ lỗi nào.

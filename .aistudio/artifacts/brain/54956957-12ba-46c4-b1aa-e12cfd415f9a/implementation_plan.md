# Kế Hoạch Tinh Chỉnh Màu Sắc OLED True Black & Khắc Phục Layout Pixel-Perfect Y Hệt Preview

Khắc phục triệt để sự khác biệt về thị giác giữa bản Preview và bản APK thực tế: chuyển từ tông xanh thô (Navy) sang **OLED Pitch Black (`#08090C`) & Dark Charcoal (`#12131A`)**, tái cấu trúc Header 3 tầng sang trọng và dàn phẳng danh sách Key trên một dòng duy nhất.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Toàn bộ các điểm khác biệt then chốt đã được làm rõ:
> - **Màu sắc nền & thẻ**: Chuyển sang OLED True Black (`#08090C`) và thẻ màu than chì Charcoal (`#12131A`) với viền siêu mảnh mờ `#1E202E`.
> - **Dàn trang API Key Item**: Loại bỏ các khối nút bấm vuông to tướng gây tràn dòng; chuyển thành 1 dòng ngang duy nhất với Badge số `#1`, Text Key rút gọn, Pill `ACTIVE` xanh ngọc, nút `⟳ Test` nhỏ gọn và nút thùng rác `🗑` tinh tế.
> - **Header 3 Tầng Pixel-Perfect**:
>   - *Tầng 1 (Status)*: `🟢 God-Mode: • Sẵn sàng` + `ROOT #` + `5 Lớp`.
>   - *Tầng 2 (Branding & Action)*: Logo App có khung bo tròn + `DroidTranslator` (chữ `Translator` màu xanh ngọc gradient) + `NATIVE` badge + phụ đề `Android 16 Kernel Engine` + Nút `❓ Hướng Dẫn` + Badge `🛡️ OOM -1000`.
>   - *Tầng 3 (Dự án)*: Thanh chọn `📑 Tiến trình: [Tên truyện ▾]` + Nút `+ Tiến trình mới` màu xanh biển rực rỡ.
> - **Bottom Bar**: Nền đen tuyền, Icon & Text màu Vàng Kim Amber (`#F59E0B`) cho tab đang chọn, loại bỏ viền bo sáng màu xanh to bè.

---

### 1. Phân Tích Lỗi Sai Khiến APK Bị "Phèn" & Giải Pháp

| Vấn đề trên APK cũ | Lý do khiến giao diện thô | Giải pháp khắc phục 100% như Preview |
| :--- | :--- | :--- |
| **Màu nền bị ám xanh Navy** | Dùng mã màu `#0B0F17` & `#131B2A` với viền xanh đậm `#1F2E47` | Đổi sang OLED Black `#08090C`, Card `#12131A`, viền `#1E202E` |
| **Hàng Key bị tràn chữ 4 dòng** | 2 nút Test & Xóa chiếm tới 50% bề ngang, ép TextView bị bó hẹp | Đổi layout thành 1 dòng ngang cố định, nút icon gọn gàng |
| **Header bị kéo giãn dị dạng** | Badge `NATIVE` chiếm chiều cao lớn, thiếu logo app và phân tầng | Tái lập Header 3 tầng chuẩn pixel-perfect với icon và subtitle |
| **Thanh Bottom Bar** | Viền xanh cyan dày cộm quanh nút active | Đổi sang phong cách Tối Giản Vàng Kim (Gold/Amber) cao cấp |

---

### 2. Sơ Đồ Cấu Trúc Header & Key Item Mới

```
┌────────────────────────────────────────────────────────────┐
│ 🟢 God-Mode: • Sẵn sàng            [ROOT #]  [5 Lớp]       │ Tầng 1: System Status
├────────────────────────────────────────────────────────────┤
│ ┌──┐ DroidTranslator [NATIVE]       [❓ Hướng Dẫn]          │ Tầng 2: Brand Lockup
│ │⚡│ Android 16 Kernel Engine       [🛡️ OOM -1000]         │ & Core Badges
│ └──┘                                                       │
├────────────────────────────────────────────────────────────┤
│ [📑 Tiến trình: Dai Quan Gia M... ▾]     [+ Tiến trình mới] │ Tầng 3: Project Bar
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  [1]  ...XYZ12345        [ACTIVE]   [⟳ Test]   [🗑]        │ Hàng Key 1 dòng ngang
└────────────────────────────────────────────────────────────┘
```

---

### 3. Kế Hoạch Thay Đổi Chi Tiết

1. **`colors.xml`**: Cập nhật toàn bộ mã màu về hệ True OLED Dark:
   - `bgCanvas`: `#08090C`
   - `cardSurface`: `#12131A`
   - `cardBorder`: `#1E202E`
   - `cardSurfaceInner`: `#171922`
   - `accentGold`: `#F59E0B`
   - `accentTeal`: `#10B981`
   - `textPrimary`: `#FFFFFF`
   - `textSecondary`: `#94A3B8`
   - `textMuted`: `#64748B`
2. **`MainActivity.java`**:
   - Viết lại phần `initUI` dựng đúng Header 3 tầng, icon app dạng rounded avatar.
   - Sửa `refreshKeyList()`: dùng `TextView` cho số thứ tự dạng badge vuông bo tròn `dp(6)`, key text 1 dòng `singleLine=true`, badge `ACTIVE` thu nhỏ, nút `⟳ Test` dạng pill nhỏ, nút `🗑` nhỏ gọn.
   - Sửa `FloatingBottomBar`: Icon và text màu Vàng Kim `#F59E0B` khi active, không dùng viền bao quanh to thô.
3. **Đồng bộ hóa & Kiểm thử**: Chạy `verify-java-final.mjs` và cập nhật `src/native-project-data.ts`.

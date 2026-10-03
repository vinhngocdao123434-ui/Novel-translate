# Kế Hoạch Tích Hợp Tính Năng Từ Kho GitHub gemini-novel Vào DroidTranslator Native (Đã Cập Nhật)

Tài liệu này đã được cập nhật dựa trên phản hồi của bạn: tích hợp quy trình **Tự động sửa lỗi 2 tầng khép kín (Offline $\rightarrow$ Online Re-translate)** và thiết kế **Biểu tượng ứng dụng (App Icon)** chính thức cho DroidTranslator.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Các điểm điều chỉnh cốt lõi theo phản hồi mới nhất:**
> - **Cơ chế sửa lỗi Offline & Online tự động 100%:** App tự động chạy kiểm định và sửa lỗi ngoại tuyến trước. Nếu sau khi sửa offline mà đạt chuẩn thì hoàn tất; nếu vẫn còn lỗi nặng (bị từ chối dịch, kẹt lặp từ, cắt cụt) thì hệ thống **tự động gửi lại lên Gemini** (tự xoay vòng API key) để dịch lại và ghi đè chính xác vào nội dung chương bị lỗi.
> - **Biểu tượng ứng dụng (App Icon):** Thiết kế logo/icon chính thức cho DroidTranslator (kết hợp biểu tượng Robot Android cách điệu, cuốn sách tiểu thuyết mở và luồng sóng dịch thuật AI), đồng bộ lên Favicon, Header ứng dụng, Màn hình chính giả lập Android (Home Screen) và mã nguồn Native Android (`ic_launcher`).
> - **Giữ nguyên các cam kết:** Lấy ứng dụng DroidTranslator hiện tại làm chủ đạo, không thêm SAF Storage Dialog (giữ cơ chế xuất file hiện hữu).

---

## 1. Chi Tiết Quy Trình Sửa Lỗi Tự Động 2 Tầng (Autonomous Dual-Tier Healer)

Quy trình này vận hành hoàn toàn tự động trong luồng dịch ngầm, không đòi hỏi người dùng phải can thiệp thủ công:

```
[Bản dịch thô nhận từ Gemini]
              │
              ▼
   ┌────────────────────────────────────────────────────────┐
   │ TẦNG 1: TỰ ĐỘNG SỬA LỖI NGOẠI TUYẾN (OFFLINE HEALING)  │
   │ (Xử lý tức thì, 0ms mạng, 0 token AI)                  │
   │  • Cắt bỏ câu chào mở đầu ("Dưới đây là...", "Đây là...")│
   │  • Cắt bỏ câu chúc kết thúc ("Hy vọng bạn thích...")   │
   │  • Gỡ bỏ codeblock (```) và thẻ rò rỉ                  │
   │  • Sửa lỗi gõ Telex kẹt phím (ngk, awk, owk, uwk)      │
   │  • Nén dòng trống dư thừa                              │
   │  • Thế bù thuật ngữ Glossary còn sót                   │
   │  • Phiên âm tự động chữ Hán sót qua Sino-Vietnamese    │
   └──────────────────────────┬─────────────────────────────┘
                              │
                              ▼
            ┌───────────────────────────────────┐
            │ KIỂM TRA ĐỘ HOÀN HẢO SAU SỬA      │
            │ (Audit Score >= 80 & Không lỗi?)  │
            └───────────────┬───────────────────┘
                            │
              ┌─────────────┴─────────────┐
             CÓ                           KHÔNG (Còn lỗi nặng)
              │                                      │
              ▼                                      ▼
   ┌──────────────────────┐        ┌────────────────────────────────────┐
   │ HẾT LỖI: HOÀN TẤT    │        │ TẦNG 2: TỰ ĐỘNG GỬI GEMINI DỊCH LẠI│
   │ Lưu chương vào bộ nhớ│        │ (ONLINE RE-TRANSLATION FALLBACK)   │
   │ Cập nhật tiến độ     │        │  • Phát hiện: Từ chối dịch / Lặp từ│
   │ Tiếp tục chương sau  │        │  • Tự động xoay API key mới        │
   └──────────────────────┘        │  • Gửi kèm prompt cứu hộ           │
                                   │  • Ghi đè chính xác vào chương lỗi │
                                   └────────────────────────────────────┘
```

### Các bước cụ thể:
1. **Tầng 1 (Offline Auto-Healing):**
   - Sau khi Gemini phản hồi, văn bản đi qua bộ lọc `ChapterAuditor` và từ điển `SinoVietnameseDictionary` (500 từ Hán-Việt chuẩn).
   - Tự động thanh lọc mọi câu chào thừa, câu chúc xã giao, thẻ markdown, và phiên âm triệt để các chữ Hán bị bỏ sót.
2. **Đánh giá lại (Re-Audit):**
   - Kiểm tra xem chương có dính các lỗi nặng như:
     - *AI từ chối dịch* (Safety violation, "Tôi không thể dịch...", "As an AI...").
     - *Lặp từ vô tận* (Degeneration loop - cùng 1 câu/đoạn văn lặp liên tục $\ge 4$ lần).
     - *Bản dịch rỗng hoặc ngắn bất thường* ($< 30\%$ độ dài bản gốc).
3. **Tầng 2 (Online Auto-Retry & Ghi đè):**
   - Nếu chương vẫn dính lỗi nặng, hệ thống kích hoạt cơ chế dịch lại tự động.
   - Chọn API key hợp lệ tiếp theo (nếu key trước bị chặn hoặc rate-limit).
   - Gửi yêu cầu dịch lại chương đó với chỉ thị nghiêm ngặt hơn (Strict Prompt).
   - Sau khi nhận bản dịch mới hợp lệ, **ghi đè trực tiếp** vào danh sách `translatedChapters` của chương đó và tiếp tục tiến trình bình thường.

---

## 2. Thiết Kế & Tích Hợp Biểu Tượng Ứng Dụng (App Icon Branding)

Hiện tại ứng dụng chưa có biểu tượng chính thức. Chúng ta sẽ xây dựng một bộ nhận diện thương hiệu đặc trưng:

### Ý tưởng thiết kế Icon:
* **Biểu tượng:** Sự kết hợp hài hòa giữa **Đầu Robot Android công nghệ** cách điệu trên nền **Trang sách / Cuộn tiểu thuyết mở ra**, được lồng ghép **Luồng sóng dịch thuật đa ngữ (Translation Waves)** hiện đại.
* **Màu sắc:** Phối màu công nghệ cao cấp giữa **Xanh lục ngọc Android (`#10b981` / `#34d399`)** và **Xanh lam AI Gemini (`#3b82f6` / `#60a5fa`)** trên nền tối sâu (`#0d1117`).

### Vị trí xuất hiện:
1. **Web Favicon & Entry Point:** Tích hợp SVG Icon độ nét cao vào `index.html` và hiển thị trên tab trình duyệt.
2. **Header của Ứng dụng:** Đặt biểu tượng chính thức cạnh tên thương hiệu **DroidTranslator (Android Native Edition)**.
3. **Android Phone Simulator:** 
   - Đưa icon vào **Màn hình chính (Home Screen)** của điện thoại giả lập.
   - Hiển thị trên thanh trạng thái Notification và Drawer của trình giả lập.
4. **Mã nguồn Native Android Java:**
   - Tạo tệp `ic_launcher.xml` và `ic_launcher_foreground.xml` trong thư mục tài nguyên `res/drawable` và `res/mipmap` của dự án Android để khi người dùng build APK sẽ có icon hoàn chỉnh ngoài màn hình điện thoại thật.

---

## 3. Các Tính Năng Đã Thống Nhất Trong Bản Kế Hoạch

| Tính năng | Trạng thái | Cách hoạt động tóm tắt |
| :--- | :--- | :--- |
| **Quy trình Sửa Lỗi Tự Động 2 Tầng** | **Chấp thuận** | Sửa ngầm offline $\rightarrow$ nếu hết lỗi thì thôi $\rightarrow$ nếu còn lỗi nặng thì tự gọi Gemini dịch lại và ghi đè đúng chương lỗi. |
| **Biểu Tượng Ứng Dụng (App Icon)** | **Chấp thuận** | Thiết kế bộ icon biểu tượng Android + Tiểu thuyết + AI, gắn vào Web Header, Favicon, Phone Simulator và Native Android. |
| **Động Cơ Phiên Âm Hán-Việt 500 Từ** | **Chấp thuận** | Bộ từ điển âm Hán-Việt cứu trợ, tự động thay thế các chữ Hán AI bỏ quên thành tiếng Việt chuẩn. |
| **Bảng Đo Đạc Linux Kernel Thực Tế** | **Chấp thuận** | Đọc và hiển thị trực tiếp PID, UID, và điểm `/proc/self/oom_score_adj` (-1000) cùng trạng thái Phantom Killer. |
| **Tách Riêng Lời Tựa (Prologue)** | **Chấp thuận** | Tự động bóc tách phần giới thiệu trước Chương 1 để dịch trọn vẹn. |
| **Xuất File qua Hộp thoại SAF** | **Từ chối (Giữ nguyên)** | Giữ nguyên 100% cơ chế lưu file Download và chia sẻ hiện hữu của app, không thêm SAF. |

---

## 4. Kiến Trúc Kỹ Thuật Khi Triển Khai

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HỆ THỐNG GIAO DIỆN & NHẬN DIỆN                    │
│   • Biểu tượng DroidTranslator App Icon (SVG Vector độ phân giải cao)   │
│   • Header, Tab Navigator, Android Phone Simulator, Native Project Code  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    DỊCH & TỰ ĐỘNG BẢO VỆ CHẤT LƯỢNG                    │
│                                                                         │
│   [GeminiEngine]                                                        │
│         │                                                               │
│         ▼ (Dịch thô)                                                    │
│   [ChapterAuditor] ◄─── [SinoVietnameseDictionary (500 từ Hán-Việt)]    │
│         │                                                               │
│         ├─ Tự sửa Offline: Cắt câu chào/chúc, sửa Telex, thế Glossary   │
│         │                                                               │
│         ├─ Đánh giá: Hết lỗi? ──(Đúng)──► [Ghi vào Danh sách Chương]    │
│         │                                                               │
│         └─ Còn lỗi nặng? ──────(Sai)───► [Tự động Re-translate Gemini]  │
│                                           (Xoay Key & Ghi đè chương cũ) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Bước Tiếp Theo

Kế hoạch đã được cập nhật đầy đủ và chuẩn xác theo đúng yêu cầu của bạn. Mời bạn bấm **Proceed** hoặc xác nhận để chúng ta bắt đầu triển khai các tính năng trên vào ứng dụng!

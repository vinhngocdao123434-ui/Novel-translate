# Kế Hoạch Triển Khai Cơ Chế Dịch Bất Tử (Immortal Translation Engine)

Kế hoạch tái cấu trúc toàn diện cơ chế điều phối API và vòng lặp dịch thuật để ứng dụng có thể tự vận hành bền bỉ xuyên suốt 8 giờ ngủ mà không bao giờ bị dừng đột ngột bởi lỗi mạng hay giới hạn quota.

## User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định then chốt đã được thống nhất sau phỏng vấn kỹ thuật và sẽ được áp dụng trong quá trình xây dựng:

- **Thứ tự xoay vòng Model Lite**: Cố định luân chuyển theo chuỗi Flash Lite hiệu năng cao: `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemini-2.5-flash-lite`. Tuyệt đối không tự nhảy sang các model bản full (non-lite hay pro) để tránh lãng phí hạn ngạch thấp.
- **Tần suất luân chuyển API Key**: Chuyển ngay sang Key tiếp theo chỉ sau **1 lần thử duy nhất** khi gặp lỗi kết nối hoặc mã lỗi API, đảm bảo tốc độ phản hồi cực nhanh, không để tiến trình bị nghẽn.
- **Cơ chế Hồi sinh Bất tử (Infinite Heartbeat Sleep)**: Khi toàn bộ danh sách API Key và tất cả Model Lite đều bị chặn (hoặc khi mất kết nối Internet/4G), ứng dụng **tuyệt đối không tắt trạng thái dịch** (`isTranslating` vẫn duy trì `true`), mà tự động chuyển sang chế độ ngủ đông 60 giây, phát nhịp tim thăm dò kết nối và tự động tiếp tục dịch chương dở dang ngay khi có mạng trở lại.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CHU TRÌNH XOAY VÒNG BẤT TỬ 3 TẦNG                   │
└────────────────────────────────────────────────────────────────────────┘

 [Bắt đầu Dịch Chương N]
         │
         ▼
┌──────────────────┐    Thất bại 1 lần      ┌─────────────────────────┐
│ Tầng 1: API Key  │ ────────────────────► │ Xoay ngay sang Key tiếp │
│ (Duyệt vòng tròn)│                       │ theo trong Pool         │
└──────────────────┘                       └─────────────────────────┘
         │
         │ Thử hết toàn bộ vòng Key vẫn lỗi (429/503/Network)
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Tầng 2: Model Fallback Cascade (Chỉ trong nhóm Flash Lite)          │
│ 1. gemini-3.5-flash-lite ──► 2. gemini-3.1-flash-lite ──► 3. 2.5 Lite│
└─────────────────────────────────────────────────────────────────────┘
         │
         │ Toàn bộ 3 Model Lite và toàn bộ Key đều thất bại
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Tầng 3: Ngủ Đông Thăm Dò (Immortal Sleeping 60s)                    │
│ • Giữ nguyên trạng thái ĐANG DỊCH (isTranslating = true)             │
│ • Hiển thị đếm ngược 60s trên thanh thông báo Native                │
│ • Hết 60s tự động thức giấc, kiểm tra kết nối và dịch lại Chương N  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Tổng Quan & Mục Tiêu Cốt Lõi

- **Mục tiêu chính**: Biến app dịch tiểu thuyết thành một cỗ máy "bất tử", có khả năng tự sửa lỗi và tự phục hồi khi gặp các tình huống gián đoạn (mất mạng Wi-Fi chập chờn ban đêm, Google bóp băng thông 429 Too Many Requests, hoặc máy chủ Gemini 503 Service Unavailable).
- **Trải nghiệm mong đợi**: Người dùng bấm "Bắt đầu dịch" vào lúc 23:00 và đi ngủ; đến 07:00 sáng hôm sau, toàn bộ tiểu thuyết hàng trăm chương đã được hoàn tất trọn vẹn, không xảy ra trường hợp dừng ở chương 16 như trước đây.
- **Mô hình AI mới**: Bổ sung chính thức model `gemini-3.1-flash-lite` vào tab cài đặt Model Preset và cấu hình điều hướng tự động.

---

## 2. Trải Nghiệm Người Dùng & Giao Diện (UX/UI)

### Luồng Trải Nghiệm
1. **Thiết lập Model**: Trong tab Model, người dùng có thêm lựa chọn trực quan `Gemini 3.1 Flash Lite` với badge "Tối ưu Quota 2026 - Siêu tiết kiệm".
2. **Cơ chế Bật/Tắt Dịch Bất Tử**: Bổ sung công tắc **"Chế độ Dịch Bất Tử (Ngủ xuyên đêm)"** trong Bảng điều khiển dịch. Khi bật chế độ này:
   - Giao diện chuyển huy hiệu trạng thái sang màu xanh lục neon nhấp nháy êm dịu: `🟢 CHẾ ĐỘ BẤT TỬ HOẠT ĐỘNG`.
   - Các cảnh báo lỗi mạng sẽ không còn hiện modal bắt bấm "Tiếp tục" thủ công.
3. **Phản hồi Trạng Thái Trực Quan (Live Status Banner)**:
   - Khi đang xoay Key: Thanh trạng thái hiển thị: `🔄 Đổi Key [AIzaSy...4a] -> Thử model 3.5 Lite`.
   - Khi vào chế độ ngủ đông tạm thời do cạn hạn ngạch: Hiển thị đồng hồ đếm ngược: `⏳ Tạm nghỉ 60s chờ Google hồi quota... (Thử lại sau 42s)`.
   - Native Notification trên thanh trạng thái Android cập nhật tiến trình liên tục, không bị hệ điều hành đóng app.

---

## 3. Các Quyết Định Kỹ Thuật Then Chốt & Đánh Đổi

### Quyết định 1: Loại bỏ triệt để điểm nghẽn "Dừng dịch an toàn" ở lỗi mạng
- *Cách tiếp cận cũ*: Khi API trả về lỗi mạng sau 4 lần thử, app gọi `setIsTranslating(false); setIsPaused(true);` và dừng hẳn.
- *Cách tiếp cận mới*: Chuyển đổi thành trạng thái `isSleepingCooldown`. Tiến trình dịch chính không bị hủy bỏ; worker nền vẫn giữ WakeLock và tiếp tục vòng lặp sau thời gian nghỉ 60s.

### Quyết định 2: Giới hạn xoay vòng nghiêm ngặt trong tập Model Lite
- *Cách tiếp cận*: Chỉ bao gồm 3 model:
  1. `gemini-3.5-flash-lite`
  2. `gemini-3.1-flash-lite`
  3. `gemini-2.5-flash-lite`
- *Lý do*: Các model Flash Lite được Google cấp hạn ngạch RPM (Requests Per Minute) và RPD (Requests Per Day) cao gấp nhiều lần so với bản Pro hoặc 3.6 Flash tiêu chuẩn. Giữ việc xoay tua trong phạm vi Lite giúp tránh việc chạm ngưỡng quota sớm.

### Quyết định 3: Tối ưu 1 lần thử cho mỗi Key (Ultra-fast Key Hopping)
- *Cách tiếp cận*: Mỗi key chỉ thử 1 lần; nếu trả về lỗi (429, 500, 503, Failed to fetch) thì ngay lập tức chuyển sang key tiếp theo trong mảng `globalApiKeys`.
- *Lợi ích*: Nếu người dùng có 5-10 API key, việc chuyển đổi diễn ra trong vài giây thay vì chờ 10-15s cho mỗi key, loại bỏ hoàn toàn độ trễ của giao diện.

---

## 4. Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SƠ ĐỒ KIẾN TRÚC ĐIỀU PHỐI DỊCH BẤT TỬ                 │
└────────────────────────────────────────────────────────────────────────┘

                  ┌───────────────────────────────┐
                  │    AndroidPhoneSimulator      │
                  │   (isTranslating = true)      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    executeChapterProcess      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │  callImmortalGeminiApiWithCascade   │
               └──────────────────┬──────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────────────┐               ┌─────────────────────────────────┐
│       Vòng Lặp Model Lite       │               │        Vòng Lặp API Key         │
│  [3.5 Lite ➔ 3.1 Lite ➔ 2.5 Lite]│               │   (Chuyển sau 1 lần lỗi)        │
└────────────────┬────────────────┘               └────────────────┬────────────────┘
                 │                                                 │
                 └────────────────────────┬────────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Tất cả Key + Model đều lỗi?       │
                      └───────────────────┬───────────────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         │ Có                              │ Không
                         ▼                                 ▼
         ┌───────────────────────────────┐     ┌────────────────────────┐
         │ immortalSleepCountdown(60s)   │     │ Tiếp nhận Bản Dịch     │
         │ - WakeLock vẫn giữ            │     │ Lưu IndexedDB          │
         │ - Tự hồi sinh sang Chương N   │     │ Chuyển sang Chương N+1 │
         └───────────────────────────────┘     └────────────────────────┘
```

### Các Module Cần Cập Nhật:
1. **`PRESET_MODELS` trong `AndroidPhoneSimulator.tsx`**: Thêm `gemini-3.1-flash-lite` với đầy đủ định danh API chuẩn và badge hiển thị.
2. **`callGeminiApiWithRetryAndRotation` nâng cấp thành `callImmortalGeminiApi`**:
   - Tích hợp 2 vòng lặp lồng nhau: Vòng ngoài lặp qua danh sách Model Lite (`['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite']`), vòng trong lặp qua từng Key trong `activeKeys`.
   - Mỗi Key chỉ thử 1 lần trước khi chuyển sang Key kế tiếp.
   - Khi hoàn thành 1 chu kỳ mà vẫn không có Key/Model nào thành công, kích hoạt bộ đếm ngủ đông 60s và tự động gọi lại chính nó cho đến khi thành công.
3. **`executeChapterProcess`**:
   - Gỡ bỏ logic dừng dịch cưỡng bức `setIsTranslating(false); setIsPaused(true);` ở dòng 2120.
   - Thay thế bằng logic tự phục hồi và hiển thị log thông báo màu cam thân thiện.
4. **Bộ nhớ đệm lưu trữ dự án**: Tự động lưu checkpoint mỗi khi 1 chương hoàn thành để dữ liệu luôn được an toàn tuyệt đối.

# Kế Hoạch Kiến Trúc: Bộ Quét Làm Mượt Bản Dịch Final & Quét Sạch Chữ Hán Rác (Final Global Polish & Sweeper)

Bản kế hoạch thiết kế và kiến trúc hoàn chỉnh cho tính năng **Làm Mượt Toàn Bộ Bản Dịch Cuối Cùng (Global Hanzi Sweeper)**, sử dụng thuật toán quét Offline chuyên sâu để bóc tách cả chữ Trung đứng độc lập lẫn từ dính Hán - Việt, lọc trùng và dịch thay thế đồng bộ 100%.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Các tiêu chuẩn xử lý cốt lõi được cập nhật theo phản hồi của người dùng:**
> 1. **Thuật toán quét Offline toàn diện 2 tầng (Dual-Pattern Offline Scanner)**:
>    - **Tầng 1 (Chữ Trung đứng độc lập)**: Gom các cụm chữ Hán nguyên bản chưa được dịch (ví dụ: `璇`, `天道`, `玄冥`, `仙帝`,...).
>    - **Tầng 2 (Từ lai Hán - Việt bị dính chữ)**: Gom các từ bị dính chữ Việt và chữ Trung cạnh nhau (ví dụ: `Ngư璇`, `Diệp辰`, `Hàn宗`, `Tiêu 炎`, `Lăng 霄`,...).
>    - Toàn bộ quá trình quét và lọc trùng (Deduplication) chạy hoàn toàn **Offline** trên bộ nhớ máy trước khi gọi bất kỳ API nào.
> 2. **Cơ chế kích hoạt kép (Dual Trigger)**: Tự động chạy sau khi chương cuối hoàn thành, và có nút bấm thủ công `✨ Làm Mượt Bản Dịch Final` ở Thẻ 2 & Thẻ 3.
> 3. **Chính sách từ điển**: Chỉ thay thế trực tiếp vào nội dung các chương truyện, không tự động nạp các từ rác vào Master Glossary.
> 4. **Model AI chuyên biệt**: Cho phép chọn model làm mượt độc lập, bổ sung **Gemini 3.6 Flash** vào danh mục model.

---

## 1. Overview & Core Concept

* **Mục tiêu**: Đảm bảo bản dịch cuối cùng đạt độ sạch 100% tiếng Việt, loại bỏ hoàn toàn mọi tàn dư chữ Hán mà không làm mất ngữ cảnh.
* **Quy trình xử lý 3 giai đoạn (Offline Filter $\rightarrow$ Single AI Batch $\rightarrow$ Global Longest-First Overwrite)**:
  1. **Quét & Phân Loại Offline**:
     - Sử dụng Regex kết hợp: `[\u4e00-\u9fa5]+` (chữ Hán độc lập) và `[a-zA-ZÀ-ỹ0-9_]*[\u4e00-\u9fa5]+[a-zA-ZÀ-ỹ0-9_]*` (từ lai Hán - Việt).
     - Lọc trùng để đưa về tập hợp danh sách các từ duy nhất (Unique List).
     - *Nếu danh sách trống*: Báo ngay *"🎉 Bản dịch đã sạch 100% tiếng Việt, không có chữ Hán rác!"* mà không tốn một lượt gọi API nào.
  2. **Đóng Gói 1 Request Gửi Gemini 3.6 Flash**:
     - Gửi toàn bộ danh sách từ cần làm mượt dưới dạng Batch JSON sang Gemini 3.6 Flash.
     - AI trả về định dạng chuẩn: `{"Ngư璇": "Ngư Tuyền", "璇": "Tuyền", "Diệp辰": "Diệp Thần"}`.
  3. **Ghi Đè Toàn Cục An Toàn (Longest Match First)**:
     - Sắp xếp các cụm từ theo độ dài ký tự giảm dần để thay thế các cụm từ dài trước, tránh nuốt ký tự hoặc xung đột chuỗi con.
     - Cập nhật toàn bộ các chương trong RAM và ghi đĩa bền vững.

---

## 2. Trải Nghiệm Người Dùng (UX) & Thiết Kế Giao Diện

### A. Vị trí các Nút Điều Khiển
1. **Thẻ 2 (DỊCH & TỪ ĐIỂN)**:
   - Nút màu tím thạch anh nổi bật: **`✨ Làm Mượt Bản Dịch Final (Quét Sạch Chữ Hán)`** nằm ngay bên dưới cụm nút Dịch Range và Dịch Bù.
2. **Thẻ 3 (BẢN DỊCH & ĐỌC)**:
   - Nút **`✨ Làm Mượt Toàn Văn Bản Dịch`** đặt cạnh nút Xuất Toàn Văn `.txt`.
3. **Thẻ 1 & Thẻ 4 (CÀI ĐẶT / KEY)**:
   - Bổ sung tùy chọn model `gemini-3.6-flash`.
   - Mục chọn **"Model Dùng Cho Khâu Làm Mượt Final"** (mặc định: `gemini-3.6-flash`).

### B. Luồng Trải Nghiệm Chi Tiết (User Flow)
```
[Dịch Xong Chương Cuối HOẶC Bấm Nút 'Làm Mượt Final']
                      │
                      ▼
[Quét Offline 100%]: Thuật toán rà soát toàn bộ các chương trong 0.05s
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[Không phát hiện chữ Hán]    [Phát hiện 28 cụm từ Hán/Dính Hán]
        │                           │
        ▼                           ▼
"🎉 Bản dịch sạch 100%!"     [Gửi 1 lượt API đến Gemini 3.6 Flash]
                                    │
                                    ▼
                             [Nhận kết quả JSON chuẩn xác]
                                    │
                                    ▼
                             [Thay thế Longest-First trên toàn bộ chương]
                                    │
                                    ▼
                             "✅ Đã làm mượt xong 28 từ rác trên 300 chương!"
```

---

## 3. Kiến Trúc Kỹ Thuật & Sơ Đồ Hệ Thống

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DROIDTRANSLATOR OFFLINE SCANNER                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Toàn bộ bản dịch các chương]                                          │
│                │                                                        │
│                ├──► Pattern 1: Chữ Hán độc lập (璇, 天道, 仙帝...)       │
│                │                                                        │
│                └──► Pattern 2: Từ lai dính chữ (Ngư璇, Diệp辰, Hàn宗...) │
│                                                                         │
│                ▼                                                        │
│  [Tập Hợp Lọc Trùng Duy Nhất (Offline Deduplicated Set)]                │
│                                                                         │
│                ▼ (Chỉ 1 Request Batch JSON)                             │
│  [Gemini 3.6 Flash Engine] ──► Dịch chuẩn Hán Việt / Ngữ cảnh tiểu thuyết│
│                                                                         │
│                ▼ (JSON Mapping)                                         │
│  [Global Longest-First Replacer] ──► Ghi đè vào các chương & Lưu đĩa   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Kế Hoạch Triển Khai (Khi Được Phê Duyệt)

1. **Thêm Model Gemini 3.6 Flash**: Cập nhật danh sách model ở Thẻ 1 và Thẻ 4.
2. **Cài Đặt Bộ Quét Offline `HanziSweeperEngine`**:
   - Hàm `scanNovelForHanziArtifacts()`: Tự động lọc cả chữ Hán độc lập và từ dính lai Hán-Việt.
   - Hàm `polishHanziBatchWithGemini()`: Đóng gói prompt gửi model làm mượt.
   - Hàm `applyGlobalReplacementsLongestFirst()`: Thực hiện thay thế dài nhất trước.
3. **Gắn Trigger Tự Động & Nút Bấm Giao Diện**: Kích hoạt khi chương cuối kết thúc và khi nhấn nút tại Thẻ 2 / Thẻ 3.

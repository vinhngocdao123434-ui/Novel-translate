# Kế Hoạch Sửa Đổi & Nâng Cấp: Chế Độ Dịch Theo Lô (Batch-Glossary Pipeline Mode)

## 📋 Tóm Tắt Phản Hồi Của Người Dùng & Giải Pháp Kỹ Thuật

### 1. Khắc Phục Lỗi Quản Lý Vết Lô Bóc Từ Điển (Bền Vững Theo Dự Án)
* **Vấn đề:** Trạng thái lô đã bóc trước đây chỉ lưu trên RAM. Khi đổi dự án, hủy dịch hoặc mở lại app, có thể dẫn đến việc dịch luôn mà chưa bóc từ điển cho đợt chương đó.
* **Giải pháp:** 
  * Lưu danh sách `processedBatchStartIndices` trực tiếp vào tệp JSON của từng dự án (`ProjectDataHolder`).
  * Khi chuyển dự án hoặc bắt đầu dịch (`startRangeTranslation` / `startFillGapsTranslation`), kiểm tra chính xác đợt chương hiện tại đã được bóc từ điển chưa.
  * Nếu chưa bóc, hệ thống **bắt buộc chạy bóc tách lô trước 100%**, hoàn tất nạp từ điển Master rồi mới tiến hành dịch chương 1 của lô.

### 2. Mở Rộng Toàn Diện Các Thể Loại Thuật Ngữ Bóc Tách
* **Vấn đề:** Prompt bóc lô cũ quá thiên về tên nhân vật, dễ bỏ sót địa danh, tổ chức, pháp bảo, công pháp...
* **Giải pháp:** Cập nhật Prompt trong `extractBatchGlossary` trích xuất đầy đủ 6 nhóm thuật ngữ:
  1. **Tên nhân vật / Tên xưng hô:** (Lâm Thần, Triệu Bá Thiên, Nhị Lăng Tử...)
  2. **Địa danh / Bang hội / Môn phái:** (Thanh Vân Tông, Thải Hà Sơn, Hắc Phong Trại...)
  3. **Pháp bảo / Linh bảo / Vật phẩm:** (Trảm Tiên Kiếm, Hỗn Độn Chung, Nhẫn Trữ Đồ...)
  4. **Công pháp / Chiêu thức / Khẩu quyết:** (Cửu Chuyển Kim Thân Độc, Thái Cực Kiếm Pháp...)
  5. **Linh thú / Yêu thú / Thần thú:** (Xích Nhãn Kim Mao Sư, Cửu Vĩ Thiên Hồ...)
  6. **Cảnh giới / Đan dược / Độc dược:** (Trúc Cơ Kỳ, Tẩy Tủy Đan, Hóa Cốt Phấn...)

### 3. Thêm Nút Nhập Số Trực Tiếp Cho Kích Thước Lô Chương
* **Vấn đề:** Giao diện cũ dùng nút `+` và `-` bấm từng đơn vị, mất nhiều thời gian khi muốn chỉnh từ 50 về 30 hoặc lên 100 chương.
* **Giải pháp:** 
  * Cho phép **bấm trực tiếp vào chữ `[50 chương]`** để hiển thị Hộp Thoại Nhập Số Trực Tiếp (EditText) kèm các nút chọn nhanh (10, 20, 30, 50, 100, 200 chương).
  * Chỉnh nút `+` và `-` tăng/giảm theo bước nhảy 10 chương (hoặc 5 chương) thay vì 1 chương.

### 4. Tích Hợp Trọn Vẹn Bộ Kiểm Định Lỗi & Cứu Hộ Online (ChapterAuditor & Auto-Heal)
* **Vấn đề:** Cần đảm bảo chế độ dịch thuần túy (`BATCH_GLOSSARY`) vẫn chạy qua bộ kiểm định chất lượng offline và tự động gửi lệnh dịch lại cứu hộ (`autoHealOnlineEnabled`) khi phát hiện lỗi nặng.
* **Giải pháp:**
  * Trong hàm `startTranslationLoop`, đối với chế độ `BATCH_GLOSSARY`, sau khi có `translatedText` từ `translateChapterPure`, đưa qua `ChapterAuditor.auditChapter(...)`.
  * Nếu phát hiện lỗi nghiêm trọng (cắt câu, mất đoạn, lọt chữ Hán thô...), kích hoạt quy trình **Auto-Heal Online**: Gọi lại `translateChapterPure` kèm `rescueInstruction` khẩn cấp để AI dịch lại trọn vẹn 100%.

---

## 🛠️ Danh Sách File Cần Cập Nhật
1. **`ProjectStorageManager.java`:** Thêm `List<Integer> processedBatchStartIndices` vào `ProjectDataHolder`.
2. **`GeminiEngine.java`:** Mở rộng System Instruction bóc tách trọn vẹn 6 nhóm thuật ngữ.
3. **`MainActivity.java`:**
   - Cập nhật UI Stepper `createStepperRow` / Dialog nhập số trực tiếp cho lô chương.
   - Lưu vết `processedBatchStartIndices` theo từng dự án truyện.
   - Tích hợp `ChapterAuditor` và `Auto-Heal Online` cho phương thức `translateChapterPure`.

---

## 🧪 Kế Hoạch Kiểm Thử (Verification Plan)
1. **Kiểm tra biên dịch Java:** Running `npx tsx verify-java-final.mjs`.
2. **Đồng bộ Native Code:** Running `node scripts/sync-native-project-data.mjs`.
3. **Lint & Biên dịch Applet:** Running `lint_applet` và `compile_applet`.

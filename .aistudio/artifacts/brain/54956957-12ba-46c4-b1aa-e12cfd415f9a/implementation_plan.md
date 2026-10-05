# Kế Hoạch Triệt Tiêu 100% Chữ Hán & Từ Lai Ngay Từ Đầu (Zero-Hanzi at Source)

## 🎯 Mục Tiêu
Đảm bảo bản dịch trong chế độ **Dịch Thuần Túy (`BATCH_GLOSSARY`)** luôn **sạch 100% tiếng Việt ngay tại thời điểm dịch xong từng chương**, tuyệt đối không để lọt bất kỳ chữ Hán hay từ lai nào (như `Diệp辰`, `Ngư璇`) vào bộ nhớ tác phẩm.

---

## 🛠️ Nguyên Nhân & Giải Pháp Kỹ Thuật

### 1. Thắt Chặt Kỷ Luật Prompt "Zero Hanzi Tolerance" Cho Gemini (`GeminiEngine.java`)
* **Vấn đề:** Khi dịch câu văn có chứa thuật ngữ lạ chưa có trong Glossary, AI đôi khi lười phiên âm và giữ nguyên chữ Hán hoặc tạo ra từ lai dính chữ Hán.
* **Giải pháp:** Cập nhật System Instruction của `translateChapterPure()` với quy tắc Kỷ Luật Thép:
  * **CẤM TUYỆT ĐỐI TỪ LAI:** Nghiêm cấm tạo từ dính chữ Hán với chữ Việt (như `Diệp辰`, `Ngư璇`).
  * **TỰ PHIÊN ÂM HÁN-VIỆT TẤT CẢ TÊN LẠ:** Với bất kỳ tên người, địa danh, vật phẩm chưa có trong Glossary, AI **bắt buộc phải tự dịch/phiên âm sang âm Hán-Việt chuẩn** (VD: `辰` -> `Thần`, `璇` -> `Tuyền`).
  * **OUTPUT TRỰC TIẾP:** Đảm bảo 100% văn bản trả về là tiếng Việt thuần túy.

### 2. Tích Hợp Tầng Phiên ÂM Hán-Việt Tự Động Ngay Tại Nguồn (`SinoVietnameseDictionary.java` & `ChapterAuditor.java`)
* **Vấn đề:** Từ điển Hán-Việt tĩnh cũ chỉ có ~70 ký tự nên khi AI vô tình bỏ sót chữ Hán lạ, hệ thống không thể phiên âm hết.
* **Giải pháp:**
  * Mở rộng bảng phiên âm `SinoVietnameseDictionary` lên hàng ngàn ký tự Hán phổ biến trong tiểu thuyết (hoặc cơ chế tra cứu Unicode Hán-Việt đầy đủ).
  * Ngay khi AI trả bản dịch về cho chương $N$, ứng dụng chạy ngay tầng lọc tại nguồn:
    1. Thay thế 100% theo Master Glossary (Longest Match First).
    2. Tự động chuyển đổi toàn bộ các ký tự CJK Unicode còn lại sang âm Hán-Việt chuẩn.
    3. Ghép nối và làm sạch các từ lai dính chữ (VD: `Diệp` + `辰` -> `Diệp Thần`).

### 3. Tự Động Kích Hoạt Auto-Heal Online Ngay Khi Phát Hiện Chữ Hán (`MainActivity.java`)
* **Vấn đề:** Trước đây nếu chương chỉ lọt vài chữ Hán (`rawHanzi <= 60`), hệ thống xếp vào lỗi nhẹ và giữ nguyên bản dịch lỗi.
* **Giải pháp:**
  * Nếu bật `Auto-Heal Online`, chỉ cần phát hiện **bất kỳ chữ Hán thô nào lọt lưới trong bản dịch gốc của AI**, hệ thống lập tức kích hoạt lệnh **Cứu hộ Khẩn cấp** gửi lại cho AI dịch lại chương đó ngay lập tức với yêu cầu triệt tiêu chữ Hán.

---

## 📋 Danh Sách File Cần Cập Nhật
1. **`GeminiEngine.java`:** Siết chặt Prompt `translateChapterPure` theo tiêu chuẩn Zero Hanzi Tolerance.
2. **`SinoVietnameseDictionary.java`:** Tích hợp bộ chuyển đổi Hán-Việt toàn diện hỗ trợ hàng ngàn Hán tự.
3. **`ChapterAuditor.java`:** Tự động sửa từ lai và phiên âm Hán-Việt 100% ngay tại nguồn.
4. **`MainActivity.java`:** Siết chặt logic kiểm tra chữ Hán để kích hoạt Auto-Heal hoặc sửa sạch 100% trước khi lưu bản dịch vào bộ nhớ.

---

## 🧪 Kế Hoạch Kiểm Thử (Verification Plan)
1. **Kiểm tra biên dịch Java:** Running `npx tsx verify-java-final.mjs`.
2. **Đồng bộ Native Code:** Running `node scripts/sync-native-project-data.mjs`.
3. **Lint & Biên dịch Applet:** Running `lint_applet` và `compile_applet`.

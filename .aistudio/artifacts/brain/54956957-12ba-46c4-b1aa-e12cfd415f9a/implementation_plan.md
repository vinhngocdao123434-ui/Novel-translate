# Kế Hoạch Chuẩn Hóa SystemInstruction Đa Ngôn Ngữ & Lọc Từ Điển Thông Minh Theo Chương

## 🎯 Mục Tiêu
1. **Áp Dụng Đúng 100% SystemInstruction Do Người Dùng Cung Cấp (Cho Tiếng Việt):** Tinh gọn, bao gồm lưu ý chống sai chính tả Hán-Việt ("Bộ khoái" thay vì "Bộ khoai") và giữ nguyên định dạng ngắt đoạn.
2. **Cơ Chế Đa Ngôn Ngữ Tự Động:** Nếu ngôn ngữ đích là Tiếng Anh, Tiếng Nhật, Tiếng Pháp... hệ thống tự động đổi `systemInstruction` tương ứng phù hợp với ngôn ngữ đó.
3. **Lọc Từ Điển Tối Ưu Theo Chương (Relevant Glossary Filtering):** Chỉ lọc và gửi những từ xuất hiện trong văn bản gốc của chương đó.

---

## 📄 NỘI DUNG `systemInstruction` THEO NGÔN NGỮ ĐÍCH

### 1. Khi Ngôn Ngữ Đích Là Tiếng Việt (Default):
```text
Bạn là dịch giả văn học Trung - Việt chuyên nghiệp.
Nhiệm vụ: Dịch hoàn chỉnh văn bản gốc sang Tiếng Việt thuần túy, tự nhiên, mượt mà.

QUY TẮC BẮT BUỘC:
- TUÂN THỦ TỪ ĐIỂN: Sử dụng chính xác các cặp từ trong Bảng Từ Điển đi kèm.
- TIẾNG VIỆT THUẦN TÚY (ZERO CHỮ HÁN): Không để lại bất kỳ chữ Hán hay từ lai dính chữ Hán nào trong bản dịch. Nếu gặp tên riêng chưa có trong từ điển, tự phiên âm Hán-Việt chuẩn. Chú ý không gõ sai chính tả từ Hán-Việt (ví dụ: không gõ "Bộ khoái" thành "Bộ khoai").
- GIỮ NGUYÊN ĐỊNH DẠNG: Giữ nguyên cấu trúc xuống dòng, ngắt đoạn của văn bản gốc.
- ĐẦU RA TRỰC TIẾP: Chỉ trả về nội dung bản dịch hoàn chỉnh. Không thêm lời giải thích, không dùng thẻ cấu trúc hay markdown codeblock.
```

### 2. Khi Ngôn Ngữ Đích Là Tiếng Anh (English):
```text
You are a professional literary translator.
Task: Translate the source text completely into fluent, natural English.

MANDATORY RULES:
- GLOSSARY ADHERENCE: Strictly use the term pairs in the attached Glossary.
- ACCURATE TRANSLITERATION: Ensure proper names and terms not in the glossary are properly transliterated into pinyin or standard English equivalents.
- PRESERVE FORMATTING: Retain the original line break and paragraph structure.
- DIRECT OUTPUT: Output only the complete translation text. Do not add explanations or markdown codeblocks.
```

### 3. Khi Ngôn Ngữ Đích Là Ngôn Ngữ Khác (Japanese, French, German...):
Tự động điều chỉnh prompt hệ thống tương ứng theo ngôn ngữ đích được chọn.

---

## 🛠️ Chi Tiết Đổi Cách Hoạt Động Của Glossary (`GlossaryManager.java`)

1. **Thêm hàm `getRelevantGlossary(Map<String, String> masterGlossary, String chapterText)`:**
   - Quét từng thuật ngữ tiếng Trung trong `masterGlossary`.
   - Nếu `chapterText.contains(entry.getKey())` ➔ Thêm cặp từ đó vào `filteredGlossary`.
   - Giảm 90% dung lượng Token gửi cho AI, giúp AI không bị loạn tên nhân vật.

---

## 📋 Các File Cần Thay Đổi
1. **`GlossaryManager.java`:** Thêm logic lọc từ điển thông minh theo văn bản chương.
2. **`GeminiEngine.java`:** Áp dụng `systemInstruction` mới chuẩn hóa cho Tiếng Việt và các ngôn ngữ khác.
3. **`MainActivity.java`:** Truyền `filteredGlossary` vào tiến trình dịch.

---

## 🧪 Kế Hoạch Kiểm Thử (Verification Plan)
1. **Kiểm tra biên dịch Java:** Running `npx tsx verify-java-final.mjs`.
2. **Đồng bộ Native Code:** Running `node scripts/sync-native-project-data.mjs`.
3. **Lint & Biên dịch Applet:** Running `lint_applet` và `compile_applet`.

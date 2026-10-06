package com.droidtranslator.app;

import com.droidtranslator.app.model.ApiKeyItem;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class GeminiEngine {

    private final List<ApiKeyItem> keys;
    private final OkHttpClient client;
    private final Gson gson;
    private int currentKeyIndex = 0;

    public interface LogCallback {
        void onLog(String message);
    }

    public GeminiEngine(List<ApiKeyItem> keys) {
        this.keys = keys;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(45, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(45, TimeUnit.SECONDS)
                .build();
        this.gson = new Gson();
    }

    private synchronized ApiKeyItem getNextAvailableKey() {
        if (keys == null || keys.isEmpty()) return null;
        long now = System.currentTimeMillis();

        for (int i = 0; i < keys.size(); i++) {
            int idx = (currentKeyIndex + i) % keys.size();
            ApiKeyItem item = keys.get(idx);
            if ("ACTIVE".equals(item.state) && item.cooldownUntil <= now) {
                currentKeyIndex = (idx + 1) % keys.size();
                return item;
            }
        }
        return keys.get(0);
    }

    private synchronized boolean hasOtherAvailableKey(ApiKeyItem current) {
        if (keys == null || keys.size() <= 1) return false;
        long now = System.currentTimeMillis();
        for (ApiKeyItem k : keys) {
            if (k != current && !"INVALID".equals(k.state) && k.cooldownUntil <= now) {
                return true;
            }
        }
        return false;
    }

    public boolean testKey(ApiKeyItem item) {
        return testKey(item, "gemini-3.6-flash");
    }

    public boolean testKey(ApiKeyItem item, String modelName) {
        try {
            String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
            String testUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + item.key;
            JsonObject pingObj = new JsonObject();
            JsonArray pingContents = new JsonArray();
            JsonObject pingPartObj = new JsonObject();
            JsonArray pingParts = new JsonArray();
            JsonObject textObj = new JsonObject();
            textObj.addProperty("text", "ping");
            pingParts.add(textObj);
            pingPartObj.add("parts", pingParts);
            pingContents.add(pingPartObj);
            pingObj.add("contents", pingContents);
            String bodyJson = pingObj.toString();

            RequestBody body = RequestBody.create(bodyJson, MediaType.parse("application/json"));
            Request request = new Request.Builder().url(testUrl).post(body).build();

            Response response = client.newCall(request).execute();
            if (response.isSuccessful()) {
                item.state = "ACTIVE";
                item.cooldownUntil = 0;
                return true;
            } else {
                item.state = "ERROR (" + response.code() + ")";
                return false;
            }
        } catch (Exception e) {
            item.state = "FAIL";
            return false;
        }
    }

    public String[] translateChapter(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, int minTermLength, int minFrequency, LogCallback logger) throws Exception {
        return translateChapter(chapterText, previousChapterSnippet, systemPrompt, glossary, modelName, targetLanguage, antiHanziStrict, minTermLength, minFrequency, null, logger);
    }

    public String[] translateChapter(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, int minTermLength, int minFrequency, String rescueInstruction, LogCallback logger) throws Exception {
        int maxRetries = Math.max(keys.size() * 2, 4);
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            ApiKeyItem keyItem = getNextAvailableKey();
            if (keyItem == null) {
                throw new Exception("Không có API Key nào trong kho lưu trữ!");
            }

            long now = System.currentTimeMillis();
            if (keyItem.cooldownUntil > now) {
                long waitSec = Math.max((keyItem.cooldownUntil - now) / 1000, 1);
                if (logger != null) logger.onLog("⏳ Tất cả Key đang cooldown, chờ " + waitSec + "s...");
                Thread.sleep(waitSec * 1000);
            }

            try {
                keyItem.totalRequests++;
                Map<String, String> relevantGlossary = GlossaryManager.filterRelevantGlossary(glossary, chapterText);
                String glossaryText = GlossaryManager.getGlossaryAsString(relevantGlossary);
                String nl = String.valueOf((char) 10);

                StringBuilder promptSb = new StringBuilder();
                promptSb.append("Bạn là đại sư dịch thuật tiểu thuyết văn học và huyền huyễn đỉnh cao hàng đầu thế giới.").append(nl).append(nl);
                promptSb.append("[NGÔN NGỮ ĐÍCH BẮT BUỘC]: ").append(targetLanguage != null ? targetLanguage : "Tiếng Việt").append(nl).append(nl);
                promptSb.append("[YÊU CẦU DỊCH THUẬT PHONG CÁCH]:").append(nl).append(systemPrompt).append(nl).append(nl);
                promptSb.append("[BẢNG TỪ ĐIỂN GLOSSARY ĐỐI CHIẾU CHƯƠNG NÀY (BẮT BUỘC TUÂN THỦ 100% KHÔNG ĐỔI TÊN)]:").append(nl);
                promptSb.append(glossaryText.isEmpty() ? "(Không có thuật ngữ đối chiếu trong chương này)" : glossaryText).append(nl).append(nl);

                if (previousChapterSnippet != null && !previousChapterSnippet.trim().isEmpty()) {
                    promptSb.append("[NGỮ CẢNH ĐOẠN CUỐI CHƯƠNG TRƯỚC (CHỈ THAM KHẢO XƯNG HÔ, TUYỆT ĐỐI KHÔNG DỊCH LẠI)]:").append(nl);
                    promptSb.append(previousChapterSnippet.trim()).append(nl).append(nl);
                }

                promptSb.append("[VĂN BẢN GỐC CHƯƠNG HIỆN TẠI (CHỈ DỊCH VÀ BÓC TÁCH TỪ ĐÂY)]:").append(nl).append(chapterText).append(nl).append(nl);

                boolean isViet = (targetLanguage == null || targetLanguage.toLowerCase().contains("việt"));
                boolean isJap = (targetLanguage != null && (targetLanguage.toLowerCase().contains("nhật") || targetLanguage.toLowerCase().contains("japan")));

                if (isViet && antiHanziStrict) {
                    promptSb.append("[QUY TẮC BẮT BUỘC - KỶ LUẬT CHỐNG LỌT CHỮ HÁN & ĐỒNG NHẤT NHÂN VẬT]:").append(nl);
                    promptSb.append("1. CẤM 100% CHỮ HÁN: Toàn bộ bản dịch tiếng Việt KHÔNG ĐƯỢC CHỨA BẤT KỲ KÝ TỰ CHỮ HÁN NÀO. Mọi tên riêng, chức vị, đồ vật đều phải phiên âm Hán-Việt hoặc thuần Việt chuẩn (CẤM viết 'Vân羊' -> phải viết 'Vân Dương'; CẤM 'm嬷m嬷' -> phải viết 'ma ma / nhũ mẫu / mụ già'; CẤM 'áo襦' -> phải viết 'áo nhu / xiêm y').").append(nl);
                    promptSb.append("2. ĐỒNG NHẤT NHÂN VẬT: Tuyệt đối không nhầm lẫn giữa các nhân vật (Trần Tích là nhân vật chính, Trần Thạc là chú; Lưu Khúc Tinh, Xa Đăng Khoa, Giảo Thố, Vân Dương). Giữ đúng 1 tên duy nhất suốt tác phẩm.").append(nl);
                    promptSb.append("3. CẤM ĐỂ NGUYÊN CÂU HÁN KÈM DỊCH NGOẶC ĐƠN: Cấm viết dạng '咦,房本呢... (Lạ thật...)' mà chỉ giữ lại câu thoại tiếng Việt.").append(nl);
                    promptSb.append("4. KHÔNG GÕ SAI TELEX: Tuyệt đối không để sót lỗi bộ gõ thừa phím k/w (như 'Đangk' -> 'Đăng', 'phad' -> 'phải không').").append(nl).append(nl);
                } else if (isJap) {
                    promptSb.append("[TARGET JAPANESE]: Translate fluently into natural Japanese, seamlessly incorporating Kanji, Hiragana, and Katakana.").append(nl).append(nl);
                }

                if (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) {
                    promptSb.append("[CHỈ THỊ CỨU HỘ KHẨN CẤP / PHẢI SỬA BẢN DỊCH HỎNG LẦN TRƯỚC]:").append(nl);
                    promptSb.append(rescueInstruction.trim()).append(nl).append(nl);
                }

                promptSb.append("[QUY TẮC ĐẦU RA BẮT BUỘC]:").append(nl);
                promptSb.append("===TRANSLATION===").append(nl);
                promptSb.append("(Toàn bộ bản dịch trôi chảy, bắt đầu ngay bằng tiêu đề chương, không thừa thãi dấu câu)").append(nl);
                promptSb.append("===NEW_GLOSSARY===").append(nl);
                promptSb.append("(Chỉ trích xuất các DANH TỪ RIÊNG MỚI trong chương hiện tại CHƯA CÓ trong Glossary trên: [TừGốcChữHán] = [NghĩaDịchHánViệt])").append(nl);

                JsonObject root = new JsonObject();
                JsonArray contents = new JsonArray();
                JsonObject contentObj = new JsonObject();
                JsonArray parts = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", promptSb.toString());
                parts.add(partObj);
                contentObj.add("parts", parts);
                contents.add(contentObj);
                root.add("contents", contents);

                JsonObject genConfig = new JsonObject();
                // Nếu ở chế độ cứu hộ, dùng nhiệt độ thấp (0.15) để độ chính xác tuyệt đối, bình thường dùng 0.25
                genConfig.addProperty("temperature", (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) ? 0.15 : 0.25);
                genConfig.addProperty("maxOutputTokens", 8192);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + keyItem.key;

                RequestBody requestBody = RequestBody.create(root.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(url).post(requestBody).build();

                Response response = client.newCall(request).execute();
                String respBody = response.body() != null ? response.body().string() : "";

                if (response.isSuccessful()) {
                    keyItem.successRequests++;
                    keyItem.state = "ACTIVE";

                    JsonObject respJson = gson.fromJson(respBody, JsonObject.class);
                    JsonArray candidates = respJson.getAsJsonArray("candidates");
                    if (candidates != null && candidates.size() > 0) {
                        JsonObject firstCand = candidates.get(0).getAsJsonObject();
                        JsonObject content = firstCand.getAsJsonObject("content");
                        JsonArray outParts = content.getAsJsonArray("parts");
                        String outText = outParts.get(0).getAsJsonObject().get("text").getAsString();

                        return parseOutput(outText);
                    } else {
                        throw new Exception("Không nhận được nội dung từ Gemini.");
                    }
                } else {
                    int statusCode = response.code();
                    String errorDetail = response.message();
                    try {
                        JsonObject errObj = gson.fromJson(respBody, JsonObject.class);
                        if (errObj != null && errObj.has("error")) {
                            JsonObject errBody = errObj.getAsJsonObject("error");
                            if (errBody.has("message")) {
                                errorDetail = errBody.get("message").getAsString();
                            }
                        }
                    } catch (Exception ignored) {}

                    String keySuffix = keyItem.key.length() > 6 ? keyItem.key.substring(keyItem.key.length() - 6) : keyItem.key;

                    if (statusCode == 429 || statusCode == 503 || statusCode == 500 || statusCode == 502 || statusCode == 504) {
                        keyItem.state = "COOLDOWN (" + statusCode + ")";
                        keyItem.cooldownUntil = System.currentTimeMillis() + 30000; // 30s cooldown

                        boolean hasOther = hasOtherAvailableKey(keyItem);
                        if (hasOther) {
                            if (logger != null) {
                                logger.onLog("⚠️ [Lỗi HTTP " + statusCode + " - Rate Limit] Key ..." + keySuffix + ". Lập tức chuyển sang Key tiếp theo (Zero-Wait Failover)...");
                            }
                        } else {
                            long backoffMs = (long) (Math.pow(2, Math.min(attempts, 4)) * 1000 + (Math.random() * 500));
                            if (logger != null) {
                                logger.onLog("⚠️ [Toàn bộ Key đang Cooldown] Chờ " + String.format(Locale.US, "%.1f", backoffMs / 1000.0) + "s trước khi thử lại...");
                            }
                            Thread.sleep(backoffMs);
                        }
                    } else {
                        keyItem.state = "ERROR (" + statusCode + ")";
                        if (logger != null) logger.onLog("⚠️ Lỗi HTTP " + statusCode + " (Key ..." + keySuffix + "): " + errorDetail);
                        Thread.sleep(1500);
                    }
                }
            } catch (Exception e) {
                if (logger != null) logger.onLog("⚠️ Ngoại lệ: " + e.getMessage());
                Thread.sleep(2000);
            }
        }

        throw new Exception("Quá số lần thử lại tối đa (" + maxRetries + ").");
    }

    public Map<String, String> extractBatchGlossary(List<String> chapterTexts, Map<String, String> existingGlossary, String modelName, int minTermLength, int minFrequency, LogCallback logger) throws Exception {
        int maxRetries = Math.max(keys.size() * 2, 4);
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            ApiKeyItem keyItem = getNextAvailableKey();
            if (keyItem == null) throw new Exception("Không có API Key nào trong kho lưu trữ!");

            long now = System.currentTimeMillis();
            if (keyItem.cooldownUntil > now) {
                long waitSec = Math.max((keyItem.cooldownUntil - now) / 1000, 1);
                if (logger != null) logger.onLog("⏳ Tất cả Key đang cooldown, chờ " + waitSec + "s...");
                Thread.sleep(waitSec * 1000);
            }

            try {
                keyItem.totalRequests++;
                String nl = String.valueOf((char) 10);
                String existingGlossaryStr = GlossaryManager.getGlossaryAsString(existingGlossary);

                StringBuilder systemInstructionSb = new StringBuilder();
                systemInstructionSb.append("Bạn là chuyên gia trích xuất Danh Từ Riêng (Proper Nouns) cho tiểu thuyết văn học.").append(nl);
                systemInstructionSb.append("Nhiệm vụ: Phân tích kỹ toàn bộ nội dung các chương thô tiếng Trung dưới đây và TUYỆT ĐỐI CHỈ TRÍCH XUẤT CÁC DANH TỪ RIÊNG CỐ ĐỊNH (Strict Proper Nouns Only):").append(nl);
                systemInstructionSb.append("1. TÊN RIÊNG NHÂN VẬT & BIỆT DANH: Tên người chính/phụ, đạo hiệu, ngoại hiệu (VD: 林辰 ➔ Lâm Thần, 赵霸天 ➔ Triệu Bá Thiên).").append(nl);
                systemInstructionSb.append("2. ĐỊA DANH RIÊNG & TÔNG MÔN RIÊNG: Tên tông môn, vương quốc, phủ, huyện, thành trì, sơn mạch có tên riêng (VD: 大河府 ➔ Phủ Đại Hà, 青云宗 ➔ Thanh Vân Tông, 青石村 ➔ Thôn Thanh Thạch).").append(nl);
                systemInstructionSb.append("3. THẦN BINH, CÔNG PHÁP & VẬT PHẨM ĐỘC QUYỀN CÓ TÊN RIÊNG: (VD: 斩灵剑 ➔ Trảm Linh Kiếm, 梵圣真魔功 ➔ Phạn Thánh Chân Ma Công).").append(nl);
                systemInstructionSb.append("4. YÊU THÚ, LINH THÚ CÓ TÊN RIÊNG: (VD: 啸月狼 ➔ Khiếu Nguyệt Lang, 吞天雀 ➔ Thôn Thiên Tước).").append(nl);
                systemInstructionSb.append("5. CẢNH GIỚI TU LUYỆN ĐẶC THÙ: (VD: 练气 ➔ Luyện Khí, 筑基 ➔ Trúc Cơ, 金丹 ➔ Kim Đan, 元婴 ➔ Nguyên Anh).").append(nl).append(nl);
                systemInstructionSb.append("[QUY TẮC BẮT BUỘC - TUYỆT ĐỐI KHÔNG LẪN RÁC]:").append(nl);
                systemInstructionSb.append("- TUYỆT ĐỐI CHỈ LỌC DANH TỪ RIÊNG. NGHIÊM CẤM đưa danh từ chung (như chưởng quỹ, tri huyện, bổ khoái, gia đinh), từ vựng đời thường, đồ vật (quần áo, bàn ghế), bộ phận cơ thể (tay, chân, mắt), động từ, tính từ, câu thoại, khẩu ngữ, thành ngữ, cụm miêu tả hành động!").append(nl);
                systemInstructionSb.append("- GIỚI HẠN ĐỘ DÀI: Từ gốc tiếng Trung CHỈ từ 2 đến 4 chữ Hán (tối đa 6 chữ Hán cho công pháp). Tuyệt đối cấm từ dài trên 6 chữ!").append(nl);
                systemInstructionSb.append("- ĐIỀU KIỆN TẦN SUẤT: CHỈ trích xuất từ xuất hiện lặp lại từ ").append(minFrequency > 0 ? minFrequency : 2).append(" LẦN TRỞ LÊN trong lô chương. Bỏ qua từ chỉ xuất hiện thoáng qua 1 lần.").append(nl);
                systemInstructionSb.append("- BẢO TOÀN TỪ ĐIỂN CŨ: Nếu từ gốc đã tồn tại trong Danh Sách Đã Có, TUYỆT ĐỐI KHÔNG ghi đè.").append(nl);
                systemInstructionSb.append("- ĐỊNH DẠNG ĐẦU RA BẮT BUỘC: Mỗi dòng đúng 1 cặp [TừGốcChữHán] = [NghĩaDịchHánViệt], không thêm bớt bất kỳ lời giải thích hay tiêu đề danh mục nào.").append(nl);

                StringBuilder promptSb = new StringBuilder();
                if (!existingGlossaryStr.isEmpty()) {
                    promptSb.append("[DANH SÁCH TỪ ĐIỂN ĐÃ CÓ TỪ CÁC LÔ TRƯỚC (GIỮ NGUYÊN TUYỆT ĐỐI)]:").append(nl);
                    promptSb.append(existingGlossaryStr).append(nl).append(nl);
                }

                promptSb.append("[NỘI DUNG LÔ CHƯƠNG TRUYỆN CẦN TRÍCH XUẤT THUẬT NGỮ]:").append(nl);
                for (int i = 0; i < chapterTexts.size(); i++) {
                    promptSb.append("=== CHƯƠNG ").append(i + 1).append(" ===").append(nl);
                    promptSb.append(chapterTexts.get(i)).append(nl).append(nl);
                }

                JsonObject root = new JsonObject();
                JsonObject sysInstObj = new JsonObject();
                JsonArray sysParts = new JsonArray();
                JsonObject sysPart = new JsonObject();
                sysPart.addProperty("text", systemInstructionSb.toString());
                sysParts.add(sysPart);
                sysInstObj.add("parts", sysParts);
                root.add("systemInstruction", sysInstObj);

                JsonArray contents = new JsonArray();
                JsonObject contentObj = new JsonObject();
                JsonArray parts = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", promptSb.toString());
                parts.add(partObj);
                contentObj.add("parts", parts);
                contents.add(contentObj);
                root.add("contents", contents);

                JsonObject genConfig = new JsonObject();
                genConfig.addProperty("temperature", 0.20);
                genConfig.addProperty("maxOutputTokens", 8192);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + keyItem.key;

                RequestBody requestBody = RequestBody.create(root.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(url).post(requestBody).build();

                Response response = client.newCall(request).execute();
                String respBody = response.body() != null ? response.body().string() : "";

                if (response.isSuccessful()) {
                    keyItem.successRequests++;
                    keyItem.state = "ACTIVE";

                    JsonObject respJson = gson.fromJson(respBody, JsonObject.class);
                    JsonArray candidates = respJson.getAsJsonArray("candidates");
                    Map<String, String> extractedMap = new LinkedHashMap<>();

                    if (candidates != null && candidates.size() > 0) {
                        JsonObject firstCand = candidates.get(0).getAsJsonObject();
                        JsonObject content = firstCand.getAsJsonObject("content");
                        JsonArray outParts = content.getAsJsonArray("parts");
                        String outText = outParts.get(0).getAsJsonObject().get("text").getAsString();

                        if (outText != null && !outText.trim().isEmpty()) {
                            String[] lines = outText.split("\\r?\\n");
                            for (String line : lines) {
                                GlossaryManager.GlossaryEntry entry = GlossaryManager.parseLine(line, null, minTermLength, minFrequency);
                                if (entry != null && GlossaryManager.isValidGlossaryKey(entry.key, minTermLength)) {
                                    extractedMap.put(entry.key, entry.value);
                                }
                            }
                        }
                    }
                    return extractedMap;
                } else {
                    int statusCode = response.code();
                    if (statusCode == 429 || statusCode == 503) {
                        keyItem.state = "COOLDOWN (" + statusCode + ")";
                        keyItem.cooldownUntil = System.currentTimeMillis() + 60000;
                    } else {
                        keyItem.state = "ERROR (" + statusCode + ")";
                    }
                }
            } catch (Exception e) {
                keyItem.state = "FAIL";
            }
        }
        throw new Exception("Bóc tách Glossary theo lô thất bại sau các lượt thử Key.");
    }

    public String translateChapterPure(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, String rescueInstruction, LogCallback logger) throws Exception {
        int maxRetries = Math.max(keys.size() * 2, 4);
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            ApiKeyItem keyItem = getNextAvailableKey();
            if (keyItem == null) throw new Exception("Không có API Key nào trong kho lưu trữ!");

            long now = System.currentTimeMillis();
            if (keyItem.cooldownUntil > now) {
                long waitSec = Math.max((keyItem.cooldownUntil - now) / 1000, 1);
                if (logger != null) logger.onLog("⏳ Tất cả Key đang cooldown, chờ " + waitSec + "s...");
                Thread.sleep(waitSec * 1000);
            }

            try {
                keyItem.totalRequests++;
                Map<String, String> relevantGlossary = GlossaryManager.filterRelevantGlossary(glossary, chapterText);
                String glossaryText = GlossaryManager.getGlossaryAsString(relevantGlossary);
                String nl = String.valueOf((char) 10);

                boolean isViet = (targetLanguage == null || targetLanguage.toLowerCase().contains("việt"));
                boolean isEng = (targetLanguage != null && (targetLanguage.toLowerCase().contains("anh") || targetLanguage.toLowerCase().contains("eng")));
                boolean isJap = (targetLanguage != null && (targetLanguage.toLowerCase().contains("nhật") || targetLanguage.toLowerCase().contains("jap")));

                StringBuilder systemInstructionSb = new StringBuilder();
                if (isViet) {
                    systemInstructionSb.append("Bạn là dịch giả văn học Trung - Việt chuyên nghiệp.").append(nl);
                    systemInstructionSb.append("Nhiệm vụ: Dịch hoàn chỉnh văn bản gốc sang Tiếng Việt thuần túy, tự nhiên, mượt mà.").append(nl).append(nl);
                    systemInstructionSb.append("QUY TẮC BẮT BUỘC:").append(nl);
                    systemInstructionSb.append("- TUÂN THỦ TỪ ĐIỂN: Sử dụng chính xác các cặp từ trong Bảng Từ Điển đi kèm.").append(nl);
                    systemInstructionSb.append("- TIẾNG VIỆT THUẦN TÚY (ZERO CHỮ HÁN): Không để lại bất kỳ chữ Hán hay từ lai dính chữ Hán nào trong bản dịch. Nếu gặp tên riêng chưa có trong từ điển, tự phiên âm Hán-Việt chuẩn. Chú ý không gõ sai chính tả từ Hán-Việt (ví dụ: không gõ \"Bộ khoái\" thành \"Bộ khoai\").").append(nl);
                    systemInstructionSb.append("- GIỮ NGUYÊN ĐỊNH DẠNG: Giữ nguyên cấu trúc xuống dòng, ngắt đoạn của văn bản gốc.").append(nl);
                    systemInstructionSb.append("- ĐẦU RA TRỰC TIẾP: Chỉ trả về nội dung bản dịch hoàn chỉnh. Không thêm lời giải thích, không dùng thẻ cấu trúc hay markdown codeblock.").append(nl);
                } else if (isEng) {
                    systemInstructionSb.append("You are a professional literary translator into English.").append(nl);
                    systemInstructionSb.append("Task: Translate the source text completely into fluent, natural English.").append(nl).append(nl);
                    systemInstructionSb.append("MANDATORY RULES:").append(nl);
                    systemInstructionSb.append("- GLOSSARY ADHERENCE: Strictly use the term pairs in the attached Glossary.").append(nl);
                    systemInstructionSb.append("- PRESERVE FORMATTING: Retain the original line break and paragraph structure.").append(nl);
                    systemInstructionSb.append("- DIRECT OUTPUT: Output only the complete translation text. Do not add explanations or markdown codeblocks.").append(nl);
                } else if (isJap) {
                    systemInstructionSb.append("あなたはプロの文芸翻訳家です。").append(nl);
                    systemInstructionSb.append("任務: 原文を自然で流暢な日本語に完全翻訳すること。").append(nl).append(nl);
                    systemInstructionSb.append("必須ルール:").append(nl);
                    systemInstructionSb.append("- 用語集の遵守: 添付された用語集の訳語を正確に使用すること。").append(nl);
                    systemInstructionSb.append("- フォーマット維持: 原文の改行と段落構成をそのまま維持すること。").append(nl);
                    systemInstructionSb.append("- 直接出力: 翻訳テキストのみを出力し、解説やコードブロックは一切含めないこと。").append(nl);
                } else {
                    systemInstructionSb.append("You are a professional literary translator.").append(nl);
                    systemInstructionSb.append("Task: Translate the source text completely into natural " + (targetLanguage != null ? targetLanguage : "English") + ".").append(nl).append(nl);
                    systemInstructionSb.append("MANDATORY RULES:").append(nl);
                    systemInstructionSb.append("- GLOSSARY ADHERENCE: Strictly use the term pairs in the attached Glossary.").append(nl);
                    systemInstructionSb.append("- PRESERVE FORMATTING: Retain original line breaks and paragraph structure.").append(nl);
                    systemInstructionSb.append("- DIRECT OUTPUT: Output only the complete translation. Do not add explanations.").append(nl);
                }

                StringBuilder promptSb = new StringBuilder();
                promptSb.append("[YÊU CẦU DỊCH THUẬT PHONG CÁCH]:").append(nl).append(systemPrompt).append(nl).append(nl);
                promptSb.append("[BẢNG TỪ ĐIỂN GLOSSARY BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI (100% KHÔNG ĐỔI TÊN)]:").append(nl);
                promptSb.append(glossaryText.isEmpty() ? "(Chưa có từ điển)" : glossaryText).append(nl).append(nl);

                if (previousChapterSnippet != null && !previousChapterSnippet.trim().isEmpty()) {
                    promptSb.append("[NGỮ CẢNH ĐOẠN CUỐI CHƯƠNG TRƯỚC (CHỈ THAM KHẢO XƯNG HÔ, TUYỆT ĐỐI KHÔNG DỊCH LẠI)]:").append(nl);
                    promptSb.append(previousChapterSnippet.trim()).append(nl).append(nl);
                }

                promptSb.append("[VĂN BẢN GỐC CHƯƠNG HIỆN TẠI]:").append(nl).append(chapterText).append(nl);

                if (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) {
                    promptSb.append(nl).append("[CHỈ THỊ CỨU HỘ KHẨN CẤP]: ").append(rescueInstruction.trim()).append(nl);
                }

                JsonObject root = new JsonObject();
                JsonObject sysInstObj = new JsonObject();
                JsonArray sysParts = new JsonArray();
                JsonObject sysPart = new JsonObject();
                sysPart.addProperty("text", systemInstructionSb.toString());
                sysParts.add(sysPart);
                sysInstObj.add("parts", sysParts);
                root.add("systemInstruction", sysInstObj);

                JsonArray contents = new JsonArray();
                JsonObject contentObj = new JsonObject();
                JsonArray parts = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", promptSb.toString());
                parts.add(partObj);
                contentObj.add("parts", parts);
                contents.add(contentObj);
                root.add("contents", contents);

                JsonObject genConfig = new JsonObject();
                genConfig.addProperty("temperature", (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) ? 0.15 : 0.25);
                genConfig.addProperty("maxOutputTokens", 8192);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + keyItem.key;

                RequestBody requestBody = RequestBody.create(root.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(url).post(requestBody).build();

                Response response = client.newCall(request).execute();
                String respBody = response.body() != null ? response.body().string() : "";

                if (response.isSuccessful()) {
                    keyItem.successRequests++;
                    keyItem.state = "ACTIVE";

                    JsonObject respJson = gson.fromJson(respBody, JsonObject.class);
                    JsonArray candidates = respJson.getAsJsonArray("candidates");
                    if (candidates != null && candidates.size() > 0) {
                        JsonObject firstCand = candidates.get(0).getAsJsonObject();
                        JsonObject content = firstCand.getAsJsonObject("content");
                        JsonArray outParts = content.getAsJsonArray("parts");
                        String outText = outParts.get(0).getAsJsonObject().get("text").getAsString();
                        return outText != null ? outText.trim() : "";
                    } else {
                        throw new Exception("Không nhận được nội dung từ Gemini.");
                    }
                } else {
                    int statusCode = response.code();
                    if (statusCode == 429 || statusCode == 503) {
                        keyItem.state = "COOLDOWN (" + statusCode + ")";
                        keyItem.cooldownUntil = System.currentTimeMillis() + 60000;
                    } else {
                        keyItem.state = "ERROR (" + statusCode + ")";
                    }
                }
            } catch (Exception e) {
                keyItem.state = "FAIL";
            }
        }
        throw new Exception("Dịch chương thuần túy thất bại sau các lượt thử Key.");
    }

    public String translateChapterInjectedRaw(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, String rescueInstruction, LogCallback logger) throws Exception {
        int maxRetries = Math.max(keys.size() * 2, 4);
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            ApiKeyItem keyItem = getNextAvailableKey();
            if (keyItem == null) throw new Exception("Không có API Key nào trong kho lưu trữ!");

            long now = System.currentTimeMillis();
            if (keyItem.cooldownUntil > now) {
                long waitSec = Math.max((keyItem.cooldownUntil - now) / 1000, 1);
                if (logger != null) logger.onLog("⏳ Key đang cooldown, chờ " + waitSec + "s...");
                Thread.sleep(waitSec * 1000);
            }

            try {
                keyItem.totalRequests++;
                String nl = String.valueOf((char) 10);
                Map<String, String> relevantGlossary = GlossaryManager.filterRelevantGlossary(glossary, chapterText);
                String glossaryText = GlossaryManager.getGlossaryAsString(relevantGlossary);

                StringBuilder systemInstructionSb = new StringBuilder();
                systemInstructionSb.append("Bạn là đại sư dịch thuật tiểu thuyết chuyên nghiệp (Chế Độ Khóa Thuật Ngữ Tuyệt Đối - Constrained Decoding).").append(nl);
                systemInstructionSb.append("Nhiệm vụ: Dịch văn bản gốc sang ").append(targetLanguage != null ? targetLanguage : "Tiếng Việt").append(" tự nhiên, mượt mà.").append(nl);
                systemInstructionSb.append("QUY TẮC BẮT BUỘC:").append(nl);
                systemInstructionSb.append("- KHÓA CHÍNH XÁC THUẬT NGỮ: Khi gặp các danh từ riêng, tên nhân vật, địa danh, chức vụ trong [BẢNG TỪ ĐIỂN ĐỐI CHIẾU], BẮT BUỘC dùng đúng 100% nghĩa tiếng Việt tương ứng, tuyệt đối không dịch khác đi.").append(nl);
                systemInstructionSb.append("- BẢO ĐẢM ZERO CHỮ HÁN: Toàn bộ câu cú sau khi dịch phải hoàn toàn thuần túy tiếng Việt, không để sót chữ Hán hay ký tự dính lẹo.").append(nl);
                systemInstructionSb.append("- ĐẦU RA TRỰC TIẾP: Chỉ trả về nội dung bản dịch hoàn chỉnh, không kèm codeblock hay lời bình luận.").append(nl);

                StringBuilder promptSb = new StringBuilder();
                promptSb.append("[PHONG CÁCH DỊCH]: ").append(systemPrompt).append(nl).append(nl);
                if (!glossaryText.isEmpty()) {
                    promptSb.append("[BẢNG TỪ ĐIỂN ĐỐI CHIẾU BẮT BUỘC TUÂN THỦ]:").append(nl).append(glossaryText).append(nl).append(nl);
                }
                if (previousChapterSnippet != null && !previousChapterSnippet.trim().isEmpty()) {
                    promptSb.append("[NGỮ CẢNH CHƯƠNG TRƯỚC (CHỈ THAM KHẢO XƯNG HÔ)]:\n").append(previousChapterSnippet.trim()).append(nl).append(nl);
                }
                promptSb.append("[VĂN BẢN GỐC CẦN DỊCH]:").append(nl).append(chapterText).append(nl);

                if (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) {
                    promptSb.append(nl).append("[CHỈ THỊ CỨU HỘ]: ").append(rescueInstruction.trim()).append(nl);
                }

                JsonObject root = new JsonObject();
                JsonObject sysInstObj = new JsonObject();
                JsonArray sysParts = new JsonArray();
                JsonObject sysPart = new JsonObject();
                sysPart.addProperty("text", systemInstructionSb.toString());
                sysParts.add(sysPart);
                sysInstObj.add("parts", sysParts);
                root.add("systemInstruction", sysInstObj);

                JsonArray contents = new JsonArray();
                JsonObject contentObj = new JsonObject();
                JsonArray parts = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", promptSb.toString());
                parts.add(partObj);
                contentObj.add("parts", parts);
                contents.add(contentObj);
                root.add("contents", contents);

                JsonObject genConfig = new JsonObject();
                genConfig.addProperty("temperature", (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) ? 0.15 : 0.25);
                genConfig.addProperty("maxOutputTokens", 8192);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + keyItem.key;

                RequestBody requestBody = RequestBody.create(root.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(url).post(requestBody).build();

                Response response = client.newCall(request).execute();
                String respBody = response.body() != null ? response.body().string() : "";

                if (response.isSuccessful()) {
                    keyItem.successRequests++;
                    keyItem.state = "ACTIVE";

                    JsonObject respJson = gson.fromJson(respBody, JsonObject.class);
                    JsonArray candidates = respJson.getAsJsonArray("candidates");
                    if (candidates != null && candidates.size() > 0) {
                        JsonObject firstCand = candidates.get(0).getAsJsonObject();
                        JsonObject content = firstCand.getAsJsonObject("content");
                        JsonArray outParts = content.getAsJsonArray("parts");
                        String outText = outParts.get(0).getAsJsonObject().get("text").getAsString();
                        return cleanTranslatedText(outText != null ? outText.trim() : "");
                    }
                } else {
                    int statusCode = response.code();
                    if (statusCode == 429 || statusCode == 503) {
                        keyItem.state = "COOLDOWN (" + statusCode + ")";
                        keyItem.cooldownUntil = System.currentTimeMillis() + 30000;
                    }
                }
            } catch (Exception e) {
                keyItem.state = "FAIL";
            }
        }
        throw new Exception("Mode 3 (Raw Inject) dịch thất bại sau các lượt thử Key.");
    }

    public String translateChapterCoT(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, LogCallback logger) throws Exception {
        int maxRetries = Math.max(keys.size() * 2, 4);
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            ApiKeyItem keyItem = getNextAvailableKey();
            if (keyItem == null) throw new Exception("Không có API Key nào trong kho lưu trữ!");

            try {
                keyItem.totalRequests++;
                String nl = String.valueOf((char) 10);
                Map<String, String> relevantGlossary = GlossaryManager.filterRelevantGlossary(glossary, chapterText);
                String glossaryText = GlossaryManager.getGlossaryAsString(relevantGlossary);

                StringBuilder promptSb = new StringBuilder();
                promptSb.append("Bạn là chuyên gia dịch thuật và suy luận ngữ cảnh văn học cổ trang (Mode 5: Chain-of-Thought Deep Thinking).").append(nl).append(nl);
                promptSb.append("[NGÔN NGỮ ĐÍCH]: ").append(targetLanguage != null ? targetLanguage : "Tiếng Việt").append(nl);
                promptSb.append("[PHONG CÁCH DỊCH]: ").append(systemPrompt).append(nl).append(nl);
                if (!glossaryText.isEmpty()) {
                    promptSb.append("[TỪ ĐIỂN GLOSSARY BẮT BUỘC TUÂN THỦ]:").append(nl).append(glossaryText).append(nl).append(nl);
                }
                if (previousChapterSnippet != null && !previousChapterSnippet.trim().isEmpty()) {
                    promptSb.append("[NGỮ CẢNH ĐOẠN CUỐI CHƯƠNG TRƯỚC]:\n").append(previousChapterSnippet.trim()).append(nl).append(nl);
                }
                promptSb.append("[VĂN BẢN GỐC CHƯƠNG HIỆN TẠI]:").append(nl).append(chapterText).append(nl).append(nl);
                promptSb.append("[QUY TRÌNH THỰC HIỆN 2 BƯỚC BẮT BUỘC]:").append(nl);
                promptSb.append("BƯỚC 1: Trong khối <analysis>, phân tích ngữ cảnh chương, giải mã các thành ngữ 4 chữ, điển tích cổ trang phức tạp, xác định đúng vai vế và ngôi xưng hô của các nhân vật.").append(nl);
                promptSb.append("BƯỚC 2: Trong khối ===TRANSLATION===, xuất bản dịch tiếng Việt trôi chảy, không chứa bất kỳ ký tự chữ Hán nào.").append(nl).append(nl);
                promptSb.append("ĐỊNH DẠNG ĐẦU RA:").append(nl);
                promptSb.append("<analysis>").append(nl);
                promptSb.append("(Phân tích ngắn gọn hàm ý, thành ngữ, xưng hô)").append(nl);
                promptSb.append("</analysis>").append(nl);
                promptSb.append("===TRANSLATION===").append(nl);
                promptSb.append("(Toàn bộ bản dịch tiếng Việt hoàn chỉnh)");

                JsonObject root = new JsonObject();
                JsonArray contents = new JsonArray();
                JsonObject contentObj = new JsonObject();
                JsonArray parts = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", promptSb.toString());
                parts.add(partObj);
                contentObj.add("parts", parts);
                contents.add(contentObj);
                root.add("contents", contents);

                JsonObject genConfig = new JsonObject();
                genConfig.addProperty("temperature", 0.30);
                genConfig.addProperty("maxOutputTokens", 8192);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + keyItem.key;

                RequestBody requestBody = RequestBody.create(root.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(url).post(requestBody).build();

                Response response = client.newCall(request).execute();
                String respBody = response.body() != null ? response.body().string() : "";

                if (response.isSuccessful()) {
                    keyItem.successRequests++;
                    keyItem.state = "ACTIVE";

                    JsonObject respJson = gson.fromJson(respBody, JsonObject.class);
                    JsonArray candidates = respJson.getAsJsonArray("candidates");
                    if (candidates != null && candidates.size() > 0) {
                        JsonObject firstCand = candidates.get(0).getAsJsonObject();
                        JsonObject content = firstCand.getAsJsonObject("content");
                        JsonArray outParts = content.getAsJsonArray("parts");
                        String outText = outParts.get(0).getAsJsonObject().get("text").getAsString();
                        
                        String[] parsed = parseOutput(outText);
                        String trans = parsed[0];
                        trans = trans.replaceAll("(?s)<analysis>.*?</analysis>", "").trim();
                        return cleanTranslatedText(trans);
                    }
                }
            } catch (Exception e) {
                keyItem.state = "FAIL";
            }
        }
        throw new Exception("Mode 5 (CoT Thinking) dịch thất bại.");
    }

    public String translateChapterDualPass(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, LogCallback logger) throws Exception {
        // Pass 1: Dịch thuần túy / sát nghĩa
        if (logger != null) logger.onLog("📝 [PASS 1] Đang dịch thô sát nghĩa có đối chiếu Glossary...");
        String pass1Text = translateChapterPure(chapterText, previousChapterSnippet, systemPrompt, glossary, modelName, targetLanguage, antiHanziStrict, null, logger);

        // Pass 2: Tổng biên tập đối chiếu song ngữ sửa sạch lỗi
        if (pass1Text == null || pass1Text.trim().length() < 20) return pass1Text;

        if (logger != null) logger.onLog("🔬 [PASS 2] Đang gửi [Gốc Tiếng Trung + Bản Dịch Pass 1] sang Pass 2 để Tổng Biên Tập đối soát & làm mượt...");

        int maxRetries = Math.max(keys.size() * 2, 4);
        int attempts = 0;

        while (attempts < maxRetries) {
            attempts++;
            ApiKeyItem keyItem = getNextAvailableKey();
            if (keyItem == null) break;

            try {
                keyItem.totalRequests++;
                String nl = String.valueOf((char) 10);

                StringBuilder promptSb = new StringBuilder();
                promptSb.append("Bạn là Tổng biên tập văn học và chuyên gia hiệu đính tiểu thuyết dịch cao cấp.").append(nl).append(nl);
                promptSb.append("Nhiệm vụ: Đối chiếu trực tiếp giữa [VĂN BẢN GỐC TIẾNG TRUNG] và [BẢN DỊCH THÔ PASS 1] dưới đây để tiến hành biên soạn, sửa chữa và xuất ra bản dịch hoàn mỹ cuối cùng:").append(nl);
                promptSb.append("1. SỬA CHỮA DỊCH SAI NGHĨA: Đối chiếu bản gốc để sửa toàn bộ các câu dịch sai ngữ cảnh, hiểu nhầm thành ngữ hoặc từ ngữ cảnh (VD: '万分不舍' dịch nhầm thành 'không nỗ lực' -> sửa chuẩn thành 'vô cùng không nỡ / tiếc tiền'; '诚惶诚恐' -> sửa thành 'nơm nớp lo sợ / thấp thỏm lo âu').").append(nl);
                promptSb.append("2. QUÉT SẠCH 100% CHỮ HÁN SÓT: Khử sạch các chữ Hán dính trong câu (nội院 -> nội viện, Tuần抚 -> Tuần phủ, trạch邸 -> trạch đệ, Vân羊 -> Vân Dương).").append(nl);
                promptSb.append("3. CHUỐT LẠI VĂN PHONG TIỂU THUYẾT: Đại từ nhân xưng chuẩn mực (hắn, nàng, ta, ngươi), câu cú mượt mà, tự nhiên, đúng giọng văn kiếm hiệp/tiên hiệp.").append(nl).append(nl);
                promptSb.append("[VĂN BẢN GỐC TIẾNG TRUNG]:").append(nl).append(chapterText).append(nl).append(nl);
                promptSb.append("[BẢN DỊCH THÔ PASS 1]:").append(nl).append(pass1Text).append(nl).append(nl);
                promptSb.append("[ĐẦU RA BẮT BUỘC]: Chỉ xuất toàn bộ bản dịch tiếng Việt hoàn chỉnh sau khi đã biên tập hoàn mỹ (không xuất giải thích hay markdown codeblock).");

                JsonObject root = new JsonObject();
                JsonArray contents = new JsonArray();
                JsonObject contentObj = new JsonObject();
                JsonArray parts = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", promptSb.toString());
                parts.add(partObj);
                contentObj.add("parts", parts);
                contents.add(contentObj);
                root.add("contents", contents);

                JsonObject genConfig = new JsonObject();
                genConfig.addProperty("temperature", 0.20);
                genConfig.addProperty("maxOutputTokens", 8192);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-3.6-flash";
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + actualModel + ":generateContent?key=" + keyItem.key;

                RequestBody requestBody = RequestBody.create(root.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(url).post(requestBody).build();

                Response response = client.newCall(request).execute();
                String respBody = response.body() != null ? response.body().string() : "";

                if (response.isSuccessful()) {
                    keyItem.successRequests++;
                    keyItem.state = "ACTIVE";

                    JsonObject respJson = gson.fromJson(respBody, JsonObject.class);
                    JsonArray candidates = respJson.getAsJsonArray("candidates");
                    if (candidates != null && candidates.size() > 0) {
                        JsonObject firstCand = candidates.get(0).getAsJsonObject();
                        JsonObject content = firstCand.getAsJsonObject("content");
                        JsonArray outParts = content.getAsJsonArray("parts");
                        String outText = outParts.get(0).getAsJsonObject().get("text").getAsString();
                        if (outText != null && outText.trim().length() > 20) {
                            if (logger != null) logger.onLog("✨ [PASS 2 HOÀN TẤT] Bản dịch đã được Tổng Biên Tập chuốt lại hoàn hảo!");
                            return cleanTranslatedText(outText.trim());
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        return cleanTranslatedText(pass1Text);
    }

    public String translateChapterSlidingWindow(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, String targetLanguage, boolean antiHanziStrict, LogCallback logger) throws Exception {
        return translateChapterPure(chapterText, previousChapterSnippet, systemPrompt, glossary, modelName, targetLanguage, antiHanziStrict, null, logger);
    }

    public String[] translateChapter(String chapterText, String previousChapterSnippet, String systemPrompt, Map<String, String> glossary, String modelName, LogCallback logger) throws Exception {
        return translateChapter(chapterText, previousChapterSnippet, systemPrompt, glossary, modelName, "Tiếng Việt", true, 2, 2, logger);
    }

    public static String cleanTranslatedText(String text) {
        if (text == null || text.trim().isEmpty()) return "";
        return ChapterAuditor.cleanChapterOffline(text, null, null);
    }

    public static String[] parseOutput(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new String[]{"", ""};
        }

        String raw = text.trim();
        String translation = "";
        String newGlossary = "";

        // Dùng regex tìm mốc phân tách bất chấp markdown **, ## hoặc khoảng trắng
        java.util.regex.Pattern transP = java.util.regex.Pattern.compile("(?i)(?:^|\n)[#*]*[ \t]*===+[ \t]*(?:TRANSLATION|BẢN DỊCH|DỊCH THUẬT)[ \t]*===+[#*]*");
        java.util.regex.Pattern glossP = java.util.regex.Pattern.compile("(?i)(?:^|\n)[#*]*[ \t]*===+[ \t]*(?:NEW_GLOSSARY|GLOSSARY|TỪ ĐIỂN MỚI|THUẬT NGỮ)[ \t]*===+[#*]*");

        java.util.regex.Matcher mTrans = transP.matcher(raw);
        java.util.regex.Matcher mGloss = glossP.matcher(raw);

        boolean hasTrans = mTrans.find();
        boolean hasGloss = mGloss.find();

        if (hasTrans && hasGloss) {
            int transStart = mTrans.start();
            int transEnd = mTrans.end();
            int glossStart = mGloss.start();
            int glossEnd = mGloss.end();

            if (transStart < glossStart) {
                translation = raw.substring(transEnd, glossStart).trim();
                newGlossary = raw.substring(glossEnd).trim();
            } else {
                newGlossary = raw.substring(glossEnd, transStart).trim();
                translation = raw.substring(transEnd).trim();
            }
        } else if (hasTrans) {
            translation = raw.substring(mTrans.end()).trim();
        } else if (hasGloss) {
            int glossStart = mGloss.start();
            int glossEnd = mGloss.end();
            if (glossStart < 100) {
                String nl = String.valueOf((char) 10);
                String[] lines = raw.substring(glossEnd).split(nl);
                StringBuilder gSb = new StringBuilder();
                StringBuilder tSb = new StringBuilder();
                boolean pastGlossary = false;
                for (String l : lines) {
                    String tr = l.trim();
                    if (!pastGlossary && (tr.contains("=") || tr.contains("➔") || tr.contains("->"))) {
                        gSb.append(l).append(nl);
                    } else {
                        pastGlossary = true;
                        tSb.append(l).append(nl);
                    }
                }
                newGlossary = gSb.toString().trim();
                translation = tSb.toString().trim();
            } else {
                translation = raw.substring(0, glossStart).trim();
                newGlossary = raw.substring(glossEnd).trim();
            }
        } else {
            String nl = String.valueOf((char) 10);
            String[] lines = raw.split(nl);
            StringBuilder tSb = new StringBuilder();
            StringBuilder gSb = new StringBuilder();
            for (String l : lines) {
                String tr = l.trim();
                if (tr.matches("^[\u4e00-\u9fa5]{2,10}[ \t]*[=➔>-][ \t]*[A-Za-zÀ-ỹ \t]+$")) {
                    gSb.append(l).append(nl);
                } else {
                    tSb.append(l).append(nl);
                }
            }
            translation = tSb.toString().trim();
            newGlossary = gSb.toString().trim();
        }

        // Khử code block nếu có
        if (translation.startsWith("```")) {
            int firstNl = translation.indexOf((char) 10);
            if (firstNl != -1) translation = translation.substring(firstNl + 1);
            if (translation.endsWith("```")) {
                translation = translation.substring(0, translation.length() - 3).trim();
            }
        }
        if (newGlossary.startsWith("```")) {
            int firstNl = newGlossary.indexOf((char) 10);
            if (firstNl != -1) newGlossary = newGlossary.substring(firstNl + 1);
            if (newGlossary.endsWith("```")) {
                newGlossary = newGlossary.substring(0, newGlossary.length() - 3).trim();
            }
        }

        // Làm sạch toàn diện các lỗi chữ Hán, telex, dấu câu rác
        translation = cleanTranslatedText(translation);

        return new String[]{translation.trim(), newGlossary.trim()};
    }
}

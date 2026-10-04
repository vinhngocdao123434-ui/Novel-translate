package com.droidtranslator.app.engine;

import com.droidtranslator.app.GeminiEngine;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * HanziSweeperEngine: Bộ quét Thông Minh 3 Nhóm (Phân Luồng Rác, Neo Ngữ Cảnh, Auto-Chunking & Auto-Loop)
 * - Nhóm 1: Từ lai dính chữ Hán (Ngư璇, Diệp辰, Hàn宗)
 * - Nhóm 2: Cụm chữ Hán từ 2 ký tự trở lên (天道, 玄冥, 仙帝)
 * - Nhóm 3: Chữ Hán đơn độc lập (璇, 辰, 宗) kèm neo ngữ cảnh xung quanh
 * - Auto-Chunking: Tự động chia gói ~500 mục (~5.000 tokens) tránh tràn trần maxOutputTokens của AI.
 * - Ghi đè toàn cục theo nguyên tắc Longest-Match-First để chống nhầm lẫn tuyệt đối.
 */
public class HanziSweeperEngine {

    public static class TriagedScanResult {
        public final Set<String> mixedWords = new LinkedHashSet<>();          // Nhóm 1
        public final Set<String> multiHanziWords = new LinkedHashSet<>();      // Nhóm 2
        public final Map<String, String> singleHanziContext = new LinkedHashMap<>(); // Nhóm 3: char -> context snippet

        public boolean isEmpty() {
            return mixedWords.isEmpty() && multiHanziWords.isEmpty() && singleHanziContext.isEmpty();
        }

        public int totalUniqueCount() {
            return mixedWords.size() + multiHanziWords.size() + singleHanziContext.size();
        }
    }

    private static final Pattern MIXED_TOKEN_PATTERN = Pattern.compile("[a-zA-ZÀ-ỹ0-9_]*[\u4e00-\u9fa5]+[a-zA-ZÀ-ỹ0-9_]*");
    private static final Pattern PURE_HANZI_PATTERN = Pattern.compile("[\u4e00-\u9fa5]+");

    /**
     * Quét phân loại 3 nhóm thông minh trên toàn bộ các chương đã dịch
     */
    public static TriagedScanResult scanTriagedArtifacts(Map<Integer, String> chapters) {
        TriagedScanResult result = new TriagedScanResult();
        if (chapters == null || chapters.isEmpty()) {
            return result;
        }

        for (Map.Entry<Integer, String> entry : chapters.entrySet()) {
            String text = entry.getValue();
            if (text == null || text.trim().isEmpty()) continue;

            // 1. Quét Nhóm 1: Từ lai dính Hán - Việt (VD: Ngư璇, Diệp辰, Hàn宗)
            Matcher mixedMatcher = MIXED_TOKEN_PATTERN.matcher(text);
            while (mixedMatcher.find()) {
                String token = mixedMatcher.group().trim();
                if (isMixedWord(token)) {
                    result.mixedWords.add(token);
                }
            }

            // 2. Quét Nhóm 2 & Nhóm 3: Chữ Hán nguyên bản
            Matcher pureMatcher = PURE_HANZI_PATTERN.matcher(text);
            while (pureMatcher.find()) {
                String token = pureMatcher.group().trim();
                if (token.isEmpty()) continue;

                if (token.length() >= 2) {
                    // Nhóm 2: Cụm Hán từ 2 ký tự trở lên (VD: 天道, 大罗金仙)
                    result.multiHanziWords.add(token);
                } else if (token.length() == 1) {
                    // Nhóm 3: Chữ Hán đơn độc lập (VD: 璇) -> Cắt neo ngữ cảnh xung quanh
                    String singleChar = token;
                    if (!result.singleHanziContext.containsKey(singleChar)) {
                        int start = Math.max(0, pureMatcher.start() - 25);
                        int end = Math.min(text.length(), pureMatcher.end() + 25);
                        String rawSnippet = text.substring(start, end).replace('\n', ' ').replace('\r', ' ').trim();
                        result.singleHanziContext.put(singleChar, "..." + rawSnippet + "...");
                    }
                }
            }
        }

        return result;
    }

    /**
     * Chia nhỏ kết quả quét thành các gói ~500 mục (~5.000 tokens) để không vượt trần output của AI
     */
    public static List<TriagedScanResult> splitTriagedScan(TriagedScanResult fullScan, int maxItemsPerChunk) {
        List<TriagedScanResult> chunks = new ArrayList<>();
        if (fullScan == null || fullScan.isEmpty()) {
            return chunks;
        }

        int limit = maxItemsPerChunk > 0 ? maxItemsPerChunk : 500;

        TriagedScanResult current = new TriagedScanResult();
        int currentCount = 0;

        // 1. Phân phối Nhóm 1
        for (String w : fullScan.mixedWords) {
            if (currentCount >= limit) {
                chunks.add(current);
                current = new TriagedScanResult();
                currentCount = 0;
            }
            current.mixedWords.add(w);
            currentCount++;
        }

        // 2. Phân phối Nhóm 2
        for (String w : fullScan.multiHanziWords) {
            if (currentCount >= limit) {
                chunks.add(current);
                current = new TriagedScanResult();
                currentCount = 0;
            }
            current.multiHanziWords.add(w);
            currentCount++;
        }

        // 3. Phân phối Nhóm 3
        for (Map.Entry<String, String> e : fullScan.singleHanziContext.entrySet()) {
            if (currentCount >= limit) {
                chunks.add(current);
                current = new TriagedScanResult();
                currentCount = 0;
            }
            current.singleHanziContext.put(e.getKey(), e.getValue());
            currentCount++;
        }

        if (!current.isEmpty()) {
            chunks.add(current);
        }

        return chunks;
    }

    private static boolean isMixedWord(String s) {
        if (s == null || s.length() <= 1) return false;
        boolean hasHanzi = false;
        boolean hasLatinOrDigit = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 0x4E00 && c <= 0x9FA5) {
                hasHanzi = true;
            } else if (Character.isLetterOrDigit(c)) {
                hasLatinOrDigit = true;
            }
        }
        return hasHanzi && hasLatinOrDigit;
    }

    /**
     * Đóng gói prompt 3 nhóm rõ ràng gửi đến Gemini Flash
     */
    public static String buildTriagedPrompt(TriagedScanResult scan) {
        Gson gson = new Gson();

        JsonObject rootObj = new JsonObject();

        // Nhóm 1: Từ lai
        JsonArray arrMixed = new JsonArray();
        for (String w : scan.mixedWords) arrMixed.add(w);
        rootObj.add("nhom_1_tu_lai_dinh_chu", arrMixed);

        // Nhóm 2: Hán từ 2 ký tự trở lên
        JsonArray arrMulti = new JsonArray();
        for (String w : scan.multiHanziWords) arrMulti.add(w);
        rootObj.add("nhom_2_cum_han_tu_2_ky_tu", arrMulti);

        // Nhóm 3: Hán đơn kèm ngữ cảnh
        JsonArray arrSingle = new JsonArray();
        for (Map.Entry<String, String> e : scan.singleHanziContext.entrySet()) {
            JsonObject item = new JsonObject();
            item.addProperty("target", e.getKey());
            item.addProperty("context", e.getValue());
            arrSingle.add(item);
        }
        rootObj.add("nhom_3_han_don_kem_ngu_canh", arrSingle);

        return "Bạn là chuyên gia dịch thuật tiểu thuyết Trung - Việt và Hán Việt thượng thừa.\n"
                + "Dưới đây là danh sách các từ sót chữ Hán được phân làm 3 nhóm:\n"
                + "- Nhóm 1 (Từ lai dính chữ): Dịch trọn vẹn cả từ sang tiếng Việt thuần (VD: 'Ngư璇' -> 'Ngư Tuyền', 'Diệp辰' -> 'Diệp Thần').\n"
                + "- Nhóm 2 (Cụm Hán >= 2 chữ): Dịch chuẩn âm Hán Việt (VD: '天道' -> 'Thiên Đạo', '玄冥' -> 'Huyền Minh').\n"
                + "- Nhóm 3 (Chữ Hán 1 ký tự kèm ngữ cảnh): ĐỌC KỸ NGỮ CẢNH CÂU để dịch chữ Hán đơn đó thành 1 từ tiếng Việt chuẩn xác nhất (VD: target '璇' trong ngữ cảnh kiếm -> dịch là 'Tuyền').\n\n"
                + "BẮT BUỘC: Trả về DUY NHẤT một JSON Object phẳng (không lồng nhóm, không bọc ```json thừa) chứa ánh xạ trực tiếp:\n"
                + "{\n"
                + "  \"từ_gốc_cần_thay_thế\": \"bản_dịch_chuẩn_tiếng_việt\",\n"
                + "  \"Ngư璇\": \"Ngư Tuyền\",\n"
                + "  \"天道\": \"Thiên Đạo\",\n"
                + "  \"璇\": \"Tuyền\"\n"
                + "}\n\n"
                + "Dữ liệu đầu vào 3 nhóm:\n"
                + gson.toJson(rootObj);
    }

    /**
     * Bóc tách phản hồi JSON từ AI thành Map<String, String>.
     */
    public static Map<String, String> parseJsonResponse(String rawResponse) {
        Map<String, String> result = new LinkedHashMap<>();
        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            return result;
        }

        String clean = rawResponse.trim();
        if (clean.startsWith("```")) {
            int firstNl = clean.indexOf('\n');
            if (firstNl != -1) clean = clean.substring(firstNl + 1);
            if (clean.endsWith("```")) {
                clean = clean.substring(0, clean.length() - 3).trim();
            }
        }

        try {
            Gson gson = new Gson();
            JsonObject obj = gson.fromJson(clean, JsonObject.class);
            if (obj != null) {
                for (Map.Entry<String, JsonElement> entry : obj.entrySet()) {
                    String k = entry.getKey().trim();
                    String v = entry.getValue().getAsString().trim();
                    if (!k.isEmpty() && !v.isEmpty() && !k.equals(v)) {
                        result.put(k, v);
                    }
                }
            }
        } catch (Exception ignored) {
            Pattern linePat = Pattern.compile("\"([^\"]+)\"[ \t]*:[ \t]*\"([^\"]+)\"");
            Matcher m = linePat.matcher(clean);
            while (m.find()) {
                String k = m.group(1).trim();
                String v = m.group(2).trim();
                if (!k.isEmpty() && !v.isEmpty() && !k.equals(v)) {
                    result.put(k, v);
                }
            }
        }

        return result;
    }

    /**
     * Ghi đè toàn cục an toàn (Longest-Match-First):
     * Cụm từ dài (Nhóm 1 và Nhóm 2) được thay thế trước -> Chữ đơn (Nhóm 3) được thay thế sau cùng.
     * Chống 100% hiện tượng nuốt chữ, trùng lặp hay ghi đè sai vị trí.
     */
    public static int applyGlobalReplacements(Map<Integer, String> chapters, Map<String, String> translationMap) {
        if (chapters == null || chapters.isEmpty() || translationMap == null || translationMap.isEmpty()) {
            return 0;
        }

        // Sắp xếp các cụm từ theo độ dài GIẢM DẦN
        List<String> sortedKeys = new ArrayList<>(translationMap.keySet());
        sortedKeys.sort((a, b) -> Integer.compare(b.length(), a.length()));

        int replacedCount = 0;

        for (Map.Entry<Integer, String> entry : chapters.entrySet()) {
            String originalText = entry.getValue();
            if (originalText == null || originalText.isEmpty()) continue;

            String updatedText = originalText;
            for (String key : sortedKeys) {
                String replacement = translationMap.get(key);
                if (replacement != null && !replacement.isEmpty() && updatedText.contains(key)) {
                    updatedText = updatedText.replace(key, replacement);
                    replacedCount++;
                }
            }

            if (!updatedText.equals(originalText)) {
                entry.setValue(updatedText);
            }
        }

        return replacedCount;
    }
}

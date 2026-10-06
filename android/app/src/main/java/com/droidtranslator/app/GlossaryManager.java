package com.droidtranslator.app;

import java.util.*;

public class GlossaryManager {

    public static class GlossaryEntry {
        public String key;
        public String value;

        public GlossaryEntry(String key, String value) {
            this.key = key;
            this.value = value;
        }
    }

    public static int countChineseChars(String str) {
        if (str == null) return 0;
        int count = 0;
        for (char c : str.toCharArray()) {
            if (c >= 0x4E00 && c <= 0x9FA5) count++;
        }
        return count;
    }

    public static int countOccurrences(String text, String term) {
        if (text == null || term == null || term.isEmpty()) return 0;
        int count = 0;
        int pos = 0;
        while ((pos = text.indexOf(term, pos)) != -1) {
            count++;
            pos += term.length();
        }
        return count;
    }

    public static boolean isValidGlossaryKey(String key, int minTermLength, int maxTermLength) {
        if (key == null) return false;
        String trimmed = cleanTerm(key).trim();
        if (trimmed.isEmpty()) return false;

        // Bắt buộc phải có chữ Hán và đạt độ dài tối thiểu & không vượt quá tối đa
        int chineseCount = countChineseChars(trimmed);
        int min = minTermLength > 0 ? minTermLength : 2;
        int max = maxTermLength > 0 ? maxTermLength : 8;
        if (chineseCount < min || chineseCount > max) return false;
        if (trimmed.length() > max) return false;

        // Loại bỏ ký tự đặc biệt, dấu câu
        if (trimmed.matches(".*[，。！？：“”、《》；…—\\s,\\.?!:\"'\\-_\050\051\\[\\]{}~/\\\\|`@#$%^&*+=<>].*")) {
            return false;
        }

        // Loại trừ các tiền tố, cụm đàm thoại đời thường không phải danh từ riêng
        String[] forbiddenPrefixes = new String[] {
            "看起来", "像是", "如同", "仿佛", "似乎", "犹如", "宛如", "好似",
            "出身", "半个", "一个", "两个", "走个", "所谓", "可谓", "如此",
            "十分", "万分", "极其", "非常", "不可", "不能", "不知", "不曾",
            "不见", "不见得", "何等", "怎样", "怎么", "身怀", "手持", "怀中",
            "眼见", "只见", "突然", "猛然", "不知不觉", "与此同时", "不得不", "无可奈何", "显而易见"
        };
        for (String p : forbiddenPrefixes) {
            if (trimmed.startsWith(p)) return false;
        }

        // Loại bỏ các tiêu đề danh mục / prompt header bị AI sao chép lại
        String upper = trimmed.toUpperCase();
        if (upper.contains("CÔNG PHÁP") || upper.contains("CHIÊU THỨC") || upper.contains("THÂN PHÁP") ||
            upper.contains("KHẨU QUYẾT") || upper.contains("TÊN NHÂN VẬT") || upper.contains("ĐỊA DANH") ||
            upper.contains("MÔN PHÁI") || upper.contains("BANG HỘI") || upper.contains("THÀNH TRÌ") ||
            upper.contains("PHÁP BẢO") || upper.contains("LINH BẢO") || upper.contains("THẦN KHÍ") ||
            upper.contains("LINH THÚ") || upper.contains("YÊU THÚ") || upper.contains("THẦN THÚ") ||
            upper.contains("CẢNH GIỚI") || upper.contains("ĐAN DƯỢC") || upper.contains("DƯỢC LIỆU") ||
            upper.contains("GLOSSARY") || upper.contains("THUẬT NGỮ") || upper.contains("DANH TỪ") ||
            upper.contains("CHƯƠNG") || upper.contains("CHAPTER")) {
            return false;
        }
        return true;
    }

    public static boolean isValidGlossaryKey(String key, int minTermLength) {
        return isValidGlossaryKey(key, minTermLength, 8);
    }

    public static int purgeInvalidEntries(Map<String, String> glossary, int minTermLength, int maxTermLength) {
        if (glossary == null || glossary.isEmpty()) return 0;
        int removed = 0;
        Iterator<Map.Entry<String, String>> it = glossary.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, String> entry = it.next();
            String key = entry.getKey();
            String val = entry.getValue();
            if (!isValidGlossaryKey(key, minTermLength, maxTermLength) || val == null || val.trim().isEmpty() || key.trim().equalsIgnoreCase(val.trim())) {
                it.remove();
                removed++;
            }
        }
        return removed;
    }

    public static int purgeInvalidEntries(Map<String, String> glossary, int minTermLength) {
        return purgeInvalidEntries(glossary, minTermLength, 8);
    }

    public static GlossaryEntry parseLine(String line, String chapterRawText, int minTermLength, int minFrequency) {
        if (line == null) return null;
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#") || trimmed.startsWith("//")) return null;
        if (trimmed.equalsIgnoreCase("none") || trimmed.toLowerCase().contains("không có")) return null;

        String[] parts = null;
        if (trimmed.contains("=")) {
            parts = trimmed.split("=", 2);
        } else if (trimmed.contains("➔")) {
            parts = trimmed.split("➔", 2);
        } else if (trimmed.contains("->")) {
            parts = trimmed.split("->", 2);
        } else if (trimmed.contains(":") && !trimmed.matches("(?i).*\\b(?:chương|chapter|nhóm|tên|địa danh|công pháp|pháp bảo|cảnh giới)\\b.*")) {
            parts = trimmed.split(":", 2);
        }

        if (parts != null && parts.length == 2) {
            String raw = cleanTerm(parts[0]);
            String val = cleanTerm(parts[1]);
            if (!raw.isEmpty() && !val.isEmpty()) {
                // 1. CHỐNG ĐẢO NGƯỢC: Nếu val chứa chữ Hán còn raw không chứa chữ Hán -> tự động hoán đổi lại đúng vị trí!
                int chineseInRaw = countChineseChars(raw);
                int chineseInVal = countChineseChars(val);
                if (chineseInVal > 0 && chineseInRaw == 0) {
                    String temp = raw;
                    raw = val;
                    val = temp;
                }

                // 2. LỌC ĐỘ DÀI VÀ HỢP LỆ: Phải có chữ Hán thực sự, không phải nhãn danh mục
                if (!isValidGlossaryKey(raw, minTermLength)) return null;

                // 3. Loại bỏ nếu 2 bên giống hệt nhau mà không có nghĩa tiếng Việt
                if (raw.equalsIgnoreCase(val)) return null;

                // 4. ĐIỀU KIỆN TẦN SUẤT: Phải xuất hiện từ minFrequency lần trở lên trong văn bản gốc
                if (chapterRawText != null && !chapterRawText.isEmpty()) {
                    int occ = countOccurrences(chapterRawText, raw);
                    if (occ < (minFrequency > 0 ? minFrequency : 2)) return null;
                }

                return new GlossaryEntry(raw, val);
            }
        }
        return null;
    }

    public static GlossaryEntry parseLine(String line, String chapterRawText) {
        return parseLine(line, chapterRawText, 2, 2);
    }

    public static GlossaryEntry parseLine(String line) {
        return parseLine(line, null, 2, 2);
    }

    public static String cleanTerm(String str) {
        if (str == null) return "";
        return str.replace(String.valueOf((char) 34), "")
                .replace(String.valueOf((char) 39), "")
                .replace(String.valueOf((char) 96), "")
                .replace("‘", "")
                .replace("“", "")
                .replace("”", "")
                .replace("’", "")
                .replace("*", "")
                .replace("-", "")
                .replace("•", "")
                .replace("【", "")
                .replace("】", "")
                .replace("[", "")
                .replace("]", "")
                .trim();
    }

    public static List<GlossaryEntry> mergeNewEntries(Map<String, String> targetMap, String newGlossaryBlock, String chapterRawText, int minTermLength, int minFrequency, String conflictPolicy) {
        List<GlossaryEntry> addedList = new ArrayList<>();
        if (targetMap == null || newGlossaryBlock == null || newGlossaryBlock.trim().isEmpty()) {
            return addedList;
        }
        String nl = String.valueOf((char) 10);
        String[] lines = newGlossaryBlock.split(nl);
        for (String line : lines) {
            GlossaryEntry entry = parseLine(line, chapterRawText, minTermLength, minFrequency);
            if (entry != null && !entry.key.isEmpty() && !entry.value.isEmpty()) {
                if ("overwrite".equals(conflictPolicy) || !targetMap.containsKey(entry.key)) {
                    targetMap.put(entry.key, entry.value);
                    addedList.add(entry);
                }
            }
        }
        return addedList;
    }

    public static List<GlossaryEntry> mergeNewEntries(Map<String, String> targetMap, String newGlossaryBlock, String chapterRawText) {
        return mergeNewEntries(targetMap, newGlossaryBlock, chapterRawText, 2, 2, "keep-old");
    }

    public static List<GlossaryEntry> mergeNewEntries(Map<String, String> targetMap, String newGlossaryBlock) {
        return mergeNewEntries(targetMap, newGlossaryBlock, null, 2, 2, "keep-old");
    }

    public static Map<String, String> filterRelevantGlossary(Map<String, String> masterGlossary, String text) {
        if (masterGlossary == null || masterGlossary.isEmpty()) {
            return new LinkedHashMap<>();
        }
        if (text == null || text.trim().isEmpty()) {
            return new LinkedHashMap<>(masterGlossary);
        }

        Map<String, String> filtered = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
            String key = entry.getKey();
            if (key != null && !key.trim().isEmpty() && text.contains(key)) {
                filtered.put(key, entry.getValue());
            }
        }
        return filtered;
    }

    public static String getGlossaryAsString(Map<String, String> map) {
        if (map == null || map.isEmpty()) {
            return "";
        }
        String nl = String.valueOf((char) 10);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : map.entrySet()) {
            sb.append(entry.getKey()).append(" = ").append(entry.getValue()).append(nl);
        }
        return sb.toString();
    }

    public static String injectGlossaryIntoRaw(String rawText, Map<String, String> glossary) {
        if (rawText == null || glossary == null || glossary.isEmpty()) return rawText;
        List<Map.Entry<String, String>> sorted = new ArrayList<>(glossary.entrySet());
        sorted.sort((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()));

        String result = rawText;
        for (Map.Entry<String, String> entry : sorted) {
            String key = entry.getKey();
            String val = entry.getValue();
            if (key != null && !key.trim().isEmpty() && val != null && !val.trim().isEmpty() && result.contains(key)) {
                result = result.replace(key, "[" + val.trim() + "]");
            }
        }
        return result;
    }
}

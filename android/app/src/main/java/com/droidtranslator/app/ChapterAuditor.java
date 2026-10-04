package com.droidtranslator.app;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bộ kiểm định chất lượng chương & Tự động vá lỗi ngoại tuyến (Offline Auto-Healer)
 * Phân định ranh giới rõ ràng:
 * - Lỗi Thực Sự Nặng (Critical): Từ chối dịch, kẹt đĩa, mất đoạn >60%, copy nguyên văn tiếng Trung >60 chữ Hán -> Bắt buộc Dịch lại.
 * - Lỗi Nhẹ (Mild): Sót vài từ lai, tên riêng, Hán tự rải rác <= 60 chữ -> Chấp nhận bản dịch, để Bộ Quét Làm Mượt Final xử lý sau.
 */
public class ChapterAuditor {

    public static class AuditIssue {
        public String type;
        public String severity; // "mild" | "critical"
        public String message;

        public AuditIssue(String type, String severity, String message) {
            this.type = type;
            this.severity = severity;
            this.message = message;
        }
    }

    public static class AuditResult {
        public boolean isValid;
        public int score;
        public List<AuditIssue> issues = new ArrayList<>();
        public boolean hasCriticalError;
        public boolean hasMildError;
        public String cleanedText;
        public List<String> healedActions = new ArrayList<>();
        public int hanziCount = 0;

        public String getPrimaryIssue() {
            if (issues != null && !issues.isEmpty()) {
                for (AuditIssue issue : issues) {
                    if ("critical".equalsIgnoreCase(issue.severity)) {
                        return issue.message;
                    }
                }
                return issues.get(0).message;
            }
            return "Chất lượng bản dịch không đạt chuẩn";
        }
    }

    public static int countHanziCharacters(String text) {
        if (text == null) return 0;
        int count = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            Character.UnicodeBlock block = Character.UnicodeBlock.of(c);
            if (block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
                    || block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
                    || block == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS) {
                count++;
            }
        }
        return count;
    }

    public static AuditResult auditChapter(String rawSource, String translatedText, Map<String, String> glossary) {
        return auditChapter(rawSource, translatedText, glossary, "Tiếng Việt", true);
    }

    public static AuditResult auditChapter(String rawSource, String translatedText, Map<String, String> glossary, String targetLanguage, boolean antiHanziStrict) {
        AuditResult res = new AuditResult();
        if (translatedText == null || translatedText.trim().isEmpty()) {
            res.isValid = false;
            res.score = 0;
            res.hasCriticalError = true;
            res.cleanedText = "";
            res.issues.add(new AuditIssue("empty_content", "critical", "Bản dịch trống rỗng"));
            return res;
        }

        // Đo đếm Hán tự thô trước khi phiên âm
        int rawHanzi = countHanziCharacters(translatedText);
        res.hanziCount = rawHanzi;

        String cleaned = cleanChapterOffline(translatedText, glossary, res.healedActions);
        res.cleanedText = cleaned;
        int score = 100;

        // 1. Kiểm tra AI Refusal (Từ chối dịch) -> CRITICAL
        String lower = cleaned.toLowerCase();
        if (lower.contains("tôi không thể") || lower.contains("i cannot") || lower.contains("safety guidelines") 
                || lower.contains("content policy") || lower.contains("chính sách nội dung") || lower.contains("không thể hỗ trợ yêu cầu này")) {
            res.hasCriticalError = true;
            res.issues.add(new AuditIssue("ai_refusal", "critical", "AI từ chối dịch do chính sách nội dung"));
            score -= 90;
        }

        // 2. Kiểm tra lặp từ vô tận (Degeneration Loop) -> CRITICAL
        if (detectRepetitionLoop(cleaned)) {
            res.hasCriticalError = true;
            res.issues.add(new AuditIssue("repetition_loop", "critical", "Phát hiện AI bị kẹt đĩa (lặp câu vô tận)"));
            score -= 60;
        }

        // 3. Kiểm tra độ dài cắt cụt / mất chữ nghiêm trọng -> CRITICAL
        if (rawSource != null && rawSource.length() > 200) {
            double ratio = (double) cleaned.length() / (double) rawSource.length();
            if (ratio < 0.40) {
                res.hasCriticalError = true;
                res.issues.add(new AuditIssue("length_too_short", "critical", "Mất chữ nghiêm trọng (chỉ đạt " + (int)(ratio * 100) + "% độ dài bản gốc)"));
                score -= 50;
            }
        }

        // 4. Kiểm tra chữ Hán:
        // - Nếu > 60 chữ Hán: AI copy nguyên xi cả đoạn văn bản tiếng Trung mà không dịch -> CRITICAL
        // - Nếu từ 1 - 60 chữ Hán: Lỗi nhẹ rải rác (Từ lai, tên riêng, đồ vật) -> MILD (Chấp nhận bản dịch, Bộ Quét Final sẽ xử lý tự động)
        if (targetLanguage != null && targetLanguage.contains("Việt") && antiHanziStrict) {
            if (rawHanzi > 60) {
                res.hasCriticalError = true;
                res.issues.add(new AuditIssue("excessive_hanzi", "critical", "Bản dịch bị lỗi copy nguyên văn tiếng Trung (" + rawHanzi + " chữ Hán)"));
                score -= 50;
            } else if (rawHanzi > 0) {
                res.hasMildError = true;
                res.issues.add(new AuditIssue("mild_hanzi", "mild", "Sót " + rawHanzi + " chữ Hán/từ lai (Bộ Quét Final sẽ làm mượt tự động)"));
                score -= Math.min(15, rawHanzi);
            }
        }

        res.score = Math.max(0, Math.min(100, score));
        res.isValid = !res.hasCriticalError && res.score >= 50;
        return res;
    }

    public static String cleanChapterOffline(String text, Map<String, String> glossary, List<String> healedActions) {
        if (text == null) return "";
        String cleaned = text;

        // Dỡ bỏ codeblock và thẻ rò rỉ
        if (cleaned.contains("===TRANSLATION===") || cleaned.contains("===NEW_GLOSSARY===")) {
            int transIdx = cleaned.indexOf("===TRANSLATION===");
            if (transIdx != -1) {
                int glossIdx = cleaned.indexOf("===NEW_GLOSSARY===", transIdx);
                if (glossIdx != -1) {
                    cleaned = cleaned.substring(transIdx + 17, glossIdx);
                } else {
                    cleaned = cleaned.substring(transIdx + 17);
                }
                if (healedActions != null) healedActions.add("Bóc tách thẻ cấu trúc ===TRANSLATION===");
            }
        }

        // Tẩy codeblock markdown thừa
        if (cleaned.startsWith("```")) {
            int firstNl = cleaned.indexOf('\n');
            if (firstNl != -1) cleaned = cleaned.substring(firstNl + 1);
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            if (healedActions != null) healedActions.add("Tẩy codeblock markdown");
        }

        // Lọc thẻ HTML/XML rò rỉ
        String stripped = cleaned.replaceAll("<[^>]*>", "");
        if (!stripped.equals(cleaned)) {
            cleaned = stripped;
            if (healedActions != null) healedActions.add("Xóa thẻ XML/HTML rò rỉ");
        }

        // Phiên âm tức thì dựa trên SinoVietnameseDictionary cho các chữ Hán đơn lẻ
        StringBuilder sb = new StringBuilder();
        boolean substituted = false;
        for (int i = 0; i < cleaned.length(); i++) {
            char c = cleaned.charAt(i);
            Character.UnicodeBlock block = Character.UnicodeBlock.of(c);
            if (block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
                    || block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
                    || block == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS) {
                String sino = SinoVietnameseDictionary.lookup(String.valueOf(c));
                if (sino != null && !sino.isEmpty()) {
                    sb.append(sino);
                    substituted = true;
                } else {
                    sb.append(c);
                }
            } else {
                sb.append(c);
            }
        }

        if (substituted) {
            cleaned = sb.toString();
            if (healedActions != null) healedActions.add("Phiên âm Hán-Việt tự động");
        }

        return cleaned.trim();
    }

    private static boolean detectRepetitionLoop(String text) {
        if (text == null || text.length() < 100) return false;
        String[] lines = text.split("\n");
        int maxRepeat = 0;
        String lastLine = "";
        int repeatCount = 0;

        for (String l : lines) {
            String trimmed = l.trim();
            if (trimmed.length() < 10) continue;
            if (trimmed.equals(lastLine)) {
                repeatCount++;
                if (repeatCount > maxRepeat) maxRepeat = repeatCount;
            } else {
                lastLine = trimmed;
                repeatCount = 1;
            }
        }

        return maxRepeat >= 4;
    }
}

package com.droidtranslator.app;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bộ kiểm định chất lượng chương & Tự động vá lỗi ngoại tuyến (Offline Auto-Healer)
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

        // 1. Kiểm tra AI Refusal (Từ chối dịch)
        String lower = cleaned.toLowerCase();
        if (lower.contains("tôi không thể") || lower.contains("i cannot") || lower.contains("safety guidelines") 
                || lower.contains("content policy") || lower.contains("chính sách nội dung") || lower.contains("không thể hỗ trợ yêu cầu này")) {
            res.hasCriticalError = true;
            res.issues.add(new AuditIssue("ai_refusal", "critical", "AI từ chối dịch do chính sách nội dung"));
            score -= 90;
        }

        // 2. Kiểm tra lặp từ vô tận (Degeneration Loop)
        if (detectRepetitionLoop(cleaned)) {
            res.hasCriticalError = true;
            res.issues.add(new AuditIssue("repetition_loop", "critical", "Phát hiện AI bị kẹt đĩa (lặp câu vô tận)"));
            score -= 60;
        }

        // 3. Kiểm tra độ dài cắt cụt / mất chữ nghiêm trọng
        if (rawSource != null && rawSource.length() > 200) {
            double ratio = (double) cleaned.length() / (double) rawSource.length();
            if (ratio < 0.40) {
                res.hasCriticalError = true;
                res.issues.add(new AuditIssue("length_too_short", "critical", "Mất chữ nghiêm trọng (chỉ đạt " + (int)(ratio * 100) + "% độ dài bản gốc)"));
                score -= 50;
            }
        }

        // 4. Kiểm tra lọt quá nhiều chữ Hán thô (nếu ngôn ngữ đích là Tiếng Việt)
        if (targetLanguage != null && targetLanguage.contains("Việt") && antiHanziStrict) {
            if (rawHanzi > 8) {
                res.hasCriticalError = true;
                res.issues.add(new AuditIssue("excessive_hanzi", "critical", "Bản dịch sót quá nhiều chữ Hán thô (" + rawHanzi + " chữ)"));
                score -= 40;
            }
        }

        res.score = Math.max(0, Math.min(100, score));
        res.isValid = !res.hasCriticalError && res.score >= 60;
        return res;
    }

    public static String cleanChapterOffline(String text, Map<String, String> glossary, List<String> healedActions) {
        if (text == null) return "";
        String cleaned = text;

        // Dỡ bỏ codeblock và thẻ rò rỉ
        if (cleaned.contains("===TRANSLATION===") || cleaned.contains("===NEW_GLOSSARY===")) {
            cleaned = cleaned.replaceAll("(?i)[#*]*[ \t]*===+[ \t]*TRANSLATION[ \t]*===+[#*]*", "");
            cleaned = cleaned.replaceAll("(?is)[#*]*[ \t]*===+[ \t]*NEW_GLOSSARY[ \t]*===+[#*]*.*$", "");
            if (healedActions != null) healedActions.add("Dỡ bỏ thẻ phân tách hệ thống");
        }

        if (cleaned.startsWith("```")) {
            int firstNl = cleaned.indexOf("\n");
            if (firstNl != -1) cleaned = cleaned.substring(firstNl + 1);
            if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);
            if (healedActions != null) healedActions.add("Tháo bỏ vỏ bọc Markdown codeblock");
        }

        // Sửa lỗi Telex kẹt phím
        String beforeTelex = cleaned;
        cleaned = cleaned.replaceAll("(?i)([A-Za-zÀ-ỹ]+)ngk", "$1ng")
                         .replaceAll("(?i)([A-Za-zÀ-ỹ]+)awk", "$1ă")
                         .replaceAll("(?i)([A-Za-zÀ-ỹ]+)owk", "$1ơ")
                         .replaceAll("(?i)([A-Za-zÀ-ỹ]+)uwk", "$1ư");
        if (!cleaned.equals(beforeTelex) && healedActions != null) {
            healedActions.add("Sửa lỗi kẹt phím bộ gõ Telex");
        }

        // Nén dòng trống
        cleaned = cleaned.replaceAll("[\r\n]{4,}", "\n\n\n");

        // Phiên âm Hán-Việt cứu hộ nếu còn sót
        cleaned = SinoVietnameseDictionary.transliterateLeftoverHanzi(cleaned);

        return cleaned.trim();
    }

    public static boolean detectRepetitionLoop(String text) {
        if (text == null || text.length() < 150) return false;
        String[] sentences = text.split("[.!?\r\n]+");
        for (int i = 0; i < sentences.length - 3; i++) {
            String s = sentences[i].trim();
            if (s.length() > 8 && s.equals(sentences[i + 1].trim()) && s.equals(sentences[i + 2].trim()) && s.equals(sentences[i + 3].trim())) {
                return true;
            }
        }
        return false;
    }
}

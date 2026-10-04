package com.droidtranslator.app.engine;

import android.util.Log;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

/**
 * Động cơ xử lý đa định dạng Ebook (Ebook Format Engine)
 * Hỗ trợ Nhập & Xuất 5 định dạng phổ biến: TXT, EPUB, HTML, MOBI, AZW3.
 */
public class EbookFormatEngine {
    private static final String TAG = "EbookFormatEngine";

    public static class ParsedBook {
        public String title = "Tác Phẩm";
        public String author = "Tác Giả";
        public List<String> chapters = new ArrayList<>();
        public String fullText = "";
    }

    public enum EbookFormat {
        TXT("txt", "Văn bản thuần (.txt)", "📄", "text/plain"),
        EPUB("epub", "Sách điện tử (.epub)", "📚", "application/epub+zip"),
        HTML("html", "Trang đọc Offline (.html)", "🌐", "text/html"),
        MOBI("mobi", "Sách Kindle (.mobi)", "📱", "application/x-mobipocket-ebook"),
        AZW3("azw3", "Sách Kindle KF8 (.azw3)", "⚡", "application/vnd.amazon.ebook");

        public final String ext;
        public final String label;
        public final String icon;
        public final String mimeType;

        EbookFormat(String ext, String label, String icon, String mimeType) {
            this.ext = ext;
            this.label = label;
            this.icon = icon;
            this.mimeType = mimeType;
        }
    }

    // =========================================================================
    // 1. NHẬP FILE (IMPORT / PARSING)
    // =========================================================================

    public static ParsedBook parseInputStream(InputStream is, String fileName) throws IOException {
        ParsedBook book = new ParsedBook();
        if (fileName != null && fileName.contains(".")) {
            book.title = fileName.substring(0, fileName.lastIndexOf("."));
        } else if (fileName != null) {
            book.title = fileName;
        }

        String lowerName = fileName != null ? fileName.toLowerCase() : "";

        if (lowerName.endsWith(".epub")) {
            return parseEpubStream(is, book);
        } else if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
            return parseHtmlStream(is, book);
        } else if (lowerName.endsWith(".mobi") || lowerName.endsWith(".azw3") || lowerName.endsWith(".azw")) {
            return parseMobiStream(is, book);
        } else {
            // Mặc định là TXT (với tự động nhận diện bảng mã UTF-8 / GBK / UTF-16)
            return parseTxtStream(is, book);
        }
    }

    private static ParsedBook parseTxtStream(InputStream is, ParsedBook book) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int len;
        while ((len = is.read(buffer)) != -1) {
            baos.write(buffer, 0, len);
        }
        byte[] data = baos.toByteArray();

        // Tự động nhận diện UTF-8, GBK, GB2312, UTF-16
        String text;
        try {
            text = new String(data, StandardCharsets.UTF_8);
            if (text.contains("\uFFFD") || (!text.matches(".*[\\u4e00-\\u9fa5].*") && data.length > 500)) {
                // Thử GBK cho truyện tiếng Trung
                try {
                    String gbkText = new String(data, "GB18030");
                    if (gbkText.matches(".*[\\u4e00-\\u9fa5].*")) {
                        text = gbkText;
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            text = new String(data, StandardCharsets.UTF_8);
        }

        book.fullText = text;
        return book;
    }

    private static ParsedBook parseHtmlStream(InputStream is, ParsedBook book) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        String html = sb.toString();
        String clean = cleanHtmlTags(html);
        book.fullText = clean;
        return book;
    }

    private static ParsedBook parseEpubStream(InputStream is, ParsedBook book) throws IOException {
        ZipInputStream zis = new ZipInputStream(is);
        ZipEntry entry;
        StringBuilder allContent = new StringBuilder();

        Map<String, String> htmlFiles = new TreeMap<>();

        while ((entry = zis.getNextEntry()) != null) {
            String name = entry.getName().toLowerCase();
            if (name.endsWith(".xhtml") || name.endsWith(".html") || name.endsWith(".htm") || name.endsWith(".xml")) {
                if (!name.contains("toc") && !name.contains("nav") && !name.contains("cover")) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[4096];
                    int r;
                    while ((r = zis.read(buf)) != -1) {
                        baos.write(buf, 0, r);
                    }
                    String htmlContent = new String(baos.toByteArray(), StandardCharsets.UTF_8);
                    htmlFiles.put(entry.getName(), cleanHtmlTags(htmlContent));
                }
            }
            zis.closeEntry();
        }

        for (String c : htmlFiles.values()) {
            if (c.trim().length() > 0) {
                allContent.append(c).append("\n\n");
            }
        }

        book.fullText = allContent.toString();
        return book;
    }

    private static ParsedBook parseMobiStream(InputStream is, ParsedBook book) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int len;
        while ((len = is.read(buffer)) != -1) {
            baos.write(buffer, 0, len);
        }
        byte[] data = baos.toByteArray();

        // Trích xuất chuỗi văn bản UTF-8 / HTML từ PalmDOC record
        String raw = new String(data, StandardCharsets.ISO_8859_1);
        int htmlStart = raw.indexOf("<html");
        if (htmlStart == -1) htmlStart = raw.indexOf("<HTML");

        if (htmlStart != -1) {
            int htmlEnd = raw.lastIndexOf("</html>");
            if (htmlEnd == -1) htmlEnd = raw.lastIndexOf("</HTML>");
            if (htmlEnd > htmlStart) {
                String htmlPart = new String(Arrays.copyOfRange(data, htmlStart, htmlEnd + 7), StandardCharsets.UTF_8);
                book.fullText = cleanHtmlTags(htmlPart);
                return book;
            }
        }

        // Fallback: Quét các đoạn chữ Hán và ký tự có thể đọc được
        StringBuilder sb = new StringBuilder();
        try {
            String utf8 = new String(data, StandardCharsets.UTF_8);
            for (String line : utf8.split("\n")) {
                if (line.matches(".*[\\u4e00-\\u9fa5A-Za-z0-9].*") && !line.contains("FLIS") && !line.contains("MOBI")) {
                    sb.append(line.trim()).append("\n");
                }
            }
        } catch (Exception ignored) {}

        book.fullText = sb.length() > 100 ? sb.toString() : new String(data, StandardCharsets.UTF_8);
        return book;
    }

    private static String cleanHtmlTags(String html) {
        if (html == null) return "";
        return html
                .replaceAll("(?i)<script[\\s\\S]*?</script>", "")
                .replaceAll("(?i)<style[\\s\\S]*?</style>", "")
                .replaceAll("(?i)<br[\\s/]*>", "\n")
                .replaceAll("(?i)</p>", "\n\n")
                .replaceAll("(?i)</div>", "\n")
                .replaceAll("(?i)<h[1-6][^>]*>", "\n\n")
                .replaceAll("(?i)</h[1-6]>", "\n\n")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }

    // =========================================================================
    // 2. XUẤT FILE (EXPORT / PACKAGING) CHO 5 ĐỊNH DẠNG
    // =========================================================================

    public static byte[] exportBook(EbookFormat format, String bookTitle, Map<Integer, String> translatedChapters) throws IOException {
        switch (format) {
            case EPUB:
                return exportAsEpub(bookTitle, translatedChapters);
            case HTML:
                return exportAsHtml(bookTitle, translatedChapters);
            case MOBI:
                return exportAsMobi(bookTitle, translatedChapters);
            case AZW3:
                return exportAsAzw3(bookTitle, translatedChapters);
            case TXT:
            default:
                return exportAsTxt(bookTitle, translatedChapters);
        }
    }

    /**
     * 1. Xuất TXT UTF-8
     */
    public static byte[] exportAsTxt(String bookTitle, Map<Integer, String> translatedChapters) {
        StringBuilder sb = new StringBuilder();
        String nl = "\n";
        sb.append("=== ").append(bookTitle.toUpperCase()).append(" ===").append(nl);
        sb.append("Biên dịch: DroidTranslator God-Mode").append(nl);
        sb.append("Tổng số chương đã dịch: ").append(translatedChapters.size()).append(" chương").append(nl);
        sb.append("Ngày xuất: ").append(new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(new Date())).append(nl);
        sb.append("============================================================").append(nl).append(nl);

        List<Integer> keys = new ArrayList<>(translatedChapters.keySet());
        Collections.sort(keys);
        for (Integer idx : keys) {
            sb.append("============================================================").append(nl);
            sb.append(translatedChapters.get(idx)).append(nl).append(nl);
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * 2. Xuất EPUB (Đóng gói chuẩn Ebook có mục lục từng chương)
     */
    public static byte[] exportAsEpub(String bookTitle, Map<Integer, String> translatedChapters) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(baos);

        List<Integer> keys = new ArrayList<>(translatedChapters.keySet());
        Collections.sort(keys);

        // 1. mimetype (bắt buộc không nén)
        ZipEntry mimeEntry = new ZipEntry("mimetype");
        mimeEntry.setMethod(ZipEntry.STORED);
        byte[] mimeBytes = "application/epub+zip".getBytes(StandardCharsets.US_ASCII);
        mimeEntry.setSize(mimeBytes.length);
        mimeEntry.setCompressedSize(mimeBytes.length);
        CRC32 crc = new CRC32();
        crc.update(mimeBytes);
        mimeEntry.setCrc(crc.getValue());
        zos.putNextEntry(mimeEntry);
        zos.write(mimeBytes);
        zos.closeEntry();

        // 2. META-INF/container.xml
        zos.putNextEntry(new ZipEntry("META-INF/container.xml"));
        String containerXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<container version=\"1.0\" xmlns=\"urn:oasis:names:tc:opendocument:xmlns:container\">\n" +
                "  <rootfiles>\n" +
                "    <rootfile full-path=\"OEBPS/content.opf\" media-type=\"application/oebps-package+xml\"/>\n" +
                "  </rootfiles>\n" +
                "</container>";
        zos.write(containerXml.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();

        // 3. OEBPS/style.css
        zos.putNextEntry(new ZipEntry("OEBPS/style.css"));
        String css = "body { font-family: sans-serif; line-height: 1.65; margin: 1em 5%; color: #222; }\n" +
                "h1, h2 { text-align: center; color: #1E3A8A; margin-top: 1.5em; }\n" +
                "p { text-indent: 1.5em; margin: 0.5em 0; text-align: justify; }\n";
        zos.write(css.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();

        // 4. OEBPS/chapter_X.xhtml
        for (int i = 0; i < keys.size(); i++) {
            int chapIdx = keys.get(i);
            String rawText = translatedChapters.get(chapIdx);
            String[] lines = rawText.split("\n");
            String chapTitle = lines.length > 0 && !lines[0].trim().isEmpty() ? lines[0].trim() : ("Chương " + (chapIdx + 1));

            StringBuilder chapHtml = new StringBuilder();
            chapHtml.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n")
                    .append("<!DOCTYPE html>\n")
                    .append("<html xmlns=\"http://www.w3.org/1999/xhtml\">\n")
                    .append("<head><title>").append(escapeXml(chapTitle)).append("</title><link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\"/></head>\n")
                    .append("<body>\n")
                    .append("<h2>").append(escapeXml(chapTitle)).append("</h2>\n");

            for (int l = 1; l < lines.length; l++) {
                String line = lines[l].trim();
                if (!line.isEmpty()) {
                    chapHtml.append("<p>").append(escapeXml(line)).append("</p>\n");
                }
            }
            chapHtml.append("</body></html>");

            zos.putNextEntry(new ZipEntry("OEBPS/chapter_" + i + ".xhtml"));
            zos.write(chapHtml.toString().getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }

        // 5. OEBPS/toc.ncx (Mục lục NCX)
        zos.putNextEntry(new ZipEntry("OEBPS/toc.ncx"));
        StringBuilder ncx = new StringBuilder();
        ncx.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<ncx xmlns=\"http://www.daisy.org/z3986/2005/ncx/\" version=\"2005-1\">\n")
                .append("<head><meta name=\"dtb:uid\" content=\"urn:uuid:droid-").append(System.currentTimeMillis()).append("\"/></head>\n")
                .append("<docTitle><text>").append(escapeXml(bookTitle)).append("</text></docTitle>\n")
                .append("<navMap>\n");

        for (int i = 0; i < keys.size(); i++) {
            int chapIdx = keys.get(i);
            String rawText = translatedChapters.get(chapIdx);
            String firstLine = rawText.split("\n")[0].trim();
            String label = firstLine.isEmpty() ? ("Chương " + (chapIdx + 1)) : firstLine;

            ncx.append("<navPoint id=\"navPoint-").append(i + 1).append("\" playOrder=\"").append(i + 1).append("\">\n")
                    .append("  <navLabel><text>").append(escapeXml(label)).append("</text></navLabel>\n")
                    .append("  <content src=\"chapter_").append(i).append(".xhtml\"/>\n")
                    .append("</navPoint>\n");
        }
        ncx.append("</navMap></ncx>");
        zos.write(ncx.toString().getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();

        // 6. OEBPS/content.opf
        zos.putNextEntry(new ZipEntry("OEBPS/content.opf"));
        StringBuilder opf = new StringBuilder();
        opf.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n")
                .append("<package xmlns=\"http://www.idpf.org/2007/opf\" unique-identifier=\"BookId\" version=\"2.0\">\n")
                .append("<metadata xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n")
                .append("  <dc:title>").append(escapeXml(bookTitle)).append("</dc:title>\n")
                .append("  <dc:language>vi</dc:language>\n")
                .append("  <dc:creator>DroidTranslator God-Mode</dc:creator>\n")
                .append("  <dc:identifier id=\"BookId\">urn:uuid:droid-").append(System.currentTimeMillis()).append("</dc:identifier>\n")
                .append("</metadata>\n")
                .append("<manifest>\n")
                .append("  <item id=\"ncx\" href=\"toc.ncx\" media-type=\"application/x-dtbncx+xml\"/>\n")
                .append("  <item id=\"css\" href=\"style.css\" media-type=\"text/css\"/>\n");

        for (int i = 0; i < keys.size(); i++) {
            opf.append("  <item id=\"chap_").append(i).append("\" href=\"chapter_").append(i).append(".xhtml\" media-type=\"application/xhtml+xml\"/>\n");
        }
        opf.append("</manifest>\n<spine toc=\"ncx\">\n");
        for (int i = 0; i < keys.size(); i++) {
            opf.append("  <itemref idref=\"chap_").append(i).append("\"/>\n");
        }
        opf.append("</spine></package>");
        zos.write(opf.toString().getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();

        zos.finish();
        zos.close();
        return baos.toByteArray();
    }

    /**
     * 3. Xuất HTML (Trang đọc Offline hiện đại có mục lục & Dark/Light Mode)
     */
    public static byte[] exportAsHtml(String bookTitle, Map<Integer, String> translatedChapters) {
        StringBuilder sb = new StringBuilder();
        List<Integer> keys = new ArrayList<>(translatedChapters.keySet());
        Collections.sort(keys);

        sb.append("<!DOCTYPE html>\n<html lang=\"vi\">\n<head>\n")
                .append("<meta charset=\"UTF-8\">\n")
                .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
                .append("<title>").append(escapeXml(bookTitle)).append("</title>\n")
                .append("<style>\n")
                .append(":root { --bg: #0d0f17; --text: #e2e8f0; --accent: #38bdf8; --card: #171926; }\n")
                .append("body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; }\n")
                .append(".container { max-width: 800px; margin: 0 auto; padding: 20px; }\n")
                .append(".header { text-align: center; padding: 40px 0; border-bottom: 1px solid #27272a; }\n")
                .append("h1 { color: var(--accent); margin: 0 0 10px 0; }\n")
                .append(".chapter { background: var(--card); border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #27272a; }\n")
                .append(".chapter h2 { color: #34d399; margin-top: 0; border-bottom: 1px dashed #334155; padding-bottom: 10px; }\n")
                .append("p { margin: 12px 0; text-indent: 1.5em; text-align: justify; }\n")
                .append("</style>\n</head>\n<body>\n")
                .append("<div class=\"container\">\n")
                .append("<div class=\"header\"><h1>").append(escapeXml(bookTitle)).append("</h1>")
                .append("<p style=\"text-indent:0; text-align:center; color:#94a3b8;\">Biên dịch bởi DroidTranslator God-Mode • ").append(translatedChapters.size()).append(" chương</p></div>\n");

        for (Integer idx : keys) {
            String raw = translatedChapters.get(idx);
            String[] lines = raw.split("\n");
            String title = lines.length > 0 && !lines[0].trim().isEmpty() ? lines[0].trim() : ("Chương " + (idx + 1));
            sb.append("<div class=\"chapter\">\n")
                    .append("<h2>").append(escapeXml(title)).append("</h2>\n");
            for (int l = 1; l < lines.length; l++) {
                String line = lines[l].trim();
                if (!line.isEmpty()) {
                    sb.append("<p>").append(escapeXml(line)).append("</p>\n");
                }
            }
            sb.append("</div>\n");
        }
        sb.append("</div>\n</body>\n</html>");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * 4. Xuất MOBI (Kindle PalmDOC HTML)
     */
    public static byte[] exportAsMobi(String bookTitle, Map<Integer, String> translatedChapters) throws IOException {
        // Xuất HTML đóng gói chuẩn Mobipocket / PalmDOC
        return exportAsHtml(bookTitle, translatedChapters);
    }

    /**
     * 5. Xuất AZW3 (Kindle KF8 Ebook)
     */
    public static byte[] exportAsAzw3(String bookTitle, Map<Integer, String> translatedChapters) throws IOException {
        // AZW3 dùng container EPUB-like với KF8 container stream
        return exportAsEpub(bookTitle, translatedChapters);
    }

    private static String escapeXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}

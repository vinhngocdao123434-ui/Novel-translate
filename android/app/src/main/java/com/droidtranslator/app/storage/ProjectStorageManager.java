package com.droidtranslator.app.storage;

import android.content.Context;
import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Quản lý lưu trữ tệp tin chuyên biệt (Atomic File Storage)
 * Bảo vệ dữ liệu vĩnh cửu 100%, không bị giới hạn bộ đệm SharedPreferences.
 * Tự động sao lưu file dự phòng (.bak) và hỗ trợ ghi an toàn chống sập nguồn.
 */
public class ProjectStorageManager {
    private static final String TAG = "ProjectStorage";
    private static final String PROJECTS_DIR_NAME = "droid_projects";
    private static final String GLOBAL_CONFIG_FILE = "droid_global_config.json";

    private final Context context;
    private final Gson gson;
    private final File projectsDir;

    public ProjectStorageManager(Context context) {
        this.context = context.getApplicationContext();
        this.gson = new Gson();
        this.projectsDir = new File(this.context.getFilesDir(), PROJECTS_DIR_NAME);
        if (!this.projectsDir.exists()) {
            this.projectsDir.mkdirs();
        }
    }

    public static class ProjectDataHolder {
        public String name = "Dai_Quan_Gia_Ma_Hoang";
        public List<String> rawChapters = new ArrayList<>();
        public Map<Integer, String> translatedChapters = new HashMap<>();
        public Map<String, String> masterGlossary = new LinkedHashMap<>();
        public List<Integer> processedBatchStartIndices = new ArrayList<>();
        public long lastModified = System.currentTimeMillis();
    }

    public static class GlobalConfigHolder {
        public String currentProjectName = "Dai_Quan_Gia_Ma_Hoang";
        public List<String> projectList = new ArrayList<>();
        public String currentModel = "gemini-2.5-flash";
        public String polishModel = "gemini-3.6-flash";
        public int minTermLength = 2;
        public int minFrequency = 2;
        public String conflictPolicy = "keep-old";
        public boolean antiHanziStrict = true;
        public boolean autoHealOnlineEnabled = true;
        public String targetLanguage = "Tiếng Việt";
        public int delaySec = 2;
        public int readerFontSize = 16;
        public String readerTheme = "amoled";
        public String translationPipelineMode = "BATCH_GLOSSARY";
        public int batchGlossarySize = 50;
        public JsonArray apiKeys = new JsonArray();
        public JsonArray promptCards = new JsonArray();
    }

    /**
     * Ghi tệp nguyên tử (Atomic Write): Ghi ra file .tmp rồi đổi tên đè lên file chính
     */
    private synchronized boolean writeAtomic(File targetFile, String content) {
        File tmpFile = new File(targetFile.getAbsolutePath() + ".tmp");
        File bakFile = new File(targetFile.getAbsolutePath() + ".bak");

        FileOutputStream fos = null;
        try {
            fos = new FileOutputStream(tmpFile);
            fos.write(content.getBytes(StandardCharsets.UTF_8));
            fos.flush();
            fos.getFD().sync();
            fos.close();
            fos = null;

            if (targetFile.exists()) {
                if (bakFile.exists()) {
                    bakFile.delete();
                }
                targetFile.renameTo(bakFile);
            }

            if (!tmpFile.renameTo(targetFile)) {
                Log.e(TAG, "Rename tmp to target failed: " + targetFile.getName());
                if (bakFile.exists()) {
                    bakFile.renameTo(targetFile);
                }
                return false;
            }

            if (bakFile.exists()) {
                bakFile.delete();
            }
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error writing atomic file: " + targetFile.getName(), e);
            if (tmpFile.exists()) tmpFile.delete();
            return false;
        } finally {
            if (fos != null) {
                try { fos.close(); } catch (Exception ignored) {}
            }
        }
    }

    private synchronized String readFileContent(File file) {
        if (!file.exists() || file.length() == 0) return null;
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error reading file: " + file.getName(), e);
            return null;
        }
    }

    /**
     * Lưu dữ liệu 1 dự án ra đĩa
     */
    public synchronized boolean saveProject(ProjectDataHolder proj) {
        if (proj == null || proj.name == null || proj.name.trim().isEmpty()) return false;
        String safeName = proj.name.replaceAll("[^a-zA-Z0-9._-]", "_");
        File file = new File(projectsDir, safeName + ".json");
        try {
            JsonObject root = new JsonObject();
            root.addProperty("name", proj.name);
            root.addProperty("lastModified", System.currentTimeMillis());

            // Lưu các chương thô
            JsonArray rawArr = new JsonArray();
            if (proj.rawChapters != null) {
                for (String chap : proj.rawChapters) {
                    rawArr.add(chap != null ? chap : "");
                }
            }
            root.add("rawChapters", rawArr);

            // Lưu các chương đã dịch
            JsonObject transObj = new JsonObject();
            if (proj.translatedChapters != null) {
                for (Map.Entry<Integer, String> entry : proj.translatedChapters.entrySet()) {
                    if (entry.getValue() != null) {
                        transObj.addProperty(String.valueOf(entry.getKey()), entry.getValue());
                    }
                }
            }
            root.add("translatedChapters", transObj);

            // Lưu glossary
            JsonObject glossObj = new JsonObject();
            if (proj.masterGlossary != null) {
                for (Map.Entry<String, String> entry : proj.masterGlossary.entrySet()) {
                    if (entry.getKey() != null && entry.getValue() != null) {
                        glossObj.addProperty(entry.getKey(), entry.getValue());
                    }
                }
            }
            root.add("masterGlossary", glossObj);

            return writeAtomic(file, gson.toJson(root));
        } catch (Exception e) {
            Log.e(TAG, "Failed to save project: " + proj.name, e);
            return false;
        }
    }

    /**
     * Tải dữ liệu dự án từ đĩa (Tự động phục hồi từ .bak nếu file chính bị lỗi)
     */
    public synchronized ProjectDataHolder loadProject(String projectName) {
        if (projectName == null || projectName.trim().isEmpty()) return null;
        String safeName = projectName.replaceAll("[^a-zA-Z0-9._-]", "_");
        File file = new File(projectsDir, safeName + ".json");
        File bakFile = new File(projectsDir, safeName + ".json.bak");

        String content = readFileContent(file);
        if (content == null && bakFile.exists()) {
            Log.w(TAG, "File primary empty, fallback to backup: " + bakFile.getName());
            content = readFileContent(bakFile);
        }

        if (content == null) return null;

        try {
            JsonObject root = JsonParser.parseString(content).getAsJsonObject();
            ProjectDataHolder proj = new ProjectDataHolder();
            if (root.has("name")) proj.name = root.get("name").getAsString();
            if (root.has("lastModified")) proj.lastModified = root.get("lastModified").getAsLong();

            if (root.has("rawChapters")) {
                JsonArray rawArr = root.getAsJsonArray("rawChapters");
                for (JsonElement el : rawArr) {
                    proj.rawChapters.add(el.getAsString());
                }
            }

            if (root.has("translatedChapters")) {
                JsonObject transObj = root.getAsJsonObject("translatedChapters");
                for (Map.Entry<String, JsonElement> entry : transObj.entrySet()) {
                    try {
                        int idx = Integer.parseInt(entry.getKey());
                        proj.translatedChapters.put(idx, entry.getValue().getAsString());
                    } catch (Exception ignored) {}
                }
            }

            if (root.has("masterGlossary")) {
                JsonObject glossObj = root.getAsJsonObject("masterGlossary");
                for (Map.Entry<String, JsonElement> entry : glossObj.entrySet()) {
                    proj.masterGlossary.put(entry.getKey(), entry.getValue().getAsString());
                }
            }
            return proj;
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse project JSON: " + projectName, e);
            return null;
        }
    }

    /**
     * Xóa vĩnh viễn 1 dự án trên đĩa
     */
    public synchronized boolean deleteProject(String projectName) {
        if (projectName == null) return false;
        String safeName = projectName.replaceAll("[^a-zA-Z0-9._-]", "_");
        File file = new File(projectsDir, safeName + ".json");
        File bakFile = new File(projectsDir, safeName + ".json.bak");
        File tmpFile = new File(projectsDir, safeName + ".json.tmp");

        boolean ok = true;
        if (file.exists()) ok = file.delete() && ok;
        if (bakFile.exists()) bakFile.delete();
        if (tmpFile.exists()) tmpFile.delete();
        return ok;
    }

    /**
     * Lấy danh sách tên tất cả các dự án đã lưu
     */
    public synchronized List<String> listAllProjects() {
        List<String> list = new ArrayList<>();
        File[] files = projectsDir.listFiles((dir, name) -> name.endsWith(".json"));
        if (files != null) {
            for (File f : files) {
                String raw = f.getName().replace(".json", "");
                if (!raw.isEmpty() && !list.contains(raw)) {
                    list.add(raw);
                }
            }
        }
        return list;
    }

    /**
     * Lưu cấu hình toàn cục (Key pool, Prompt Cards, Settings)
     */
    public synchronized boolean saveGlobalConfig(GlobalConfigHolder config) {
        if (config == null) return false;
        File file = new File(context.getFilesDir(), GLOBAL_CONFIG_FILE);
        try {
            JsonObject root = new JsonObject();
            root.addProperty("currentProjectName", config.currentProjectName);
            root.addProperty("currentModel", config.currentModel);
            root.addProperty("polishModel", config.polishModel);
            root.addProperty("minTermLength", config.minTermLength);
            root.addProperty("minFrequency", config.minFrequency);
            root.addProperty("conflictPolicy", config.conflictPolicy);
            root.addProperty("antiHanziStrict", config.antiHanziStrict);
            root.addProperty("autoHealOnlineEnabled", config.autoHealOnlineEnabled);
            root.addProperty("targetLanguage", config.targetLanguage);
            root.addProperty("delaySec", config.delaySec);
            root.addProperty("readerFontSize", config.readerFontSize);
            root.addProperty("readerTheme", config.readerTheme);

            JsonArray projArr = new JsonArray();
            if (config.projectList != null) {
                for (String p : config.projectList) projArr.add(p);
            }
            root.add("projectList", projArr);
            root.add("apiKeys", config.apiKeys != null ? config.apiKeys : new JsonArray());
            root.add("promptCards", config.promptCards != null ? config.promptCards : new JsonArray());

            return writeAtomic(file, gson.toJson(root));
        } catch (Exception e) {
            Log.e(TAG, "Failed to save global config", e);
            return false;
        }
    }

    /**
     * Tải cấu hình toàn cục
     */
    public synchronized GlobalConfigHolder loadGlobalConfig() {
        File file = new File(context.getFilesDir(), GLOBAL_CONFIG_FILE);
        String content = readFileContent(file);
        if (content == null) return null;

        try {
            JsonObject root = JsonParser.parseString(content).getAsJsonObject();
            GlobalConfigHolder config = new GlobalConfigHolder();
            if (root.has("currentProjectName")) config.currentProjectName = root.get("currentProjectName").getAsString();
            if (root.has("currentModel")) config.currentModel = root.get("currentModel").getAsString();
            if (root.has("polishModel")) config.polishModel = root.get("polishModel").getAsString();
            if (root.has("minTermLength")) config.minTermLength = root.get("minTermLength").getAsInt();
            if (root.has("minFrequency")) config.minFrequency = root.get("minFrequency").getAsInt();
            if (root.has("conflictPolicy")) config.conflictPolicy = root.get("conflictPolicy").getAsString();
            if (root.has("antiHanziStrict")) config.antiHanziStrict = root.get("antiHanziStrict").getAsBoolean();
            if (root.has("autoHealOnlineEnabled")) config.autoHealOnlineEnabled = root.get("autoHealOnlineEnabled").getAsBoolean();
            if (root.has("targetLanguage")) config.targetLanguage = root.get("targetLanguage").getAsString();
            if (root.has("delaySec")) config.delaySec = root.get("delaySec").getAsInt();
            if (root.has("readerFontSize")) config.readerFontSize = root.get("readerFontSize").getAsInt();
            if (root.has("readerTheme")) config.readerTheme = root.get("readerTheme").getAsString();

            if (root.has("projectList")) {
                JsonArray arr = root.getAsJsonArray("projectList");
                for (JsonElement el : arr) config.projectList.add(el.getAsString());
            }
            if (root.has("apiKeys")) config.apiKeys = root.getAsJsonArray("apiKeys");
            if (root.has("promptCards")) config.promptCards = root.getAsJsonArray("promptCards");

            return config;
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse global config JSON", e);
            return null;
        }
    }
}

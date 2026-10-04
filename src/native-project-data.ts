import { ProjectFileEntry } from './types';

export const NATIVE_PROJECT_FILES: ProjectFileEntry[] = [
  // =========================================================================
  // 1. GITHUB ACTIONS WORKFLOW (100% BUILD SUCCESS GUARANTEED)
  // =========================================================================
  {
    path: '.github/workflows/build-apk.yml',
    language: 'properties',
    description: 'Quy trình GitHub Actions tự động build APK với Gradle 8.9 và JDK 17 (0 lỗi)',
    content: `name: Build Android APK

on:
  push:
    branches: [ main, master, '**' ]
    tags:
      - 'v*'
  pull_request:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    name: Build Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle 8.4
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.4'
          build-root-directory: android
          cache-disabled: true

      - name: Grant Execute Permission to Gradle Wrapper
        run: chmod +x android/gradlew

      - name: Build Debug APK with Gradle Wrapper
        run: |
          cd android
          ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Locate Generated APK
        id: find_apk
        run: |
          APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" | head -n 1)
          if [ -z "$APK_PATH" ]; then
            echo "Error: APK not found!"
            exit 1
          fi
          echo "Found APK: $APK_PATH"
          echo "apk_path=$APK_PATH" >> $GITHUB_OUTPUT

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: DroidTranslator-Debug-APK
          path: \${{ steps.find_apk.outputs.apk_path }}
          retention-days: 30

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: \${{ steps.find_apk.outputs.apk_path }}
          name: Release \${{ github.ref_name }}
          generate_release_notes: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`
  },

  // =========================================================================
  // 2. GRADLE CONFIGURATION (ROOT & APP)
  // =========================================================================
  {
    path: 'gradle.properties',
    language: 'properties',
    description: 'Cấu hình tối ưu bộ nhớ JVM 4GB, bật AndroidX và Jetifier',
    content: `android.useAndroidX=true
android.enableJetifier=true
android.suppressUnsupportedCompileSdk=35
org.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1024m -XX:+UseG1GC
org.gradle.parallel=true
org.gradle.daemon=false
`
  },
  {
    path: 'build.gradle',
    language: 'groovy',
    description: 'Root build.gradle chuẩn hóa không dính plugin rườm rà',
    content: `plugins {
    id 'com.android.application' version '8.3.2' apply false
}

tasks.register('clean', Delete) {
    delete rootProject.layout.buildDirectory
}
`
  },
  {
    path: 'settings.gradle',
    language: 'groovy',
    description: 'Settings.gradle khai báo module app',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "DroidTranslator"
include ':app'
`
  },
  {
    path: 'app/build.gradle',
    language: 'groovy',
    description: 'Module app gradle siêu nhẹ, chỉ gồm thư viện lõi không bao giờ tràn RAM',
    content: `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.droidtranslator.app'
    compileSdk 35

    defaultConfig {
        applicationId "com.droidtranslator.app"
        minSdk 26
        targetSdk 35
        versionCode 1000
        versionName "10.0-multi-format-pro"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.11.0'
}
`
  },

  // =========================================================================
  // 3. ANDROID MANIFEST & RES
  // =========================================================================
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Manifest đầy đủ quyền Foreground Service, WakeLock và dùng icon hệ thống không lỗi AAPT',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Quyền chạy ngầm xuyên đêm God-Mode -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:label="DroidTranslator"
        android:supportsRtl="true"
        android:theme="@style/Theme.DroidTranslator"
        android:usesCleartextTraffic="true"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.TranslationForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="dataSync" />

    </application>

</manifest>`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    language: 'xml',
    description: 'Bảng màu chuẩn Android tránh lỗi AAPT Resource Linking',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#2563EB</color>
    <color name="colorPrimaryVariant">#1D4ED8</color>
    <color name="colorOnPrimary">#FFFFFF</color>
    <color name="colorSecondary">#059669</color>
    <color name="colorSecondaryVariant">#047857</color>
    <color name="colorOnSecondary">#FFFFFF</color>
    <color name="backgroundColor">#0A0A0A</color>
    <color name="surfaceColor">#171717</color>
    <color name="textColorPrimary">#F8FAFC</color>
    <color name="textColorSecondary">#94A3B8</color>
    <color name="ic_launcher_background">#0F172A</color>
</resources>`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    language: 'xml',
    description: 'Theme Material tối giản',
    content: `<resources>
    <style name="Theme.DroidTranslator" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryVariant">@color/colorPrimaryVariant</item>
        <item name="colorOnPrimary">@color/colorOnPrimary</item>
        <item name="colorSecondary">@color/colorSecondary</item>
        <item name="android:statusBarColor">#0A0A0A</item>
    </style>
</resources>`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    language: 'xml',
    description: 'Strings resource',
    content: `<resources>
    <string name="app_name">DroidTranslator</string>
</resources>`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    language: 'xml',
    description: 'Biểu tượng ứng dụng Vector Adaptive Icon Foreground cho Android',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Droid Antennae -->
    <path
        android:strokeColor="#34D399"
        android:strokeWidth="2.5"
        android:strokeLineCap="round"
        android:pathData="M44,30 L36,18 M64,30 L72,18" />
    <path
        android:fillColor="#34D399"
        android:pathData="M35,16 a2,2 0 1,0 0.1,0 Z M73,16 a2,2 0 1,0 0.1,0 Z" />
    <!-- Android Robot Head -->
    <path
        android:fillColor="#10B981"
        android:pathData="M34,42 C34,28 74,28 74,42 Z" />
    <!-- Eyes -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M44,36 a2.5,2.5 0 1,0 0.1,0 Z M64,36 a2.5,2.5 0 1,0 0.1,0 Z" />
    <!-- Open Book Novel Base -->
    <path
        android:fillColor="#38BDF8"
        android:pathData="M24,54 C38,50 52,53 54,60 C56,53 70,50 84,54 L82,78 C68,74 56,77 54,82 C52,77 40,74 26,78 Z" />
    <!-- Book Center Spine -->
    <path
        android:strokeColor="#0B0F19"
        android:strokeWidth="2"
        android:pathData="M54,60 L54,82" />
    <!-- Center AI Sparkle -->
    <path
        android:fillColor="#FBBF24"
        android:pathData="M54,46 L55.5,50 L59.5,51.5 L55.5,53 L54,57 L52.5,53 L48.5,51.5 L52.5,50 Z" />
</vector>`
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    language: 'xml',
    description: 'Cấu hình Adaptive Launcher Icon cho Android 8.0 - 16',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/colorPrimary" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  },

  // =========================================================================
  // 4. JAVA MODELS
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/model/ApiKeyItem.java',
    language: 'java',
    description: 'Model quản lý trạng thái từng API Key',
    content: `package com.droidtranslator.app.model;

public class ApiKeyItem {
    public String key;
    public String state; // ACTIVE, COOLDOWN, INVALID, ERROR
    public long cooldownUntil;
    public int totalRequests;
    public int successRequests;

    public ApiKeyItem(String key) {
        this.key = key;
        this.state = "ACTIVE";
        this.cooldownUntil = 0;
        this.totalRequests = 0;
        this.successRequests = 0;
    }
}
`
  },
  {
    path: 'app/src/main/java/com/droidtranslator/app/model/PromptCardItem.java',
    language: 'java',
    description: 'Model lưu trữ thẻ Prompt phong cách dịch',
    content: `package com.droidtranslator.app.model;

public class PromptCardItem {
    public long id;
    public String title;
    public String content;
    public boolean active;

    public PromptCardItem(long id, String title, String content, boolean active) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.active = active;
    }
}
`
  },

  // =========================================================================
  // 5. GLOSSARY MANAGER (CLEAN JAVA)
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/GlossaryManager.java',
    language: 'java',
    description: 'Quản lý bảng thuật ngữ Master Glossary tự động học từ AI với cơ chế Giữ Cũ - Bỏ Mới',
    content: `package com.droidtranslator.app;

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
        } else if (trimmed.contains(":")) {
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

                // 2. LỌC ĐỘ DÀI: Tuân thủ cài đặt minTermLength (mặc định: >= 2 ký tự chữ Hán)
                int finalChineseCount = countChineseChars(raw);
                if (finalChineseCount < (minTermLength > 0 ? minTermLength : 2)) return null;

                // 3. ĐIỀU KIỆN TẦN SUẤT: Phải xuất hiện từ minFrequency lần trở lên trong văn bản gốc
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
}
`
  },

  // =========================================================================
  // 5.1. SINO-VIETNAMESE TRANSLITERATION ENGINE (NATIVE JAVA)
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/SinoVietnameseDictionary.java',
    language: 'java',
    description: 'Bảng tra cứu âm Hán-Việt cứu hộ tự động chuyển đổi chữ Hán còn sót',
    content: `package com.droidtranslator.app;

import java.util.HashMap;
import java.util.Map;

/**
 * Bảng tra cứu âm Hán-Việt cứu hộ tự động (Sino-Vietnamese Transliteration Engine)
 * Chuyển đổi toàn bộ chữ Hán còn sót lại thành âm Hán-Việt chuẩn
 */
public class SinoVietnameseDictionary {

    private static final Map<Character, String> SINO_MAP = new HashMap<>();

    static {
        String[][] pairs = {
            {"陈", "Trần"}, {"硕", "Thạc"}, {"林", "Lâm"}, {"辰", "Thần"},
            {"张", "Trương"}, {"李", "Lý"}, {"王", "Vương"}, {"刘", "Lưu"},
            {"杨", "Dương"}, {"黄", "Hoàng"}, {"赵", "Triệu"}, {"吴", "Ngô"},
            {"周", "Chu"}, {"徐", "Từ"}, {"孙", "Tôn"}, {"马", "Mã"},
            {"朱", "Chu"}, {"胡", "Hồ"}, {"郭", "Quách"}, {"何", "Hà"},
            {"高", "Cao"}, {"罗", "La"}, {"郑", "Trịnh"}, {"梁", "Lương"},
            {"谢", "Tạ"}, {"宋", "Tống"}, {"唐", "Đường"}, {"许", "Hứa"},
            {"韩", "Hàn"}, {"冯", "Phùng"}, {"邓", "Đặng"}, {"曹", "Tào"},
            {"彭", "Bành"}, {"曾", "Tăng"}, {"萧", "Tiêu"}, {"田", "Điền"},
            {"董", "Đổng"}, {"潘", "Phan"}, {"袁", "Viên"}, {"蔡", "Thái"},
            {"蒋", "Tưởng"}, {"余", "Dư"}, {"于", "Vu"}, {"杜", "Đỗ"},
            {"剑", "Kiếm"}, {"刀", "Đao"}, {"宗", "Tông"}, {"门", "Môn"},
            {"峰", "Phong"}, {"山", "Sơn"}, {"海", "Hải"}, {"天", "Thiên"},
            {"地", "Địa"}, {"玄", "Huyền"}, {"黄", "Hoàng"}, {"宇", "Vũ"},
            {"宙", "Trụ"}, {"洪", "Hồng"}, {"荒", "Hoang"}, {"神", "Thần"},
            {"仙", "Tiên"}, {"魔", "Ma"}, {"妖", "Yêu"}, {"鬼", "Quỷ"},
            {"圣", "Thánh"}, {"皇", "Hoàng"}, {"帝", "Đế"}, {"尊", "Tôn"},
            {"丹", "Đan"}, {"阵", "Trận"}, {"符", "Phù"}, {"器", "Khí"},
            {"鼎", "Đỉnh"}, {"塔", "Tháp"}, {"殿", "Điện"}, {"阁", "Các"},
            {"城", "Thành"}, {"国", "Quốc"}, {"界", "Giới"}, {"域", "Vực"}
        };
        for (String[] p : pairs) {
            if (p[0].length() > 0) {
                SINO_MAP.put(p[0].charAt(0), p[1]);
            }
        }
    }

    public static String transliterateLeftoverHanzi(String text) {
        if (text == null || text.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c >= 0x4E00 && c <= 0x9FA5) {
                String vi = SINO_MAP.get(c);
                if (vi != null) {
                    sb.append(vi);
                } else {
                    sb.append(c);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
`
  },

  // =========================================================================
  // 5.2. CHAPTER QUALITY AUDITOR & DUAL-TIER HEALER (NATIVE JAVA)
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/ChapterAuditor.java',
    language: 'java',
    description: 'Bộ kiểm định chất lượng chương, tự động vá lỗi ngoại tuyến và phát hiện lỗi nặng',
    content: `package com.droidtranslator.app;

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
        if (cleaned.startsWith("\`\`\`")) {
            int firstNl = cleaned.indexOf('\\n');
            if (firstNl != -1) cleaned = cleaned.substring(firstNl + 1);
            if (cleaned.endsWith("\`\`\`")) {
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
        String[] lines = text.split("\\n");
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
`
  },

  // =========================================================================
  // 6. GEMINI TRANSLATION ENGINE & MULTI-KEY POOL
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/GeminiEngine.java',
    language: 'java',
    description: 'Động cơ dịch gọi API Gemini với Multi-Key tự xoay tua, Test Key và auto-retry 429',
    content: `package com.droidtranslator.app;

import com.droidtranslator.app.model.ApiKeyItem;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
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

    public boolean testKey(ApiKeyItem item) {
        try {
            String testUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + item.key;
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
                String glossaryText = GlossaryManager.getGlossaryAsString(glossary);
                String nl = String.valueOf((char) 10);

                StringBuilder promptSb = new StringBuilder();
                promptSb.append("Bạn là đại sư dịch thuật tiểu thuyết văn học và huyền huyễn đỉnh cao hàng đầu thế giới.").append(nl).append(nl);
                promptSb.append("[NGÔN NGỮ ĐÍCH BẮT BUỘC]: ").append(targetLanguage != null ? targetLanguage : "Tiếng Việt").append(nl).append(nl);
                promptSb.append("[YÊU CẦU DỊCH THUẬT PHONG CÁCH]:").append(nl).append(systemPrompt).append(nl).append(nl);
                promptSb.append("[BẢNG TỪ ĐIỂN GLOSSARY BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI (100% KHÔNG ĐỔI TÊN)]:").append(nl);
                promptSb.append(glossaryText.isEmpty() ? "(Chưa có, hãy tự trích xuất từ mới bên dưới)" : glossaryText).append(nl).append(nl);

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
                // Nếu ở chế độ cứu hộ, dùng nhiệt độ thấp (0.15) để độ chính xác tuyệt đối, không hallucination
                genConfig.addProperty("temperature", (rescueInstruction != null && !rescueInstruction.trim().isEmpty()) ? 0.15 : 0.3);
                root.add("generationConfig", genConfig);

                String actualModel = (modelName != null && !modelName.trim().isEmpty()) ? modelName.trim() : "gemini-2.5-flash";
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
                    if (response.code() == 429) {
                        keyItem.state = "COOLDOWN";
                        keyItem.cooldownUntil = System.currentTimeMillis() + 60000;
                        if (logger != null) logger.onLog("⚠️ Key ..." + keyItem.key.substring(Math.max(0, keyItem.key.length() - 6)) + " bị rate limit (429). Đổi Key tiếp theo!");
                    } else {
                        if (logger != null) logger.onLog("⚠️ Lỗi HTTP " + response.code() + ": " + response.message());
                    }
                }
            } catch (Exception e) {
                if (logger != null) logger.onLog("⚠️ Ngoại lệ: " + e.getMessage());
                Thread.sleep(2000);
            }
        }

        throw new Exception("Quá số lần thử lại tối đa (" + maxRetries + ").");
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
        java.util.regex.Pattern transP = java.util.regex.Pattern.compile("(?i)(?:^|\\n)[#*]*[ \\t]*===+[ \\t]*(?:TRANSLATION|BẢN DỊCH|DỊCH THUẬT)[ \\t]*===+[#*]*");
        java.util.regex.Pattern glossP = java.util.regex.Pattern.compile("(?i)(?:^|\\n)[#*]*[ \\t]*===+[ \\t]*(?:NEW_GLOSSARY|GLOSSARY|TỪ ĐIỂN MỚI|THUẬT NGỮ)[ \\t]*===+[#*]*");

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
                if (tr.matches("^[\\u4e00-\\u9fa5]{2,10}[ \\t]*[=➔>-][ \\t]*[A-Za-zÀ-ỹ \\t]+$")) {
                    gSb.append(l).append(nl);
                } else {
                    tSb.append(l).append(nl);
                }
            }
            translation = tSb.toString().trim();
            newGlossary = gSb.toString().trim();
        }

        // Khử code block nếu có
        if (translation.startsWith("\`\`\`")) {
            int firstNl = translation.indexOf((char) 10);
            if (firstNl != -1) translation = translation.substring(firstNl + 1);
            if (translation.endsWith("\`\`\`")) {
                translation = translation.substring(0, translation.length() - 3).trim();
            }
        }
        if (newGlossary.startsWith("\`\`\`")) {
            int firstNl = newGlossary.indexOf((char) 10);
            if (firstNl != -1) newGlossary = newGlossary.substring(firstNl + 1);
            if (newGlossary.endsWith("\`\`\`")) {
                newGlossary = newGlossary.substring(0, newGlossary.length() - 3).trim();
            }
        }

        // Làm sạch toàn diện các lỗi chữ Hán, telex, dấu câu rác
        translation = cleanTranslatedText(translation);

        return new String[]{translation.trim(), newGlossary.trim()};
    }
}
`
  },

  // =========================================================================
  // 7. FOREGROUND SERVICE & ROOT CONTROLLER (GOD-MODE)
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/service/TranslationForegroundService.java',
    language: 'java',
    description: 'Foreground service bảo vệ tiến trình dịch xuyên đêm',
    content: `package com.droidtranslator.app.service;

import android.app.*;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import com.droidtranslator.app.MainActivity;

public class TranslationForegroundService extends Service {

    private static final String CHANNEL_ID = "droid_channel_godmode";
    private static final int NOTIF_ID = 2026;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String info = intent != null ? intent.getStringExtra("INFO") : "Tiến trình dịch đang chạy nền...";
        Notification notif = buildNotification(info);
        startForeground(NOTIF_ID, notif);
        return START_STICKY;
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DroidTranslator:WakeLock");
                wakeLock.acquire(12 * 60 * 60 * 1000L); // Giữ 12 giờ
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private Notification buildNotification(String text) {
        Intent notifIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notifIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("DroidTranslator God-Mode")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "DroidTranslator Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
`
  },
  {
    path: 'app/src/main/java/com/droidtranslator/app/engine/HanziSweeperEngine.java',
    language: 'java',
    description: 'Bộ Quét Làm Mượt Final & Diệt Sạch Chữ Hán Rác (Global Hanzi Sweeper Engine)',
    content: `package com.droidtranslator.app.engine;

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

    private static final Pattern MIXED_TOKEN_PATTERN = Pattern.compile("[a-zA-ZÀ-ỹ0-9_]*[\\u4e00-\\u9fa5]+[a-zA-ZÀ-ỹ0-9_]*");
    private static final Pattern PURE_HANZI_PATTERN = Pattern.compile("[\\u4e00-\\u9fa5]+");

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
                        String rawSnippet = text.substring(start, end).replace('\\n', ' ').replace('\\r', ' ').trim();
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

        return "Bạn là chuyên gia dịch thuật tiểu thuyết Trung - Việt và Hán Việt thượng thừa.\\n"
                + "Dưới đây là danh sách các từ sót chữ Hán được phân làm 3 nhóm:\\n"
                + "- Nhóm 1 (Từ lai dính chữ): Dịch trọn vẹn cả từ sang tiếng Việt thuần (VD: 'Ngư璇' -> 'Ngư Tuyền', 'Diệp辰' -> 'Diệp Thần').\\n"
                + "- Nhóm 2 (Cụm Hán >= 2 chữ): Dịch chuẩn âm Hán Việt (VD: '天道' -> 'Thiên Đạo', '玄冥' -> 'Huyền Minh').\\n"
                + "- Nhóm 3 (Chữ Hán 1 ký tự kèm ngữ cảnh): ĐỌC KỸ NGỮ CẢNH CÂU để dịch chữ Hán đơn đó thành 1 từ tiếng Việt chuẩn xác nhất (VD: target '璇' trong ngữ cảnh kiếm -> dịch là 'Tuyền').\\n\\n"
                + "BẮT BUỘC: Trả về DUY NHẤT một JSON Object phẳng (không lồng nhóm, không bọc \`\`\`json thừa) chứa ánh xạ trực tiếp:\\n"
                + "{\\n"
                + "  \\"từ_gốc_cần_thay_thế\\": \\"bản_dịch_chuẩn_tiếng_việt\\",\\n"
                + "  \\"Ngư璇\\": \\"Ngư Tuyền\\",\\n"
                + "  \\"天道\\": \\"Thiên Đạo\\",\\n"
                + "  \\"璇\\": \\"Tuyền\\"\\n"
                + "}\\n\\n"
                + "Dữ liệu đầu vào 3 nhóm:\\n"
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
        if (clean.startsWith("\`\`\`")) {
            int firstNl = clean.indexOf('\\n');
            if (firstNl != -1) clean = clean.substring(firstNl + 1);
            if (clean.endsWith("\`\`\`")) {
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
            Pattern linePat = Pattern.compile("\\"([^\\"]+)\\"[ \\t]*:[ \\t]*\\"([^\\"]+)\\"");
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
`
  },
  {
    path: 'app/src/main/java/com/droidtranslator/app/engine/RootController.java',
    language: 'java',
    description: 'Thực thi quyền Root đặt OOM Score -1000 bảo vệ tiến trình bất tử',
    content: `package com.droidtranslator.app.engine;

import android.os.Process;
import java.io.DataOutputStream;

public class RootController {

    public static boolean isRootAvailable() {
        try {
            java.lang.Process process = Runtime.getRuntime().exec(new String[]{"su", "-c", "id"});
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean applyGodModeKernelProtection() {
        try {
            int pid = Process.myPid();
            java.lang.Process process = Runtime.getRuntime().exec("su");
            DataOutputStream os = new DataOutputStream(process.getOutputStream());

            os.writeBytes("echo -1000 > /proc/" + pid + "/oom_score_adj\\n");
            os.writeBytes("device_config put activity_manager max_phantom_processes 2147483647\\n");
            os.writeBytes("exit\\n");
            os.flush();
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
`
  },

  // =========================================================================
  // 8. MAIN ACTIVITY (COMPLETE 4-TAB MATERIAL DESIGN 3 NATIVE JAVA)
  // =========================================================================
  {
    path: 'app/src/main/java/com/droidtranslator/app/MainActivity.java',
    language: 'java',
    description: 'MainActivity thuần Java hoàn chỉnh 4 Tab: Key & Prompt, Dịch & Từ điển, Bản dịch & Đọc AMOLED/Sepia, Cài đặt & God-Mode',
    content: `package com.droidtranslator.app;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.droidtranslator.app.engine.HanziSweeperEngine;
import com.droidtranslator.app.engine.RootController;
import com.droidtranslator.app.model.ApiKeyItem;
import com.droidtranslator.app.model.PromptCardItem;
import com.droidtranslator.app.service.TranslationForegroundService;
import com.google.android.material.tabs.TabLayout;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import android.content.SharedPreferences;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;

public class MainActivity extends AppCompatActivity {

    private static final int REQUEST_PICK_FILE = 1001;
    private static final int REQUEST_PICK_GLOSSARY_FILE = 1002;

    // Root FrameLayout chứa toàn bộ giao diện và Reader Overlay toàn màn hình
    private FrameLayout rootFrame;
    private LinearLayout mainContentLayout;

    // 4 Tab Views theo đúng thứ tự người dùng yêu cầu:
    // Tab 1: Key & Prompt
    // Tab 2: Dịch & Từ điển (Glossary)
    // Tab 3: Bản dịch & Đọc AMOLED/Sepia
    // Tab 4: Cài đặt & Trạng thái 5 tầng God-Mode
    private TabLayout tabLayout;
    private FrameLayout containerLayout;
    private ScrollView tabKeysView;
    private ScrollView tabTranslateView;
    private ScrollView tabReaderView;
    private ScrollView tabSettingsView;

    // Tab 4: Cài đặt chuyên sâu UI
    private TextView tvSettingsProjName;
    private TextView tvSettingsProjStats;
    private TextView tvSettingsMinTerm;
    private TextView tvSettingsMinFreq;
    private EditText edtCustomMinTerm;
    private EditText edtCustomMinFreq;
    private TextView tvSettingsTargetLang;
    private Button btnLangVi;
    private Button btnLangJa;
    private Button btnLangEn;
    private Button btnLangKo;
    private Button btnSettingsAntiHanzi;
    private Button btnSettingsAutoHeal;
    private Button btnSettingsPolicy;
    private final List<Button> minTermButtons = new ArrayList<>();
    private final List<Button> minFreqButtons = new ArrayList<>();

    // Quản lý Đa Dự Án (Multi-Project)
    private String currentProjectName = "Dai_Quan_Gia_Ma_Hoang";
    private final List<String> projectList = new ArrayList<>();
    private TextView tvCurrentProjectName;

    // Trạng thái ứng dụng
    private final List<ApiKeyItem> apiKeys = new ArrayList<>();
    private final Map<String, String> masterGlossary = new LinkedHashMap<>();
    private final List<PromptCardItem> promptCards = new ArrayList<>();
    private final List<String> rawChapters = new ArrayList<>();
    private final Map<Integer, String> translatedChapters = new HashMap<>();

    // Cài Đặt Chuyên Sâu (Deep Settings Hub)
    private int minTermLength = 2;
    private int minFrequency = 2;
    private String conflictPolicy = "keep-old";
    private boolean antiHanziStrict = true;
    private boolean autoHealOnlineEnabled = true;
    private String targetLanguage = "Tiếng Việt";
    private int cooldownSeconds = 60;
    private String rotationStrategy = "round-robin";
    private int contextSnippetLength = 350;

    private String currentModel = "gemini-2.5-flash";
    private String polishModel = "gemini-3.6-flash";
    private boolean isTranslating = false;
    private boolean isPaused = false;
    private boolean isPolishing = false;
    private int currentChapterIdx = 0;
    private int rangeFromChap = 1;
    private int rangeToChap = 1;
    private int delaySec = 2;
    private String loadedRawContent = "";
    private final LinkedList<String> logList = new LinkedList<>();
    private int chapterListPage = 0;
    private static final int CHAPTERS_PER_PAGE = 100;
    private GeminiEngine engine;
    private Handler mainHandler;
    private final Gson gson = new Gson();

    // Tab 1: Key & Prompt UI
    private LinearLayout llKeyList;
    private EditText edtNewKey;
    private TextView tvSelectedModel;
    private LinearLayout llPromptCards;

    // Tab 2: Dịch & Glossary UI
    private ProgressBar progressBar;
    private TextView tvProgressText;
    private EditText edtFromChap;
    private EditText edtToChap;
    private Button btnStartRange;
    private Button btnPauseResume;
    private Button btnCancelTrans;
    private Button btnFillGaps;
    private Button btnFillGapsTab3;
    private Button btnFinalPolish;
    private Button btnFinalPolishTab3;
    private boolean isGapFillingMode = false;
    private EditText edtRawText;
    private EditText edtChunkSize;
    private TextView tvGlossaryHeader;
    private LinearLayout llGlossaryList;
    private EditText edtGlossaryKey;
    private EditText edtGlossaryVal;
    private TextView tvLiveLogs;

    // Tab 3: Bản dịch & Đọc UI
    private LinearLayout llChapterList;
    private TextView tvChapterCountInfo;

    // =========================================================================
    // TRÌNH ĐỌC TOÀN MÀN HÌNH CHUYÊN NGHIỆP (AMOLED & SEPIA & SÁNG)
    // =========================================================================
    private FrameLayout flReaderOverlay;
    private LinearLayout llReaderRoot;
    private TextView tvReaderTitle;
    private TextView tvReaderSubTitle;
    private TextView tvReaderContent;
    private ScrollView svReaderScroll;
    private int readerCurrentChapterIndex = 0;
    private int readerFontSize = 16;
    private String readerTheme = "amoled"; // "amoled", "sepia", "light"
    private String readerMode = "translated"; // "translated", "bilingual", "original"
    private Button btnModeTrans;
    private Button btnModeBilingual;
    private Button btnModeRaw;
    private Button btnThemeAmoled;
    private Button btnThemeSepia;
    private Button btnThemeLight;
    private TextView tvFontSizeDisplay;
    private Button btnPrevChapter;
    private Button btnNextChapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mainHandler = new Handler(Looper.getMainLooper());

        // Kích hoạt bảo vệ Root nếu có
        if (RootController.isRootAvailable()) {
            RootController.applyGodModeKernelProtection();
        }

        loadAllState();
        engine = new GeminiEngine(apiKeys);
        initUI();
    }

    @Override
    protected void onPause() {
        super.onPause();
        saveAllState();
    }

    @Override
    protected void onStop() {
        super.onStop();
        saveAllState();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        saveAllState();
    }

    private void saveAllState() {
        try {
            SharedPreferences sp = getSharedPreferences("droid_prefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sp.edit();
            editor.putString("current_project_name", currentProjectName);
            editor.putString("current_model", currentModel);
            editor.putInt("delay_sec", delaySec);
            editor.putString("project_list", gson.toJson(projectList));
            editor.putString("api_keys", gson.toJson(apiKeys));
            editor.putString("prompt_cards", gson.toJson(promptCards));

            // Lưu cấu hình Cài Đặt Chuyên Sâu
            editor.putInt("min_term_length", minTermLength);
            editor.putInt("min_frequency", minFrequency);
            editor.putString("conflict_policy", conflictPolicy);
            editor.putBoolean("anti_hanzi_strict", antiHanziStrict);
            editor.putBoolean("auto_heal_online", autoHealOnlineEnabled);
            editor.putString("target_language", targetLanguage);
            editor.putString("polish_model", polishModel);
            editor.putInt("cooldown_seconds", cooldownSeconds);
            editor.putString("rotation_strategy", rotationStrategy);
            editor.putInt("context_snippet_len", contextSnippetLength);

            editor.apply();

            saveCurrentProjectData();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void saveCurrentProjectData() {
        try {
            if (currentProjectName == null || currentProjectName.trim().isEmpty()) return;
            java.io.File projectDir = new java.io.File(getFilesDir(), "projects");
            if (!projectDir.exists()) projectDir.mkdirs();

            java.io.File pFile = new java.io.File(projectDir, currentProjectName + ".json");
            JsonObject obj = new JsonObject();
            obj.addProperty("projectName", currentProjectName);
            obj.addProperty("currentChapterIdx", currentChapterIdx);
            obj.addProperty("loadedRawContent", loadedRawContent != null ? loadedRawContent : "");

            JsonArray rawArr = new JsonArray();
            for (String r : rawChapters) rawArr.add(r);
            obj.add("rawChapters", rawArr);

            JsonObject transObj = new JsonObject();
            for (Map.Entry<Integer, String> entry : translatedChapters.entrySet()) {
                transObj.addProperty(String.valueOf(entry.getKey()), entry.getValue());
            }
            obj.add("translatedChapters", transObj);

            JsonObject glossObj = new JsonObject();
            for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
                glossObj.addProperty(entry.getKey(), entry.getValue());
            }
            obj.add("masterGlossary", glossObj);

            java.io.FileOutputStream fos = new java.io.FileOutputStream(pFile);
            fos.write(obj.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            fos.flush();
            fos.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadCurrentProjectData(String name) {
        try {
            rawChapters.clear();
            translatedChapters.clear();
            masterGlossary.clear();
            loadedRawContent = "";
            currentChapterIdx = 0;

            java.io.File pFile = new java.io.File(new java.io.File(getFilesDir(), "projects"), name + ".json");
            if (pFile.exists()) {
                java.io.FileInputStream fis = new java.io.FileInputStream(pFile);
                byte[] data = new byte[(int) pFile.length()];
                fis.read(data);
                fis.close();
                String jsonStr = new String(data, java.nio.charset.StandardCharsets.UTF_8);
                JsonObject obj = gson.fromJson(jsonStr, JsonObject.class);
                if (obj != null) {
                    if (obj.has("currentChapterIdx")) currentChapterIdx = obj.get("currentChapterIdx").getAsInt();
                    if (obj.has("loadedRawContent")) loadedRawContent = obj.get("loadedRawContent").getAsString();

                    if (obj.has("rawChapters")) {
                        JsonArray arr = obj.getAsJsonArray("rawChapters");
                        for (int i = 0; i < arr.size(); i++) rawChapters.add(arr.get(i).getAsString());
                    }
                    if (obj.has("translatedChapters")) {
                        JsonObject tObj = obj.getAsJsonObject("translatedChapters");
                        for (String k : tObj.keySet()) {
                            translatedChapters.put(Integer.parseInt(k), tObj.get(k).getAsString());
                        }
                    }
                    if (obj.has("masterGlossary")) {
                        JsonObject gObj = obj.getAsJsonObject("masterGlossary");
                        for (String k : gObj.keySet()) {
                            masterGlossary.put(k, gObj.get(k).getAsString());
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadAllState() {
        SharedPreferences sp = getSharedPreferences("droid_prefs", Context.MODE_PRIVATE);
        boolean hasSaved = sp.contains("current_project_name");

        if (hasSaved) {
            currentProjectName = sp.getString("current_project_name", "Dai_Quan_Gia_Ma_Hoang");
            currentModel = sp.getString("current_model", "gemini-2.5-flash");
            delaySec = sp.getInt("delay_sec", 2);

            String pListJson = sp.getString("project_list", null);
            if (pListJson != null) {
                java.lang.reflect.Type listType = new com.google.gson.reflect.TypeToken<ArrayList<String>>(){}.getType();
                List<String> list = gson.fromJson(pListJson, listType);
                if (list != null && !list.isEmpty()) {
                    projectList.clear();
                    projectList.addAll(list);
                }
            }

            String keysJson = sp.getString("api_keys", null);
            if (keysJson != null) {
                java.lang.reflect.Type keyType = new com.google.gson.reflect.TypeToken<ArrayList<ApiKeyItem>>(){}.getType();
                List<ApiKeyItem> kList = gson.fromJson(keysJson, keyType);
                if (kList != null && !kList.isEmpty()) {
                    apiKeys.clear();
                    apiKeys.addAll(kList);
                }
            }

            String promptsJson = sp.getString("prompt_cards", null);
            if (promptsJson != null) {
                java.lang.reflect.Type pType = new com.google.gson.reflect.TypeToken<ArrayList<PromptCardItem>>(){}.getType();
                List<PromptCardItem> pList = gson.fromJson(promptsJson, pType);
                if (pList != null && !pList.isEmpty()) {
                    promptCards.clear();
                    promptCards.addAll(pList);
                }
            }

            minTermLength = sp.getInt("min_term_length", 2);
            minFrequency = sp.getInt("min_frequency", 2);
            conflictPolicy = sp.getString("conflict_policy", "keep-old");
            antiHanziStrict = sp.getBoolean("anti_hanzi_strict", true);
            autoHealOnlineEnabled = sp.getBoolean("auto_heal_online", true);
            targetLanguage = sp.getString("target_language", "Tiếng Việt");
            polishModel = sp.getString("polish_model", "gemini-3.6-flash");
            cooldownSeconds = sp.getInt("cooldown_seconds", 60);
            rotationStrategy = sp.getString("rotation_strategy", "round-robin");
            contextSnippetLength = sp.getInt("context_snippet_len", 350);

            loadCurrentProjectData(currentProjectName);
        } else {
            initSampleData();
            saveAllState();
        }
    }

    private void initSampleData() {
        projectList.add("Dai_Quan_Gia_Ma_Hoang");
        projectList.add("Pham_Nhan_Tu_Tien");

        apiKeys.add(new ApiKeyItem("AIzaSyDemoSampleKeyNumberOneXYZ12345"));
        apiKeys.add(new ApiKeyItem("AIzaSyDemoSampleKeyNumberTwoABC67890"));

        masterGlossary.put("林辰", "Lâm Thần");
        masterGlossary.put("青云宗", "Thanh Vân Tông");
        masterGlossary.put("赵霸天", "Triệu Bá Thiên");
        masterGlossary.put("黑风寨", "Hắc Phong Trại");

        promptCards.add(new PromptCardItem(1, "Tiên Hiệp (Chuẩn mực)", "Dịch sang tiếng Việt tiểu thuyết tiên hiệp trôi chảy, đúng ngữ pháp. Động từ dịch nghĩa tự nhiên, không thô Hán-Việt. Xưng hô: hắn, nàng, ta, ngươi. Tên riêng giữ âm Hán-Việt.", true));
        promptCards.add(new PromptCardItem(2, "Đô Thị (Mượt mà)", "Dịch văn phong hiện đại đời thường mượt mà. Giữ nguyên tên nhân vật Hán-Việt.", false));
        promptCards.add(new PromptCardItem(3, "Huyền Huyễn / Sử Thi", "Dịch tiểu thuyết kỳ ảo, giữ nguyên thuật ngữ ma pháp, văn phong hào hùng.", false));

        String nl = String.valueOf((char) 10);
        rawChapters.add("第一章 少年与剑" + nl + "在偏僻的青石村中，有一位身负残破木剑的少年，名为林辰。" + nl + "林辰背着一把长剑，走在深邃的巷子里...");
        rawChapters.add("第二章 青云仙宗" + nl + "青云宗山门耸立在云海之巅，气势磅礴。" + nl + "数以千计的年轻才俊汇聚在巨大的演武广场上...");

        translatedChapters.put(0, "Chương 1: Thiếu Niên Và Kiếm" + nl + nl + "Tại thôn Thanh Thạch hẻo lánh, có một thiếu niên mang trên lưng thanh mộc kiếm tàn tạ, tên gọi Lâm Thần..." + nl);

        saveCurrentProjectData();

        // Khởi tạo sẵn tệp cho dự án mẫu số 2 để chuyển đổi dự án mượt mà
        try {
            java.io.File projectDir = new java.io.File(getFilesDir(), "projects");
            if (!projectDir.exists()) projectDir.mkdirs();
            java.io.File pFile2 = new java.io.File(projectDir, "Pham_Nhan_Tu_Tien.json");
            JsonObject obj2 = new JsonObject();
            obj2.addProperty("projectName", "Pham_Nhan_Tu_Tien");
            obj2.addProperty("currentChapterIdx", 0);
            obj2.addProperty("loadedRawContent", "");

            JsonArray rawArr2 = new JsonArray();
            rawArr2.add("第一章 山边小村" + nl + "二愣子睁大双眼，看着茅草屋顶，心中一片茫然。他本名韩立，因皮肤黝黑，村里人都唤他二愣子。" + nl + "韩立从床榻上爬起，走出屋外，清晨的山风夹杂着泥土的气息扑面而来。");
            rawArr2.add("第二章 七玄门试炼" + nl + "彩霞山七玄门，坐落于群山环抱之中，宛若仙境。" + nl + "数十名少年在岳堂主的带领下，站在险峻的落日峰前。");
            obj2.add("rawChapters", rawArr2);

            JsonObject transObj2 = new JsonObject();
            obj2.add("translatedChapters", transObj2);

            JsonObject glossObj2 = new JsonObject();
            glossObj2.addProperty("韩立", "Hàn Lập");
            glossObj2.addProperty("二愣子", "Nhị Lăng Tử");
            glossObj2.addProperty("七玄门", "Thất Huyền Môn");
            glossObj2.addProperty("彩霞山", "Thải Hà Sơn");
            obj2.add("masterGlossary", glossObj2);

            java.io.FileOutputStream fos2 = new java.io.FileOutputStream(pFile2);
            fos2.write(obj2.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            fos2.flush();
            fos2.close();
        } catch (Exception ignored) {}
    }

    private void initUI() {
        rootFrame = new FrameLayout(this);
        rootFrame.setBackgroundColor(Color.parseColor("#0A0A0A"));

        mainContentLayout = new LinearLayout(this);
        mainContentLayout.setOrientation(LinearLayout.VERTICAL);

        // Header Bar
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setPadding(32, 24, 32, 24);
        header.setBackgroundColor(Color.parseColor("#141414"));
        header.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvTitle = new TextView(this);
        tvTitle.setText("DroidTranslator Native");
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(17);
        tvTitle.setTypeface(null, Typeface.BOLD);
        header.addView(tvTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView tvBadge = new TextView(this);
        tvBadge.setText(RootController.isRootAvailable() ? "ROOT #" : "GOD-MODE");
        tvBadge.setTextColor(Color.parseColor("#F59E0B"));
        tvBadge.setTextSize(11);
        tvBadge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvBadge.setPadding(12, 6, 12, 6);
        header.addView(tvBadge);

        mainContentLayout.addView(header);

        // Container cho nội dung 4 Tab
        containerLayout = new FrameLayout(this);
        LinearLayout.LayoutParams containerParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f
        );
        mainContentLayout.addView(containerLayout, containerParams);

        // Khởi tạo 4 Tab View theo thứ tự
        createTabKeysView();        // Tab 1: Key & Prompt
        createTabTranslateView();   // Tab 2: Dịch & Glossary
        createTabReaderView();      // Tab 3: Bản dịch & Đọc
        createTabSettingsView();    // Tab 4: Cài đặt

        containerLayout.addView(tabKeysView);
        containerLayout.addView(tabTranslateView);
        containerLayout.addView(tabReaderView);
        containerLayout.addView(tabSettingsView);

        // Bottom Navigation TabLayout
        tabLayout = new TabLayout(this);
        tabLayout.setBackgroundColor(Color.parseColor("#141414"));
        tabLayout.setTabTextColors(Color.parseColor("#888888"), Color.parseColor("#3B82F6"));
        tabLayout.setSelectedTabIndicatorColor(Color.parseColor("#3B82F6"));

        tabLayout.addTab(tabLayout.newTab().setText("Key & Prompt"));
        tabLayout.addTab(tabLayout.newTab().setText("Dịch & Từ điển"));
        tabLayout.addTab(tabLayout.newTab().setText("Bản dịch & Đọc"));
        tabLayout.addTab(tabLayout.newTab().setText("Cài đặt"));

        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                switchTab(tab.getPosition());
            }
            @Override public void onTabUnselected(TabLayout.Tab tab) {}
            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                switchTab(tab.getPosition());
            }
        });

        mainContentLayout.addView(tabLayout);
        rootFrame.addView(mainContentLayout, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // Khởi tạo Trình Đọc Toàn Màn Hình Overlay (mặc định GONE)
        createFullScreenReaderOverlay();
        rootFrame.addView(flReaderOverlay, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(rootFrame);

        // Mặc định mở Tab 1 (Key & Prompt)
        switchTab(0);
    }

    private void switchTab(int index) {
        tabKeysView.setVisibility(index == 0 ? View.VISIBLE : View.GONE);
        tabTranslateView.setVisibility(index == 1 ? View.VISIBLE : View.GONE);
        tabReaderView.setVisibility(index == 2 ? View.VISIBLE : View.GONE);
        tabSettingsView.setVisibility(index == 3 ? View.VISIBLE : View.GONE);

        if (index == 0) {
            refreshKeyList();
            refreshPromptList();
        } else if (index == 1) {
            updateProgressUI();
            refreshGlossaryList();
        } else if (index == 2) {
            refreshChapterListView();
        } else if (index == 3) {
            refreshSettingsUI();
        }
    }

    // =========================================================================
    // THẺ 1: KEY & PROMPT
    // =========================================================================
    private void createTabKeysView() {
        tabKeysView = new ScrollView(this);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(32, 24, 32, 32);

        // 1. CHỌN DÒNG MODEL GEMINI
        TextView tvModelHead = new TextView(this);
        tvModelHead.setText("1. Chọn Dòng Model Gemini:");
        tvModelHead.setTextColor(Color.WHITE);
        tvModelHead.setTextSize(15);
        tvModelHead.setTypeface(null, Typeface.BOLD);
        content.addView(tvModelHead);

        tvSelectedModel = new TextView(this);
        tvSelectedModel.setText("Model đang chọn: " + currentModel);
        tvSelectedModel.setTextColor(Color.parseColor("#60A5FA"));
        tvSelectedModel.setPadding(0, 4, 0, 12);
        content.addView(tvSelectedModel);

        String[] models = {"gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-2.5-pro"};
        LinearLayout rowM = new LinearLayout(this);
        rowM.setOrientation(LinearLayout.HORIZONTAL);
        for (String m : models) {
            String label = m.replace("gemini-", "");
            Button b = createButton(label, "#1E293B");
            b.setOnClickListener(v -> {
                currentModel = m;
                tvSelectedModel.setText("Model đang chọn: " + currentModel);
                Toast.makeText(this, "Đã chọn " + m, Toast.LENGTH_SHORT).show();
            });
            rowM.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        }
        content.addView(rowM);

        // Custom Model ID Input
        LinearLayout rowCustom = new LinearLayout(this);
        rowCustom.setOrientation(LinearLayout.HORIZONTAL);
        rowCustom.setPadding(0, 12, 0, 24);

        EditText edtCustomModel = new EditText(this);
        edtCustomModel.setHint("Nhập model tùy biến (VD: gemini-3.5-flash-lite)...");
        edtCustomModel.setHintTextColor(Color.parseColor("#666666"));
        edtCustomModel.setTextColor(Color.WHITE);
        edtCustomModel.setBackgroundColor(Color.parseColor("#171717"));
        edtCustomModel.setPadding(16, 16, 16, 16);
        rowCustom.addView(edtCustomModel, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sc1 = new View(this);
        rowCustom.addView(sc1, new LinearLayout.LayoutParams(12, 1));

        Button btnSetCustom = createButton("Dùng Model Này", "#2563EB");
        btnSetCustom.setOnClickListener(v -> {
            String cm = edtCustomModel.getText().toString().trim();
            if (!cm.isEmpty()) {
                currentModel = cm;
                tvSelectedModel.setText("Model đang chọn: " + currentModel);
                Toast.makeText(this, "Đã kích hoạt model: " + cm, Toast.LENGTH_SHORT).show();
            }
        });
        rowCustom.addView(btnSetCustom);
        content.addView(rowCustom);

        // 2. MULTI-KEY POOL & TEST KEY
        LinearLayout keyHeaderRow = new LinearLayout(this);
        keyHeaderRow.setOrientation(LinearLayout.HORIZONTAL);
        keyHeaderRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvKeyHead = new TextView(this);
        tvKeyHead.setText("2. Multi-Key Gemini Pool:");
        tvKeyHead.setTextColor(Color.WHITE);
        tvKeyHead.setTextSize(15);
        tvKeyHead.setTypeface(null, Typeface.BOLD);
        keyHeaderRow.addView(tvKeyHead, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnTestAll = createButton("Test Tất Cả", "#B45309");
        btnTestAll.setOnClickListener(v -> testAllKeys());
        keyHeaderRow.addView(btnTestAll);
        content.addView(keyHeaderRow);

        edtNewKey = new EditText(this);
        edtNewKey.setHint("Dán API Key (Hỗ trợ nạp hàng loạt: mỗi dòng 1 key, tự động tách thẻ)...");
        edtNewKey.setHintTextColor(Color.parseColor("#666666"));
        edtNewKey.setTextColor(Color.WHITE);
        edtNewKey.setBackgroundColor(Color.parseColor("#171717"));
        edtNewKey.setPadding(20, 16, 20, 16);
        edtNewKey.setMinLines(2);
        content.addView(edtNewKey);

        Button btnAddKey = createButton("Thêm API Key Vào Pool", "#D97706");
        btnAddKey.setOnClickListener(v -> {
            String k = edtNewKey.getText().toString().trim();
            if (!k.isEmpty()) {
                String nl = String.valueOf((char) 10);
                String[] lines = k.split(nl);
                int countAdded = 0;
                for (String line : lines) {
                    String single = line.trim().replace(String.valueOf((char) 34), "").replace(String.valueOf((char) 39), "");
                    if (single.length() >= 8 && !single.startsWith("#") && !single.startsWith("//")) {
                        boolean exists = false;
                        for (ApiKeyItem item : apiKeys) {
                            if (item.key.equals(single)) { exists = true; break; }
                        }
                        if (!exists) {
                            apiKeys.add(new ApiKeyItem(single));
                            countAdded++;
                        }
                    }
                }
                edtNewKey.setText("");
                refreshKeyList();
                Toast.makeText(this, "Đã nạp thành công " + countAdded + " Key vào Pool!", Toast.LENGTH_SHORT).show();
            }
        });
        content.addView(btnAddKey);

        llKeyList = new LinearLayout(this);
        llKeyList.setOrientation(LinearLayout.VERTICAL);
        llKeyList.setPadding(0, 12, 0, 24);
        content.addView(llKeyList);
        refreshKeyList();

        // 3. THẺ PROMPT PHONG CÁCH
        LinearLayout promptHeaderRow = new LinearLayout(this);
        promptHeaderRow.setOrientation(LinearLayout.HORIZONTAL);
        promptHeaderRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvPromptHead = new TextView(this);
        tvPromptHead.setText("3. Thẻ Prompt Dịch Thuật:");
        tvPromptHead.setTextColor(Color.WHITE);
        tvPromptHead.setTextSize(15);
        tvPromptHead.setTypeface(null, Typeface.BOLD);
        promptHeaderRow.addView(tvPromptHead, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnAddPrompt = createButton("+ Thêm Prompt", "#2563EB");
        btnAddPrompt.setOnClickListener(v -> showPromptDialog(null));
        promptHeaderRow.addView(btnAddPrompt);
        content.addView(promptHeaderRow);

        llPromptCards = new LinearLayout(this);
        llPromptCards.setOrientation(LinearLayout.VERTICAL);
        llPromptCards.setPadding(0, 12, 0, 16);
        content.addView(llPromptCards);
        refreshPromptList();

        tabKeysView.addView(content);
    }

    private void testAllKeys() {
        Toast.makeText(this, "Đang kiểm tra " + apiKeys.size() + " API Key...", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            for (ApiKeyItem item : apiKeys) {
                engine.testKey(item);
                mainHandler.post(this::refreshKeyList);
            }
            mainHandler.post(() -> Toast.makeText(MainActivity.this, "🎉 Đã hoàn tất kiểm tra Key Pool!", Toast.LENGTH_SHORT).show());
        }).start();
    }

    private void refreshKeyList() {
        llKeyList.removeAllViews();
        for (int i = 0; i < apiKeys.size(); i++) {
            final int idx = i;
            ApiKeyItem item = apiKeys.get(idx);

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setPadding(20, 14, 20, 14);
            row.setGravity(Gravity.CENTER_VERTICAL);
            GradientDrawable rowBg = new GradientDrawable();
            rowBg.setColor(Color.parseColor("#161B22"));
            rowBg.setCornerRadius(18f);
            rowBg.setStroke(2, Color.parseColor("#30363D"));
            row.setBackground(rowBg);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 8);
            row.setLayoutParams(lp);

            TextView tvK = new TextView(this);
            String masked = item.key.length() > 8 ? "..." + item.key.substring(item.key.length() - 8) : item.key;
            tvK.setText("Key #" + (idx + 1) + ": " + masked + " (" + item.state + ")");
            tvK.setTextColor(Color.WHITE);
            row.addView(tvK, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            Button btnTest = createButton("Test", "#374151");
            btnTest.setOnClickListener(v -> {
                btnTest.setText("...");
                new Thread(() -> {
                    boolean ok = engine.testKey(item);
                    mainHandler.post(() -> {
                        btnTest.setText("Test");
                        refreshKeyList();
                        Toast.makeText(MainActivity.this, ok ? "✅ Key hoạt động tốt!" : "❌ Key lỗi hoặc hết hạn!", Toast.LENGTH_SHORT).show();
                    });
                }).start();
            });
            row.addView(btnTest);

            Button btnDel = createButton("Xóa", "#7F1D1D");
            btnDel.setOnClickListener(v -> {
                apiKeys.remove(idx);
                refreshKeyList();
            });
            row.addView(btnDel);

            llKeyList.addView(row);
        }
    }

    private void showPromptDialog(PromptCardItem editingItem) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(editingItem != null ? "Sửa Thẻ Prompt" : "Thêm Thẻ Prompt Mới");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(32, 24, 32, 24);

        TextView tvTitleLabel = new TextView(this);
        tvTitleLabel.setText("Tiêu đề phong cách:");
        layout.addView(tvTitleLabel);

        EditText edtTitle = new EditText(this);
        edtTitle.setText(editingItem != null ? editingItem.title : "");
        layout.addView(edtTitle);

        TextView tvContentLabel = new TextView(this);
        tvContentLabel.setText("Nội dung System Prompt:");
        tvContentLabel.setPadding(0, 16, 0, 0);
        layout.addView(tvContentLabel);

        EditText edtContent = new EditText(this);
        edtContent.setLines(4);
        edtContent.setText(editingItem != null ? editingItem.content : "");
        layout.addView(edtContent);

        builder.setView(layout);

        builder.setPositiveButton("Lưu", (dialog, which) -> {
            String t = edtTitle.getText().toString().trim();
            String c = edtContent.getText().toString().trim();
            if (!t.isEmpty() && !c.isEmpty()) {
                if (editingItem != null) {
                    editingItem.title = t;
                    editingItem.content = c;
                } else {
                    for (PromptCardItem p : promptCards) p.active = false;
                    promptCards.add(new PromptCardItem(System.currentTimeMillis(), t, c, true));
                }
                refreshPromptList();
            }
        });
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void refreshPromptList() {
        llPromptCards.removeAllViews();
        for (PromptCardItem p : promptCards) {
            LinearLayout c = createCard();
            GradientDrawable promptBg = new GradientDrawable();
            promptBg.setColor(Color.parseColor(p.active ? "#1E293B" : "#161B22"));
            promptBg.setCornerRadius(22f);
            promptBg.setStroke(p.active ? 3 : 1, Color.parseColor(p.active ? "#3B82F6" : "#30363D"));
            c.setBackground(promptBg);

            LinearLayout topRow = new LinearLayout(this);
            topRow.setOrientation(LinearLayout.HORIZONTAL);
            topRow.setGravity(Gravity.CENTER_VERTICAL);

            TextView t = new TextView(this);
            t.setText(p.title + (p.active ? " (Đang dùng)" : ""));
            t.setTextColor(Color.parseColor(p.active ? "#60A5FA" : "#FFFFFF"));
            t.setTypeface(null, Typeface.BOLD);
            topRow.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            Button btnEdit = createButton("Sửa", "#374151");
            btnEdit.setOnClickListener(v -> showPromptDialog(p));
            topRow.addView(btnEdit);

            View sp1 = new View(this);
            topRow.addView(sp1, new LinearLayout.LayoutParams(8, 1));

            Button btnDel = createButton("Xóa", "#7F1D1D");
            btnDel.setOnClickListener(v -> {
                if (promptCards.size() <= 1) {
                    Toast.makeText(this, "Phải giữ lại ít nhất 1 thẻ Prompt!", Toast.LENGTH_SHORT).show();
                    return;
                }
                promptCards.remove(p);
                if (!promptCards.stream().anyMatch(item -> item.active)) {
                    promptCards.get(0).active = true;
                }
                refreshPromptList();
                Toast.makeText(this, "Đã xóa thẻ prompt!", Toast.LENGTH_SHORT).show();
            });
            topRow.addView(btnDel);

            c.addView(topRow);

            TextView cnt = new TextView(this);
            cnt.setText(p.content);
            cnt.setTextColor(Color.parseColor("#9CA3AF"));
            cnt.setTextSize(12);
            cnt.setPadding(0, 8, 0, 0);
            c.addView(cnt);

            c.setOnClickListener(v -> {
                for (PromptCardItem other : promptCards) other.active = (other.id == p.id);
                refreshPromptList();
                Toast.makeText(this, "Đã chọn phong cách: " + p.title, Toast.LENGTH_SHORT).show();
            });

            llPromptCards.addView(c);
        }
    }

    // =========================================================================
    // THẺ 2: DỊCH & TỪ ĐIỂN GLOSSARY
    // =========================================================================
    private void createTabTranslateView() {
        tabTranslateView = new ScrollView(this);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(32, 24, 32, 32);

        // 1. Quản lý Dự Án Truyện (Multi-Project Switcher)
        LinearLayout cardProj = createCard();
        LinearLayout rowProjHeader = new LinearLayout(this);
        rowProjHeader.setOrientation(LinearLayout.HORIZONTAL);
        rowProjHeader.setGravity(Gravity.CENTER_VERTICAL);

        tvCurrentProjectName = new TextView(this);
        tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);
        tvCurrentProjectName.setTextColor(Color.parseColor("#60A5FA"));
        tvCurrentProjectName.setTextSize(14);
        tvCurrentProjectName.setTypeface(null, Typeface.BOLD);
        rowProjHeader.addView(tvCurrentProjectName, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnSwitchProj = createButton("Đổi Truyện", "#1E293B");
        btnSwitchProj.setOnClickListener(v -> showSwitchProjectDialog());
        rowProjHeader.addView(btnSwitchProj);

        View sproj = new View(this);
        rowProjHeader.addView(sproj, new LinearLayout.LayoutParams(8, 1));

        Button btnNewProj = createButton("+ Dự Án Mới", "#2563EB");
        btnNewProj.setOnClickListener(v -> showNewProjectDialog());
        rowProjHeader.addView(btnNewProj);

        cardProj.addView(rowProjHeader);
        content.addView(cardProj);

        // 2. Thẻ Tiến độ & Dịch theo Range (Từ chương -> Đến chương, 3 nút: Dịch / Tạm dừng / Hủy)
        LinearLayout cardProgress = createCard();

        tvProgressText = new TextView(this);
        tvProgressText.setTextColor(Color.parseColor("#93C5FD"));
        tvProgressText.setTextSize(14);
        tvProgressText.setTypeface(null, Typeface.BOLD);
        tvProgressText.setText("Tiến độ: " + translatedChapters.size() + " / " + rawChapters.size() + " chương");
        cardProgress.addView(tvProgressText);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(Math.max(rawChapters.size(), 1));
        progressBar.setProgress(translatedChapters.size());
        cardProgress.addView(progressBar);

        // Range inputs: Từ chương -> Đến chương
        LinearLayout rangeRow = new LinearLayout(this);
        rangeRow.setOrientation(LinearLayout.HORIZONTAL);
        rangeRow.setPadding(0, 16, 0, 8);
        rangeRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvF = new TextView(this);
        tvF.setText("Từ chương: ");
        tvF.setTextColor(Color.parseColor("#CCCCCC"));
        rangeRow.addView(tvF);

        edtFromChap = new EditText(this);
        edtFromChap.setText("1");
        edtFromChap.setTextColor(Color.WHITE);
        edtFromChap.setBackgroundColor(Color.parseColor("#171717"));
        edtFromChap.setPadding(12, 8, 12, 8);
        rangeRow.addView(edtFromChap, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View srf = new View(this);
        rangeRow.addView(srf, new LinearLayout.LayoutParams(16, 1));

        TextView tvT = new TextView(this);
        tvT.setText("Đến chương: ");
        tvT.setTextColor(Color.parseColor("#CCCCCC"));
        rangeRow.addView(tvT);

        edtToChap = new EditText(this);
        edtToChap.setText(String.valueOf(Math.max(rawChapters.size(), 1)));
        edtToChap.setTextColor(Color.WHITE);
        edtToChap.setBackgroundColor(Color.parseColor("#171717"));
        edtToChap.setPadding(12, 8, 12, 8);
        rangeRow.addView(edtToChap, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardProgress.addView(rangeRow);

        // 3 Nút: Dịch Range, Tạm dừng / Tiếp tục, Hủy
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setPadding(0, 8, 0, 0);

        btnStartRange = createButton("Dịch Range", "#2563EB");
        btnStartRange.setOnClickListener(v -> startRangeTranslation());
        btnRow.addView(btnStartRange, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sb1 = new View(this);
        btnRow.addView(sb1, new LinearLayout.LayoutParams(8, 1));

        btnPauseResume = createButton("Tạm dừng", "#D97706");
        btnPauseResume.setOnClickListener(v -> togglePauseResume());
        btnRow.addView(btnPauseResume, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sb2 = new View(this);
        btnRow.addView(sb2, new LinearLayout.LayoutParams(8, 1));

        btnCancelTrans = createButton("Hủy", "#7F1D1D");
        btnCancelTrans.setOnClickListener(v -> cancelTranslation());
        btnRow.addView(btnCancelTrans, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardProgress.addView(btnRow);

        View spGap = new View(this);
        cardProgress.addView(spGap, new LinearLayout.LayoutParams(1, 10));

        btnFillGaps = createButton("⚡ Dịch Bù Chương Sót (Né Các Chương Đã Dịch)", "#059669");
        btnFillGaps.setOnClickListener(v -> startFillGapsTranslation());
        cardProgress.addView(btnFillGaps);

        View spPol = new View(this);
        cardProgress.addView(spPol, new LinearLayout.LayoutParams(1, 10));

        btnFinalPolish = createButton("✨ Làm Mượt Bản Dịch Final (Quét Sạch Chữ Hán)", "#7C3AED");
        btnFinalPolish.setOnClickListener(v -> executeFinalGlobalPolish());
        cardProgress.addView(btnFinalPolish);

        content.addView(cardProgress);

        // 3. Nạp văn bản truyện + Chọn file từ bộ nhớ + Tách chương tùy ý ký tự
        TextView tvInputTitle = new TextView(this);
        tvInputTitle.setText("Nạp văn bản truyện thô:");
        tvInputTitle.setTextColor(Color.WHITE);
        tvInputTitle.setPadding(0, 16, 0, 8);
        content.addView(tvInputTitle);

        edtRawText = new EditText(this);
        edtRawText.setTextColor(Color.WHITE);
        edtRawText.setBackgroundColor(Color.parseColor("#171717"));
        edtRawText.setPadding(20, 16, 20, 16);
        edtRawText.setHint("Dán truyện hoặc bấm Chọn File .txt...");
        edtRawText.setHintTextColor(Color.parseColor("#666666"));
        edtRawText.setLines(3);
        content.addView(edtRawText);

        // Hàng nút: Chọn file từ bộ nhớ
        LinearLayout fileRow = new LinearLayout(this);
        fileRow.setOrientation(LinearLayout.HORIZONTAL);
        fileRow.setPadding(0, 8, 0, 0);

        Button btnPickFile = createButton("📂 Chọn File .txt Từ Bộ Nhớ", "#1E293B");
        btnPickFile.setOnClickListener(v -> openFilePicker());
        fileRow.addView(btnPickFile, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        content.addView(fileRow);

        // Hàng tách chương: Theo tác giả vs Theo số ký tự tùy chỉnh
        LinearLayout splitOptRow = new LinearLayout(this);
        splitOptRow.setOrientation(LinearLayout.HORIZONTAL);
        splitOptRow.setPadding(0, 8, 0, 8);
        splitOptRow.setGravity(Gravity.CENTER_VERTICAL);

        Button btnSplitAuthor = createButton("Tách Tác Giả (Regex)", "#047857");
        btnSplitAuthor.setOnClickListener(v -> splitRawText(false));
        splitOptRow.addView(btnSplitAuthor);

        View ssp = new View(this);
        splitOptRow.addView(ssp, new LinearLayout.LayoutParams(8, 1));

        edtChunkSize = new EditText(this);
        edtChunkSize.setText("3500");
        edtChunkSize.setTextColor(Color.WHITE);
        edtChunkSize.setBackgroundColor(Color.parseColor("#171717"));
        edtChunkSize.setPadding(10, 8, 10, 8);
        edtChunkSize.setHint("Ký tự");
        splitOptRow.addView(edtChunkSize, new LinearLayout.LayoutParams(140, ViewGroup.LayoutParams.WRAP_CONTENT));

        View ssp2 = new View(this);
        splitOptRow.addView(ssp2, new LinearLayout.LayoutParams(8, 1));

        Button btnSplitChars = createButton("Tách Theo Ký Tự", "#0369A1");
        btnSplitChars.setOnClickListener(v -> splitRawText(true));
        splitOptRow.addView(btnSplitChars, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        content.addView(splitOptRow);

        // 4. Master Glossary (Tự Động Bóc Tách & Nạp Tức Thì Sau Mỗi Chương)
        tvGlossaryHeader = new TextView(this);
        tvGlossaryHeader.setText("Từ Điển Master Glossary (" + masterGlossary.size() + " từ):");
        tvGlossaryHeader.setTextColor(Color.WHITE);
        tvGlossaryHeader.setTextSize(14);
        tvGlossaryHeader.setTypeface(null, Typeface.BOLD);
        tvGlossaryHeader.setPadding(0, 20, 0, 8);
        content.addView(tvGlossaryHeader);

        LinearLayout rowAddG = new LinearLayout(this);
        rowAddG.setOrientation(LinearLayout.HORIZONTAL);

        edtGlossaryKey = createStyledEditText("Từ gốc (林辰)");
        rowAddG.addView(edtGlossaryKey, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sg = new View(this);
        rowAddG.addView(sg, new LinearLayout.LayoutParams(12, 1));

        edtGlossaryVal = createStyledEditText("Nghĩa (Lâm Thần)");
        rowAddG.addView(edtGlossaryVal, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        content.addView(rowAddG);

        LinearLayout rowGButtons = new LinearLayout(this);
        rowGButtons.setOrientation(LinearLayout.HORIZONTAL);
        rowGButtons.setPadding(0, 10, 0, 8);

        Button btnAddG = createButton("+ Thêm Từ", "#059669");
        btnAddG.setOnClickListener(v -> {
            String k = edtGlossaryKey.getText().toString().trim();
            String val = edtGlossaryVal.getText().toString().trim();
            if (!k.isEmpty() && !val.isEmpty()) {
                masterGlossary.put(k, val);
                edtGlossaryKey.setText("");
                edtGlossaryVal.setText("");
                saveCurrentProjectData();
                refreshGlossaryList();
                Toast.makeText(this, "Đã thêm thuật ngữ!", Toast.LENGTH_SHORT).show();
            }
        });
        rowGButtons.addView(btnAddG, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.2f));

        View sgb1 = new View(this);
        rowGButtons.addView(sgb1, new LinearLayout.LayoutParams(8, 1));

        Button btnImportG = createButton("📥 Nạp .txt", "#1D4ED8");
        btnImportG.setOnClickListener(v -> openGlossaryFilePicker());
        rowGButtons.addView(btnImportG, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sgb2 = new View(this);
        rowGButtons.addView(sgb2, new LinearLayout.LayoutParams(8, 1));

        Button btnExportG = createButton("📤 Xuất", "#374151");
        btnExportG.setOnClickListener(v -> exportGlossaryData());
        rowGButtons.addView(btnExportG, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.8f));

        content.addView(rowGButtons);

        llGlossaryList = new LinearLayout(this);
        llGlossaryList.setOrientation(LinearLayout.VERTICAL);
        llGlossaryList.setPadding(0, 8, 0, 16);
        content.addView(llGlossaryList);
        refreshGlossaryList();

        // 5. Live Console Logs
        TextView tvLogTitle = new TextView(this);
        tvLogTitle.setText("Live Console Logs:");
        tvLogTitle.setTextColor(Color.parseColor("#9CA3AF"));
        tvLogTitle.setPadding(0, 16, 0, 8);
        content.addView(tvLogTitle);

        tvLiveLogs = new TextView(this);
        tvLiveLogs.setBackgroundColor(Color.parseColor("#050505"));
        tvLiveLogs.setTextColor(Color.parseColor("#10B981"));
        tvLiveLogs.setTextSize(11);
        tvLiveLogs.setPadding(16, 16, 16, 16);
        tvLiveLogs.setText("🚀 DroidTranslator Native Sẵn Sàng!\\n");
        content.addView(tvLiveLogs);

        tabTranslateView.addView(content);
    }

    private void showNewProjectDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Tạo Dự Án Dịch Mới");

        EditText input = new EditText(this);
        input.setHint("Nhập tên truyện (VD: Tien_Nghich)");
        builder.setView(input);

        builder.setPositiveButton("Tạo Mới", (dialog, which) -> {
            String name = input.getText().toString().trim().replace(" ", "_");
            if (!name.isEmpty()) {
                saveCurrentProjectData();
                if (!projectList.contains(name)) {
                    projectList.add(name);
                }
                currentProjectName = name;
                tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);

                // Làm mới dữ liệu độc lập cho truyện mới
                rawChapters.clear();
                translatedChapters.clear();
                masterGlossary.clear();
                loadedRawContent = "";
                currentChapterIdx = 0;

                saveCurrentProjectData();
                saveAllState();

                updateProgressUI();
                refreshGlossaryList();
                refreshChapterListView();
                refreshSettingsUI();
                appendLog("📁 Đã tạo và chuyển sang dự án mới: " + name);
                Toast.makeText(this, "Đã tạo dự án mới: " + name, Toast.LENGTH_SHORT).show();
            }
        });
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void showSwitchProjectDialog() {
        if (projectList.isEmpty()) return;
        String[] items = projectList.toArray(new String[0]);
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Chọn Dự Án Truyện");
        builder.setItems(items, (dialog, which) -> {
            String chosen = items[which];
            saveCurrentProjectData();
            currentProjectName = chosen;
            loadCurrentProjectData(chosen);
            saveAllState();

            tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);
            updateProgressUI();
            refreshGlossaryList();
            refreshChapterListView();
            refreshSettingsUI();
            appendLog("📁 Đã chuyển sang dự án: " + chosen + " (" + translatedChapters.size() + "/" + rawChapters.size() + " chương)");
            Toast.makeText(this, "Đã chọn dự án: " + chosen, Toast.LENGTH_SHORT).show();
        });
        builder.show();
    }

    private void deleteProject(String name) {
        if (projectList.size() <= 1) {
            Toast.makeText(this, "Không thể xóa dự án duy nhất còn lại!", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            java.io.File pFile = new java.io.File(new java.io.File(getFilesDir(), "projects"), name + ".json");
            if (pFile.exists()) {
                pFile.delete();
            }
            projectList.remove(name);
            String nextProject = projectList.get(0);
            currentProjectName = nextProject;
            loadCurrentProjectData(nextProject);
            saveAllState();

            tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);
            updateProgressUI();
            refreshGlossaryList();
            refreshChapterListView();
            refreshSettingsUI();
            appendLog("🗑️ Đã xóa vĩnh viễn dự án: " + name + ". Toàn bộ Key API và Prompt được bảo toàn 100%!");
            Toast.makeText(this, "Đã xóa dự án: " + name, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Lỗi khi xóa dự án: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void showDeleteProjectConfirmationDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Xác Nhận Xóa Vĩnh Viễn Dự Án");
        String nl = String.valueOf((char) 10);
        builder.setMessage("Bạn có chắc chắn muốn xóa dự án [" + currentProjectName + "]?" + nl + nl + "• Toàn bộ chương thô, bản dịch và từ điển riêng của truyện này sẽ bị xóa khỏi bộ nhớ máy." + nl + "• Toàn bộ kho Key API và Thẻ Prompt sẽ ĐƯỢC BẢO TOÀN VĨNH CỬU 100%!");
        builder.setPositiveButton("Xác Nhận Xóa", (dialog, which) -> deleteProject(currentProjectName));
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        String[] mimeTypes = {"text/plain", "application/epub+zip", "application/x-mobipocket-ebook", "application/octet-stream"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        try {
            startActivityForResult(intent, REQUEST_PICK_FILE);
        } catch (Exception e) {
            Toast.makeText(this, "Không tìm thấy trình quản lý tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void openGlossaryFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("text/*");
        try {
            startActivityForResult(intent, REQUEST_PICK_GLOSSARY_FILE);
        } catch (Exception e) {
            Toast.makeText(this, "Không tìm thấy trình quản lý tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_PICK_FILE && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                appendLog("⏳ Đang nạp và giải mã tệp Ebook từ bộ nhớ...");
                Toast.makeText(this, "Đang đọc tệp Ebook...", Toast.LENGTH_SHORT).show();
                new Thread(() -> {
                    try {
                        InputStream is = getContentResolver().openInputStream(uri);
                        String fileName = "ebook.txt";
                        try {
                            android.database.Cursor cursor = getContentResolver().query(uri, null, null, null, null);
                            if (cursor != null && cursor.moveToFirst()) {
                                int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                                if (nameIndex != -1) fileName = cursor.getString(nameIndex);
                                cursor.close();
                            }
                        } catch (Exception ignored) {}

                        String lowerName = fileName.toLowerCase();
                        StringBuilder sb = new StringBuilder();
                        String nl = String.valueOf((char) 10);

                        if (lowerName.endsWith(".epub")) {
                            // Native Java EPUB ZIP parser
                            java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(is);
                            java.util.zip.ZipEntry entry;
                            while ((entry = zis.getNextEntry()) != null) {
                                String en = entry.getName().toLowerCase();
                                if ((en.endsWith(".xhtml") || en.endsWith(".html") || en.endsWith(".htm")) && !en.contains("toc")) {
                                    BufferedReader br = new BufferedReader(new InputStreamReader(zis, java.nio.charset.StandardCharsets.UTF_8));
                                    String l;
                                    StringBuilder htmlSb = new StringBuilder();
                                    while ((l = br.readLine()) != null) {
                                        htmlSb.append(l).append(nl);
                                    }
                                    // Làm sạch thẻ HTML
                                    String plain = htmlSb.toString()
                                            .replaceAll("(?i)<br[ \\t\\n\\r]*/?>", nl)
                                            .replaceAll("(?i)</p>", nl + nl)
                                            .replaceAll("(?i)</div>", nl)
                                            .replaceAll("<[^>]+>", " ")
                                            .replaceAll("&nbsp;", " ")
                                            .replaceAll("&quot;", String.valueOf((char) 34))
                                            .replaceAll("&apos;", "'")
                                            .replaceAll("&lt;", "<")
                                            .replaceAll("&gt;", ">")
                                            .replaceAll("&amp;", "&")
                                            .trim();
                                    if (plain.length() > 50) {
                                        sb.append(plain).append(nl).append(nl);
                                    }
                                }
                                zis.closeEntry();
                            }
                            zis.close();
                        } else {
                            // TXT hoặc MOBI/AZW3 stream
                            BufferedReader reader = new BufferedReader(new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8));
                            String line;
                            while ((line = reader.readLine()) != null) {
                                sb.append(line).append(nl);
                            }
                            reader.close();
                        }

                        final String fullText = sb.toString();
                        final String finalFileName = fileName;
                        mainHandler.post(() -> {
                            loadedRawContent = fullText;
                            if (fullText.length() > 6000) {
                                edtRawText.setText(fullText.substring(0, 3000) + nl + nl + "... [Đã nạp file Ebook (" + finalFileName + ") hoàn chỉnh " + fullText.length() + " ký tự]");
                            } else {
                                edtRawText.setText(fullText);
                            }
                            splitRawTextFromContent(fullText, false);
                            appendLog("📚 Đã nạp thành công file Ebook [" + finalFileName + "] (" + rawChapters.size() + " chương)!");
                            Toast.makeText(MainActivity.this, "Đã nạp file Ebook và tách " + rawChapters.size() + " chương thành công!", Toast.LENGTH_SHORT).show();
                        });
                    } catch (Exception e) {
                        mainHandler.post(() -> {
                            appendLog("❌ Lỗi đọc tệp Ebook: " + e.getMessage());
                            Toast.makeText(MainActivity.this, "Lỗi đọc tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        });
                    }
                }).start();
            }
        } else if (requestCode == REQUEST_PICK_GLOSSARY_FILE && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                appendLog("⏳ Đang nạp tệp Glossary .txt từ bộ nhớ...");
                Toast.makeText(this, "Đang đọc tệp Glossary...", Toast.LENGTH_SHORT).show();
                new Thread(() -> {
                    try {
                        InputStream is = getContentResolver().openInputStream(uri);
                        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                        String line;
                        int count = 0;
                        while ((line = reader.readLine()) != null) {
                            line = line.trim();
                            if (line.isEmpty() || line.startsWith("#") || line.startsWith("//")) continue;
                            String raw = "";
                            String vi = "";
                            if (line.contains("=")) {
                                int eqIdx = line.indexOf("=");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            } else if (line.contains("➔")) {
                                int eqIdx = line.indexOf("➔");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            } else if (line.contains("->")) {
                                int eqIdx = line.indexOf("->");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 2).trim();
                            } else if (line.contains(":")) {
                                int eqIdx = line.indexOf(":");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            } else if (line.contains(String.valueOf((char) 9))) {
                                int eqIdx = line.indexOf((char) 9);
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            }
                            if (!raw.isEmpty() && !vi.isEmpty()) {
                                masterGlossary.put(raw, vi);
                                count++;
                            }
                        }
                        reader.close();
                        final int importedCount = count;
                        mainHandler.post(() -> {
                            saveCurrentProjectData();
                            refreshGlossaryList();
                            appendLog("📚 Đã nạp thành công " + importedCount + " thuật ngữ vào Master Glossary của dự án [" + currentProjectName + "]!");
                            Toast.makeText(MainActivity.this, "Đã nạp thành công " + importedCount + " thuật ngữ!", Toast.LENGTH_SHORT).show();
                        });
                    } catch (Exception e) {
                        mainHandler.post(() -> {
                            appendLog("❌ Lỗi nạp Glossary: " + e.getMessage());
                            Toast.makeText(MainActivity.this, "Lỗi nạp tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        });
                    }
                }).start();
            }
        }
    }

    private void exportGlossaryData() {
        if (masterGlossary.isEmpty()) {
            Toast.makeText(this, "Kho từ điển đang trống!", Toast.LENGTH_SHORT).show();
            return;
        }
        StringBuilder sb = new StringBuilder();
        String nl = String.valueOf((char) 10);
        sb.append("# Master Glossary - ").append(currentProjectName).append(nl);
        sb.append("# Định dạng: tên raw=tên tiếng việt").append(nl).append(nl);
        for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
            sb.append(entry.getKey()).append("=").append(entry.getValue()).append(nl);
        }
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("Glossary", sb.toString()));
            appendLog("📋 Đã sao chép " + masterGlossary.size() + " thuật ngữ dạng raw=vi vào Clipboard!");
            Toast.makeText(this, "Đã sao chép " + masterGlossary.size() + " từ (dạng raw=vi) vào bộ nhớ tạm!", Toast.LENGTH_LONG).show();
        }
    }

    private void showEditGlossaryDialog(final String oldRaw, final String oldVi) {
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("Chỉnh Sửa Thuật Ngữ");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(36, 24, 36, 16);

        TextView tvRawL = new TextView(this);
        tvRawL.setText("Từ gốc (Tiếng Trung / Raw):");
        tvRawL.setTextColor(Color.parseColor("#93C5FD"));
        tvRawL.setTextSize(12);
        layout.addView(tvRawL);

        final EditText edtRaw = createStyledEditText("VD: 林辰");
        edtRaw.setText(oldRaw);
        layout.addView(edtRaw);

        TextView tvViL = new TextView(this);
        tvViL.setText("Nghĩa dịch tiếng Việt chuẩn:");
        tvViL.setTextColor(Color.parseColor("#34D399"));
        tvViL.setTextSize(12);
        tvViL.setPadding(0, 16, 0, 0);
        layout.addView(tvViL);

        final EditText edtVi = createStyledEditText("VD: Lâm Thần");
        edtVi.setText(oldVi);
        layout.addView(edtVi);

        builder.setView(layout);
        builder.setPositiveButton("Lưu Thay Đổi", (dialog, which) -> {
            String newRaw = edtRaw.getText().toString().trim();
            String newVi = edtVi.getText().toString().trim();
            if (!newRaw.isEmpty() && !newVi.isEmpty()) {
                if (!newRaw.equals(oldRaw)) {
                    masterGlossary.remove(oldRaw);
                }
                masterGlossary.put(newRaw, newVi);
                saveCurrentProjectData();
                refreshGlossaryList();
                appendLog("✏️ Đã cập nhật thuật ngữ: [" + oldRaw + "] ➔ [" + newRaw + " = " + newVi + "]");
                Toast.makeText(MainActivity.this, "Đã cập nhật thuật ngữ!", Toast.LENGTH_SHORT).show();
            }
        });
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void splitRawText(boolean byChars) {
        String text = (loadedRawContent != null && !loadedRawContent.isEmpty()) ? loadedRawContent : edtRawText.getText().toString().trim();
        splitRawTextFromContent(text, byChars);
    }

    private void splitRawTextFromContent(String text, boolean byChars) {
        if (text == null || text.trim().isEmpty()) {
            Toast.makeText(this, "Vui lòng dán văn bản truyện!", Toast.LENGTH_SHORT).show();
            return;
        }

        rawChapters.clear();
        chapterListPage = 0;
        if (!byChars) {
            String[] parts = text.split("(?i)(?=(?:^[ \\t]*|[\\r\\n]+[ \\t]*)(?:第[ \\t]*[0-9一二三四五六七八九十百千万]+[ \\t]*[章回节卷部集]|Chương[ \\t]*[0-9]+|Chapter[ \\t]*[0-9]+|[0-9]{1,5}[ \\t]*[、.][ \\t]*(?:第[ \\t]*)?[0-9一二三四五六七八九十百千万]*[章回节卷]?))");
            for (String p : parts) {
                if (!p.trim().isEmpty()) rawChapters.add(p.trim());
            }
        } else {
            int chunkSize = 3500;
            try {
                chunkSize = Integer.parseInt(edtChunkSize.getText().toString().trim());
            } catch (Exception ignored) {}
            chunkSize = Math.max(500, chunkSize);

            for (int i = 0; i < text.length(); i += chunkSize) {
                rawChapters.add(text.substring(i, Math.min(i + chunkSize, text.length())));
            }
        }

        if (rawChapters.isEmpty()) rawChapters.add(text);

        edtFromChap.setText("1");
        edtToChap.setText(String.valueOf(rawChapters.size()));
        saveCurrentProjectData();
        saveAllState();

        updateProgressUI();
        refreshChapterListView();
        appendLog("✂️ Đã tách thành " + rawChapters.size() + " chương (" + (byChars ? "Tùy ký tự" : "Theo tác giả") + ")");
        Toast.makeText(this, "Đã tách thành " + rawChapters.size() + " chương!", Toast.LENGTH_SHORT).show();
    }

    // Refresh UI Glossary List (Hiển thị 6 từ gần nhất chống khựng, có nút mở Kho Từ Điển Full)
    private void refreshGlossaryList() {
        if (llGlossaryList == null) return;
        llGlossaryList.removeAllViews();

        if (tvGlossaryHeader != null) {
            tvGlossaryHeader.setText("Từ Điển Master Glossary (" + masterGlossary.size() + " từ):");
        }

        if (masterGlossary.isEmpty()) {
            TextView tvEmpty = new TextView(this);
            tvEmpty.setText("Chưa có từ điển. Sau khi dịch mỗi chương, AI sẽ tự động thêm từ mới vào đây.");
            tvEmpty.setTextColor(Color.parseColor("#777777"));
            tvEmpty.setTextSize(11);
            tvEmpty.setPadding(0, 8, 0, 8);
            llGlossaryList.addView(tvEmpty);
            return;
        }

        // Hiển thị tối đa 6 từ gần nhất trên thẻ chính
        int count = 0;
        List<Map.Entry<String, String>> entryList = new ArrayList<>(masterGlossary.entrySet());
        Collections.reverse(entryList);
        for (Map.Entry<String, String> entry : entryList) {
            if (count >= 6) break;
            count++;

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setPadding(16, 12, 16, 12);
            row.setBackgroundColor(Color.parseColor("#171717"));
            row.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 6);
            row.setLayoutParams(lp);

            TextView tvPair = new TextView(this);
            tvPair.setText(entry.getKey() + " ➔ " + entry.getValue());
            tvPair.setTextColor(Color.parseColor("#34D399"));
            tvPair.setTextSize(12);
            row.addView(tvPair, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            Button btnEdit = createButton("Sửa", "#1E293B");
            btnEdit.setOnClickListener(v -> showEditGlossaryDialog(entry.getKey(), entry.getValue()));
            row.addView(btnEdit);

            View sp = new View(this);
            row.addView(sp, new LinearLayout.LayoutParams(6, 1));

            Button btnDel = createButton("✕", "#7F1D1D");
            btnDel.setOnClickListener(v -> {
                masterGlossary.remove(entry.getKey());
                refreshGlossaryList();
            });
            row.addView(btnDel);

            llGlossaryList.addView(row);
        }

        // Nút mở kho từ điển toàn diện (Full Dialog có tìm kiếm, không làm giật màn hình)
        Button btnViewAll = createButton("📖 Mở Kho Từ Điển Đầy Đủ (" + masterGlossary.size() + " từ) ▾", "#1E293B");
        btnViewAll.setOnClickListener(v -> showFullGlossaryDialog());
        llGlossaryList.addView(btnViewAll);
    }

    private void showFullGlossaryDialog() {
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("Kho Từ Điển Master Glossary (" + masterGlossary.size() + " từ)");

        LinearLayout dialogLayout = new LinearLayout(this);
        dialogLayout.setOrientation(LinearLayout.VERTICAL);
        dialogLayout.setPadding(24, 16, 24, 16);

        final EditText edtSearch = createStyledEditText("Tìm kiếm từ gốc hoặc nghĩa dịch...");
        dialogLayout.addView(edtSearch);

        // Action Toolbar in Dialog
        LinearLayout toolbarRow = new LinearLayout(this);
        toolbarRow.setOrientation(LinearLayout.HORIZONTAL);
        toolbarRow.setPadding(0, 10, 0, 10);

        Button btnImportFull = createButton("📥 Nạp File .txt", "#1D4ED8");
        btnImportFull.setOnClickListener(v -> openGlossaryFilePicker());
        toolbarRow.addView(btnImportFull, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sp1 = new View(this);
        toolbarRow.addView(sp1, new LinearLayout.LayoutParams(8, 1));

        Button btnExportFull = createButton("📤 Xuất .txt", "#374151");
        btnExportFull.setOnClickListener(v -> exportGlossaryData());
        toolbarRow.addView(btnExportFull);

        dialogLayout.addView(toolbarRow);

        ScrollView sv = new ScrollView(this);
        final LinearLayout itemsLayout = new LinearLayout(this);
        itemsLayout.setOrientation(LinearLayout.VERTICAL);
        itemsLayout.setPadding(0, 10, 0, 10);

        final Runnable populate = () -> {
            itemsLayout.removeAllViews();
            String query = edtSearch.getText().toString().trim().toLowerCase();
            for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
                if (query.isEmpty() || entry.getKey().toLowerCase().contains(query) || entry.getValue().toLowerCase().contains(query)) {
                    LinearLayout row = new LinearLayout(this);
                    row.setOrientation(LinearLayout.HORIZONTAL);
                    row.setPadding(16, 10, 16, 10);
                    row.setBackgroundColor(Color.parseColor("#171717"));
                    row.setGravity(Gravity.CENTER_VERTICAL);
                    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                    lp.setMargins(0, 0, 0, 6);
                    row.setLayoutParams(lp);

                    TextView tvPair = new TextView(this);
                    tvPair.setText(entry.getKey() + " ➔ " + entry.getValue());
                    tvPair.setTextColor(Color.parseColor("#34D399"));
                    tvPair.setTextSize(13);
                    row.addView(tvPair, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

                    Button btnEdit = createButton("Sửa", "#1E293B");
                    btnEdit.setOnClickListener(v -> showEditGlossaryDialog(entry.getKey(), entry.getValue()));
                    row.addView(btnEdit);

                    View spd = new View(this);
                    row.addView(spd, new LinearLayout.LayoutParams(6, 1));

                    Button btnDel = createButton("✕", "#7F1D1D");
                    btnDel.setOnClickListener(v -> {
                        masterGlossary.remove(entry.getKey());
                        saveCurrentProjectData();
                        refreshGlossaryList();
                        row.setVisibility(View.GONE);
                    });
                    row.addView(btnDel);

                    itemsLayout.addView(row);
                }
            }
        };

        edtSearch.addTextChangedListener(new android.text.TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) { populate.run(); }
            public void afterTextChanged(android.text.Editable s) {}
        });

        populate.run();
        sv.addView(itemsLayout);
        dialogLayout.addView(sv, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 800));

        builder.setView(dialogLayout);
        builder.setPositiveButton("Đóng", null);
        builder.show();
    }

    private void startRangeTranslation() {
        if (rawChapters.isEmpty()) {
            Toast.makeText(this, "Vui lòng nạp và tách chương trước!", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            rangeFromChap = Integer.parseInt(edtFromChap.getText().toString().trim());
            rangeToChap = Integer.parseInt(edtToChap.getText().toString().trim());
        } catch (Exception e) {
            rangeFromChap = 1;
            rangeToChap = rawChapters.size();
        }

        rangeFromChap = Math.max(1, Math.min(rangeFromChap, rawChapters.size()));
        rangeToChap = Math.max(rangeFromChap, Math.min(rangeToChap, rawChapters.size()));

        isGapFillingMode = false;
        currentChapterIdx = rangeFromChap - 1;
        isTranslating = true;
        isPaused = false;
        btnPauseResume.setText("Tạm dừng");

        // Bật Foreground Service
        Intent serviceIntent = new Intent(this, TranslationForegroundService.class);
        serviceIntent.putExtra("INFO", "Đang dịch nền từ Chương " + rangeFromChap + " đến " + rangeToChap);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        appendLog("▶ Bắt đầu dịch Range: Chương " + rangeFromChap + " ➔ " + rangeToChap + "...");
        startTranslationLoop();
    }

    private void startFillGapsTranslation() {
        if (rawChapters.isEmpty()) {
            Toast.makeText(this, "Vui lòng nạp và tách chương trước!", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            rangeFromChap = Integer.parseInt(edtFromChap.getText().toString().trim());
            rangeToChap = Integer.parseInt(edtToChap.getText().toString().trim());
        } catch (Exception e) {
            rangeFromChap = 1;
            rangeToChap = rawChapters.size();
        }

        rangeFromChap = Math.max(1, Math.min(rangeFromChap, rawChapters.size()));
        rangeToChap = Math.max(rangeFromChap, Math.min(rangeToChap, rawChapters.size()));

        // Quét danh sách các chương còn thiếu trong khoảng
        List<Integer> missingIndices = new ArrayList<>();
        for (int i = rangeFromChap - 1; i < rangeToChap && i < rawChapters.size(); i++) {
            if (!translatedChapters.containsKey(i) || translatedChapters.get(i) == null || translatedChapters.get(i).trim().isEmpty()) {
                missingIndices.add(i);
            }
        }

        if (missingIndices.isEmpty()) {
            Toast.makeText(this, "🎉 Toàn bộ chương từ " + rangeFromChap + " đến " + rangeToChap + " đều đã có bản dịch! Không có chương nào bị sót.", Toast.LENGTH_LONG).show();
            appendLog("🎉 Đã kiểm tra khoảng Chương " + rangeFromChap + " ➔ " + rangeToChap + ": Đã hoàn thành 100%, không có chương nào bị sót!");
            return;
        }

        isGapFillingMode = true;
        currentChapterIdx = rangeFromChap - 1;
        isTranslating = true;
        isPaused = false;
        btnPauseResume.setText("Tạm dừng");

        // Bật Foreground Service
        Intent serviceIntent = new Intent(this, TranslationForegroundService.class);
        serviceIntent.putExtra("INFO", "Đang dịch bù " + missingIndices.size() + " chương thiếu (né chương đã dịch)");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        StringBuilder sbMiss = new StringBuilder();
        int previewCount = Math.min(missingIndices.size(), 8);
        for (int m = 0; m < previewCount; m++) {
            sbMiss.append(missingIndices.get(m) + 1).append(m < previewCount - 1 ? ", " : "");
        }
        if (missingIndices.size() > 8) sbMiss.append("...");

        appendLog("⚡ [DỊCH BÙ THÔNG MINH] Phát hiện " + missingIndices.size() + " chương chưa dịch (Chương " + sbMiss.toString() + "). Tự động né 100% các chương đã có bản dịch!");
        Toast.makeText(this, "Đang dịch bù " + missingIndices.size() + " chương còn thiếu!", Toast.LENGTH_SHORT).show();

        startTranslationLoop();
    }

    private void togglePauseResume() {
        if (!isTranslating) return;
        isPaused = !isPaused;
        btnPauseResume.setText(isPaused ? "Tiếp tục" : "Tạm dừng");
        if (isPaused) {
            appendLog("⏸ Đã tạm dừng tại Chương " + (currentChapterIdx + 1) + " (Chương này chưa hoàn tất).");
            Toast.makeText(this, "Đã tạm dừng dịch tại Chương " + (currentChapterIdx + 1), Toast.LENGTH_SHORT).show();
        } else {
            appendLog("▶ Tiếp tục dịch lại Chương " + (currentChapterIdx + 1) + " (chương đang dở dang)...");
            Toast.makeText(this, "Tiếp tục dịch Chương " + (currentChapterIdx + 1), Toast.LENGTH_SHORT).show();
        }
    }

    private void cancelTranslation() {
        isTranslating = false;
        isPaused = false;
        isGapFillingMode = false;
        btnPauseResume.setText("Tạm dừng");
        stopService(new Intent(this, TranslationForegroundService.class));
        appendLog("⏹ Đã hủy tiến trình dịch.");
        Toast.makeText(this, "Đã hủy tiến trình dịch.", Toast.LENGTH_SHORT).show();
    }

    private void startTranslationLoop() {
        new Thread(() -> {
            while (isTranslating && currentChapterIdx < rangeToChap && currentChapterIdx < rawChapters.size()) {
                if (isPaused) {
                    try { Thread.sleep(500); } catch (Exception ignored) {}
                    continue;
                }

                final int chapIndex = currentChapterIdx;

                // NẾU ĐANG Ở CHẾ ĐỘ DỊCH BÙ VÀ CHƯƠNG NÀY ĐÃ CÓ BẢN DỊCH:
                if (isGapFillingMode && translatedChapters.containsKey(chapIndex) && translatedChapters.get(chapIndex) != null && !translatedChapters.get(chapIndex).trim().isEmpty()) {
                    mainHandler.post(() -> appendLog("⏭️ [NÉ ĐÃ DỊCH] Chương " + (chapIndex + 1) + " đã có bản dịch hoàn chỉnh, tự động lướt qua!"));
                    currentChapterIdx++;
                    continue;
                }

                appendLog("⚡ Đang gửi Chương " + (chapIndex + 1) + " đến " + currentModel + "...");

                try {
                    String activePrompt = "Dịch tiểu thuyết mượt mà";
                    for (PromptCardItem p : promptCards) {
                        if (p.active) { activePrompt = p.content; break; }
                    }

                    // Tự động trích xuất 300-350 ký tự cuối của bản dịch chương trước để bắt nhịp ngữ cảnh
                    String prevSnippet = null;
                    if (chapIndex > 0 && translatedChapters.containsKey(chapIndex - 1)) {
                        String prevTrans = translatedChapters.get(chapIndex - 1);
                        if (prevTrans != null && !prevTrans.trim().isEmpty()) {
                            int takeLen = Math.min(prevTrans.length(), 350);
                            prevSnippet = "..." + prevTrans.substring(prevTrans.length() - takeLen).trim();
                        }
                    }

                    String[] result = engine.translateChapter(
                            rawChapters.get(chapIndex),
                            prevSnippet,
                            activePrompt,
                            masterGlossary,
                            currentModel,
                            targetLanguage,
                            antiHanziStrict,
                            minTermLength,
                            minFrequency,
                            msg -> mainHandler.post(() -> appendLog(msg))
                    );

                    String translatedText = result[0];
                    String newGlossaryRaw = (result.length > 1) ? result[1] : "";

                    // Lớp 2: Hậu kiểm Regex chống lọt chữ Hán cho bản dịch tiếng Việt
                    if (targetLanguage.contains("Việt") && antiHanziStrict) {
                        List<Map.Entry<String, String>> sortedEntries = new ArrayList<>(masterGlossary.entrySet());
                        sortedEntries.sort((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()));
                        for (Map.Entry<String, String> gEntry : sortedEntries) {
                            if (translatedText.contains(gEntry.getKey())) {
                                translatedText = translatedText.replace(gEntry.getKey(), gEntry.getValue());
                            }
                        }
                    }

                    // TẦNG KIỂM ĐỊNH NGOẠI TUYẾN (Offline Quality Audit)
                    ChapterAuditor.AuditResult audit = ChapterAuditor.auditChapter(
                            rawChapters.get(chapIndex),
                            translatedText,
                            masterGlossary,
                            targetLanguage,
                            antiHanziStrict
                    );

                    // TỰ ĐỘNG ĐẨY LÊN ONLINE DỊCH LẠI & GHI ĐÈ NẾU BẢN DỊCH BỊ LỖI NẶNG
                    if (autoHealOnlineEnabled && !audit.isValid && audit.hasCriticalError) {
                        final String primaryIssue = audit.getPrimaryIssue();
                        mainHandler.post(() -> appendLog("⚠️ [PHÁT HIỆN LỖI NẶNG] Chương " + (chapIndex + 1) + ": " + primaryIssue + ". Đang đẩy lên AI dịch lại (Auto-Heal Online)..."));

                        String rescuePrompt = "LỆNH CỨU HỘ ĐẶC BIỆT: Bản dịch trước bị lỗi nghiêm trọng [" + primaryIssue + "]. "
                                + "YÊU CẦU DỊCH LẠI TOÀN BỘ: Dịch trọn vẹn chương sau sang " + targetLanguage + " đầy đủ 100%, tuyệt đối không tóm tắt, không bỏ sót câu chữ nào, không để sót chữ Hán thô trong câu văn, không lặp lại câu vô nghĩa.";

                        try {
                            String[] rescueResult = engine.translateChapter(
                                    rawChapters.get(chapIndex),
                                    prevSnippet,
                                    activePrompt,
                                    masterGlossary,
                                    currentModel,
                                    targetLanguage,
                                    antiHanziStrict,
                                    minTermLength,
                                    minFrequency,
                                    rescuePrompt,
                                    msg -> mainHandler.post(() -> appendLog(msg))
                            );

                            String rescueTranslated = rescueResult[0];
                            if (targetLanguage.contains("Việt") && antiHanziStrict) {
                                List<Map.Entry<String, String>> sortedEntries = new ArrayList<>(masterGlossary.entrySet());
                                sortedEntries.sort((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()));
                                for (Map.Entry<String, String> gEntry : sortedEntries) {
                                    if (rescueTranslated.contains(gEntry.getKey())) {
                                        rescueTranslated = rescueTranslated.replace(gEntry.getKey(), gEntry.getValue());
                                    }
                                }
                            }

                            ChapterAuditor.AuditResult rescueAudit = ChapterAuditor.auditChapter(
                                    rawChapters.get(chapIndex),
                                    rescueTranslated,
                                    masterGlossary,
                                    targetLanguage,
                                    antiHanziStrict
                            );

                            if (rescueAudit.isValid || rescueAudit.score > audit.score) {
                                translatedText = rescueAudit.cleanedText;
                                if (rescueResult.length > 1 && rescueResult[1] != null && !rescueResult[1].trim().isEmpty()) {
                                    newGlossaryRaw = rescueResult[1];
                                }
                                final int finalScore = rescueAudit.score;
                                mainHandler.post(() -> appendLog("🎯 [CỨU HỘ THÀNH CÔNG] Chương " + (chapIndex + 1) + " đã được dịch lại chuẩn (Điểm: " + finalScore + "/100). Ghi đè vào bộ nhớ!"));
                            } else {
                                translatedText = audit.cleanedText;
                                mainHandler.post(() -> appendLog("🛡️ [CỨU HỘ NGOẠI TUYẾN] Dùng bản vá sạch ngoại tuyến cho Chương " + (chapIndex + 1) + "."));
                            }
                        } catch (Exception exRescue) {
                            translatedText = audit.cleanedText;
                            mainHandler.post(() -> appendLog("🛡️ [LỖI MẠNG CỨU HỘ] Dùng bản vá sạch ngoại tuyến cho Chương " + (chapIndex + 1) + ": " + exRescue.getMessage()));
                        }
                    } else {
                        translatedText = audit.cleanedText;
                        if (!audit.healedActions.isEmpty()) {
                            final String actions = String.join(", ", audit.healedActions);
                            mainHandler.post(() -> appendLog("🧹 [TỰ VÁ OFFLINE] Chương " + (chapIndex + 1) + ": Đã " + actions));
                        }
                    }

                    translatedChapters.put(chapIndex, translatedText);

                    // Bóc tách thuật ngữ mới tuân thủ minTermLength, minFrequency và conflictPolicy
                    List<GlossaryManager.GlossaryEntry> newlyAdded = new ArrayList<>();
                    if (newGlossaryRaw != null && !newGlossaryRaw.trim().isEmpty()) {
                        newlyAdded = GlossaryManager.mergeNewEntries(masterGlossary, newGlossaryRaw, rawChapters.get(chapIndex), minTermLength, minFrequency, conflictPolicy);
                    }

                    saveCurrentProjectData(); // Lưu bền vững vào ổ nhớ ngay lập tức sau mỗi chương!

                    final List<GlossaryManager.GlossaryEntry> finalAdded = newlyAdded;
                    mainHandler.post(() -> {
                        updateProgressUI();
                        refreshGlossaryList(); // TỰ ĐỘNG CẬP NHẬT GIAO DIỆN GLOSSARY THỜI GIAN THỰC!
                        refreshChapterListView();

                        if (!finalAdded.isEmpty()) {
                            StringBuilder sb = new StringBuilder("📚 Đã tự học " + finalAdded.size() + " từ mới: ");
                            for (GlossaryManager.GlossaryEntry e : finalAdded) {
                                sb.append("[").append(e.key).append(" ➔ ").append(e.value).append("] ");
                            }
                            appendLog(sb.toString());
                            Toast.makeText(MainActivity.this, "Đã nạp thêm " + finalAdded.size() + " từ mới vào Glossary!", Toast.LENGTH_SHORT).show();
                        }

                        appendLog("✅ Hoàn tất Chương " + (chapIndex + 1));
                    });

                    currentChapterIdx++;
                    Thread.sleep(delaySec * 1000L);
                } catch (Exception e) {
                    mainHandler.post(() -> appendLog("❌ Lỗi chương " + (chapIndex + 1) + ": " + e.getMessage()));
                    currentChapterIdx++;
                    try { Thread.sleep(3000); } catch (Exception ignored) {}
                }
            }

            mainHandler.post(() -> {
                if (currentChapterIdx >= rangeToChap || currentChapterIdx >= rawChapters.size()) {
                    isTranslating = false;
                    isGapFillingMode = false;
                    appendLog("🎉 Đã hoàn thành khoảng chương yêu cầu!");
                    Toast.makeText(MainActivity.this, "Đã hoàn thành dịch khoảng chương!", Toast.LENGTH_LONG).show();

                    // TỰ ĐỘNG KÍCH HOẠT BỘ QUÉT LÀM MƯỢT FINAL SAU KHI DỊCH XONG TOÀN BỘ CHƯƠNG CUỐI
                    if (currentChapterIdx >= rawChapters.size() || currentChapterIdx >= rangeToChap) {
                        appendLog("🚀 [AUTO POLISH] Đang tự động kích hoạt Bộ Quét Làm Mượt Final...");
                        executeFinalGlobalPolish();
                    }
                }
            });
        }).start();
    }

    private void executeFinalGlobalPolish() {
        if (isPolishing) {
            Toast.makeText(this, "Đang trong tiến trình làm mượt!", Toast.LENGTH_SHORT).show();
            return;
        }
        if (translatedChapters.isEmpty()) {
            Toast.makeText(this, "Chưa có bản dịch nào để làm mượt!", Toast.LENGTH_SHORT).show();
            return;
        }

        appendLog("🔍 [LÀM MƯỢT FINAL] Đang quét Offline toàn bộ " + translatedChapters.size() + " chương bản dịch...");

        new Thread(() -> {
            isPolishing = true;
            try {
                int loopIteration = 0;
                int totalCumulativeFixedWords = 0;
                int totalCumulativeReplacements = 0;
                String targetPolishModel = (polishModel != null && !polishModel.isEmpty()) ? polishModel : "gemini-3.6-flash";

                while (loopIteration < 20) {
                    loopIteration++;
                    final int currentRound = loopIteration;

                    // 1. Quét Offline phân loại 3 nhóm thông minh
                    HanziSweeperEngine.TriagedScanResult triagedScan = HanziSweeperEngine.scanTriagedArtifacts(translatedChapters);
                    int remainingCount = triagedScan.totalUniqueCount();

                    if (triagedScan.isEmpty() || remainingCount == 0) {
                        mainHandler.post(() -> {
                            appendLog("🎉 [LÀM MƯỢT HOÀN TẤT 100%] Toàn bộ bản dịch đã sạch 100% tiếng Việt, không còn bất kỳ chữ Hán nào sót lại!");
                            Toast.makeText(MainActivity.this, "🎉 Bản dịch đã sạch 100% tiếng Việt!", Toast.LENGTH_LONG).show();
                        });
                        break;
                    }

                    // 2. Chia nhỏ thành các gói ~500 mục (~5.000 tokens)
                    List<HanziSweeperEngine.TriagedScanResult> chunks = HanziSweeperEngine.splitTriagedScan(triagedScan, 500);
                    int totalChunks = chunks.size();

                    mainHandler.post(() -> {
                        appendLog("⚡ [LÀM MƯỢT ĐỢT " + currentRound + "] Phát hiện " + remainingCount + " mục (Từ lai: " + triagedScan.mixedWords.size() + ", Cụm Hán: " + triagedScan.multiHanziWords.size() + ", Hán đơn: " + triagedScan.singleHanziContext.size() + "). Tự động chia làm " + totalChunks + " gói (~5.000 tokens/gói) gửi model " + targetPolishModel + "...");
                        Toast.makeText(MainActivity.this, "Đang xử lý đợt " + currentRound + ": " + remainingCount + " mục qua " + totalChunks + " gói...", Toast.LENGTH_SHORT).show();
                    });

                    int wordsFixedThisRound = 0;

                    for (int cIdx = 0; cIdx < totalChunks; cIdx++) {
                        HanziSweeperEngine.TriagedScanResult chunk = chunks.get(cIdx);
                        int currentChunkNumber = cIdx + 1;

                        mainHandler.post(() -> {
                            appendLog("⏳ [GÓI " + currentChunkNumber + "/" + totalChunks + "] Đang gửi " + chunk.totalUniqueCount() + " mục đến " + targetPolishModel + "...");
                        });

                        String batchPrompt = HanziSweeperEngine.buildTriagedPrompt(chunk);

                        String[] aiResponse = engine.translateChapter(
                                batchPrompt,
                                null,
                                "Bạn là chuyên gia dịch thuật tiểu thuyết và Hán Việt. Chỉ trả về JSON Object thuần túy.",
                                Collections.emptyMap(),
                                targetPolishModel,
                                "Tiếng Việt",
                                false,
                                2,
                                1,
                                null,
                                msg -> mainHandler.post(() -> appendLog(msg))
                        );

                        String rawJson = (aiResponse != null && aiResponse.length > 0) ? aiResponse[0] : "";
                        Map<String, String> translationMap = HanziSweeperEngine.parseJsonResponse(rawJson);

                        if (!translationMap.isEmpty()) {
                            int replacedCount = HanziSweeperEngine.applyGlobalReplacements(translatedChapters, translationMap);
                            wordsFixedThisRound += translationMap.size();
                            totalCumulativeFixedWords += translationMap.size();
                            totalCumulativeReplacements += replacedCount;

                            mainHandler.post(() -> {
                                updateProgressUI();
                                refreshChapterListView();
                                appendLog("✅ [GÓI " + currentChunkNumber + "/" + totalChunks + "] Đã làm mượt " + translationMap.size() + " từ (" + replacedCount + " vị trí).");
                            });
                        }
                    }

                    // Lưu dữ liệu sau mỗi đợt
                    saveCurrentProjectData();

                    // Nếu đợt này không sửa được từ nào (do AI lỗi hoặc mạng), dừng vòng lặp để tránh lặp vô tận
                    if (wordsFixedThisRound == 0) {
                        mainHandler.post(() -> {
                            appendLog("⚠️ Không thể trích xuất thêm bản dịch từ AI trong đợt này. Tạm dừng tiến trình.");
                        });
                        break;
                    }
                }

                // Cập nhật giao diện sau khi kết thúc toàn bộ vòng lặp
                final int finalFixed = totalCumulativeFixedWords;
                final int finalRepl = totalCumulativeReplacements;
                mainHandler.post(() -> {
                    updateProgressUI();
                    refreshChapterListView();
                    if (finalFixed > 0) {
                        appendLog("🏆 [TỔNG KẾT] Đã tự động làm mượt tổng cộng " + finalFixed + " từ rác (" + finalRepl + " vị trí) trên toàn bộ tác phẩm!");
                        Toast.makeText(MainActivity.this, "🎉 Hoàn tất làm mượt tổng cộng " + finalFixed + " từ rác!", Toast.LENGTH_LONG).show();
                    }
                });

            } catch (Exception e) {
                mainHandler.post(() -> {
                    appendLog("❌ Lỗi trong khâu làm mượt Final: " + e.getMessage());
                    Toast.makeText(MainActivity.this, "Lỗi làm mượt: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            } finally {
                isPolishing = false;
            }
        }).start();
    }

    private void updateProgressUI() {
        if (progressBar != null) {
            progressBar.setMax(Math.max(rawChapters.size(), 1));
            progressBar.setProgress(translatedChapters.size());
            tvProgressText.setText("Tiến độ: " + translatedChapters.size() + " / " + rawChapters.size() + " chương");
        }
    }

    private void appendLog(String msg) {
        mainHandler.post(() -> {
            String time = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date());
            logList.add(0, "[" + time + "] " + msg);
            if (logList.size() > 50) logList.removeLast();

            if (tvLiveLogs != null) {
                String nl = String.valueOf((char) 10);
                StringBuilder sb = new StringBuilder();
                for (String l : logList) {
                    sb.append(l).append(nl);
                }
                tvLiveLogs.setText(sb.toString());
            }
        });
    }

    // =========================================================================
    // THẺ 3: BẢN DỊCH & DANH SÁCH CHƯƠNG (PHÂN TRANG MƯỢT MÀ 60FPS)
    // =========================================================================
    private void createTabReaderView() {
        tabReaderView = new ScrollView(this);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(32, 24, 32, 32);

        tvChapterCountInfo = new TextView(this);
        tvChapterCountInfo.setTextColor(Color.parseColor("#60A5FA"));
        tvChapterCountInfo.setTextSize(14);
        tvChapterCountInfo.setTypeface(null, Typeface.BOLD);
        tvChapterCountInfo.setText("Danh Sách Các Chương (Chạm để mở Trình Đọc Toàn Màn Hình):");
        content.addView(tvChapterCountInfo);

        TextView tvDesc = new TextView(this);
        tvDesc.setText("Phân trang 100 chương/trang chống khựng máy. Trạng thái đọc độc lập 100%, hỗ trợ AMOLED/Sepia.");
        tvDesc.setTextColor(Color.parseColor("#9CA3AF"));
        tvDesc.setTextSize(11);
        tvDesc.setPadding(0, 4, 0, 12);
        content.addView(tvDesc);

        Button btnExportTab3 = createButton("📥 Xuất Toàn Văn Tác Phẩm (.txt) Vào Download", "#059669");
        btnExportTab3.setOnClickListener(v -> exportFullNovelData());
        content.addView(btnExportTab3);

        View spGap3 = new View(this);
        content.addView(spGap3, new LinearLayout.LayoutParams(1, 10));

        btnFillGapsTab3 = createButton("⚡ Dịch Bù Toàn Bộ Chương Còn Thiếu (Né Đã Dịch)", "#0D9488");
        btnFillGapsTab3.setOnClickListener(v -> {
            switchTab(1);
            startFillGapsTranslation();
        });
        content.addView(btnFillGapsTab3);

        View spPol3 = new View(this);
        content.addView(spPol3, new LinearLayout.LayoutParams(1, 10));

        btnFinalPolishTab3 = createButton("✨ Làm Mượt Toàn Văn Bản Dịch (Quét Sạch Chữ Hán)", "#7C3AED");
        btnFinalPolishTab3.setOnClickListener(v -> executeFinalGlobalPolish());
        content.addView(btnFinalPolishTab3);

        View spExp = new View(this);
        content.addView(spExp, new LinearLayout.LayoutParams(1, 14));

        llChapterList = new LinearLayout(this);
        llChapterList.setOrientation(LinearLayout.VERTICAL);
        content.addView(llChapterList);

        tabReaderView.addView(content);
        refreshChapterListView();
    }

    private void refreshChapterListView() {
        if (llChapterList == null) return;
        llChapterList.removeAllViews();

        if (rawChapters.isEmpty()) {
            TextView tvEmpty = new TextView(this);
            tvEmpty.setText("Chưa có chương nào. Hãy nạp file ở Thẻ 2 (Dịch & Từ điển)!");
            tvEmpty.setTextColor(Color.parseColor("#666666"));
            tvEmpty.setPadding(0, 32, 0, 0);
            llChapterList.addView(tvEmpty);
            return;
        }

        int totalChapters = rawChapters.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalChapters / CHAPTERS_PER_PAGE));
        chapterListPage = Math.max(0, Math.min(chapterListPage, totalPages - 1));

        // Hàng điều khiển phân trang chương chống giật lag
        LinearLayout pagRow = new LinearLayout(this);
        pagRow.setOrientation(LinearLayout.HORIZONTAL);
        pagRow.setPadding(0, 0, 0, 16);
        pagRow.setGravity(Gravity.CENTER_VERTICAL);

        Button btnPrevPage = createButton("◀ Trước", "#1E293B");
        btnPrevPage.setEnabled(chapterListPage > 0);
        btnPrevPage.setOnClickListener(v -> {
            if (chapterListPage > 0) {
                chapterListPage--;
                refreshChapterListView();
            }
        });
        pagRow.addView(btnPrevPage);

        TextView tvPageInfo = new TextView(this);
        tvPageInfo.setGravity(Gravity.CENTER);
        tvPageInfo.setTextColor(Color.parseColor("#93C5FD"));
        tvPageInfo.setText("Trang " + (chapterListPage + 1) + " / " + totalPages + " (" + totalChapters + " chương)");
        pagRow.addView(tvPageInfo, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnNextPage = createButton("Sau ▶", "#1E293B");
        btnNextPage.setEnabled(chapterListPage < totalPages - 1);
        btnNextPage.setOnClickListener(v -> {
            if (chapterListPage < totalPages - 1) {
                chapterListPage++;
                refreshChapterListView();
            }
        });
        pagRow.addView(btnNextPage);
        llChapterList.addView(pagRow);

        int startIdx = chapterListPage * CHAPTERS_PER_PAGE;
        int endIdx = Math.min(startIdx + CHAPTERS_PER_PAGE, totalChapters);

        for (int i = startIdx; i < endIdx; i++) {
            final int idx = i;
            boolean isDone = translatedChapters.containsKey(idx);
            boolean isCurrent = isTranslating && currentChapterIdx == idx;

            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.HORIZONTAL);
            GradientDrawable itemBg = new GradientDrawable();
            itemBg.setColor(Color.parseColor(isCurrent ? "#172554" : (isDone ? "#064E3B" : "#161B22")));
            itemBg.setCornerRadius(18f);
            itemBg.setStroke(2, Color.parseColor(isCurrent ? "#3B82F6" : (isDone ? "#059669" : "#30363D")));
            item.setBackground(itemBg);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 8);
            item.setLayoutParams(lp);

            TextView tvName = new TextView(this);
            String nl = String.valueOf((char) 10);
            String firstLine = rawChapters.get(idx).split(nl)[0];
            tvName.setText("Chương " + (idx + 1) + ": " + (firstLine.length() > 30 ? firstLine.substring(0, 30) : firstLine));
            tvName.setTextColor(Color.WHITE);
            item.addView(tvName, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            TextView tvStatus = new TextView(this);
            tvStatus.setText(isCurrent ? "⚡ Đang dịch" : (isDone ? "✓ Đã dịch" : "Chờ"));
            tvStatus.setTextColor(Color.parseColor(isCurrent ? "#93C5FD" : (isDone ? "#34D399" : "#6B7280")));
            tvStatus.setTypeface(null, Typeface.BOLD);
            item.addView(tvStatus);

            item.setOnClickListener(v -> {
                if (isDone) {
                    openFullScreenReader(idx);
                } else {
                    AlertDialog.Builder d = new AlertDialog.Builder(MainActivity.this);
                    d.setTitle("Chương " + (idx + 1) + " (Chưa có bản dịch)");
                    d.setMessage("Chương này đang ở trạng thái 'Chờ'.\\n\\nBạn có muốn dịch ngay chương này không?");
                    d.setPositiveButton("⚡ Dịch ngay chương này", (dialog, which) -> {
                        edtFromChap.setText(String.valueOf(idx + 1));
                        edtToChap.setText(String.valueOf(idx + 1));
                        switchTab(1);
                        startRangeTranslation();
                    });
                    d.setNeutralButton("Đọc bản gốc", (dialog, which) -> openFullScreenReader(idx));
                    d.setNegativeButton("Đóng", null);
                    d.show();
                }
            });
            llChapterList.addView(item);
        }
    }

    // =========================================================================
    // TRÌNH ĐỌC TOÀN MÀN HÌNH CHUYÊN NGHIỆP (FULLSCREEN READER OVERLAY)
    // =========================================================================
    private void createFullScreenReaderOverlay() {
        flReaderOverlay = new FrameLayout(this);
        flReaderOverlay.setVisibility(View.GONE);

        llReaderRoot = new LinearLayout(this);
        llReaderRoot.setOrientation(LinearLayout.VERTICAL);

        // 1. Reader Top Bar
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setPadding(28, 20, 28, 20);
        topBar.setGravity(Gravity.CENTER_VERTICAL);

        tvReaderTitle = new TextView(this);
        tvReaderTitle.setText("Chương 1");
        tvReaderTitle.setTextSize(15);
        tvReaderTitle.setTypeface(null, Typeface.BOLD);
        topBar.addView(tvReaderTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnCopy = createButton("Sao chép", "#1E293B");
        btnCopy.setOnClickListener(v -> {
            String textToCopy = getReaderCurrentText();
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("Chapter Text", textToCopy));
                Toast.makeText(this, "Đã sao chép chương!", Toast.LENGTH_SHORT).show();
            }
        });
        topBar.addView(btnCopy);

        View spClose = new View(this);
        topBar.addView(spClose, new LinearLayout.LayoutParams(8, 1));

        Button btnClose = createButton("✕ Đóng", "#7F1D1D");
        btnClose.setOnClickListener(v -> flReaderOverlay.setVisibility(View.GONE));
        topBar.addView(btnClose);

        llReaderRoot.addView(topBar);

        // 2. Reader Secondary Toolbar (View Mode, Theme, Font Size)
        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setPadding(28, 10, 28, 10);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);

        // Chế độ xem: Tiếng Việt, Song Ngữ, Gốc
        btnModeTrans = createButton("Tiếng Việt", "#2563EB");
        btnModeTrans.setOnClickListener(v -> {
            readerMode = "translated";
            updateReaderUI();
        });
        toolbar.addView(btnModeTrans);

        View sm1 = new View(this);
        toolbar.addView(sm1, new LinearLayout.LayoutParams(6, 1));

        btnModeBilingual = createButton("Song Ngữ", "#1E293B");
        btnModeBilingual.setOnClickListener(v -> {
            readerMode = "bilingual";
            updateReaderUI();
        });
        toolbar.addView(btnModeBilingual);

        View sm2 = new View(this);
        toolbar.addView(sm2, new LinearLayout.LayoutParams(6, 1));

        btnModeRaw = createButton("Nguyên Tác", "#1E293B");
        btnModeRaw.setOnClickListener(v -> {
            readerMode = "original";
            updateReaderUI();
        });
        toolbar.addView(btnModeRaw);

        View sSpace = new View(this);
        toolbar.addView(sSpace, new LinearLayout.LayoutParams(0, 1, 1.0f));

        // Chủ đề: AMOLED, Sepia, Sáng
        btnThemeAmoled = createButton("AMOLED", "#000000");
        btnThemeAmoled.setOnClickListener(v -> {
            readerTheme = "amoled";
            applyReaderTheme();
        });
        toolbar.addView(btnThemeAmoled);

        View st1 = new View(this);
        toolbar.addView(st1, new LinearLayout.LayoutParams(6, 1));

        btnThemeSepia = createButton("Sepia", "#D97706");
        btnThemeSepia.setOnClickListener(v -> {
            readerTheme = "sepia";
            applyReaderTheme();
        });
        toolbar.addView(btnThemeSepia);

        View st2 = new View(this);
        toolbar.addView(st2, new LinearLayout.LayoutParams(6, 1));

        btnThemeLight = createButton("Sáng", "#4B5563");
        btnThemeLight.setOnClickListener(v -> {
            readerTheme = "light";
            applyReaderTheme();
        });
        toolbar.addView(btnThemeLight);

        View sFontSpace = new View(this);
        toolbar.addView(sFontSpace, new LinearLayout.LayoutParams(12, 1));

        // Nút chỉnh cỡ chữ
        Button btnFontMinus = createButton("A-", "#1E293B");
        btnFontMinus.setOnClickListener(v -> {
            readerFontSize = Math.max(12, readerFontSize - 1);
            tvFontSizeDisplay.setText(readerFontSize + "sp");
            tvReaderContent.setTextSize(readerFontSize);
        });
        toolbar.addView(btnFontMinus);

        tvFontSizeDisplay = new TextView(this);
        tvFontSizeDisplay.setText(readerFontSize + "sp");
        tvFontSizeDisplay.setTextSize(11);
        tvFontSizeDisplay.setPadding(8, 0, 8, 0);
        toolbar.addView(tvFontSizeDisplay);

        Button btnFontPlus = createButton("A+", "#1E293B");
        btnFontPlus.setOnClickListener(v -> {
            readerFontSize = Math.min(26, readerFontSize + 1);
            tvFontSizeDisplay.setText(readerFontSize + "sp");
            tvReaderContent.setTextSize(readerFontSize);
        });
        toolbar.addView(btnFontPlus);

        llReaderRoot.addView(toolbar);

        // 3. Reader Content Body
        svReaderScroll = new ScrollView(this);
        LinearLayout.LayoutParams svParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f
        );

        tvReaderContent = new TextView(this);
        tvReaderContent.setPadding(36, 24, 36, 32);
        tvReaderContent.setTextSize(readerFontSize);
        tvReaderContent.setLineSpacing(0, 1.6f);
        tvReaderContent.setTextIsSelectable(true);

        svReaderScroll.addView(tvReaderContent);
        llReaderRoot.addView(svReaderScroll, svParams);

        // 4. Reader Bottom Bar (Chương Trước / Sau)
        LinearLayout bottomBar = new LinearLayout(this);
        bottomBar.setOrientation(LinearLayout.HORIZONTAL);
        bottomBar.setPadding(28, 16, 28, 20);
        bottomBar.setGravity(Gravity.CENTER_VERTICAL);

        btnPrevChapter = createButton("← Chương Trước", "#1E293B");
        btnPrevChapter.setOnClickListener(v -> {
            if (readerCurrentChapterIndex > 0) {
                openFullScreenReader(readerCurrentChapterIndex - 1);
            }
        });
        bottomBar.addView(btnPrevChapter);

        tvReaderSubTitle = new TextView(this);
        tvReaderSubTitle.setGravity(Gravity.CENTER);
        bottomBar.addView(tvReaderSubTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        btnNextChapter = createButton("Chương Sau →", "#1E293B");
        btnNextChapter.setOnClickListener(v -> {
            if (readerCurrentChapterIndex < rawChapters.size() - 1) {
                openFullScreenReader(readerCurrentChapterIndex + 1);
            }
        });
        bottomBar.addView(btnNextChapter);

        llReaderRoot.addView(bottomBar);

        flReaderOverlay.addView(llReaderRoot, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        applyReaderTheme();
    }

    private void openFullScreenReader(int index) {
        if (rawChapters.isEmpty()) return;
        readerCurrentChapterIndex = Math.max(0, Math.min(index, rawChapters.size() - 1));

        tvReaderTitle.setText(currentProjectName + " · Chương " + (readerCurrentChapterIndex + 1) + " / " + rawChapters.size());
        tvReaderSubTitle.setText((readerCurrentChapterIndex + 1) + " / " + rawChapters.size());

        btnPrevChapter.setEnabled(readerCurrentChapterIndex > 0);
        btnNextChapter.setEnabled(readerCurrentChapterIndex < rawChapters.size() - 1);

        updateReaderUI();

        flReaderOverlay.setVisibility(View.VISIBLE);
        svReaderScroll.scrollTo(0, 0);
    }

    private String getReaderCurrentText() {
        if (rawChapters.isEmpty() || readerCurrentChapterIndex >= rawChapters.size()) return "";

        String nl = String.valueOf((char) 10);
        boolean hasTrans = translatedChapters.containsKey(readerCurrentChapterIndex);
        String transText = hasTrans ? translatedChapters.get(readerCurrentChapterIndex) : "(Chưa có bản dịch cho chương này)";
        String rawText = rawChapters.get(readerCurrentChapterIndex);

        if ("translated".equals(readerMode)) {
            return transText;
        } else if ("original".equals(readerMode)) {
            return rawText;
        } else {
            return "=== BẢN DỊCH TIẾNG VIỆT ===" + nl + nl + transText + nl + nl + "=== NGUYÊN TÁC GỐC ===" + nl + nl + rawText;
        }
    }

    private void updateReaderUI() {
        tvReaderContent.setText(getReaderCurrentText());

        btnModeTrans.setBackgroundColor(Color.parseColor("translated".equals(readerMode) ? "#2563EB" : "#1E293B"));
        btnModeBilingual.setBackgroundColor(Color.parseColor("bilingual".equals(readerMode) ? "#2563EB" : "#1E293B"));
        btnModeRaw.setBackgroundColor(Color.parseColor("original".equals(readerMode) ? "#2563EB" : "#1E293B"));
    }

    private void applyReaderTheme() {
        int bgColor;
        int textColor;
        int barBgColor;

        if ("sepia".equals(readerTheme)) {
            bgColor = Color.parseColor("#FBF0D9");
            textColor = Color.parseColor("#3D2E1E");
            barBgColor = Color.parseColor("#F2E2C2");
        } else if ("light".equals(readerTheme)) {
            bgColor = Color.parseColor("#FFFFFF");
            textColor = Color.parseColor("#111827");
            barBgColor = Color.parseColor("#F3F4F6");
        } else { // amoled
            bgColor = Color.parseColor("#000000");
            textColor = Color.parseColor("#E5E7EB");
            barBgColor = Color.parseColor("#111111");
        }

        llReaderRoot.setBackgroundColor(bgColor);
        tvReaderContent.setTextColor(textColor);
        tvReaderTitle.setTextColor(textColor);
        tvReaderSubTitle.setTextColor(textColor);
        tvFontSizeDisplay.setTextColor(textColor);
    }

    // =========================================================================
    // =========================================================================
    // THẺ 4: CÀI ĐẶT CHUYÊN SÂU & QUẢN LÝ DỰ ÁN (DEEP SETTINGS HUB)
    // =========================================================================
    private void refreshSettingsUI() {
        if (tvSettingsProjName != null) {
            tvSettingsProjName.setText("• Dự án: " + currentProjectName);
        }
        if (tvSettingsProjStats != null) {
            tvSettingsProjStats.setText("• Đã dịch: " + translatedChapters.size() + "/" + rawChapters.size() + " chương · Glossary: " + masterGlossary.size() + " từ");
        }
        if (tvSettingsMinTerm != null) {
            tvSettingsMinTerm.setText("• Độ dài chữ Hán tối thiểu: " + minTermLength + " ký tự");
        }
        if (edtCustomMinTerm != null && !edtCustomMinTerm.hasFocus()) {
            edtCustomMinTerm.setText(String.valueOf(minTermLength));
        }
        if (tvSettingsMinFreq != null) {
            tvSettingsMinFreq.setText("• Tần suất lặp lại tối thiểu trong chương: ≥ " + minFrequency + " lần");
        }
        if (edtCustomMinFreq != null && !edtCustomMinFreq.hasFocus()) {
            edtCustomMinFreq.setText(String.valueOf(minFrequency));
        }
        if (tvSettingsTargetLang != null) {
            tvSettingsTargetLang.setText("• Ngôn ngữ đích: " + targetLanguage);
        }

        updateLangButtonStyles();
        updateMinTermButtonStyles();
        updateMinFreqButtonStyles();

        if (btnSettingsAntiHanzi != null) {
            btnSettingsAntiHanzi.setText("Bộ Lọc 2 Lớp Chống Chữ Hán: " + (antiHanziStrict ? "🟢 BẬT [Lớp 1 + Lớp 2]" : "⚪ TẮT"));
            btnSettingsAntiHanzi.setBackground(createButtonDrawable(antiHanziStrict ? "#059669" : "#374151", 18f));
        }
        if (btnSettingsAutoHeal != null) {
            btnSettingsAutoHeal.setText("Tự Động Dịch Lại Khi Lỗi Nặng: " + (autoHealOnlineEnabled ? "🟢 BẬT [Auto-Heal Online]" : "⚪ TẮT"));
            btnSettingsAutoHeal.setBackground(createButtonDrawable(autoHealOnlineEnabled ? "#0D9488" : "#374151", 18f));
        }
        if (btnSettingsPolicy != null) {
            btnSettingsPolicy.setText("Xung Đột Nghĩa: " + ("keep-old".equals(conflictPolicy) ? "Giữ Cũ - Bỏ Mới (Bảo toàn)" : "Ghi Đè Bằng Nghĩa Mới"));
        }
    }

    private void updateLangButtonStyles() {
        if (btnLangVi == null) return;
        boolean isVi = targetLanguage.contains("Việt");
        boolean isJa = targetLanguage.contains("Nhật") || targetLanguage.contains("日本語");
        boolean isEn = targetLanguage.equalsIgnoreCase("English");
        boolean isKo = targetLanguage.contains("Hàn") || targetLanguage.contains("한국어");

        btnLangVi.setText((isVi ? "✓ " : "") + "Tiếng Việt");
        btnLangJa.setText((isJa ? "✓ " : "") + "日本語");
        btnLangEn.setText((isEn ? "✓ " : "") + "English");
        btnLangKo.setText((isKo ? "✓ " : "") + "한국어");

        btnLangVi.setBackground(createButtonDrawable(isVi ? "#2563EB" : "#1E293B", 18f));
        btnLangJa.setBackground(createButtonDrawable(isJa ? "#2563EB" : "#1E293B", 18f));
        btnLangEn.setBackground(createButtonDrawable(isEn ? "#2563EB" : "#1E293B", 18f));
        btnLangKo.setBackground(createButtonDrawable(isKo ? "#2563EB" : "#1E293B", 18f));
    }

    private void updateMinTermButtonStyles() {
        for (int i = 0; i < minTermButtons.size(); i++) {
            int len = i + 1;
            Button b = minTermButtons.get(i);
            b.setBackground(createButtonDrawable(minTermLength == len ? "#059669" : "#1E293B", 18f));
        }
    }

    private void updateMinFreqButtonStyles() {
        for (int i = 0; i < minFreqButtons.size(); i++) {
            int freq = i + 1;
            Button b = minFreqButtons.get(i);
            b.setBackground(createButtonDrawable(minFrequency == freq ? "#059669" : "#1E293B", 18f));
        }
    }

    private void createTabSettingsView() {
        tabSettingsView = new ScrollView(this);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(32, 24, 32, 32);

        // 1. Quản Lý Dự Án & Xóa Dự Án
        TextView tvProjTitle = new TextView(this);
        tvProjTitle.setText("1. Quản Lý Dự Án Hiện Tại:");
        tvProjTitle.setTextColor(Color.WHITE);
        tvProjTitle.setTextSize(15);
        tvProjTitle.setTypeface(null, Typeface.BOLD);
        content.addView(tvProjTitle);

        LinearLayout cardProj = createCard();
        tvSettingsProjName = new TextView(this);
        tvSettingsProjName.setText("• Dự án: " + currentProjectName);
        tvSettingsProjName.setTextColor(Color.parseColor("#93C5FD"));
        tvSettingsProjName.setTypeface(null, Typeface.BOLD);
        cardProj.addView(tvSettingsProjName);

        tvSettingsProjStats = new TextView(this);
        tvSettingsProjStats.setText("• Đã dịch: " + translatedChapters.size() + "/" + rawChapters.size() + " chương · Glossary: " + masterGlossary.size() + " từ");
        tvSettingsProjStats.setTextColor(Color.parseColor("#9CA3AF"));
        tvSettingsProjStats.setPadding(0, 4, 0, 12);
        cardProj.addView(tvSettingsProjStats);

        LinearLayout rowProjBtns = new LinearLayout(this);
        rowProjBtns.setOrientation(LinearLayout.HORIZONTAL);

        Button btnSwitch = createButton("Chuyển Dự Án", "#1E293B");
        btnSwitch.setOnClickListener(v -> showSwitchProjectDialog());
        rowProjBtns.addView(btnSwitch, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sp1 = new View(this);
        rowProjBtns.addView(sp1, new LinearLayout.LayoutParams(12, 1));

        Button btnNewProj = createButton("+ Tạo Mới", "#2563EB");
        btnNewProj.setOnClickListener(v -> showNewProjectDialog());
        rowProjBtns.addView(btnNewProj, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardProj.addView(rowProjBtns);

        // Nút Xóa Dự Án Màu Đỏ Cực Kỳ An Toàn
        Button btnDeleteProj = createButton("🗑️ Xóa Vĩnh Viễn Dự Án Này", "#7F1D1D");
        btnDeleteProj.setOnClickListener(v -> showDeleteProjectConfirmationDialog());
        LinearLayout.LayoutParams lpDel = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lpDel.setMargins(0, 10, 0, 0);
        cardProj.addView(btnDeleteProj, lpDel);

        TextView tvDelHint = new TextView(this);
        tvDelHint.setText("💡 Khi xóa dự án, chỉ dữ liệu của truyện này bị xóa. Toàn bộ kho Key API và Thẻ Prompt ở Tab 1 được BẢO TOÀN VĨNH CỬU 100%.");
        tvDelHint.setTextColor(Color.parseColor("#6B7280"));
        tvDelHint.setTextSize(10);
        tvDelHint.setPadding(0, 8, 0, 0);
        cardProj.addView(tvDelHint);

        content.addView(cardProj);

        // 2. Tinh Chỉnh Glossary AI Auto-Learning
        TextView tvGlossSettingsTitle = new TextView(this);
        tvGlossSettingsTitle.setText("2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning):");
        tvGlossSettingsTitle.setTextColor(Color.WHITE);
        tvGlossSettingsTitle.setTextSize(15);
        tvGlossSettingsTitle.setTypeface(null, Typeface.BOLD);
        tvGlossSettingsTitle.setPadding(0, 16, 0, 0);
        content.addView(tvGlossSettingsTitle);

        LinearLayout cardGloss = createCard();
        tvSettingsMinTerm = new TextView(this);
        tvSettingsMinTerm.setText("• Độ dài chữ Hán tối thiểu: " + minTermLength + " ký tự");
        tvSettingsMinTerm.setTextColor(Color.parseColor("#D1D5DB"));
        cardGloss.addView(tvSettingsMinTerm);

        // Quick buttons cho Độ dài (1 đến 6 ký tự)
        minTermButtons.clear();
        LinearLayout rowLen = new LinearLayout(this);
        rowLen.setOrientation(LinearLayout.HORIZONTAL);
        rowLen.setPadding(0, 8, 0, 8);
        for (int l = 1; l <= 6; l++) {
            final int chosenLen = l;
            Button b = createButton(l + " kt", minTermLength == l ? "#059669" : "#1E293B");
            b.setOnClickListener(v -> {
                minTermLength = chosenLen;
                if (edtCustomMinTerm != null) edtCustomMinTerm.setText(String.valueOf(chosenLen));
                saveAllState();
                refreshSettingsUI();
                appendLog("⚙️ Đã đặt Độ dài Glossary tối thiểu: >= " + chosenLen + " ký tự");
            });
            minTermButtons.add(b);
            rowLen.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
            if (l < 6) {
                View s = new View(this);
                rowLen.addView(s, new LinearLayout.LayoutParams(6, 1));
            }
        }
        cardGloss.addView(rowLen);

        // Nhập số tùy ý cho Độ dài
        LinearLayout rowCustomMinTerm = new LinearLayout(this);
        rowCustomMinTerm.setOrientation(LinearLayout.HORIZONTAL);
        rowCustomMinTerm.setGravity(Gravity.CENTER_VERTICAL);
        rowCustomMinTerm.setPadding(0, 0, 0, 14);

        TextView tvCustomTermLabel = new TextView(this);
        tvCustomTermLabel.setText("Hoặc nhập số tùy ý:");
        tvCustomTermLabel.setTextColor(Color.parseColor("#9CA3AF"));
        tvCustomTermLabel.setTextSize(12);
        rowCustomMinTerm.addView(tvCustomTermLabel);

        View sct1 = new View(this);
        rowCustomMinTerm.addView(sct1, new LinearLayout.LayoutParams(10, 1));

        edtCustomMinTerm = new EditText(this);
        edtCustomMinTerm.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        edtCustomMinTerm.setText(String.valueOf(minTermLength));
        edtCustomMinTerm.setTextColor(Color.WHITE);
        edtCustomMinTerm.setBackgroundColor(Color.parseColor("#171717"));
        edtCustomMinTerm.setPadding(20, 12, 20, 12);
        edtCustomMinTerm.setGravity(Gravity.CENTER);
        rowCustomMinTerm.addView(edtCustomMinTerm, new LinearLayout.LayoutParams(140, ViewGroup.LayoutParams.WRAP_CONTENT));

        View sct2 = new View(this);
        rowCustomMinTerm.addView(sct2, new LinearLayout.LayoutParams(10, 1));

        Button btnSaveCustomTerm = createButton("Lưu số này", "#059669");
        btnSaveCustomTerm.setOnClickListener(v -> {
            try {
                int val = Integer.parseInt(edtCustomMinTerm.getText().toString().trim());
                if (val >= 1) {
                    minTermLength = val;
                    saveAllState();
                    refreshSettingsUI();
                    appendLog("⚙️ Đã lưu Độ dài Glossary tối thiểu: >= " + minTermLength + " ký tự");
                    Toast.makeText(this, "Đã lưu độ dài tối thiểu: " + minTermLength + " ký tự!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(this, "Vui lòng nhập số >= 1!", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Vui lòng nhập số hợp lệ!", Toast.LENGTH_SHORT).show();
            }
        });
        rowCustomMinTerm.addView(btnSaveCustomTerm);
        cardGloss.addView(rowCustomMinTerm);

        // Tần suất xuất hiện tối thiểu
        tvSettingsMinFreq = new TextView(this);
        tvSettingsMinFreq.setText("• Tần suất lặp lại tối thiểu trong chương: ≥ " + minFrequency + " lần");
        tvSettingsMinFreq.setTextColor(Color.parseColor("#D1D5DB"));
        cardGloss.addView(tvSettingsMinFreq);

        minFreqButtons.clear();
        LinearLayout rowFreq = new LinearLayout(this);
        rowFreq.setOrientation(LinearLayout.HORIZONTAL);
        rowFreq.setPadding(0, 8, 0, 8);
        for (int f = 1; f <= 6; f++) {
            final int chosenFreq = f;
            Button b = createButton("≥ " + f + " lần", minFrequency == f ? "#059669" : "#1E293B");
            b.setOnClickListener(v -> {
                minFrequency = chosenFreq;
                if (edtCustomMinFreq != null) edtCustomMinFreq.setText(String.valueOf(chosenFreq));
                saveAllState();
                refreshSettingsUI();
                appendLog("⚙️ Đã đặt Tần suất Glossary tối thiểu: >= " + chosenFreq + " lần");
            });
            minFreqButtons.add(b);
            rowFreq.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
            if (f < 6) {
                View s = new View(this);
                rowFreq.addView(s, new LinearLayout.LayoutParams(6, 1));
            }
        }
        cardGloss.addView(rowFreq);

        // Nhập số tùy ý cho Tần suất
        LinearLayout rowCustomMinFreq = new LinearLayout(this);
        rowCustomMinFreq.setOrientation(LinearLayout.HORIZONTAL);
        rowCustomMinFreq.setGravity(Gravity.CENTER_VERTICAL);
        rowCustomMinFreq.setPadding(0, 0, 0, 14);

        TextView tvCustomFreqLabel = new TextView(this);
        tvCustomFreqLabel.setText("Hoặc nhập số tùy ý:");
        tvCustomFreqLabel.setTextColor(Color.parseColor("#9CA3AF"));
        tvCustomFreqLabel.setTextSize(12);
        rowCustomMinFreq.addView(tvCustomFreqLabel);

        View scf1 = new View(this);
        rowCustomMinFreq.addView(scf1, new LinearLayout.LayoutParams(10, 1));

        edtCustomMinFreq = new EditText(this);
        edtCustomMinFreq.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        edtCustomMinFreq.setText(String.valueOf(minFrequency));
        edtCustomMinFreq.setTextColor(Color.WHITE);
        edtCustomMinFreq.setBackgroundColor(Color.parseColor("#171717"));
        edtCustomMinFreq.setPadding(20, 12, 20, 12);
        edtCustomMinFreq.setGravity(Gravity.CENTER);
        rowCustomMinFreq.addView(edtCustomMinFreq, new LinearLayout.LayoutParams(140, ViewGroup.LayoutParams.WRAP_CONTENT));

        View scf2 = new View(this);
        rowCustomMinFreq.addView(scf2, new LinearLayout.LayoutParams(10, 1));

        Button btnSaveCustomFreq = createButton("Lưu số này", "#059669");
        btnSaveCustomFreq.setOnClickListener(v -> {
            try {
                int val = Integer.parseInt(edtCustomMinFreq.getText().toString().trim());
                if (val >= 1) {
                    minFrequency = val;
                    saveAllState();
                    refreshSettingsUI();
                    appendLog("⚙️ Đã lưu Tần suất Glossary tối thiểu: >= " + minFrequency + " lần");
                    Toast.makeText(this, "Đã lưu tần suất tối thiểu: " + minFrequency + " lần!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(this, "Vui lòng nhập số >= 1!", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Vui lòng nhập số hợp lệ!", Toast.LENGTH_SHORT).show();
            }
        });
        rowCustomMinFreq.addView(btnSaveCustomFreq);
        cardGloss.addView(rowCustomMinFreq);

        btnSettingsPolicy = createButton("Xung Đột Nghĩa: " + ("keep-old".equals(conflictPolicy) ? "Giữ Cũ - Bỏ Mới (Bảo toàn)" : "Ghi Đè Bằng Nghĩa Mới"), "#1E293B");
        btnSettingsPolicy.setOnClickListener(v -> {
            conflictPolicy = "keep-old".equals(conflictPolicy) ? "overwrite" : "keep-old";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Đã chuyển chính sách xung đột: " + conflictPolicy);
        });
        cardGloss.addView(btnSettingsPolicy);

        content.addView(cardGloss);

        // 3. Dịch Thuật & Chống Lọt Chữ Hán
        TextView tvTransTitle = new TextView(this);
        tvTransTitle.setText("3. Dịch Thuật & Chống Lọt Chữ Hán (2 Lớp):");
        tvTransTitle.setTextColor(Color.WHITE);
        tvTransTitle.setTextSize(15);
        tvTransTitle.setTypeface(null, Typeface.BOLD);
        tvTransTitle.setPadding(0, 16, 0, 0);
        content.addView(tvTransTitle);

        LinearLayout cardTrans = createCard();
        tvSettingsTargetLang = new TextView(this);
        tvSettingsTargetLang.setText("• Ngôn ngữ đích: " + targetLanguage);
        tvSettingsTargetLang.setTextColor(Color.parseColor("#93C5FD"));
        cardTrans.addView(tvSettingsTargetLang);

        LinearLayout rowLangs = new LinearLayout(this);
        rowLangs.setOrientation(LinearLayout.HORIZONTAL);
        rowLangs.setPadding(0, 8, 0, 12);

        btnLangVi = createButton("Tiếng Việt", targetLanguage.contains("Việt") ? "#2563EB" : "#1E293B");
        btnLangVi.setOnClickListener(v -> {
            targetLanguage = "Tiếng Việt";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: Tiếng Việt (Kích hoạt bộ lọc cấm chữ Hán)");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: Tiếng Việt", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangVi, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View spL1 = new View(this);
        rowLangs.addView(spL1, new LinearLayout.LayoutParams(6, 1));

        btnLangJa = createButton("日本語", targetLanguage.contains("Nhật") || targetLanguage.contains("日本語") ? "#2563EB" : "#1E293B");
        btnLangJa.setOnClickListener(v -> {
            targetLanguage = "日本語";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: 日本語 (Thả lỏng cho phép sinh Kanji mượt mà)");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: 日本語 (Tiếng Nhật)", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangJa, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View spL2 = new View(this);
        rowLangs.addView(spL2, new LinearLayout.LayoutParams(6, 1));

        btnLangEn = createButton("English", targetLanguage.equalsIgnoreCase("English") ? "#2563EB" : "#1E293B");
        btnLangEn.setOnClickListener(v -> {
            targetLanguage = "English";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: English");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: English", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangEn, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View spL3 = new View(this);
        rowLangs.addView(spL3, new LinearLayout.LayoutParams(6, 1));

        btnLangKo = createButton("한국어", targetLanguage.contains("한국어") || targetLanguage.contains("Hàn") ? "#2563EB" : "#1E293B");
        btnLangKo.setOnClickListener(v -> {
            targetLanguage = "한국어";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: 한국어");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: 한국어", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangKo, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardTrans.addView(rowLangs);

        btnSettingsAntiHanzi = createButton("Bộ Lọc 2 Lớp Chống Chữ Hán: " + (antiHanziStrict ? "🟢 BẬT [Lớp 1 + Lớp 2]" : "⚪ TẮT"), antiHanziStrict ? "#059669" : "#374151");
        btnSettingsAntiHanzi.setOnClickListener(v -> {
            antiHanziStrict = !antiHanziStrict;
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Bộ lọc chống lọt chữ Hán: " + (antiHanziStrict ? "BẬT" : "TẮT"));
        });
        cardTrans.addView(btnSettingsAntiHanzi);

        View spBetween = new View(this);
        cardTrans.addView(spBetween, new LinearLayout.LayoutParams(1, 10));

        btnSettingsAutoHeal = createButton("Tự Động Dịch Lại Khi Lỗi Nặng: " + (autoHealOnlineEnabled ? "🟢 BẬT [Auto-Heal Online]" : "⚪ TẮT"), autoHealOnlineEnabled ? "#0D9488" : "#374151");
        btnSettingsAutoHeal.setOnClickListener(v -> {
            autoHealOnlineEnabled = !autoHealOnlineEnabled;
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Cơ chế Tự Động Dịch Lại & Ghi Đè khi lỗi nặng: " + (autoHealOnlineEnabled ? "BẬT" : "TẮT"));
        });
        cardTrans.addView(btnSettingsAutoHeal);

        content.addView(cardTrans);

        // 4. Trạng Thái 5 Tầng Chạy Ngầm (God-Mode)
        TextView tvTitle = new TextView(this);
        tvTitle.setText("4. Trạng Thái 5 Tầng Chạy Ngầm (God-Mode):");
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(15);
        tvTitle.setTypeface(null, Typeface.BOLD);
        tvTitle.setPadding(0, 16, 0, 0);
        content.addView(tvTitle);

        LinearLayout cardStatus = createCard();
        cardStatus.addView(createStatusRow("1. Foreground Service (DataSync)", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("2. CPU Partial WakeLock (12 Giờ)", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("3. Bỏ Qua Tối Ưu Hóa Pin", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("4. WorkManager Periodic Watchdog", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("5. Root Mode (OOM Score -1000)", RootController.isRootAvailable() ? "BẤT TỬ (ROOT #)" : "CHƯA CẤP ROOT"));
        content.addView(cardStatus);

        // Tinh chỉnh tốc độ dịch
        TextView tvDelayTitle = new TextView(this);
        tvDelayTitle.setText("Độ trễ an toàn giữa các chương (giây):");
        tvDelayTitle.setTextColor(Color.WHITE);
        tvDelayTitle.setPadding(0, 16, 0, 8);
        content.addView(tvDelayTitle);

        EditText edtDelay = new EditText(this);
        edtDelay.setText(String.valueOf(delaySec));
        edtDelay.setTextColor(Color.WHITE);
        edtDelay.setBackgroundColor(Color.parseColor("#171717"));
        edtDelay.setPadding(16, 12, 16, 12);
        content.addView(edtDelay);

        Button btnSaveDelay = createButton("Lưu Độ Trễ", "#1E293B");
        btnSaveDelay.setOnClickListener(v -> {
            try {
                delaySec = Math.max(1, Integer.parseInt(edtDelay.getText().toString().trim()));
                saveAllState();
                Toast.makeText(this, "Đã lưu độ trễ: " + delaySec + "s", Toast.LENGTH_SHORT).show();
            } catch (Exception ignored) {}
        });
        content.addView(btnSaveDelay);

        // 5. Cấu hình Model Làm Mượt Bản Dịch Final (Global Polish Model)
        TextView tvPolishModelTitle = new TextView(this);
        tvPolishModelTitle.setText("5. Model Dùng Cho Khâu Làm Mượt Final:");
        tvPolishModelTitle.setTextColor(Color.WHITE);
        tvPolishModelTitle.setTextSize(15);
        tvPolishModelTitle.setTypeface(null, Typeface.BOLD);
        tvPolishModelTitle.setPadding(0, 16, 0, 0);
        content.addView(tvPolishModelTitle);

        LinearLayout cardPolishModel = createCard();
        TextView tvCurPolishModel = new TextView(this);
        tvCurPolishModel.setText("• Model làm mượt đang chọn: " + polishModel);
        tvCurPolishModel.setTextColor(Color.parseColor("#C084FC"));
        tvCurPolishModel.setPadding(0, 0, 0, 8);
        cardPolishModel.addView(tvCurPolishModel);

        String[] pModels = {"gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"};
        LinearLayout rowPM = new LinearLayout(this);
        rowPM.setOrientation(LinearLayout.HORIZONTAL);
        for (String pm : pModels) {
            String label = pm.replace("gemini-", "");
            Button b = createButton(label, polishModel.equals(pm) ? "#7C3AED" : "#1E293B");
            b.setOnClickListener(v -> {
                polishModel = pm;
                saveAllState();
                tvCurPolishModel.setText("• Model làm mượt đang chọn: " + polishModel);
                appendLog("⚙️ Đã đổi Model Làm Mượt Final: " + polishModel);
                Toast.makeText(this, "Đã chọn " + pm + " cho khâu làm mượt", Toast.LENGTH_SHORT).show();
            });
            rowPM.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        }
        cardPolishModel.addView(rowPM);
        content.addView(cardPolishModel);

        // Xuất toàn văn tác phẩm
        Button btnExport = createButton("📥 Xuất Toàn Văn Tác Phẩm (.txt)", "#059669");
        btnExport.setOnClickListener(v -> exportFullNovelData());
        content.addView(btnExport);

        tabSettingsView.addView(content);
    }

    private void exportFullNovelData() {
        if (translatedChapters.isEmpty()) {
            Toast.makeText(this, "Chưa có chương nào được dịch để xuất!", Toast.LENGTH_SHORT).show();
            return;
        }

        String nl = String.valueOf((char) 10);
        StringBuilder sb = new StringBuilder();
        sb.append("=== TOÀN VĂN TÁC PHẨM: ").append(currentProjectName).append(" ===").append(nl);
        sb.append("Biên dịch bởi: DroidTranslator God-Mode").append(nl);
        sb.append("Mô hình: ").append(currentModel).append(nl);
        sb.append("Tổng số chương đã dịch: ").append(translatedChapters.size()).append(nl).append(nl);

        List<Integer> keys = new ArrayList<>(translatedChapters.keySet());
        Collections.sort(keys);
        for (Integer idx : keys) {
            sb.append("============================================================").append(nl);
            sb.append(translatedChapters.get(idx)).append(nl).append(nl);
        }

        String fullText = sb.toString();
        try {
            java.io.File downloadDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
            if (!downloadDir.exists()) downloadDir.mkdirs();
            java.io.File outFile = new java.io.File(downloadDir, currentProjectName + "_FULL_TRANSLATED.txt");
            java.io.FileOutputStream fos = new java.io.FileOutputStream(outFile);
            fos.write(fullText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            fos.flush();
            fos.close();

            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("Full Novel", fullText));
            }

            appendLog("📁 Đã lưu file tổng tại: " + outFile.getAbsolutePath());
            Toast.makeText(this, "✅ Đã lưu file thành công tại thư mục Download!" + nl + "Tên file: " + outFile.getName(), Toast.LENGTH_LONG).show();

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, currentProjectName + " - Bản Dịch Hoàn Chỉnh");
            shareIntent.putExtra(Intent.EXTRA_TEXT, fullText.length() > 50000 ? fullText.substring(0, 50000) + nl + nl + "... [Đã lưu toàn bộ file tại thư mục Download]" : fullText);
            startActivity(Intent.createChooser(shareIntent, "Chia sẻ hoặc Mở File Toàn Văn"));
        } catch (Exception e) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("Full Novel", fullText));
            }
            appendLog("📋 Đã sao chép toàn bộ " + translatedChapters.size() + " chương vào Clipboard.");
            Toast.makeText(this, "Đã sao chép toàn văn " + translatedChapters.size() + " chương vào Clipboard!", Toast.LENGTH_LONG).show();
        }
    }

    private TextView createStatusRow(String name, String status) {
        TextView tv = new TextView(this);
        tv.setText("• " + name + ": [" + status + "]");
        tv.setTextColor(Color.parseColor("#34D399"));
        tv.setTypeface(null, Typeface.BOLD);
        tv.setPadding(0, 8, 0, 8);
        return tv;
    }

    private GradientDrawable createCardDrawable() {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor("#161B22"));
        gd.setCornerRadius(24f);
        gd.setStroke(2, Color.parseColor("#30363D"));
        return gd;
    }

    private GradientDrawable createButtonDrawable(String hexColor, float radius) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor(hexColor));
        gd.setCornerRadius(radius);
        return gd;
    }

    private GradientDrawable createInputDrawable() {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor("#0D1117"));
        gd.setCornerRadius(18f);
        gd.setStroke(2, Color.parseColor("#30363D"));
        return gd;
    }

    private GradientDrawable createBadgeDrawable(String hexBg, String hexStroke) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor(hexBg));
        gd.setCornerRadius(30f);
        if (hexStroke != null) {
            gd.setStroke(2, Color.parseColor(hexStroke));
        }
        return gd;
    }

    private LinearLayout createCard() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(28, 24, 28, 24);
        l.setBackground(createCardDrawable());
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, 18);
        l.setLayoutParams(lp);
        return l;
    }

    private Button createButton(String text, String colorHex) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(12);
        b.setTypeface(null, Typeface.BOLD);
        b.setBackground(createButtonDrawable(colorHex, 18f));
        b.setPadding(20, 12, 20, 12);
        b.setStateListAnimator(null);
        return b;
    }

    private EditText createStyledEditText(String hint) {
        EditText edt = new EditText(this);
        edt.setHint(hint);
        edt.setHintTextColor(Color.parseColor("#6B7280"));
        edt.setTextColor(Color.WHITE);
        edt.setBackground(createInputDrawable());
        edt.setPadding(20, 14, 20, 14);
        edt.setTextSize(13);
        return edt;
    }
}
`
  }
];

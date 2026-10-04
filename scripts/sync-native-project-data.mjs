import fs from 'fs';
import path from 'path';

const filesToSync = [
  { path: '.github/workflows/build-apk.yml', lang: 'properties', desc: 'Quy trình GitHub Actions tự động build APK với Gradle 8.7 và JDK 17' },
  { path: 'gradle.properties', file: 'android/gradle.properties', lang: 'properties', desc: 'Cấu hình JVM 2GB và AndroidX' },
  { path: 'build.gradle', file: 'android/build.gradle', lang: 'groovy', desc: 'Root build.gradle với AGP 8.4.2' },
  { path: 'settings.gradle', file: 'android/settings.gradle', lang: 'groovy', desc: 'Settings.gradle khai báo module app' },
  { path: 'gradle/wrapper/gradle-wrapper.properties', file: 'android/gradle/wrapper/gradle-wrapper.properties', lang: 'properties', desc: 'Cấu hình Gradle Wrapper 8.7' },
  { path: 'app/build.gradle', file: 'android/app/build.gradle', lang: 'groovy', desc: 'Module app gradle siêu nhẹ chuẩn Android 14+' },
  { path: 'app/src/main/AndroidManifest.xml', file: 'android/app/src/main/AndroidManifest.xml', lang: 'xml', desc: 'AndroidManifest khai báo 5 lớp chạy ngầm và quyền' },
  { path: 'app/src/main/res/values/colors.xml', file: 'android/app/src/main/res/values/colors.xml', lang: 'xml', desc: 'Bảng màu OLED Dark Glass & Gradients' },
  { path: 'app/src/main/res/values/styles.xml', file: 'android/app/src/main/res/values/styles.xml', lang: 'xml', desc: 'Styles định nghĩa ShapeAppearance bo góc và Dark Theme' },
  { path: 'app/src/main/res/values/strings.xml', file: 'android/app/src/main/res/values/strings.xml', lang: 'xml', desc: 'Chuỗi tài nguyên ứng dụng' },
  { path: 'app/src/main/res/values/themes.xml', file: 'android/app/src/main/res/values/themes.xml', lang: 'xml', desc: 'Theme Material Components Dark Glass' },
  { path: 'app/src/main/res/drawable/bg_card_glass.xml', file: 'android/app/src/main/res/drawable/bg_card_glass.xml', lang: 'xml', desc: 'Drawable card glass bo góc 20dp viền glow' },
  { path: 'app/src/main/res/drawable/bg_floating_bottom_bar.xml', file: 'android/app/src/main/res/drawable/bg_floating_bottom_bar.xml', lang: 'xml', desc: 'Drawable Floating Bottom Bar bo góc 28dp' },
  { path: 'app/src/main/res/drawable/bg_btn_gradient_orange.xml', file: 'android/app/src/main/res/drawable/bg_btn_gradient_orange.xml', lang: 'xml', desc: 'Nút bấm gradient cam với ripple effect' },
  { path: 'app/src/main/res/drawable/bg_btn_gradient_cyan.xml', file: 'android/app/src/main/res/drawable/bg_btn_gradient_cyan.xml', lang: 'xml', desc: 'Nút bấm gradient cyan với ripple effect' },
  { path: 'app/src/main/res/drawable/bg_btn_gradient_purple.xml', file: 'android/app/src/main/res/drawable/bg_btn_gradient_purple.xml', lang: 'xml', desc: 'Nút bấm gradient purple với ripple effect' },
  { path: 'app/src/main/res/drawable/bg_btn_gradient_emerald.xml', file: 'android/app/src/main/res/drawable/bg_btn_gradient_emerald.xml', lang: 'xml', desc: 'Nút bấm gradient emerald với ripple effect' },
  { path: 'app/src/main/res/drawable/bg_btn_dark_card.xml', file: 'android/app/src/main/res/drawable/bg_btn_dark_card.xml', lang: 'xml', desc: 'Nút bấm card tối bo góc 14dp' },
  { path: 'app/src/main/res/drawable/bg_badge_active.xml', file: 'android/app/src/main/res/drawable/bg_badge_active.xml', lang: 'xml', desc: 'Badge trạng thái active xanh ngọc' },
  { path: 'app/src/main/res/drawable/bg_badge_error.xml', file: 'android/app/src/main/res/drawable/bg_badge_error.xml', lang: 'xml', desc: 'Badge trạng thái error đỏ ruby' },
  { path: 'app/src/main/res/drawable/bg_input_dark.xml', file: 'android/app/src/main/res/drawable/bg_input_dark.xml', lang: 'xml', desc: 'Background ô nhập liệu bo góc 14dp' },
  { path: 'app/src/main/res/drawable/bg_pill_button.xml', file: 'android/app/src/main/res/drawable/bg_pill_button.xml', lang: 'xml', desc: 'Pill button bo tròn 50dp' },
  { path: 'app/src/main/java/com/droidtranslator/app/model/ApiKeyItem.java', file: 'android/app/src/main/java/com/droidtranslator/app/model/ApiKeyItem.java', lang: 'java', desc: 'Model ApiKeyItem' },
  { path: 'app/src/main/java/com/droidtranslator/app/model/PromptCardItem.java', file: 'android/app/src/main/java/com/droidtranslator/app/model/PromptCardItem.java', lang: 'java', desc: 'Model PromptCardItem' },
  { path: 'app/src/main/java/com/droidtranslator/app/GlossaryManager.java', file: 'android/app/src/main/java/com/droidtranslator/app/GlossaryManager.java', lang: 'java', desc: 'Glossary Manager' },
  { path: 'app/src/main/java/com/droidtranslator/app/SinoVietnameseDictionary.java', file: 'android/app/src/main/java/com/droidtranslator/app/SinoVietnameseDictionary.java', lang: 'java', desc: 'Từ điển Hán-Việt 1500+ từ' },
  { path: 'app/src/main/java/com/droidtranslator/app/ChapterAuditor.java', file: 'android/app/src/main/java/com/droidtranslator/app/ChapterAuditor.java', lang: 'java', desc: 'Bộ thẩm định chất lượng chương' },
  { path: 'app/src/main/java/com/droidtranslator/app/GeminiEngine.java', file: 'android/app/src/main/java/com/droidtranslator/app/GeminiEngine.java', lang: 'java', desc: 'Động cơ Gemini Engine 2.5/3.6 Flash' },
  { path: 'app/src/main/java/com/droidtranslator/app/service/TranslationForegroundService.java', file: 'android/app/src/main/java/com/droidtranslator/app/service/TranslationForegroundService.java', lang: 'java', desc: 'Foreground Service chạy ngầm 12h' },
  { path: 'app/src/main/java/com/droidtranslator/app/engine/HanziSweeperEngine.java', file: 'android/app/src/main/java/com/droidtranslator/app/engine/HanziSweeperEngine.java', lang: 'java', desc: 'Động cơ quét sạch chữ Hán' },
  { path: 'app/src/main/java/com/droidtranslator/app/engine/RootController.java', file: 'android/app/src/main/java/com/droidtranslator/app/engine/RootController.java', lang: 'java', desc: 'Root Controller OOM Score -1000' },
  { path: 'app/src/main/java/com/droidtranslator/app/MainActivity.java', file: 'android/app/src/main/java/com/droidtranslator/app/MainActivity.java', lang: 'java', desc: 'MainActivity OLED Dark Glass Native Java' }
];

const entries = [];

for (const f of filesToSync) {
  const filePath = f.file || f.path;
  if (!fs.existsSync(filePath)) {
    console.warn("File does not exist, skipping:", filePath);
    continue;
  }
  const rawContent = fs.readFileSync(filePath, 'utf8');
  entries.push({
    path: f.path,
    language: f.lang,
    description: f.desc,
    content: rawContent
  });
}

const header = `import { ProjectFileEntry } from './types';\n\nexport const NATIVE_PROJECT_FILES: ProjectFileEntry[] = [\n`;
const footer = `\n];\n`;

const body = entries.map(e => {
  return `  {
    path: ${JSON.stringify(e.path)},
    language: ${JSON.stringify(e.language)},
    description: ${JSON.stringify(e.description)},
    content: ${JSON.stringify(e.content)}
  }`;
}).join(',\n');

fs.writeFileSync('src/native-project-data.ts', header + body + footer, 'utf8');
console.log("Successfully synced " + entries.length + " files to src/native-project-data.ts!");

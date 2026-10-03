# Kế Hoạch Triển Khai: Tự Động Build APK Qua GitHub Actions

Dựa trên phản hồi của bạn, chúng ta sẽ thiết lập một quy trình CI/CD hoàn chỉnh và tối giản nhất trong repo, đảm bảo **100% không bị lỗi build môi trường trên GitHub** khi bạn push mã nguồn lên.

---

## 1. Mục Tiêu & Tiêu Chí Tối Giản (Zero-Build-Error)
- **Cấu trúc độc lập:** Đặt toàn bộ mã nguồn Android sạch vào thư mục `android/`, tách biệt với ứng dụng Web hiện tại.
- **Không cần Keystore:** Build trực tiếp `assembleDebug`, sinh ra file `app-debug.apk` có thể cài đặt ngay lập tức trên mọi thiết bị Android mà không cần tạo hay cấu hình Secret Keystore trên GitHub.
- **Gradle Wrapper chuẩn:** Cung cấp đầy đủ `gradlew`, `gradlew.bat` và `gradle-wrapper.properties` (Gradle 8.2) để GitHub runner tự động tải đúng bản Gradle tương thích, không phụ thuộc vào môi trường máy local.
- **Tương thích Java 17 & Android SDK 34 (Android 14/15/16):** Cấu hình tương thích chuẩn với runner `ubuntu-latest`.

---

## 2. Các Thành Phần Sẽ Được Tạo & Cấu Hình

### A. Cấu trúc Android tối giản (`android/`)
1. **`android/gradle/wrapper/gradle-wrapper.properties`:** Cấu hình Gradle `8.2-bin`.
2. **`android/gradlew` & `android/gradlew.bat`:** Tệp script thực thi Gradle (được cấp quyền `chmod +x`).
3. **`android/gradle.properties`:** Cấu hình cấp phát bộ nhớ JVM (`-Xmx2048m`) và bật `android.useAndroidX=true`.
4. **`android/settings.gradle`:** Khai báo project `:app` và repository `google()`, `mavenCentral()`.
5. **`android/build.gradle`:** Cấu hình Android Gradle Plugin `8.2.2`.
6. **`android/app/build.gradle`:** 
   - `compileSdk 34`, `minSdk 26`, `targetSdk 34`
   - Chỉ thêm các thư viện tối thiểu cần thiết đã được kiểm chứng: `androidx.appcompat`, `material`, `okhttp3`, `gson`, `androidx.work:work-runtime`.
7. **`android/app/src/main/AndroidManifest.xml`:** Khai báo quyền chạy nền God-Mode, Foreground Service và Activity chính.
8. **Mã nguồn Java:** Đưa toàn bộ 9 tệp Java đã được kiểm định cú pháp 0 lỗi sang `android/app/src/main/java/com/droidtranslator/app/`:
   - `MainActivity.java`
   - `GeminiEngine.java`
   - `ChapterAuditor.java`
   - `SinoVietnameseDictionary.java`
   - `GlossaryManager.java`
   - `TranslationForegroundService.java`
   - `RootController.java`
   - `ApiKeyItem.java`
   - `PromptCardItem.java`
9. **Resources:** Biểu tượng Vector Adaptive Icon (`ic_launcher_foreground.xml`), `strings.xml`, `colors.xml`, `themes.xml`.

---

### B. Quy trình GitHub Actions CI/CD (`.github/workflows/build-apk.yml`)
Workflow chạy trên `ubuntu-latest` với các bước:
1. **Trigger:** Kích hoạt tự động khi:
   - `push` lên bất kỳ nhánh nào (bao gồm `main`, `master`).
   - `push tags` dạng `v*` (ví dụ: `v1.0.0`).
   - Cho phép kích hoạt thủ công từ giao diện GitHub qua `workflow_dispatch`.
2. **Setup JDK 17:** Sử dụng `actions/setup-java@v4` với distribution Temurin ổn định nhất.
3. **Gradle Cache:** Tích hợp `gradle/actions/setup-gradle@v4` để tăng tốc độ build các lần sau.
4. **Quyền thực thi:** Chạy `chmod +x android/gradlew`.
5. **Biên dịch:** Chạy `./gradlew assembleDebug --no-daemon --stacktrace`.
6. **Lưu Artifacts:** Upload file APK đã build thành công lên GitHub Actions Artifacts với tên `DroidTranslator-Debug-APK` (thời hạn lưu trữ 30 ngày).
7. **Tạo GitHub Release (khi có Tag):** Khi bạn tạo Git tag (vd: `git tag v1.0.0 && git push origin v1.0.0`), action sẽ tự động tạo một GitHub Release và đính kèm trực tiếp file `.apk` vào Release để bạn tải về từ điện thoại.

---

## 3. Các Bước Xác Minh
1. Kiểm tra quyền thực thi của `android/gradlew`.
2. Kiểm tra tính toàn vẹn cú pháp của các tệp Gradle và Manifest.
3. Chạy `compile_applet` và `lint_applet` để bảo đảm ứng dụng Web và trình xem mã nguồn vẫn hoạt động trơn tru 100%.

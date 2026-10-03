# DroidTranslator Native Android Project

Dự án Android Native độc lập được thiết kế tối giản, sẵn sàng build APK tự động 100% qua GitHub Actions mà không lo lỗi môi trường hay thiếu Keystore.

---

## 🚀 Tự Động Build APK Qua GitHub Actions

### 1. Cách nhận file APK cài đặt ngay:
- **Tự động kích hoạt:** Mỗi khi bạn `git push` mã nguồn lên GitHub (bất kỳ branch nào), GitHub Actions sẽ tự động khởi chạy workflow `.github/workflows/build-apk.yml`.
- **Tải APK về máy:**
  1. Vào tab **Actions** trên repository GitHub của bạn.
  2. Bấm vào lượt chạy mới nhất (**Build Android APK**).
  3. Cuộn xuống phần **Artifacts**, bạn sẽ thấy mục **`DroidTranslator-Debug-APK`**.
  4. Bấm tải về, giải nén và cài trực tiếp file `.apk` vào điện thoại Android.

### 2. Tự động tạo GitHub Release khi gắn Tag:
Khi bạn muốn tạo một bản phát hành chính thức:
```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions sẽ tự động tạo một **GitHub Release** hoàn chỉnh và đính kèm trực tiếp file `.apk` vào phần tải về của Release.

---

## 🛠️ Biên Dịch Bằng Android Studio hoặc Local CLI

### 1. Mở trong Android Studio:
- Khởi động Android Studio $\rightarrow$ Chọn **Open an Existing Project** $\rightarrow$ Trỏ tới thư mục `android/`.
- Chờ Gradle đồng bộ và bấm nút **Run** (Shift + F10) hoặc **Build > Build APK(s)**.

### 2. Biên dịch bằng dòng lệnh (Terminal):
```bash
cd android
./gradlew assembleDebug
```
File APK sẽ xuất hiện tại: `android/app/build/outputs/apk/debug/app-debug.apk`.

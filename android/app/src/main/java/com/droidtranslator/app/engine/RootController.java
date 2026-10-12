package com.droidtranslator.app.engine;

import android.os.Process;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;

public class RootController {

    private static final String PKG_NAME = "com.droidtranslator.app";

    public static boolean isRootAvailable() {
        try {
            java.lang.Process process = Runtime.getRuntime().exec(new String[]{"su", "-c", "id"});
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kích hoạt 5 Lớp Miễn Nhiễm Cốt Lõi God-Mode Cấp Kernel & Cgroup:
     * Lớp 1: OOM Score Adj = -1000 (Miễn nhiễm LMK Out-Of-Memory Killer tuyệt đối)
     * Lớp 2: Phantom Process Killer = 2147483647 (Vô hiệu hóa bộ đếm tiến trình ảo của Android 12+)
     * Lớp 3: Cached App Freezer = FALSE (Vô hiệu hóa cơ chế đóng băng tiến trình khi chuyển app/đa nhiệm)
     * Lớp 4: Doze & Battery Optimization Whitelist (Miễn nhiễm chế độ ngủ sâu màn hình)
     * Lớp 5: Unlimited Background Bucket & AppOps (Cho phép chạy ngầm và giữ WakeLock vô hạn định)
     */
    public static boolean applyGodModeKernelProtection() {
        try {
            int pid = Process.myPid();
            java.lang.Process process = Runtime.getRuntime().exec("su");
            DataOutputStream os = new DataOutputStream(process.getOutputStream());

            // Lớp 1: Khóa OOM Score cao nhất (-1000)
            os.writeBytes("echo -1000 > /proc/" + pid + "/oom_score_adj\n");

            // Lớp 2: Phantom Processes vô hạn
            os.writeBytes("device_config put activity_manager max_phantom_processes 2147483647\n");

            // Lớp 3: Tắt Cached App Freezer (Nguyên nhân chính gây dừng dịch khi mở đa nhiệm trên Android 11-15)
            os.writeBytes("device_config put activity_manager use_freezer false\n");
            os.writeBytes("settings put global cached_apps_freezer 0\n");

            // Lớp 4: Thêm vào Whitelist DeviceIdle (Bỏ qua Doze mode khi tắt màn hình)
            os.writeBytes("dumpsys deviceidle whitelist +" + PKG_NAME + "\n");
            os.writeBytes("cmd deviceidle whitelist +" + PKG_NAME + "\n");

            // Lớp 5: Đặt Standby Bucket ở mức ACTIVE và mở toàn quyền AppOps chạy ngầm
            os.writeBytes("am set-standby-bucket " + PKG_NAME + " active\n");
            os.writeBytes("cmd appops set " + PKG_NAME + " RUN_IN_BACKGROUND allow\n");
            os.writeBytes("cmd appops set " + PKG_NAME + " RUN_ANY_IN_BACKGROUND allow\n");
            os.writeBytes("cmd appops set " + PKG_NAME + " WAKE_LOCK allow\n");

            // Đảm bảo thư mục lưu trữ Download DroidTranslator tồn tại với quyền 777
            os.writeBytes("mkdir -p /sdcard/Download/DroidTranslator\n");
            os.writeBytes("chmod 777 /sdcard/Download/DroidTranslator\n");

            os.writeBytes("exit\n");
            os.flush();
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Xuất tệp tin trực tiếp qua quyền Root vào /sdcard/Download/DroidTranslator
     * Vượt qua mọi rào cản Scoped Storage của Android
     */
    public static boolean writeBytesWithRoot(String destPath, byte[] data) {
        if (!isRootAvailable() || data == null) return false;
        File tempFile = null;
        try {
            tempFile = File.createTempFile("dt_export_", ".tmp");
            FileOutputStream fos = new FileOutputStream(tempFile);
            fos.write(data);
            fos.flush();
            fos.close();

            java.lang.Process process = Runtime.getRuntime().exec("su");
            DataOutputStream os = new DataOutputStream(process.getOutputStream());
            os.writeBytes("cp " + tempFile.getAbsolutePath() + " \"" + destPath + "\"\n");
            os.writeBytes("chmod 666 \"" + destPath + "\"\n");
            os.writeBytes("am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d \"file://" + destPath + "\"\n");
            os.writeBytes("exit\n");
            os.flush();
            boolean ok = process.waitFor() == 0;
            if (tempFile.exists()) tempFile.delete();
            return ok;
        } catch (Exception e) {
            if (tempFile != null && tempFile.exists()) tempFile.delete();
            return false;
        }
    }
}

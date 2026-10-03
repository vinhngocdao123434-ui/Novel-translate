import React, { useState } from 'react';
import { 
  X, Shield, ShieldCheck, Cpu, Zap, Activity, AlertTriangle, 
  Terminal, CheckCircle2, Copy, Check, ExternalLink 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GodModeInspectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const fullScript = `#!/bin/sh
# 👑 SCRIPT KÍCH HOẠT TRỌN VẸN 5 LỚP GOD-MODE (ANDROID 12 - 16)
PKG="com.droidtranslator.app"
PID=$(pidof $PKG)

# LỚP 1: ÉP ĐIỂM OOM SCORE = -1000 (KERNEL LMK PROTECTION)
if [ -n "$PID" ] && [ -f "/proc/$PID/oom_score_adj" ]; then
    echo -1000 > /proc/$PID/oom_score_adj
    echo "✓ [Lớp 1] Khóa OOM -1000 cho PID $PID thành công!"
fi

# LỚP 4: KHẮC CHẾ PHANTOM PROCESS KILLER & APP FREEZER
device_config set_sync_disabled_for_tests persistent
device_config put activity_manager max_phantom_processes 2147483647
settings put global settings_enable_monitor_phantom_procs false
echo "✓ [Lớp 4] Đã vô hiệu hóa Phantom Process Killer!"

# LỚP 5: VƯỢT RÀO DOZE MODE & TRÌNH DIỆT PIN OEM
dumpsys deviceidle whitelist +$PKG
cmd appops set $PKG RUN_IN_BACKGROUND allow
cmd appops set $PKG RUN_ANY_IN_BACKGROUND allow
echo "✓ [Lớp 5] Whitelist Doze & PowerKeeper hoàn tất!"`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(fullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const layers = [
    {
      num: 1,
      title: "Lớp 1: Khóa OOM Score = -1000 (Kernel Low Memory Killer Immunity)",
      threat: "Kẻ thù: Linux Kernel LMK khi RAM cạn kiệt",
      solution: "Ghi đè giá trị -1000 vào /proc/[PID]/oom_score_adj thông qua quyền Root (su). Mức -1000 tương đương với tiến trình cốt lõi của Android System (init, zygote), khiến Linux Kernel tuyệt đối không bao giờ phát lệnh SIGKILL giải phóng RAM.",
      command: "su -c 'echo -1000 > /proc/[PID]/oom_score_adj'",
      type: "Root Kernel Script"
    },
    {
      num: 2,
      title: "Lớp 2: Foreground Service + Ongoing Notification (Android Framework)",
      threat: "Kẻ thù: ActivityManager / ProcessManager của Android kill tiến trình nền khi Activity bị đóng",
      solution: "Khởi chạy Android Foreground Service với kiểu android:foregroundServiceType='dataSync' và gắn kèm Persistent Notification độ ưu tiên cao nhất (IMPORTANCE_HIGH). Ngăn không cho hệ điều hành thu hồi tiến trình.",
      command: "serviceInstance.startForeground(ID, notification, FOREGROUND_SERVICE_TYPE_DATA_SYNC)",
      type: "Native Android Java SDK"
    },
    {
      num: 3,
      title: "Lớp 3: Hardware WakeLock & High-Performance WifiLock (Hardware Layer)",
      threat: "Kẻ thù: CPU Throttling, tắt xung nhịp CPU và ngắt kết nối Wifi khi màn hình tắt",
      solution: "Giữ phần cứng CPU thức thông qua PowerManager.PARTIAL_WAKE_LOCK và duy trì card mạng Wifi ở chế độ full băng thông qua WifiManager.WIFI_MODE_FULL_HIGH_PERF. Đảm bảo request gửi Gemini API không bị timeout dù khóa màn hình nhiều giờ.",
      command: "pm.newWakeLock(PARTIAL_WAKE_LOCK).acquire() + wm.createWifiLock(WIFI_MODE_FULL_HIGH_PERF).acquire()",
      type: "Native Android Java SDK"
    },
    {
      num: 4,
      title: "Lớp 4: Khắc chế Phantom Process Killer & App Freezer (Android 12 - 16)",
      threat: "Kẻ thù: Cơ chế đếm tiến trình con (Child Process Freezer) tự động diệt sạch app ngầm trên Android 12-16",
      solution: "Từ Android 12 trở đi, hệ thống phát lệnh diệt sạch các app chạy ngầm giữ WebSocket/Regex/API nếu có nhiều child processes. Lớp 4 nâng giới hạn max_phantom_processes lên 2147483647 (vô hạn) và tắt giám sát phantom processes.",
      command: "device_config put activity_manager max_phantom_processes 2147483647 && settings put global settings_enable_monitor_phantom_procs false",
      type: "DeviceConfig & Settings Root/ADB"
    },
    {
      num: 5,
      title: "Lớp 5: Vượt rào Doze Mode & Trình diệt Pin của OEM (Xiaomi, Oppo, Samsung)",
      threat: "Kẻ thù: Bộ quản lý pin của hãng (Xiaomi PowerKeeper, Samsung One UI Device Care, ColorOS...)",
      solution: "Các hãng sản xuất cài cắm các trình quản lý AI riêng tự động kill app sau 10-15 phút tắt màn hình. Lớp 5 ép gói ứng dụng vào Whitelist Doze Mode vĩnh viễn và cấp phép RUN_IN_BACKGROUND cho appops.",
      command: "dumpsys deviceidle whitelist +[pkg] && cmd appops set [pkg] RUN_IN_BACKGROUND allow",
      type: "AppOps & DeviceIdle Dumpsys"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-100 text-base">Hệ Thống 5 Lớp "God Mode" Bảo Vệ Dịch Ngầm Xuyên Đêm</h2>
              <p className="text-xs text-neutral-400">Khắc phục toàn diện giới hạn của oom_score_adj = -1000 trên Android 14–16</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-neutral-300 text-xs leading-relaxed">
          {/* Why OOM -1000 is not enough */}
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Tại sao chỉ dùng đơn độc oom_score_adj = -1000 là chưa đủ?</span>
            </div>
            <p className="text-neutral-300">
              <strong className="text-white">oom_score_adj = -1000</strong> chỉ giải quyết đúng 1 kẻ thù: <em>Low Memory Killer (LMK)</em> của Linux Kernel khi đầy RAM. Tuy nhiên trên các bản Android hiện đại (đặc biệt từ Android 12 đến Android 16), app còn bị tiêu diệt bởi:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-300">
              <li><strong>Phantom Process Killer (Android 12–16)</strong>: Đếm số luồng và tiến trình con; nếu app chạy ngầm đa luồng (Regex lớn, giữ kết nối API liên tục), hệ thống sẽ gửi tín hiệu <code>SIGKILL</code> diệt sạch bất chấp OOM Score.</li>
              <li><strong>Doze Mode & CPU Throttling</strong>: Đóng băng CPU và khóa mạng ngầm khi tắt màn hình, làm request Gemini API bị gián đoạn.</li>
              <li><strong>Trình tối ưu riêng của OEM (HyperOS, One UI, ColorOS)</strong>: Bộ quản lý pin AI tự động kill ứng dụng sau 10–15 phút màn hình tắt mà không cần thông qua LMK gốc.</li>
            </ul>
          </div>

          {/* 5 Layers Cards */}
          <div className="space-y-3">
            <h3 className="font-bold text-neutral-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Chi Tiết Cơ Chế 5 Lớp Phối Hợp Giữa Native Code & Root Script</span>
            </h3>

            {layers.map((layer) => (
              <div key={layer.num} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-100 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 font-mono text-[10px]">
                      {layer.num}
                    </span>
                    {layer.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300 font-mono">
                    {layer.type}
                  </span>
                </div>

                <p className="text-red-400/90 text-[11px] font-medium">{layer.threat}</p>
                <p className="text-neutral-300">{layer.solution}</p>

                <div className="bg-neutral-900 border border-neutral-800 rounded p-2 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <code>{layer.command}</code>
                </div>
              </div>
            ))}
          </div>

          {/* Standalone Script Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 text-xs flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Script Chạy Trực Tiếp Bằng Termux (Root) hoặc Máy Tính (ADB Shell)</span>
              </span>
              <button
                onClick={handleCopyScript}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Đã chép script!' : 'Sao chép Script Shell'}</span>
              </button>
            </div>

            <div className="bg-black border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
              {fullScript}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 px-5 py-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Tự động tích hợp sẵn trong file <code>GodModeManager.java</code> và <code>TranslationService.java</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

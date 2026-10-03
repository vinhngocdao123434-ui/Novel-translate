import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle, Info } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'header' | 'compact' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If already running in standalone PWA mode
  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Đã Cài Đặt</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowInfoModal(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowInfoModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 border border-white/20 cursor-pointer ${className}`}
        title="Cài đặt DroidTranslator trực tiếp lên màn hình chính điện thoại"
      >
        <Smartphone className="w-4 h-4 text-cyan-200 animate-pulse" />
        <span>Cài Đặt App (PWA)</span>
        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md font-mono">
          1-Chạm
        </span>
      </button>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-6 shadow-2xl space-y-4 text-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Cài đặt trên iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="flex items-start gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  1
                </span>
                <p>
                  Nhấn vào nút <strong className="text-blue-400 flex items-center gap-1 inline-flex"><Share2 className="w-3.5 h-3.5 inline" /> Chia sẻ (Share)</strong> trên thanh công cụ Safari ở dưới đáy màn hình.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  2
                </span>
                <p>
                  Cuộn xuống danh sách tùy chọn và chọn <strong className="text-emerald-400 flex items-center gap-1 inline-flex"><PlusSquare className="w-3.5 h-3.5 inline" /> Thêm vào MH chính (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  3
                </span>
                <p>
                  Nhấn <strong className="text-white">Thêm (Add)</strong> ở góc trên bên phải. App sẽ xuất hiện trên màn hình chính và mở toàn màn hình!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Manual / Browser Menu Guide Modal (When browser prompt is delayed or desktop) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-6 shadow-2xl space-y-4 text-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Hướng Dẫn Cài Đặt PWA</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed">
              <p>
                Để cài đặt ứng dụng chạy độc lập toàn màn hình:
              </p>
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
                <p className="font-semibold text-blue-300">📱 Trên Chrome / Cốc Cốc / Edge điện thoại:</p>
                <p>Bấm vào biểu tượng <strong>3 dấu chấm (⋮)</strong> góc trên trình duyệt &rarr; Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</p>
              </div>
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
                <p className="font-semibold text-purple-300">💻 Trên Máy tính (PC / Mac):</p>
                <p>Nhấp vào biểu tượng <strong>Cài đặt</strong> (mũi tên hoặc màn hình nhỏ) ở góc phải thanh địa chỉ URL.</p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

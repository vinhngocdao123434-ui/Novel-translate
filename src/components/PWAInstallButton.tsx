import React, { useState, useEffect } from 'react';
import { Smartphone, Info, Share2, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running as installed PWA
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Capture standard PWA install prompt on Android Chrome / Desktop Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
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
        className={`group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#005a82] via-[#0e1a30] to-[#005a82] hover:from-[#0284c7] hover:to-[#005a82] px-3.5 py-1.5 text-xs font-semibold text-[#f0e6d2] shadow-lg shadow-black/50 transition-all duration-200 active:scale-95 border border-[#c8aa6e]/60 cursor-pointer ${className}`}
        title="Cài đặt DroidTranslator trực tiếp lên màn hình chính điện thoại"
      >
        <Smartphone className="w-4 h-4 text-[#0ac8b9] animate-pulse" />
        <span>Cài Đặt App (PWA)</span>
        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-[#785a28]/40 text-[#c8aa6e] rounded-md font-mono border border-[#c8aa6e]/40">
          1-Chạm
        </span>
      </button>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#091428] border-2 border-[#c8aa6e] p-6 shadow-2xl space-y-4 text-[#f0e6d2]">
            <div className="flex items-center justify-between border-b border-[#785a28]/60 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#c8aa6e]" />
                <h3 className="text-base font-bold text-white">Cài đặt trên iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#a09b8c] leading-relaxed">
              <div className="flex items-start gap-3 bg-[#050505] p-3 rounded-xl border border-[#785a28]/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005a82] text-xs font-bold text-white">
                  1
                </span>
                <p>
                  Nhấn vào nút <strong className="text-[#0ac8b9] flex items-center gap-1 inline-flex"><Share2 className="w-3.5 h-3.5 inline" /> Chia sẻ (Share)</strong> trên thanh công cụ Safari ở dưới đáy màn hình.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-[#050505] p-3 rounded-xl border border-[#785a28]/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005a82] text-xs font-bold text-white">
                  2
                </span>
                <p>
                  Cuộn xuống danh sách tùy chọn và chọn <strong className="text-emerald-400 flex items-center gap-1 inline-flex"><PlusSquare className="w-3.5 h-3.5 inline" /> Thêm vào MH chính (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-[#050505] p-3 rounded-xl border border-[#785a28]/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005a82] text-xs font-bold text-white">
                  3
                </span>
                <p>
                  Nhấn <strong className="text-white">Thêm (Add)</strong> ở góc trên bên phải. App sẽ xuất hiện trên màn hình chính và mở toàn màn hình!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-[#c8aa6e] hover:bg-[#d8ba7e] py-2.5 text-xs font-extrabold text-black transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Manual / Browser Menu Guide Modal (When browser prompt is delayed or desktop) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#091428] border-2 border-[#c8aa6e] p-6 shadow-2xl space-y-4 text-[#f0e6d2]">
            <div className="flex items-center justify-between border-b border-[#785a28]/60 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#c8aa6e]" />
                <h3 className="text-base font-bold text-white">Hướng Dẫn Cài Đặt PWA</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#a09b8c] leading-relaxed">
              <p>
                Để cài đặt ứng dụng chạy độc lập toàn màn hình:
              </p>
              <div className="bg-[#050505] p-3 rounded-xl border border-[#785a28]/50 space-y-2">
                <p className="font-semibold text-[#0ac8b9]">📱 Trên Chrome / Cốc Cốc / Edge điện thoại:</p>
                <p>Bấm vào biểu tượng <strong className="text-[#f0e6d2]">3 dấu chấm (⋮)</strong> góc trên trình duyệt &rarr; Chọn <strong className="text-[#f0e6d2]">"Cài đặt ứng dụng"</strong> hoặc <strong className="text-[#f0e6d2]">"Thêm vào Màn hình chính"</strong>.</p>
              </div>
              <div className="bg-[#050505] p-3 rounded-xl border border-[#785a28]/50 space-y-2">
                <p className="font-semibold text-[#c8aa6e]">💻 Trên Máy tính (PC / Mac):</p>
                <p>Nhấp vào biểu tượng <strong className="text-[#f0e6d2]">Cài đặt</strong> (mũi tên hoặc màn hình nhỏ) ở góc phải thanh địa chỉ URL.</p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full rounded-xl bg-[#c8aa6e] hover:bg-[#d8ba7e] py-2.5 text-xs font-extrabold text-black transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

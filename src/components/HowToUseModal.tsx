import React from 'react';
import { 
  BookOpen, Key, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  Layers, ArrowRight, Zap, HelpCircle, X, Download, RefreshCw, Cpu
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl w-full max-w-xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden text-neutral-100">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-neutral-900 p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-lg shadow-blue-500/20">
              <HelpCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Cẩm Nang Hướng Dẫn Toàn Diện
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono font-normal">
                  Từ A đến Z
                </span>
              </h2>
              <p className="text-xs text-blue-200/80">Dành cho người mới bắt đầu dịch truyện</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY WITH 6 PRACTICAL STEPS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          
          {/* BƯỚC 1: LẤY VÀ NẠP KEY */}
          <div className="bg-neutral-950/80 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs">1</span>
              <Key className="w-4 h-4" />
              <span>Bước 1: Lấy API Key Miễn Phí & Nạp Nhiều Key</span>
            </div>
            <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
              <p>
                • <strong>Cách lấy key</strong>: Truy cập trang <span className="text-amber-300 font-semibold underline">aistudio.google.com</span> trên trình duyệt ➔ Đăng nhập Google ➔ Bấm <strong>"Get API key"</strong> ➔ Tạo khóa và copy.
              </p>
              <div className="p-2.5 bg-amber-950/30 border border-amber-700/40 rounded-xl text-amber-200 text-[11px] leading-relaxed">
                <strong>💡 Mẹo Bỏ Túi Cực Hay</strong>: Mỗi tài khoản Google được miễn phí 15 lượt gọi/phút (RPM). Bạn <strong>nên dùng 2 đến 5 tài khoản Google khác nhau</strong> để lấy 2 đến 5 key riêng biệt. Khi nạp tất cả vào mục <em>"Key & Prompt"</em>, app sẽ tự động xoay tua từng key, giúp bạn dịch hàng nghìn chương liên tục mà không bao giờ bị đứng máy hay hết hạn mức!
              </div>
            </div>
          </div>

          {/* BƯỚC 2: TẠO DỰ ÁN & NẠP FILE */}
          <div className="bg-neutral-950/80 border border-blue-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs">2</span>
              <BookOpen className="w-4 h-4" />
              <span>Bước 2: Tạo Dự Án & Nạp File Truyện Gốc</span>
            </div>
            <div className="space-y-1.5 text-neutral-300 text-xs leading-relaxed">
              <p>• Bấm <strong>"Tiến trình mới"</strong> ở góc trên để đặt tên cho bộ truyện của bạn.</p>
              <p>• Chuyển sang thẻ <strong>"Dịch & Từ điển"</strong> ➔ Bấm <strong>"Nạp Ebook (.epub, .mobi, .txt)"</strong> để tải file truyện tiếng Trung vào. App sẽ tự động quét và bóc tách từng chương một cách thông minh.</p>
            </div>
          </div>

          {/* BƯỚC 3: CHỌN KHOẢNG CHƯƠNG & CHỌN MODEL */}
          <div className="bg-neutral-950/80 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs">3</span>
              <Cpu className="w-4 h-4" />
              <span>Bước 3: Chọn Khoảng Chương & Model Phù Hợp</span>
            </div>
            <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
              <p>• Điền khoảng chương cần dịch (ví dụ: Từ chương <strong>1</strong> đến chương <strong>50</strong>).</p>
              
              <div className="p-3 bg-emerald-950/30 border border-emerald-700/40 rounded-xl space-y-2 text-[11px]">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Khuyên Dùng Hàng Đầu Cho Truyện Dài (File nặng &gt;10MB):</span>
                </div>
                <p className="text-neutral-200">
                  👉 <strong>Nên chọn: Gemini 2.5 Flash-Lite hoặc Gemini 3.5 Flash-Lite</strong>.  
                  Hạn ngạch miễn phí cực lớn và tốc độ siêu nhanh. Bạn có thể dịch một mạch trọn bộ truyện 10MB mà không bị nghẽn mạng. 
                  <em>Mặc dù bản Lite đôi khi có vài lỗi nhỏ, nhưng hệ thống cứu hộ đa tầng của app sẽ tự động sửa chữa và nâng chất lượng bản dịch đạt <strong>9/10 điểm</strong> so với các bản lớn!</em>
                </p>
                <div className="border-t border-emerald-800/40 pt-1.5 text-neutral-300">
                  👉 <strong>Gemini 2.5 Flash / 3.6 Flash</strong>: Dành cho khi bạn dịch từng đoạn ngắn cần văn phong mượt mà tuyệt đối nhất.
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 4: THIẾT LẬP CÀI ĐẶT ẢNH HƯỞNG CHẤT LƯỢNG */}
          <div className="bg-neutral-950/80 border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs">4</span>
              <Sparkles className="w-4 h-4" />
              <span>Bước 4: Cài Đặt Ảnh Hưởng Đến Chất Lượng Bản Dịch</span>
            </div>
            <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <span className="font-semibold text-purple-300">🌿 Bật Số Ký Tự Tối Thiểu Glossary (2 - 4 ký tự) để làm gì?</span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Để AI chỉ thu thập các tên riêng và thuật ngữ có ý nghĩa (như <em>Lâm Thần</em>, <em>Thanh Vân Tông</em>), ngăn không cho các từ vụn vặt 1 chữ (như <em>ta, ngươi, đi, đến</em>) lọt vào từ điển gây rác bản dịch.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <span className="font-semibold text-purple-300">🛡️ Bật Chống Lọt Chữ Hán Nghiêm Ngặt:</span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Ép AI phải chuyển đổi 100% sang tiếng Việt chuẩn, tuyệt đối không được để sót bất kỳ chữ tượng hình Trung Quốc nào trong văn bản.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <span className="font-semibold text-purple-300">🚑 Bật Tự Động Cứu Hộ Online:</span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Nếu AI bị lỗi mạng hoặc bị kẹt lặp lại câu, app sẽ tự động gửi lệnh bắt AI dịch lại chương đó ngay lập tức.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 5: BẮT ĐẦU DỊCH & XỬ LÝ SỰ CỐ */}
          <div className="bg-neutral-950/80 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs">5</span>
              <RefreshCw className="w-4 h-4" />
              <span>Bước 5: Bắt Đầu Dịch & Xử Lý Khi Lọt Chương Thiếu</span>
            </div>
            <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
              <p>• Bấm nút <strong>"▶ Bắt đầu Dịch"</strong>. Hệ thống chạy hoàn toàn tự động.</p>
              <div className="p-2.5 bg-cyan-950/30 border border-cyan-700/40 rounded-xl text-cyan-200 text-[11px]">
                <strong>❓ Nếu bị lọt chương chưa dịch hoặc dừng giữa chừng:</strong>  
                Bạn chỉ cần tích chọn ô <strong>"Dịch bù chương thiếu (Gap-Filling)"</strong> và bấm Dịch tiếp. App sẽ tự động kiểm tra, lướt qua những chương đã dịch xong và chỉ tập trung dịch lại các chương còn thiếu!
              </div>
            </div>
          </div>

          {/* BƯỚC 6: LÀM MƯỢT FINAL & XUẤT FILE */}
          <div className="bg-neutral-950/80 border border-pink-500/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-xs">6</span>
              <Download className="w-4 h-4" />
              <span>Bước 6: Làm Mượt Final & Xuất File Hoàn Tất</span>
            </div>
            <div className="space-y-1.5 text-neutral-300 text-xs leading-relaxed">
              <p>• <strong>Làm mượt toàn tác phẩm</strong>: Sau khi dịch xong toàn bộ các chương, hãy bấm nút <strong>"✨ Bắt đầu Quét & Làm Mượt Final"</strong>. Bộ quét sẽ rà soát toàn bộ tác phẩm, làm sạch các từ lai và chữ Hán còn sót lại để đạt chuẩn 100% tiếng Việt.</p>
              <p>• <strong>Xuất File</strong>: Chuyển sang thẻ <em>"Bản dịch & Đọc"</em> hoặc <em>"Cài đặt"</em> để bấm <strong>"Xuất Toàn Văn (.txt)"</strong> hoặc <strong>"Xuất File EPUB"</strong> và nạp vào máy đọc sách hoặc app đọc truyện trên điện thoại.</p>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-neutral-950 p-3 sm:p-4 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-400">Bạn có thể mở lại cẩm nang này bất kỳ lúc nào!</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            Đã Hiểu, Bắt Đầu Thôi!
          </button>
        </div>

      </div>
    </div>
  );
};

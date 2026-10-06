import React from 'react';
import { 
  BookOpen, Key, Sparkles, CheckCircle2, ShieldCheck, 
  HelpCircle, X, Download, RefreshCw, Cpu
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#091428] border-2 border-[#c8aa6e] rounded-3xl w-full max-w-xl flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-[#f0e6d2]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#091428] via-[#0e1a30] to-[#091428] p-4 sm:p-5 border-b border-[#785a28]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c8aa6e]/20 border border-[#c8aa6e]/60 flex items-center justify-center text-[#c8aa6e] shadow-lg shadow-black/40">
              <HelpCircle className="w-5 h-5 text-[#c8aa6e]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Cẩm Nang Hướng Dẫn Toàn Diện
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-normal">
                  Từ A đến Z
                </span>
              </h2>
              <p className="text-xs text-[#a09b8c]">Dành cho người mới bắt đầu dịch truyện</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28]/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE BODY WITH 6 PRACTICAL STEPS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          
          {/* BƯỚC 1: LẤY VÀ NẠP KEY */}
          <div className="bg-[#050505] border border-[#785a28]/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#c8aa6e] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#785a28]/40 border border-[#c8aa6e]/60 flex items-center justify-center text-xs text-[#c8aa6e] font-mono">1</span>
              <Key className="w-4 h-4 text-[#c8aa6e]" />
              <span>Bước 1: Lấy API Key Miễn Phí & Nạp Nhiều Key</span>
            </div>
            <div className="space-y-2 text-[#a09b8c] text-xs leading-relaxed">
              <p>
                • <strong>Cách lấy key</strong>: Truy cập trang <span className="text-[#c8aa6e] font-semibold underline">aistudio.google.com</span> trên trình duyệt ➔ Đăng nhập Google ➔ Bấm <strong>"Get API key"</strong> ➔ Tạo khóa và copy.
              </p>
              <div className="p-2.5 bg-[#091428] border border-[#785a28]/50 rounded-xl text-[#f0e6d2] text-[11px] leading-relaxed">
                <strong className="text-[#c8aa6e]">💡 Mẹo Bỏ Túi Cực Hay</strong>: Mỗi tài khoản Google được miễn phí 15 lượt gọi/phút (RPM). Bạn <strong>nên dùng 2 đến 5 tài khoản Google khác nhau</strong> để lấy 2 đến 5 key riêng biệt. Khi nạp tất cả vào mục <em>"Key & Prompt"</em>, app sẽ tự động xoay tua từng key, giúp bạn dịch hàng nghìn chương liên tục mà không bao giờ bị đứng máy hay hết hạn mức!
              </div>
            </div>
          </div>

          {/* BƯỚC 2: TẠO DỰ ÁN & NẠP FILE */}
          <div className="bg-[#050505] border border-[#785a28]/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#0ac8b9] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#005a82]/30 border border-[#0ac8b9]/50 flex items-center justify-center text-xs text-[#0ac8b9] font-mono">2</span>
              <BookOpen className="w-4 h-4 text-[#0ac8b9]" />
              <span>Bước 2: Tạo Dự Án & Nạp File Truyện Gốc</span>
            </div>
            <div className="space-y-1.5 text-[#a09b8c] text-xs leading-relaxed">
              <p>• Bấm <strong className="text-[#f0e6d2]">"Tiến trình mới"</strong> ở góc trên để đặt tên cho bộ truyện của bạn.</p>
              <p>• Chuyển sang thẻ <strong className="text-[#f0e6d2]">"Dịch & Từ điển"</strong> ➔ Bấm <strong className="text-[#f0e6d2]">"Nạp Ebook (.epub, .mobi, .txt)"</strong> để tải file truyện tiếng Trung vào. App sẽ tự động quét và bóc tách từng chương một cách thông minh.</p>
            </div>
          </div>

          {/* BƯỚC 3: CHỌN KHOẢNG CHƯƠNG & CHỌN MODEL */}
          <div className="bg-[#050505] border border-[#785a28]/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-950/60 border border-emerald-600/60 flex items-center justify-center text-xs text-emerald-300 font-mono">3</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Bước 3: Chọn Khoảng Chương & Model Phù Hợp</span>
            </div>
            <div className="space-y-2 text-[#a09b8c] text-xs leading-relaxed">
              <p>• Điền khoảng chương cần dịch (ví dụ: Từ chương <strong className="text-[#f0e6d2]">1</strong> đến chương <strong className="text-[#f0e6d2]">50</strong>).</p>
              
              <div className="p-3 bg-[#091428] border border-emerald-800/40 rounded-xl space-y-2 text-[11px]">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Khuyên Dùng Hàng Đầu Cho Truyện Dài (File nặng &gt;10MB):</span>
                </div>
                <p className="text-neutral-200">
                  👉 <strong className="text-[#f0e6d2]">Nên chọn: Gemini 2.5 Flash-Lite hoặc Gemini 3.5 Flash-Lite</strong>.  
                  Hạn ngạch miễn phí cực lớn và tốc độ siêu nhanh. Bạn có thể dịch một mạch trọn bộ truyện 10MB mà không bị nghẽn mạng. 
                  <em>Mặc dù bản Lite đôi khi có vài lỗi nhỏ, nhưng hệ thống cứu hộ đa tầng của app sẽ tự động sửa chữa và nâng chất lượng bản dịch đạt <strong className="text-[#c8aa6e]">9/10 điểm</strong> so với các bản lớn!</em>
                </p>
                <div className="border-t border-[#785a28]/30 pt-1.5 text-neutral-300">
                  👉 <strong className="text-[#f0e6d2]">Gemini 2.5 Flash / 3.6 Flash</strong>: Dành cho khi bạn dịch từng đoạn ngắn cần văn phong mượt mà tuyệt đối nhất.
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 4: THIẾT LẬP CÀI ĐẶT ẢNH HƯỞNG CHẤT LƯỢNG */}
          <div className="bg-[#050505] border border-[#785a28]/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#c8aa6e] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#785a28]/40 border border-[#c8aa6e]/60 flex items-center justify-center text-xs text-[#c8aa6e] font-mono">4</span>
              <Sparkles className="w-4 h-4 text-[#c8aa6e]" />
              <span>Bước 4: Cài Đặt Ảnh Hưởng Đến Chất Lượng Bản Dịch</span>
            </div>
            <div className="space-y-2 text-[#a09b8c] text-xs leading-relaxed">
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 rounded-xl bg-[#091428] border border-[#785a28]/40">
                  <span className="font-semibold text-[#c8aa6e]">🌿 Bật Số Ký Tự Tối Thiểu Glossary (2 - 4 ký tự) để làm gì?</span>
                  <p className="text-[11px] text-[#a09b8c] mt-0.5">
                    Để AI chỉ thu thập các tên riêng và thuật ngữ có ý nghĩa (như <em>Lâm Thần</em>, <em>Thanh Vân Tông</em>), ngăn không cho các từ vụn vặt 1 chữ (như <em>ta, ngươi, đi, đến</em>) lọt vào từ điển gây rác bản dịch.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-[#091428] border border-[#785a28]/40">
                  <span className="font-semibold text-[#0ac8b9]">🛡️ Bật Chống Lọt Chữ Hán Nghiêm Ngặt:</span>
                  <p className="text-[11px] text-[#a09b8c] mt-0.5">
                    Ép AI phải chuyển đổi 100% sang tiếng Việt chuẩn, tuyệt đối không được để sót bất kỳ chữ tượng hình Trung Quốc nào trong văn bản.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-[#091428] border border-[#785a28]/40">
                  <span className="font-semibold text-emerald-400">🚑 Bật Tự Động Cứu Hộ Online:</span>
                  <p className="text-[11px] text-[#a09b8c] mt-0.5">
                    Nếu AI bị lỗi mạng hoặc bị kẹt lặp lại câu, app sẽ tự động gửi lệnh bắt AI dịch lại chương đó ngay lập tức.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 5: BẮT ĐẦU DỊCH & XỬ LÝ SỰ CỐ */}
          <div className="bg-[#050505] border border-[#785a28]/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#0ac8b9] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#005a82]/30 border border-[#0ac8b9]/50 flex items-center justify-center text-xs text-[#0ac8b9] font-mono">5</span>
              <RefreshCw className="w-4 h-4 text-[#0ac8b9]" />
              <span>Bước 5: Bắt Đầu Dịch & Xử Lý Khi Lọt Chương Thiếu</span>
            </div>
            <div className="space-y-2 text-[#a09b8c] text-xs leading-relaxed">
              <p>• Bấm nút <strong className="text-[#f0e6d2]">"▶ Dịch Range"</strong>. Hệ thống chạy hoàn toàn tự động.</p>
              <div className="p-2.5 bg-[#091428] border border-[#0ac8b9]/40 rounded-xl text-[#f0e6d2] text-[11px]">
                <strong className="text-[#0ac8b9]">❓ Nếu bị lọt chương chưa dịch hoặc dừng giữa chừng:</strong>  
                Bạn chỉ cần bấm nút <strong className="text-emerald-400">"⚡ Dịch Bù Chương Sót (Né Các Chương Đã Dịch)"</strong> ở thẻ <em>"Dịch & Từ điển"</em>. App sẽ tự động quét, lướt qua những chương đã dịch xong và chỉ tập trung dịch lại các chương còn thiếu!
              </div>
            </div>
          </div>

          {/* BƯỚC 6: LÀM MƯỢT FINAL & XUẤT FILE */}
          <div className="bg-[#050505] border border-[#785a28]/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#c8aa6e] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#785a28]/40 border border-[#c8aa6e]/60 flex items-center justify-center text-xs text-[#c8aa6e] font-mono">6</span>
              <Download className="w-4 h-4 text-[#c8aa6e]" />
              <span>Bước 6: Làm Mượt Final & Xuất File Hoàn Tất</span>
            </div>
            <div className="space-y-1.5 text-[#a09b8c] text-xs leading-relaxed">
              <p>• <strong className="text-[#f0e6d2]">Làm mượt toàn tác phẩm</strong>: Sau khi dịch xong toàn bộ các chương, hãy bấm nút <strong className="text-[#0ac8b9]">"✨ Làm Mượt Bản Dịch Final"</strong> ngay tại thẻ <em>"Dịch & Từ điển"</em>. Bộ quét sẽ rà soát toàn bộ tác phẩm, làm sạch các từ lai và chữ Hán còn sót lại để đạt chuẩn 100% tiếng Việt.</p>
              <p>• <strong className="text-[#f0e6d2]">Xuất File</strong>: Bấm nút <strong className="text-[#c8aa6e]">"📚 Xuất Toàn Bộ Tác Phẩm"</strong> ở thẻ <em>"Dịch & Từ điển"</em> để tải về 5 định dạng Ebook (EPUB, MOBI, AZW3, TXT, HTML) nạp vào máy đọc sách hoặc app đọc truyện trên điện thoại.</p>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-[#091428] px-4 py-3 border-t border-[#785a28]/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#a09b8c] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã tích hợp trọn bộ 5 lớp chống văng app</span>
          </div>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-black/40"
          >
            Đã Hiểu & Bắt Đầu
          </button>
        </div>

      </div>
    </div>
  );
};

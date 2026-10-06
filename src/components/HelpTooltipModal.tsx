import React from 'react';
import { HelpCircle, X, CheckCircle2, Sparkles } from 'lucide-react';

export interface HelpInfoItem {
  title: string;
  category?: string;
  whatIsIt: string;
  howToUse: string;
  proTip?: string;
}

interface HelpTooltipModalProps {
  info: HelpInfoItem | null;
  onClose: () => void;
}

export const HelpTooltipModal: React.FC<HelpTooltipModalProps> = ({ info, onClose }) => {
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#091428] border-2 border-[#c8aa6e] rounded-3xl w-full max-w-md flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-[#f0e6d2]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#091428] via-[#0e1a30] to-[#091428] px-4 py-3.5 border-b border-[#785a28]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c8aa6e]/20 border border-[#c8aa6e]/60 flex items-center justify-center text-[#c8aa6e]">
              <HelpCircle className="w-4 h-4 text-[#c8aa6e]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{info.title}</h3>
              </div>
              {info.category && (
                <span className="text-[10px] text-[#c8aa6e] font-mono font-bold">{info.category}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28]/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-3 text-xs leading-relaxed">
          
          {/* MỤC 1: DÙNG ĐỂ LÀM GÌ */}
          <div className="bg-[#050505] border border-[#785a28]/50 rounded-2xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-[#0ac8b9] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0ac8b9]"></span>
              <span>Tính năng này dùng để làm gì?</span>
            </div>
            <p className="text-[#a09b8c]">{info.whatIsIt}</p>
          </div>

          {/* MỤC 2: CÁCH SỬ DỤNG */}
          <div className="bg-[#050505] border border-[#785a28]/50 rounded-2xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cách sử dụng tối ưu:</span>
            </div>
            <p className="text-[#a09b8c]">{info.howToUse}</p>
          </div>

          {/* MẸO (NẾU CÓ) */}
          {info.proTip && (
            <div className="bg-[#091428] border border-[#c8aa6e]/40 rounded-2xl p-2.5 flex items-start gap-2 text-[#f0e6d2] text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#c8aa6e] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#c8aa6e]">Mẹo nhỏ: </strong>
                <span>{info.proTip}</span>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-[#091428] px-4 py-3 border-t border-[#785a28]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black font-extrabold rounded-xl text-xs cursor-pointer transition-colors shadow-md shadow-black/40"
          >
            Đã hiểu
          </button>
        </div>

      </div>
    </div>
  );
};

export const HelpBtn: React.FC<{ onClick: (e?: React.MouseEvent) => void; className?: string }> = ({ onClick, className = '' }) => {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      title="Xem hướng dẫn chi tiết mục này"
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1e2328] hover:bg-[#c8aa6e] text-[#c8aa6e] hover:text-[#091428] border border-[#785a28]/80 text-[10px] font-extrabold transition-all cursor-pointer shadow-sm shadow-black/40 select-none shrink-0 ${className}`}
    >
      ?
    </span>
  );
};

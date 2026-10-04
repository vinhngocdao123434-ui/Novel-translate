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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        
        {/* HEADER */}
        <div className="bg-neutral-950 px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{info.title}</h3>
              </div>
              {info.category && (
                <span className="text-[10px] text-blue-400/90 font-medium">{info.category}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-3 text-xs leading-relaxed">
          
          {/* MỤC 1: DÙNG ĐỂ LÀM GÌ */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Tính năng này dùng để làm gì?</span>
            </div>
            <p className="text-neutral-200">{info.whatIsIt}</p>
          </div>

          {/* MỤC 2: CÁCH SỬ DỤNG */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cách sử dụng tối ưu:</span>
            </div>
            <p className="text-neutral-300">{info.howToUse}</p>
          </div>

          {/* MẸO (NẾU CÓ) */}
          {info.proTip && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-2.5 flex items-start gap-2 text-amber-200 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Mẹo nhỏ: </strong>
                <span>{info.proTip}</span>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-neutral-950 px-4 py-2.5 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Đã hiểu
          </button>
        </div>

      </div>
    </div>
  );
};

export const HelpBtn: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = '' }) => {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      title="Xem giải thích và hướng dẫn mục này"
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-950/90 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/50 text-[11px] font-bold transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-sm shadow-blue-500/20 select-none shrink-0 ${className}`}
    >
      ?
    </span>
  );
};

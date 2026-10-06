import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', icon: 24, font: 'text-xs' },
  sm: { box: 'w-8 h-8', icon: 32, font: 'text-sm' },
  md: { box: 'w-10 h-10', icon: 40, font: 'text-base' },
  lg: { box: 'w-12 h-12', icon: 48, font: 'text-lg' },
  xl: { box: 'w-16 h-16', icon: 64, font: 'text-2xl' },
  '2xl': { box: 'w-24 h-24', icon: 96, font: 'text-3xl' },
};

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '', showText = false }) => {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${currentSize.box} relative shrink-0 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/10 border border-emerald-500/30 flex items-center justify-center bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#020617]`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="droidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Droid Antennae */}
          <line x1="36" y1="20" x2="26" y2="10" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="25" cy="9" r="2" fill="#34d399" />
          <line x1="64" y1="20" x2="74" y2="10" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="75" cy="9" r="2" fill="#38bdf8" />

          {/* Android Robot Head Dome */}
          <path
            d="M26 40 C26 26, 74 26, 74 40 Z"
            fill="url(#droidGrad)"
            filter="url(#glowEffect)"
          />

          {/* Android Glowing Eyes */}
          <circle cx="40" cy="33" r="2.8" fill="#ffffff" />
          <circle cx="60" cy="33" r="2.8" fill="#ffffff" />

          {/* Open Novel Book Base */}
          <path
            d="M16 54 C32 49, 48 52, 50 60 C52 52, 68 49, 84 54 L82 78 C66 73, 52 76, 50 82 C48 76, 34 73, 18 78 Z"
            fill="url(#bookGrad)"
            opacity="0.9"
          />

          {/* Book Spine Center Divider */}
          <line x1="50" y1="60" x2="50" y2="82" stroke="#090d16" strokeWidth="2" />

          {/* Book Inner Page Highlights */}
          <path
            d="M22 57 C34 53, 46 55, 48 62 L48 76 C34 70, 24 71, 22 74 Z"
            fill="#ffffff"
            opacity="0.18"
          />
          <path
            d="M78 57 C66 53, 54 55, 52 62 L52 76 C66 70, 76 71, 78 74 Z"
            fill="#ffffff"
            opacity="0.18"
          />

          {/* Translation Waves / Neural Connection Loop */}
          <path
            d="M32 47 Q50 41 68 47"
            stroke="url(#waveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
          />

          {/* Center Translation Spark */}
          <circle cx="50" cy="44" r="3.2" fill="#fbbf24" filter="url(#glowEffect)" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col whitespace-nowrap shrink-0">
          <div className="flex items-center gap-1.5 leading-none whitespace-nowrap">
            <span className="font-extrabold tracking-tight text-white font-sans text-sm whitespace-nowrap">
              Droid<span className="text-emerald-400">Translator</span>
            </span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-mono font-bold tracking-wider whitespace-nowrap">
              NATIVE
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 whitespace-nowrap">
            Android 16 Kernel
          </span>
        </div>
      )}
    </div>
  );
};

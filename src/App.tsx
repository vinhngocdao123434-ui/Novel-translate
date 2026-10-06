/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, Code, ShieldCheck, Download, 
  ExternalLink, Layers, Sparkles, Terminal, CheckCircle2 
} from 'lucide-react';
import { AppLogo } from './components/AppLogo';
import { AndroidPhoneSimulator } from './components/AndroidPhoneSimulator';
import { NativeProjectStudio } from './components/NativeProjectStudio';
import { GodModeInspectorModal } from './components/GodModeInspectorModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { downloadNativeProjectZip } from './utils/zip-exporter';

export default function App() {
  const isAndroidNative = typeof window !== 'undefined' && Boolean((window as any).AndroidBridge);
  const isMobileScreen = typeof window !== 'undefined' && (window.innerWidth < 768 || isAndroidNative);

  const [activeTab, setActiveTab] = useState<'simulator' | 'studio' | 'split'>(() => {
    if (typeof window !== 'undefined' && (Boolean((window as any).AndroidBridge) || window.innerWidth < 1024)) {
      return 'simulator';
    }
    return 'split';
  });
  const [isGodModeModalOpen, setIsGodModeModalOpen] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadNativeProjectZip();
    } catch (e) {
      console.error(e);
      alert('Lỗi tải file zip: ' + e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // NATIVE APP IMMERSIVE FULL SCREEN (When running in APK or mobile)
  if (isAndroidNative || (isMobileScreen && activeTab === 'simulator')) {
    return (
      <div className="h-screen w-screen bg-[#03060d] text-neutral-100 flex flex-col font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
        <AndroidPhoneSimulator onOpenGodModeModal={() => setIsGodModeModalOpen(true)} isNativeMode={true} />
        
        {/* GOD MODE DEEP DIVE MODAL */}
        <GodModeInspectorModal
          isOpen={isGodModeModalOpen}
          onClose={() => setIsGodModeModalOpen(false)}
        />

        {/* PWA OFFLINE CONNECTIVITY INDICATOR */}
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 3-ZONE TOP BAR CONTRACT */}
      <header className="h-16 px-4 sm:px-6 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 flex items-center justify-between sticky top-0 z-40 shrink-0">
        {/* Zone 1: Wordmark with Official App Logo */}
        <div className="flex items-center gap-3">
          <AppLogo size="sm" showText={true} />
        </div>

        {/* Zone 2: Navigation Switcher */}
        <nav className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Dịch</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Studio Code</span>
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1.5 rounded-lg hidden lg:flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'split'
                ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Song Song</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action Controls */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          <button
            onClick={() => setIsGodModeModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">5 Lớp</span> God-Mode
          </button>

          <button
            disabled={isDownloadingZip}
            onClick={handleDownloadZip}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingZip ? 'Đang xuất...' : 'Tải Full ZIP'}</span>
          </button>
        </div>
      </header>

      {/* SUB-HEADER BANNER: GOD MODE HIGHLIGHT */}
      <div className="bg-neutral-900 border-b border-neutral-800/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-neutral-300 font-medium">{isAndroidNative ? 'Android Native Running:' : 'Native Architecture:'}</span>
          <span>100% Java thuần</span>
          <span>·</span>
          <span>Android SDK 35</span>
          <span>·</span>
          <span>Foreground Service DataSync</span>
          <span>·</span>
          <span>Master Glossary Auto-Learn</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-mono">Kernel LMK: -1000 OOM</span>
          <span>·</span>
          <span className="text-emerald-400 font-mono">Phantom Process: Bypassed</span>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-3 sm:p-5 overflow-auto">
        {activeTab === 'simulator' && (
          <div className="max-w-xl mx-auto py-2">
            <AndroidPhoneSimulator onOpenGodModeModal={() => setIsGodModeModalOpen(true)} />
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="h-[calc(100vh-140px)] max-w-7xl mx-auto">
            <NativeProjectStudio onOpenGodModeModal={() => setIsGodModeModalOpen(true)} />
          </div>
        )}

        {activeTab === 'split' && (
          <div className="h-[calc(100vh-140px)] max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Phone Simulator (5 cols) */}
            <div className="lg:col-span-5 flex justify-center h-full">
              <AndroidPhoneSimulator onOpenGodModeModal={() => setIsGodModeModalOpen(true)} />
            </div>

            {/* Right Column: Native Studio Code Explorer (7 cols) */}
            <div className="lg:col-span-7 h-full">
              <NativeProjectStudio onOpenGodModeModal={() => setIsGodModeModalOpen(true)} />
            </div>
          </div>
        )}
      </main>

      {/* GOD MODE DEEP DIVE MODAL */}
      <GodModeInspectorModal
        isOpen={isGodModeModalOpen}
        onClose={() => setIsGodModeModalOpen(false)}
      />

      {/* PWA OFFLINE CONNECTIVITY INDICATOR */}
      <OfflineIndicator />
    </div>
  );
}

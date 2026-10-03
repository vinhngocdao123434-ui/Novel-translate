import React, { useState } from 'react';
import { 
  FolderTree, FileCode, Copy, Check, Download, Shield, 
  Terminal, ExternalLink, Code2, Sparkles, Layers, Cpu, X, Smartphone, CheckCircle2
} from 'lucide-react';
import { NATIVE_PROJECT_FILES } from '../native-project-data';
import { ProjectFileEntry } from '../types';
import { downloadNativeProjectZip } from '../utils/zip-exporter';

interface Props {
  onOpenGodModeModal: () => void;
}

export const NativeProjectStudio: React.FC<Props> = ({ onOpenGodModeModal }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFileEntry>(
    () => NATIVE_PROJECT_FILES.find(f => f.path.endsWith('MainActivity.java')) || NATIVE_PROJECT_FILES[0]
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipProgress(0);
    try {
      await downloadNativeProjectZip((pct) => setZipProgress(pct));
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi đóng gói file ZIP: ' + err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = NATIVE_PROJECT_FILES.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group files by category
  const categories = [
    { title: 'Core Java Engine & God-Mode', filter: (f: ProjectFileEntry) => f.path.endsWith('.java') },
    { title: 'Manifest & Gradle Setup', filter: (f: ProjectFileEntry) => f.path.includes('gradle') || f.path.includes('AndroidManifest') },
    { title: 'Android XML Layouts & Res', filter: (f: ProjectFileEntry) => f.path.includes('res/') },
    { title: 'Root Scripts & Documentation', filter: (f: ProjectFileEntry) => f.path.startsWith('scripts/') || f.path.endsWith('.md') }
  ];

  const [showBuildApkGuide, setShowBuildApkGuide] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Studio Header Bar */}
      <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-neutral-100 text-sm tracking-tight">Android Native Java Project Studio</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/40 text-emerald-300">
                100% Java + Android SDK
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Cấu trúc chuẩn Android Studio • Sẵn sàng Build APK • Tích hợp 5 Lớp God Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBuildApkGuide(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Build APK Trên Android</span>
          </button>

          <button
            onClick={onOpenGodModeModal}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Xem 5 Lớp God-Mode</span>
          </button>

          <button
            disabled={isZipping}
            onClick={handleDownloadZip}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? `Đang nén ZIP (${zipProgress}%)...` : 'TẢI FULL SOURCE CODE (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Left: File Tree Explorer, Right: Code Viewer) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: File Tree Explorer */}
        <div className="w-full md:w-80 bg-neutral-950/60 border-r border-neutral-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-800">
            <input
              type="text"
              placeholder="Tìm kiếm file dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs font-mono">
            {categories.map((cat, catIdx) => {
              const filesInCat = filteredFiles.filter(cat.filter);
              if (filesInCat.length === 0) return null;
              return (
                <div key={catIdx} className="space-y-1">
                  <div className="text-[11px] font-sans font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                    <span>{cat.title}</span>
                  </div>
                  <div className="space-y-0.5">
                    {filesInCat.map((file, fIdx) => {
                      const isSelected = selectedFile.path === file.path;
                      const fileName = file.path.split('/').pop();
                      return (
                        <button
                          key={fIdx}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                          }`}
                        >
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-neutral-500'}`} />
                          <span className="truncate">{fileName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Tổng cộng: {NATIVE_PROJECT_FILES.length} files</span>
            <span className="text-emerald-400 font-medium">Ready for Android Studio</span>
          </div>
        </div>

        {/* Right: Code Viewer & File Info */}
        <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
          {/* File Tab Bar */}
          <div className="bg-neutral-950/80 px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-mono text-xs text-blue-400 font-semibold truncate">
                {selectedFile.path}
              </span>
              <span className="text-[11px] text-neutral-500 truncate hidden sm:inline">
                — {selectedFile.description}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>
          </div>

          {/* Syntax Highlighted Editor Window */}
          <div className="flex-1 overflow-auto p-4 bg-[#0F172A] font-mono text-xs leading-relaxed text-slate-200 selection:bg-blue-600 selection:text-white">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* MODAL: HƯỚNG DẪN BUILD APK TRỰC TIẾP TRÊN ANDROID */}
      {showBuildApkGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-100 text-sm">Build APK Trực Tiếp Trên Điện Thoại Android</h3>
                  <p className="text-[11px] text-neutral-400">Hoàn toàn miễn phí, mã nguồn mở, không quảng cáo (Ad-Free), mượt mà</p>
                </div>
              </div>
              <button
                onClick={() => setShowBuildApkGuide(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-neutral-300 leading-relaxed">
              {/* Top Choice: AndroidIDE */}
              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Lựa Chọn Tốt Nhất: AndroidIDE (Khuyên Dùng)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-teal-900/60 border border-teal-600/40 text-teal-200 text-[10px] font-mono">
                    100% Free • FOSS • No Ads
                  </span>
                </div>
                <p>
                  <strong>AndroidIDE</strong> là IDE hoàn chỉnh chạy trực tiếp trên Android, hỗ trợ 100% Gradle và Java 17, giao diện tương tự Android Studio trên PC, không chứa bất kỳ quảng cáo nào.
                </p>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <p className="font-semibold text-neutral-200">Các bước thực hiện:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-neutral-300">
                    <li>
                      Tải và cài đặt <strong>AndroidIDE</strong> từ GitHub (miễn phí):
                      <br />
                      <a 
                        href="https://github.com/AndroidIDEOfficial/AndroidIDE/releases" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-400 underline font-mono inline-flex items-center gap-1 mt-0.5"
                      >
                        github.com/AndroidIDEOfficial/AndroidIDE/releases
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Nhấn nút <strong>"Tải Full Source Code (.ZIP)"</strong> ở góc trên để tải file <code className="text-amber-300">DroidTranslator-Native-Android-Studio.zip</code>.
                    </li>
                    <li>
                      Dùng trình quản lý file (như <em>ZArchiver</em> hoặc <em>Files</em> của máy) giải nén file zip vào bộ nhớ máy (Ví dụ: <code className="text-neutral-300">/sdcard/AndroidIDEProjects/DroidTranslator-Native</code>).
                    </li>
                    <li>
                      Mở <strong>AndroidIDE</strong> -&gt; Chọn <strong>Open an existing project</strong> -&gt; Trỏ vào thư mục vừa giải nén.
                    </li>
                    <li>
                      Bấm nút <strong>Run</strong> (biểu tượng Play màu xanh) hoặc chọn menu <strong>Build -&gt; Assemble Debug</strong>. File APK sau khi build sẽ nằm tại:
                      <br />
                      <code className="text-emerald-400 font-mono">app/build/outputs/apk/debug/app-debug.apk</code>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Second Choice: Termux */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-100 text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Lựa Chọn 2: Termux (Dòng Lệnh Siêu Tốc)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                    Cực Nhẹ • Tốc Độ Cao
                  </span>
                </div>
                <p>
                  Thích hợp cho các máy cấu hình khiêm tốn hoặc người thích build qua dòng lệnh:
                </p>
                <div className="bg-black border border-neutral-800 rounded-lg p-2.5 font-mono text-[11px] text-emerald-400 space-y-1">
                  <div># 1. Cài đặt môi trường build</div>
                  <div>pkg update &amp;&amp; pkg install openjdk-17 gradle</div>
                  <div># 2. Vào thư mục dự án và build APK</div>
                  <div>cd DroidTranslator-Native</div>
                  <div>./gradlew assembleDebug</div>
                </div>
              </div>

              {/* Note on AIDE */}
              <div className="text-[11px] text-neutral-400 italic">
                * Lưu ý: Trình <strong>AIDE</strong> cũ trên CH Play hiện đã ngừng cập nhật, có quảng cáo và không hỗ trợ chuẩn Gradle 8.x / Java 17 mới của Android 14–16, do đó nên ưu tiên sử dụng <strong>AndroidIDE</strong> hoặc <strong>Termux</strong>.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-950 px-5 py-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowBuildApkGuide(false)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

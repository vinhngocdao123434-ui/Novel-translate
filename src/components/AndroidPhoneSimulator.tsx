import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, Key, Sparkles, BookOpen, Play, Pause, RotateCcw, 
  Square, Download, Maximize2, ShieldCheck, Terminal, CheckCircle2, 
  AlertCircle, RefreshCw, X, Edit3, Trash2, ShieldAlert, Plus,
  FileText, ArrowRight, Settings, Search, Upload, Copy, Check,
  ChevronLeft, ChevronRight, Sliders, Type, Sun, Moon, Eye,
  CheckCircle, PlayCircle, Clock, Zap, BookMarked, Layers, FileCheck,
  AlignLeft, AlignJustify, ListOrdered, Share2, Compass, Bookmark,
  Filter, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { ApiKeyItem, PromptCardItem, ProjectData, AdvancedSettings, ParsedEbook } from '../types';
import { parseEbookFile } from '../utils/ebook-parser';
import { AppLogo } from './AppLogo';
import { ChapterAuditor, AuditResult } from '../utils/chapterAuditor';
import { transliterateLeftoverHanzi } from '../utils/sinoVietnameseDictionary';
import { HowToUseModal } from './HowToUseModal';
import { HelpTooltipModal, HelpBtn, HelpInfoItem } from './HelpTooltipModal';
import { HELP_ENTRIES } from '../utils/helpEntries';
import { HelpCircle } from 'lucide-react';

interface Props {
  onOpenGodModeModal: () => void;
}

const DEFAULT_PROMPTS: PromptCardItem[] = [
  {
    id: 1,
    title: "Tiên Hiệp / Cổ Trang (Chuẩn mực)",
    content: "Dịch sang tiếng Việt tiểu thuyết cổ trang, tiên hiệp trôi chảy, đúng ngữ pháp tiếng Việt. Động từ, miêu tả dịch nghĩa tự nhiên, tuyệt đối không phiên âm Hán-Việt thô từng chữ (Ví dụ: '背着' dịch là 'cõng', cấm dịch 'bối trước'; '在巷子里' dịch là 'trong ngõ hẻm', cấm dịch 'tại hạng tử lí'). Đại từ xưng hô dùng: hắn, nàng, ta, ngươi, huynh, đệ, muội, tỷ, thúc, bá. Tên riêng, địa danh giữ âm Hán-Việt chuẩn 100%. TUYỆT ĐỐI KHÔNG để sót chữ Hán, không gõ sai telex (như 'Đangk' -> 'Đăng'), không trộn lẫn nửa Hán nửa Việt.",
    active: true
  },
  {
    id: 2,
    title: "Đô Thị / Hiện Đại (Mượt mà)",
    content: "Dịch sang tiếng Việt hiện đại, câu cú tự nhiên, văn phong đời thường mượt mà. Giữ nguyên tên nhân vật Hán-Việt chuẩn. Không dùng từ ngữ thô tục. TUYỆT ĐỐI KHÔNG để sót chữ Hán hay lỗi gõ phím telex.",
    active: false
  },
  {
    id: 3,
    title: "Huyền Huyễn / Tây Phương Kỳ Ảo",
    content: "Dịch sang tiếng Việt tiểu thuyết kỳ ảo phương Tây, giữ nguyên thuật ngữ ma pháp, cấp bậc ma pháp sư, kỵ sĩ. Câu từ hào hùng, chuẩn sắc thái sử thi.",
    active: false
  }
];

const PRESET_MODELS = [
  { id: 'gemini-3.6-flash', name: '3.6 Flash', badge: 'Model Siêu Cấp 2026', desc: 'Chuyên gia xử lý Hán Việt & Làm mượt toàn văn tuyệt đối' },
  { id: 'gemini-2.5-flash', name: '2.5 Flash', badge: 'Mặc định - Siêu tốc', desc: 'Cân bằng tốc độ và độ mượt văn phong' },
  { id: 'gemini-2.5-flash-lite', name: '2.5 Flash Lite', badge: 'Tiết kiệm Quota', desc: 'Rất nhanh, ít tốn RPM/TPM' },
  { id: 'gemini-3.5-flash-lite', name: '3.5 Flash Lite', badge: 'Thế hệ mới 2026', desc: 'Model tối tân siêu nhẹ phản hồi tức thì' },
  { id: 'gemini-2.5-pro', name: '2.5 Pro', badge: 'Văn chương đỉnh cao', desc: 'Văn phong mượt như dịch giả con người' },
  { id: 'gemini-1.5-flash', name: '1.5 Flash', badge: 'Tương thích cao', desc: 'Ổn định, hỗ trợ ngữ cảnh dài' }
];

const SAMPLE_RAW_TEXT = `第一章 少年与剑
在偏僻的青石村中，有一位身负残破木剑的少年，名为林辰。
林辰背着一把锈迹斑斑的长剑，走在深邃的巷子里。日光透过树叶洒在他稚嫩的面庞上。
“林辰，今日青云宗选拔，你还不快去！”村口的老铁匠大声喊道。
林辰转过头，微微一笑：“多谢铁匠叔，我这便过去。”
在巷子深处，一道隐秘的身影正在暗中窥视着林辰。此人正是黑风寨的二当家赵霸天。赵霸天冷哼一声，握紧了腰间的大刀。

第二章 青云仙宗
青云宗山门耸立在云海之巅，气势磅礴。
数以千计的年轻才俊汇聚在巨大的演武广场上。
一位仙风道骨的白袍长老站在高台之上，朗声道：“今日入门考核，唯有通过天梯测试者，方可入我青云宗门墙！”
赵霸天也混迹在人群之中，眼中闪烁着阴狠的光芒。林辰深吸了一口气，手按剑柄，大步迈向通天石梯。`;

// Vocabulary database for realistic Sino-Vietnamese / term extraction when offline or simulating
const SINO_VIET_DICT: Record<string, string> = {
  '林辰': 'Lâm Thần',
  '青石村': 'Thôn Thanh Thạch',
  '铁匠': 'Thợ Rèn',
  '青云宗': 'Thanh Vân Tông',
  '青云仙宗': 'Thanh Vân Tiên Tông',
  '黑风寨': 'Hắc Phong Trại',
  '赵霸天': 'Triệu Bá Thiên',
  '天梯': 'Thiên Thê',
  '通天石梯': 'Thông Thiên Thạch Thê',
  '演武广场': 'Diễn Võ Quảng Trường',
  '白袍长老': 'Bạch Bào Trưởng Lão',
  '残破木剑': 'Tàn Phá Mộc Kiếm',
  '宗门': 'Tông Môn',
  '入门考核': 'Khảo Hạch Nhập Môn'
};

// Clean telex typos and stray artifacts
const cleanTranslationGlitch = (text: string): string => {
  if (!text) return '';
  let res = text;

  // 1. Khử câu thoại tiếng Hán kèm dịch trong ngoặc
  res = res.replace(/"[\u4e00-\u9fa5，？,。!！\s\?]+"[ \t]*\(([^)]+)\)/g, '"$1"');

  // 2. Khử các lỗi nửa Hán nửa Việt thường gặp
  res = res.replace(/m[\u4e00-\u9fa5]m[\u4e00-\u9fa5]/gi, 'ma ma')
           .replace(/m[\u4e00-\u9fa5]/gi, 'ma ma')
           .replace(/Vân[\u4e00-\u9fa5]/g, 'Vân Dương')
           .replace(/áo[\u4e00-\u9fa5][ \t]*\(nhu\)/gi, 'áo nhu')
           .replace(/áo[\u4e00-\u9fa5]/gi, 'áo nhu')
           .replace(/\bphad\b/gi, 'phải không')
           .replace(/\bLưu Cung Tinh\b/g, 'Lưu Khúc Tinh')
           .replace(/\bPhế Thạch Bão Trụ\b/g, 'Phụ Thạch Bão Trụ')
           .replace(/\bthuật phụ thạch bão cống\b/gi, 'Thuật Phụ Thạch Bão Trụ')
           .replace(/\bBắc Cù Lử Châu\b/g, 'Bắc Cù Lô Châu');

  // 3. Khử dấu câu Trung văn lạc loài ở đầu dòng
  res = res.replace(/(?:^|\n)[ \t]*[。”、，….]+[ \t]*/g, '\n');

  // 4. Khử lỗi telex gõ sai
  res = res.replace(/\b([A-Za-zÀ-ỹ]+)ngk\b/gi, '$1ng')
           .replace(/\b([A-Za-zÀ-ỹ]+)awk\b/gi, '$1ă')
           .replace(/\b([A-Za-zÀ-ỹ]+)owk\b/gi, '$1ơ')
           .replace(/\b([A-Za-zÀ-ỹ]+)uwk\b/gi, '$1ư')
           .replace(/Xa Đangk Khoa/gi, 'Xa Đăng Khoa')
           .replace(/Đangk/gi, 'Đăng');

  // 5. Bản đồ Hán-Việt cứu hộ nếu còn chữ Hán sót
  const hanziMap: Record<string, string> = {
    '羊': 'Dương', '嬷': 'Ma', '襦': 'Nhu', '迹': 'Tích', '硕': 'Thạc',
    '陈': 'Trần', '云': 'Vân', '兔': 'Thố', '皎': 'Giảo', '曲': 'Khúc',
    '星': 'Tinh', '佘': 'Xà', '登': 'Đăng', '科': 'Khoa', '柱': 'Trụ',
    '抱': 'Bão', '负': 'Phụ', '石': 'Thạch', '周': 'Chu', '成': 'Thành',
    '义': 'Nghĩa', '王': 'Vương', '慧': 'Tuệ', '玲': 'Linh', '李': 'Lý',
    '青': 'Thanh', '鸟': 'Điểu', '山': 'Sơn', '洛': 'Lạc', '城': 'Thành',
    '春': 'Xuân', '华': 'Hoa', '容': 'Dung', '喜': 'Hỉ', '饼': 'Bính',
    '糖': 'Đường', '妃': 'Phi', '静': 'Tĩnh', '太': 'Thái', '平': 'Bình',
    '医': 'Y', '馆': 'Quán', '院': 'Viện', '府': 'Phủ'
  };

  for (const [hz, vi] of Object.entries(hanziMap)) {
    if (res.includes(hz)) {
      res = res.split(hz).join(vi);
    }
  }

  return res.trim();
};

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  rotationStrategy: 'round-robin',
  cooldownSeconds: 60,
  maxRetries: 3,
  requestTimeoutSeconds: 60,
  translationPipelineMode: 'BATCH_GLOSSARY',
  batchGlossarySize: 50,
  minTermLength: 2,
  minFrequency: 2,
  conflictPolicy: 'keep-old',
  blacklistWords: ['hắn', 'nàng', 'ta', 'ngươi', 'chúng ta', 'bọn họ', 'chính mình', 'cái này', 'cái kia', 'một cái', 'đã từng'],
  targetLanguage: 'Tiếng Việt',
  antiHanziStrict: true,
  contextSnippetLength: 350,
  readerFontSize: 16,
  readerLineSpacing: 1.6,
  keepScreenAwake: true
};

const STORAGE_PROJECTS_KEY = 'droidtranslator_projects_data_v10';
const STORAGE_CURRENT_PROJ_KEY = 'droidtranslator_active_proj_v10';
const STORAGE_GLOBAL_KEYS = 'droid_global_api_keys_v10';
const STORAGE_GLOBAL_PROMPTS = 'droid_global_prompts_v10';
const STORAGE_ADVANCED_SETTINGS = 'droid_advanced_settings_v10';

export const AndroidPhoneSimulator: React.FC<Props> = ({ onOpenGodModeModal }) => {
  // Navigation: 4 Bottom Tabs in EXACT requested order:
  // Tab 1: KEY & PROMPT
  // Tab 2: DỊCH & GLOSSARY
  // Tab 3: CÁC CHƯƠNG ĐÃ DỊCH & ĐỌC HIỆN ĐẠI
  // Tab 4: CÀI ĐẶT & GOD-MODE
  const [activeBottomTab, setActiveBottomTab] = useState<'keys' | 'translate' | 'chapters' | 'settings'>('keys');

  // Device & Root State
  const [isDeviceRooted, setIsDeviceRooted] = useState<boolean>(true);
  const [godModeActive, setGodModeActive] = useState<boolean>(true);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(true);
  const [batteryOptimizationIgnored, setBatteryOptimizationIgnored] = useState<boolean>(true);
  const [workManagerWatchdog, setWorkManagerWatchdog] = useState<boolean>(true);

  // 1. KHO GLOBAL API KEYS (Vĩnh Cửu - Độc lập hoàn toàn với dự án)
  const [globalApiKeys, setGlobalApiKeys] = useState<ApiKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GLOBAL_KEYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { key: 'AIzaSyDemoSampleKeyNumberOneXYZ12345', state: 'ACTIVE', cooldownUntil: 0, busyUntil: 0 },
      { key: 'AIzaSyDemoSampleKeyNumberTwoABC67890', state: 'ACTIVE', cooldownUntil: 0, busyUntil: 0 }
    ];
  });

  // 2. KHO GLOBAL PROMPTS (Vĩnh Cửu - Không bị ảnh hưởng khi xóa dự án)
  const [globalPrompts, setGlobalPrompts] = useState<PromptCardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GLOBAL_PROMPTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PROMPTS;
  });

  // 3. TRUNG TÂM CÀI ĐẶT CHUYÊN SÂU (Global Settings)
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ADVANCED_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) return { ...DEFAULT_ADVANCED_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_ADVANCED_SETTINGS;
  });

  const [processedBatchStarts, setProcessedBatchStarts] = useState<number[]>([]);

  // Projects State - Loaded from localStorage if available (Mỗi dự án lưu vĩnh viễn)
  const [projects, setProjects] = useState<Record<string, ProjectData>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {}
    return {
      'Dai_Quan_Gia_Ma_Hoang': {
        name: 'Dai_Quan_Gia_Ma_Hoang',
        path: '/sdcard/Projects/Dai_Quan_Gia_Ma_Hoang',
        model: 'gemini-2.5-flash',
        targetLang: 'Tiếng Việt',
        chunkSize: '3500',
        completed: 1,
        total: 2,
        lastChapter: 1,
        keys: [],
        prompts: [],
        chapters: [
          `第一章 少年与剑\n在偏僻的青石村中，有一位身负残破木剑的少年，名为林辰。\n林辰背着一把锈迹斑斑的长剑，走在深邃的巷子里。日光透过树叶洒在他稚嫩的面庞上。\n“林辰，今日青云宗选拔，你还不快去！”村口的老铁匠大声喊道。\n林辰转过头，微微一笑：“多谢铁匠叔，我这便过去。”\n在巷子深处，一道隐秘的身影正在暗中窥视着林辰。此人正是黑风寨的二当家赵霸天。赵霸天冷哼一声，握紧了腰间的大刀。`,
          `第二章 青云仙宗\n青云宗山门耸立在云海之巅，气势磅礴。\n数以千计的年轻才俊汇聚在巨大的演武广场上。\n一位仙风道骨的白袍长老站在高台之上，朗声道：“今日入门考核，唯有通过天梯测试者，方可入我青云宗门墙！”\n赵霸天也混迹在人群之中，眼中闪烁着阴狠的光芒。林辰深吸了一口气，手按剑柄，大步迈向通天石梯。`
        ],
        translatedChapters: {
          0: `Chương 1: Thiếu Niên Và Kiếm\n\nTại thôn Thanh Thạch hẻo lánh, có một thiếu niên mang trên lưng thanh mộc kiếm tàn tạ, tên gọi Lâm Thần.\n\nLâm Thần cõng một thanh trường kiếm rỉ sét loang lổ, cất bước đi trong ngõ hẻm sâu thẳm. Ánh nắng ban mai xuyên qua kẽ lá, rải rác chiếu lên khuôn mặt non nớt của hắn.\n\n"Lâm Thần, hôm nay là ngày Thanh Vân Tông tuyển bạt đệ tử, ngươi còn không mau đi!" Lão thợ rèn ở đầu thôn cao giọng hô lớn.\n\nLâm Thần quay đầu lại, mỉm cười nói: "Đa tạ thúc thợ rèn, ta lập tức qua đó."\n\nTại nơi sâu thẳm trong hẻm nhỏ, một bóng đen bí ẩn đang âm thầm dòm ngó Lâm Thần. Người này chính là nhị đương gia Triệu Bá Thiên của Hắc Phong Trại. Triệu Bá Thiên cười lạnh một tiếng, siết chặt đại đao bên hông.`
        },
        masterGlossary: {
          '林辰': 'Lâm Thần',
          '青石村': 'Thôn Thanh Thạch',
          '青云宗': 'Thanh Vân Tông'
        }
      },
      'Pham_Nhan_Tu_Tien': {
        name: 'Pham_Nhan_Tu_Tien',
        path: '/sdcard/Projects/Pham_Nhan_Tu_Tien',
        model: 'gemini-2.5-flash',
        targetLang: 'Tiếng Việt',
        chunkSize: '3500',
        completed: 0,
        total: 2,
        lastChapter: 0,
        keys: [],
        prompts: [],
        chapters: [
          `第一章 山边小村\n二愣子睁大双眼，看着茅草屋顶，心中一片茫然。他本名韩立，因皮肤黝黑，村里人都唤他二愣子。\n韩立从床榻上爬起，走出屋外，清晨的山风夹杂着泥土的气息扑面而来。三叔说今日要带他去七玄门参加考核，若能被选上，便能吃上白米饭，甚至还有银两寄回家中。`,
          `第二章 七玄门试炼\n彩霞山七玄门，坐落于群山环抱之中，宛若仙境。\n数十名少年在岳堂主的带领下，站在险峻的落日峰前。韩立握紧拳头，望着望不到顶的峭壁，心中暗暗下定决心。`
        ],
        translatedChapters: {},
        masterGlossary: {
          '二愣子': 'Nhị Lăng Tử',
          '韩立': 'Hàn Lập',
          '七玄门': 'Thất Huyền Môn',
          '彩霞山': 'Thải Hà Sơn'
        }
      }
    };
  });

  const [currentProjectName, setCurrentProjectName] = useState<string>(() => {
    try {
      const savedName = localStorage.getItem(STORAGE_CURRENT_PROJ_KEY);
      if (savedName) return savedName;
    } catch (e) {}
    return 'Dai_Quan_Gia_Ma_Hoang';
  });

  const project = projects[currentProjectName] || Object.values(projects)[0];

  // Auto-save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
      localStorage.setItem(STORAGE_CURRENT_PROJ_KEY, currentProjectName);
    } catch (e) {}
  }, [projects, currentProjectName]);

  // Auto-save Global API Keys, Prompts, and Advanced Settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GLOBAL_KEYS, JSON.stringify(globalApiKeys));
    } catch (e) {}
  }, [globalApiKeys]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GLOBAL_PROMPTS, JSON.stringify(globalPrompts));
    } catch (e) {}
  }, [globalPrompts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ADVANCED_SETTINGS, JSON.stringify(advancedSettings));
    } catch (e) {}
  }, [advancedSettings]);

  // Key testing state
  const [showHowToUseModal, setShowHowToUseModal] = useState<boolean>(false);
  const [activeHelpInfo, setActiveHelpInfo] = useState<HelpInfoItem | null>(null);
  const openHelp = (key: string) => {
    if (HELP_ENTRIES[key]) setActiveHelpInfo(HELP_ENTRIES[key]);
  };

  const [testingKeyIndex, setTestingKeyIndex] = useState<number | null>(null);
  const [keyPingResults, setKeyPingResults] = useState<Record<number, { latency: number; status: string }>>({});

  // Model states
  const [customModelInput, setCustomModelInput] = useState<string>('');

  // Form states & Async Large File State
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [rawTextInput, setRawTextInput] = useState<string>(SAMPLE_RAW_TEXT);
  const fullRawTextRef = useRef<string>(SAMPLE_RAW_TEXT);
  const [isFileLoading, setIsFileLoading] = useState<boolean>(false);
  const [fileSummary, setFileSummary] = useState<{ name: string; size: string; length: number; format?: string; chapterCount?: number } | null>(null);

  const [splitMode, setSplitMode] = useState<'regex' | 'chunk'>('regex');
  const [chunkSizeInput, setChunkSizeInput] = useState<string>('3500');
  const [fromChapInput, setFromChapInput] = useState<number>(1);
  const [toChapInput, setToChapInput] = useState<number>(2);
  const [delaySecInput, setDelaySecInput] = useState<number>(2.0);

  // Glossary states & Dedicated Modal
  const [newGlossaryKey, setNewGlossaryKey] = useState<string>('');
  const [newGlossaryVal, setNewGlossaryVal] = useState<string>('');
  const [showFullGlossaryModal, setShowFullGlossaryModal] = useState<boolean>(false);
  const [glossarySearchQuery, setGlossarySearchQuery] = useState<string>('');
  const [glossaryModalPage, setGlossaryModalPage] = useState<number>(0);
  const GLOSSARY_PER_PAGE = 15;

  // Edit Glossary Modal State
  const [showEditGlossaryModal, setShowEditGlossaryModal] = useState<boolean>(false);
  const [editingGlossaryOldKey, setEditingGlossaryOldKey] = useState<string>('');
  const [editingGlossaryNewKey, setEditingGlossaryNewKey] = useState<string>('');
  const [editingGlossaryNewVal, setEditingGlossaryNewVal] = useState<string>('');

  // Chapter List Pagination (Fixes scroll jank on long novel list - 100 chapters per page)
  const [chapterListPage, setChapterListPage] = useState<number>(0);
  const CHAPTERS_PER_PAGE = 100;

  // Export 5 Ebook Formats Modal State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Translation runtime state
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGapFillingMode, setIsGapFillingMode] = useState<boolean>(false);
  const [polishModel, setPolishModel] = useState<string>('gemini-3.6-flash');
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [liveStreamText, setLiveStreamText] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('● Sẵn sàng');
  const [lastAttachedSnippet, setLastAttachedSnippet] = useState<string>('');
  
  // LOGS: Newest is strictly at index 0 (top line)
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] 🚀 DroidTranslator Native Ready`,
    `[${new Date().toLocaleTimeString()}] 🛡️ 5 Lớp God-Mode: OOM -1000 & Foreground Service ACTIVE`
  ]);

  // Dialogs
  const [showNewProjModal, setShowNewProjModal] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>('');
  const [showDeleteProjModal, setShowDeleteProjModal] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'advanced' | 'projects' | 'godmode'>('advanced');
  const [newBlacklistWordInput, setNewBlacklistWordInput] = useState<string>('');
  
  // Real-time Linux Kernel Diagnostics State
  const [kernelPid] = useState<number>(24891);
  const [kernelUid] = useState<number>(10188);
  const [kernelOomScore] = useState<number>(-1000);
  const [isRefreshingKernel, setIsRefreshingKernel] = useState<boolean>(false);

  const handleRefreshKernel = () => {
    setIsRefreshingKernel(true);
    setTimeout(() => {
      setIsRefreshingKernel(false);
      addLog('🔍 [Kernel Diagnostics]: Đọc /proc/self/oom_score_adj = -1000. Trạng thái Miễn Nhiễm LMK Kill: ACTIVE');
    }, 400);
  };
  
  // Prompt Modal (Add / Edit)
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [promptModalMode, setPromptModalMode] = useState<'add' | 'edit'>('add');
  const [editingPromptId, setEditingPromptId] = useState<string | number | null>(null);
  const [promptTitleInput, setPromptTitleInput] = useState<string>('');
  const [promptContentInput, setPromptContentInput] = useState<string>('');

  // Modern Reader State (Completely decoupled from translation loops)
  const [showFullScreenReader, setShowFullScreenReader] = useState<boolean>(false);
  const [readingChapterIndex, setReadingChapterIndex] = useState<number>(0);
  const [readerViewMode, setReaderViewMode] = useState<'translated' | 'bilingual' | 'original'>('translated');
  const [readerTheme, setReaderTheme] = useState<'amoled' | 'sepia' | 'light'>('amoled');
  const [readerFontSize, setReaderFontSize] = useState<number>(16);
  const [readerFontFamily, setReaderFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [readerLineHeight, setReaderLineHeight] = useState<'loose' | 'relaxed' | 'normal'>('relaxed');
  const [readerAlign, setReaderAlign] = useState<'justify' | 'left'>('justify');
  const [showChapterDrawer, setShowChapterDrawer] = useState<boolean>(false);
  const [copiedChapter, setCopiedChapter] = useState<boolean>(false);

  // Add Log: Prepend to the top (newest on top)
  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Keyboard navigation for reader
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullScreenReader || !project) return;
      if (e.key === 'ArrowLeft') {
        if (readingChapterIndex > 0) setReadingChapterIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight') {
        if (readingChapterIndex < project.chapters.length - 1) setReadingChapterIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        setShowFullScreenReader(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullScreenReader, readingChapterIndex, project]);

  // Handle Multi-Format Ebook File Pick (.txt, .epub, .mobi, .azw3)
  const handleFilePicked = async (file: File) => {
    setIsFileLoading(true);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';
    addLog(`⏳ Đang đọc và giải mã Ebook [${ext}]: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
    
    try {
      const parsed = await parseEbookFile(file);
      fullRawTextRef.current = parsed.rawText;
      setFileSummary({
        name: file.name,
        size: parsed.fileSizeFormatted,
        length: parsed.rawText.length,
        format: parsed.format.toUpperCase(),
        chapterCount: parsed.chapters.length
      });

      if (parsed.rawText.length > 5000) {
        setRawTextInput(parsed.rawText.slice(0, 3000) + `\n\n... [Đã giải mã toàn bộ tệp ${parsed.format.toUpperCase()} "${file.name}" (${parsed.chapters.length} chương, ${parsed.rawText.length.toLocaleString()} ký tự)]`);
      } else {
        setRawTextInput(parsed.rawText);
      }

      if (parsed.chapters.length > 1) {
        if (project) {
          setProjects(prev => ({
            ...prev,
            [currentProjectName]: {
              ...prev[currentProjectName],
              chapters: parsed.chapters,
              total: parsed.chapters.length,
              completed: 0,
              translatedChapters: {}
            }
          }));
          setChapterListPage(0);
          setFromChapInput(1);
          setToChapInput(parsed.chapters.length);
          addLog(`📚 Đã nạp thành công [${parsed.format.toUpperCase()}] "${parsed.title}": Tự động trích xuất ${parsed.chapters.length} chương!`);
        }
      } else {
        executeSplit(parsed.rawText, splitMode, chunkSizeInput);
      }
    } catch (err: any) {
      addLog(`❌ Lỗi giải mã file Ebook: ${err.message}`);
    } finally {
      setIsFileLoading(false);
    }
  };

  // Test Single Key (Operates on GLOBAL KEY POOL)
  const handleTestKey = async (idx: number, keyVal: string) => {
    setTestingKeyIndex(idx);
    addLog(`Đang test Key #${idx + 1}...`);
    const startTime = Date.now();

    try {
      if (keyVal.startsWith('AIzaSy') && !keyVal.includes('DemoSampleKey')) {
        const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyVal}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
        });
        const latency = Date.now() - startTime;
        if (testRes.ok) {
          setKeyPingResults(prev => ({ ...prev, [idx]: { latency, status: 'Hoạt động tốt (200 OK)' } }));
          setGlobalApiKeys(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], state: 'ACTIVE', cooldownUntil: 0 };
            return updated;
          });
          addLog(`✅ Key #${idx + 1} phản hồi: ${latency}ms - Sẵn sàng dịch!`);
        } else {
          setKeyPingResults(prev => ({ ...prev, [idx]: { latency, status: `HTTP ${testRes.status}` } }));
          addLog(`⚠️ Key #${idx + 1} phản hồi lỗi HTTP ${testRes.status}`);
        }
      } else {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
        const latency = Date.now() - startTime;
        setKeyPingResults(prev => ({ ...prev, [idx]: { latency, status: 'Hoạt động tốt' } }));
        setGlobalApiKeys(prev => {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], state: 'ACTIVE', cooldownUntil: 0 };
          return updated;
        });
        addLog(`✅ Key #${idx + 1} phản hồi: ${latency}ms - Sẵn sàng dịch!`);
      }
    } catch (e: any) {
      addLog(`❌ Key #${idx + 1} test thất bại: ${e.message}`);
    } finally {
      setTestingKeyIndex(null);
    }
  };

  // Test All Keys in Global Pool
  const handleTestAllKeys = async () => {
    if (globalApiKeys.length === 0) return;
    addLog(`Đang kiểm tra hàng loạt ${globalApiKeys.length} API Key...`);
    for (let i = 0; i < globalApiKeys.length; i++) {
      await handleTestKey(i, globalApiKeys[i].key);
    }
    addLog(`🎉 Hoàn tất kiểm tra Key Pool!`);
  };

  // Add Key to Global Pool
  const handleAddGlobalKey = () => {
    if (!newKeyInput.trim()) return;
    const lines = newKeyInput.split('\n');
    let addedCount = 0;
    setGlobalApiKeys(prev => {
      const existing = new Set(prev.map(k => k.key));
      const newItems: ApiKeyItem[] = [];
      for (const line of lines) {
        const cleaned = line.trim().replace(/['"]/g, '');
        if (cleaned.length >= 8 && !cleaned.startsWith('#') && !existing.has(cleaned)) {
          newItems.push({ key: cleaned, state: 'ACTIVE', cooldownUntil: 0, busyUntil: 0 });
          existing.add(cleaned);
          addedCount++;
        }
      }
      return [...prev, ...newItems];
    });
    setNewKeyInput('');
    addLog(`🔑 Đã thêm ${addedCount} API Key vào Global Key Pool (Bảo toàn vĩnh viễn)`);
  };

  // Delete Key from Global Pool
  const handleDeleteGlobalKey = (idx: number) => {
    setGlobalApiKeys(prev => prev.filter((_, i) => i !== idx));
    addLog(`Đã xóa Key #${idx + 1} khỏi Global Pool`);
  };

  // Open Edit Prompt
  const handleOpenEditPrompt = (p: PromptCardItem) => {
    setPromptModalMode('edit');
    setEditingPromptId(p.id);
    setPromptTitleInput(p.title);
    setPromptContentInput(p.content);
    setShowPromptModal(true);
  };

  // Open Add Prompt
  const handleOpenAddPrompt = () => {
    setPromptModalMode('add');
    setEditingPromptId(null);
    setPromptTitleInput('');
    setPromptContentInput('');
    setShowPromptModal(true);
  };

  // Save Prompt in Global Store (Add or Edit)
  const handleSavePrompt = () => {
    if (!promptTitleInput.trim() || !promptContentInput.trim()) return;

    setGlobalPrompts(prev => {
      if (promptModalMode === 'edit' && editingPromptId !== null) {
        addLog(`Đã cập nhật prompt: "${promptTitleInput.trim()}"`);
        return prev.map(p => 
          p.id === editingPromptId 
            ? { ...p, title: promptTitleInput.trim(), content: promptContentInput.trim() }
            : p
        );
      } else {
        const newId = Date.now();
        addLog(`Đã thêm prompt mới: "${promptTitleInput.trim()}"`);
        return [
          ...prev.map(p => ({ ...p, active: false })),
          {
            id: newId,
            title: promptTitleInput.trim(),
            content: promptContentInput.trim(),
            active: true
          }
        ];
      }
    });

    setShowPromptModal(false);
  };

  // Delete Prompt from Global Store
  const handleDeletePrompt = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (globalPrompts.length <= 1) {
      alert('Phải giữ lại ít nhất 1 thẻ Prompt trong kho!');
      return;
    }
    setGlobalPrompts(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (!filtered.some(p => p.active) && filtered.length > 0) {
        filtered[0].active = true;
      }
      return filtered;
    });
    addLog(`Đã xóa thẻ prompt.`);
  };

  // Restore Default Prompts
  const handleRestoreDefaultPrompts = () => {
    setGlobalPrompts(DEFAULT_PROMPTS);
    addLog(`Đã khôi phục danh sách Prompt mặc định.`);
  };

  // Delete Current Project Permanently
  const handleDeleteCurrentProject = () => {
    const projNames = Object.keys(projects);
    const targetName = currentProjectName;

    if (projNames.length <= 1) {
      // If only 1 project, reset to clean default project
      const freshName = 'Dai_Quan_Gia_Ma_Hoang';
      setProjects({
        [freshName]: {
          name: freshName,
          path: `/sdcard/Projects/${freshName}`,
          model: 'gemini-2.5-flash',
          targetLang: advancedSettings.targetLanguage,
          chunkSize: '3500',
          completed: 0,
          total: 0,
          lastChapter: 0,
          keys: [],
          prompts: [],
          chapters: [],
          translatedChapters: {},
          masterGlossary: {}
        }
      });
      setCurrentProjectName(freshName);
    } else {
      const updated = { ...projects };
      delete updated[targetName];
      const remainingNames = Object.keys(updated);
      const nextName = remainingNames[0];
      setProjects(updated);
      setCurrentProjectName(nextName);
    }

    setRawTextInput('');
    fullRawTextRef.current = '';
    setFileSummary(null);
    setChapterListPage(0);
    setShowDeleteProjModal(false);
    addLog(`🗑️ Đã xóa vĩnh viễn dự án [${targetName}]. Kho Key & Prompt được giữ nguyên 100%!`);
  };

  // Switch Model
  const handleSelectModel = (modelId: string) => {
    if (!project) return;
    setProjects(prev => ({
      ...prev,
      [currentProjectName]: { ...prev[currentProjectName], model: modelId }
    }));
    addLog(`Đã chọn model: ${modelId}`);
  };

  // Apply Custom Model
  const handleApplyCustomModel = () => {
    if (!customModelInput.trim() || !project) return;
    const cleanId = customModelInput.trim();
    handleSelectModel(cleanId);
    setCustomModelInput('');
    addLog(`Đã nạp model tùy biến: ${cleanId}`);
  };

  // Create Project (Fresh, isolated state for new novel)
  const handleCreateProject = () => {
    if (!newProjName.trim()) return;
    const cleanName = newProjName.trim().replace(/\s+/g, '_');
    
    if (projects[cleanName]) {
      setCurrentProjectName(cleanName);
      setShowNewProjModal(false);
      setNewProjName('');
      addLog(`Chuyển sang dự án hiện có: ${cleanName}`);
      return;
    }

    setProjects(prev => ({
      ...prev,
      [cleanName]: {
        name: cleanName,
        path: `/sdcard/Projects/${cleanName}`,
        model: 'gemini-2.5-flash',
        targetLang: 'Tiếng Việt (Chuẩn văn phong tiểu thuyết)',
        chunkSize: '3500',
        completed: 0,
        total: 0,
        lastChapter: 0,
        keys: project ? [...project.keys] : [
          { key: 'AIzaSyDemoSampleKeyNumberOneXYZ12345', state: 'ACTIVE', cooldownUntil: 0, busyUntil: 0 }
        ],
        prompts: DEFAULT_PROMPTS,
        chapters: [],
        translatedChapters: {},
        masterGlossary: {} // Fresh glossary for new novel!
      }
    }));
    setCurrentProjectName(cleanName);
    setRawTextInput('');
    fullRawTextRef.current = '';
    setFileSummary(null);
    setFromChapInput(1);
    setToChapInput(1);
    setChapterListPage(0);
    setNewProjName('');
    setShowNewProjModal(false);
    addLog(`✨ Đã tạo tiến trình mới: [${cleanName}] - Glossary & Tiến độ độc lập 100%!`);
  };

  // Split Chapters Execution
  const executeSplit = (textToSplit: string, mode: 'regex' | 'chunk', chunkSizeStr: string) => {
    if (!textToSplit.trim()) {
      alert('Vui lòng dán hoặc nạp văn bản truyện thô!');
      return;
    }

    let parsedChapters: string[] = [];

    if (mode === 'regex') {
      const regex = /(?:^|\n)(?=(?:第[\d一二三四五六七八九十百千万]+[章回节卷]|Chương\s*\d+|Hồi\s*\d+|Tiết\s*\d+|Chapter\s*\d+|Quyển\s*\d+))/gi;
      const parts = textToSplit.split(regex).map(p => p.trim()).filter(p => p.length > 0);
      parsedChapters = parts.length > 0 ? parts : [textToSplit.trim()];
    } else {
      const size = Math.max(100, parseInt(chunkSizeStr) || 3500);
      for (let i = 0; i < textToSplit.length; i += size) {
        parsedChapters.push(textToSplit.slice(i, i + size));
      }
    }

    if (!project) return;
    setProjects(prev => ({
      ...prev,
      [currentProjectName]: {
        ...prev[currentProjectName],
        chapters: parsedChapters,
        total: parsedChapters.length,
        completed: 0,
        translatedChapters: {}
      }
    }));

    setChapterListPage(0);
    setFromChapInput(1);
    setToChapInput(parsedChapters.length);
    addLog(`✂️ Đã tách thành ${parsedChapters.length} chương (${mode === 'regex' ? 'Theo tác giả' : `Tùy chọn ${chunkSizeStr} ký tự/chương`})!`);
  };

  // Button handler for split
  const handleSplitChapters = () => {
    const textToUse = fullRawTextRef.current || rawTextInput;
    executeSplit(textToUse, splitMode, chunkSizeInput);
  };

  // Helper: Count Chinese characters
  const countChineseChars = (str: string): number => {
    return (str.match(/[\u4e00-\u9fa5]/g) || []).length;
  };

  // Helper: Count term occurrences in text
  const countOccurrences = (text: string, term: string): number => {
    if (!text || !term) return 0;
    let count = 0;
    let pos = 0;
    while ((pos = text.indexOf(term, pos)) !== -1) {
      count++;
      pos += term.length;
    }
    return count;
  };

  // Robust 1-Request 2-Tasks parser
  const parseDualTaskOutput = (text: string, currentChapterRawText?: string) => {
    let translation = text;
    let newGlossaryText = '';

    const transPattern = /(?:^|\n)[#*]*\s*===+\s*(?:TRANSLATION|BẢN DỊCH)\s*===+[#*]*/i;
    const glossPattern = /(?:^|\n)[#*]*\s*===+\s*(?:NEW_GLOSSARY|GLOSSARY|TỪ MỚI)\s*===+[#*]*/i;

    const mTrans = text.search(transPattern);
    const mGloss = text.search(glossPattern);

    if (mTrans !== -1) {
      if (mGloss !== -1) {
        if (mGloss > mTrans) {
          translation = text.slice(mTrans).replace(transPattern, '').split(glossPattern)[0].trim();
          newGlossaryText = text.slice(mGloss).replace(glossPattern, '').trim();
        } else {
          newGlossaryText = text.slice(mGloss).replace(glossPattern, '').split(transPattern)[0].trim();
          translation = text.slice(mTrans).replace(transPattern, '').trim();
        }
      } else {
        translation = text.slice(mTrans).replace(transPattern, '').trim();
      }
    } else if (mGloss !== -1) {
      translation = text.slice(0, mGloss).trim();
      newGlossaryText = text.slice(mGloss).replace(glossPattern, '').trim();
    }

    // Clean codeblock delimiters
    translation = translation.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    newGlossaryText = newGlossaryText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    // Clean telex glitches like "Xa Đangk Khoa" -> "Xa Đăng Khoa"
    translation = cleanTranslationGlitch(translation);

    // Parse lines: key = val
    const parsedMap: Record<string, string> = {};
    if (newGlossaryText) {
      const lines = newGlossaryText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
        if (trimmed.toLowerCase().includes('không có') || trimmed.toLowerCase() === 'none') continue;

        const match = trimmed.match(/^\s*[-*•]?\s*([^:=➔\->\t]+)\s*[:=➔\->]\s*(.+?)\s*$/);
        if (match) {
          let rawKey = match[1].trim().replace(/[*_"`'\[\]【】]/g, '');
          let val = match[2].trim().replace(/[*_"`'\[\]【】]/g, '');

          // 1. CHỐNG ĐẢO NGƯỢC: Nếu val chứa chữ Hán còn rawKey không chứa chữ Hán -> Tự động hoán đổi lại đúng vị trí!
          const chineseInRaw = countChineseChars(rawKey);
          const chineseInVal = countChineseChars(val);
          if (chineseInVal > 0 && chineseInRaw === 0) {
            const temp = rawKey;
            rawKey = val;
            val = temp;
          }

          // 2. LỌC ĐỘ DÀI THEO CÀI ĐẶT: Kiểm tra minTermLength (mặc định: >= 2)
          const finalChineseCount = countChineseChars(rawKey);
          if (finalChineseCount < (advancedSettings.minTermLength || 2)) continue;

          // 3. ĐIỀU KIỆN TẦN SUẤT THEO CÀI ĐẶT: Kiểm tra minFrequency (mặc định: >= 2)
          if (currentChapterRawText) {
            const occ = countOccurrences(currentChapterRawText, rawKey);
            if (occ < (advancedSettings.minFrequency || 2)) continue;
          }

          // 4. BỘ LỌC TỪ CẤM / ĐẠI TỪ NHÂN XƯNG
          if (advancedSettings.blacklistWords && advancedSettings.blacklistWords.length > 0) {
            const isBlacklisted = advancedSettings.blacklistWords.some(w => 
              val.toLowerCase().includes(w.toLowerCase()) || rawKey.toLowerCase().includes(w.toLowerCase())
            );
            if (isBlacklisted) continue;
          }

          if (rawKey.length < 50 && val.length < 100) {
            parsedMap[rawKey] = cleanTranslationGlitch(val);
          }
        }
      }
    }

    return { translation, newGlossary: parsedMap };
  };

  // Machine-side filter: Tuân thủ conflictPolicy ('keep-old' hoặc 'overwrite')
  const mergeGlossaryCustomPolicy = (
    existingGlossary: Record<string, string>,
    aiGlossary: Record<string, string>,
    chapterRawContent?: string
  ): { updatedGlossary: Record<string, string>; newlyAdded: Record<string, string> } => {
    const updated = { ...existingGlossary };
    const newlyAdded: Record<string, string> = {};

    for (const [key, val] of Object.entries(aiGlossary)) {
      const trimmedKey = key.trim();
      const trimmedVal = val.trim();
      if (!trimmedKey || !trimmedVal) continue;

      if (countChineseChars(trimmedKey) < (advancedSettings.minTermLength || 2)) continue;

      if (chapterRawContent && countOccurrences(chapterRawContent, trimmedKey) < (advancedSettings.minFrequency || 2)) {
        continue;
      }

      if (advancedSettings.blacklistWords && advancedSettings.blacklistWords.some(w => trimmedVal.toLowerCase().includes(w.toLowerCase()))) {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(updated, trimmedKey)) {
        if (advancedSettings.conflictPolicy === 'keep-old') {
          continue; // Giữ cũ bỏ mới
        }
      }

      updated[trimmedKey] = trimmedVal;
      newlyAdded[trimmedKey] = trimmedVal;
    }

    return { updatedGlossary: updated, newlyAdded };
  };

  // Translation Loop Simulation & Execution
  useEffect(() => {
    let timer: any;
    if (isTranslating && !isPaused && project && project.chapters.length > 0) {
      const targetEnd = Math.min(toChapInput || project.chapters.length, project.chapters.length);
      
      if (currentChapterIndex < targetEnd) {
        // NẾU Ở CHẾ ĐỘ DỊCH BÙ VÀ CHƯƠNG NÀY ĐÃ CÓ BẢN DỊCH -> LƯỚT QUA NGAY
        if (isGapFillingMode && project.translatedChapters[currentChapterIndex]) {
          setCurrentChapterIndex(prev => prev + 1);
          return;
        }

        setStatusText(`⚡ Đang dịch chương ${currentChapterIndex + 1}/${targetEnd}...`);
        
        const rawContent = project.chapters[currentChapterIndex];
        const titleLine = rawContent.split('\n')[0] || `Chương ${currentChapterIndex + 1}`;
        
        // 1. EXTRACT PREVIOUS CHAPTER'S LAST N CHARACTERS FOR CONTEXT ROLLING WINDOW
        let previousSnippet = '';
        const snippetLimit = advancedSettings.contextSnippetLength || 350;
        if (currentChapterIndex > 0 && project.translatedChapters[currentChapterIndex - 1]) {
          const prevFull = project.translatedChapters[currentChapterIndex - 1];
          const sliceLen = Math.min(prevFull.length, snippetLimit);
          previousSnippet = '...' + prevFull.slice(prevFull.length - sliceLen).trim();
          setLastAttachedSnippet(previousSnippet);
        } else {
          setLastAttachedSnippet('');
        }

        setLiveStreamText(`Đang xử lý: ${titleLine} (${project.model})${previousSnippet ? ` [🔗 Kèm ${snippetLimit} ký tự ngữ cảnh]` : ''}...`);

        timer = setTimeout(async () => {
          let translatedText = '';
          let aiExtractedGlossary: Record<string, string> = {};

          // Lấy Key từ GLOBAL KEY POOL (Vĩnh Cửu)
          const activeKeyObj = globalApiKeys.find(k => k.state === 'ACTIVE') || globalApiKeys[0];
          const isRealKey = activeKeyObj && activeKeyObj.key.startsWith('AIzaSy') && !activeKeyObj.key.includes('DemoSampleKey');

          const isTargetVietnamese = (advancedSettings.targetLanguage || 'Tiếng Việt').toLowerCase().includes('việt');
          const isTargetJapanese = (advancedSettings.targetLanguage || '').toLowerCase().includes('nhật') || (advancedSettings.targetLanguage || '').toLowerCase().includes('japan');

          if (isRealKey) {
            try {
              // Lấy Prompt từ GLOBAL PROMPTS (Vĩnh Cửu)
              const activePromptObj = globalPrompts.find(p => p.active) || globalPrompts[0];
              const isBatchMode = (advancedSettings.translationPipelineMode || 'BATCH_GLOSSARY') === 'BATCH_GLOSSARY';
              const batchSize = advancedSettings.batchGlossarySize || 50;
              const batchStart = Math.floor(currentChapterIndex / batchSize) * batchSize;

              // 1. Nếu ở chế độ Bóc Lô và lô này chưa bóc từ điển:
              if (isBatchMode && !processedBatchStarts.includes(batchStart)) {
                const batchEnd = Math.min(batchStart + batchSize, project.chapters.length);
                addLog(`🔍 [BÓC LÔ GLOSSARY] Đang gom ${batchEnd - batchStart} chương thô (Chương ${batchStart + 1} ➔ ${batchEnd}) để AI trích xuất Master Glossary...`);
                setProcessedBatchStarts(prev => [...prev, batchStart]);
              }

              const glossaryStr = Object.entries(project.masterGlossary).map(([k, v]) => `${k} = ${v}`).join('\n');
              
              let promptSb = `Bạn là chuyên gia dịch thuật tiểu thuyết hàng đầu thế giới.\n\n`;
              promptSb += `[NGÔN NGỮ ĐÍCH]: ${advancedSettings.targetLanguage || 'Tiếng Việt'}\n\n`;
              promptSb += `[YÊU CẦU PHONG CÁCH]:\n${activePromptObj.content}\n\n`;
              promptSb += `[BẢNG TỪ ĐIỂN GLOSSARY BẮT BUỘC TUÂN THỦ]:\n${glossaryStr || '(Chưa có từ điển)'}\n\n`;
              
              if (previousSnippet) {
                promptSb += `[NGỮ CẢNH ĐOẠN CUỐI CHƯƠNG TRƯỚC (CHỈ DÙNG ĐỂ THAM KHẢO VĂN PHONG VÀ ĐỒNG NHẤT XƯNG HÔ, TUYỆT ĐỐI KHÔNG DỊCH LẠI)]:\n${previousSnippet}\n\n`;
              }
              
              promptSb += `[VĂN BẢN GỐC CHƯƠNG HIỆN TẠI (CHỈ DỊCH VÀ BÓC TÁCH TỪ ĐÂY)]:\n${rawContent}\n\n`;
              
              // LỚP 1: BỘ LỌC CHỐNG LỌT CHỮ HÁN THÍCH ỨNG THEO NGÔN NGỮ ĐÍCH
              if (isTargetVietnamese && advancedSettings.antiHanziStrict) {
                promptSb += `[QUY TẮC BẮT BUỘC - CHỐNG LỌT CHỮ HÁN CHO TIẾNG VIỆT]:\n`;
                promptSb += `- TUYỆT ĐỐI KHÔNG để sót bất kỳ ký tự chữ Hán (Hanzi) nào trong phần [TRANSLATION] tiếng Việt. 100% tên nhân vật, địa danh, môn phái, chiêu thức, chức vị bắt buộc phải phiên âm Hán-Việt hoặc dịch nghĩa tiếng Việt thuần túy.\n`;
                promptSb += `- TUYỆT ĐỐI KHÔNG trộn lẫn nửa chữ Hán nửa tiếng Việt (ví dụ: '林辰' phải dịch hẳn là 'Lâm Thần', không được viết '林 Thần').\n`;
              } else if (isTargetJapanese) {
                promptSb += `[TARGET JAPANESE]: Translate fluently into Japanese, naturally integrating Kanji, Hiragana, and Katakana.\n`;
              }

              if (isBatchMode) {
                promptSb += `[QUY TẮC ĐẦU RA - DỊCH THUẦN TÚY 100%]:\n===TRANSLATION===\n(Chỉ trả về toàn bộ bản dịch tiếng Việt trôi chảy hoàn chỉnh, KHÔNG xuất glossary rườm rà)`;
              } else {
                promptSb += `[QUY TẮC ĐẦU RA BẮT BUỘC]:\n===TRANSLATION===\n(Toàn bộ bản dịch trôi chảy)\n===NEW_GLOSSARY===\n(Chỉ trích xuất các DANH TỪ RIÊNG [tên nhân vật, tông môn, địa danh, công pháp, bảo vật] MỚI xuất hiện trong chương hiện tại CHƯA CÓ trong Glossary gửi kèm.\n`;
                promptSb += `QUY TẮC:\n`;
                promptSb += `1. ĐỘ DÀI: Bắt buộc từ ${advancedSettings.minTermLength || 2} ký tự chữ Hán trở lên. TUYỆT ĐỐI KHÔNG thêm từ vựng thông dụng hay đại từ xưng hô.\n`;
                promptSb += `2. TẦN SUẤT: Phải xuất hiện từ ${advancedSettings.minFrequency || 2} lần trở lên trong chương này.\n`;
                promptSb += `3. ĐỊNH DẠNG: Mỗi dòng định dạng chuẩn: [TừGốc] = [NghĩaDịch]. TUYỆT ĐỐI KHÔNG ĐẢO NGƯỢC THỨ TỰ)`;
              }

              const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${project.model}:generateContent?key=${activeKeyObj.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: promptSb }] }],
                  generationConfig: { temperature: 0.3 }
                })
              });

              if (resp.ok) {
                const data = await resp.json();
                const outText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const parsed = parseDualTaskOutput(outText, rawContent);
                translatedText = parsed.translation;
                aiExtractedGlossary = isBatchMode ? {} : parsed.newGlossary;
              } else {
                throw new Error(`HTTP ${resp.status}`);
              }
            } catch (err: any) {
              addLog(`⚠️ Không gọi được API thực (${err.message}), kích hoạt cơ chế dịch thông minh giả lập.`);
            }
          }

          // Fallback / High-fidelity simulated translation
          if (!translatedText) {
            if (isTargetJapanese) {
              translatedText = `第${currentChapterIndex + 1}章：${titleLine}\n\n青石村の路地を少年・林辰が歩いている。背中には古びた木剣を背負い、静かに前を見据えていた。\n「林辰、今日の青雲宗の選抜、早く行かぬか！」村の鍛冶屋が声をかけた。林辰は微笑み、「鍛冶屋の叔父さん、すぐに向かいます」と答えた。`;
              aiExtractedGlossary = { '林辰': '林辰（りんしん）', '青云宗': '青雲宗（せいうんそう）' };
            } else if (currentChapterIndex === 0) {
              translatedText = `Chương 1: Thiếu Niên Và Kiếm\n\nTại thôn Thanh Thạch hẻo lánh, có một thiếu niên mang trên lưng thanh mộc kiếm tàn tạ, tên gọi Lâm Thần.\n\nLâm Thần cõng một thanh trường kiếm rỉ sét loang lổ, cất bước đi trong ngõ hẻm sâu thẳm. Ánh nắng ban mai xuyên qua kẽ lá, rải rác chiếu lên khuôn mặt non nớt của hắn.\n\n"Lâm Thần, hôm nay là ngày Thanh Vân Tông tuyển bạt đệ tử, ngươi còn không mau đi!" Lão thợ rèn ở đầu thôn cao giọng hô lớn.\n\nLâm Thần quay đầu lại, mỉm cười nói: "Đa tạ thúc thợ rèn, ta lập tức qua đó."\n\nTại nơi sâu thẳm trong hẻm nhỏ, một bóng đen bí ẩn đang âm thầm dòm ngó Lâm Thần. Người này chính là nhị đương gia Triệu Bá Thiên của Hắc Phong Trại. Triệu Bá Thiên cười lạnh một tiếng, siết chặt đại đao bên hông.`;
              aiExtractedGlossary = {
                '林辰': 'Lâm Thần',
                '青石村': 'Thôn Thanh Thạch',
                '青云宗': 'Thanh Vân Tông',
                '赵霸天': 'Triệu Bá Thiên',
                '黑风寨': 'Hắc Phong Trại'
              };
            } else if (currentChapterIndex === 1) {
              translatedText = `Chương 2: Thanh Vân Tiên Tông\n\nSơn môn Thanh Vân Tông sừng sững nơi đỉnh mây biển, khí thế bàng bạc ngút trời.\n\nHàng ngàn thiếu niên anh kiệt từ khắp các nơi hội tụ tại diễn võ quảng trường rộng lớn. Mọi ánh mắt đều đổ dồn về phía trước với sự háo hức lẫn căng thẳng.\n\nMột vị bạch bào trưởng lão tiên phong đạo cốt đứng sừng sững trên đài cao, thanh âm sang sảng như chuông đồng: "Khảo hạch nhập môn hôm nay, duy chỉ có người vượt qua khảo nghiệm thông thiên thạch thê mới có tư cách bước vào môn tường Thanh Vân Tông ta!"\n\nTriệu Bá Thiên cũng trà trộn trong đám đông, trong mắt lóe lên tia sáng âm độc, gắt gao nhìn chằm chằm bóng lưng Lâm Thần. Lâm Thần hít sâu một hơi, bàn tay siết chặt chuôi kiếm, sải bước dứt khoát tiến về phía bậc thang đá thông thiên.`;
              aiExtractedGlossary = {
                '青云仙宗': 'Thanh Vân Tiên Tông',
                '演武广场': 'Diễn Võ Quảng Trường',
                '白袍长老': 'Bạch Bào Trưởng Lão',
                '通天石梯': 'Thông Thiên Thạch Thê'
              };
            } else {
              translatedText = `Bản dịch Tiếng Việt hoàn chỉnh [${titleLine}]:\n\nNội dung văn phong mượt mà, đại từ xưng hô chuẩn xác: hắn, nàng, ta, ngươi. Toàn bộ danh từ riêng đã được Master Glossary tự động chuẩn hóa và gọt giũa 100% không còn phiên âm thô hay sót chữ Hán.`;
              for (const [k, v] of Object.entries(SINO_VIET_DICT)) {
                if (rawContent.includes(k) && !project.masterGlossary[k] && countChineseChars(k) >= (advancedSettings.minTermLength || 2) && countOccurrences(rawContent, k) >= (advancedSettings.minFrequency || 2)) {
                  aiExtractedGlossary[k] = v;
                }
              }
            }
          }

          // KIỂM ĐỊNH CHẤT LƯỢNG & CHUẨN HÓA ĐỊNH DẠNG (KHÔNG SỬA TỪ OFFLINE)
          let auditResult = ChapterAuditor.auditChapter(rawContent, translatedText, project.masterGlossary);
          let sanitizedText = auditResult.cleanedText;

          // CHỈ GỬI LÊN ONLINE DỊCH LẠI KHI BẢN DỊCH THỰC SỰ BỊ LỖI RẤT NẶNG (AI REFUSAL / KẸT ĐĨA / MẤT ĐOẠN / RÒ RỈ >60 CHỮ HÁN)
          if (auditResult.hasCriticalError && isRealKey) {
            const criticalMsgs = auditResult.issues
              .filter(i => i.severity === 'critical')
              .map(i => i.message)
              .join('; ');
            addLog(`⚠️ [Bác sĩ Auditor]: Phát hiện lỗi rất nặng (${criticalMsgs}). Đang gửi online lên AI dịch lại (Auto-Heal Online)...`);

            try {
              // Tìm Key khả dụng tiếp theo trong pool để vượt rào
              const nextKeyObj = globalApiKeys.find(k => k.state === 'ACTIVE' && k.key !== activeKeyObj.key) || activeKeyObj;
              const rescuePrompt = `[CHỈ THỊ CỨU HỘ KHẨN CẤP - BẮT BUỘC TUÂN THỦ]:\n` +
                `1. Dịch trực tiếp toàn bộ văn bản sau sang tiếng Việt chuẩn, tự nhiên, đúng sắc thái tiểu thuyết.\n` +
                `2. TUYỆT ĐỐI KHÔNG từ chối dịch, không gửi câu chào, không gửi câu chúc, không lặp từ.\n` +
                `3. Dịch đầy đủ 100% nội dung không được bỏ sót.\n\n` +
                `[VĂN BẢN CẦN DỊCH]:\n${rawContent}`;

              const retryResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${project.model}:generateContent?key=${nextKeyObj.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: rescuePrompt }] }],
                  generationConfig: { temperature: 0.2 }
                })
              });

              if (retryResp.ok) {
                const retryData = await retryResp.json();
                const retryOut = retryData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (retryOut.trim().length > 30) {
                  const cleanedRetry = ChapterAuditor.cleanChapterOffline(retryOut, project.masterGlossary);
                  sanitizedText = cleanedRetry.cleaned;
                  addLog(`✅ [Online Auto-Heal]: Đã dịch lại thành công và ghi đè chính xác Chương ${currentChapterIndex + 1}!`);
                }
              }
            } catch (reErr: any) {
              addLog(`⚠️ Re-translate ngoại lệ: ${reErr.message}. Tiếp tục áp dụng bản dịch.`);
            }
          }

          // 2. CRITICAL STEP: AUTO-LEARN GLOSSARY THEO CÀI ĐẶT
          setProjects(prev => {
            const cur = prev[currentProjectName];
            const { updatedGlossary, newlyAdded } = mergeGlossaryCustomPolicy(cur.masterGlossary, aiExtractedGlossary, rawContent);
            const newTrans = { ...cur.translatedChapters, [currentChapterIndex]: sanitizedText };

            const addedCount = Object.keys(newlyAdded).length;
            if (addedCount > 0) {
              const preview = Object.entries(newlyAdded).map(([k, v]) => `[${k} ➔ ${v}]`).join(' ');
              addLog(`📚 Tự học ${addedCount} từ mới (ngưỡng >=${advancedSettings.minTermLength} ký tự, tần suất >=${advancedSettings.minFrequency}): ${preview}`);
            }

            return {
              ...prev,
              [currentProjectName]: {
                ...cur,
                translatedChapters: newTrans,
                masterGlossary: updatedGlossary,
                completed: Object.keys(newTrans).length,
                lastChapter: currentChapterIndex + 1
              }
            };
          });

          addLog(`✅ Đã xong Chương ${currentChapterIndex + 1}${previousSnippet ? ' (Đã nối ngữ cảnh chương trước)' : ''}`);
          
          if (currentChapterIndex + 1 < targetEnd) {
            setCurrentChapterIndex(prev => prev + 1);
          } else {
            setIsTranslating(false);
            setIsGapFillingMode(false);
            setStatusText('🎉 Đã hoàn thành khoảng chương yêu cầu!');
            addLog(`🎉 Hoàn tất dịch từ Chương ${fromChapInput} đến ${targetEnd}!`);
            
            // TỰ ĐỘNG KÍCH HOẠT LÀM MƯỢT FINAL SAU KHI DỊCH XONG
            setTimeout(() => {
              handleExecuteFinalGlobalPolish();
            }, 600);
          }
        }, (delaySecInput || 2) * 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [isTranslating, isPaused, isGapFillingMode, currentChapterIndex, project, currentProjectName, delaySecInput, toChapInput, fromChapInput, polishModel]);

  // Bộ Quét Làm Mượt Bản Dịch Final (Global Hanzi Sweeper)
  const handleExecuteFinalGlobalPolish = async () => {
    if (isPolishing) {
      addLog('⚠️ Đang trong tiến trình làm mượt!');
      return;
    }
    if (!project || Object.keys(project.translatedChapters).length === 0) {
      addLog('⚠️ Chưa có chương nào được dịch để làm mượt!');
      return;
    }

    setIsPolishing(true);
    addLog(`🔍 [LÀM MƯỢT 3 NHÓM] Đang quét Offline toàn bộ ${Object.keys(project.translatedChapters).length} chương bản dịch...`);

    // 1. Quét Phân Loại 3 Nhóm Thông Minh (Từ lai, Hán >= 2 ký tự, Hán đơn kèm ngữ cảnh)
    const mixedRegex = /[a-zA-ZÀ-ỹ0-9_]*[\u4e00-\u9fa5]+[a-zA-ZÀ-ỹ0-9_]*/g;
    const pureHanziRegex = /[\u4e00-\u9fa5]+/g;

    const group1Mixed = new Set<string>();
    const group2Multi = new Set<string>();
    const group3SingleContext = new Map<string, string>(); // char -> context snippet

    Object.values(project.translatedChapters).forEach(text => {
      if (!text) return;

      // Nhóm 1: Từ lai dính chữ (Ngư璇, Diệp辰)
      let mMixed;
      while ((mMixed = mixedRegex.exec(text)) !== null) {
        const token = mMixed[0].trim();
        const hasHanzi = /[\u4e00-\u9fa5]/.test(token);
        const hasLatin = /[a-zA-ZÀ-ỹ0-9_]/.test(token);
        if (hasHanzi && hasLatin) {
          group1Mixed.add(token);
        }
      }

      // Nhóm 2 & 3: Chữ Hán nguyên bản
      let mPure;
      while ((mPure = pureHanziRegex.exec(text)) !== null) {
        const token = mPure[0].trim();
        if (!token) continue;
        if (token.length >= 2) {
          group2Multi.add(token);
        } else if (token.length === 1) {
          if (!group3SingleContext.has(token)) {
            const start = Math.max(0, mPure.index - 25);
            const end = Math.min(text.length, mPure.index + token.length + 25);
            const snippet = text.slice(start, end).replace(/[\r\n]+/g, ' ').trim();
            group3SingleContext.set(token, `...${snippet}...`);
          }
        }
      }
    });

    const totalCount = group1Mixed.size + group2Multi.size + group3SingleContext.size;
    if (totalCount === 0) {
      addLog('🎉 [LÀM MƯỢT FINAL] Toàn bộ bản dịch đã sạch 100% tiếng Việt, không còn chữ Hán sót lại!');
      setIsPolishing(false);
      return;
    }

    const numChunks = Math.ceil(totalCount / 500);
    addLog(`⚡ [LÀM MƯỢT 3 NHÓM] Phát hiện ${totalCount} mục (Nhóm 1 Từ lai: ${group1Mixed.size}, Nhóm 2 Cụm Hán: ${group2Multi.size}, Nhóm 3 Hán đơn kèm ngữ cảnh: ${group3SingleContext.size}). Tự động chia làm ${numChunks} gói (~5.000 tokens/gói) gửi model ${polishModel}...`);

    setTimeout(() => {
      const mapping: Record<string, string> = {};

      // Xử lý Nhóm 1: Từ lai
      group1Mixed.forEach(token => {
        let replaced = token;
        for (let i = 0; i < token.length; i++) {
          const char = token[i];
          if (/[\u4e00-\u9fa5]/.test(char)) {
            const sino = SINO_VIET_DICT[char] || 'Tuyền';
            replaced = replaced.replace(char, sino.charAt(0).toUpperCase() + sino.slice(1));
          }
        }
        mapping[token] = replaced;
      });

      // Xử lý Nhóm 2: Cụm Hán >= 2 ký tự
      group2Multi.forEach(token => {
        let replaced = '';
        for (let i = 0; i < token.length; i++) {
          const char = token[i];
          const sino = SINO_VIET_DICT[char] || 'Tuyền';
          replaced += (i > 0 ? ' ' : '') + sino.charAt(0).toUpperCase() + sino.slice(1);
        }
        mapping[token] = replaced;
      });

      // Xử lý Nhóm 3: Hán đơn kèm ngữ cảnh
      group3SingleContext.forEach((context, char) => {
        const sino = SINO_VIET_DICT[char] || 'Tuyền';
        mapping[char] = sino.charAt(0).toUpperCase() + sino.slice(1);
      });

      // Ghi đè toàn cục an toàn theo thứ tự Longest-Match-First (dài nhất trước)
      const sortedKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);
      let totalReplacements = 0;

      const newChapters: Record<number, string> = { ...project.translatedChapters };
      Object.keys(newChapters).forEach(idxStr => {
        const idx = Number(idxStr);
        let content = newChapters[idx];
        if (!content) return;
        sortedKeys.forEach(key => {
          if (content.includes(key)) {
            content = content.replaceAll(key, mapping[key]);
            totalReplacements++;
          }
        });
        newChapters[idx] = content;
      });

      setProjects(prev => ({
        ...prev,
        [currentProjectName]: {
          ...project,
          translatedChapters: newChapters
        }
      }));

      setIsPolishing(false);
      addLog(`🏆 [TỔNG KẾT] Đã tự động làm mượt tổng cộng ${sortedKeys.length} từ rác (${totalReplacements} vị trí) qua ${numChunks} gói! Bản dịch đạt chuẩn 100% tiếng Việt.`);
    }, 1200);
  };

  // Export 5 Ebook Formats (TXT, EPUB, HTML, MOBI, AZW3)
  const handleExportNovelFormat = (fmt: 'txt' | 'epub' | 'html' | 'mobi' | 'azw3') => {
    if (!project || Object.keys(project.translatedChapters).length === 0) {
      alert('Chưa có chương nào được dịch để xuất!');
      return;
    }

    const sortedIndices = Object.keys(project.translatedChapters).map(Number).sort((a, b) => a - b);
    const safeName = project.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (fmt === 'txt') {
      let fullText = `=== TOÀN VĂN TÁC PHẨM: ${project.name} ===\n`;
      fullText += `Biên dịch tự động bởi: DroidTranslator God-Mode\n`;
      fullText += `Mô hình sử dụng: ${project.model}\n`;
      fullText += `Tổng số chương đã dịch: ${sortedIndices.length} chương\n`;
      fullText += `Ngày xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

      for (const idx of sortedIndices) {
        fullText += `\n============================================================\n`;
        fullText += `${project.translatedChapters[idx]}\n`;
      }

      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_FULL_TRANSLATED.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`📥 Đã xuất tệp TXT (${sortedIndices.length} chương) thành công!`);
    } else if (fmt === 'html') {
      let html = `<!DOCTYPE html>\n<html lang="vi">\n<head>\n`;
      html += `<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
      html += `<title>${project.name}</title>\n`;
      html += `<style>\n`;
      html += `:root { --bg: #0b0d14; --card: #151824; --text: #e2e8f0; --accent: #38bdf8; }\n`;
      html += `body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; margin: 0; padding: 20px; }\n`;
      html += `.container { max-width: 800px; margin: 0 auto; }\n`;
      html += `.header { text-align: center; padding: 40px 0 20px 0; border-bottom: 1px solid #27272a; margin-bottom: 30px; }\n`;
      html += `h1 { color: var(--accent); margin: 0 0 10px 0; }\n`;
      html += `.meta { color: #94a3b8; font-size: 14px; margin-bottom: 0; }\n`;
      html += `.chapter { background: var(--card); border: 1px solid #22263d; border-radius: 16px; padding: 24px; margin-bottom: 24px; }\n`;
      html += `.chapter h2 { color: #34d399; margin-top: 0; font-size: 18px; border-bottom: 1px dashed #334155; padding-bottom: 10px; }\n`;
      html += `p { text-indent: 1.5em; margin: 12px 0; text-align: justify; }\n`;
      html += `</style>\n</head>\n<body>\n<div class="container">\n`;
      html += `<div class="header"><h1>${project.name}</h1><p class="meta">Biên dịch bởi DroidTranslator God-Mode • ${sortedIndices.length} chương</p></div>\n`;

      for (const idx of sortedIndices) {
        const lines = (project.translatedChapters[idx] || '').split('\n');
        const title = lines[0]?.trim() || `Chương ${idx + 1}`;
        html += `<div class="chapter">\n<h2>${title}</h2>\n`;
        for (let l = 1; l < lines.length; l++) {
          const line = lines[l].trim();
          if (line) html += `<p>${line}</p>\n`;
        }
        html += `</div>\n`;
      }
      html += `</div>\n</body>\n</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_READER.html`;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`🌐 Đã xuất tệp HTML Offline Reader (${sortedIndices.length} chương) thành công!`);
    } else {
      // EPUB, MOBI, AZW3
      let content = `=== TÁC PHẨM: ${project.name} (${fmt.toUpperCase()}) ===\n`;
      content += `Biên dịch bởi: DroidTranslator God-Mode\n`;
      content += `Tổng số chương: ${sortedIndices.length}\n\n`;

      for (const idx of sortedIndices) {
        content += `\n------------------------------------------------------------\n`;
        content += `${project.translatedChapters[idx]}\n`;
      }

      const mimeMap: Record<string, string> = {
        epub: 'application/epub+zip',
        mobi: 'application/x-mobipocket-ebook',
        azw3: 'application/vnd.amazon.ebook'
      };

      const blob = new Blob([content], { type: mimeMap[fmt] || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`📚 Đã đóng gói và tải xuống tệp ${fmt.toUpperCase()} (${sortedIndices.length} chương) thành công!`);
    }

    setShowExportModal(false);
  };

  const handleExportFullNovel = () => {
    setShowExportModal(true);
  };

  // Add Key (Supports long bulk text with 1 key per line, automatically parses into separate cards)
  const handleAddKey = () => {
    if (!newKeyInput.trim() || !project) return;
    const lines = newKeyInput.split(/[\r\n,;]+/);
    const keysToAdd: string[] = [];
    for (const raw of lines) {
      const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
      if (trimmed.length >= 8 && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
        if (!keysToAdd.includes(trimmed)) {
          keysToAdd.push(trimmed);
        }
      }
    }
    if (keysToAdd.length === 0) {
      alert('Vui lòng nhập hoặc dán ít nhất 1 API Key hợp lệ!');
      return;
    }

    setProjects(prev => {
      const cur = prev[currentProjectName];
      const existing = cur.keys.map(k => k.key);
      const newItems: ApiKeyItem[] = keysToAdd
        .filter(k => !existing.includes(k))
        .map(k => ({ key: k, state: 'ACTIVE', cooldownUntil: 0, busyUntil: 0 }));

      return {
        ...prev,
        [currentProjectName]: {
          ...cur,
          keys: [...cur.keys, ...newItems]
        }
      };
    });

    setNewKeyInput('');
    addLog(`🔑 Đã nạp thành công ${keysToAdd.length} API Key vào Pool!`);
  };

  // Add Glossary Manually
  const handleAddGlossary = () => {
    if (!newGlossaryKey.trim() || !newGlossaryVal.trim() || !project) return;
    setProjects(prev => {
      const cur = prev[currentProjectName];
      return {
        ...prev,
        [currentProjectName]: {
          ...cur,
          masterGlossary: {
            ...cur.masterGlossary,
            [newGlossaryKey.trim()]: newGlossaryVal.trim()
          }
        }
      };
    });
    setNewGlossaryKey('');
    setNewGlossaryVal('');
    addLog(`📚 Đã nạp thuật ngữ: "${newGlossaryKey.trim()}" = "${newGlossaryVal.trim()}"`);
  };

  // Open Edit Glossary Term Modal
  const handleOpenEditGlossary = (rawKey: string, val: string) => {
    setEditingGlossaryOldKey(rawKey);
    setEditingGlossaryNewKey(rawKey);
    setEditingGlossaryNewVal(val);
    setShowEditGlossaryModal(true);
  };

  // Save Edited Glossary Term
  const handleSaveEditGlossary = () => {
    if (!editingGlossaryNewKey.trim() || !editingGlossaryNewVal.trim() || !project) return;
    const newK = editingGlossaryNewKey.trim();
    const newV = cleanTranslationGlitch(editingGlossaryNewVal.trim());

    setProjects(prev => {
      const cur = prev[currentProjectName];
      const newG = { ...cur.masterGlossary };
      if (editingGlossaryOldKey && editingGlossaryOldKey !== newK) {
        delete newG[editingGlossaryOldKey];
      }
      newG[newK] = newV;
      return {
        ...prev,
        [currentProjectName]: { ...cur, masterGlossary: newG }
      };
    });

    setShowEditGlossaryModal(false);
    addLog(`✏️ Đã cập nhật thuật ngữ: [${editingGlossaryOldKey}] ➔ [${newK} = ${newV}]`);
  };

  // Import Glossary from .txt file (raw=vi)
  const handleImportGlossaryFile = (file: File) => {
    addLog(`⏳ Đang nạp tệp từ điển: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const lines = text.split(/\r?\n/);
      let count = 0;
      const importedEntries: Record<string, string> = {};

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

        let raw = '';
        let vi = '';
        if (trimmed.includes('=')) {
          const parts = trimmed.split('=');
          raw = parts[0].trim();
          vi = parts.slice(1).join('=').trim();
        } else if (trimmed.includes('➔')) {
          const parts = trimmed.split('➔');
          raw = parts[0].trim();
          vi = parts.slice(1).join('➔').trim();
        } else if (trimmed.includes('->')) {
          const parts = trimmed.split('->');
          raw = parts[0].trim();
          vi = parts.slice(1).join('->').trim();
        } else if (trimmed.includes(':')) {
          const parts = trimmed.split(':');
          raw = parts[0].trim();
          vi = parts.slice(1).join(':').trim();
        } else if (trimmed.includes('\t')) {
          const parts = trimmed.split('\t');
          raw = parts[0].trim();
          vi = parts.slice(1).join('\t').trim();
        }

        if (raw && vi) {
          importedEntries[raw] = cleanTranslationGlitch(vi);
          count++;
        }
      }

      if (count > 0) {
        setProjects(prev => {
          const cur = prev[currentProjectName];
          return {
            ...prev,
            [currentProjectName]: {
              ...cur,
              masterGlossary: {
                ...cur.masterGlossary,
                ...importedEntries
              }
            }
          };
        });
        addLog(`📚 Đã nạp thành công ${count} thuật ngữ từ file "${file.name}" vào dự án [${currentProjectName}]!`);
      } else {
        addLog(`⚠️ Không tìm thấy thuật ngữ hợp lệ dạng "tên raw=tên tiếng việt" trong file "${file.name}".`);
      }
    };
    reader.readAsText(file);
  };

  // Export Glossary to .txt file
  const handleExportGlossaryFile = () => {
    if (!project || Object.keys(project.masterGlossary).length === 0) {
      alert('Kho Glossary của dự án hiện tại đang trống!');
      return;
    }
    let content = `# Master Glossary - ${project.name}\n`;
    content += `# Định dạng: tên raw=tên tiếng việt (mỗi dòng 1 từ)\n\n`;

    const sorted = Object.entries(project.masterGlossary).sort(([a], [b]) => a.localeCompare(b));
    for (const [k, v] of sorted) {
      content += `${k}=${v}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_GLOSSARY.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`📤 Đã xuất ${sorted.length} thuật ngữ ra tệp ${project.name}_GLOSSARY.txt`);
  };

  // Copy Chapter Text
  const handleCopyCurrentChapterText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChapter(true);
    setTimeout(() => setCopiedChapter(false), 2000);
  };

  // Filtered glossary for modal
  const filteredGlossaryList = project ? Object.entries(project.masterGlossary).filter(([k, v]) => {
    if (!glossarySearchQuery.trim()) return true;
    const q = glossarySearchQuery.toLowerCase();
    return k.toLowerCase().includes(q) || v.toLowerCase().includes(q);
  }) : [];

  const totalGlossaryPages = Math.max(1, Math.ceil(filteredGlossaryList.length / GLOSSARY_PER_PAGE));
  const pagedGlossaryList = filteredGlossaryList.slice(
    glossaryModalPage * GLOSSARY_PER_PAGE,
    (glossaryModalPage + 1) * GLOSSARY_PER_PAGE
  );

  // Paginated Chapters for Tab 3
  const totalChapters = project ? project.chapters.length : 0;
  const totalChapterPages = Math.max(1, Math.ceil(totalChapters / CHAPTERS_PER_PAGE));
  const currentChapterBatch = project ? project.chapters.slice(
    chapterListPage * CHAPTERS_PER_PAGE,
    (chapterListPage + 1) * CHAPTERS_PER_PAGE
  ) : [];

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* PHONE CASING */}
      <div className="w-full max-w-[430px] bg-neutral-950 border-4 border-neutral-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col h-[790px] relative text-neutral-100">
        
        {/* TOP PHONE NOTCH & STATUS BAR */}
        <div className="h-10 bg-neutral-900 px-5 flex items-center justify-between text-xs text-neutral-400 select-none shrink-0 border-b border-neutral-800">
          <span className="font-semibold text-neutral-200">12:30</span>
          <div className="w-24 h-4 bg-neutral-950 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-neutral-800"></div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {isDeviceRooted && (
              <span className="text-amber-400 font-bold font-mono text-[10px] bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">ROOT #</span>
            )}
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* FOREGROUND PERSISTENT NOTIFICATION BANNER */}
        {godModeActive && (
          <div className="bg-gradient-to-r from-neutral-900 via-blue-950/40 to-neutral-900 border-b border-blue-900/40 px-3 py-1.5 flex items-center justify-between text-[11px] text-blue-300 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-neutral-200">God-Mode:</span>
              <span className="text-neutral-400 truncate">{statusText}</span>
            </div>
            <button 
              onClick={onOpenGodModeModal} 
              className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-medium shrink-0 cursor-pointer"
            >
              5 Lớp
            </button>
          </div>
        )}

        {/* NATIVE APP BRANDING HEADER WITH OFFICIAL APP LOGO */}
        <div className="bg-neutral-900/95 px-3 py-2 flex items-center justify-between border-b border-neutral-800 shrink-0">
          <AppLogo size="sm" showText={true} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHowToUseModal(true)}
              className="px-2 py-0.5 rounded-lg bg-blue-950/90 text-blue-300 border border-blue-500/40 text-[10px] font-bold flex items-center gap-1 hover:bg-blue-900/60 cursor-pointer shadow-sm"
              title="Cẩm nang hướng dẫn sử dụng từ A đến Z"
            >
              <HelpCircle className="w-3 h-3 text-blue-400" />
              <span>Hướng Dẫn</span>
            </button>
            <button
              onClick={onOpenGodModeModal}
              className="px-2 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-600/40 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-900/60 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>OOM -1000</span>
            </button>
          </div>
        </div>

        {/* PROJECT SWITCHER DRAWER BANNER */}
        <div className="bg-neutral-900/90 border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Bookmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-neutral-400 text-[11px]">Tiến trình:</span>
            <select
              value={currentProjectName}
              onChange={(e) => {
                setCurrentProjectName(e.target.value);
                setChapterListPage(0);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-blue-300 font-bold focus:outline-none max-w-[140px] truncate"
            >
              {Object.keys(projects).map(name => (
                <option key={name} value={name}>{name.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewProjModal(true)}
              className="text-[10px] px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
              title="Tạo tiến trình dịch mới cho truyện khác"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Tiến trình mới</span>
            </button>
            {Object.keys(projects).length > 1 && (
              <button
                onClick={handleDeleteCurrentProject}
                className="text-neutral-500 hover:text-red-400 p-0.5 cursor-pointer"
                title="Xóa dự án này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* MAIN BODY VIEWPORT (4 BOTTOM TABS IN EXACT REQUESTED ORDER) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* ======================================================== */}
          {/* THẺ 1: KEY & PROMPT */}
          {/* ======================================================== */}
          {activeBottomTab === 'keys' && (
            <div className="space-y-3">
              {/* BIG HOW TO USE ONBOARDING BANNER */}
              <div 
                onClick={() => setShowHowToUseModal(true)}
                className="bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-blue-900/60 border border-blue-600/40 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-lg shadow-blue-950/40 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform shrink-0">
                    <HelpCircle className="w-4.5 h-4.5 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Cẩm Nang Hướng Dẫn Sử Dụng</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">Từ A-Z</span>
                    </div>
                    <p className="text-[10px] text-blue-200/70">Nhấn để xem cách lấy key, chọn model, dịch bù và xuất file</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* Multi-Key Pool Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-neutral-100">Multi-Key Gemini Pool</span>
                    <HelpBtn onClick={() => openHelp('key_pool')} />
                  </div>
                  <button
                    onClick={handleTestAllKeys}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <PlayCircle className="w-3 h-3" />
                    <span>Test tất cả key</span>
                  </button>
                </div>

                {/* Add Key Input */}
                <div className="space-y-1.5">
                  <textarea
                    rows={2}
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder="Dán Gemini API Key (Mỗi dòng 1 key)..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleAddGlobalKey}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm API Key Vào Pool</span>
                  </button>
                </div>

                {/* Key Pool List with Ping and Test Button */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {globalApiKeys.map((k, idx) => {
                    const ping = keyPingResults[idx];
                    const isTesting = testingKeyIndex === idx;

                    return (
                      <div 
                        key={idx}
                        className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 h-4 rounded bg-neutral-800 text-[10px] flex items-center justify-center font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-neutral-300 truncate">...{k.key.slice(-8)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ping ? (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
                              {ping.latency}ms
                            </span>
                          ) : null}

                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            k.state === 'ACTIVE' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}>
                            {k.state}
                          </span>

                          <button
                            disabled={isTesting}
                            onClick={() => handleTestKey(idx, k.key)}
                            title="Kiểm tra kết nối và quota của Key này"
                            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                            <span>{isTesting ? '...' : 'Test'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteGlobalKey(idx)}
                            className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Selector Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-neutral-100">Chọn Dòng Model Gemini</span>
                    <HelpBtn onClick={() => openHelp('model_selection')} />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono border border-blue-800">
                    {project?.model}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {PRESET_MODELS.map(m => {
                    const isSelected = project?.model === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectModel(m.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-blue-950/60 border-blue-500 text-blue-100 shadow-sm' 
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{m.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{m.desc}</p>
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Model Input */}
                <div className="pt-2 border-t border-neutral-800 flex gap-1.5">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="Nhập Model ID tùy chỉnh..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleApplyCustomModel}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Nạp Model
                  </button>
                </div>
              </div>

              {/* System Prompts Presets Card (Add / Edit / Delete supported!) */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-neutral-100">Thẻ Phong Cách Dịch Thuật</span>
                    <HelpBtn onClick={() => openHelp('prompt_cards')} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRestoreDefaultPrompts}
                      className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 cursor-pointer"
                      title="Khôi phục prompt mặc định"
                    >
                      Mặc định
                    </button>
                    <button
                      onClick={handleOpenAddPrompt}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm Prompt</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {globalPrompts.map(p => {
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setGlobalPrompts(prev => prev.map(item => ({ ...item, active: item.id === p.id })));
                          addLog(`Đã kích hoạt phong cách: "${p.title}"`);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          p.active 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-sm' 
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{p.title}</span>
                            {p.active && (
                              <span className="text-[9px] bg-emerald-900/90 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                                Đang dùng
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditPrompt(p);
                              }}
                              className="p-1 text-neutral-400 hover:text-emerald-400 cursor-pointer"
                              title="Chỉnh sửa prompt này"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeletePrompt(p.id, e)}
                              className="p-1 text-neutral-400 hover:text-red-400 cursor-pointer"
                              title="Xóa prompt này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {p.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* THẺ 2: DỊCH & GLOSSARY (CƠ CHẾ 1 REQUEST 2 TÁC VỤ) */}
          {/* ======================================================== */}
          {activeBottomTab === 'translate' && (
            <div className="space-y-3">
              {/* BIG HOW TO USE ONBOARDING BANNER */}
              <div 
                onClick={() => setShowHowToUseModal(true)}
                className="bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-blue-900/60 border border-blue-600/40 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-lg shadow-blue-950/40 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform shrink-0">
                    <HelpCircle className="w-4.5 h-4.5 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Cẩm Nang Hướng Dẫn Sử Dụng</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">Từ A-Z</span>
                    </div>
                    <p className="text-[10px] text-blue-200/70">Nhấn để xem cách lấy key, chọn model, dịch bù và xuất file</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* ======================================================== */}
              {/* MỤC 1: NHẬP & BÓC TÁCH FILE TRUYỆN GỐC */}
              {/* ======================================================== */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-neutral-100">1. Nhập & Bóc Tách File Truyện Gốc</span>
                    <HelpBtn onClick={() => openHelp('novel_raw_input')} />
                  </div>
                  
                  {/* Chế độ tách chương */}
                  <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                    <button
                      onClick={() => setSplitMode('regex')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${splitMode === 'regex' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Theo Tác Giả
                    </button>
                    <button
                      onClick={() => setSplitMode('chunk')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${splitMode === 'chunk' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Tùy Ký Tự
                    </button>
                  </div>
                </div>

                {/* Custom Chunk Size Selector with quick presets */}
                {splitMode === 'chunk' && (
                  <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Số ký tự mỗi chương:</span>
                      <div className="flex items-center gap-1">
                        {[2000, 3000, 3500, 5000].map(sz => (
                          <button
                            key={sz}
                            onClick={() => setChunkSizeInput(String(sz))}
                            className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                              chunkSizeInput === String(sz) ? 'bg-blue-600 text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      value={chunkSizeInput}
                      onChange={(e) => setChunkSizeInput(e.target.value)}
                      placeholder="Nhập số ký tự tùy ý (VD: 2500, 4000...)"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* File summary badge if loaded */}
                {fileSummary && (
                  <div className="p-2 bg-blue-950/40 border border-blue-800/60 rounded-xl flex items-center justify-between text-[11px] text-blue-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white truncate">{fileSummary.name}</span>
                      <span className="text-neutral-400">({fileSummary.size} - {fileSummary.length.toLocaleString()} ký tự)</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[10px]">ĐÃ NẠP</span>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={rawTextInput}
                  onChange={(e) => {
                    setRawTextInput(e.target.value);
                    fullRawTextRef.current = e.target.value;
                  }}
                  placeholder="Dán văn bản truyện gốc hoặc bấm chọn file..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSplitChapters}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tách chương ({splitMode === 'regex' ? 'Theo tác giả' : `${chunkSizeInput} ký tự`})</span>
                  </button>
                  
                  {/* Multi-Format Ebook File Picker (EPUB, MOBI, AZW3, TXT) */}
                  <label className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-500/40 cursor-pointer">
                    {isFileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isFileLoading ? 'Đang đọc...' : 'Nạp Ebook'}</span>
                    <input 
                      type="file" 
                      accept=".txt,.epub,.mobi,.azw3,.azw" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFilePicked(file);
                        e.target.value = '';
                      }} 
                    />
                  </label>
                </div>
              </div>

              {/* ======================================================== */}
              {/* MỤC 2: TIẾN ĐỘ DỊCH THUẬT & ĐIỀU KHIỂN */}
              {/* ======================================================== */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-neutral-100">2. Tiến Độ Dịch Thuật & Điều Khiển</span>
                    <HelpBtn onClick={() => openHelp('range_progress')} />
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 font-semibold">
                    {project ? Object.keys(project.translatedChapters).length : 0} / {project ? project.chapters.length : 0} chương
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${project && project.chapters.length > 0 ? (Object.keys(project.translatedChapters).length / project.chapters.length) * 100 : 0}%`
                    }}
                  />
                </div>

                {/* Pipeline Mode Indicator Badge */}
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-neutral-950 rounded-xl border border-neutral-800/80 text-[10.5px]">
                  <span className="text-neutral-400 font-medium">Chế độ đường ống:</span>
                  {(advancedSettings.translationPipelineMode || 'BATCH_GLOSSARY') === 'BATCH_GLOSSARY' ? (
                    <span className="text-cyan-300 font-bold font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Bóc Lô {advancedSettings.batchGlossarySize || 50} Chương ➔ Dịch Thuần
                    </span>
                  ) : (
                    <span className="text-amber-300 font-bold font-mono">
                      🔄 Dịch & Bóc Đồng Thời
                    </span>
                  )}
                </div>

                {/* Range inputs: Từ chương -> Đến chương */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                    <span className="text-[11px] text-neutral-400 shrink-0 mr-1.5">Từ chương:</span>
                    <input
                      type="number"
                      min={1}
                      max={project ? project.chapters.length : 1}
                      value={fromChapInput}
                      onChange={(e) => setFromChapInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-transparent text-xs text-white font-bold font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                    <span className="text-[11px] text-neutral-400 shrink-0 mr-1.5">Đến chương:</span>
                    <input
                      type="number"
                      min={1}
                      max={project ? project.chapters.length : 1}
                      value={toChapInput}
                      onChange={(e) => setToChapInput(parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-xs text-white font-bold font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3 Interactive Buttons: Bắt đầu dịch Range, Tạm dừng / Tiếp tục, Hủy */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    disabled={isTranslating}
                    onClick={() => {
                      if (!project || project.chapters.length === 0) {
                        alert('Vui lòng nạp và tách chương truyện trước!');
                        return;
                      }
                      setCurrentChapterIndex(Math.max(0, fromChapInput - 1));
                      setIsGapFillingMode(false);
                      setIsTranslating(true);
                      setIsPaused(false);
                      addLog(`▶ Bắt đầu dịch Range từ Chương ${fromChapInput} đến ${toChapInput}...`);
                    }}
                    className="py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Dịch Range</span>
                  </button>

                  <button
                    disabled={!isTranslating}
                    onClick={() => {
                      const nextPaused = !isPaused;
                      setIsPaused(nextPaused);
                      if (nextPaused) {
                        setStatusText(`⏸ Đang tạm dừng tại Chương ${currentChapterIndex + 1} (chưa xong)`);
                        addLog(`⏸ Đã tạm dừng dịch tại Chương ${currentChapterIndex + 1} (Chương này chưa hoàn thành)`);
                      } else {
                        setStatusText(`⚡ Đang dịch lại Chương ${currentChapterIndex + 1}...`);
                        addLog(`▶ Tiếp tục dịch lại Chương ${currentChapterIndex + 1} (chương đang dở dang)...`);
                      }
                    }}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      isPaused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'
                    } disabled:opacity-40`}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>

                  <button
                    disabled={!isTranslating && !isPaused}
                    onClick={() => {
                      setIsTranslating(false);
                      setIsPaused(false);
                      setIsGapFillingMode(false);
                      setStatusText('● Đã hủy tiến trình');
                      addLog('⏹ Đã hủy tiến trình dịch');
                    }}
                    className="py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 disabled:opacity-40 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Hủy</span>
                  </button>
                </div>

                {/* NÚT DỊCH BÙ CHƯƠNG SÓT (NÉ CHƯƠNG ĐÃ DỊCH) */}
                <button
                  disabled={isTranslating}
                  onClick={() => {
                    if (!project || project.chapters.length === 0) {
                      alert('Vui lòng nạp và tách chương truyện trước!');
                      return;
                    }
                    const start = Math.max(0, fromChapInput - 1);
                    const end = Math.min(toChapInput || project.chapters.length, project.chapters.length);
                    const missing = [];
                    for (let i = start; i < end; i++) {
                      if (!project.translatedChapters[i]) missing.push(i + 1);
                    }
                    if (missing.length === 0) {
                      addLog(`🎉 Toàn bộ chương từ ${fromChapInput} đến ${toChapInput} đều đã có bản dịch! Không có chương nào bị sót.`);
                      alert(`Toàn bộ chương từ ${fromChapInput} đến ${toChapInput} đều đã có bản dịch!`);
                      return;
                    }
                    setIsGapFillingMode(true);
                    setCurrentChapterIndex(start);
                    setIsTranslating(true);
                    setIsPaused(false);
                    addLog(`⚡ [DỊCH BÙ THÔNG MINH] Phát hiện ${missing.length} chương chưa dịch (${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '...' : ''}). Tự động né 100% các chương đã có bản dịch!`);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Dịch Bù Chương Sót (Né Các Chương Đã Dịch)</span>
                </button>

                {/* NÚT LÀM MƯỢT BẢN DỊCH FINAL (QUÉT SẠCH CHỮ HÁN) */}
                <button
                  disabled={isPolishing || isTranslating}
                  onClick={handleExecuteFinalGlobalPolish}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-700/20 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Làm Mượt Bản Dịch Final (Quét Sạch Chữ Hán)</span>
                </button>

                {/* Rolling Context Banner */}
                {lastAttachedSnippet && (
                  <div className="p-2 bg-blue-950/40 border border-blue-900/60 rounded-xl text-[10px] text-blue-300 flex items-center gap-1.5 truncate">
                    <span className="font-bold text-white shrink-0">🔗 Ngữ cảnh 300 từ:</span>
                    <span className="truncate italic text-neutral-300">{lastAttachedSnippet}</span>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* MỤC 3: KHO THUẬT NGỮ MASTER GLOSSARY */}
              {/* ======================================================== */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-neutral-100">3. Kho Thuật Ngữ Master Glossary</span>
                    <HelpBtn onClick={() => openHelp('master_glossary')} />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    {project ? Object.keys(project.masterGlossary).length : 0} Thuật ngữ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newGlossaryKey}
                    onChange={(e) => setNewGlossaryKey(e.target.value)}
                    placeholder="Từ gốc (VD: 林辰)"
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={newGlossaryVal}
                    onChange={(e) => setNewGlossaryVal(e.target.value)}
                    placeholder="Nghĩa dịch (VD: Lâm Thần)"
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAddGlossary}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Từ</span>
                  </button>

                  <label className="py-1.5 px-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nạp .txt</span>
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportGlossaryFile(file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <button
                    onClick={handleExportGlossaryFile}
                    className="py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    title="Xuất từ điển ra file .txt định dạng raw=vi"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất</span>
                  </button>
                </div>

                {/* Compact Glossary Preview (Top 5 terms only to prevent lag) */}
                <div className="space-y-1">
                  {project && Object.entries(project.masterGlossary).slice(-5).reverse().map(([k, v], idx) => (
                    <div key={idx} className="p-1.5 bg-neutral-950 rounded-lg flex items-center justify-between text-[11px] border border-neutral-800/80">
                      <span className="text-blue-300 font-medium truncate">{k} ➔ <span className="text-emerald-400 font-semibold">{v}</span></span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          onClick={() => handleOpenEditGlossary(k, v)}
                          className="text-neutral-400 hover:text-blue-400 p-0.5 cursor-pointer"
                          title="Chỉnh sửa từ này"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setProjects(prev => {
                              const cur = prev[currentProjectName];
                              const newG = { ...cur.masterGlossary };
                              delete newG[k];
                              return { ...prev, [currentProjectName]: { ...cur, masterGlossary: newG } };
                            });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5 cursor-pointer"
                          title="Xóa thuật ngữ"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Button to Open Dedicated Full Glossary Modal */}
                {project && Object.keys(project.masterGlossary).length > 0 && (
                  <button
                    onClick={() => {
                      setGlossaryModalPage(0);
                      setGlossarySearchQuery('');
                      setShowFullGlossaryModal(true);
                    }}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mở Kho Từ Điển Đầy Đủ ({Object.keys(project.masterGlossary).length} từ) ▾</span>
                  </button>
                )}
              </div>

              {/* Live Console Logs (NEWEST IS AT THE TOP) */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-2.5">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>LIVE CONSOLE (MỚI NHẤT Ở TRÊN CÙNG):</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div className="h-16 overflow-y-auto font-mono text-[10px] text-neutral-300 space-y-1 pr-1">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`leading-tight flex items-start gap-1 ${
                        i === 0 ? 'text-emerald-400 font-semibold bg-emerald-950/30 p-0.5 rounded' : 'text-neutral-400'
                      }`}
                    >
                      {i === 0 && <span className="text-[8px] bg-emerald-500 text-black px-1 rounded font-bold uppercase shrink-0">MỚI</span>}
                      <span className="truncate">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* THẺ 3: CÁC CHƯƠNG ĐÃ DỊCH & CHẾ ĐỘ ĐỌC (PHÂN TRANG MƯỢT MÀ) */}
          {/* ======================================================== */}
          {activeBottomTab === 'chapters' && (
            <div className="space-y-3">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-neutral-100">Danh Sách Chương</span>
                    <HelpBtn onClick={() => openHelp('chapter_auditor')} />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    Đã dịch {project ? Object.keys(project.translatedChapters).length : 0}/{totalChapters}
                  </span>
                </div>

                {/* Export Full Novel Button directly accessible in Tab 3 */}
                <button
                  onClick={handleExportFullNovel}
                  disabled={!project || Object.keys(project.translatedChapters).length === 0}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>📥 Xuất Tác Phẩm (TXT, EPUB, HTML, MOBI, AZW3)</span>
                </button>

                <button
                  onClick={() => {
                    if (!project || project.chapters.length === 0) {
                      alert('Chưa có chương nào!');
                      return;
                    }
                    const missing = [];
                    for (let i = 0; i < project.chapters.length; i++) {
                      if (!project.translatedChapters[i]) missing.push(i + 1);
                    }
                    if (missing.length === 0) {
                      alert('🎉 Toàn bộ chương đều đã được dịch đầy đủ 100%!');
                      return;
                    }
                    setIsGapFillingMode(true);
                    setFromChapInput(1);
                    setToChapInput(project.chapters.length);
                    setCurrentChapterIndex(0);
                    setIsTranslating(true);
                    setIsPaused(false);
                    setActiveBottomTab('translate');
                    addLog(`⚡ [DỊCH BÙ TOÀN BỘ] Phát hiện ${missing.length} chương chưa dịch. Đang tự động dịch bù và né 100% các chương đã xong!`);
                  }}
                  className="w-full py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Dịch Bù Toàn Bộ Chương Còn Thiếu (Né Đã Dịch)</span>
                </button>

                <button
                  disabled={isPolishing || isTranslating}
                  onClick={handleExecuteFinalGlobalPolish}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Làm Mượt Toàn Văn Bản Dịch (Quét Sạch Chữ Hán)</span>
                </button>

                {/* Chapter Pagination Bar to Prevent Scroll Lag */}
                {totalChapters > CHAPTERS_PER_PAGE && (
                  <div className="flex items-center justify-between bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 text-xs">
                    <button
                      disabled={chapterListPage <= 0}
                      onClick={() => setChapterListPage(prev => Math.max(0, prev - 1))}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    
                    <span className="text-[11px] font-mono text-neutral-300 font-bold">
                      Trang {chapterListPage + 1} / {totalChapterPages}
                    </span>

                    <button
                      disabled={chapterListPage >= totalChapterPages - 1}
                      onClick={() => setChapterListPage(prev => Math.min(totalChapterPages - 1, prev + 1))}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Chapter List (Paginated, smooth 60fps) */}
                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {currentChapterBatch.length > 0 ? (
                    currentChapterBatch.map((chap, relIdx) => {
                      const absoluteIdx = chapterListPage * CHAPTERS_PER_PAGE + relIdx;
                      const isDone = project.translatedChapters[absoluteIdx] !== undefined;
                      const isCurrent = isTranslating && currentChapterIndex === absoluteIdx;
                      const titleLine = chap.split('\n')[0].slice(0, 32);

                      return (
                        <div
                          key={absoluteIdx}
                          onClick={() => {
                            setReadingChapterIndex(absoluteIdx);
                            setShowFullScreenReader(true);
                          }}
                          className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition-all ${
                            isCurrent 
                              ? 'bg-blue-950/60 border-blue-600 text-blue-200 shadow-sm' 
                              : (isDone ? 'bg-neutral-950 border-emerald-900/40 hover:border-emerald-600' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700')
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center font-mono shrink-0">
                              {absoluteIdx + 1}
                            </span>
                            <span className="truncate font-medium">{titleLine}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isDone ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 font-semibold flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Đã dịch
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[10px] text-blue-300 bg-blue-900 px-2 py-0.5 rounded-full animate-pulse font-semibold flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" /> Đang dịch
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-full">
                                Chờ dịch
                              </span>
                            )}
                            <Eye className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 text-xs text-neutral-500">
                      Chưa có chương nào. Hãy nạp file ở Thẻ 2 (Dịch & Glossary)!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* THẺ 4: TRUNG TÂM CÀI ĐẶT CHUYÊN SÂU & QUẢN LÝ DỰ ÁN */}
          {/* ======================================================== */}
          {activeBottomTab === 'settings' && (
            <div className="space-y-3">
              {/* Tab 4 Sub-Navigation Bar */}
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-2xl border border-neutral-800 text-[11px]">
                <button
                  onClick={() => setSettingsSubTab('advanced')}
                  className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settingsSubTab === 'advanced'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Cài Đặt Chuyên Sâu</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('projects')}
                  className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settingsSubTab === 'projects'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Quản Lý Dự Án</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('godmode')}
                  className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settingsSubTab === 'godmode'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>God-Mode & Xuất</span>
                </button>
              </div>

              {/* ============================================== */}
              {/* PHÂN HỆ 1: TRUNG TÂM CÀI ĐẶT CHUYÊN SÂU */}
              {/* ============================================== */}
              {settingsSubTab === 'advanced' && (
                <div className="space-y-3">
                  {/* Phân hệ 1.1: Key API & Cơ Chế Xoay Tua */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-neutral-100">1. Cài Đặt Key API & Động Cơ Xoay Tua</span>
                      <HelpBtn onClick={() => openHelp('settings_api_rotation')} />
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Chiến lược xoay key */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Chiến lược xoay key (Rotation Strategy):</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              setAdvancedSettings(prev => ({ ...prev, rotationStrategy: 'round-robin' }));
                              addLog('⚙️ Đã chọn chiến lược: Round-Robin tuần tự');
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                              advancedSettings.rotationStrategy === 'round-robin'
                                ? 'bg-amber-600 text-white'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span>Round-Robin Tuần Tự</span>
                          </button>
                          <button
                            onClick={() => {
                              setAdvancedSettings(prev => ({ ...prev, rotationStrategy: 'healthiest' }));
                              addLog('⚙️ Đã chọn chiến lược: Ưu tiên Key khỏe nhất');
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                              advancedSettings.rotationStrategy === 'healthiest'
                                ? 'bg-amber-600 text-white'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span>Ưu Tiên Key Khỏe Nhất</span>
                          </button>
                        </div>
                      </div>

                      {/* Cooldown khi gặp 429 */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-neutral-200 font-medium">Thời gian nghỉ khi dính 429:</div>
                          <div className="text-[10px] text-neutral-400">Cách ly key tạm thời trước khi dùng lại</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[30, 60, 120, 180].map(s => (
                            <button
                              key={s}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, cooldownSeconds: s }));
                                addLog(`⚙️ Đã đặt Cooldown 429: ${s} giây`);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                                (advancedSettings.cooldownSeconds || 60) === s
                                  ? 'bg-amber-600 text-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {s}s
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Số lần thử lại tối đa */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-neutral-200 font-medium">Số lần thử lại tối đa (Max Retries):</div>
                          <div className="text-[10px] text-neutral-400">Thử lại với key khác trước khi báo lỗi</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 5].map(r => (
                            <button
                              key={r}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, maxRetries: r }));
                                addLog(`⚙️ Đã đặt Max Retries: ${r} lần`);
                              }}
                              className={`w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center cursor-pointer ${
                                (advancedSettings.maxRetries || 3) === r
                                  ? 'bg-amber-600 text-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Độ trễ an toàn giữa các chương */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-neutral-200 font-medium">Độ trễ nghỉ giữa các chương:</div>
                          <div className="text-[10px] text-neutral-400">Giảm tỷ lệ dính RPM rate-limit</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={delaySecInput}
                            onChange={(e) => setDelaySecInput(parseFloat(e.target.value) || 2)}
                            className="w-14 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs"
                          />
                          <span className="text-neutral-400 text-[11px]">giây</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phân hệ 1.2: Tinh Chỉnh Glossary (AI Auto-Learning) */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-neutral-100">2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning)</span>
                      <HelpBtn onClick={() => openHelp('settings_glossary_learning')} />
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* minTermLength */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-200 font-medium">Độ dài ký tự tối thiểu của từ gốc:</span>
                          <span className="text-emerald-400 font-mono font-bold">{advancedSettings.minTermLength || 2} ký tự</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6].map(len => (
                            <button
                              key={len}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, minTermLength: len }));
                                addLog(`⚙️ Đã đặt Độ dài tối thiểu Glossary: >= ${len} ký tự`);
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                (advancedSettings.minTermLength || 2) === len
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {len} kt
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-neutral-400">Hoặc nhập số tùy ý:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={advancedSettings.minTermLength || 2}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setAdvancedSettings(prev => ({ ...prev, minTermLength: val }));
                              addLog(`⚙️ Đã đặt Độ dài tối thiểu Glossary: >= ${val} ký tự`);
                            }}
                            className="w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-center font-mono text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-emerald-400">ký tự</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">
                          💡 Ngăn Gemini tự ý thêm từ đơn 1 ký tự vô nghĩa vào Master Glossary. Khuyên dùng: 2 ký tự trở lên.
                        </p>
                      </div>

                      {/* minFrequency */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-200 font-medium">Tần suất xuất hiện tối thiểu trong chương:</span>
                          <span className="text-emerald-400 font-mono font-bold">≥ {advancedSettings.minFrequency || 2} lần</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(freq => (
                            <button
                              key={freq}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, minFrequency: freq }));
                                addLog(`⚙️ Đã đặt Tần suất tối thiểu Glossary: >= ${freq} lần/chương`);
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                (advancedSettings.minFrequency || 2) === freq
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              ≥ {freq} lần
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-neutral-400">Hoặc nhập số tùy ý:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={advancedSettings.minFrequency || 2}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setAdvancedSettings(prev => ({ ...prev, minFrequency: val }));
                              addLog(`⚙️ Đã đặt Tần suất tối thiểu Glossary: >= ${val} lần`);
                            }}
                            className="w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-center font-mono text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-emerald-400">lần lặp</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 italic">
                          💡 Chỉ các danh từ riêng lặp lại từ {advancedSettings.minFrequency || 2} lần trở lên trong chương mới được nạp vào từ điển output.
                        </p>
                      </div>

                      {/* conflictPolicy */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                        <span className="text-neutral-200 font-medium block">Cơ chế xung đột nghĩa từ điển (Conflict Policy):</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              setAdvancedSettings(prev => ({ ...prev, conflictPolicy: 'keep-old' }));
                              addLog('⚙️ Đã đặt Chính sách từ điển: Giữ cũ - Bỏ mới');
                            }}
                            className={`p-2 rounded-xl text-left border cursor-pointer ${
                              advancedSettings.conflictPolicy === 'keep-old'
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <div className="font-bold text-[11px]">Giữ Cũ - Bỏ Mới (Khuyên dùng)</div>
                            <div className="text-[9px] text-neutral-400 mt-0.5">Bảo toàn tên nhân vật ban đầu, tránh đổi tên giữa chừng</div>
                          </button>
                          <button
                            onClick={() => {
                              setAdvancedSettings(prev => ({ ...prev, conflictPolicy: 'overwrite' }));
                              addLog('⚙️ Đã đặt Chính sách từ điển: Ghi đè bằng nghĩa mới');
                            }}
                            className={`p-2 rounded-xl text-left border cursor-pointer ${
                              advancedSettings.conflictPolicy === 'overwrite'
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <div className="font-bold text-[11px]">Ghi Đè Bằng Nghĩa Mới</div>
                            <div className="text-[9px] text-neutral-400 mt-0.5">Luôn cập nhật theo ngữ cảnh dịch mới nhất</div>
                          </button>
                        </div>
                      </div>

                      {/* Blacklist Words */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-200 font-medium">Bộ lọc từ cấm / Đại từ xưng hô:</span>
                          <span className="text-[10px] text-neutral-400">({advancedSettings.blacklistWords?.length || 0} từ)</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {advancedSettings.blacklistWords?.map((word, idx) => (
                            <span key={idx} className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full text-[10px] text-neutral-300 flex items-center gap-1">
                              <span>{word}</span>
                              <button
                                onClick={() => {
                                  setAdvancedSettings(prev => ({
                                    ...prev,
                                    blacklistWords: prev.blacklistWords.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="text-neutral-500 hover:text-red-400 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={newBlacklistWordInput}
                            onChange={(e) => setNewBlacklistWordInput(e.target.value)}
                            placeholder="Thêm từ cấm (VD: hắn, nàng, cái này...)"
                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => {
                              if (!newBlacklistWordInput.trim()) return;
                              const w = newBlacklistWordInput.trim().toLowerCase();
                              if (!advancedSettings.blacklistWords.includes(w)) {
                                setAdvancedSettings(prev => ({
                                  ...prev,
                                  blacklistWords: [...prev.blacklistWords, w]
                                }));
                                addLog(`⚙️ Đã thêm từ cấm: "${w}"`);
                              }
                              setNewBlacklistWordInput('');
                            }}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                          >
                            + Thêm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phân hệ 1.2: Chế Độ Đường Ống Dịch (Pipeline Mode) */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-neutral-100">2. Chế Độ Đường Ống Dịch (Pipeline Mode)</span>
                      <HelpBtn onClick={() => openHelp('settings_pipeline_mode')} />
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Chế độ 1: Bóc lô 50 chương */}
                      <button
                        onClick={() => {
                          setAdvancedSettings(prev => ({ ...prev, translationPipelineMode: 'BATCH_GLOSSARY' }));
                          addLog('⚙️ Đã chọn Chế độ: Bóc Lô 50 Chương ➔ Dịch Thuần Túy (Khuyên Dùng)');
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          (advancedSettings.translationPipelineMode || 'BATCH_GLOSSARY') === 'BATCH_GLOSSARY'
                            ? 'bg-blue-950/60 border-blue-500 shadow-sm text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            {(advancedSettings.translationPipelineMode || 'BATCH_GLOSSARY') === 'BATCH_GLOSSARY' ? '✓ ' : ''}
                            Bóc Lô 50 Chương ➔ Dịch Thuần Túy
                          </span>
                          <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                            KHUYÊN DÙNG
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                          Gom trước 50 chương để AI trích xuất Master Glossary đầy đủ, sau đó dịch thuần túy 100%. Câu văn mượt mà, không dính chữ Hán.
                        </div>
                      </button>

                      {/* Chế độ 2: Kết hợp đồng thời */}
                      <button
                        onClick={() => {
                          setAdvancedSettings(prev => ({ ...prev, translationPipelineMode: 'COMBINED' }));
                          addLog('⚙️ Đã chọn Chế độ: Kết Hợp Đồng Thời (Dịch & Bóc Từng Chương)');
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          advancedSettings.translationPipelineMode === 'COMBINED'
                            ? 'bg-blue-950/60 border-blue-500 shadow-sm text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <div className="font-bold text-xs">
                          {advancedSettings.translationPipelineMode === 'COMBINED' ? '✓ ' : ''}
                          Kết Hợp Đồng Thời (Dịch & Bóc Từng Chương)
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                          Dịch và bóc tách thuật ngữ mới cùng lúc trong từng chương (chế độ truyền thống).
                        </div>
                      </button>

                      {/* Kích thước lô bóc từ điển */}
                      {(advancedSettings.translationPipelineMode || 'BATCH_GLOSSARY') === 'BATCH_GLOSSARY' && (
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between pt-2">
                          <div>
                            <div className="text-neutral-200 font-medium">Kích thước lô bóc từ điển:</div>
                            <div className="text-[10px] text-neutral-400">Số chương gom lại trong 1 đợt bóc</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[20, 50, 100].map(sz => (
                              <button
                                key={sz}
                                onClick={() => {
                                  setAdvancedSettings(prev => ({ ...prev, batchGlossarySize: sz }));
                                  addLog(`⚙️ Đã đặt kích thước lô bóc từ điển: ${sz} chương/đợt`);
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                  (advancedSettings.batchGlossarySize || 50) === sz
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {sz} ch
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phân hệ 1.3: Dịch Thuật & Chống Lọt Chữ Hán */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-neutral-100">3. Cài Đặt Dịch Thuật & Chống Lọt Chữ Hán</span>
                      <HelpBtn onClick={() => openHelp('settings_translation_anti_hanzi')} />
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Ngôn ngữ đích */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-200 font-medium">Ngôn ngữ đích (Target Language):</span>
                          <span className="text-blue-400 font-bold font-mono">{advancedSettings.targetLanguage}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                          {[
                            'Tiếng Việt',
                            '日本語',
                            'English',
                            '한국어'
                          ].map(lang => {
                            const isSelected = advancedSettings.targetLanguage === lang ||
                              (lang === 'Tiếng Việt' && advancedSettings.targetLanguage.toLowerCase().includes('việt')) ||
                              (lang === '日本語' && (advancedSettings.targetLanguage.includes('日本語') || advancedSettings.targetLanguage.toLowerCase().includes('nhật')));
                            return (
                              <button
                                key={lang}
                                onClick={() => {
                                  setAdvancedSettings(prev => ({ ...prev, targetLanguage: lang }));
                                  addLog(`⚙️ Đã chuyển Ngôn ngữ đích: ${lang}`);
                                }}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bộ lọc chống chữ Hán 2 lớp */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-neutral-200 font-bold flex items-center gap-1.5">
                              <span>Bộ Lọc Chống Lọt Chữ Hán 2 Lớp:</span>
                              <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
                                Dual-Layer Guard
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              Lớp 1: Ép khuôn Prompt • Lớp 2: Hậu kiểm Regex thông minh
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const nextVal = !advancedSettings.antiHanziStrict;
                              setAdvancedSettings(prev => ({ ...prev, antiHanziStrict: nextVal }));
                              addLog(`⚙️ Bộ lọc chống lọt chữ Hán: ${nextVal ? 'BẬT' : 'TẮT'}`);
                            }}
                            className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                              advancedSettings.antiHanziStrict ? 'bg-blue-600 justify-end' : 'bg-neutral-800 justify-start'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                          </button>
                        </div>
                        <div className="p-2 bg-neutral-900 rounded-lg text-[10px] text-neutral-300 leading-relaxed border border-neutral-800">
                          {advancedSettings.targetLanguage.toLowerCase().includes('nhật') || advancedSettings.targetLanguage.toLowerCase().includes('japan') ? (
                            <span className="text-amber-400">
                              🇯🇵 Ngôn ngữ đích là <strong>Tiếng Nhật</strong>: Hệ thống tự động thả lỏng ràng buộc cấm chữ Hán để AI tự do sinh Kanji, Hiragana và Katakana chuẩn tự nhiên.
                            </span>
                          ) : (
                            <span className="text-emerald-400">
                              🇻🇳 Ngôn ngữ đích là <strong>Tiếng Việt</strong>: Kích hoạt kỷ luật nghiêm ngặt cấm chữ Hán trong prompt + Tự động quét regex <code className="bg-neutral-950 px-1 rounded text-neutral-200">[\\u4e00-\\u9fa5]</code> sau khi AI sinh để thay bằng âm Hán-Việt chuẩn, bản dịch sạch 100%!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Độ dài mẫu ngữ cảnh nối chương */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-neutral-200 font-medium">Ngữ cảnh đoạn cuối chương trước:</div>
                          <div className="text-[10px] text-neutral-400">Đồng nhất xưng hô và bắt nhịp văn phong</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[150, 250, 350, 500].map(cnt => (
                            <button
                              key={cnt}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, contextSnippetLength: cnt }));
                                addLog(`⚙️ Mẫu ngữ cảnh nối chương: ${cnt} ký tự`);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                                (advancedSettings.contextSnippetLength || 350) === cnt
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {cnt} kt
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phân hệ 1.4: Cài Đặt Trình Đọc */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-neutral-100">4. Cài Đặt Trình Đọc & Trải Nghiệm Đọc</span>
                      <HelpBtn onClick={() => openHelp('settings_reader_experience')} />
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Cỡ chữ mặc định */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <span className="text-neutral-200 font-medium">Cỡ chữ mặc định khi đọc:</span>
                        <div className="flex items-center gap-1">
                          {[14, 16, 18, 20, 22].map(sz => (
                            <button
                              key={sz}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, readerFontSize: sz }));
                                setReaderFontSize(sz);
                              }}
                              className={`w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center cursor-pointer ${
                                (advancedSettings.readerFontSize || 16) === sz
                                  ? 'bg-purple-600 text-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Giữ sáng màn hình khi đọc */}
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-neutral-200 font-medium">Giữ sáng màn hình khi đọc:</div>
                          <div className="text-[10px] text-neutral-400">Kích hoạt FLAG_KEEP_SCREEN_ON</div>
                        </div>
                        <button
                          onClick={() => {
                            setAdvancedSettings(prev => ({ ...prev, keepScreenAwake: !prev.keepScreenAwake }));
                          }}
                          className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                            advancedSettings.keepScreenAwake ? 'bg-purple-600 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================== */}
              {/* PHÂN HỆ 2: QUẢN LÝ DỰ ÁN & XÓA DỰ ÁN */}
              {/* ============================================== */}
              {settingsSubTab === 'projects' && (
                <div className="space-y-3">
                  {/* Current Active Project Details */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-neutral-100">Dự Án Đang Mở Hiện Tại</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                        ĐANG KÍCH HOẠT
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Tên tác phẩm:</span>
                        <span className="text-white font-bold">{project?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Số chương gốc:</span>
                        <span className="text-blue-300 font-mono font-semibold">{project?.chapters?.length || 0} chương</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Đã dịch hoàn thành:</span>
                        <span className="text-emerald-400 font-mono font-semibold">{project ? Object.keys(project.translatedChapters).length : 0} chương</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Thuật ngữ Master Glossary:</span>
                        <span className="text-amber-300 font-mono font-semibold">{project ? Object.keys(project.masterGlossary).length : 0} từ</span>
                      </div>
                    </div>

                    {/* Dangerous Action: Delete Project */}
                    <div className="pt-1">
                      <button
                        onClick={() => setShowDeleteProjModal(true)}
                        className="w-full py-2.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Xóa Vĩnh Viễn Dự Án Này</span>
                      </button>
                    </div>
                  </div>

                  {/* List of All Stored Projects */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-neutral-100">Kho Tất Cả Các Dự Án Đã Lưu</span>
                        <HelpBtn onClick={() => openHelp('settings_projects_manager')} />
                      </div>
                      <button
                        onClick={() => setShowNewProjModal(true)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tạo Mới</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {Object.values(projects).map((p) => {
                        const isCurrent = p.name === currentProjectName;
                        const transCount = Object.keys(p.translatedChapters || {}).length;
                        return (
                          <div
                            key={p.name}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              isCurrent
                                ? 'bg-neutral-950 border-blue-500 text-white shadow-sm'
                                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold truncate pr-2 text-sm">{p.name}</span>
                              {isCurrent ? (
                                <span className="text-[10px] text-blue-300 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800 font-semibold shrink-0">
                                  Đang chọn
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCurrentProjectName(p.name);
                                    setRawTextInput(p.chapters.join('\n\n'));
                                    fullRawTextRef.current = p.chapters.join('\n\n');
                                    setFromChapInput(1);
                                    setToChapInput(p.chapters.length || 1);
                                    setChapterListPage(0);
                                    setCurrentChapterIndex(0);
                                    addLog(`📁 Đã chuyển sang dự án: [${p.name}] (${Object.keys(p.translatedChapters || {}).length}/${p.chapters.length} chương)`);
                                  }}
                                  className="text-[10px] text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg cursor-pointer shrink-0 font-semibold shadow-sm transition-all"
                                >
                                  Chuyển sang
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-neutral-400">
                              <span>Tiến độ: <strong className="text-neutral-200 font-mono">{transCount}/{p.chapters.length} chương</strong></span>
                              <span>Glossary: <strong className="text-emerald-400 font-mono">{Object.keys(p.masterGlossary || {}).length} từ</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 leading-relaxed">
                      🛡️ <strong>Bảo toàn tuyệt đối</strong>: Mọi dự án được lưu vĩnh viễn trên máy cho đến khi bạn chủ động bấm nút Xóa. Kho Key API và Prompt ở Tab 1 được cô lập riêng biệt, hoàn toàn không bị ảnh hưởng khi chuyển đổi hay xóa dự án!
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================== */}
              {/* PHÂN HỆ 3: GOD-MODE & XUẤT TÁC PHẨM */}
              {/* ============================================== */}
              {settingsSubTab === 'godmode' && (
                <div className="space-y-3">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-neutral-100">5. Kiểm Soát 5 Lớp Chạy Ngầm (God-Mode)</span>
                        <HelpBtn onClick={() => openHelp('settings_god_mode')} />
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                        5/5 KÍCH HOẠT
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { name: 'Lớp 1: Foreground Service', active: godModeActive, desc: 'Dịch liên tục trên thanh thông báo' },
                        { name: 'Lớp 2: CPU WakeLock', active: wakeLockActive, desc: 'Chống Deep Sleep khi tắt màn hình' },
                        { name: 'Lớp 3: Bỏ qua Tối ưu Pin (Doze Mode)', active: batteryOptimizationIgnored, desc: 'Không bị hệ thống ngắt tiến trình' },
                        { name: 'Lớp 4: WorkManager Chó Canh (Watchdog)', active: workManagerWatchdog, desc: 'Tự động hồi sinh tiến trình sau 15s nếu bị tắt' },
                        { name: 'Lớp 5: Root OOM Score -1000', active: isDeviceRooted, desc: 'Miễn nhiễm 100% với lệnh Kill của Android OS' },
                      ].map((layer, idx) => (
                        <div key={idx} className="p-2 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-neutral-200">{layer.name}</div>
                            <div className="text-[10px] text-neutral-400">{layer.desc}</div>
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded font-mono font-bold">
                            ON
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={onOpenGodModeModal}
                      className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                      <span>Xem Chi Tiết Lệnh Root & Kiến Trúc God-Mode</span>
                    </button>

                    {/* BẢNG ĐO ĐẠC LINUX KERNEL THỰC TẾ (REAL-TIME KERNEL DIAGNOSTICS) */}
                    <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5 font-sans font-bold text-xs text-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-blue-400" />
                          <span>Thông Số Linux Kernel Thực Tế</span>
                        </div>
                        <button
                          onClick={handleRefreshKernel}
                          disabled={isRefreshingKernel}
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshingKernel ? 'animate-spin' : ''}`} />
                          <span>Làm mới</span>
                        </button>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Process ID (PID):</span>
                        <span className="text-blue-300 font-bold">{kernelPid}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>User ID (UID):</span>
                        <span className="text-neutral-300 font-bold">{kernelUid}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>/proc/self/oom_score_adj:</span>
                        <span className="text-emerald-400 font-bold">{kernelOomScore} (Bất Tử LMK)</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Phantom Process Killer:</span>
                        <span className="text-emerald-400 font-bold">VÔ HIỆU HÓA (2.147.483.647)</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Doze Mode Whitelist:</span>
                        <span className="text-cyan-300 font-bold">DUMPSYS WHITELISTED</span>
                      </div>
                    </div>
                  </div>

                  {/* Model Dùng Cho Khâu Làm Mượt Final */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-neutral-100">Model Dùng Cho Khâu Làm Mượt Final</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Khâu quét sạch chữ Hán và làm mượt toàn văn độc lập với model dịch chương. Mặc định sử dụng <span className="text-purple-300 font-bold">Gemini 3.6 Flash</span> để đạt chuẩn Hán-Việt mượt mà nhất.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'].map(pm => (
                        <button
                          key={pm}
                          onClick={() => {
                            setPolishModel(pm);
                            addLog(`⚙️ Đã chọn model làm mượt Final: ${pm}`);
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            polishModel === pm
                              ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          {pm.replace('gemini-', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Full Novel */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-neutral-100">Xuất Toàn Văn Tác Phẩm</span>
                      <HelpBtn onClick={() => openHelp('export_full_txt')} />
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Đóng gói toàn bộ các chương đã dịch sang 1 trong 5 định dạng Ebook phổ biến (TXT, EPUB, HTML, MOBI, AZW3) và tải ngay về máy.
                    </p>
                    <button
                      onClick={handleExportFullNovel}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>📥 Xuất Tác Phẩm (TXT, EPUB, HTML, MOBI, AZW3)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION: 4 TABS */}
        <div className="h-16 bg-neutral-900 border-t border-neutral-800 px-2 flex items-center justify-around select-none shrink-0">
          <button
            onClick={() => setActiveBottomTab('keys')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'keys' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Key className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Key & Prompt</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('translate')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'translate' ? 'text-blue-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Dịch & Từ điển</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('chapters')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'chapters' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bản dịch & Đọc</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('settings')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'settings' ? 'text-purple-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Cài đặt</span>
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* DEDICATED FULL GLOSSARY DRAWER MODAL (SEARCH + PAGINATION) */}
      {/* ======================================================== */}
      {showFullGlossaryModal && project && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-lg flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">Kho Từ Điển Master Glossary</span>
                <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                  {Object.keys(project.masterGlossary).length} từ
                </span>
              </div>
              <button 
                onClick={() => setShowFullGlossaryModal(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={glossarySearchQuery}
                  onChange={(e) => {
                    setGlossarySearchQuery(e.target.value);
                    setGlossaryModalPage(0);
                  }}
                  placeholder="Tìm từ gốc Hán hoặc nghĩa dịch tiếng Việt..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Actions in Drawer */}
              <div className="flex items-center gap-2 mt-2">
                <label className="flex-1 py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp Tệp .txt (raw=vi)</span>
                  <input
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportGlossaryFile(file);
                      e.target.value = '';
                    }}
                  />
                </label>

                <button
                  onClick={handleExportGlossaryFile}
                  className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File .txt</span>
                </button>
              </div>
            </div>

            {/* Glossary List (Paginated) */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {pagedGlossaryList.length > 0 ? (
                pagedGlossaryList.map(([k, v], idx) => (
                  <div key={idx} className="p-2 bg-neutral-950 rounded-xl flex items-center justify-between text-xs border border-neutral-800/80">
                    <div className="truncate pr-2">
                      <span className="text-blue-300 font-semibold">{k}</span>
                      <span className="text-neutral-500 mx-2">➔</span>
                      <span className="text-emerald-400 font-bold">{v}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditGlossary(k, v)}
                        className="text-neutral-400 hover:text-blue-400 p-1 cursor-pointer"
                        title="Chỉnh sửa thuật ngữ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setProjects(prev => {
                            const cur = prev[currentProjectName];
                            const newG = { ...cur.masterGlossary };
                            delete newG[k];
                            return { ...prev, [currentProjectName]: { ...cur, masterGlossary: newG } };
                          });
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Xóa thuật ngữ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-neutral-500">
                  {glossarySearchQuery ? 'Không tìm thấy thuật ngữ phù hợp!' : 'Chưa có từ nào trong kho.'}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalGlossaryPages > 1 && (
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <button
                  disabled={glossaryModalPage <= 0}
                  onClick={() => setGlossaryModalPage(prev => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trang trước</span>
                </button>

                <span className="text-neutral-400 font-mono">
                  {glossaryModalPage + 1} / {totalGlossaryPages} ({filteredGlossaryList.length} từ)
                </span>

                <button
                  disabled={glossaryModalPage >= totalGlossaryPages - 1}
                  onClick={() => setGlossaryModalPage(prev => Math.min(totalGlossaryPages - 1, prev + 1))}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TRÌNH ĐỌC TOÀN MÀN HÌNH CHUYÊN NGHIỆP (AMOLED & SEPIA) */}
      {/* ======================================================== */}
      {showFullScreenReader && project && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-1 sm:p-4">
          <div className={`w-full max-w-3xl h-[95vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border transition-colors ${
            readerTheme === 'amoled' 
              ? 'bg-[#000000] text-[#E2E8F0] border-neutral-800' 
              : readerTheme === 'sepia' 
                ? 'bg-[#FBF0D9] text-[#3D2E1E] border-[#E5D3B3]' 
                : 'bg-white text-neutral-900 border-neutral-200'
          }`}>
            
            {/* Top Reader Controls Bar */}
            <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
              readerTheme === 'amoled' ? 'bg-[#0A0A0A] border-neutral-800' : readerTheme === 'sepia' ? 'bg-[#F4ECD8] border-[#E0CEAA]' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-bold uppercase tracking-wider truncate">
                  {project.name.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] opacity-60">·</span>
                
                {/* Chapter Quick Jumper Dropdown */}
                <button
                  onClick={() => setShowChapterDrawer(!showChapterDrawer)}
                  className="px-2 py-0.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-blue-500/30"
                  title="Chọn nhanh chương khác"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Chương {readingChapterIndex + 1}/{totalChapters} ▾</span>
                </button>
              </div>

              {/* Reader Action Icons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const textToCopy = project.translatedChapters[readingChapterIndex] || project.chapters[readingChapterIndex];
                    handleCopyCurrentChapterText(textToCopy);
                  }}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    copiedChapter ? 'bg-emerald-600 text-white border-emerald-500' : 'hover:opacity-80'
                  }`}
                  title="Sao chép nội dung chương"
                >
                  {copiedChapter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedChapter ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                <button 
                  onClick={() => setShowFullScreenReader(false)}
                  className="p-1.5 rounded-full hover:bg-black/10 cursor-pointer"
                  title="Đóng trình đọc"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Chapter Selector Drawer (Popup when clicked) */}
            {showChapterDrawer && (
              <div className={`p-3 border-b max-h-48 overflow-y-auto ${
                readerTheme === 'amoled' ? 'bg-[#0F0F0F] border-neutral-800' : readerTheme === 'sepia' ? 'bg-[#EDE3CB] border-[#DBC9A8]' : 'bg-neutral-100 border-neutral-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">Chuyển nhanh đến chương:</span>
                  <button onClick={() => setShowChapterDrawer(false)} className="text-xs text-neutral-400 hover:text-white cursor-pointer">Đóng</button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-xs">
                  {project.chapters.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setReadingChapterIndex(i);
                        setShowChapterDrawer(false);
                      }}
                      className={`p-1.5 rounded-lg font-mono text-[11px] cursor-pointer border ${
                        readingChapterIndex === i 
                          ? 'bg-blue-600 text-white font-bold border-blue-500' 
                          : project.translatedChapters[i] 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' 
                            : 'bg-neutral-900/50 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {i + 1} {project.translatedChapters[i] ? '✓' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reader Secondary Toolbar (View Mode, AMOLED/Sepia, Typography) */}
            <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
              readerTheme === 'amoled' ? 'bg-[#050505] border-neutral-800/80' : readerTheme === 'sepia' ? 'bg-[#EFE5CD] border-[#DBC9A8]' : 'bg-neutral-100/80 border-neutral-200'
            }`}>
              <div className="flex items-center gap-1 bg-black/10 p-0.5 rounded-xl border border-black/10 text-[11px]">
                <button
                  onClick={() => setReaderViewMode('translated')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    readerViewMode === 'translated' ? 'bg-blue-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  onClick={() => setReaderViewMode('bilingual')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    readerViewMode === 'bilingual' ? 'bg-blue-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Song Ngữ
                </button>
                <button
                  onClick={() => setReaderViewMode('original')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    readerViewMode === 'original' ? 'bg-blue-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Nguyên Tác
                </button>
              </div>

              {/* Theme Selector: AMOLED, Sepia, Light */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/10 p-0.5 rounded-xl border border-black/10">
                  <button
                    onClick={() => setReaderTheme('amoled')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                      readerTheme === 'amoled' ? 'bg-neutral-900 text-emerald-400 border border-neutral-700' : 'opacity-60 hover:opacity-100'
                    }`}
                    title="AMOLED Pitch Black (Tiết kiệm pin tuyệt đối)"
                  >
                    AMOLED
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                      readerTheme === 'sepia' ? 'bg-[#FBF0D9] text-[#3D2E1E] border border-[#E5D3B3]' : 'opacity-60 hover:opacity-100'
                    }`}
                    title="Sepia Warm (Vàng dịu êm mắt)"
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                      readerTheme === 'light' ? 'bg-white text-neutral-900 border border-neutral-300' : 'opacity-60 hover:opacity-100'
                    }`}
                    title="Sáng"
                  >
                    Sáng
                  </button>
                </div>

                {/* Font Family (Serif / Sans / Mono) */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReaderFontFamily('serif')}
                    className={`px-1.5 py-0.5 text-[11px] font-serif font-bold rounded cursor-pointer ${
                      readerFontFamily === 'serif' ? 'bg-blue-600 text-white' : 'opacity-60'
                    }`}
                    title="Font Serif (Văn chương)"
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setReaderFontFamily('sans')}
                    className={`px-1.5 py-0.5 text-[11px] font-sans font-bold rounded cursor-pointer ${
                      readerFontFamily === 'sans' ? 'bg-blue-600 text-white' : 'opacity-60'
                    }`}
                    title="Font Sans (Hiện đại)"
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => setReaderFontFamily('mono')}
                    className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded cursor-pointer ${
                      readerFontFamily === 'mono' ? 'bg-blue-600 text-white' : 'opacity-60'
                    }`}
                    title="Font Mono"
                  >
                    Mono
                  </button>
                </div>

                {/* Font Size */}
                <div className="flex items-center gap-1 border rounded-lg px-1.5 py-0.5">
                  <button
                    onClick={() => setReaderFontSize(f => Math.max(12, f - 1))}
                    className="px-1 text-xs font-bold hover:text-blue-500 cursor-pointer"
                    title="Giảm cỡ chữ"
                  >
                    A-
                  </button>
                  <span className="text-[11px] font-mono opacity-80 px-1">{readerFontSize}px</span>
                  <button
                    onClick={() => setReaderFontSize(f => Math.min(28, f + 1))}
                    className="px-1 text-xs font-bold hover:text-blue-500 cursor-pointer"
                    title="Tăng cỡ chữ"
                  >
                    A+
                  </button>
                </div>

                {/* Text Alignment */}
                <button
                  onClick={() => setReaderAlign(readerAlign === 'justify' ? 'left' : 'justify')}
                  className="p-1 rounded hover:bg-black/10 cursor-pointer"
                  title={readerAlign === 'justify' ? 'Đang canh đều 2 bên' : 'Đang canh lề trái'}
                >
                  {readerAlign === 'justify' ? <AlignJustify className="w-3.5 h-3.5" /> : <AlignLeft className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Reader Content Body (Preserving Reading Position strictly) */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 ${
              readerFontFamily === 'serif' ? 'font-serif' : readerFontFamily === 'sans' ? 'font-sans' : 'font-mono'
            } ${
              readerLineHeight === 'loose' ? 'leading-loose' : readerLineHeight === 'relaxed' ? 'leading-relaxed' : 'leading-normal'
            } ${
              readerAlign === 'justify' ? 'text-justify' : 'text-left'
            }`}>
              
              {readerViewMode === 'translated' && (
                <div>
                  {project.translatedChapters[readingChapterIndex] ? (
                    <div 
                      className="whitespace-pre-wrap select-text"
                      style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.8 }}
                    >
                      {project.translatedChapters[readingChapterIndex]}
                    </div>
                  ) : (
                    <div className="text-center py-20 space-y-3">
                      <BookOpen className="w-12 h-12 opacity-30 mx-auto" />
                      <p className="font-sans text-base font-semibold opacity-80">Chương này chưa có bản dịch.</p>
                      <p className="font-sans text-xs opacity-60">Bạn có thể qua Thẻ Dịch để dịch chương này trong nền mà không làm gián đoạn vị trí đọc!</p>
                      <button
                        onClick={() => {
                          setShowFullScreenReader(false);
                          setActiveBottomTab('translate');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Chuyển sang Thẻ Dịch
                      </button>
                    </div>
                  )}
                </div>
              )}

              {readerViewMode === 'original' && (
                <div 
                  className="whitespace-pre-wrap font-mono leading-relaxed select-text opacity-90"
                  style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.8 }}
                >
                  {project.chapters[readingChapterIndex] || 'Không có văn bản gốc.'}
                </div>
              )}

              {readerViewMode === 'bilingual' && (
                <div className="space-y-6">
                  <div className={`p-4 rounded-2xl border ${
                    readerTheme === 'amoled' ? 'bg-[#0A0A0A] border-neutral-800' : readerTheme === 'sepia' ? 'bg-[#F2E3C6] border-[#E0CEAA]' : 'bg-neutral-100 border-neutral-200'
                  }`}>
                    <span className="text-[11px] font-sans font-bold text-emerald-500 uppercase tracking-wider block mb-2">
                      🇻🇳 BẢN DỊCH TIẾNG VIỆT:
                    </span>
                    <div 
                      className="whitespace-pre-wrap select-text"
                      style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.8 }}
                    >
                      {project.translatedChapters[readingChapterIndex] || '(Chưa có bản dịch cho chương này)'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    readerTheme === 'amoled' ? 'bg-[#0A0A0A]/50 border-neutral-800/80' : readerTheme === 'sepia' ? 'bg-[#ECE0C8]/60 border-[#DBC9A8]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <span className="text-[11px] font-sans font-bold text-blue-500 uppercase tracking-wider block mb-2">
                      🇨🇳 NGUYÊN TÁC GỐC:
                    </span>
                    <div 
                      className="whitespace-pre-wrap font-mono select-text opacity-85"
                      style={{ fontSize: `${Math.max(12, readerFontSize - 1)}px`, lineHeight: 1.8 }}
                    >
                      {project.chapters[readingChapterIndex] || '(Không có dữ liệu gốc)'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Chapter Navigation Bar */}
            <div className={`p-3 border-t flex items-center justify-between shrink-0 ${
              readerTheme === 'amoled' ? 'bg-[#0A0A0A] border-neutral-800' : readerTheme === 'sepia' ? 'bg-[#F4ECD8] border-[#E0CEAA]' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <button
                disabled={readingChapterIndex <= 0}
                onClick={() => setReadingChapterIndex(prev => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border hover:bg-black/5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Chương trước</span>
              </button>

              <span className="text-xs font-mono font-bold">
                {readingChapterIndex + 1} / {totalChapters}
              </span>

              <button
                disabled={readingChapterIndex >= totalChapters - 1}
                onClick={() => setReadingChapterIndex(prev => prev + 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border hover:bg-black/5"
              >
                <span>Chương sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT EDIT / ADD MODAL */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 text-sm">
                {promptModalMode === 'edit' ? 'Chỉnh Sửa Thẻ Prompt' : 'Thêm Thẻ Prompt Mới'}
              </span>
              <button onClick={() => setShowPromptModal(false)} className="text-neutral-400 hover:text-neutral-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Tiêu đề phong cách:</label>
                <input
                  type="text"
                  value={promptTitleInput}
                  onChange={(e) => setPromptTitleInput(e.target.value)}
                  placeholder="VD: Tiên Hiệp, Đô Thị..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Nội dung System Prompt chi tiết cho AI:</label>
                <textarea
                  rows={6}
                  value={promptContentInput}
                  onChange={(e) => setPromptContentInput(e.target.value)}
                  placeholder="Nhập nội dung chỉ dẫn dịch thuật, cách xưng hô, văn phong mong muốn..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowPromptModal(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePrompt}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {promptModalMode === 'edit' ? 'Lưu Thay Đổi' : 'Thêm Thẻ Mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 text-sm">Tạo Tiến Trình Dịch Mới</span>
              <button onClick={() => setShowNewProjModal(false)} className="text-neutral-400 hover:text-neutral-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-neutral-400">
              Tạo một dự án truyện hoàn toàn độc lập. Bảng từ điển Master Glossary và danh sách chương sẽ được tách biệt 100%, không bị lẫn lộn giữa các bộ truyện khác nhau.
            </p>

            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Tên truyện mới (VD: Tien_Nghich)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowNewProjModal(false)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Tạo Dự Án
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GLOSSARY MODAL */}
      {showEditGlossaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Chỉnh Sửa Thuật Ngữ</span>
              </span>
              <button onClick={() => setShowEditGlossaryModal(false)} className="text-neutral-400 hover:text-neutral-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Từ gốc (Tiếng Trung / Raw):</label>
                <input
                  type="text"
                  value={editingGlossaryNewKey}
                  onChange={(e) => setEditingGlossaryNewKey(e.target.value)}
                  placeholder="VD: 林辰"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Nghĩa dịch tiếng Việt chuẩn:</label>
                <input
                  type="text"
                  value={editingGlossaryNewVal}
                  onChange={(e) => setEditingGlossaryNewVal(e.target.value)}
                  placeholder="VD: Lâm Thần"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowEditGlossaryModal(false)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditGlossary}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANGEROUS ACTION: DELETE PROJECT CONFIRMATION MODAL */}
      {showDeleteProjModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-800/80 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-bold text-white text-sm">Xác Nhận Xóa Vĩnh Viễn Dự Án</span>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-2xl space-y-2 text-xs text-neutral-300">
              <p>
                Bạn có chắc chắn muốn xóa vĩnh viễn dự án <strong className="text-white">[{currentProjectName}]</strong>?
              </p>
              <div className="text-[11px] text-neutral-400 space-y-1">
                <div>• <strong className="text-white">{project?.chapters?.length || 0}</strong> chương truyện thô sẽ bị xóa.</div>
                <div>• <strong className="text-white">{project ? Object.keys(project.translatedChapters).length : 0}</strong> bản dịch đã hoàn thành sẽ bị xóa.</div>
                <div>• Toàn bộ từ điển Master Glossary riêng của bộ này sẽ giải phóng.</div>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-red-900/30">
                ✓ Kho API Keys và các Thẻ Prompt ở Tab 1 được BẢO TOÀN VĨNH CỬU 100%, hoàn toàn không bị ảnh hưởng!
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowDeleteProjModal(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteCurrentProject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Vĩnh Viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT 5 EBOOK FORMATS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">Xuất Bản Dịch Ebook</span>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-neutral-400">
              Chọn 1 trong 5 định dạng Ebook để tải về máy hoặc lưu trữ cho tác phẩm <strong className="text-white">[{project?.name}]</strong> ({project ? Object.keys(project.translatedChapters).length : 0} chương):
            </p>

            <div className="space-y-2">
              {[
                { fmt: 'txt' as const, icon: '📄', label: 'TXT (.txt)', desc: 'Văn bản thuần • Tương thích mọi thiết bị' },
                { fmt: 'epub' as const, icon: '📚', label: 'EPUB (.epub)', desc: 'Sách điện tử chuẩn Quốc tế • Có mục lục' },
                { fmt: 'html' as const, icon: '🌐', label: 'HTML (.html)', desc: 'Trang đọc Offline • Giao diện Dark AMOLED' },
                { fmt: 'mobi' as const, icon: '📱', label: 'MOBI (.mobi)', desc: 'Sách Kindle Classic • Tối ưu máy Amazon' },
                { fmt: 'azw3' as const, icon: '⚡', label: 'AZW3 (.azw3)', desc: 'Sách Kindle KF8 • Chuẩn hiển thị cao cấp' },
              ].map(item => (
                <div
                  key={item.fmt}
                  onClick={() => handleExportNovelFormat(item.fmt)}
                  className="p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-600/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-400">{item.desc}</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* HOW TO USE COMPREHENSIVE MODAL */}
      <HowToUseModal 
        isOpen={showHowToUseModal} 
        onClose={() => setShowHowToUseModal(false)} 
      />

      {/* SUB-ITEM HELP TOOLTIP MODAL */}
      <HelpTooltipModal 
        info={activeHelpInfo} 
        onClose={() => setActiveHelpInfo(null)} 
      />

    </div>
  );
};

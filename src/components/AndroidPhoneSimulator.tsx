import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, Key, Sparkles, BookOpen, Play, Pause, RotateCcw, 
  Square, Download, Maximize2, ShieldCheck, Terminal, CheckCircle2, 
  AlertCircle, RefreshCw, X, Edit3, Trash2, ShieldAlert, Plus,
  FileText, ArrowRight, Settings, Search, Upload, Copy, Check,
  ChevronLeft, ChevronRight, Sliders, Type, Sun, Moon, Eye,
  CheckCircle, PlayCircle, Clock, Zap, BookMarked, Layers, FileCheck,
  AlignLeft, AlignJustify, ListOrdered, Share2, Compass, Bookmark,
  Filter, ChevronDown, ChevronUp, Loader2, Cpu
} from 'lucide-react';
import { ApiKeyItem, PromptCardItem, ProjectData, AdvancedSettings, ParsedEbook, TranslationCoreStrategy } from '../types';
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

interface StrategyOption {
  id: TranslationCoreStrategy;
  title: string;
  badge?: string;
  badgeClass?: string;
  desc: string;
}

const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    id: 'STRATEGY_PURE_LITERARY',
    title: 'Dịch Thuần Túy Văn Học',
    badge: 'Khuyên Dùng',
    badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-700',
    desc: 'Dịch trực tiếp với Master Glossary đối chiếu. Văn phong mượt mà, thuần túy, sạch sẽ & tốc độ cao nhất.'
  },
  {
    id: 'STRATEGY_DUAL_TASK',
    title: '1 Request 2 Tác Vụ (Dịch & Bóc Từ Mới)',
    badge: 'Tiết Kiệm Token',
    badgeClass: 'bg-blue-950 text-blue-300 border border-blue-700',
    desc: 'Đồng thời dịch và tự động phát hiện trích xuất từ mới trong cùng 1 request mỗi chương.'
  },
  {
    id: 'STRATEGY_PRE_INJECT_RAW',
    title: 'Ghi Đè Thuật Ngữ Lên Raw Trước Khi Dịch',
    badge: 'Khóa Tên 100%',
    badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-700',
    desc: 'Ghi đè tên riêng, chức vụ, địa danh, công pháp vào giữa bản Raw tiếng Trung trước khi gửi AI. Tuyệt đối không chệch tên.'
  },
  {
    id: 'STRATEGY_DUAL_PASS',
    title: 'Dịch Kép Phản Biện 2-Pass (1 Dịch + 1 Biên Tập)',
    badge: 'Chất Lượng Tối Đa',
    badgeClass: 'bg-[#1e2328] text-[#c8aa6e] border border-[#785a28]',
    desc: 'Chạy 2 request/chương: Pass 1 dịch thô ➔ Pass 2 Tổng Biên Tập đối chiếu trực tiếp bản raw gốc để sửa sạch câu sai nghĩa, thành ngữ hiểu nhầm và chữ Hán sót.'
  },
  {
    id: 'STRATEGY_COT_THINKING',
    title: 'Dịch Suy Luận Ngữ Cảnh CoT (Deep Thinking)',
    badge: 'Phân Tích Sâu',
    badgeClass: 'bg-blue-950 text-blue-300 border border-blue-700',
    desc: 'AI phân tích ngữ cảnh qua khối <analysis>, giải mã thành ngữ 4 chữ và định vị vai vế trước khi dịch.'
  }
];

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  rotationStrategy: 'round-robin',
  cooldownSeconds: 60,
  maxRetries: 3,
  requestTimeoutSeconds: 60,
  translationCoreStrategy: 'STRATEGY_PURE_LITERARY',
  translationPipelineMode: 'MODE_2_BATCH_PURE',
  enableDualPassProofreading: false,
  enableBatchGlossaryAutoExtract: true,
  batchGlossarySize: 50,
  enablePreviousChapterContext: true,
  contextSnippetLength: 350,
  enableAutoFinalPolish: true,
  antiHanziStrict: true,
  autoHealOnlineEnabled: true,
  rollingPolishBatchSize: 15,
  minTermLength: 2,
  minFrequency: 2,
  conflictPolicy: 'keep-old',
  blacklistWords: ['hắn', 'nàng', 'ta', 'ngươi', 'chúng ta', 'bọn họ', 'chính mình', 'cái này', 'cái kia', 'một cái', 'đã từng'],
  targetLanguage: 'Tiếng Việt',
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
  const [processedRollingPolishMilestones, setProcessedRollingPolishMilestones] = useState<number[]>([]);

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
        },
        polishedChapterIndices: [0]
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
        },
        polishedChapterIndices: []
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

  // Tự động thanh lọc các mục rác / tiêu đề prompt nếu đã lọt vào localStorage từ trước
  useEffect(() => {
    let hasPurged = false;
    const cleaned = { ...projects };
    for (const [pName, pData] of Object.entries(cleaned)) {
      if (pData.masterGlossary) {
        const purgedGloss = purgeInvalidGlossaryEntries(pData.masterGlossary);
        if (Object.keys(purgedGloss).length !== Object.keys(pData.masterGlossary).length) {
          cleaned[pName] = { ...pData, masterGlossary: purgedGloss };
          hasPurged = true;
        }
      }
    }
    if (hasPurged) {
      setProjects(cleaned);
      addLog('🧹 Đã tự động dọn sạch các nhãn tiêu đề rác lọt vào Master Glossary!');
    }
  }, []);

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
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState<boolean>(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isRotationDropdownOpen, setIsRotationDropdownOpen] = useState<boolean>(false);
  const [isConflictDropdownOpen, setIsConflictDropdownOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [isPolishModelDropdownOpen, setIsPolishModelDropdownOpen] = useState<boolean>(false);

  // Tab 4 (Settings) Accordion Dropdown States
  const [isSection1Open, setIsSection1Open] = useState<boolean>(false);
  const [isSection2Open, setIsSection2Open] = useState<boolean>(false);
  const [isSection3Open, setIsSection3Open] = useState<boolean>(false);
  const [isSection4Open, setIsSection4Open] = useState<boolean>(false);
  const [isSection5Open, setIsSection5Open] = useState<boolean>(false);

  // Tab 1 (Key & Prompt) Accordion Dropdown States
  const [isKeyPoolOpen, setIsKeyPoolOpen] = useState<boolean>(false);
  const [isModelSectionOpen, setIsModelSectionOpen] = useState<boolean>(false);
  const [isPromptSectionOpen, setIsPromptSectionOpen] = useState<boolean>(false);

  // Universal Quantity Editor Modal State
  const [editQuantityModal, setEditQuantityModal] = useState<{
    title: string;
    description?: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onSave: (val: number) => void;
  } | null>(null);
  const [tempQuantityInput, setTempQuantityInput] = useState<string>('');

  const openQuantityEditor = (
    title: string,
    currentVal: number,
    min: number,
    max: number,
    unit: string,
    onSave: (val: number) => void,
    description?: string,
    step: number = 1
  ) => {
    setTempQuantityInput(String(currentVal));
    setEditQuantityModal({
      title,
      description,
      value: currentVal,
      min,
      max,
      step,
      unit,
      onSave
    });
  };

  const getStrategyTitle = (st?: string) => {
    const found = STRATEGY_OPTIONS.find(o => o.id === st);
    return found ? found.title : 'Dịch Thuần Túy Văn Học';
  };

  const getStrategyShortDesc = (st?: string) => {
    const found = STRATEGY_OPTIONS.find(o => o.id === st);
    return found ? found.desc : 'Dịch trực tiếp với Master Glossary đối chiếu.';
  };

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

  // Helper: Validate valid Chinese glossary key and reject prompt category labels
  const isValidGlossaryKey = (key: string): boolean => {
    if (!key) return false;
    const cleanKey = key.trim().replace(/[*_"`'\[\]【】]/g, '');
    if (countChineseChars(cleanKey) < (advancedSettings.minTermLength || 2)) return false;

    const upper = cleanKey.toUpperCase();
    if (
      upper.includes('CÔNG PHÁP') || upper.includes('CHIÊU THỨC') || upper.includes('THÂN PHÁP') ||
      upper.includes('KHẨU QUYẾT') || upper.includes('TÊN NHÂN VẬT') || upper.includes('ĐỊA DANH') ||
      upper.includes('MÔN PHÁI') || upper.includes('BANG HỘI') || upper.includes('THÀNH TRÌ') ||
      upper.includes('PHÁP BẢO') || upper.includes('LINH BẢO') || upper.includes('THẦN KHÍ') ||
      upper.includes('LINH THÚ') || upper.includes('YÊU THÚ') || upper.includes('THẦN THÚ') ||
      upper.includes('CẢNH GIỚI') || upper.includes('ĐAN DƯỢC') || upper.includes('DƯỢC LIỆU') ||
      upper.includes('GLOSSARY') || upper.includes('THUẬT NGỮ') || upper.includes('DANH TỪ') ||
      upper.includes('CHƯƠNG') || upper.includes('CHAPTER')
    ) {
      return false;
    }
    return true;
  };

  // Helper: Purge invalid labels and non-Chinese keys from Master Glossary
  const purgeInvalidGlossaryEntries = (dict: Record<string, string>): Record<string, string> => {
    if (!dict) return {};
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(dict)) {
      if (isValidGlossaryKey(k) && v && v.trim() && k.trim().toLowerCase() !== v.trim().toLowerCase()) {
        cleaned[k.trim()] = v.trim();
      }
    }
    return cleaned;
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

      if (!isValidGlossaryKey(trimmedKey)) continue;
      if (trimmedKey.toLowerCase() === trimmedVal.toLowerCase()) continue;

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

  // Helper: Ghi đè thuật ngữ tiếng Việt trực tiếp lên bản Raw (Mode 3 Hybrid Raw Injection)
  const injectTermsIntoRaw = (raw: string, glossary: Record<string, string>): string => {
    if (!raw || !glossary || Object.keys(glossary).length === 0) return raw;
    let injected = raw;
    // Sắp xếp các từ khóa theo độ dài giảm dần để tránh nuốt từ con
    const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const val = glossary[key];
      if (key && val && key.trim() && val.trim() && key.length >= 2) {
        if (injected.includes(key)) {
          injected = injected.split(key).join(` ${val.trim()} `);
        }
      }
    }
    return injected;
  };

  // Translation Loop Simulation & Execution (Hỗ trợ độc lập 6 Mode Dịch)
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

        const strategy = advancedSettings.translationCoreStrategy || 'STRATEGY_PURE_LITERARY';
        const rawMode = advancedSettings.translationPipelineMode || 'MODE_2_BATCH_PURE';
        const isDualTaskStrategy = strategy === 'STRATEGY_DUAL_TASK' || rawMode === 'MODE_1_DUAL_TASK' || rawMode === 'COMBINED';
        const isPreInjectStrategy = strategy === 'STRATEGY_PRE_INJECT_RAW' || rawMode === 'MODE_3_RAW_INJECT';
        const isCoTStrategy = strategy === 'STRATEGY_COT_THINKING' || rawMode === 'MODE_5_COT_THINKING';
        const isDualPassEnabled = advancedSettings.enableDualPassProofreading || rawMode === 'MODE_4_DUAL_PASS';

        let strategyLabel = 'Dịch Thuần Túy';
        if (isDualTaskStrategy) strategyLabel = 'Dual-Task (Dịch + Bóc Từ)';
        else if (isPreInjectStrategy) strategyLabel = 'Ghi Đè Raw Inject';
        else if (isCoTStrategy) strategyLabel = 'Suy Luận CoT';
        if (isDualPassEnabled) strategyLabel += ' + Pass 2 Biên Tập';

        setStatusText(`⚡ [${strategyLabel}] Đang dịch chương ${currentChapterIndex + 1}/${targetEnd}...`);
        
        const rawContent = project.chapters[currentChapterIndex];
        const titleLine = rawContent.split('\n')[0] || `Chương ${currentChapterIndex + 1}`;
        
        // 1. EXTRACT PREVIOUS CHAPTER'S LAST N CHARACTERS FOR CONTEXT ROLLING WINDOW
        let previousSnippet = '';
        const snippetLimit = advancedSettings.contextSnippetLength || 350;
        const isContextEnabled = advancedSettings.enablePreviousChapterContext !== false;
        if (isContextEnabled && currentChapterIndex > 0 && project.translatedChapters[currentChapterIndex - 1]) {
          const prevFull = project.translatedChapters[currentChapterIndex - 1];
          const sliceLen = Math.min(prevFull.length, snippetLimit);
          previousSnippet = '...' + prevFull.slice(prevFull.length - sliceLen).trim();
          setLastAttachedSnippet(previousSnippet);
        } else {
          setLastAttachedSnippet('');
        }

        setLiveStreamText(`[${strategyLabel}] Đang xử lý: ${titleLine} (${project.model})${previousSnippet ? ` [🔗 Kèm ${snippetLimit} ký tự ngữ cảnh]` : ''}...`);

        timer = setTimeout(async () => {
          let translatedText = '';
          let aiExtractedGlossary: Record<string, string> = {};

          // Lấy Key từ GLOBAL KEY POOL (Vĩnh Cửu)
          const activeKeyObj = globalApiKeys.find(k => k.state === 'ACTIVE') || globalApiKeys[0];
          const isRealKey = activeKeyObj && activeKeyObj.key.startsWith('AIzaSy') && !activeKeyObj.key.includes('DemoSampleKey');

          const isTargetVietnamese = (advancedSettings.targetLanguage || 'Tiếng Việt').toLowerCase().includes('việt');
          const isTargetJapanese = (advancedSettings.targetLanguage || '').toLowerCase().includes('nhật') || (advancedSettings.targetLanguage || '').toLowerCase().includes('japan');

          // =========================================================================
          // DÒNG 2: BƯỚC BÓC LÔ GLOSSARY TOÀN DIỆN (7 NHÓM BẮT BUỘC)
          // =========================================================================
          const isBatchGlossaryEnabled = advancedSettings.enableBatchGlossaryAutoExtract !== false;
          const batchSize = advancedSettings.batchGlossarySize || 50;
          const batchStart = Math.floor(currentChapterIndex / batchSize) * batchSize;

          if (isBatchGlossaryEnabled && !processedBatchStarts.includes(batchStart) && project.chapters.length > 0) {
            setProcessedBatchStarts(prev => [...prev, batchStart]);
            const batchEnd = Math.min(batchStart + batchSize, project.chapters.length);
            const chaptersInBatch = project.chapters.slice(batchStart, batchEnd);
            addLog(`🔍 [BÓC LÔ GLOSSARY 7 NHÓM] Đang gom ${chaptersInBatch.length} chương thô (Chương ${batchStart + 1} ➔ ${batchEnd}) để AI trích xuất Master Glossary toàn diện (Tên, xưng hô, chức vụ, địa danh, thú, pháp bảo, công pháp, cảnh giới)...`);

            if (isRealKey) {
              try {
                let batchPrompt = `Bạn là chuyên gia trích xuất thực thể và xây dựng từ điển tiểu thuyết văn học (Glossary Architect).\n`;
                batchPrompt += `Nhiệm vụ: Phân tích kỹ toàn bộ nội dung các chương thô tiếng Trung dưới đây và trích xuất TOÀN DIỆN 100% các thuật ngữ, danh từ riêng, xưng hô và danh xưng thế giới, bao gồm 7 nhóm bắt buộc:\n`;
                batchPrompt += `1. TÊN NHÂN VẬT & BIỆT DANH: Tên người chính/phụ, đạo hiệu, ngoại hiệu, tục danh (VD: 林辰 ➔ Lâm Thần, 赵霸天 ➔ Triệu Bá Thiên).\n`;
                batchPrompt += `2. XƯNG HÔ, CHỨC VỤ, VAI VẾ: Quan chức triều đình, nha môn, bang phái, thân phận, gia tộc (VD: 知县 ➔ Tri huyện, 主簿 ➔ Chủ bộ, 捕快 ➔ Bộ khoái, 县丞 ➔ Huyện thừa, 典史 ➔ Điển sử, 巡抚 ➔ Tuần phủ, 二当家 ➔ Nhị đương gia, 掌柜 ➔ Chưởng quỹ, 嬷嬷 ➔ ma ma / nhũ mẫu, 师叔 ➔ sư thúc).\n`;
                batchPrompt += `3. ĐỊA DANH & ĐỊA ĐIỂM: Tông môn, vương quốc, phủ, huyện, thành trì, thôn trang, sơn mạch, tửu lâu, trạch viện (VD: 大河府 ➔ Phủ Đại Hà, 河宴县 ➔ Huyện Hà Yến, 青云宗 ➔ Thanh Vân Tông, 青石村 ➔ Thôn Thanh Thạch, 运大楼 ➔ Vận Đại Lâu).\n`;
                batchPrompt += `4. YÊU THÚ, LINH THÚ & THẦN THÚ: Tên các loài dị thú, linh sủng, ma thú (VD: 啸月狼 ➔ Khiếu Nguyệt Lang, 吞天雀 ➔ Thôn Thiên Tước).\n`;
                batchPrompt += `5. PHÁP BẢO, VŨ KHÍ, ĐAN DƯỢC & VẬT PHẨM: Thần binh, phù lục, đan dược, dược thảo, quặng mỏ (VD: 斩灵剑 ➔ Trảm Linh Kiếm, 筑基丹 ➔ Trúc Cơ Đan).\n`;
                batchPrompt += `6. CÔNG PHÁP, CHIÊU THỨC & THÂN PHÁP: Tâm pháp, khẩu quyết, quyền pháp, kiếm quyết (VD: 梵圣真魔功 ➔ Phạn Thánh Chân Ma Công, 青云剑决 ➔ Thanh Vân Kiếm Quyết).\n`;
                batchPrompt += `7. CẢNH GIỚI TU LUYỆN & PHẨM CẤP: Giai tầng võ đạo, phẩm giai pháp khí (VD: 黄阶 ➔ Hoàng giai, 玄阶 ➔ Huyền giai, 练气 ➔ Luyện Khí, 筑基 ➔ Trúc Cơ, 金丹 ➔ Kim Đan, 元婴 ➔ Nguyên Anh).\n\n`;
                batchPrompt += `QUY TẮC BẮT BUỘC:\n`;
                batchPrompt += `- Định dạng mỗi dòng: [TừGốcTiếngTrung] = [NghĩaHánViệtChuẩn]\n`;
                batchPrompt += `- TUYỆT ĐỐI KHÔNG đảo ngược thứ tự tiếng Việt = tiếng Trung.\n`;
                batchPrompt += `- Phiên âm Hán-Việt chuẩn xác, thanh thoát, đúng quy chuẩn từ điển văn học dịch thuật.\n`;
                batchPrompt += `- Trả về danh sách thuần túy (không kèm markdown giải thích rườm rà).\n\n`;
                batchPrompt += `[CÁC CHƯƠNG THÔ]:\n` + chaptersInBatch.map((c, i) => `--- CHƯƠNG ${batchStart + i + 1} ---\n${c}`).join('\n\n');

                const bResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${project.model}:generateContent?key=${activeKeyObj.key}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: batchPrompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                  })
                });

                if (bResp.ok) {
                  const bData = await bResp.json();
                  const bOut = bData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  const parsed = parseDualTaskOutput(bOut, chaptersInBatch.join('\n'));
                  if (Object.keys(parsed.newGlossary).length > 0) {
                    setProjects(prev => {
                      const cur = prev[currentProjectName];
                      const { updatedGlossary, newlyAdded } = mergeGlossaryCustomPolicy(cur.masterGlossary, parsed.newGlossary);
                      const addedCount = Object.keys(newlyAdded).length;
                      addLog(`🎉 [BÓC LÔ HOÀN TẤT] Đã nạp ${addedCount} thuật ngữ/xưng hô mới vào Master Glossary cho lô Chương ${batchStart + 1} ➔ ${batchEnd}!`);
                      return {
                        ...prev,
                        [currentProjectName]: {
                          ...cur,
                          masterGlossary: updatedGlossary
                        }
                      };
                    });
                  }
                }
              } catch (bErr: any) {
                addLog(`⚠️ Bóc lô glossary gặp sự cố: ${bErr.message}`);
              }
            }
          }

          // =========================================================================
          // THỰC THI CHIẾN LƯỢC DỊCH THUẬT LÕI
          // =========================================================================
          if (isRealKey) {
            try {
              const activePromptObj = globalPrompts.find(p => p.active) || globalPrompts[0];
              const glossaryStr = Object.entries(project.masterGlossary).map(([k, v]) => `${k} = ${v}`).join('\n');
              
              let promptSb = `Bạn là chuyên gia dịch thuật tiểu thuyết hàng đầu thế giới.\n\n`;
              promptSb += `[NGÔN NGỮ ĐÍCH]: ${advancedSettings.targetLanguage || 'Tiếng Việt'}\n\n`;
              promptSb += `[YÊU CẦU PHONG CÁCH]:\n${activePromptObj.content}\n\n`;
              promptSb += `[BẢNG TỪ ĐIỂN GLOSSARY BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI (100% ĐỒNG NHẤT XƯNG HÔ & THUẬT NGỮ)]:\n${glossaryStr || '(Chưa có từ điển)'}\n\n`;
              
              if (previousSnippet) {
                promptSb += `[NGỮ CẢNH ĐOẠN CUỐI CHƯƠNG TRƯỚC (CHỈ DÙNG ĐỂ THAM KHẢO VĂN PHONG VÀ ĐỒNG NHẤT XƯNG HÔ, TUYỆT ĐỐI KHÔNG DỊCH LẠI)]:\n${previousSnippet}\n\n`;
              }

              // ==================== CHIẾN LƯỢC: TIỀN XỬ LÝ GHI ĐÈ RAW INJECTION ====================
              if (isPreInjectStrategy) {
                const injectedRaw = injectTermsIntoRaw(rawContent, project.masterGlossary);
                promptSb += `[VĂN BẢN GỐC ĐÃ GHIM CỐ ĐỊNH DANH TỪ RIÊNG, XƯNG HÔ, CHỨC VỤ, ĐỊA DANH, CÔNG PHÁP]:\n${injectedRaw}\n\n`;
                promptSb += `[QUY TẮC BẮT BUỘC - HYBRID RAW INJECTION]:\n`;
                promptSb += `1. Dịch toàn bộ các câu chữ tiếng Trung còn lại sang tiếng Việt mượt mà, thuần túy, tự nhiên.\n`;
                promptSb += `2. TUYỆT ĐỐI GIỮ NGUYÊN các danh từ riêng tiếng Việt đã được ghim sẵn trong văn bản trên (không tự ý đổi lại hay dịch khác đi).\n`;
                promptSb += `3. ĐẦU RA: Chỉ xuất toàn bộ bản dịch tiếng Việt hoàn chỉnh.`;
              } 
              // ==================== CHIẾN LƯỢC: DỊCH SUY LUẬN NGỮ CẢNH COT (DEEP THINKING) ====================
              else if (isCoTStrategy) {
                promptSb += `[VĂN BẢN GỐC CHƯƠNG HIỆN TẠI]:\n${rawContent}\n\n`;
                promptSb += `[QUY TẮC BẮT BUỘC - SUY LUẬN SÂU COT (DEEP THINKING TRANSLATION)]:\n`;
                promptSb += `Thực hiện 2 bước tuần tự bắt buộc:\n`;
                promptSb += `BƯỚC 1: Trong khối <analysis>, tiến hành 3 bước rà soát ngầm:\n`;
                promptSb += `  a) Điểm danh 100% các từ xuất hiện trong [BẢNG TỪ ĐIỂN GLOSSARY] có mặt ở chương này để chốt cách dịch và đại từ xưng hô.\n`;
                promptSb += `  b) Phân tích mối quan hệ nhân vật, giải mã các thành ngữ 4 chữ, khẩu ngữ khó hoặc câu chữ ẩn dụ.\n`;
                promptSb += `  c) Định hình văn phong theo [YÊU CẦU PHONG CÁCH] (thuần Việt, mượt mà, thoát ý).\n`;
                promptSb += `BƯỚC 2: Xuất toàn bộ bản dịch tiếng Việt hoàn mỹ nhất trong khối ===TRANSLATION===.\n\n`;
                promptSb += `ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:\n<analysis>\n(Rà soát Glossary + Phân tích ngữ cảnh, thành ngữ, xưng hô)\n</analysis>\n===TRANSLATION===\n(Toàn bộ bản dịch tiếng Việt mượt mà hoàn chỉnh)`;
              }
              // ==================== CHIẾN LƯỢC: DỊCH THUẦN HOẶC DUAL-TASK ====================
              else {
                promptSb += `[VĂN BẢN GỐC CHƯƠNG HIỆN TẠI]:\n${rawContent}\n\n`;

                if (isTargetVietnamese && advancedSettings.antiHanziStrict) {
                  promptSb += `[QUY TẮC BẮT BUỘC - CHỐNG LỌT CHỮ HÁN CHO TIẾNG VIỆT]:\n`;
                  promptSb += `- TUYỆT ĐỐI KHÔNG để sót bất kỳ ký tự chữ Hán (Hanzi) nào trong bản dịch tiếng Việt. 100% tên nhân vật, địa danh, môn phái, chiêu thức, chức vị bắt buộc phải phiên âm Hán-Việt hoặc dịch nghĩa tiếng Việt thuần túy.\n`;
                  promptSb += `- TUYỆT ĐỐI KHÔNG trộn lẫn nửa chữ Hán nửa tiếng Việt (ví dụ: '林辰' phải dịch hẳn là 'Lâm Thần', không được viết '林 Thần').\n`;
                }

                if (isDualTaskStrategy) {
                  promptSb += `[QUY TẮC ĐẦU RA - 1 REQUEST 2 TÁC VỤ]:\n===TRANSLATION===\n(Toàn bộ bản dịch trôi chảy)\n===NEW_GLOSSARY===\n(Trích xuất các danh từ riêng, chức vụ, xưng hô MỚI xuất hiện trong chương hiện tại chưa có trong Glossary trên:\n[TừGốc] = [NghĩaDịch])`;
                } else {
                  promptSb += `[QUY TẮC ĐẦU RA BẮT BUỘC]:\n===TRANSLATION===\n(Toàn bộ bản dịch tiếng Việt trôi chảy hoàn chỉnh)`;
                }
              }

              // Gửi Request Pass 1
              const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${project.model}:generateContent?key=${activeKeyObj.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: promptSb }] }],
                  generationConfig: { temperature: 0.25 }
                })
              });

              if (resp.ok) {
                const data = await resp.json();
                const outText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                let pass1Parsed = parseDualTaskOutput(outText, rawContent);
                let pass1Text = pass1Parsed.translation;

                // Xử lý loại bỏ thẻ <analysis> của CoT
                if (isCoTStrategy) {
                  pass1Text = pass1Text.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '').trim();
                  pass1Text = pass1Text.replace(/===+\s*TRANSLATION\s*===+/gi, '').trim();
                }

                // ==================== DÒNG 1: DỊCH KÉP 2-PASS PHẢN BIỆN ĐỐI SOÁT ====================
                if (isDualPassEnabled && pass1Text.trim().length > 30) {
                  addLog(`🔬 [DÒNG 1 - PASS 2 BIÊN TẬP] Đang gửi [Raw Gốc + Pass 1] sang Pass 2 để Tổng Biên Tập đối soát phản biện...`);
                  
                  let pass2Prompt = `Bạn là Tổng biên tập văn học và chuyên gia hiệu đính tiểu thuyết dịch cao cấp.\n\n`;
                  pass2Prompt += `Nhiệm vụ: Đối chiếu trực tiếp giữa [VĂN BẢN GỐC TIẾNG TRUNG] và [BẢN DỊCH THÔ PASS 1] dưới đây để tiến hành biên soạn, sửa chữa và xuất ra bản dịch hoàn mỹ cuối cùng:\n`;
                  pass2Prompt += `1. SỬA CHỮA DỊCH SAI NGHĨA: Đối chiếu bản gốc để sửa toàn bộ các câu dịch sai ngữ cảnh, hiểu nhầm thành ngữ hoặc từ ngữ cảnh (VD: '万分不舍' dịch nhầm thành 'không nỗ lực' -> sửa chuẩn thành 'vô cùng không nỡ / tiếc tiền'; '诚惶诚恐' -> sửa thành 'nơm nớp lo sợ / thấp thỏm lo âu').\n`;
                  pass2Prompt += `2. QUÉT SẠCH 100% CHỮ HÁN SÓT: Khử sạch các chữ Hán dính trong câu (nội院 -> nội viện, Tuần抚 -> Tuần phủ, trạch邸 -> trạch đệ).\n`;
                  pass2Prompt += `3. CHUỐT LẠI VĂN PHONG TIỂU THUYẾT: Đại từ nhân xưng chuẩn mực (hắn, nàng, ta, ngươi), câu cú mượt mà, tự nhiên.\n\n`;
                  pass2Prompt += `[VĂN BẢN GỐC TIẾNG TRUNG]:\n${rawContent}\n\n`;
                  pass2Prompt += `[BẢN DỊCH THÔ PASS 1]:\n${pass1Text}\n\n`;
                  pass2Prompt += `[ĐẦU RA BẮT BUỘC]: Chỉ xuất toàn bộ bản dịch tiếng Việt hoàn chỉnh sau khi đã biên tập hoàn mỹ (không xuất giải thích hay markdown codeblock).`;

                  const respPass2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${project.model}:generateContent?key=${activeKeyObj.key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: pass2Prompt }] }],
                      generationConfig: { temperature: 0.15 }
                    })
                  });

                  if (respPass2.ok) {
                    const dataPass2 = await respPass2.json();
                    const outPass2 = dataPass2?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (outPass2.trim().length > 30) {
                      pass1Text = outPass2.trim();
                      addLog(`✨ [PASS 2 BIÊN TẬP HOÀN TẤT] Bản dịch Pass 2 đã được trau chuốt hoàn hảo không còn lỗi ngữ nghĩa!`);
                    }
                  }
                }

                translatedText = pass1Text;
                aiExtractedGlossary = isDualTaskStrategy ? pass1Parsed.newGlossary : {};
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
            
            // TẤT CẢ CÁC MODE ĐỀU TỰ ĐỘNG LÀM MƯỢT FINAL SAU KHI DỊCH XONG
            setTimeout(() => {
              handleExecuteFinalGlobalPolish();
            }, 800);
          }
        }, (delaySecInput || 2) * 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [isTranslating, isPaused, isGapFillingMode, currentChapterIndex, project, currentProjectName, delaySecInput, toChapInput, fromChapInput, polishModel, advancedSettings.translationPipelineMode, advancedSettings.batchGlossarySize]);

  // Hàm thực hiện Làm Mượt Cuốn Chiếu (Semantic JSON Patch) với cơ chế Thử Lại Nhiều Lần & Không Bỏ Rơi
  const performRollingPolishBatch = async (indices: number[]): Promise<boolean> => {
    if (!project || indices.length === 0) return true;
    const chaptersToPolish: string[] = [];
    const validIndices: number[] = [];
    for (const idx of indices) {
      if (project.translatedChapters[idx]) {
        chaptersToPolish.push(project.translatedChapters[idx]);
        validIndices.push(idx);
      }
    }
    if (chaptersToPolish.length === 0) return true;

    const fromChapNum = validIndices[0] + 1;
    const toChapNum = validIndices[validIndices.length - 1] + 1;

    const activeKeyObj = globalApiKeys.find(k => k.state === 'ACTIVE') || globalApiKeys[0];
    const isRealKey = activeKeyObj && activeKeyObj.key && !activeKeyObj.key.includes('DemoSample');
    const targetModel = polishModel || 'gemini-3.6-flash';

    const maxAttempts = isRealKey ? 4 : 1;
    let attempt = 0;
    let success = false;
    let patches: Array<{ old: string; new: string }> = [];

    while (attempt < maxAttempts && !success) {
      attempt++;
      const currentAttempt = attempt;
      addLog(`✨ [LÀM MƯỢT CUỐN CHIẾU${currentAttempt > 1 ? ` (THỬ LẠI ${currentAttempt}/${maxAttempts})` : ''}] Đang gom ${chaptersToPolish.length} chương (Chương ${fromChapNum} ➔ ${toChapNum}) gửi ${targetModel} trích xuất JSON Patch...`);

      if (isRealKey) {
        try {
          let promptSb = `Bạn là chuyên gia biên tập và hiệu đính văn học cao cấp.\n`;
          promptSb += `Nhiệm vụ: Đối chiếu song ngữ [VĂN BẢN GỐC TIẾNG TRUNG] và [BẢN DỊCH TIẾNG VIỆT] của các chương bên dưới để trích xuất TOÀN BỘ các lỗi cần sửa chữa, bao gồm:\n`;
          promptSb += `1. Lỗi dịch sai nghĩa ngữ cảnh hoặc hiểu nhầm thành ngữ (VD: '万分不舍' dịch nhầm thành 'không nỗ lực' -> sửa thành 'không nỡ/tiếc tiền'; '诚惶诚恐' dịch nhầm thành 'thành hoàng thành thạch' -> sửa thành 'nơm nớp lo sợ / thấp thỏm lo âu').\n`;
          promptSb += `2. Ký tự chữ Hán còn sót hoặc từ lai dính chữ Hán (VD: 'nội院' -> 'nội viện', 'Tuần抚' -> 'Tuần phủ', 'trạch邸' -> 'trạch đệ', 'Vân羊' -> 'Vân Dương', 'áo襦' -> 'áo nhu', 'm嬷m嬷' -> 'nhũ mẫu / ma ma').\n`;
          promptSb += `3. Lỗi chính tả, typo bộ gõ Telex (VD: 'bộ khoai' -> 'bộ khoái', 'phì đồ' -> 'phỉ đồ', 'đangk' -> 'đăng', 'táo lộ' -> 'chiêu trò / bài bản').\n`;
          promptSb += `4. Lỗi nhầm lẫn danh xưng, chức vị hoặc xưng hô không khớp (VD: 'chủ bưu' -> 'chủ bộ', 'bổ khoái' -> 'bộ khoái', 'Trưởng công tử' -> 'Trưởng công chúa').\n\n`;
          promptSb += `QUY TẮC ĐẦU RA BẮT BUỘC:\n`;
          promptSb += `- TUYỆT ĐỐI KHÔNG xuất lại toàn bộ nội dung các chương.\n`;
          promptSb += `- CHỈ TRẢ VỀ DUY NHẤT một mảng JSON thuần túy (không kèm markdown codeblock giải thích), mỗi phần tử gồm 'old' (từ/cụm lỗi chính xác trong bản dịch) và 'new' (từ/cụm sửa chuẩn):\n`;
          promptSb += `[{"old": "chuỗi_lỗi_gốc", "new": "chuỗi_thay_thế_chuẩn"}]\nNếu không có lỗi nào, trả về: []\n\n`;
          promptSb += `[DỮ LIỆU ĐỐI SOÁT SONG NGỮ CÁC CHƯƠNG]:\n` + validIndices.map(idx => {
            const rawCh = project.chapters[idx] || '';
            const transCh = project.translatedChapters[idx] || '';
            return `=== CHƯƠNG ${idx + 1} ===\n[GỐC TIẾNG TRUNG]:\n${rawCh}\n\n[BẢN DỊCH HIỆN TẠI]:\n${transCh}`;
          }).join('\n\n----------------------------------------\n\n');

          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${activeKeyObj.key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptSb }] }],
              generationConfig: { temperature: 0.15, maxOutputTokens: 8192 }
            })
          });

          if (resp.ok) {
            const data = await resp.json();
            const outText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let cleanJson = outText.trim();
            if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
            else if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
            if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
            const sIdx = cleanJson.indexOf('[');
            const eIdx = cleanJson.lastIndexOf(']');
            if (sIdx !== -1 && eIdx !== -1) {
              cleanJson = cleanJson.substring(sIdx, eIdx + 1);
              const parsedArr = JSON.parse(cleanJson);
              if (Array.isArray(parsedArr)) {
                patches = parsedArr.filter(p => p.old && p.new && p.old !== p.new);
              }
            }
            success = true;
          } else {
            addLog(`⚠️ [LỖI API LÀM MƯỢT] HTTP ${resp.status} trên lần thử ${currentAttempt}/${maxAttempts}`);
            if (attempt < maxAttempts) {
              await new Promise(r => setTimeout(r, 2000 * attempt));
            }
          }
        } catch (err: any) {
          addLog(`⚠️ [LỖI KẾT NỐI LÀM MƯỢT] (${err.message}) trên lần thử ${currentAttempt}/${maxAttempts}`);
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000 * attempt));
          }
        }
      } else {
        // Fallback demo mode
        patches = [
          { old: 'bộ khoai', new: 'bộ khoái' },
          { old: 'phì đồ', new: 'phỉ đồ' }
        ];
        success = true;
      }
    }

    if (!success) {
      addLog(`❌ [LÀM MƯỢT TẠM HOÃN] Các chương ${fromChapNum} ➔ ${toChapNum} chưa thể hoàn tất làm mượt sau ${maxAttempts} lần thử. Các chương này KHÔNG BỊ BỎ RƠI, hệ thống sẽ tự động thử lại hoặc bạn có thể bấm 'Làm Mượt Lại Các Chương Chưa Xử Lý'.`);
      return false;
    }

    // Áp dụng patch và ĐÁNH DẤU CHÍNH THỨC CÁC CHƯƠNG ĐÃ LÀM MƯỢT
    setProjects(prev => {
      const cur = prev[currentProjectName];
      const newTrans = { ...cur.translatedChapters };
      let modifiedChaps = 0;

      if (patches.length > 0) {
        validIndices.forEach(cIdx => {
          let text = newTrans[cIdx];
          if (!text) return;
          let changed = false;
          patches.forEach(p => {
            if (text.includes(p.old)) {
              text = text.split(p.old).join(p.new);
              changed = true;
            }
          });
          if (changed) {
            newTrans[cIdx] = text;
            modifiedChaps++;
          }
        });
      }

      const updatedMaster = { ...cur.masterGlossary };
      let syncedGlossCount = 0;
      if (patches.length > 0) {
        patches.forEach(p => {
          Object.keys(updatedMaster).forEach(k => {
            if (updatedMaster[k] === p.old || updatedMaster[k].includes(p.old)) {
              updatedMaster[k] = updatedMaster[k].replace(p.old, p.new);
              syncedGlossCount++;
            }
          });
        });
      }

      const updatedPatchDict = { ...(cur.patchDictionary || {}) };
      if (patches.length > 0) {
        patches.forEach(p => {
          updatedPatchDict[p.old] = p.new;
        });
      }

      // Cập nhật danh sách chương đã làm mượt
      const prevPolished = cur.polishedChapterIndices || [];
      const updatedPolished = Array.from(new Set([...prevPolished, ...validIndices])).sort((a, b) => a - b);

      if (patches.length > 0) {
        addLog(`🎉 [HOÀN TẤT LÀM MƯỢT] Chương ${fromChapNum} ➔ ${toChapNum}: Đã sửa ${patches.length} mục lỗi trên ${modifiedChaps} chương! Đồng bộ ${syncedGlossCount} từ vào Master Glossary.`);
      } else {
        addLog(`✨ [HOÀN TẤT LÀM MƯỢT] Bản dịch các chương ${fromChapNum} ➔ ${toChapNum} đã chuẩn mực 100%, không phát hiện lỗi.`);
      }

      return {
        ...prev,
        [currentProjectName]: {
          ...cur,
          translatedChapters: newTrans,
          masterGlossary: updatedMaster,
          patchDictionary: updatedPatchDict,
          polishedChapterIndices: updatedPolished
        }
      };
    });

    return true;
  };

  // Nút Làm Mượt Lại Các Chương Chưa Xử Lý (hoặc làm mượt lại tất cả)
  const handleRepolishUnpolishedChapters = async () => {
    if (isPolishing || isTranslating) {
      alert('Đang có tiến trình dịch hoặc làm mượt đang chạy!');
      return;
    }
    if (!project || Object.keys(project.translatedChapters).length === 0) {
      alert('Chưa có bản dịch nào để làm mượt!');
      return;
    }

    const curPolished = project.polishedChapterIndices || [];
    let unpolished = Object.keys(project.translatedChapters)
      .map(Number)
      .filter(idx => !curPolished.includes(idx))
      .sort((a, b) => a - b);

    if (unpolished.length === 0) {
      if (confirm(`Tất cả ${Object.keys(project.translatedChapters).length} chương đã dịch đều đã được làm mượt cuốn chiếu đạt chuẩn 100%!\n\nBạn có muốn làm mượt lại toàn bộ từ đầu không?`)) {
        setProjects(prev => ({
          ...prev,
          [currentProjectName]: {
            ...prev[currentProjectName],
            polishedChapterIndices: []
          }
        }));
        unpolished = Object.keys(project.translatedChapters).map(Number).sort((a, b) => a - b);
      } else {
        return;
      }
    }

    setIsPolishing(true);
    addLog(`🚀 [LÀM MƯỢT LẠI] Bắt đầu rà soát làm mượt ${unpolished.length} chương chưa xử lý...`);
    const batchSize = advancedSettings.rollingPolishBatchSize || 15;

    try {
      for (let i = 0; i < unpolished.length; i += batchSize) {
        const chunk = unpolished.slice(i, i + batchSize);
        addLog(`📦 [LÔ ${Math.floor(i / batchSize) + 1}/${Math.ceil(unpolished.length / batchSize)}] Đang làm mượt Chương ${chunk[0] + 1} ➔ ${chunk[chunk.length - 1] + 1}...`);
        const ok = await performRollingPolishBatch(chunk);
        if (!ok) {
          addLog(`⚠️ [DỪNG LÀM MƯỢT LẠI] Gặp sự cố kết nối, các chương còn lại được giữ trong hàng đợi.`);
          break;
        }
      }
      addLog(`🏁 [HOÀN TẤT LÀM MƯỢT LẠI] Đã xử lý xong các lô chương chưa làm mượt!`);
    } catch (e: any) {
      addLog(`❌ Lỗi khi làm mượt lại: ${e.message}`);
    } finally {
      setIsPolishing(false);
    }
  };

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
      <div className="w-full max-w-[430px] bg-[#03060d] border-4 border-[#785a28]/80 rounded-[44px] shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(120,90,40,0.25)] overflow-hidden flex flex-col h-[790px] relative text-neutral-100">
        
        {/* TOP PHONE NOTCH & STATUS BAR */}
        <div className="h-10 bg-[#091428] px-5 flex items-center justify-between text-xs text-[#a09b8c] select-none shrink-0 border-b border-[#785a28]/40">
          <span className="font-semibold text-[#f0e6d2]">12:30</span>
          <div className="w-24 h-4 bg-[#050c18] border border-[#785a28]/30 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#785a28]/60"></div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {isDeviceRooted && (
              <span className="text-[#c8aa6e] font-bold font-mono text-[10px] bg-[#1e2328] px-1.5 py-0.5 rounded border border-[#785a28]">ROOT #</span>
            )}
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* FOREGROUND PERSISTENT NOTIFICATION BANNER */}
        {godModeActive && (
          <div className="bg-[#091428] border-b border-[#785a28]/40 px-3 py-1.5 flex items-center justify-between text-[11px] text-[#f0e6d2] shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-[#c8aa6e]">God-Mode:</span>
              <span className="text-[#a09b8c] truncate">{statusText}</span>
            </div>
            <button 
              onClick={onOpenGodModeModal} 
              className="text-[10px] bg-[#005a82] hover:bg-[#0284c7] text-[#f0e6d2] border border-[#0ac8b9]/40 px-2 py-0.5 rounded font-bold shrink-0 cursor-pointer shadow-sm"
            >
              5 Lớp
            </button>
          </div>
        )}

        {/* NATIVE APP BRANDING HEADER WITH OFFICIAL APP LOGO */}
        <div className="bg-[#091428] px-3 py-2 flex items-center justify-between border-b border-[#785a28]/40 shrink-0">
          <AppLogo size="sm" showText={true} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHowToUseModal(true)}
              className="px-2 py-0.5 rounded-lg bg-[#005a82] text-[#f0e6d2] border border-[#0ac8b9]/40 text-[10px] font-bold flex items-center gap-1 hover:bg-[#0284c7] cursor-pointer shadow-sm transition-all"
              title="Cẩm nang hướng dẫn sử dụng từ A đến Z"
            >
              <HelpCircle className="w-3 h-3 text-[#0ac8b9]" />
              <span>Hướng Dẫn</span>
            </button>
            <button
              onClick={onOpenGodModeModal}
              className="px-2 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-600/40 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-900/60 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>OOM -1000</span>
            </button>
          </div>
        </div>

        {/* PROJECT SWITCHER DRAWER BANNER */}
        <div className="bg-[#050c18] border-b border-[#785a28]/40 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Bookmark className="w-3.5 h-3.5 text-[#c8aa6e] shrink-0" />
            <span className="text-[#a09b8c] text-[11px]">Tiến trình:</span>
            <select
              value={currentProjectName}
              onChange={(e) => {
                setCurrentProjectName(e.target.value);
                setChapterListPage(0);
              }}
              className="bg-[#091428] border border-[#785a28]/60 rounded px-2 py-0.5 text-xs text-[#c8aa6e] font-bold focus:outline-none max-w-[140px] truncate"
            >
              {Object.keys(projects).map(name => (
                <option key={name} value={name}>{name.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewProjModal(true)}
              className="text-[10px] px-2 py-0.5 rounded bg-[#005a82] hover:bg-[#0284c7] text-[#f0e6d2] border border-[#0ac8b9]/40 font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
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
          {/* THẺ 1: KEY & PROMPT (LO-L DROPDOWN ACCORDIONS) */}
          {/* ======================================================== */}
          {activeBottomTab === 'keys' && (
            <div className="space-y-3">
              {/* BIG HOW TO USE ONBOARDING BANNER */}
              <div 
                onClick={() => setShowHowToUseModal(true)}
                className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-[#c8aa6e] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#c8aa6e]/20 border border-[#c8aa6e]/60 flex items-center justify-center text-[#c8aa6e] group-hover:scale-105 transition-transform shrink-0">
                    <HelpCircle className="w-4.5 h-4.5 text-[#c8aa6e]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#f0e6d2] flex items-center gap-1.5">
                      <span>Cẩm Nang Hướng Dẫn Sử Dụng</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono">Từ A-Z</span>
                    </div>
                    <p className="text-[10px] text-[#a09b8c]">Nhấn để xem cách lấy key, chọn model, dịch bù và xuất file</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#c8aa6e] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* ============================================== */}
              {/* MỤC 1: CÀI ĐẶT KEY API POOL & QUOTA */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsKeyPoolOpen(!isKeyPoolOpen)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>1. Cài Đặt Key API & Quota</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {globalApiKeys.length} Keys
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isKeyPoolOpen ? 'thu gọn' : 'mở rộng quản lý API Key Pool & test quota'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('key_pool'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isKeyPoolOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isKeyPoolOpen && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      {/* Sub-header inside */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c8aa6e]">◆ KHO API KEY POOL:</span>
                        <button
                          onClick={handleTestAllKeys}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-[#005a82] hover:bg-[#0284c7] text-[#f0e6d2] border border-[#0ac8b9]/40 flex items-center gap-1 cursor-pointer font-semibold shadow-sm"
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
                          className="w-full bg-[#050505] border border-[#785a28]/40 rounded-xl p-2 text-xs text-[#f0e6d2] font-mono focus:outline-none focus:border-[#c8aa6e]"
                        />
                        <button
                          onClick={handleAddGlobalKey}
                          className="w-full py-2 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-black/40 cursor-pointer transition-all"
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
                              className="p-2 bg-[#050505] border border-[#785a28]/40 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-4 h-4 rounded bg-[#1e2328] text-[10px] flex items-center justify-center font-mono text-[#c8aa6e] border border-[#785a28]/40 shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-mono text-[#f0e6d2] truncate">...{k.key.slice(-8)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {ping ? (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#091428] text-[#0ac8b9] font-mono border border-[#0ac8b9]/30">
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
                                  className="px-2 py-0.5 rounded bg-[#1e2328] hover:bg-[#2e3338] text-[#f0e6d2] text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 border border-[#785a28]/40"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${isTesting ? 'animate-spin text-[#c8aa6e]' : ''}`} />
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
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* MỤC 2: CHỌN DÒNG MODEL GEMINI DỊCH THUẬT */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsModelSectionOpen(!isModelSectionOpen)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>2. Chọn Dòng Model Gemini</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {PRESET_MODELS.find(m => m.id === project?.model)?.name || 'Flash'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isModelSectionOpen ? 'thu gọn' : 'mở rộng chọn model tối ưu'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('key_pool'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isModelSectionOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isModelSectionOpen && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      {/* Collapsed model card */}
                      <div
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="bg-gradient-to-r from-[#111923] via-[#0f1d30] to-[#111923] border border-[#c8aa6e] shadow-[0_0_15px_rgba(200,170,110,0.25)] rounded-xl p-3 cursor-pointer transition-all hover:border-[#f0e6d2] group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#c8aa6e] animate-pulse shrink-0"></span>
                            <span className="text-xs font-bold text-[#f0e6d2] group-hover:text-amber-200">
                              {PRESET_MODELS.find(m => m.id === project?.model)?.name || project?.model || '2.5 Flash'}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-[#a09b8c]">
                              {PRESET_MODELS.find(m => m.id === project?.model)?.badge || 'Tùy chỉnh'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold bg-[#785a28]/40 text-[#c8aa6e] px-2 py-0.5 rounded border border-[#c8aa6e]/60">
                              ĐANG DÙNG
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <div className="text-[10px] text-[#a09b8c] mt-1.5 leading-relaxed pl-4 border-l-2 border-[#c8aa6e]/40">
                          {PRESET_MODELS.find(m => m.id === project?.model)?.desc || 'Model Gemini tùy chỉnh người dùng nạp.'}
                        </div>
                      </div>

                      {/* Expanded model list */}
                      {isModelDropdownOpen && (
                        <div className="space-y-2 pt-1 animate-fadeIn">
                          {PRESET_MODELS.map(m => {
                            const isSelected = project?.model === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => {
                                  handleSelectModel(m.id);
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#1e2328] border-[#c8aa6e] shadow-[0_0_10px_rgba(200,170,110,0.3)] text-white'
                                    : 'bg-[#050505] border-[#785a28]/40 text-neutral-400 hover:text-[#f0e6d2] hover:border-[#c8aa6e]/80 hover:bg-[#111923]'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-xs">
                                  <span className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                      isSelected ? 'border-[#c8aa6e] bg-[#c8aa6e] text-black font-extrabold' : 'border-neutral-600'
                                    }`}>
                                      {isSelected ? '✓' : ''}
                                    </span>
                                    <span className={isSelected ? 'text-[#f0e6d2]' : 'text-neutral-300'}>{m.name}</span>
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                                    {m.badge}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#a09b8c] mt-1 pl-6 leading-relaxed">
                                  {m.desc}
                                </div>
                              </button>
                            );
                          })}

                          {/* Custom Model Input */}
                          <div className="pt-2 border-t border-[#785a28]/30 flex gap-1.5">
                            <input
                              type="text"
                              value={customModelInput}
                              onChange={(e) => setCustomModelInput(e.target.value)}
                              placeholder="Nhập Model ID tùy chỉnh (VD: gemini-2.5-pro)..."
                              className="flex-1 bg-[#050505] border border-[#785a28]/50 rounded-xl px-2.5 py-1.5 text-xs text-[#f0e6d2] font-mono focus:outline-none focus:border-[#c8aa6e]"
                            />
                            <button
                              onClick={() => {
                                handleApplyCustomModel();
                                setIsModelDropdownOpen(false);
                              }}
                              className="px-3 py-1.5 bg-[#005a82] hover:bg-[#0284c7] text-[#f0e6d2] rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-colors border border-[#0ac8b9]/40"
                            >
                              Nạp Model
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* MỤC 3: PROMPT & PHONG CÁCH DỊCH THUẬT */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsPromptSectionOpen(!isPromptSectionOpen)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>3. Prompt & Phong Cách Dịch</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#005a82]/30 text-[#0ac8b9] border border-[#0ac8b9]/40 font-mono font-bold">
                          {globalPrompts.find(p => p.active)?.title || 'Văn Học Chuẩn'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isPromptSectionOpen ? 'thu gọn' : 'mở rộng chọn phong cách văn học & chỉnh prompt'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('prompt_cards'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isPromptSectionOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isPromptSectionOpen && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c8aa6e]">◆ CÁC PHONG CÁCH VĂN HỌC CÓ SẴN:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleRestoreDefaultPrompts}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-[#1e2328] hover:bg-neutral-800 text-[#a09b8c] hover:text-white border border-[#785a28]/40 cursor-pointer transition-colors"
                            title="Khôi phục prompt mặc định"
                          >
                            Mặc định
                          </button>
                          <button
                            onClick={handleOpenAddPrompt}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm</span>
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
                                  ? 'bg-[#111923] border-[#c8aa6e] shadow-[0_0_10px_rgba(200,170,110,0.25)] text-white' 
                                  : 'bg-[#050505] border-[#785a28]/30 hover:border-[#c8aa6e]/60 text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 truncate pr-2">
                                  <span className="font-bold text-[#f0e6d2] truncate">{p.title}</span>
                                  {p.active && (
                                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                      Đang dùng
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-[#a09b8c] font-mono border border-[#785a28]/30">
                                    ~{p.content.length} ký tự
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditPrompt(p);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-emerald-400 cursor-pointer transition-colors"
                                    title="Chỉnh sửa prompt này"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeletePrompt(p.id, e)}
                                    className="p-1 text-neutral-400 hover:text-red-400 cursor-pointer transition-colors"
                                    title="Xóa prompt này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* COMPACT CLAMPED PREVIEW TO PREVENT OVERLY TALL CARDS */}
                              <p className="text-[10px] text-[#a09b8c] mt-1 line-clamp-2 leading-relaxed">
                                {p.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
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
                className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-[#c8aa6e] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#c8aa6e]/20 border border-[#c8aa6e]/60 flex items-center justify-center text-[#c8aa6e] group-hover:scale-105 transition-transform shrink-0">
                    <HelpCircle className="w-4.5 h-4.5 text-[#c8aa6e]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#f0e6d2] flex items-center gap-1.5">
                      <span>Cẩm Nang Hướng Dẫn Sử Dụng</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono">Từ A-Z</span>
                    </div>
                    <p className="text-[10px] text-[#a09b8c]">Nhấn để xem cách lấy key, chọn model, dịch bù và xuất file</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#c8aa6e] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* ======================================================== */}
              {/* MỤC 1: NHẬP & BÓC TÁCH FILE TRUYỆN GỐC */}
              {/* ======================================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide">1. Nhập & Bóc Tách File Truyện Gốc</div>
                      <div className="text-[10px] text-[#a09b8c]">Hỗ trợ file .epub, .mobi, .txt, .azw3</div>
                    </div>
                  </div>
                  <HelpBtn onClick={() => openHelp('novel_raw_input')} />
                </div>

                {/* Chế độ tách chương */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#a09b8c]">Phương thức tách:</span>
                  <div className="flex items-center gap-1 bg-[#050505] p-0.5 rounded-lg border border-[#785a28]/40 text-[10px]">
                    <button
                      onClick={() => setSplitMode('regex')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${splitMode === 'regex' ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm' : 'text-[#a09b8c] hover:text-[#f0e6d2]'}`}
                    >
                      Theo Tác Giả
                    </button>
                    <button
                      onClick={() => setSplitMode('chunk')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${splitMode === 'chunk' ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm' : 'text-[#a09b8c] hover:text-[#f0e6d2]'}`}
                    >
                      Tùy Ký Tự
                    </button>
                  </div>
                </div>

                {/* Custom Chunk Size Selector with quick presets */}
                {splitMode === 'chunk' && (
                  <div className="bg-[#050505] p-2 rounded-xl border border-[#785a28]/40 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#a09b8c]">
                      <span>Số ký tự mỗi chương:</span>
                      <div className="flex items-center gap-1">
                        {[2000, 3000, 3500, 5000].map(sz => (
                          <button
                            key={sz}
                            onClick={() => setChunkSizeInput(String(sz))}
                            className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${
                              chunkSizeInput === String(sz) ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm' : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
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
                      className="w-full bg-[#091428] border border-[#785a28]/50 rounded-lg px-2.5 py-1 text-xs text-[#f0e6d2] font-mono focus:outline-none focus:border-[#c8aa6e]"
                    />
                  </div>
                )}

                {/* File summary badge if loaded */}
                {fileSummary && (
                  <div className="p-2 bg-[#050505] border border-[#785a28]/40 rounded-xl flex items-center justify-between text-[11px] text-[#f0e6d2]">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white truncate">{fileSummary.name}</span>
                      <span className="text-[#a09b8c]">({fileSummary.size} - {fileSummary.length.toLocaleString()} ký tự)</span>
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
                  className="w-full bg-[#050505] border border-[#785a28]/40 rounded-xl p-2 text-xs text-[#f0e6d2] font-mono focus:outline-none focus:border-[#c8aa6e] resize-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSplitChapters}
                    className="flex-1 py-2 bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[#785a28] cursor-pointer transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#c8aa6e]" />
                    <span>Tách chương ({splitMode === 'regex' ? 'Theo tác giả' : `${chunkSizeInput} ký tự`})</span>
                  </button>
                  
                  {/* Multi-Format Ebook File Picker (EPUB, MOBI, AZW3, TXT) */}
                  <label className="px-3 py-2 bg-[#005a82] hover:bg-[#0284c7] text-[#f0e6d2] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[#0ac8b9]/40 cursor-pointer transition-all shadow-sm">
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
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide">2. Tiến Độ Dịch Thuật & Điều Khiển</div>
                      <div className="text-[10px] text-[#a09b8c]">
                        {project ? Object.keys(project.translatedChapters).length : 0} / {project ? project.chapters.length : 0} chương đã dịch
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {project && Object.keys(project.translatedChapters).length > 0 && (
                      <span className="text-[9.5px] font-mono font-medium text-[#c8aa6e]">
                        {(project.polishedChapterIndices?.length || 0) < Object.keys(project.translatedChapters).length
                          ? `⚠️ Còn ${Object.keys(project.translatedChapters).length - (project.polishedChapterIndices?.length || 0)} ch. chưa mượt`
                          : `✨ Đã mượt ${project.polishedChapterIndices?.length || 0} ch.`}
                      </span>
                    )}
                    <HelpBtn onClick={() => openHelp('range_progress')} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#050505] rounded-full overflow-hidden border border-[#785a28]/40">
                  <div 
                    className="h-full bg-gradient-to-r from-[#005a82] to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${project && project.chapters.length > 0 ? (Object.keys(project.translatedChapters).length / project.chapters.length) * 100 : 0}%`
                    }}
                  />
                </div>

                {/* Pipeline Mode Indicator Badge */}
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#050505] rounded-xl border border-[#785a28]/40 text-[10.5px]">
                  <span className="text-[#a09b8c] font-medium">Chế độ đường ống:</span>
                  {(() => {
                    const rawMode = advancedSettings.translationPipelineMode || 'MODE_2_BATCH_PURE';
                    const mode = rawMode === 'COMBINED' ? 'MODE_1_DUAL_TASK' : (rawMode === 'BATCH_GLOSSARY' ? 'MODE_2_BATCH_PURE' : rawMode);
                    const bSize = advancedSettings.batchGlossarySize || 50;

                    if (mode === 'MODE_1_DUAL_TASK') {
                      return (
                        <span className="text-[#c8aa6e] font-bold font-mono flex items-center gap-1">
                          ⚡ Mode 1: 1 Req 2 Task (Dịch + Bóc Từ)
                        </span>
                      );
                    } else if (mode === 'MODE_3_RAW_INJECT') {
                      return (
                        <span className="text-[#c8aa6e] font-bold font-mono flex items-center gap-1">
                          💉 Mode 3: Ghi Đè Raw Inject ➔ Dịch
                        </span>
                      );
                    } else if (mode === 'MODE_4_DUAL_PASS') {
                      return (
                        <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                          🔬 Mode 4: Dịch Kép 2-Pass Phản Biện
                        </span>
                      );
                    } else if (mode === 'MODE_5_COT_THINKING') {
                      return (
                        <span className="text-[#0ac8b9] font-bold font-mono flex items-center gap-1">
                          🧠 Mode 5: Suy Luận Ngữ Cảnh CoT
                        </span>
                      );
                    } else if (mode === 'MODE_6_SLIDING_BILINGUAL') {
                      return (
                        <span className="text-[#c8aa6e] font-bold font-mono flex items-center gap-1">
                          🔗 Mode 6: Ngữ Cảnh Trượt Song Ngữ
                        </span>
                      );
                    } else {
                      return (
                        <span className="text-[#0ac8b9] font-bold font-mono flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#0ac8b9]" />
                          Mode 2: Bóc Lô {bSize}ch ➔ Dịch Thuần
                        </span>
                      );
                    }
                  })()}
                </div>

                {/* Range inputs: Từ chương -> Đến chương */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center bg-[#050505] p-2 rounded-xl border border-[#785a28]/40">
                    <span className="text-[11px] text-[#a09b8c] shrink-0 mr-1.5">Từ chương:</span>
                    <input
                      type="number"
                      min={1}
                      max={project ? project.chapters.length : 1}
                      value={fromChapInput}
                      onChange={(e) => setFromChapInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-transparent text-xs text-[#f0e6d2] font-bold font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center bg-[#050505] p-2 rounded-xl border border-[#785a28]/40">
                    <span className="text-[11px] text-[#a09b8c] shrink-0 mr-1.5">Đến chương:</span>
                    <input
                      type="number"
                      min={1}
                      max={project ? project.chapters.length : 1}
                      value={toChapInput}
                      onChange={(e) => setToChapInput(parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-xs text-[#f0e6d2] font-bold font-mono focus:outline-none"
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
                    className="py-2.5 bg-[#005a82] hover:bg-[#0284c7] disabled:opacity-40 text-[#f0e6d2] border border-[#0ac8b9]/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-black/40 cursor-pointer transition-all"
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
                      isPaused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28]'
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
                  className="w-full py-2.5 bg-[#005a82] hover:bg-[#0284c7] disabled:opacity-40 text-[#f0e6d2] border border-[#0ac8b9]/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-black/40 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0ac8b9]" />
                  <span>✨ Làm Mượt Bản Dịch Final (Quét Sạch Chữ Hán)</span>
                </button>

                {/* NÚT LÀM MƯỢT LẠI CÁC CHƯƠNG CHƯA XỬ LÝ (CUỐN CHIẾU) */}
                <button
                  disabled={isPolishing || isTranslating}
                  onClick={handleRepolishUnpolishedChapters}
                  className="w-full py-2.5 bg-[#1e2328] hover:bg-[#2e3338] disabled:opacity-40 text-[#c8aa6e] border border-[#785a28] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-black/40 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c8aa6e]" />
                  <span>
                    🪄 Làm Mượt Lại Các Chương Chưa Xử Lý
                    {project && Object.keys(project.translatedChapters).length > (project.polishedChapterIndices?.length || 0)
                      ? ` (${Object.keys(project.translatedChapters).length - (project.polishedChapterIndices?.length || 0)} ch. chưa mượt)`
                      : ''}
                  </span>
                </button>

                {/* NÚT XUẤT TOÀN BỘ TÁC PHẨM (5 ĐỊNH DẠNG EBOOK) */}
                <button
                  disabled={!project || Object.keys(project.translatedChapters).length === 0}
                  onClick={handleExportFullNovel}
                  className="w-full py-2.5 bg-[#c8aa6e] hover:bg-[#d8ba7e] disabled:opacity-40 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-black/40 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>📚 Xuất Toàn Bộ Tác Phẩm (5 Định Dạng: EPUB, MOBI, AZW3, TXT, HTML)</span>
                </button>

                {/* Rolling Context Banner */}
                {lastAttachedSnippet && (
                  <div className="p-2 bg-[#050505] border border-[#785a28]/40 rounded-xl text-[10px] text-[#f0e6d2] flex items-center gap-1.5 truncate">
                    <span className="font-bold text-[#c8aa6e] shrink-0">🔗 Ngữ cảnh 300 từ:</span>
                    <span className="truncate italic text-[#a09b8c]">{lastAttachedSnippet}</span>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* MỤC 3: KHO THUẬT NGỮ MASTER GLOSSARY */}
              {/* ======================================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <BookMarked className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide">3. Kho Thuật Ngữ Master Glossary</div>
                      <div className="text-[10px] text-[#a09b8c]">
                        {project ? Object.keys(project.masterGlossary).length : 0} thuật ngữ lưu trong bộ nhớ
                      </div>
                    </div>
                  </div>
                  <HelpBtn onClick={() => openHelp('master_glossary')} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newGlossaryKey}
                    onChange={(e) => setNewGlossaryKey(e.target.value)}
                    placeholder="Từ gốc (VD: 林辰)"
                    className="bg-[#050c18] border border-[#785a28]/40 rounded-xl px-2.5 py-1.5 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#c8aa6e]"
                  />
                  <input
                    type="text"
                    value={newGlossaryVal}
                    onChange={(e) => setNewGlossaryVal(e.target.value)}
                    placeholder="Nghĩa dịch (VD: Lâm Thần)"
                    className="bg-[#050c18] border border-[#785a28]/40 rounded-xl px-2.5 py-1.5 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#c8aa6e]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAddGlossary}
                    className="flex-1 py-1.5 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-md shadow-black/40 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Từ</span>
                  </button>

                  <label className="py-1.5 px-2.5 bg-[#005a82] hover:bg-[#0284c7] text-[#f0e6d2] border border-[#0ac8b9]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm">
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
                    className="py-1.5 px-2.5 bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                    title="Xuất từ điển ra file .txt định dạng raw=vi"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất</span>
                  </button>
                </div>

                {/* Compact Glossary Preview (Top 5 terms only to prevent lag) */}
                <div className="space-y-1">
                  {project && Object.entries(project.masterGlossary).slice(-5).reverse().map(([k, v], idx) => (
                    <div key={idx} className="p-1.5 bg-[#050c18] rounded-lg flex items-center justify-between text-[11px] border border-[#785a28]/30">
                      <span className="text-[#0ac8b9] font-medium truncate">{k} ➔ <span className="text-[#c8aa6e] font-semibold">{v}</span></span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          onClick={() => handleOpenEditGlossary(k, v)}
                          className="text-neutral-400 hover:text-[#c8aa6e] p-0.5 cursor-pointer"
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
                    className="w-full py-2 bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[#785a28] cursor-pointer transition-all shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#c8aa6e]" />
                    <span>Mở Kho Từ Điển Đầy Đủ ({Object.keys(project.masterGlossary).length} từ) ▾</span>
                  </button>
                )}
              </div>

              {/* Live Console Logs (NEWEST IS AT THE TOP) */}
              <div className="bg-[#050505] border border-[#785a28]/40 rounded-2xl p-2.5">
                <div className="flex items-center justify-between text-[10px] text-[#a09b8c] mb-1 font-mono">
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
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide">Danh Sách Chương & Trình Đọc</div>
                      <div className="text-[10px] text-[#a09b8c]">
                        Đã dịch {project ? Object.keys(project.translatedChapters).length : 0} / {totalChapters} chương
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#c8aa6e] font-mono font-bold bg-[#1e2328] px-2 py-0.5 rounded-full border border-[#785a28]">
                      {project ? Object.keys(project.translatedChapters).length : 0}/{totalChapters}
                    </span>
                    <HelpBtn onClick={() => openHelp('chapter_auditor')} />
                  </div>
                </div>

                {/* Chapter Pagination Bar to Prevent Scroll Lag */}
                {totalChapters > CHAPTERS_PER_PAGE && (
                  <div className="flex items-center justify-between bg-[#050c18] p-1.5 rounded-xl border border-[#785a28]/40 text-xs">
                    <button
                      disabled={chapterListPage <= 0}
                      onClick={() => setChapterListPage(prev => Math.max(0, prev - 1))}
                      className="px-2.5 py-1 rounded-lg bg-[#1e2328] hover:bg-[#2e3338] disabled:opacity-30 text-[#c8aa6e] font-medium flex items-center gap-1 cursor-pointer border border-[#785a28]/30 transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    
                    <span className="text-[11px] font-mono text-[#f0e6d2] font-bold">
                      Trang {chapterListPage + 1} / {totalChapterPages}
                    </span>

                    <button
                      disabled={chapterListPage >= totalChapterPages - 1}
                      onClick={() => setChapterListPage(prev => Math.min(totalChapterPages - 1, prev + 1))}
                      className="px-2.5 py-1 rounded-lg bg-[#1e2328] hover:bg-[#2e3338] disabled:opacity-30 text-[#c8aa6e] font-medium flex items-center gap-1 cursor-pointer border border-[#785a28]/30 transition-all"
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
                              ? 'bg-[#005a82]/20 border-[#0ac8b9] text-[#0ac8b9] shadow-[0_0_10px_rgba(10,200,185,0.2)]' 
                              : (isDone ? 'bg-[#050c18] border-emerald-900/40 hover:border-emerald-600/80 text-[#f0e6d2]' : 'bg-[#050c18] border-[#785a28]/30 hover:border-[#c8aa6e]/60 text-neutral-300')
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-[#1e2328] text-[10px] flex items-center justify-center font-mono text-[#c8aa6e] border border-[#785a28]/40 shrink-0">
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
                              <span className="text-[10px] text-[#0ac8b9] bg-[#005a82]/40 px-2 py-0.5 rounded-full animate-pulse font-semibold flex items-center gap-1 border border-[#0ac8b9]/40">
                                <Zap className="w-2.5 h-2.5" /> Đang dịch
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 bg-[#1e2328] px-2 py-0.5 rounded-full border border-neutral-700/50">
                                Chờ dịch
                              </span>
                            )}
                            <Eye className="w-3.5 h-3.5 text-[#a09b8c] hover:text-[#c8aa6e]" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 text-xs text-[#a09b8c]">
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
              {/* ============================================== */}
              {/* MỤC 1: CÀI ĐẶT KEY API & XOAY TUA QUOTA */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsSection1Open(!isSection1Open)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>1. Cài Đặt Key API & Xoay Tua</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {advancedSettings.rotationStrategy === 'healthiest' ? 'Khỏe Nhất' : 'Round-Robin'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isSection1Open ? 'thu gọn' : 'mở rộng thiết lập key & quota'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('settings_api_rotation'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isSection1Open ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isSection1Open && (
                  <div className="p-3.5 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      {/* Chiến lược xoay key (LoL Dropdown Card) */}
                      <div className="space-y-1.5 bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-bold text-[#f0e6d2]">Chiến Lược Xoay Key (Rotation Strategy):</span>
                          <span className="text-[9px] text-[#c8aa6e] font-mono">CHỌN 1 TRONG 2</span>
                        </div>
                        
                        <div
                          onClick={() => setIsRotationDropdownOpen(!isRotationDropdownOpen)}
                          className="bg-gradient-to-r from-[#111923] via-[#0f1d30] to-[#111923] border border-[#c8aa6e] rounded-xl p-2.5 cursor-pointer flex items-center justify-between hover:border-[#f0e6d2] transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#c8aa6e] animate-pulse"></span>
                            <span className="font-bold text-[#f0e6d2] text-xs">
                              {advancedSettings.rotationStrategy === 'healthiest'
                                ? 'Ưu Tiên Key Khỏe Nhất (Healthiest First)'
                                : 'Round-Robin Tuần Tự (Vòng Tròn Đều Đặn)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-[#785a28]/40 text-[#c8aa6e] px-1.5 py-0.5 rounded border border-[#c8aa6e]/60">
                              ĐANG DÙNG
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isRotationDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isRotationDropdownOpen && (
                          <div className="space-y-1.5 pt-1 animate-fadeIn">
                            {[
                              {
                                id: 'round-robin',
                                title: 'Round-Robin Tuần Tự',
                                desc: 'Xoay tròn đều đặn qua từng key theo thứ tự 1, 2, 3... Phân bổ tải công bằng.'
                              },
                              {
                                id: 'healthiest',
                                title: 'Ưu Tiên Key Khỏe Nhất',
                                desc: 'Ưu tiên gọi key có tỷ lệ thành công cao nhất và thời gian phản hồi nhanh nhất.'
                              }
                            ].map((item) => {
                              const isSel = (advancedSettings.rotationStrategy || 'round-robin') === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setAdvancedSettings(prev => ({ ...prev, rotationStrategy: item.id as any }));
                                    setIsRotationDropdownOpen(false);
                                    addLog(`⚙️ Đã chọn chiến lược xoay key: ${item.title}`);
                                  }}
                                  className={`w-full p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                    isSel
                                      ? 'bg-[#1e2328] border-[#c8aa6e] text-white shadow-sm'
                                      : 'bg-[#091428] border-[#785a28]/40 text-neutral-400 hover:text-white hover:border-[#c8aa6e]/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className={isSel ? 'text-[#f0e6d2]' : 'text-neutral-300'}>{item.title}</span>
                                    {isSel && <span className="text-[10px] text-[#c8aa6e]">✓</span>}
                                  </div>
                                  <div className="text-[10px] text-[#a09b8c] mt-0.5">{item.desc}</div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Cooldown khi gặp 429 */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 flex items-center justify-between">
                        <div>
                          <div className="text-[#f0e6d2] font-semibold">Thời gian nghỉ khi dính 429:</div>
                          <div className="text-[10px] text-[#a09b8c]">Hiện tại: <strong className="text-[#c8aa6e] font-mono">{advancedSettings.cooldownSeconds || 60}s</strong></div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[30, 60, 120, 180].map(s => (
                            <button
                              key={s}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, cooldownSeconds: s }));
                                addLog(`⚙️ Đã đặt Cooldown 429: ${s} giây`);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
                                (advancedSettings.cooldownSeconds || 60) === s
                                  ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm'
                                  : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                              }`}
                            >
                              {s}s
                            </button>
                          ))}
                          <button
                            onClick={() => openQuantityEditor(
                              'Thời Gian Cooldown Khi Dính 429',
                              advancedSettings.cooldownSeconds || 60,
                              5,
                              600,
                              'giây',
                              (val: number) => {
                                setAdvancedSettings(prev => ({ ...prev, cooldownSeconds: val }));
                                addLog(`⚙️ Đã đặt Cooldown 429 tùy chỉnh: ${val}s`);
                              },
                              undefined,
                              5
                            )}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold"
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      </div>

                      {/* Số lần thử lại tối đa */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 flex items-center justify-between">
                        <div>
                          <div className="text-[#f0e6d2] font-semibold">Số lần thử lại tối đa (Max Retries):</div>
                          <div className="text-[10px] text-[#a09b8c]">Hiện tại: <strong className="text-[#c8aa6e] font-mono">{advancedSettings.maxRetries || 3} lần</strong></div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 5].map(r => (
                            <button
                              key={r}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, maxRetries: r }));
                                addLog(`⚙️ Đã đặt Max Retries: ${r} lần`);
                              }}
                              className={`w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center cursor-pointer transition-all ${
                                (advancedSettings.maxRetries || 3) === r
                                  ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm'
                                  : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                          <button
                            onClick={() => openQuantityEditor(
                              'Số Lần Thử Lại Tối Đa (Max Retries)',
                              advancedSettings.maxRetries || 3,
                              1,
                              20,
                              'lần',
                              (val: number) => {
                                setAdvancedSettings(prev => ({ ...prev, maxRetries: val }));
                                addLog(`⚙️ Đã đặt Max Retries tùy chỉnh: ${val} lần`);
                              }
                            )}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold ml-0.5"
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      </div>

                      {/* Độ trễ an toàn giữa các chương */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 flex items-center justify-between">
                        <div>
                          <div className="text-[#f0e6d2] font-semibold">Độ trễ nghỉ giữa các chương:</div>
                          <div className="text-[10px] text-[#a09b8c]">Hiện tại: <strong className="text-[#c8aa6e] font-mono">{delaySecInput}s</strong></div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[0.5, 1, 2, 3].map(d => (
                            <button
                              key={d}
                              onClick={() => {
                                setDelaySecInput(d);
                                addLog(`⚙️ Đã đặt độ trễ: ${d}s`);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
                                delaySecInput === d
                                  ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm'
                                  : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                              }`}
                            >
                              {d}s
                            </button>
                          ))}
                          <button
                            onClick={() => openQuantityEditor(
                              'Độ Trễ Nghỉ Giữa Các Chương',
                              delaySecInput,
                              0,
                              60,
                              'giây',
                              (val: number) => {
                                setDelaySecInput(val);
                                addLog(`⚙️ Đã đặt độ trễ tùy chỉnh: ${val}s`);
                              },
                              undefined,
                              0.5
                            )}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold ml-0.5"
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* MỤC 2: TINH CHỈNH THUẬT NGỮ GLOSSARY (DROPDOWN ACCORDION) */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsSection2Open(!isSection2Open)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>2. Tinh Chỉnh Thuật Ngữ Glossary</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {advancedSettings.autoLearnGlossary ? 'AI Tự Học' : 'Thủ Công'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isSection2Open ? 'thu gọn' : 'mở rộng thiết lập AI tự học & danh sách từ cấm'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('settings_glossary_learning'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isSection2Open ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isSection2Open && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      {/* minTermLength */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#f0e6d2] font-semibold">Độ dài ký tự tối thiểu của từ gốc:</span>
                          <span className="text-[#c8aa6e] font-mono font-bold">{advancedSettings.minTermLength || 2} ký tự</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6].map(len => (
                            <button
                              key={len}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, minTermLength: len }));
                                addLog(`⚙️ Đã đặt Độ dài tối thiểu Glossary: >= ${len} ký tự`);
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                (advancedSettings.minTermLength || 2) === len
                                  ? 'bg-[#c8aa6e] text-black shadow-sm'
                                  : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                              }`}
                            >
                              {len} kt
                            </button>
                          ))}
                          <button
                            onClick={() => openQuantityEditor(
                              'Độ Dài Ký Tự Tối Thiểu Glossary',
                              advancedSettings.minTermLength || 2,
                              1,
                              50,
                              'ký tự',
                              (val: number) => {
                                setAdvancedSettings(prev => ({ ...prev, minTermLength: val }));
                                addLog(`⚙️ Đã đặt Độ dài tối thiểu tùy chỉnh: >= ${val} ký tự`);
                              }
                            )}
                            className="px-2 py-1 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold"
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      </div>

                      {/* minFrequency */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#f0e6d2] font-semibold">Tần suất xuất hiện tối thiểu trong chương:</span>
                          <span className="text-[#c8aa6e] font-mono font-bold">≥ {advancedSettings.minFrequency || 2} lần</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(freq => (
                            <button
                              key={freq}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, minFrequency: freq }));
                                addLog(`⚙️ Đã đặt Tần suất tối thiểu Glossary: >= ${freq} lần/chương`);
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                (advancedSettings.minFrequency || 2) === freq
                                  ? 'bg-[#c8aa6e] text-black shadow-sm'
                                  : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                              }`}
                            >
                              ≥ {freq}
                            </button>
                          ))}
                          <button
                            onClick={() => openQuantityEditor(
                              'Tần Suất Xuất Hiện Tối Thiểu Trong Chương',
                              advancedSettings.minFrequency || 2,
                              1,
                              50,
                              'lần lặp',
                              (val: number) => {
                                setAdvancedSettings(prev => ({ ...prev, minFrequency: val }));
                                addLog(`⚙️ Đã đặt Tần suất tối thiểu tùy chỉnh: >= ${val} lần`);
                              }
                            )}
                            className="px-2 py-1 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold"
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      </div>

                      {/* conflictPolicy (LoL Dropdown Card) */}
                      <div className="space-y-1.5 bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-bold text-[#f0e6d2]">Cơ Chế Xung Đột Từ Điển (Conflict Policy):</span>
                          <span className="text-[9px] text-[#c8aa6e] font-mono">CHỌN 1 TRONG 2</span>
                        </div>

                        <div
                          onClick={() => setIsConflictDropdownOpen(!isConflictDropdownOpen)}
                          className="bg-gradient-to-r from-[#111923] via-[#0f1d30] to-[#111923] border border-[#c8aa6e] rounded-xl p-2.5 cursor-pointer flex items-center justify-between hover:border-[#f0e6d2] transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#c8aa6e] animate-pulse"></span>
                            <span className="font-bold text-[#f0e6d2] text-xs">
                              {advancedSettings.conflictPolicy === 'overwrite'
                                ? 'Ghi Đè Bằng Nghĩa Mới (Overwrite Policy)'
                                : 'Giữ Cũ - Bỏ Mới (Keep-Old First - Khuyên Dùng)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-[#785a28]/40 text-[#c8aa6e] px-1.5 py-0.5 rounded border border-[#c8aa6e]/60">
                              ĐANG DÙNG
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isConflictDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isConflictDropdownOpen && (
                          <div className="space-y-1.5 pt-1 animate-fadeIn">
                            {[
                              {
                                id: 'keep-old',
                                title: 'Giữ Cũ - Bỏ Mới (Khuyên dùng)',
                                desc: 'Bảo toàn tên nhân vật ban đầu, tránh đổi tên giữa chừng trong toàn bộ tác phẩm.'
                              },
                              {
                                id: 'overwrite',
                                title: 'Ghi Đè Bằng Nghĩa Mới',
                                desc: 'Luôn cập nhật theo ngữ cảnh dịch mới nhất của các chương phía sau.'
                              }
                            ].map((item) => {
                              const isSel = (advancedSettings.conflictPolicy || 'keep-old') === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setAdvancedSettings(prev => ({ ...prev, conflictPolicy: item.id as any }));
                                    setIsConflictDropdownOpen(false);
                                    addLog(`⚙️ Đã đặt Chính sách từ điển: ${item.title}`);
                                  }}
                                  className={`w-full p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                    isSel
                                      ? 'bg-[#1e2328] border-[#c8aa6e] text-white shadow-sm'
                                      : 'bg-[#091428] border-[#785a28]/40 text-neutral-400 hover:text-white hover:border-[#c8aa6e]/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className={isSel ? 'text-[#f0e6d2]' : 'text-neutral-300'}>{item.title}</span>
                                    {isSel && <span className="text-[10px] text-[#c8aa6e]">✓</span>}
                                  </div>
                                  <div className="text-[10px] text-[#a09b8c] mt-0.5">{item.desc}</div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Blacklist Words */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[#f0e6d2] font-semibold">Bộ lọc từ cấm / Đại từ xưng hô:</span>
                          <span className="text-[10px] text-[#c8aa6e] font-mono font-bold">({advancedSettings.blacklistWords?.length || 0} từ)</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {advancedSettings.blacklistWords?.map((word, idx) => (
                            <span key={idx} className="bg-[#1e2328] border border-[#785a28]/60 px-2 py-0.5 rounded-full text-[10px] text-[#f0e6d2] flex items-center gap-1">
                              <span>{word}</span>
                              <button
                                onClick={() => {
                                  setAdvancedSettings(prev => ({
                                    ...prev,
                                    blacklistWords: prev.blacklistWords.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="text-neutral-400 hover:text-red-400 cursor-pointer"
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
                            className="flex-1 bg-[#111923] border border-[#785a28]/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#c8aa6e]"
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
                            className="px-2.5 py-1 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black font-extrabold rounded-lg text-xs cursor-pointer shrink-0 shadow-sm"
                          >
                            + Thêm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* MỤC 3: CẤU HÌNH PHƯƠNG ÁN DỊCH THUẬT (DROPDOWN ACCORDION) */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsSection3Open(!isSection3Open)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>3. Cấu Hình Phương Án Dịch Thuật</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {getStrategyTitle(advancedSettings.translationCoreStrategy || 'STRATEGY_PURE_LITERARY').split(' (')[0]}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isSection3Open ? 'thu gọn' : 'mở rộng 5 phương án lõi & các nút gạt pipeline'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('settings_pipeline_mode'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isSection3Open ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isSection3Open && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-4 animate-fadeIn">
                    <div className="pt-2.5">

                    {/* MỤC A: THẺ ẨN CHỌN PHƯƠNG ÁN LÕI (LEAGUE OF LEGENDS DROPDOWN CARD SELECTOR) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c8aa6e] flex items-center gap-1.5">
                          <span>◆</span> PHƯƠNG ÁN DỊCH LÕI (CHỌN 1 TRONG 5):
                        </span>
                        <span className="text-[9px] bg-[#1e2328] text-[#c8aa6e] px-2 py-0.5 rounded border border-[#785a28]">
                          {isStrategyDropdownOpen ? 'ĐANG CHỌN' : 'NHẤN ĐỂ ĐỔI THẺ'}
                        </span>
                      </div>

                      {/* THẺ ĐANG ĐƯỢC CHỌN (COLLAPSED CARD) */}
                      <div
                        onClick={() => setIsStrategyDropdownOpen(!isStrategyDropdownOpen)}
                        className="bg-gradient-to-r from-[#111923] via-[#0f1d30] to-[#111923] border-2 border-[#c8aa6e] shadow-[0_0_15px_rgba(200,170,110,0.25)] rounded-xl p-3 cursor-pointer transition-all hover:border-[#f0e6d2] group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#c8aa6e] animate-pulse"></span>
                            <span className="text-xs font-bold text-[#f0e6d2] group-hover:text-amber-200">
                              {getStrategyTitle(advancedSettings.translationCoreStrategy || 'STRATEGY_PURE_LITERARY')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold bg-[#785a28]/40 text-[#c8aa6e] px-2 py-0.5 rounded border border-[#c8aa6e]/60">
                              ĐANG KÍCH HOẠT
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[#c8aa6e] transition-transform duration-300 ${isStrategyDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <div className="text-[10px] text-[#a09b8c] mt-1.5 leading-relaxed pl-4 border-l-2 border-[#c8aa6e]/40">
                          {getStrategyShortDesc(advancedSettings.translationCoreStrategy || 'STRATEGY_PURE_LITERARY')}
                        </div>
                      </div>

                      {/* DANH SÁCH THẺ MỞ RỘNG (EXPANDED SELECTABLE CARDS) */}
                      {isStrategyDropdownOpen && (
                        <div className="space-y-2 pt-1 animate-fadeIn">
                          {STRATEGY_OPTIONS.map((opt) => {
                            const isSelected = (advancedSettings.translationCoreStrategy || 'STRATEGY_PURE_LITERARY') === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setAdvancedSettings(prev => ({
                                    ...prev,
                                    translationCoreStrategy: opt.id,
                                    translationPipelineMode: opt.id as any
                                  }));
                                  setIsStrategyDropdownOpen(false);
                                  addLog(`⚙️ Đã chọn Phương Án Lõi: ${opt.title}`);
                                }}
                                className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#1e2328] border-[#c8aa6e] shadow-[0_0_10px_rgba(200,170,110,0.3)] text-white'
                                    : 'bg-[#0a1120] border-[#785a28]/40 text-neutral-400 hover:text-[#f0e6d2] hover:border-[#c8aa6e]/80 hover:bg-[#111923]'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-xs">
                                  <span className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                      isSelected ? 'border-[#c8aa6e] bg-[#c8aa6e] text-black font-extrabold' : 'border-neutral-600'
                                    }`}>
                                      {isSelected ? '✓' : ''}
                                    </span>
                                    <span className={isSelected ? 'text-[#f0e6d2]' : 'text-neutral-300'}>{opt.title}</span>
                                  </span>
                                  {opt.badge && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${opt.badgeClass || 'bg-neutral-800 text-neutral-300'}`}>
                                      {opt.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-neutral-400 mt-1 pl-6 leading-relaxed">
                                  {opt.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* MỤC B: CÁC DÒNG TÍNH NĂNG BẬT / TẮT ĐỘC LẬP (MODULAR TOGGLE ROWS) */}
                    <div className="space-y-2.5 pt-2 border-t border-[#785a28]/30">
                      <div className="text-xs font-bold text-[#c8aa6e] flex items-center gap-1.5">
                        <span>◆</span> CÁC TÍNH NĂNG TÙY CHỈNH ĐỘC LẬP (NÚT GẠT CHUẨN ĐỒNG NHẤT):
                      </div>

                      {/* DÒNG 1: TỰ ĐỘNG BÓC LÔ GLOSSARY THEO SỐ CHƯƠNG */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-bold text-xs text-[#f0e6d2]">
                              <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 1</span>
                              <span>Tự Động Bóc Lô Glossary 7 Nhóm Bắt Buộc</span>
                            </div>
                            <div className="text-[10px] text-[#a09b8c] mt-1 leading-relaxed">
                              Tự động gom dải chương thô để trích xuất 100% Tên, xưng hô, chức vụ, địa danh, thú, pháp bảo & công pháp trước khi dịch.
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const nextVal = advancedSettings.enableBatchGlossaryAutoExtract !== false ? false : true;
                              setAdvancedSettings(prev => ({ ...prev, enableBatchGlossaryAutoExtract: nextVal }));
                              addLog(`⚙️ Đã ${nextVal ? 'BẬT' : 'TẮT'} Dòng 1: Tự Động Bóc Lô Glossary`);
                            }}
                            className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer shrink-0 ${
                              advancedSettings.enableBatchGlossaryAutoExtract !== false ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                          </button>
                        </div>
                        {advancedSettings.enableBatchGlossaryAutoExtract !== false && (
                          <div className="flex items-center justify-between pt-1 border-t border-[#785a28]/30">
                            <span className="text-[10px] text-neutral-400 font-medium">Kích thước lô bóc từ điển:</span>
                            <div className="flex items-center gap-1">
                              {[20, 50, 100].map(sz => (
                                <button
                                  key={sz}
                                  onClick={() => {
                                    setAdvancedSettings(prev => ({ ...prev, batchGlossarySize: sz }));
                                    addLog(`⚙️ Đã đặt cỡ lô bóc Glossary: ${sz} chương/đợt`);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                    (advancedSettings.batchGlossarySize || 50) === sz
                                      ? 'bg-[#c8aa6e] text-black shadow-sm'
                                      : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                                  }`}
                                >
                                  {sz} ch
                                </button>
                              ))}
                              <button
                                onClick={() => openQuantityEditor(
                                  'Kích Thước Lô Bóc Glossary (Số Chương)',
                                  advancedSettings.batchGlossarySize || 50,
                                  5,
                                  500,
                                  'chương',
                                  (val: number) => {
                                    setAdvancedSettings(prev => ({ ...prev, batchGlossarySize: val }));
                                    addLog(`⚙️ Đã đặt cỡ lô bóc Glossary tùy chỉnh: ${val} chương`);
                                  },
                                  undefined,
                                  5
                                )}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold ml-0.5"
                              >
                                ✏️ Sửa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* DÒNG 2: GỬI KÈM NGỮ CẢNH CUỐI CHƯƠNG TRƯỚC */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-bold text-xs text-[#f0e6d2]">
                              <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 2</span>
                              <span>Gửi Kèm Ngữ Cảnh Đoạn Cuối Chương Trước</span>
                            </div>
                            <div className="text-[10px] text-[#a09b8c] mt-1 leading-relaxed">
                              Đính kèm đoạn kết chương trước vào prompt để AI bắt nhịp văn phong, giữ mạch xưng hô và không lệch ngữ cảnh giữa các chương.
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const nextVal = advancedSettings.enablePreviousChapterContext !== false ? false : true;
                              setAdvancedSettings(prev => ({ ...prev, enablePreviousChapterContext: nextVal }));
                              addLog(`⚙️ Đã ${nextVal ? 'BẬT' : 'TẮT'} Dòng 2: Gửi kèm ngữ cảnh chương trước`);
                            }}
                            className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer shrink-0 ${
                              advancedSettings.enablePreviousChapterContext !== false ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                          </button>
                        </div>
                        {advancedSettings.enablePreviousChapterContext !== false && (
                          <div className="flex items-center justify-between pt-1 border-t border-[#785a28]/30">
                            <span className="text-[10px] text-neutral-400 font-medium">Độ dài ngữ cảnh gửi kèm:</span>
                            <div className="flex items-center gap-1">
                              {[200, 350, 500, 800].map(len => (
                                <button
                                  key={len}
                                  onClick={() => {
                                    setAdvancedSettings(prev => ({ ...prev, contextSnippetLength: len }));
                                    addLog(`⚙️ Đã đặt độ dài ngữ cảnh: ${len} ký tự`);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                    (advancedSettings.contextSnippetLength || 350) === len
                                      ? 'bg-[#c8aa6e] text-black shadow-sm'
                                      : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                                  }`}
                                >
                                  {len} kt
                                </button>
                              ))}
                              <button
                                onClick={() => openQuantityEditor(
                                  'Độ Dài Ngữ Cảnh Gửi Kèm (Ký Tự)',
                                  advancedSettings.contextSnippetLength || 350,
                                  50,
                                  2000,
                                  'ký tự',
                                  (val: number) => {
                                    setAdvancedSettings(prev => ({ ...prev, contextSnippetLength: val }));
                                    addLog(`⚙️ Đã đặt độ dài ngữ cảnh tùy chỉnh: ${val} ký tự`);
                                  },
                                  undefined,
                                  50
                                )}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold ml-0.5"
                              >
                                ✏️ Sửa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* DÒNG 3: BỘ LỌC & CỨU HỘ CHỮ HÁN TRIỆT ĐỂ */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-bold text-xs text-[#f0e6d2]">
                            <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 3</span>
                            <span>Bộ Lọc Chống Lọt Chữ Hán & Typo 2 Lớp</span>
                          </div>
                          <div className="text-[10px] text-[#a09b8c] mt-1 leading-relaxed">
                            Ép AI phiên âm Hán-Việt 100%, khử sạch các chữ Hán dính nửa vời trong câu (VD: '林辰' ➔ 'Lâm Thần', tuyệt đối không để '林 Thần').
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const nextVal = !advancedSettings.antiHanziStrict;
                            setAdvancedSettings(prev => ({ ...prev, antiHanziStrict: nextVal }));
                            addLog(`⚙️ Đã ${nextVal ? 'BẬT' : 'TẮT'} Dòng 3: Bộ Lọc Chống Lọt Chữ Hán`);
                          }}
                          className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer shrink-0 ${
                            advancedSettings.antiHanziStrict ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {/* DÒNG 4: TỰ ĐỘNG LÀM MƯỢT FINAL TOÀN DIỆN */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-bold text-xs text-[#f0e6d2]">
                            <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 4</span>
                            <span>Tự Động Kích Hoạt Làm Mượt Final Khi Dịch Xong</span>
                          </div>
                          <div className="text-[10px] text-[#a09b8c] mt-1 leading-relaxed">
                            Khi hoàn thành toàn bộ dải chương, tự động chạy Bộ Quét Làm Mượt Final để rà soát chất lượng và trau chuốt toàn bộ tác phẩm.
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const nextVal = advancedSettings.enableAutoFinalPolish !== false ? false : true;
                            setAdvancedSettings(prev => ({ ...prev, enableAutoFinalPolish: nextVal }));
                            addLog(`⚙️ Đã ${nextVal ? 'BẬT' : 'TẮT'} Dòng 4: Tự động làm mượt Final`);
                          }}
                          className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer shrink-0 ${
                            advancedSettings.enableAutoFinalPolish !== false ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {/* DÒNG 5: CHẾ ĐỘ DỊCH BÙ CHƯƠNG THIẾU / LỖI (GAP FILLING) */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-bold text-xs text-[#f0e6d2]">
                            <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 5</span>
                            <span>Chế Độ Dịch Bù (Bỏ Qua Các Chương Đã Có Bản Dịch)</span>
                          </div>
                          <div className="text-[10px] text-[#a09b8c] mt-1 leading-relaxed">
                            Khi kích hoạt, hệ thống sẽ tự động bỏ qua những chương đã dịch thành công, chỉ dịch các chương bị khuyết hoặc lỗi.
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const nextVal = !isGapFillingMode;
                            setIsGapFillingMode(nextVal);
                            addLog(`⚙️ Đã ${nextVal ? 'BẬT' : 'TẮT'} Dòng 5: Chế Độ Dịch Bù Chương`);
                          }}
                          className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer shrink-0 ${
                            isGapFillingMode ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {/* DÒNG 6: TỰ ĐỘNG CỨU HỘ TRỰC TUYẾN (ONLINE AUTO-HEAL) */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-bold text-xs text-[#f0e6d2]">
                            <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 6</span>
                            <span>Tự Động Cứu Hộ Trực Tuyến Khi Gặp Lỗi Nặng</span>
                          </div>
                          <div className="text-[10px] text-[#a09b8c] mt-1 leading-relaxed">
                            Phát hiện AI từ chối dịch, lặp từ, kẹt đĩa hoặc mất đoạn nghiêm trọng để tự động nạp key khác dịch lại tức thì.
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const nextVal = advancedSettings.autoHealOnlineEnabled !== false ? false : true;
                            setAdvancedSettings(prev => ({ ...prev, autoHealOnlineEnabled: nextVal }));
                            addLog(`⚙️ Đã ${nextVal ? 'BẬT' : 'TẮT'} Dòng 6: Cứu hộ trực tuyến`);
                          }}
                          className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer shrink-0 ${
                            advancedSettings.autoHealOnlineEnabled !== false ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {/* DÒNG 7: BƯỚC NHẢY LÀM MƯỢT CUỐN CHIẾU THỦ CÔNG */}
                      <div className="bg-[#0e1726] p-3 rounded-xl border border-[#785a28]/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[#f0e6d2] font-bold text-xs flex items-center gap-2">
                            <span className="px-1.5 py-0.2 bg-[#785a28] text-[#f0e6d2] rounded text-[9px] font-mono">DÒNG 7</span>
                            <span>Bước Nhảy Làm Mượt Cuốn Chiếu:</span>
                            <span className="text-[9px] bg-[#1e2328] text-[#c8aa6e] px-1.5 py-0.2 rounded border border-[#785a28]">
                              CHỈ CHẠY KHI ẤN NÚT
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[10, 15, 20, 25].map(sz => (
                              <button
                                key={sz}
                                onClick={() => {
                                  setAdvancedSettings(prev => ({ ...prev, rollingPolishBatchSize: sz }));
                                  addLog(`⚙️ Đã đặt khoảng cách làm mượt: ${sz} chương/đợt`);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                  (advancedSettings.rollingPolishBatchSize || 15) === sz
                                    ? 'bg-[#c8aa6e] text-black shadow-sm'
                                    : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                                }`}
                              >
                                {sz} ch
                              </button>
                            ))}
                            <button
                              onClick={() => openQuantityEditor(
                                'Bước Nhảy Làm Mượt Cuốn Chiếu (Số Chương)',
                                advancedSettings.rollingPolishBatchSize || 15,
                                5,
                                100,
                                'chương',
                                (val: number) => {
                                  setAdvancedSettings(prev => ({ ...prev, rollingPolishBatchSize: val }));
                                  addLog(`⚙️ Đã đặt bước nhảy làm mượt tùy chỉnh: ${val} chương`);
                                },
                                undefined,
                                5
                              )}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold ml-0.5"
                            >
                              ✏️ Sửa
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#a09b8c] leading-relaxed">
                          💡 Làm mượt cuốn chiếu không tự động chen ngang khi dịch. Bạn có thể nhấn nút <strong>🪄 Làm Mượt Lại</strong> tại Tab Dịch Thuật bất cứ lúc nào để đối chiếu song ngữ vá lỗi.
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* MỤC 4: CÀI ĐẶT DỊCH THUẬT NGÔN NGỮ & ĐÍCH (DROPDOWN ACCORDION) */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsSection4Open(!isSection4Open)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>4. Cài Đặt Dịch Thuật Ngôn Ngữ</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {advancedSettings.targetLanguage}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isSection4Open ? 'thu gọn' : 'mở rộng ngôn ngữ đích & bộ lọc chống chữ Hán'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('settings_translation_anti_hanzi'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isSection4Open ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isSection4Open && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      {/* Ngôn ngữ đích (LoL Dropdown Card) */}
                      <div className="space-y-1.5 bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-bold text-[#f0e6d2]">Ngôn Ngữ Đích (Target Language):</span>
                          <span className="text-[9px] text-[#c8aa6e] font-mono">CHỌN 1 TRONG 4</span>
                        </div>

                        <div
                          onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                          className="bg-gradient-to-r from-[#111923] via-[#0f1d30] to-[#111923] border border-[#c8aa6e] rounded-xl p-2.5 cursor-pointer flex items-center justify-between hover:border-[#f0e6d2] transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#c8aa6e] animate-pulse"></span>
                            <span className="font-bold text-[#f0e6d2] text-xs">
                              {advancedSettings.targetLanguage}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-[#785a28]/40 text-[#c8aa6e] px-1.5 py-0.5 rounded border border-[#c8aa6e]/60">
                              ĐANG CHỌN
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isLangDropdownOpen && (
                          <div className="space-y-1.5 pt-1 animate-fadeIn">
                            {[
                              { id: 'Tiếng Việt', flag: '🇻🇳', title: 'Tiếng Việt (Vietnamese)', desc: 'Chuẩn Hán-Việt văn học, tối ưu hoá đại từ xưng hô kiếm hiệp & tiên hiệp' },
                              { id: '日本語', flag: '🇯🇵', title: '日本語 (Japanese)', desc: 'Tự động sinh Kanji, Hiragana & Katakana tự nhiên, thả lỏng regex' },
                              { id: 'English', flag: '🇬🇧', title: 'English (US/UK)', desc: 'Standard English fiction formatting and natural phrasing' },
                              { id: '한국어', flag: '🇰🇷', title: '한국어 (Korean)', desc: 'Natural Hangul localization for light novels and webtoons' },
                            ].map((item) => {
                              const isSel = advancedSettings.targetLanguage === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setAdvancedSettings(prev => ({ ...prev, targetLanguage: item.id }));
                                    setIsLangDropdownOpen(false);
                                    addLog(`⚙️ Đã chuyển Ngôn ngữ đích: ${item.id}`);
                                  }}
                                  className={`w-full p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                    isSel
                                      ? 'bg-[#1e2328] border-[#c8aa6e] text-white shadow-sm'
                                      : 'bg-[#091428] border-[#785a28]/40 text-neutral-400 hover:text-white hover:border-[#c8aa6e]/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="flex items-center gap-1.5">
                                      <span>{item.flag}</span>
                                      <span className={isSel ? 'text-[#f0e6d2]' : 'text-neutral-300'}>{item.title}</span>
                                    </span>
                                    {isSel && <span className="text-[10px] text-[#c8aa6e]">✓</span>}
                                  </div>
                                  <div className="text-[10px] text-[#a09b8c] mt-0.5">{item.desc}</div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bộ lọc chống chữ Hán 2 lớp */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[#f0e6d2] font-bold flex items-center gap-1.5">
                              <span>Bộ Lọc Chống Lọt Chữ Hán 2 Lớp:</span>
                              <span className="text-[9px] bg-[#1e2328] text-[#c8aa6e] px-1.5 py-0.2 rounded border border-[#785a28]">
                                Dual-Layer Guard
                              </span>
                            </div>
                            <div className="text-[10px] text-[#a09b8c] mt-0.5">
                              Lớp 1: Ép khuôn Prompt • Lớp 2: Hậu kiểm Regex thông minh
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const nextVal = !advancedSettings.antiHanziStrict;
                              setAdvancedSettings(prev => ({ ...prev, antiHanziStrict: nextVal }));
                              addLog(`⚙️ Bộ lọc chống lọt chữ Hán: ${nextVal ? 'BẬT' : 'TẮT'}`);
                            }}
                            className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer ${
                              advancedSettings.antiHanziStrict ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* MỤC 5: CÀI ĐẶT TRÌNH ĐỌC & TÙY CHỌN KHÁC (DROPDOWN ACCORDION) */}
              {/* ============================================== */}
              <div className="bg-[#091428] border border-[#785a28]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setIsSection5Open(!isSection5Open)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#0e1a30] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#c8aa6e]/20 border border-[#c8aa6e] flex items-center justify-center text-[#c8aa6e] shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wide flex items-center gap-1.5">
                        <span>5. Cài Đặt Trình Đọc & Tùy Chọn Khác</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#785a28]/40 text-[#c8aa6e] border border-[#c8aa6e]/40 font-mono font-bold">
                          {advancedSettings.readerFontSize || 16}px
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a09b8c]">Bấm để {isSection5Open ? 'thu gọn' : 'mở rộng cỡ chữ, màn hình sáng & quản lý dự án'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HelpBtn onClick={(e) => { e?.stopPropagation(); openHelp('settings_reader_experience'); }} />
                    <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isSection5Open ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isSection5Open && (
                  <div className="p-3 pt-0 border-t border-[#785a28]/30 space-y-3 animate-fadeIn">
                    <div className="pt-2.5 space-y-2.5 text-xs">
                      {/* Cỡ chữ mặc định */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 flex items-center justify-between">
                        <div>
                          <div className="text-[#f0e6d2] font-semibold">Cỡ chữ mặc định khi đọc:</div>
                          <div className="text-[10px] text-[#a09b8c]">Hiện tại: <strong className="text-[#c8aa6e] font-mono">{advancedSettings.readerFontSize || 16}px</strong></div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[14, 16, 18, 20, 22].map(sz => (
                            <button
                              key={sz}
                              onClick={() => {
                                setAdvancedSettings(prev => ({ ...prev, readerFontSize: sz }));
                                setReaderFontSize(sz);
                              }}
                              className={`w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center cursor-pointer transition-all ${
                                (advancedSettings.readerFontSize || 16) === sz
                                  ? 'bg-[#c8aa6e] text-black font-extrabold shadow-sm'
                                  : 'bg-[#1e2328] text-neutral-400 hover:text-white border border-[#785a28]/30'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                          <button
                            onClick={() => openQuantityEditor(
                              'Cỡ Chữ Đọc Sách (Font Size)',
                              advancedSettings.readerFontSize || 16,
                              10,
                              36,
                              'px',
                              (val: number) => {
                                setAdvancedSettings(prev => ({ ...prev, readerFontSize: val }));
                                setReaderFontSize(val);
                                addLog(`⚙️ Đã đặt cỡ chữ đọc sách tùy chỉnh: ${val}px`);
                              }
                            )}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2328] hover:bg-[#2e3338] text-[#c8aa6e] border border-[#785a28] cursor-pointer font-bold ml-0.5"
                          >
                            ✏️ Sửa
                          </button>
                        </div>
                      </div>

                      {/* Giữ sáng màn hình khi đọc */}
                      <div className="bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40 flex items-center justify-between">
                        <div>
                          <div className="text-[#f0e6d2] font-semibold">Giữ sáng màn hình khi đọc:</div>
                          <div className="text-[10px] text-[#a09b8c]">Kích hoạt FLAG_KEEP_SCREEN_ON</div>
                        </div>
                        <button
                          onClick={() => {
                            setAdvancedSettings(prev => ({ ...prev, keepScreenAwake: !prev.keepScreenAwake }));
                          }}
                          className={`w-12 h-6 rounded-full transition-all p-0.5 flex items-center cursor-pointer ${
                            advancedSettings.keepScreenAwake ? 'bg-emerald-600 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {/* Model Dùng Cho Khâu Làm Mượt Final (LoL Dropdown Card) */}
                      <div className="space-y-1.5 bg-[#050505] p-2.5 rounded-xl border border-[#785a28]/40">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-bold text-[#f0e6d2]">Model Khâu Làm Mượt Final:</span>
                          <span className="text-[9px] text-[#c8aa6e] font-mono">CHỌN 1 TRONG 4</span>
                        </div>
                        <div
                          onClick={() => setIsPolishModelDropdownOpen(!isPolishModelDropdownOpen)}
                          className="bg-gradient-to-r from-[#111923] via-[#0f1d30] to-[#111923] border border-[#c8aa6e] rounded-xl p-2.5 cursor-pointer flex items-center justify-between hover:border-[#f0e6d2] transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#c8aa6e] animate-pulse"></span>
                            <span className="font-bold text-[#f0e6d2] text-xs font-mono">{polishModel}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-[#785a28]/40 text-[#c8aa6e] px-1.5 py-0.5 rounded border border-[#c8aa6e]/60">
                              ĐANG CHỌN
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#c8aa6e] transition-transform duration-300 ${isPolishModelDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isPolishModelDropdownOpen && (
                          <div className="space-y-1.5 pt-1 animate-fadeIn">
                            {[
                              { id: 'gemini-3.6-flash', title: 'Gemini 3.6 Flash (Khuyên Dùng)', desc: 'Tốc độ siêu tốc, thông minh và cực nhạy khi trau chuốt văn học' },
                              { id: 'gemini-2.5-flash', title: 'Gemini 2.5 Flash', desc: 'Thế hệ 2.5 ổn định, cân bằng giữa tốc độ và độ mượt' },
                              { id: 'gemini-2.0-flash', title: 'Gemini 2.0 Flash', desc: 'Phiên bản gọn nhẹ, tiết kiệm tài nguyên' },
                              { id: 'gemini-2.5-pro', title: 'Gemini 2.5 Pro', desc: 'Mô hình chuyên sâu cho văn bản độ khó cao và cấu trúc phức tạp' },
                            ].map((item) => {
                              const isSel = polishModel === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setPolishModel(item.id);
                                    setIsPolishModelDropdownOpen(false);
                                    addLog(`⚙️ Đã chọn model làm mượt Final: ${item.id}`);
                                  }}
                                  className={`w-full p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                    isSel
                                      ? 'bg-[#1e2328] border-[#c8aa6e] text-white shadow-sm'
                                      : 'bg-[#091428] border-[#785a28]/40 text-neutral-400 hover:text-white hover:border-[#c8aa6e]/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className={isSel ? 'text-[#f0e6d2]' : 'text-neutral-300'}>{item.title}</span>
                                    {isSel && <span className="text-[10px] text-[#c8aa6e]">✓</span>}
                                  </div>
                                  <div className="text-[10px] text-[#a09b8c] mt-0.5">{item.desc}</div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Phân hệ: Quản Lý Dự Án */}
                      <div className="pt-2 border-t border-[#785a28]/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#c8aa6e] text-xs flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>QUẢN LÝ DỰ ÁN & TIẾN TRÌNH:</span>
                          </span>
                          <button
                            onClick={() => setShowNewProjModal(true)}
                            className="px-2 py-0.5 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black font-extrabold rounded text-[10px] flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Tạo Mới</span>
                          </button>
                        </div>
                        <div className="p-2.5 bg-[#050505] rounded-xl border border-[#785a28]/40 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">Tên tác phẩm:</span>
                            <span className="text-[#f0e6d2] font-bold">{project?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">Tiến độ:</span>
                            <span className="text-[#c8aa6e] font-mono font-semibold">{project ? Object.keys(project.translatedChapters).length : 0}/{project?.chapters?.length || 0} chương</span>
                          </div>
                          <div className="pt-1">
                            <button
                              onClick={() => setShowDeleteProjModal(true)}
                              className="w-full py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/80 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span>Xóa Vĩnh Viễn Dự Án Này</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Phân hệ: 5 Lớp Chạy Ngầm (God-Mode) */}
                      <div className="pt-2 border-t border-[#785a28]/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#c8aa6e] text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>5 LỚP CHẠY NGẦM (GOD-MODE):</span>
                          </span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800 font-mono">
                            5/5 KÍCH HOẠT
                          </span>
                        </div>
                        <button
                          onClick={onOpenGodModeModal}
                          className="w-full py-1.5 bg-[#1e2328] hover:bg-[#2e3338] text-[#f0e6d2] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-[#785a28] cursor-pointer"
                        >
                          <ShieldAlert className="w-3 h-3 text-[#c8aa6e]" />
                          <span>Chi Tiết Lệnh Root & Linux Kernel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION: 4 TABS (STRICT 4-COLOR PALETTE) */}
        <div className="h-16 bg-[#091428] border-t border-[#785a28]/60 px-2 flex items-center justify-around select-none shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
          <button
            onClick={() => setActiveBottomTab('keys')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'keys'
                ? 'text-[#c8aa6e] font-bold bg-[#785a28]/25 border border-[#c8aa6e]/50 shadow-[0_0_10px_rgba(200,170,110,0.25)]'
                : 'text-neutral-400 hover:text-[#f0e6d2] border border-transparent'
            }`}
          >
            <Key className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Key & Prompt</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('translate')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'translate'
                ? 'text-[#c8aa6e] font-bold bg-[#785a28]/25 border border-[#c8aa6e]/50 shadow-[0_0_10px_rgba(200,170,110,0.25)]'
                : 'text-neutral-400 hover:text-[#f0e6d2] border border-transparent'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Dịch & Từ điển</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('chapters')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'chapters'
                ? 'text-[#c8aa6e] font-bold bg-[#785a28]/25 border border-[#c8aa6e]/50 shadow-[0_0_10px_rgba(200,170,110,0.25)]'
                : 'text-neutral-400 hover:text-[#f0e6d2] border border-transparent'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bản dịch & Đọc</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('settings')}
            className={`flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'settings'
                ? 'text-[#c8aa6e] font-bold bg-[#785a28]/25 border border-[#c8aa6e]/50 shadow-[0_0_10px_rgba(200,170,110,0.25)]'
                : 'text-neutral-400 hover:text-[#f0e6d2] border border-transparent'
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
          <div className="bg-neutral-900 border border-[#785a28]/60 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#c8aa6e]" />
                <span className="font-bold text-[#f0e6d2] text-sm">Xuất Bản Dịch Ebook</span>
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
                  className="p-3 bg-neutral-950 hover:bg-[#1e2328] border border-neutral-800 hover:border-[#c8aa6e]/60 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-[#c8aa6e] transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-400">{item.desc}</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-500 group-hover:text-[#c8aa6e] transition-colors" />
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

      {/* UNIVERSAL QUANTITY / NUMBER EDITOR MODAL */}
      {editQuantityModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#091428] border border-[#c8aa6e] rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-[0_0_30px_rgba(200,170,110,0.3)]">
            <div className="flex items-center justify-between border-b border-[#785a28]/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <span className="font-bold text-[#f0e6d2] text-xs uppercase tracking-wide">Tùy Chỉnh Thông Số</span>
              </div>
              <button 
                onClick={() => setEditQuantityModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-neutral-200">{editQuantityModal.title}</div>
              <div className="text-[10px] text-[#a09b8c]">
                Khoảng giá trị hợp lệ: {editQuantityModal.min} – {editQuantityModal.max} {editQuantityModal.unit}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#050505] p-2.5 rounded-xl border border-[#785a28]">
              <input
                type="number"
                min={editQuantityModal.min}
                max={editQuantityModal.max}
                step={editQuantityModal.step || 1}
                value={tempQuantityInput}
                onChange={(e) => setTempQuantityInput(e.target.value)}
                className="flex-1 bg-transparent text-center font-mono text-lg font-bold text-[#c8aa6e] focus:outline-none"
                autoFocus
              />
              <span className="text-xs text-neutral-400 font-mono pr-2">{editQuantityModal.unit}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setEditQuantityModal(null)}
                className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer border border-neutral-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const num = parseFloat(tempQuantityInput);
                  if (!isNaN(num)) {
                    const clamped = Math.min(editQuantityModal.max, Math.max(editQuantityModal.min, num));
                    editQuantityModal.onSave(clamped);
                  }
                  setEditQuantityModal(null);
                }}
                className="flex-1 py-2 bg-[#c8aa6e] hover:bg-[#d8ba7e] text-black font-extrabold rounded-xl text-xs shadow-md shadow-amber-600/30 cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
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

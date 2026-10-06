export interface ApiKeyItem {
  key: string;
  state: 'ACTIVE' | 'BUSY' | 'COOLDOWN' | 'INVALID' | 'ERROR';
  cooldownUntil: number;
  busyUntil: number;
}

export interface PromptCardItem {
  id: number | string;
  title: string;
  content: string;
  active: boolean;
}

export type TranslationCoreStrategy = 
  | 'STRATEGY_PURE_LITERARY'     // Dịch Thuần Túy Văn Học (Chuẩn xác, tự nhiên & nhanh nhất)
  | 'STRATEGY_DUAL_TASK'          // Vừa Dịch Vừa Trích Xuất Glossary Mới trong 1 Request (Tiết kiệm Token)
  | 'STRATEGY_PRE_INJECT_RAW'     // Ghi Đè Thuật Ngữ Lên Bản Raw Trước Khi Dịch (Khóa Tên 100%)
  | 'STRATEGY_DUAL_PASS'          // Dịch Kép Phản Biện 2-Pass (Pass 1 Dịch + Pass 2 Tổng Biên Tập Đối Soát)
  | 'STRATEGY_COT_THINKING';      // Dịch Suy Luận Ngữ Cảnh CoT (Deep Thinking / Giải Mã Thành Ngữ)

export type TranslationPipelineMode =
  | 'MODE_1_DUAL_TASK'
  | 'MODE_2_BATCH_PURE'
  | 'MODE_3_RAW_INJECT'
  | 'MODE_4_DUAL_PASS'
  | 'MODE_5_COT_THINKING'
  | 'MODE_6_SLIDING_BILINGUAL'
  | 'COMBINED'
  | 'BATCH_GLOSSARY'
  | TranslationCoreStrategy;

export interface AdvancedSettings {
  // Key API Settings
  rotationStrategy: 'round-robin' | 'healthiest';
  cooldownSeconds: number; // e.g. 60s
  maxRetries: number; // e.g. 3
  requestTimeoutSeconds: number; // e.g. 60s

  // PHÂN HỆ 1: CHIẾN LƯỢC DỊCH THUẬT CHÍNH (Thẻ Ẩn Dropdown LoL Style - Chọn 1 trong 4)
  translationCoreStrategy: TranslationCoreStrategy;
  translationPipelineMode?: TranslationPipelineMode;

  // PHÂN HỆ 2: CÁC DÒNG TÍNH NĂNG BẬT / TẮT ĐỘC LẬP (MODULAR SWITCHES)
  enableDualPassProofreading: boolean; // Dịch Kép 2-Pass Phản Biện (Pass 1 Dịch ➔ Pass 2 Tổng Biên Tập sửa lỗi)
  enableBatchGlossaryAutoExtract: boolean; // Tự động bóc lô Glossary 7 nhóm trước khi dịch
  batchGlossarySize: number; // e.g. 50 chapters per batch
  enablePreviousChapterContext: boolean; // Gửi kèm ngữ cảnh đoạn kết chương trước để bắt nhịp xưng hô
  contextSnippetLength: number; // e.g. 350 chars (100 - 1000)
  enableAutoFinalPolish: boolean; // Tự động kích hoạt Làm Mượt Final sau khi hoàn tất dải chương
  antiHanziStrict: boolean; // Bộ lọc 2 lớp chống lọt chữ Hán & typo bộ gõ
  autoHealOnlineEnabled: boolean; // Tự động cứu hộ trực tuyến khi gặp lỗi nặng / nghẽn mạng
  rollingPolishBatchSize?: number; // e.g. 15 chapters (chạy khi ấn nút thủ công)

  // Glossary AI Auto-Learning Settings
  autoLearnGlossary?: boolean;
  minTermLength: number; // e.g. 2 chars (1 - 8)
  minFrequency: number; // e.g. 2 occurrences (1 - 10)
  conflictPolicy: 'keep-old' | 'overwrite';
  blacklistWords: string[]; // pronouns & common fillers

  // Translation Target Language
  targetLanguage: string; // 'Tiếng Việt' | 'English' | '日本語' | '한국어'

  // Reader Settings
  readerFontSize: number; // 16
  readerLineSpacing: number; // 1.6
  keepScreenAwake: boolean; // true
}

export interface ParsedEbook {
  title: string;
  format: 'txt' | 'epub' | 'mobi' | 'azw3';
  chapters: string[];
  rawText: string;
  fileSizeFormatted: string;
}

export interface ProjectData {
  name: string;
  path: string;
  model: string;
  targetLang: string;
  chunkSize: string;
  completed: number;
  total: number;
  lastChapter: number;
  keys: ApiKeyItem[];
  prompts: PromptCardItem[];
  chapters: string[];
  translatedChapters: Record<number, string>;
  masterGlossary: Record<string, string>;
  patchDictionary?: Record<string, string>;
  polishedChapterIndices?: number[];
  createdAt?: number;
  lastUpdated?: number;
}

export interface GodModeLayerStatus {
  id: number;
  name: string;
  targetThreat: string;
  mechanism: string;
  rootRequired: boolean;
  commandOrApi: string;
  status: 'ACTIVE' | 'STANDBY' | 'BLOCKED';
  description: string;
}

export interface ProjectFileEntry {
  path: string;
  language: 'java' | 'xml' | 'groovy' | 'properties' | 'shell' | 'markdown';
  description: string;
  content: string;
}

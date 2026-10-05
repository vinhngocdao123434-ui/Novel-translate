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

export interface AdvancedSettings {
  // Key API Settings
  rotationStrategy: 'round-robin' | 'healthiest';
  cooldownSeconds: number; // e.g. 60s
  maxRetries: number; // e.g. 3
  requestTimeoutSeconds: number; // e.g. 60s

  // Pipeline Mode Settings
  translationPipelineMode: 'BATCH_GLOSSARY' | 'COMBINED'; // 'BATCH_GLOSSARY' (Bóc Lô 50 Chương -> Dịch Thuần Túy) | 'COMBINED' (Dịch & Bóc Đồng Thời)
  batchGlossarySize: number; // e.g. 50 chapters per batch
  rollingPolishEnabled?: boolean; // Tự động làm mượt cuốn chiếu mỗi 15 chương
  rollingPolishBatchSize?: number; // e.g. 15 chapters

  // Glossary AI Auto-Learning Settings
  minTermLength: number; // e.g. 2 chars (1 - 8)
  minFrequency: number; // e.g. 2 occurrences (1 - 10)
  conflictPolicy: 'keep-old' | 'overwrite';
  blacklistWords: string[]; // pronouns & common fillers

  // Translation & Anti-Hanzi Guard Settings
  targetLanguage: string; // 'Tiếng Việt' | 'English' | '日本語' | '한국어'
  antiHanziStrict: boolean; // true
  contextSnippetLength: number; // e.g. 350 chars

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

export interface AuditIssue {
  type:
    | 'empty_content'
    | 'length_too_short'
    | 'excessive_hanzi'
    | 'ai_refusal'
    | 'ai_conversational_intro'
    | 'ai_conversational_outro'
    | 'repetition_loop'
    | 'markdown_tag_leakage'
    | 'excessive_blank_lines'
    | 'telex_typos';
  severity: 'mild' | 'critical';
  message: string;
}

export interface AuditResult {
  isValid: boolean;
  score: number; // 0 - 100
  issues: AuditIssue[];
  hasCriticalError: boolean;
  hasMildError: boolean;
  cleanedText: string;
  healedActions: string[];
}

/**
 * Các mẫu câu AI từ chối dịch hoặc vi phạm an toàn (Lỗi THỰC SỰ NẶNG - Cần Online Retry)
 */
const AI_REFUSAL_PATTERNS = [
  /tôi không thể (hoàn thành|dịch|hỗ trợ|xử lý)/i,
  /rất tiếc,? (nhưng )?tôi không thể/i,
  /i cannot (fulfill|translate|process|assist)/i,
  /as an ai,? i (cannot|am not able)/i,
  /vi phạm chính sách (nội dung|an toàn)/i,
  /safety guidelines/i,
  /content policy/i,
  /không thể hỗ trợ yêu cầu này/i,
];

/**
 * Các mẫu câu AI mở đầu giao tiếp thừa
 */
const AI_INTRO_PATTERNS = [
  /^(dưới đây là|sau đây là|đây là) bản dịch( trôi chảy| chi tiết| hoàn chỉnh)?(:|\.)?/im,
  /^(tất nhiên|chắc chắn rồi|dạ|vâng),? (dưới đây|sau đây|tôi xin gửi) là bản dịch(:|\.)?/im,
  /^here is the (translation|translated text)(:|\.)?/im,
  /^(bản dịch|dịch thuật)( của bạn| tiểu thuyết)?(:|\.)?/im,
];

/**
 * Các mẫu câu AI kết thúc giao tiếp thừa
 */
const AI_OUTRO_PATTERNS = [
  /(hy vọng|chúc bạn)( đọc truyện vui vẻ| thích bản dịch này| hài lòng).*$/im,
  /(nếu bạn cần|hãy cho tôi biết nếu) cần chỉnh sửa thêm.*$/im,
  /hope this helps.*$/im,
];

export class ChapterAuditor {
  /**
   * Đếm số lượng ký tự chữ Hán
   */
  public static countChineseChars(text: string): number {
    if (!text) return 0;
    const matches = text.match(/[\u4e00-\u9fa5]/g);
    return matches ? matches.length : 0;
  }

  /**
   * Chỉ dọn dẹp các thẻ định dạng, vỏ bọc Markdown (Giữ nguyên văn bản dịch từ AI, KHÔNG sửa từ/chữ Hán offline)
   */
  public static cleanChapterOffline(
    text: string,
    _glossary: Record<string, string> = {}
  ): { cleaned: string; healedActions: string[] } {
    if (!text) return { cleaned: '', healedActions: [] };

    let cleaned = text;
    const healedActions: string[] = [];

    // 1. Dỡ bỏ các thẻ phân tách và codeblock rò rỉ
    if (cleaned.includes('===TRANSLATION===') || cleaned.includes('===NEW_GLOSSARY===')) {
      cleaned = cleaned
        .replace(/[#*]*\s*===+\s*TRANSLATION\s*===+[#*]*/gi, '')
        .replace(/[#*]*\s*===+\s*NEW_GLOSSARY\s*===+[#*]*[\s\S]*$/gi, '');
      healedActions.push('Dỡ bỏ thẻ phân tách hệ thống (===TRANSLATION===)');
    }

    if (cleaned.startsWith('```')) {
      const firstNl = cleaned.indexOf('\n');
      if (firstNl !== -1) cleaned = cleaned.substring(firstNl + 1);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      healedActions.push('Tháo bỏ vỏ bọc Markdown codeblock (```)');
    }

    // 2. Dọn dẹp câu chào mở đầu của AI
    const lines = cleaned.split('\n');
    let trimmedIntro = false;
    while (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (!firstLine) {
        lines.shift();
        continue;
      }

      let isIntro = false;
      for (const pattern of AI_INTRO_PATTERNS) {
        if (pattern.test(firstLine)) {
          isIntro = true;
          break;
        }
      }

      if (isIntro) {
        lines.shift();
        trimmedIntro = true;
      } else {
        break;
      }
    }

    if (trimmedIntro) {
      cleaned = lines.join('\n');
      healedActions.push('Cắt bỏ câu chào giao tiếp mở đầu của AI');
    }

    // 3. Dọn dẹp câu kết lời chúc thừa của AI
    let trimmedOutro = false;
    for (const pattern of AI_OUTRO_PATTERNS) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '').trim();
        trimmedOutro = true;
      }
    }
    if (trimmedOutro) {
      healedActions.push('Cắt bỏ câu chúc / chào kết thúc của AI');
    }

    // 4. Khử bão dòng trắng (quá nhiều dòng trống liên tiếp)
    const beforeLines = cleaned;
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
    if (cleaned !== beforeLines) {
      healedActions.push('Nén gọn các dòng trống dư thừa');
    }

    return {
      cleaned: cleaned.trim(),
      healedActions,
    };
  }

  /**
   * Phát hiện lỗi lặp từ vô tận (Degeneration loop)
   */
  public static detectRepetitionLoop(text: string): boolean {
    if (!text || text.length < 150) return false;

    // Kiểm tra câu hoặc cụm 4-8 từ lặp liên tiếp 4 lần trở lên
    const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 8);
    for (let i = 0; i < sentences.length - 3; i++) {
      const current = sentences[i];
      if (
        current === sentences[i + 1] &&
        current === sentences[i + 2] &&
        current === sentences[i + 3]
      ) {
        return true;
      }
    }

    // Kiểm tra mẫu lặp ký tự liên tiếp dài (>50 ký tự giống hệt)
    const repeatingPattern = /(.{5,30})\1{4,}/;
    return repeatingPattern.test(text);
  }

  /**
   * Hàm kiểm định chất lượng chương:
   * - Chỉ đánh dấu Critical (Lỗi rất nặng cần Online Retry) khi:
   *   1. Rỗng nội dung
   *   2. AI từ chối dịch (ai_refusal)
   *   3. Lặp câu / kẹt đĩa vô tận (repetition_loop)
   *   4. Mất chữ nghiêm trọng (< 35% bản gốc)
   *   5. Rò rỉ nguyên văn tiếng Trung quy mô lớn (> 60 chữ Hán)
   * - Sót vài chữ Hán / từ lai rải rác: Giữ nguyên văn, coi là bình thường để Bộ Quét Làm Mượt Final xử lý sau.
   */
  public static auditChapter(
    rawText: string,
    translatedText: string,
    glossary: Record<string, string> = {}
  ): AuditResult {
    const issues: AuditIssue[] = [];
    let score = 100;

    // Bước 1: Dọn dẹp thẻ cấu trúc / codeblock
    const { cleaned: formattedText, healedActions } = this.cleanChapterOffline(translatedText, glossary);

    // 1. Kiểm tra trống nội dung -> CRITICAL
    if (!formattedText || formattedText.trim().length === 0) {
      issues.push({
        type: 'empty_content',
        severity: 'critical',
        message: 'Bản dịch trống rỗng hoàn toàn hoặc chỉ có khoảng trắng.',
      });
      return {
        isValid: false,
        score: 0,
        issues,
        hasCriticalError: true,
        hasMildError: false,
        cleanedText: '',
        healedActions,
      };
    }

    // 2. Kiểm tra câu từ chối dịch của AI -> CRITICAL
    for (const pattern of AI_REFUSAL_PATTERNS) {
      if (pattern.test(formattedText)) {
        if (formattedText.length < 500) {
          issues.push({
            type: 'ai_refusal',
            severity: 'critical',
            message: 'Gemini từ chối dịch chương này do chính sách an toàn hoặc kiểm duyệt.',
          });
          score -= 90;
          break;
        }
      }
    }

    // 3. Kiểm tra lặp từ / kẹt đĩa vô tận -> CRITICAL
    if (this.detectRepetitionLoop(formattedText)) {
      issues.push({
        type: 'repetition_loop',
        severity: 'critical',
        message: 'Phát hiện AI bị kẹt đĩa (lặp đi lặp lại câu văn vô tận).',
      });
      score -= 60;
    }

    // 4. Kiểm tra tỷ lệ độ dài (Length Ratio) -> CRITICAL nếu < 35% với bản gốc dài
    const rawLen = rawText ? rawText.trim().length : 0;
    const transLen = formattedText.length;

    if (rawLen > 200) {
      const ratio = transLen / rawLen;
      if (ratio < 0.35) {
        issues.push({
          type: 'length_too_short',
          severity: 'critical',
          message: `Mất chữ nghiêm trọng so với nguyên tác (${transLen}/${rawLen} ký tự, chỉ đạt ${Math.round(ratio * 100)}%).`,
        });
        score -= 50;
      }
    }

    // 5. Kiểm tra chữ Hán:
    // - Nếu > 60 chữ Hán: AI copy nguyên xi cả đoạn văn bản tiếng Trung mà không dịch -> CRITICAL (Cần dịch lại)
    // - Nếu <= 60 chữ Hán: Vài từ tiếng Trung sót, từ lai, tên riêng -> MILD / Bình thường (Giữ nguyên cho Bộ Quét Làm Mượt Final xử lý)
    const hanziCount = this.countChineseChars(formattedText);
    if (hanziCount > 60) {
      issues.push({
        type: 'excessive_hanzi',
        severity: 'critical',
        message: `Bản dịch bị rò rỉ nguyên đoạn tiếng Trung (${hanziCount} chữ Hán thô chưa dịch).`,
      });
      score -= 50;
    } else if (hanziCount > 0) {
      issues.push({
        type: 'excessive_hanzi',
        severity: 'mild',
        message: `Sót nhẹ ${hanziCount} chữ Hán/từ lai (Giữ nguyên cho chức năng Làm Mượt Final xử lý).`,
      });
      score -= Math.min(10, Math.ceil(hanziCount / 5));
    }

    const hasCriticalError = issues.some((i) => i.severity === 'critical');
    const hasMildError = issues.some((i) => i.severity === 'mild');
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      isValid: !hasCriticalError && finalScore >= 40,
      score: finalScore,
      issues,
      hasCriticalError,
      hasMildError,
      cleanedText: formattedText,
      healedActions,
    };
  }
}

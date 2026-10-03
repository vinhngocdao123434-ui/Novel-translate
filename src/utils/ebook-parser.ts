import JSZip from 'jszip';
import { ParsedEbook } from '../types';

/**
 * Strips HTML tags and decodes common HTML entities to clean text
 */
function cleanHtmlToText(html: string): string {
  // Replace <br> and </p> with linebreaks
  let text = html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n');

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode basic HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Normalize consecutive empty lines
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parse an EPUB file into distinct chapters
 */
async function parseEpubFile(file: File): Promise<ParsedEbook> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Find rootfile from META-INF/container.xml
  let opfPath = 'content.opf';
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (containerXml) {
    const match = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  // 2. Read OPF file
  const opfContent = await zip.file(opfPath)?.async('string');
  const baseDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  let bookTitle = file.name.replace(/\.[^/.]+$/, '');
  const chapterFiles: string[] = [];

  if (opfContent) {
    // Extract Title
    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch && titleMatch[1]) {
      bookTitle = titleMatch[1].trim();
    }

    // Map manifest items: id -> href
    const manifestItems: Record<string, string> = {};
    const itemMatches = opfContent.matchAll(/<item[^>]+id=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi);
    for (const match of itemMatches) {
      manifestItems[match[1]] = match[2];
    }
    // Also try reversed attribute order href then id
    const itemMatchesRev = opfContent.matchAll(/<item[^>]+href=["']([^"']+)["'][^>]+id=["']([^"']+)["'][^>]*>/gi);
    for (const match of itemMatchesRev) {
      manifestItems[match[2]] = match[1];
    }

    // Follow spine order
    const spineMatches = opfContent.matchAll(/<itemref[^>]+idref=["']([^"']+)["'][^>]*>/gi);
    for (const match of spineMatches) {
      const idref = match[1];
      const href = manifestItems[idref];
      if (href) {
        // Resolve relative path
        const decodedHref = decodeURIComponent(href.split('#')[0]);
        const fullHref = baseDir ? baseDir + decodedHref : decodedHref;
        chapterFiles.push(fullHref);
      }
    }
  }

  // Fallback: If spine extraction failed, grab all html/xhtml files
  if (chapterFiles.length === 0) {
    zip.forEach((relativePath) => {
      if (/\.(xhtml|html|htm)$/i.test(relativePath) && !relativePath.includes('toc')) {
        chapterFiles.push(relativePath);
      }
    });
  }

  // 3. Extract text content per chapter
  const chapters: string[] = [];
  let fullText = '';

  for (const chapterPath of chapterFiles) {
    // Normalize path
    let entry = zip.file(chapterPath);
    if (!entry) {
      // Try finding case-insensitively or matching filename
      const baseName = chapterPath.split('/').pop();
      entry = zip.file(new RegExp(baseName + '$', 'i'))[0];
    }

    if (entry) {
      const htmlContent = await entry.async('string');
      const plainText = cleanHtmlToText(htmlContent);
      if (plainText.length > 50) {
        chapters.push(plainText);
        fullText += (fullText ? '\n\n' : '') + plainText;
      }
    }
  }

  // If no individual chapters found, use whatever text was extracted
  if (chapters.length === 0 && fullText.trim()) {
    chapters.push(fullText.trim());
  }

  return {
    title: bookTitle,
    format: 'epub',
    chapters,
    rawText: fullText,
    fileSizeFormatted: formatBytes(file.size)
  };
}

/**
 * Parse MOBI / AZW3 file (PalmDOC format extraction)
 */
async function parseMobiOrAzw3File(file: File, format: 'mobi' | 'azw3'): Promise<ParsedEbook> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  let bookTitle = file.name.replace(/\.[^/.]+$/, '');
  let extractedText = '';

  try {
    // Read Palm Database Title (first 32 bytes)
    let palmTitle = '';
    for (let i = 0; i < 32 && buffer[i] !== 0; i++) {
      palmTitle += String.fromCharCode(buffer[i]);
    }
    if (palmTitle.trim()) {
      bookTitle = palmTitle.trim();
    }

    // Number of records at offset 76 (2 bytes, big-endian)
    const numRecords = (buffer[76] << 8) | buffer[77];

    // Record list starts at offset 78. Each record entry is 8 bytes:
    // 4 bytes: record data offset, 4 bytes: attributes + unique ID
    const recordOffsets: number[] = [];
    for (let i = 0; i < numRecords && i < 2000; i++) {
      const pos = 78 + i * 8;
      if (pos + 4 <= buffer.length) {
        const offset = (buffer[pos] << 24) | (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3];
        recordOffsets.push(offset);
      }
    }

    // Record 0 contains PalmDOC header:
    // bytes 0-1: Compression (1 = none, 2 = PalmDOC LZ77, 17480 = HUFF/CDIC)
    // bytes 8-9: Record count for text
    // bytes 10-11: Record size (usually 4096)
    if (recordOffsets.length >= 2) {
      const rec0Offset = recordOffsets[0];
      const compression = (buffer[rec0Offset] << 8) | buffer[rec0Offset + 1];
      const textRecordCount = (buffer[rec0Offset + 8] << 8) | buffer[rec0Offset + 9];

      // Read text records
      const textParts: string[] = [];
      const decoder = new TextDecoder('utf-8', { fatal: false });

      const maxTextRec = Math.min(textRecordCount || (recordOffsets.length - 1), recordOffsets.length - 1);

      for (let r = 1; r <= maxTextRec; r++) {
        const start = recordOffsets[r];
        const end = (r + 1 < recordOffsets.length) ? recordOffsets[r + 1] : buffer.length;
        if (start < end && end <= buffer.length) {
          const recSlice = buffer.subarray(start, end);
          if (compression === 1) {
            // Uncompressed text
            textParts.push(decoder.decode(recSlice));
          } else if (compression === 2) {
            // PalmDOC LZ77 decompressed
            const decompressed = decompressPalmDoc(recSlice);
            textParts.push(decoder.decode(decompressed));
          } else {
            // For complex HUFF/CDIC, scan for readable UTF-8 strings
            textParts.push(extractAsciiUtf8Strings(recSlice));
          }
        }
      }

      extractedText = cleanHtmlToText(textParts.join(''));
    }
  } catch (err) {
    console.warn('Binary PalmDOC parsing error, falling back to stream scanner:', err);
  }

  // Fallback: If PalmDOC decoding produced very little text, scan binary for readable text
  if (extractedText.length < 500) {
    const rawString = extractAsciiUtf8Strings(buffer);
    extractedText = cleanHtmlToText(rawString);
  }

  // Split into chapters using accurate line-start chapter patterns with Prologue separation
  const rawChapters = splitNovelIntoChapters(extractedText);

  return {
    title: bookTitle,
    format,
    chapters: rawChapters.length > 0 ? rawChapters : [extractedText],
    rawText: extractedText,
    fileSizeFormatted: formatBytes(file.size)
  };
}

/**
 * PalmDOC LZ77 decompressor
 */
function decompressPalmDoc(src: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const b = src[i++];
    if (b >= 1 && b <= 8) {
      // Literal next b bytes
      for (let j = 0; j < b && i < len; j++) {
        out.push(src[i++]);
      }
    } else if (b <= 0x7f) {
      // Literal byte
      out.push(b);
    } else if (b >= 0xc0) {
      // Space + char
      out.push(32); // ' '
      out.push(b ^ 0x80);
    } else {
      // Distance and length back-reference
      if (i < len) {
        const c = src[i++];
        const distance = ((b & 0x3f) << 3) | (c >> 5);
        const length = (c & 0x1f) + 3;
        const start = out.length - distance;
        for (let k = 0; k < length; k++) {
          if (start + k >= 0 && start + k < out.length) {
            out.push(out[start + k]);
          }
        }
      }
    }
  }
  return new Uint8Array(out);
}

/**
 * Extract readable ASCII / UTF-8 strings from binary buffers
 */
function extractAsciiUtf8Strings(buffer: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = decoder.decode(buffer);
  // Remove non-printable control characters except newline and tab
  return rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
}

/**
 * Tách tiểu thuyết thành các chương riêng biệt với độ chính xác cao
 * Tự động phát hiện và tách riêng phần Lời Tựa / Giới Thiệu (Prologue) nếu có trước Chương 1
 */
export function splitNovelIntoChapters(text: string): string[] {
  if (!text || !text.trim()) return [];
  const trimmed = text.trim();

  // Khớp chính xác tiêu đề chương ở đầu dòng (line-start), hỗ trợ cả Hán văn và Việt/Anh văn
  const chapterLinePattern = /(?:^|\n)[ \t]*(?:第[0-9一二三四五六七八九十百千万零两\s]+[章回节卷集]|Chương\s+[0-9]+|Hồi\s+[0-9]+|Chapter\s+[0-9]+|[0-9]{1,5}[ \t]*[、.][ \t]*(?:第[ \t]*)?[0-9一二三四五六七八九十百千万]*[章回节卷]?)[^\n]*/gim;
  const matches: { index: number; text: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = chapterLinePattern.exec(trimmed)) !== null) {
    matches.push({
      index: match.index,
      text: match[0],
    });
  }

  // Nếu không tìm thấy mẫu tiêu đề nào phù hợp -> chia theo khối 3500 ký tự
  if (matches.length === 0) {
    const rawChapters: string[] = [];
    const chunkSize = 3500;
    for (let i = 0; i < trimmed.length; i += chunkSize) {
      rawChapters.push(trimmed.substring(i, Math.min(i + chunkSize, trimmed.length)).trim());
    }
    return rawChapters.length > 0 ? rawChapters : [trimmed];
  }

  const chapters: string[] = [];

  // Tự động tách riêng phần Lời Tựa / Giới Thiệu (Prologue) nếu có đoạn mở đầu trước Chương 1 >= 60 ký tự
  if (matches[0].index > 0) {
    const prologue = trimmed.substring(0, matches[0].index).trim();
    if (prologue.length >= 60) {
      chapters.push(`Lời Tựa / Giới Thiệu (Prologue)\n\n${prologue}`);
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index : trimmed.length;
    const chapterContent = trimmed.substring(startIndex, endIndex).trim();
    if (chapterContent.length > 0) {
      chapters.push(chapterContent);
    }
  }

  return chapters.length > 0 ? chapters : [trimmed];
}

/**
 * Format bytes to readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Universal Ebook Parser
 * Supports: .txt, .epub, .mobi, .azw3
 */
export async function parseEbookFile(file: File): Promise<ParsedEbook> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'epub') {
    return parseEpubFile(file);
  } else if (ext === 'mobi') {
    return parseMobiOrAzw3File(file, 'mobi');
  } else if (ext === 'azw3' || ext === 'azw') {
    return parseMobiOrAzw3File(file, 'azw3');
  } else {
    // Default TXT parser
    const text = await file.text();
    const chapters = splitNovelIntoChapters(text);

    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      format: 'txt',
      chapters: chapters.length > 0 ? chapters : [text],
      rawText: text,
      fileSizeFormatted: formatBytes(file.size)
    };
  }
}

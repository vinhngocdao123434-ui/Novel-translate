import { NATIVE_PROJECT_FILES } from './src/native-project-data.ts';

let errorCount = 0;
for (const f of NATIVE_PROJECT_FILES) {
  if (f.path.endsWith('.java')) {
    console.log('Validating Java file:', f.path);
    const content = f.content;
    const lines = content.split('\n');

    let inStr = false;
    let stringStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for illegal escapes in Java: \s or \d without being \\s or \\d
      const strMatches = line.match(/"([^"\\]|\\.)*"/g);
      if (strMatches) {
        for (const s of strMatches) {
          const invalidEscapes = s.match(/\\[^btnfr"'\\]/g);
          if (invalidEscapes) {
            for (const esc of invalidEscapes) {
              if (!esc.startsWith('\\u') && !/^\\[0-7]/.test(esc)) {
                console.error(`ILLEGAL JAVA ESCAPE in ${f.path}:${i+1} -> ${esc} in: ${line.trim()}`);
                errorCount++;
              }
            }
          }
        }
      }

      // Check for unclosed string literal across newline
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') {
          let backslashes = 0;
          let k = c - 1;
          while (k >= 0 && line[k] === '\\') {
            backslashes++;
            k--;
          }
          if (backslashes % 2 === 0) {
            inStr = !inStr;
            if (inStr) stringStartLine = i + 1;
          }
        }
      }
      if (inStr) {
        console.error(`UNCLOSED STRING LITERAL starting at line ${stringStartLine} of ${f.path}: ${line}`);
        errorCount++;
        inStr = false;
      }
    }
  }
}

console.log('Java validation completed with errors:', errorCount);
if (errorCount > 0) process.exit(1);

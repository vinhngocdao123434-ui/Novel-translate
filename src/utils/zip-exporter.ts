import JSZip from 'jszip';
import { NATIVE_PROJECT_FILES } from '../native-project-data';

export async function downloadNativeProjectZip(onProgress?: (percent: number) => void): Promise<void> {
  const zip = new JSZip();
  const rootFolder = zip.folder('DroidTranslator-Native');

  for (const file of NATIVE_PROJECT_FILES) {
    rootFolder?.file(file.path, file.content);
  }

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'DroidTranslator-Native-Android-Studio.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

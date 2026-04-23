import { removeBackground, Config } from '@imgly/background-removal';

export type CutoutProgress =
  | { stage: 'downloading'; pct: number }
  | { stage: 'processing' };

export async function removeBackgroundFromDataURI(
  dataURI: string,
  onProgress?: (p: CutoutProgress) => void
): Promise<string> {
  const inputBlob = await (await fetch(dataURI)).blob();

  let downloadDone = false;
  const config: Config = {
    model: 'isnet_quint8',
    device: 'gpu',
    output: { format: 'image/png', quality: 1 },
    progress: (_key, current, total) => {
      if (total <= 0) return;
      const pct = Math.round((current / total) * 100);
      if (pct >= 100 && !downloadDone) {
        downloadDone = true;
        onProgress?.({ stage: 'processing' });
      } else if (!downloadDone) {
        onProgress?.({ stage: 'downloading', pct });
      }
    },
  };

  const resultBlob = await removeBackground(inputBlob, config);
  if (!downloadDone) onProgress?.({ stage: 'processing' });

  return await blobToDataURI(resultBlob);
}

function blobToDataURI(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

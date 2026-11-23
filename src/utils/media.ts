/**
 * Compresses an uploaded image file in-browser into:
 * 1. A crisp thumbnail (~380px max, ~15-25KB) for instant grid rendering.
 * 2. A high-res viewing copy (~1280px max, < 550KB) stored safely in Firestore /media/{id}.
 */
export interface ProcessedImage {
  thumbDataUrl: string;
  fullDataUrl: string;
  mimeType: 'image/webp' | 'image/jpeg';
  width: number;
  height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not decode image: ${file.name}`));
    };
    img.src = objectUrl;
  });
}

function renderResized(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
): { dataUrl: string; mimeType: 'image/webp' | 'image/jpeg'; width: number; height: number } {
  const ratio = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * ratio));
  const height = Math.max(1, Math.round(img.naturalHeight * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Prefer WebP where supported; fallback cleanly to JPEG
  let dataUrl = canvas.toDataURL('image/webp', quality);
  let mimeType: 'image/webp' | 'image/jpeg' = 'image/webp';
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    mimeType = 'image/jpeg';
  }
  return { dataUrl, mimeType, width, height };
}

export async function processUploadedPhoto(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not a supported image file.`);
  }

  const img = await loadImage(file);

  // Thumbnail for fast gallery cards
  const thumb = renderResized(img, 380, 0.72);

  // Full resolution copy, stepping down quality if ever over 720KB
  let full = renderResized(img, 1280, 0.84);
  if (full.dataUrl.length > 720_000) {
    full = renderResized(img, 1080, 0.76);
  }
  if (full.dataUrl.length > 720_000) {
    full = renderResized(img, 900, 0.68);
  }

  return {
    thumbDataUrl: thumb.dataUrl,
    fullDataUrl: full.dataUrl,
    mimeType: full.mimeType,
    width: full.width,
    height: full.height,
  };
}

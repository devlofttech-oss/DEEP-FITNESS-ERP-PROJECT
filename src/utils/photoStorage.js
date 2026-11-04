import { uploadToImageKit } from './imagekit';

/**
 * Shrink an image file and return it as a base64 data URL.
 * Used as the fallback store when ImageKit is unavailable (missing keys, the
 * /api/imagekit-auth function not deployed, plain `vite dev`), so photos keep
 * working out of the box. The result is written straight into the Firestore
 * document, so it must stay well under the 1 MiB document limit.
 */
export function fileToDataUrl(file, { maxDim = 512, maxKB = 120 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read that image file')); };
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const sizeKB = (url) => (url.length * 3) / 4 / 1024;
      let quality = 0.8;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (sizeKB(dataUrl) > maxKB && quality > 0.25) {
        quality = Math.round((quality - 0.1) * 10) / 10;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      if (sizeKB(dataUrl) > 900) { reject(new Error('That image is too large to store. Try a smaller one.')); return; }
      resolve(dataUrl);
    };
    img.src = objectUrl;
  });
}

/**
 * Store a photo and return the value to save on the document.
 *
 * Prefers ImageKit; if ImageKit is not reachable or rejects the upload, falls
 * back to an inline data URL so adding a photo never depends on external
 * setup. Throws only when both paths fail.
 */
export async function uploadPhoto(file, imagekitOptions = { folder: '/gym-erp/members', prefix: 'member' }) {
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file');

  try {
    return await uploadToImageKit(file, imagekitOptions);
  } catch (err) {
    console.warn('ImageKit upload failed, storing the photo inline instead:', err);
    return fileToDataUrl(file);
  }
}

export const uploadMemberPhotoSafe = (file) => uploadPhoto(file, { folder: '/gym-erp/members', prefix: 'member' });
export const uploadGymLogoSafe = (file) => uploadPhoto(file, { folder: '/gym-erp/logos', prefix: 'gym-logo' });

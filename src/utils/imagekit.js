/**
 * Fetch a short-lived upload signature from the serverless auth endpoint.
 * Reports precisely why it failed — the endpoint is missing under plain
 * `vite dev` (no /api functions) and 500s when IMAGEKIT_PRIVATE_KEY is unset.
 */
async function getUploadAuth() {
  let res;
  try {
    res = await fetch('/api/imagekit-auth');
  } catch (err) {
    console.error('ImageKit auth request failed:', err);
    throw new Error('Could not reach the upload service');
  }

  const body = await res.text();
  if (!res.ok) {
    let reason = `${res.status} ${res.statusText}`;
    try { reason = JSON.parse(body).error || reason; } catch { /* not JSON */ }
    console.error('ImageKit auth failed:', reason);
    throw new Error(res.status === 404
      ? 'Upload service /api/imagekit-auth is not deployed'
      : `Upload service error: ${reason}`);
  }

  try {
    return JSON.parse(body);
  } catch {
    // Dev server rewrites unknown /api paths to index.html, which is not JSON.
    throw new Error('Upload service /api/imagekit-auth is not available here');
  }
}

async function compressImage(file) {
  const { default: imageCompression } = await import('browser-image-compression');
  return imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 512,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
}

export async function uploadToImageKit(file, { folder = '/gym-erp/uploads', prefix = 'upload' } = {}) {
  if (!import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY) throw new Error('VITE_IMAGEKIT_PUBLIC_KEY is not set');
  const compressed = await compressImage(file);
  const fileName = `${prefix}-${Date.now()}.jpg`;

  const { token, expire, signature } = await getUploadAuth();

  const formData = new FormData();
  formData.append('file', compressed, fileName);
  formData.append('fileName', fileName);
  formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
  formData.append('signature', signature);
  formData.append('expire', String(expire));
  formData.append('token', token);
  formData.append('folder', folder);

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'ImageKit upload failed');
  }

  const data = await res.json();
  return data.url;
}

export function uploadGymLogo(file) {
  return uploadToImageKit(file, { folder: '/gym-erp/logos', prefix: 'gym-logo' });
}

export function uploadMemberPhoto(file) {
  return uploadToImageKit(file, { folder: '/gym-erp/members', prefix: 'member' });
}

export async function uploadMemberDocument(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `doc-${Date.now()}-${safeName}`;

  const { token, expire, signature } = await getUploadAuth();

  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('fileName', fileName);
  formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
  formData.append('signature', signature);
  formData.append('expire', String(expire));
  formData.append('token', token);
  formData.append('folder', '/gym-erp/documents');

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Document upload failed');
  }
  return (await res.json()).url;
}

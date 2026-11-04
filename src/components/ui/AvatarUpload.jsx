import { useRef, useState } from 'react';
import { uploadMemberPhotoSafe } from '../../utils/photoStorage';
import toast from 'react-hot-toast';

/**
 * Avatar that doubles as a photo uploader.
 * Click the avatar (or the small camera badge) to pick an image; the resulting
 * Cloudinary URL is handed back through onUpload so the caller can persist it.
 */
export default function AvatarUpload({
  photoUrl,
  name,
  onUpload,
  size = 'w-10 h-10',
  rounded = 'rounded-full',
  colors = 'bg-primary-container text-primary',
  title = 'Click to change photo',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setUploading(true);
    try {
      const url = await uploadMemberPhotoSafe(file);
      await onUpload(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error(err?.message || 'Photo upload failed', { duration: 6000 });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="relative shrink-0 group" onClick={(e) => e.stopPropagation()}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        title={title}
        aria-label={photoUrl ? `Change photo for ${name || 'member'}` : `Add photo for ${name || 'member'}`}
        disabled={uploading}
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        className={`${size} ${rounded} ${colors} flex items-center justify-center font-bold overflow-hidden relative cursor-pointer disabled:cursor-wait`}
      >
        {photoUrl
          ? <img src={photoUrl} alt={name || ''} className="w-full h-full object-cover" />
          : <span>{name?.charAt(0) || '?'}</span>
        }
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${
            uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          <span className={`material-symbols-outlined text-[16px] ${uploading ? 'animate-spin' : ''}`}>
            {uploading ? 'progress_activity' : 'photo_camera'}
          </span>
        </span>
      </button>
    </div>
  );
}

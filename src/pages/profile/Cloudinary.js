// ─── Cloudinary avatar / image upload ────────────────────────────────────────
const CLOUDINARY_CLOUD  = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

function resizeImage(file, maxPx) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale  = Math.min(maxPx / img.width, maxPx / img.height, 1);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(blob), 'image/webp', 0.85);
    };
    img.src = url;
  });
}

export async function uploadToCloudinary(file) {
  // Resize to max 256×256 webp before upload — reduces size ~10×
  const resized = await resizeImage(file, 256);
  const fd = new FormData();
  fd.append('file', resized);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'cinimate_avatars');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  // Return CDN URL with on-the-fly optimisation: 256×256 crop, webp, auto quality
  return data.secure_url.replace(
    '/upload/',
    '/upload/w_256,h_256,c_fill,q_auto,f_webp/'
  );
}
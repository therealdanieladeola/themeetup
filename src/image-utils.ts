export async function compressImage(file: File, maxWidth = 1800, quality = 0.82): Promise<{ data: string; contentType: string; filename: string }> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return { data: await readAsDataUrl(file), contentType: file.type || 'application/octet-stream', filename: file.name };
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return { data: await readAsDataUrl(file), contentType: file.type, filename: file.name };
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = file.type === 'image/png' ? 'image/webp' : 'image/webp';
  const data = canvas.toDataURL(type, quality);
  const filename = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return { data, contentType: type, filename };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

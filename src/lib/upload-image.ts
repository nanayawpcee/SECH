// Uploading photos from the portal (featured images, galleries, doctor photos).
//
// Vercel refuses request bodies over 4.5 MB before our code runs, answering with a
// plain-text page; Safari then reports "The string did not match the expected
// pattern" when that is read as JSON. Phone photos are often bigger than that, so
// photos are shrunk in the browser first: at most 2400px on the long side, saved
// as good-quality JPEG (usually well under 1.5 MB). That also converts iPhone HEIC
// photos, which WordPress won't take as they are.

const MAX_SIDE = 2400;
const QUALITY = 0.85;
/** what Vercel lets through, with room for the form around the file */
const SEND_LIMIT = 4 * 1024 * 1024;
/** what we accept from the person before shrinking */
export const PHOTO_PICK_LIMIT = 30 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This photo can’t be opened. Try saving it as a JPG first.")); };
    img.src = url;
  });
}

/** A copy of the photo small enough to upload; small JPGs and PNGs are left as they are. */
export async function preparePhoto(file: File): Promise<File> {
  const smallEnough = file.size <= 1.5 * 1024 * 1024 && /^image\/(jpeg|png|webp|gif)$/.test(file.type);
  if (smallEnough) return file;

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  // JPEG has no transparency: put see-through areas on white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  let quality = QUALITY;
  let blob: Blob | null = null;
  for (let i = 0; i < 4; i++) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= SEND_LIMIT) break;
    quality -= 0.12;
  }
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}

/** Reads a reply that should be JSON, with a clear message when it isn't (e.g. Vercel's "too large" page). */
async function readReply(res: Response): Promise<{ id?: number; url?: string; error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413) return { error: "This photo is too large to upload. Please use a smaller one." };
    if (res.status === 504 || res.status === 502) return { error: "WordPress took too long to answer. Please try again." };
    return { error: `The server answered unexpectedly (${res.status}). Please try again.` };
  }
}

/** Shrinks the photo if needed and uploads it to the WordPress media library. */
export async function uploadPhoto(file: File): Promise<{ id: number; url: string | null }> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > PHOTO_PICK_LIMIT) throw new Error("That photo is over 30 MB. Please use a smaller one.");
  const ready = await preparePhoto(file);
  if (ready.size > SEND_LIMIT) throw new Error("This photo is still too large after shrinking. Please use a smaller one.");
  const form = new FormData();
  form.append("file", ready, ready.name);
  const res = await fetch("/api/media", { method: "POST", body: form });
  const data = await readReply(res);
  if (!res.ok || !data.id) throw new Error(data.error || "The upload failed.");
  return { id: data.id, url: data.url ?? null };
}

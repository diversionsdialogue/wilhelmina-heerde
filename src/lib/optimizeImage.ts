// Client-side image optimization: converts raster images to WebP.
// Leaves SVG, GIF (animation) and unknown types untouched.

const PASSTHROUGH = new Set(["image/svg+xml", "image/gif", "image/webp", "image/avif"]);

export type OptimizedUpload = {
  blob: Blob;
  contentType: string;
  ext: string;
};

export async function optimizeImageForUpload(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<OptimizedUpload> {
  const type = (file.type || "").toLowerCase();
  if (!type.startsWith("image/") || PASSTHROUGH.has(type)) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    return { blob: file, contentType: file.type || "application/octet-stream", ext };
  }

  const maxDim = opts.maxDimension ?? 2000;
  const quality = opts.quality ?? 0.85;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, contentType: file.type, ext };
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, contentType: file.type, ext };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);

  const webp: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", quality),
  );

  if (!webp) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, contentType: file.type, ext };
  }

  // Only use WebP when it actually saves space; otherwise keep the original.
  if (webp.size >= file.size && scale === 1) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, contentType: file.type, ext };
  }

  return { blob: webp, contentType: "image/webp", ext: "webp" };
}

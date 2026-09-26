'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let sharp = null;
try {
  // Prefer globally-cached sharp install (no network install available in this environment).
  sharp = require('/home/claude/.npm-global/lib/node_modules/sharp');
} catch (e) {
  try { sharp = require('sharp'); } catch (e2) { sharp = null; }
}

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads');

/**
 * Save a base64 data-URI image to disk, optionally resizing/optimizing with sharp.
 * Returns the public URL path (e.g. /uploads/products/abc123.jpg).
 */
async function saveDataUrlImage(dataUrl, subdir, opts = {}) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], 'base64');
  const dir = path.join(UPLOAD_ROOT, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.webp`;
  const dest = path.join(dir, filename);

  if (sharp) {
    try {
      let pipeline = sharp(buffer).rotate();
      const maxW = opts.maxWidth || 1200;
      pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
      await pipeline.webp({ quality: opts.quality || 82 }).toFile(dest);
      return `/uploads/${subdir}/${filename}`;
    } catch (e) {
      // fall through to raw save
    }
  }
  // Fallback: save raw bytes with original extension guessed from mime.
  const ext = match[1].split('/')[1].replace('jpeg', 'jpg');
  const fallbackName = filename.replace('.webp', `.${ext}`);
  fs.writeFileSync(path.join(dir, fallbackName), buffer);
  return `/uploads/${subdir}/${fallbackName}`;
}

function deleteUploadedFile(publicPath) {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const full = path.join(__dirname, '..', '..', 'public', publicPath);
  fs.unlink(full, () => {});
}

module.exports = { saveDataUrlImage, deleteUploadedFile, hasSharp: !!sharp };

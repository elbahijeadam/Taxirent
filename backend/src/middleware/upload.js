const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

/* ── Magic bytes (file signature) validation ─────────────────────────────── */
// Guards against MIME spoofing: a malicious file uploaded with Content-Type: image/jpeg
// is still rejected if its actual bytes don't match the declared type.
const FILE_SIGNATURES = {
  'image/jpeg':      [[0xFF, 0xD8, 0xFF]],
  'image/png':       [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function isValidMagicBytes(filePath, mimeType) {
  try {
    const headerLen = 12; // enough for all signatures above
    const buf = Buffer.alloc(headerLen);
    const fd  = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, headerLen, 0);
    fs.closeSync(fd);

    if (mimeType === 'image/webp') {
      // RIFF????WEBP — bytes 0-3 are RIFF, bytes 8-11 are WEBP
      return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
          && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    }

    const sigs = FILE_SIGNATURES[mimeType];
    if (!sigs) return false;
    return sigs.some((sig) => sig.every((byte, i) => buf[i] === byte));
  } catch {
    return false;
  }
}

// Runs after multer has written the file to disk. Deletes the file and rejects
// the request if the actual file content doesn't match the declared MIME type.
const verifyFileIntegrity = (req, res, next) => {
  if (!req.file) return next();
  if (!isValidMagicBytes(req.file.path, req.file.mimetype)) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).json({
      error: 'Contenu du fichier invalide. Le fichier est corrompu ou son type est incorrect.',
    });
  }
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', req.user.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 5MB allowed.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

module.exports = { upload, handleUploadError, verifyFileIntegrity };

'use strict';
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

const FILE_SIGNATURES = {
  'image/jpeg':      [[0xFF, 0xD8, 0xFF]],
  'image/png':       [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

// Guards against MIME spoofing — checks the buffer directly (works with memoryStorage)
function isValidMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false;

  if (mimeType === 'image/webp') {
    return buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
        && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  }

  const sigs = FILE_SIGNATURES[mimeType];
  if (!sigs) return false;
  return sigs.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

const verifyFileIntegrity = (req, res, next) => {
  if (!req.file) return next();
  if (!isValidMagicBytes(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({
      error: 'Contenu du fichier invalide. Le fichier est corrompu ou son type est incorrect.',
    });
  }
  next();
};

/**
 * Upload a file to S3/R2 (when env vars are set) or local disk (dev fallback).
 * Returns { url, key, filename } where `url` is what gets stored in the DB.
 *
 * Required env vars for S3/R2:
 *   S3_ENDPOINT         e.g. https://<accountid>.r2.cloudflarestorage.com
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET           e.g. taxirent-docs
 *   S3_REGION           auto (R2) or us-east-1 (AWS)
 *   S3_PUBLIC_URL       e.g. https://pub-xxx.r2.dev  (public bucket base URL)
 */
async function uploadToStorage(file, userId) {
  const ext = path.extname(file.originalname).toLowerCase() || '.bin';
  const filename = `${uuidv4()}${ext}`;

  if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const key = `documents/${userId}/${filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const base = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '');
    const url = base
      ? `${base}/${key}`
      : `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;

    return { url, key, filename };
  }

  // Local disk fallback (development / no S3 configured)
  const dir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', userId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return { url: filePath, key: `${userId}/${filename}`, filename };
}

// Files are buffered in memory; uploadToStorage handles disk vs cloud
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  },
  limits: { fileSize: MAX_SIZE },
});

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

module.exports = { upload, handleUploadError, verifyFileIntegrity, uploadToStorage };

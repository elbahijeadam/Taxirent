'use strict';
const path = require('path');

const MIME_WEIGHTS = {
  'image/jpeg': 50,
  'image/png':  50,
  'image/webp': 45,
  'application/pdf': 40,
};

const EXT_MAP = {
  'image/jpeg':      ['.jpg', '.jpeg'],
  'image/png':       ['.png'],
  'image/webp':      ['.webp'],
  'application/pdf': ['.pdf'],
};

// Returns 0-100 confidence score based on file metadata
function scoreDocument(file) {
  let score = 0;

  // MIME type (multer already enforces allowed types, but weight images higher)
  score += MIME_WEIGHTS[file.mimetype] ?? 0;

  // File size: documents should be 20 KB – 4 MB
  const kb = file.size / 1024;
  if (kb >= 50 && kb <= 4096) score += 50;   // ideal
  else if (kb >= 10 && kb < 50) score += 30;  // small but acceptable
  else if (kb >= 2 && kb < 10)  score += 10;  // suspiciously small
  // < 2 KB: +0 (probably empty/corrupt)

  return Math.min(100, score);
}

// Returns 'verified' | 'pending' | 'rejected' based on score
function autoStatus(file) {
  const score = scoreDocument(file);
  if (score >= 80) return 'verified';
  if (score >= 30) return 'pending';
  return 'rejected';
}

module.exports = { scoreDocument, autoStatus };

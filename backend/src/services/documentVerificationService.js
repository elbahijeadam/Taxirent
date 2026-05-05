'use strict';
const path = require('path');
const fs   = require('fs');
const { query } = require('../config/database');

const OCR_TIMEOUT_MS = 90_000; // 90 s max per document

/* ── Text sanitisation ───────────────────────────────────────────────────── */
// Strip control characters and HTML-encode <>"' to prevent XSS if rendered in admin UI
function sanitiseText(raw) {
  return String(raw)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .substring(0, 6000);
}

/* ── Composite confidence score ──────────────────────────────────────────── */
// Weighted: 60% OCR quality + 40% match quality. When no match data exists, OCR
// quality alone caps at 0.79 so unmatched docs always land in manual_review.
function computeCompositeScore(ocrConf, matchScore, hasChecks) {
  if (!hasChecks) return parseFloat(Math.min(ocrConf * 0.9, 0.79).toFixed(3));
  return parseFloat((0.60 * ocrConf + 0.40 * matchScore).toFixed(3));
}

/* ── String similarity (Levenshtein) ────────────────────────────────────── */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) dp[i][j] = i === 0 ? j : 0;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function strSim(a, b) {
  if (!a || !b) return 0;
  a = String(a).toUpperCase().trim();
  b = String(b).toUpperCase().trim();
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  return maxLen ? (maxLen - levenshtein(a, b)) / maxLen : 0;
}

function nameSim(user, extracted) {
  if (!extracted) return 0;
  const ext = extracted.toUpperCase().trim();
  const full1 = `${user.first_name} ${user.last_name}`.toUpperCase().trim();
  const full2 = `${user.last_name} ${user.first_name}`.toUpperCase().trim();
  // Also try just the last name against first token of extracted
  const lastOnly = (user.last_name || '').toUpperCase().trim();
  return Math.max(
    strSim(full1, ext),
    strSim(full2, ext),
    strSim(lastOnly, ext.split(/\s+/)[0])
  );
}

/* ── OCR helpers ─────────────────────────────────────────────────────────── */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`OCR timeout after ${ms}ms`)), ms)),
  ]);
}

async function extractFromImage(filePath) {
  try {
    const Tesseract = require('tesseract.js');
    const result = await withTimeout(
      Tesseract.recognize(filePath, 'fra+eng', { logger: () => {} }),
      OCR_TIMEOUT_MS
    );
    const text       = result.data.text || '';
    const confidence = (result.data.confidence || 0) / 100;
    return { text, confidence, method: 'tesseract' };
  } catch (err) {
    console.error('[OCR] Image extraction error:', err.message);
    return { text: '', confidence: 0, method: 'tesseract', error: err.message };
  }
}

function isRemoteUrl(p) {
  return p.startsWith('http://') || p.startsWith('https://');
}

async function getFileBuffer(filePath) {
  if (isRemoteUrl(filePath)) {
    const resp = await fetch(filePath);
    if (!resp.ok) throw new Error(`Download failed: HTTP ${resp.status}`);
    return Buffer.from(await resp.arrayBuffer());
  }
  return fs.readFileSync(filePath);
}

async function extractFromPdf(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer   = await withTimeout(getFileBuffer(filePath), 30_000);
    const data     = await withTimeout(pdfParse(buffer), 30_000);
    const text     = data.text || '';
    // A text-based PDF with real content gets high confidence
    const confidence = text.trim().length > 30 ? 0.80 : 0.15;
    return { text, confidence, method: 'pdf-parse' };
  } catch (err) {
    console.error('[OCR] PDF extraction error:', err.message);
    return { text: '', confidence: 0, method: 'pdf-parse', error: err.message };
  }
}

async function extractTextFromDocument(filePath, mimeType) {
  if (!isRemoteUrl(filePath) && !fs.existsSync(filePath)) {
    return { text: '', confidence: 0, method: 'none', error: 'File not found' };
  }
  return mimeType === 'application/pdf'
    ? extractFromPdf(filePath)
    : extractFromImage(filePath); // Tesseract.recognize() accepts URLs natively
}

/* ── Document data parser ────────────────────────────────────────────────── */
function normalise(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^\w\s./:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trim();
}

function firstDate(text) {
  const pats = [
    /(\d{2})[./\-](\d{2})[./\-](\d{4})/,
    /(\d{4})[./\-](\d{2})[./\-](\d{2})/,
  ];
  for (const p of pats) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function allDates(text) {
  const dates = [];
  const re = /\d{2}[./\-]\d{2}[./\-]\d{4}/g;
  let m;
  while ((m = re.exec(text)) !== null) dates.push(m[0]);
  return dates;
}

function parseDocumentData(rawText, docType) {
  const t = normalise(rawText);
  const out = {};

  // ── Name extraction (shared across all doc types) ────────────────────────
  const namePatterns = [
    /\bNOM\s*(?:DE FAMILLE)?\s*:?\s*([A-Z][A-Z\- ]{1,28})/,
    /\bSURNAME\s*:?\s*([A-Z][A-Z\- ]{1,28})/,
    /^1\.\s+([A-Z][A-Z\-]{1,25})/m,           // DL field 1
    /IDFRA([A-Z]{2,25})<<+/,                   // MRZ
  ];
  const firstNamePatterns = [
    /\bPR[EE]NOM[S]?\s*:?\s*([A-Z][A-Z\- ]{1,28})/,
    /\bGIVEN\s*NAMES?\s*:?\s*([A-Z][A-Z\- ]{1,28})/,
    /^2\.\s+([A-Z][A-Z\- ]{1,28})/m,           // DL field 2
  ];

  for (const p of namePatterns) {
    const m = t.match(p);
    if (m?.[1]?.trim()) { out.lastName = m[1].trim().replace(/\s+/g, ' '); break; }
  }
  for (const p of firstNamePatterns) {
    const m = t.match(p);
    if (m?.[1]?.trim()) { out.firstName = m[1].trim().split(/\s+/)[0]; break; }
  }
  if (out.firstName && out.lastName)  out.fullName = `${out.firstName} ${out.lastName}`;
  else if (out.lastName)              out.fullName = out.lastName;
  else if (out.firstName)             out.fullName = out.firstName;

  // DOB: earliest date found (usually the oldest = birth)
  const dates = allDates(t);
  if (dates.length) out.dateOfBirth = dates[0];

  // ── Doc-type specific parsing ─────────────────────────────────────────────
  switch (docType) {
    case 'driver_license_front':
    case 'driver_license_back': {
      // Expiry = field 4b
      const expiryM = t.match(/4B\.?\s*([\d./\-]{8,10})/);
      if (expiryM) out.expiryDate = expiryM[1];

      // Try to flag expired (quick check — year only)
      if (out.expiryDate) {
        const yearM = out.expiryDate.match(/(\d{4})/);
        if (yearM && Number(yearM[1]) < new Date().getFullYear()) out.expired = true;
      }

      // License number (field 5 on EU DL)
      const licM = t.match(/^5\.\s+([A-Z0-9\-]{6,20})/m) || t.match(/\bN[O°]\s*PERMIS\s*:?\s*([A-Z0-9\-]{6,20})/);
      if (licM) out.documentNumber = licM[1];
      break;
    }

    case 'professional_card_front':
    case 'professional_card_back': {
      const cpiM = t.match(/CPI\s+(\w+)/);
      if (cpiM) out.documentNumber = `CPI ${cpiM[1]}`;
      break;
    }

    case 'vehicle_registration': {
      // Plate number (field A on French carte grise)
      const plateM = t.match(/\bA\.?\s*:?\s*([A-Z]{2}[\s\-]?\d{3}[\s\-]?[A-Z]{2})\b/)
        || t.match(/\b([A-Z]{2}[\s\-]?\d{3}[\s\-]?[A-Z]{2})\b/)
        || t.match(/\b(\d{1,4}[\s]?[A-Z]{2,3}[\s]?\d{2})\b/); // old format
      if (plateM) out.vehiclePlate = plateM[1].replace(/[\s\-]/g, '').toUpperCase();

      // Owner (field B or C.1)
      const ownerM = t.match(/\bB\.?\s*:?\s*([A-Z][A-Z\- ]{2,35})/)
        || t.match(/\bC\.1\.?\s*:?\s*([A-Z][A-Z\- ]{2,35})/);
      if (ownerM) out.fullName = ownerM[1].trim().split(/\s+/).slice(0, 3).join(' ');
      break;
    }

    case 'kbis': {
      const companyM = t.match(/D[EE]NOMINATION\s*(?:SOCIALE)?\s*:?\s*([A-Z0-9 .\-&]{3,60})/)
        || t.match(/RAISON\s*SOCIALE\s*:?\s*([A-Z0-9 .\-&]{3,60})/);
      if (companyM) out.companyName = companyM[1].trim();

      const sirenM = t.match(/SIREN\s*:?\s*(\d[\d ]{7,10}\d)/);
      if (sirenM) out.sirenNumber = sirenM[1].replace(/\s/g, '');
      break;
    }

    case 'license_document': {
      const numM = t.match(/(?:N[O°]|NUM[EE]RO)\s*:?\s*([A-Z0-9\-\/]{4,20})/);
      if (numM) out.documentNumber = numM[1];
      break;
    }
  }

  return out;
}

/* ── Matching engine ─────────────────────────────────────────────────────── */
function compareWithUserProfile(user, extractedData, docType) {
  const checks = [];

  // Name check
  if (extractedData.fullName) {
    const sim  = nameSim(user, extractedData.fullName);
    const pass = sim >= 0.75;
    checks.push({ field: 'name', similarity: parseFloat(sim.toFixed(3)), pass });
  }

  // DOB check (only when user has DOB in profile)
  if (user.date_of_birth && extractedData.dateOfBirth) {
    const userYear = String(user.date_of_birth).substring(0, 4);
    const docYear  = extractedData.dateOfBirth.match(/(\d{4})/)?.[1];
    const pass     = !!(docYear && userYear === docYear);
    checks.push({ field: 'date_of_birth', pass });
  }

  // Vehicle plate check (carte grise)
  if (docType === 'vehicle_registration' && user.license_number && extractedData.vehiclePlate) {
    const sim  = strSim(
      user.license_number.replace(/[\s\-]/g, ''),
      extractedData.vehiclePlate.replace(/[\s\-]/g, '')
    );
    const pass = sim >= 0.85;
    checks.push({ field: 'vehicle_plate', similarity: parseFloat(sim.toFixed(3)), pass });
  }

  const passed  = checks.filter((c) => c.pass).length;
  const overallScore = checks.length ? parseFloat((passed / checks.length).toFixed(3)) : 0.5;

  return {
    checks,
    overallScore,
    matchedFields: checks.filter((c) => c.pass).map((c) => c.field),
    failedFields:  checks.filter((c) => !c.pass).map((c) => c.field),
  };
}

/* ── Decision engine ─────────────────────────────────────────────────────── */
// Thresholds per spec: composite ≥ 0.80 → auto_approved, 0.50–0.79 → manual_review,
// < 0.50 → auto_rejected. Extra guards for unreadable docs and clear fraud signals.
function decide(ocrResult, matchResult, extractedData) {
  const ocrConf    = ocrResult.confidence;
  const hasData    = Object.keys(extractedData).length > 0;
  const hasName    = !!(extractedData.fullName || extractedData.companyName);
  const matchScore = matchResult.overallScore;
  const hasChecks  = matchResult.checks.length > 0;

  // Unreadable document — cannot make any decision
  if (ocrConf < 0.15 || !hasData) {
    return {
      auto_status: 'manual_review', status: 'pending',
      confidence_score: parseFloat(ocrConf.toFixed(3)),
      reason: 'Qualité OCR insuffisante — examen manuel requis',
    };
  }

  // Readable but zero structured data extracted
  if (!hasName) {
    return {
      auto_status: 'manual_review', status: 'pending',
      confidence_score: parseFloat((ocrConf * 0.5).toFixed(3)),
      reason: "Données d'identité non extraites — examen manuel requis",
    };
  }

  // Explicitly expired document
  if (extractedData.expired) {
    return {
      auto_status: 'auto_rejected', status: 'rejected',
      confidence_score: parseFloat((ocrConf * 0.3).toFixed(3)),
      reason: 'Document expiré — renouvellement requis',
    };
  }

  const composite = computeCompositeScore(ocrConf, matchScore, hasChecks);

  // Clear fraud signal: document readable, identity clearly mismatched
  if (ocrConf >= 0.45 && hasChecks && matchScore < 0.35) {
    return {
      auto_status: 'auto_rejected', status: 'rejected',
      confidence_score: composite,
      reason: `Identité non concordante — correspondance ${Math.round(matchScore * 100)}%`,
    };
  }

  // Spec: composite ≥ 0.80 → auto_approved
  if (composite >= 0.80) {
    return {
      auto_status: 'auto_approved', status: 'verified',
      confidence_score: composite,
      reason: `Vérifié automatiquement — score de confiance ${Math.round(composite * 100)}%`,
    };
  }

  // Spec: composite 0.50 – 0.79 → manual_review
  if (composite >= 0.50) {
    return {
      auto_status: 'manual_review', status: 'pending',
      confidence_score: composite,
      reason: `Score intermédiaire ${Math.round(composite * 100)}% — examen manuel recommandé`,
    };
  }

  // Spec: composite < 0.50 → auto_rejected
  return {
    auto_status: 'auto_rejected', status: 'rejected',
    confidence_score: composite,
    reason: `Score insuffisant ${Math.round(composite * 100)}% — document non validé automatiquement`,
  };
}

/* ── Main orchestrator ───────────────────────────────────────────────────── */
async function autoValidateDocument(documentId) {
  const t0  = Date.now();
  const log = { documentId, startTime: new Date().toISOString(), steps: [] };

  try {
    // 1. Load document + joined user
    const docRes = await query(
      `SELECT d.id, d.type, d.file_path, d.mime_type,
              u.first_name, u.last_name, u.date_of_birth, u.license_number
       FROM documents d JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [documentId]
    );
    if (!docRes.rows[0]) { console.error(`[VERIFY] Document ${documentId} not found`); return; }
    const doc = docRes.rows[0];
    log.steps.push({ step: 'load', docType: doc.type });

    // 2. OCR
    const ocrResult = await extractTextFromDocument(doc.file_path, doc.mime_type);
    log.steps.push({
      step: 'ocr', method: ocrResult.method,
      confidence: ocrResult.confidence, textLen: ocrResult.text.length,
      ...(ocrResult.error ? { error: ocrResult.error } : {}),
    });

    // 3. Parse
    const extractedData = parseDocumentData(ocrResult.text, doc.type);
    log.steps.push({ step: 'parse', fields: Object.keys(extractedData) });

    // 4. Match
    const user = {
      first_name:     doc.first_name,
      last_name:      doc.last_name,
      date_of_birth:  doc.date_of_birth,
      license_number: doc.license_number,
    };
    const matchResult = compareWithUserProfile(user, extractedData, doc.type);
    log.steps.push({
      step: 'match', score: matchResult.overallScore,
      matched: matchResult.matchedFields, failed: matchResult.failedFields,
    });

    // 5. Decide
    const decision = decide(ocrResult, matchResult, extractedData);
    log.steps.push({ step: 'decision', ...decision });

    log.endTime    = new Date().toISOString();
    log.durationMs = Date.now() - t0;

    // 6. Persist — store composite confidence_score (not raw OCR confidence)
    await query(
      `UPDATE documents
         SET extracted_text   = $1,
             extracted_data   = $2,
             confidence_score = $3,
             auto_status      = $4,
             status           = $5,
             verification_log = $6
       WHERE id = $7`,
      [
        sanitiseText(ocrResult.text),
        JSON.stringify({ ...extractedData, matchResult }),
        decision.confidence_score,
        decision.auto_status,
        decision.status,
        JSON.stringify(log),
        documentId,
      ]
    );

    console.log(
      `[VERIFY] ${documentId} → ${decision.auto_status}` +
      ` (conf:${ocrResult.confidence.toFixed(2)}, match:${matchResult.overallScore.toFixed(2)})` +
      ` ${Date.now() - t0}ms`
    );
  } catch (err) {
    console.error(`[VERIFY] Fatal error on document ${documentId}:`, err.message);
    log.steps.push({ step: 'fatal_error', message: err.message });
    log.endTime = new Date().toISOString();
    try {
      await query(
        `UPDATE documents SET auto_status = 'manual_review', verification_log = $1 WHERE id = $2`,
        [JSON.stringify(log), documentId]
      );
    } catch {}
  }
}

module.exports = {
  extractTextFromDocument,
  parseDocumentData,
  compareWithUserProfile,
  autoValidateDocument,
  computeCompositeScore,
};

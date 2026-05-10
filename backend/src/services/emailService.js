'use strict';
const https = require('https');
const { query } = require('../config/database');

const RESEND_READY = !!(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FROM_EMAIL   = process.env.EMAIL_FROM || 'Taxirent <onboarding@resend.dev>';

async function sendMail({ to, subject, html, type, userId, reservationId, attachments }) {
  console.log(`[EMAIL] Envoi à ${to} | Resend: ${RESEND_READY}`);

  if (!RESEND_READY) {
    console.warn('[EMAIL] RESEND_API_KEY manquant — email non envoyé');
    return;
  }

  const body = JSON.stringify({ from: FROM_EMAIL, to, subject, html });

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[EMAIL] Envoyé avec succès à ${to}`);
          resolve(JSON.parse(data));
        } else {
          console.error(`[EMAIL] Erreur Resend ${res.statusCode}:`, data);
          reject(new Error(`Resend error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Resend timeout')); });
    req.write(body);
    req.end();
  });

  await query(
    `INSERT INTO email_logs (user_id, reservation_id, type, recipient, subject, status)
     VALUES ($1, $2, $3, $4, $5, 'sent')`,
    [userId || null, reservationId || null, type, to, subject]
  ).catch(() => {});
}

const formatDate  = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const formatPrice = (n) => parseFloat(n).toFixed(2).replace('.', ',') + ' €';

const baseStyle = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#fff;`;
const header    = `<div style="background:#1a1a2e;padding:28px 32px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:1px;">TAXI<span style="color:#16a34a;font-weight:300;">RENT</span></h1><p style="color:#a0aec0;margin:6px 0 0;font-size:13px;">Location de véhicules équipés taxi</p></div>`;
const footer    = `<div style="background:#f7fafc;padding:14px;text-align:center;color:#a0aec0;font-size:11px;">Taxirent EURL — Capital 100 € — SIREN 921 300 190 RCS Évry — taxirent.contact@gmail.com</div>`;

const sendOtpEmail = async ({ to, firstName, code }) => {
  console.log(`[EMAIL OTP] to: ${to} | code: ${code}`);
  try {
    await sendMail({
      to,
      subject: `${code} — Votre code de vérification Taxirent`,
      type: 'otp_email',
      html: `<div style="${baseStyle}">${header}
        <div style="padding:32px;">
          <h2 style="color:#1a1a2e;">Bonjour ${firstName},</h2>
          <p style="color:#4a5568;line-height:1.6;">Voici votre code de vérification. Il est valable <strong>10 minutes</strong>.</p>
          <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="font-size:48px;font-weight:800;letter-spacing:12px;color:#1a1a2e;margin:0;font-family:monospace;">${code}</p>
          </div>
          <p style="color:#718096;font-size:13px;">Si vous n'avez pas créé de compte Taxirent, ignorez cet email.</p>
        </div>${footer}</div>`,
    });
  } catch (err) {
    console.error('[EMAIL] OTP send failed:', err.message);
  }
};

const sendOtpSms = async ({ to, firstName, code }) => {
  console.log(`[SMS] SMS désactivé — to: ${to} | code: ${code}`);
  return;

  try {
    // Placeholder — SMS via Twilio désactivé, réactivation prévue
    void { to, firstName, code };
  } catch (err) {
    console.error(`[SMS] Failed:`, err.message);
  }
};

const sendWelcomeEmail = async (user) => {
  await sendMail({
    to: user.email, subject: 'Bienvenue chez Taxirent !', type: 'welcome', userId: user.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;">Bienvenue, ${user.first_name} !</h2>
        <p style="color:#4a5568;line-height:1.6;">Votre compte a été créé avec succès. Vous pouvez maintenant parcourir notre flotte et effectuer vos réservations.</p>
        <a href="${FRONTEND_URL}/cars" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Voir les véhicules disponibles</a>
      </div>${footer}</div>`,
  });
};

const sendReservationEmail = async (user, reservation, car) => {
  await sendMail({
    to: user.email,
    subject: `Réservation enregistrée — ${car.make} ${car.model}`,
    type: 'reservation_created', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;">Votre demande est enregistrée !</h2>
        <div style="background:#f7fafc;border-radius:8px;padding:20px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#2d3748;">${car.make} ${car.model} ${car.year}</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:600;color:#2d3748;">${reservation.id.slice(0,8).toUpperCase()}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Début</td><td>${formatDate(reservation.start_date)}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Fin</td><td>${formatDate(reservation.end_date)}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Durée</td><td>${reservation.total_days} jour(s)</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant</td><td style="font-weight:700;color:#16a34a;font-size:18px;">${formatPrice(reservation.total_amount)}</td></tr>
          </table>
        </div>
        <a href="${FRONTEND_URL}/reservations/${reservation.id}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Gérer ma réservation</a>
      </div>${footer}</div>`,
  });
};

const sendAdminNotificationEmail = async (user, reservation, car) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'elbahijeadam@gmail.com';
  if (!adminEmail) return;
  await sendMail({
    to: adminEmail,
    subject: `[Admin] Nouvelle réservation — ${user.first_name} ${user.last_name}`,
    type: 'admin_notification', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}"><div style="padding:24px;">
      <h2>Nouvelle réservation reçue</h2>
      <p><strong>Client:</strong> ${user.first_name} ${user.last_name} (${user.email})</p>
      <p><strong>Véhicule:</strong> ${car.make} ${car.model} ${car.year}</p>
      <p><strong>Dates:</strong> ${formatDate(reservation.start_date)} → ${formatDate(reservation.end_date)}</p>
      <p><strong>Montant:</strong> ${formatPrice(reservation.total_amount)}</p>
      <p style="color:#e53e3e;">⚠️ Vérifiez les documents du client avant confirmation.</p>
      <a href="${FRONTEND_URL}/admin/reservations" style="display:inline-block;background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Voir dans l'admin</a>
    </div></div>`,
  });
};

const REASON_LABELS = { engine_failure: 'Panne moteur', accident: 'Accident de la route', body_damage: 'Dommages carrosserie' };

const sendContractEmail = async (user, reservation, car, contractHtml) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Contrat de location — Réf. ${refId} — ${car.make} ${car.model}`,
    type: 'contract', userId: user.id, reservationId: reservation.id,
    attachments: [{ filename: `contrat-${refId}.html`, content: contractHtml, contentType: 'text/html' }],
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;">Bonjour ${user.first_name},</h2>
        <p style="color:#4a5568;line-height:1.6;">Votre contrat de location est prêt. Téléchargez-le depuis votre espace client.</p>
        <div style="background:#f7fafc;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Motif</td><td>${REASON_LABELS[reservation.reason] || reservation.reason}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Prise en charge</td><td>${formatDate(reservation.start_date)}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Restitution</td><td>${formatDate(reservation.end_date)}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant</td><td style="font-weight:700;color:#16a34a;font-size:18px;">${formatPrice(reservation.total_amount)}</td></tr>
          </table>
        </div>
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px;margin:16px 0;">
          <p style="margin:0;color:#856404;font-size:13px;"><strong>Important :</strong> Présentez-vous avec vos documents originaux : permis, carte professionnelle, KBIS et pièce d'identité.</p>
        </div>
      </div>${footer}</div>`,
  });
};

const sendCancellationEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Annulation confirmée — Réf. ${refId}`,
    type: 'reservation_cancelled', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;">Bonjour ${user.first_name},</h2>
        <p style="color:#4a5568;line-height:1.6;">Votre réservation a été annulée avec succès.</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Dates prévues</td><td>${formatDate(reservation.start_date)} → ${formatDate(reservation.end_date)}</td></tr>
          </table>
        </div>
        <p style="color:#718096;font-size:13px;">Si vous n'êtes pas à l'origine de cette annulation, contactez-nous immédiatement.</p>
        <a href="${FRONTEND_URL}/cars" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Voir les véhicules disponibles</a>
      </div>${footer}</div>`,
  });
};

const sendRefundEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Remboursement en cours — Réf. ${refId}`,
    type: 'reservation_refunded', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;">Bonjour ${user.first_name},</h2>
        <p style="color:#4a5568;line-height:1.6;">Votre réservation a été annulée et un remboursement complet a été initié.</p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant remboursé</td><td style="font-weight:700;color:#16a34a;">${formatPrice(reservation.total_amount)}</td></tr>
          </table>
        </div>
        <p style="color:#718096;font-size:13px;">Le remboursement apparaîtra sur votre relevé bancaire sous 5 à 10 jours ouvrés selon votre banque.</p>
        <a href="${FRONTEND_URL}/cars" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Voir les véhicules disponibles</a>
      </div>${footer}</div>`,
  });
};

const sendPaymentConfirmationEmail = async (user, reservation, car) => {
  await sendMail({
    to: user.email,
    subject: `Paiement reçu — ${reservation.id.slice(0,8).toUpperCase()}`,
    type: 'payment_confirmed', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;text-align:center;">
        <span style="font-size:48px;">✅</span>
        <h2 style="color:#16a34a;">Paiement confirmé !</h2>
        <p style="color:#4a5568;">Bonjour ${user.first_name}, votre paiement pour le <strong>${car.make} ${car.model}</strong> a bien été reçu.</p>
        <p style="color:#718096;font-size:13px;margin-top:16px;">Présentez-vous le jour de la prise en charge avec vos documents originaux.</p>
      </div>${footer}</div>`,
  });
};

const sendPasswordResetEmail = async (user, code) => {
  console.log(`[EMAIL PASSWORD RESET] to: ${user.email} | code: ${code}`);
  try {
    await sendMail({
      to: user.email,
      subject: `${code} — Réinitialisation de votre mot de passe Taxirent`,
      type: 'password_reset',
      html: `<div style="${baseStyle}">${header}
        <div style="padding:32px;">
          <h2 style="color:#1a1a2e;">Bonjour ${user.first_name},</h2>
          <p style="color:#4a5568;line-height:1.6;">Vous avez demandé la réinitialisation de votre mot de passe. Utilisez ce code (valable <strong>10 minutes</strong>) :</p>
          <div style="background:#fef3c7;border:2px dashed #d97706;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="font-size:48px;font-weight:800;letter-spacing:12px;color:#1a1a2e;margin:0;font-family:monospace;">${code}</p>
          </div>
          <p style="color:#718096;font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.</p>
        </div>${footer}</div>`,
    });
  } catch (err) {
    console.error('[EMAIL] Password reset send failed:', err.message);
  }
};

const sendNewPasswordEmail = async (user, tempPassword) => {
  console.log(`[EMAIL NEW PASSWORD] to: ${user.email}`);
  try {
    await sendMail({
      to: user.email,
      subject: 'Votre nouveau mot de passe Taxirent',
      type: 'new_password',
      html: `<div style="${baseStyle}">${header}
        <div style="padding:32px;">
          <h2 style="color:#1a1a2e;">Bonjour ${user.first_name},</h2>
          <p style="color:#4a5568;line-height:1.6;">Un administrateur a réinitialisé votre mot de passe. Voici votre mot de passe temporaire :</p>
          <div style="background:#f0f9ff;border:2px dashed #0284c7;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="font-size:28px;font-weight:800;letter-spacing:4px;color:#1a1a2e;margin:0;font-family:monospace;">${tempPassword}</p>
          </div>
          <p style="color:#4a5568;line-height:1.6;">Connectez-vous avec ce mot de passe et modifiez-le immédiatement depuis votre profil.</p>
          <p style="color:#718096;font-size:13px;">Pour toute question, contactez-nous à taxirent.contact@gmail.com.</p>
        </div>${footer}</div>`,
    });
  } catch (err) {
    console.error('[EMAIL] New password send failed:', err.message);
  }
};

const sendReservationConfirmedEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Réservation confirmée — Réf. ${refId}`,
    type: 'reservation_confirmed', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><span style="font-size:48px;">✅</span></div>
        <h2 style="color:#16a34a;text-align:center;">Réservation confirmée !</h2>
        <p style="color:#4a5568;line-height:1.6;">Bonjour ${user.first_name}, votre réservation a été confirmée par notre équipe.</p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Prise en charge</td><td>${formatDate(reservation.start_date)}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Restitution</td><td>${formatDate(reservation.end_date)}</td></tr>
          </table>
        </div>
        ${reservation.admin_note ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px;margin:16px 0;"><p style="margin:0;color:#854d0e;font-size:13px;"><strong>Note :</strong> ${reservation.admin_note}</p></div>` : ''}
        <p style="color:#4a5568;font-size:13px;">Présentez-vous avec vos documents originaux : permis, carte professionnelle, KBIS et pièce d'identité.</p>
        <a href="${FRONTEND_URL}/reservations/${reservation.id}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Voir ma réservation</a>
      </div>${footer}</div>`,
  });
};

const sendReservationActiveEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Location en cours — ${car.make} ${car.model} — Réf. ${refId}`,
    type: 'reservation_active', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><span style="font-size:48px;">🚗</span></div>
        <h2 style="color:#1a1a2e;text-align:center;">Votre location a démarré</h2>
        <p style="color:#4a5568;line-height:1.6;">Bonjour ${user.first_name}, votre véhicule a été pris en charge. Bonne route !</p>
        <div style="background:#f7fafc;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} — ${car.license_plate}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Restitution prévue</td><td style="font-weight:600;">${formatDate(reservation.end_date)}</td></tr>
          </table>
        </div>
        <p style="color:#718096;font-size:13px;">En cas d'incident, contactez-nous immédiatement à taxirent.contact@gmail.com.</p>
      </div>${footer}</div>`,
  });
};

const sendReservationCompletedEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Location terminée — Merci ! — Réf. ${refId}`,
    type: 'reservation_completed', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><span style="font-size:48px;">🏁</span></div>
        <h2 style="color:#1a1a2e;text-align:center;">Location terminée — Merci !</h2>
        <p style="color:#4a5568;line-height:1.6;">Bonjour ${user.first_name}, votre location est maintenant clôturée. Merci de votre confiance !</p>
        <div style="background:#f7fafc;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Durée</td><td>${reservation.total_days} jour(s)</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant total</td><td style="font-weight:700;color:#16a34a;">${formatPrice(reservation.total_amount)}</td></tr>
          </table>
        </div>
        <a href="${FRONTEND_URL}/cars" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Réserver à nouveau</a>
      </div>${footer}</div>`,
  });
};

const sendAdminCancellationEmail = async (user, reservation, car, adminNote) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Réservation annulée — Réf. ${refId}`,
    type: 'reservation_cancelled_admin', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#1a1a2e;">Bonjour ${user.first_name},</h2>
        <p style="color:#4a5568;line-height:1.6;">Votre réservation a été annulée par notre équipe.</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Dates prévues</td><td>${formatDate(reservation.start_date)} → ${formatDate(reservation.end_date)}</td></tr>
          </table>
        </div>
        ${adminNote ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px;margin:16px 0;"><p style="margin:0;color:#854d0e;font-size:13px;"><strong>Motif :</strong> ${adminNote}</p></div>` : ''}
        <p style="color:#718096;font-size:13px;">Pour toute question, contactez-nous à taxirent.contact@gmail.com.</p>
        <a href="${FRONTEND_URL}/cars" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Voir les véhicules disponibles</a>
      </div>${footer}</div>`,
  });
};

const sendDepositAuthorizedEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Dépôt de garantie autorisé — Réf. ${refId}`,
    type: 'deposit_authorized', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><span style="font-size:48px;">🔒</span></div>
        <h2 style="color:#1a1a2e;text-align:center;">Dépôt de garantie autorisé</h2>
        <p style="color:#4a5568;line-height:1.6;">Bonjour ${user.first_name}, votre dépôt de garantie a bien été autorisé. Aucun montant ne sera prélevé sauf en cas de dommages.</p>
        <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant bloqué</td><td style="font-weight:600;">${formatPrice(reservation.deposit_amount)}</td></tr>
          </table>
        </div>
        <p style="color:#718096;font-size:13px;">Ce montant sera automatiquement libéré à la fin de votre location sans dommages.</p>
        <a href="${FRONTEND_URL}/reservations/${reservation.id}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Voir ma réservation</a>
      </div>${footer}</div>`,
  });
};

const sendDepositCapturedEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Dépôt de garantie prélevé — Réf. ${refId}`,
    type: 'deposit_captured', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <h2 style="color:#dc2626;">Prélèvement du dépôt de garantie</h2>
        <p style="color:#4a5568;line-height:1.6;">Bonjour ${user.first_name}, suite à des dommages constatés sur le véhicule, votre dépôt de garantie a été prélevé.</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant prélevé</td><td style="font-weight:700;color:#dc2626;">${formatPrice(reservation.deposit_amount)}</td></tr>
          </table>
        </div>
        <p style="color:#718096;font-size:13px;">Pour contester ce prélèvement ou obtenir plus d'informations, contactez-nous à taxirent.contact@gmail.com.</p>
      </div>${footer}</div>`,
  });
};

const sendDepositReleasedEmail = async (user, reservation, car) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Dépôt de garantie libéré — Réf. ${refId}`,
    type: 'deposit_released', userId: user.id, reservationId: reservation.id,
    html: `<div style="${baseStyle}">${header}
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;"><span style="font-size:48px;">✅</span></div>
        <h2 style="color:#16a34a;text-align:center;">Dépôt de garantie libéré</h2>
        <p style="color:#4a5568;line-height:1.6;">Bonjour ${user.first_name}, aucun dommage n'ayant été constaté, votre dépôt de garantie a été entièrement libéré.</p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;">Référence</td><td style="font-weight:700;">${refId}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Véhicule</td><td>${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;">Montant libéré</td><td style="font-weight:700;color:#16a34a;">${formatPrice(reservation.deposit_amount)}</td></tr>
          </table>
        </div>
        <p style="color:#718096;font-size:13px;">Merci pour votre confiance. À très bientôt chez Taxirent !</p>
        <a href="${FRONTEND_URL}/cars" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Réserver à nouveau</a>
      </div>${footer}</div>`,
  });
};

const SMS_READY = false;

module.exports = {
  sendOtpEmail, sendOtpSms, sendWelcomeEmail,
  sendReservationEmail, sendAdminNotificationEmail,
  sendPaymentConfirmationEmail, sendContractEmail,
  sendCancellationEmail, sendRefundEmail,
  sendPasswordResetEmail, sendNewPasswordEmail,
  sendReservationConfirmedEmail, sendReservationActiveEmail,
  sendReservationCompletedEmail, sendAdminCancellationEmail,
  sendDepositAuthorizedEmail, sendDepositCapturedEmail, sendDepositReleasedEmail,
  SMS_READY,
};

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { query } = require('../config/database');

const twilioClient = (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  !process.env.TWILIO_ACCOUNT_SID.startsWith('your_')
)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const SMTP_READY = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const transporter = SMTP_READY
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function sendMail({ to, subject, html, type, userId, reservationId, attachments }) {
  if (!transporter) { console.error('[EMAIL] SMTP non configuré — variables manquantes'); throw new Error('SMTP not configured'); }
  console.log(`[EMAIL] Tentative envoi à ${to} | SMTP: ${process.env.SMTP_HOST} | User: ${process.env.SMTP_USER}`);

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Car Rental <noreply@carrental.com>',
    to, subject, html,
    ...(attachments ? { attachments } : {}),
  });

  await query(
    `INSERT INTO email_logs (user_id, reservation_id, type, recipient, subject, status)
     VALUES ($1, $2, $3, $4, $5, 'sent')`,
    [userId || null, reservationId || null, type, to, subject]
  ).catch(() => {});

  return info;
}

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const formatPrice = (n) => parseFloat(n).toFixed(2).replace('.', ',') + ' €';

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 600px; margin: 0 auto; background: #fff;
`;

const sendOtpEmail = async ({ to, firstName, code }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV EMAIL OTP] to: ${to} | code: ${code}`);
  }

  if (!SMTP_READY) return;

  try {
    await sendMail({
      to,
      subject: `${code} — Votre code de vérification AutoRent`,
      type: 'otp_email',
      html: `
      <div style="${baseStyle}">
        <div style="background: #1a1a2e; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">AutoRent</h1>
          <p style="color: #a0aec0; margin: 8px 0 0;">Vérification d'email</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1a1a2e;">Bonjour ${firstName},</h2>
          <p style="color: #4a5568; line-height: 1.6;">
            Voici votre code de vérification. Il est valable <strong>10 minutes</strong>.
          </p>
          <div style="background: #f7fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #1a1a2e; margin: 0; font-family: monospace;">${code}</p>
          </div>
          <p style="color: #718096; font-size: 14px;">
            Si vous n'avez pas créé de compte AutoRent, ignorez cet email.
          </p>
        </div>
        <div style="background: #f7fafc; padding: 16px; text-align: center; color: #718096; font-size: 12px;">
          AutoRent — Ne partagez jamais ce code
        </div>
      </div>`,
    });
  } catch (err) {
    console.error('[EMAIL] OTP send failed:', err.message);
  }
};

const sendOtpSms = async ({ to, firstName, code }) => {
  const phone = (to || '').trim().replace(/\s+/g, '');
  if (!phone) {
    console.warn('[SMS] Skipped: empty phone number');
    return;
  }

  const message = `Votre code AutoRent est : ${code}. Il expire dans 10 minutes. Ne le partagez jamais.`;

  if (!twilioClient) {
    console.log(`[DEV SMS OTP] to: ${phone} | code: ${code}`);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error(`[SMS] Failed to send to ${phone}:`, err.message);
  }
};

const sendWelcomeEmail = async (user) => {
  await sendMail({
    to: user.email,
    subject: 'Bienvenue chez AutoRent !',
    type: 'welcome',
    userId: user.id,
    html: `
    <div style="${baseStyle}">
      <div style="background: #1a1a2e; padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">AutoRent</h1>
        <p style="color: #a0aec0; margin: 8px 0 0;">Location de véhicules</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1a1a2e;">Bienvenue, ${user.first_name} !</h2>
        <p style="color: #4a5568; line-height: 1.6;">Votre compte a été créé avec succès. Vous pouvez maintenant parcourir notre flotte et effectuer vos réservations.</p>
        <a href="${FRONTEND_URL}/cars" style="display: inline-block; background: #e53e3e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Voir les véhicules disponibles</a>
        <p style="color: #718096; font-size: 14px; margin-top: 24px;">N'oubliez pas de compléter votre profil et d'uploader vos documents pour accélérer vos futures réservations.</p>
      </div>
      <div style="background: #f7fafc; padding: 16px; text-align: center; color: #718096; font-size: 12px;">
        AutoRent — Votre partenaire de confiance pour la location de véhicules
      </div>
    </div>`,
  });
};

const sendReservationEmail = async (user, reservation, car) => {
  await sendMail({
    to: user.email,
    subject: `Réservation confirmée — ${car.make} ${car.model}`,
    type: 'reservation_created',
    userId: user.id,
    reservationId: reservation.id,
    html: `
    <div style="${baseStyle}">
      <div style="background: #1a1a2e; padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">AutoRent</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1a1a2e;">Votre réservation est enregistrée !</h2>
        <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px; color: #2d3748;">${car.make} ${car.model} ${car.year}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #718096;">Référence</td><td style="padding: 6px 0; font-weight: 600; color: #2d3748;">${reservation.id.slice(0, 8).toUpperCase()}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Début</td><td style="padding: 6px 0; color: #2d3748;">${formatDate(reservation.start_date)}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Fin</td><td style="padding: 6px 0; color: #2d3748;">${formatDate(reservation.end_date)}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Durée</td><td style="padding: 6px 0; color: #2d3748;">${reservation.total_days} jour(s)</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Montant total</td><td style="padding: 6px 0; font-weight: 700; color: #e53e3e; font-size: 18px;">${formatPrice(reservation.total_amount)}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Statut paiement</td><td style="padding: 6px 0; color: #2d3748;">${reservation.payment_status}</td></tr>
          </table>
        </div>
        <p style="color: #4a5568; line-height: 1.6;">Pour finaliser votre réservation, veuillez procéder au paiement via votre espace client.</p>
        <a href="${FRONTEND_URL}/reservations/${reservation.id}" style="display: inline-block; background: #e53e3e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Gérer ma réservation</a>
        <p style="color: #718096; font-size: 13px; margin-top: 24px;">Vos documents (permis de conduire, pièce d'identité) seront vérifiés avant la remise des clés.</p>
      </div>
      <div style="background: #f7fafc; padding: 16px; text-align: center; color: #718096; font-size: 12px;">
        AutoRent — Votre partenaire de confiance
      </div>
    </div>`,
  });
};

const sendAdminNotificationEmail = async (user, reservation, car) => {
  const adminEmail = process.env.SMTP_USER;
  if (!adminEmail) return;

  await sendMail({
    to: adminEmail,
    subject: `[Admin] Nouvelle réservation — ${user.first_name} ${user.last_name}`,
    type: 'admin_notification',
    userId: user.id,
    reservationId: reservation.id,
    html: `
    <div style="${baseStyle}">
      <div style="padding: 24px;">
        <h2>Nouvelle réservation reçue</h2>
        <p><strong>Client:</strong> ${user.first_name} ${user.last_name} (${user.email})</p>
        <p><strong>Véhicule:</strong> ${car.make} ${car.model} ${car.year}</p>
        <p><strong>Dates:</strong> ${formatDate(reservation.start_date)} → ${formatDate(reservation.end_date)}</p>
        <p><strong>Montant:</strong> ${formatPrice(reservation.total_amount)}</p>
        <p><strong>ID réservation:</strong> ${reservation.id}</p>
        <p style="color: #e53e3e;">⚠️ Vérifiez les documents du client avant confirmation.</p>
        <a href="${FRONTEND_URL}/admin/reservations/${reservation.id}" style="display: inline-block; background: #1a1a2e; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Voir dans l'admin</a>
      </div>
    </div>`,
  });
};

const REASON_LABELS = {
  engine_failure: 'Panne moteur',
  accident: 'Accident de la route',
  body_damage: 'Dommages carrosserie',
};

const sendContractEmail = async (user, reservation, car, contractHtml) => {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  await sendMail({
    to: user.email,
    subject: `Contrat de location — Réf. ${refId} — ${car.make} ${car.model}`,
    type: 'contract',
    userId: user.id,
    reservationId: reservation.id,
    html: `
    <div style="${baseStyle}">
      <div style="background: #1a1a2e; padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">AutoRent</h1>
        <p style="color: #a0aec0; margin: 8px 0 0;">Votre contrat de location est prêt</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1a1a2e;">Bonjour ${user.first_name},</h2>
        <p style="color: #4a5568; line-height: 1.6; margin: 12px 0;">
          Votre demande de location a bien été enregistrée. Veuillez trouver ci-dessous le récapitulatif
          et votre contrat de location en pièce jointe.
        </p>
        <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #718096; width: 45%;">Référence</td><td style="padding: 6px 0; font-weight: 700; color: #2d3748;">${refId}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Véhicule</td><td style="padding: 6px 0; color: #2d3748;">${car.make} ${car.model} ${car.year}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Motif</td><td style="padding: 6px 0; color: #2d3748;">${REASON_LABELS[reservation.reason] || reservation.reason}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Prise en charge</td><td style="padding: 6px 0; color: #2d3748;">${formatDate(reservation.start_date)}${reservation.pickup_time ? ' à ' + reservation.pickup_time : ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Restitution</td><td style="padding: 6px 0; color: #2d3748;">${formatDate(reservation.end_date)}${reservation.return_time ? ' à ' + reservation.return_time : ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Durée</td><td style="padding: 6px 0; color: #2d3748;">${reservation.total_days} jour(s)</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Véhicule immobilisé</td><td style="padding: 6px 0; color: #2d3748;">${reservation.vehicle_location || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #718096;">Montant total</td><td style="padding: 6px 0; font-weight: 700; color: #e53e3e; font-size: 18px;">${formatPrice(reservation.total_amount)}</td></tr>
          </table>
        </div>
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Important :</strong> Veuillez vous présenter le jour de la prise en charge avec vos documents originaux :
            permis de conduire, carte professionnelle, KBIS et pièce d'identité.
          </p>
        </div>
        <p style="color: #718096; font-size: 13px;">Le contrat complet est en pièce jointe de cet email.</p>
      </div>
      <div style="background: #f7fafc; padding: 16px; text-align: center; color: #718096; font-size: 12px;">
        AutoRent — Votre partenaire de confiance pour la location de véhicules professionnelle
      </div>
    </div>`,
    attachments: [
      {
        filename: `contrat-location-${refId}.html`,
        content: contractHtml,
        contentType: 'text/html',
      },
    ],
  });
};

const sendPaymentConfirmationEmail = async (user, reservation, car) => {
  await sendMail({
    to: user.email,
    subject: `Paiement reçu — Réservation ${reservation.id.slice(0, 8).toUpperCase()}`,
    type: 'payment_confirmed',
    userId: user.id,
    reservationId: reservation.id,
    html: `
    <div style="${baseStyle}">
      <div style="background: #1a1a2e; padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">AutoRent</h1>
      </div>
      <div style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">✅</span>
          <h2 style="color: #38a169; margin: 8px 0;">Paiement confirmé !</h2>
        </div>
        <p style="color: #4a5568;">Bonjour ${user.first_name}, votre paiement pour la réservation du <strong>${car.make} ${car.model}</strong> a bien été reçu.</p>
        <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #276749;"><strong>Réservation:</strong> ${reservation.id.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 8px 0 0; color: #276749;"><strong>Dates:</strong> ${formatDate(reservation.start_date)} → ${formatDate(reservation.end_date)}</p>
        </div>
        <p style="color: #4a5568; font-size: 14px;">Présentez-vous le jour de la prise en charge avec vos documents originaux. Bon voyage !</p>
      </div>
    </div>`,
  });
};

module.exports = { sendOtpEmail, sendOtpSms, sendWelcomeEmail, sendReservationEmail, sendAdminNotificationEmail, sendPaymentConfirmationEmail, sendContractEmail };

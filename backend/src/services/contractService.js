'use strict';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const formatPrice = (n) =>
  parseFloat(n || 0).toFixed(2).replace('.', ',') + ' €';

const REASON_LABELS = {
  engine_failure: 'Panne moteur',
  accident: 'Accident de la route',
  body_damage: 'Dommages carrosserie',
};

function generateContractHtml({ reservation, user, car }) {
  const refId = reservation.id.slice(0, 8).toUpperCase();
  const reason = REASON_LABELS[reservation.reason] || reservation.reason || 'Non précisé';
  const pickupTime = reservation.pickup_time || '09:00';
  const returnTime = reservation.return_time || '18:00';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contrat de location — Réf. ${refId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a202c; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #e53e3e; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 26px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
  .logo span { color: #e53e3e; }
  .ref-box { text-align: right; }
  .ref-box .ref { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .ref-box .date { font-size: 12px; color: #718096; margin-top: 4px; }
  .badge { display: inline-block; background: #e53e3e; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #718096; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .section { margin-bottom: 24px; }
  .section-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .field { margin-bottom: 10px; }
  .field:last-child { margin-bottom: 0; }
  .field label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #a0aec0; display: block; margin-bottom: 2px; }
  .field value { font-size: 13px; color: #1a202c; font-weight: 500; }
  table.price { width: 100%; border-collapse: collapse; }
  table.price td { padding: 8px 0; font-size: 13px; }
  table.price td:last-child { text-align: right; font-weight: 600; }
  table.price tr.total td { font-size: 15px; font-weight: 700; color: #e53e3e; border-top: 2px solid #e2e8f0; padding-top: 12px; }
  .conditions { background: #fff8f0; border: 1px solid #fbd38d; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .conditions h2 { border-bottom-color: #fbd38d; color: #975a16; }
  .conditions p { font-size: 12px; color: #744210; line-height: 1.7; margin-bottom: 8px; }
  .conditions p:last-child { margin-bottom: 0; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
  .sig-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .sig-box .title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 8px; }
  .sig-line { border-bottom: 1px solid #a0aec0; margin-top: 60px; }
  .sig-name { font-size: 11px; color: #a0aec0; margin-top: 4px; }
  .footer { text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; }
  .highlight { color: #e53e3e; }
  @media print {
    .page { padding: 20px; }
    body { font-size: 12px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">Auto<span>Rent</span></div>
      <div style="font-size:12px;color:#718096;margin-top:4px;">Location de véhicules professionnelle</div>
    </div>
    <div class="ref-box">
      <div class="badge">Contrat de location</div>
      <div class="ref">Réf. ${refId}</div>
      <div class="date">Établi le ${formatDate(new Date().toISOString())}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="grid-2">
    <div class="section">
      <h2>Le loueur</h2>
      <div class="section-box">
        <div class="field"><label>Société</label><value>AutoRent SAS</value></div>
        <div class="field"><label>Adresse</label><value>1 Avenue de la Flotte, Paris</value></div>
        <div class="field"><label>SIRET</label><value>123 456 789 00010</value></div>
        <div class="field"><label>Téléphone</label><value>+33 1 00 00 00 00</value></div>
      </div>
    </div>
    <div class="section">
      <h2>Le locataire</h2>
      <div class="section-box">
        <div class="field"><label>Nom complet</label><value>${user.first_name} ${user.last_name}</value></div>
        ${user.username ? `<div class="field"><label>Identifiant</label><value>${user.username}</value></div>` : ''}
        <div class="field"><label>Email</label><value>${user.email}</value></div>
        ${user.phone ? `<div class="field"><label>Téléphone</label><value>${user.phone}</value></div>` : ''}
        ${user.commune ? `<div class="field"><label>Commune</label><value>${user.commune}</value></div>` : ''}
        ${user.driver_license_number ? `<div class="field"><label>N° permis</label><value>${user.driver_license_number}</value></div>` : ''}
        ${user.professional_card_number ? `<div class="field"><label>Carte professionnelle</label><value>${user.professional_card_number}</value></div>` : ''}
      </div>
    </div>
  </div>

  <!-- Vehicle -->
  <div class="section">
    <h2>Véhicule loué</h2>
    <div class="section-box">
      <div class="grid-2" style="margin-bottom:0;">
        <div>
          <div class="field"><label>Marque / Modèle</label><value>${car.make} ${car.model}</value></div>
          <div class="field"><label>Année</label><value>${car.year}</value></div>
          <div class="field"><label>Couleur</label><value>${car.color || '—'}</value></div>
        </div>
        <div>
          <div class="field"><label>Immatriculation</label><value>${car.license_plate}</value></div>
          <div class="field"><label>Catégorie</label><value>${car.category || '—'}</value></div>
          <div class="field"><label>Transmission</label><value>${car.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}</value></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Rental period + reason -->
  <div class="grid-2">
    <div class="section">
      <h2>Période de location</h2>
      <div class="section-box">
        <div class="field"><label>Prise en charge</label><value>${formatDate(reservation.start_date)} à ${pickupTime}</value></div>
        <div class="field"><label>Restitution</label><value>${formatDate(reservation.end_date)} à ${returnTime}</value></div>
        <div class="field"><label>Durée</label><value>${reservation.total_days} jour(s)</value></div>
        ${reservation.pickup_location ? `<div class="field"><label>Lieu de prise en charge</label><value>${reservation.pickup_location}</value></div>` : ''}
        ${reservation.dropoff_location ? `<div class="field"><label>Lieu de restitution</label><value>${reservation.dropoff_location}</value></div>` : ''}
      </div>
    </div>
    <div class="section">
      <h2>Motif de la location</h2>
      <div class="section-box">
        <div class="field"><label>Raison</label><value class="highlight">${reason}</value></div>
        ${reservation.vehicle_location ? `<div class="field"><label>Localisation véhicule immobilisé</label><value>${reservation.vehicle_location}</value></div>` : ''}
        ${reservation.notes ? `<div class="field"><label>Notes complémentaires</label><value>${reservation.notes}</value></div>` : ''}
      </div>
    </div>
  </div>

  <!-- Price -->
  <div class="section">
    <h2>Tarification</h2>
    <div class="section-box">
      <table class="price">
        <tr>
          <td>Tarif journalier</td>
          <td>${formatPrice(car.price_per_day)} / jour</td>
        </tr>
        <tr>
          <td>Nombre de jours</td>
          <td>${reservation.total_days} jour(s)</td>
        </tr>
        <tr>
          <td>Sous-total location</td>
          <td>${formatPrice(reservation.total_amount)}</td>
        </tr>
        ${parseFloat(reservation.deposit_amount) > 0 ? `
        <tr>
          <td>Dépôt de garantie</td>
          <td>${formatPrice(reservation.deposit_amount)}</td>
        </tr>` : ''}
        <tr class="total">
          <td>TOTAL TTC</td>
          <td>${formatPrice(reservation.total_amount)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Conditions -->
  <div class="conditions">
    <h2>Conditions générales de location</h2>
    <p><strong>1. Le locataire</strong> s'engage à utiliser le véhicule en bon père de famille, à le restituer dans l'état dans lequel il l'a reçu et à respecter le code de la route.</p>
    <p><strong>2. Carburant :</strong> Le véhicule est remis plein et doit être restitué plein. Tout manquant sera facturé au tarif en vigueur.</p>
    <p><strong>3. Assurance :</strong> Le véhicule est assuré tous risques. La franchise en cas de sinistre responsable est de 800 €. Une couverture complémentaire peut être souscrite.</p>
    <p><strong>4. Kilométrage :</strong> Kilométrage illimité sauf mention contraire dans les conditions particulières.</p>
    <p><strong>5. Restitution tardive :</strong> Toute heure supplémentaire de retard sera facturée au prorata du tarif journalier.</p>
    <p><strong>6. Documents :</strong> Le locataire certifie avoir fourni des documents authentiques et valides (permis de conduire, pièce d'identité, carte professionnelle).</p>
  </div>

  <!-- Signatures -->
  <div class="sig-grid">
    <div class="sig-box">
      <div class="title">Signature du loueur</div>
      <div style="font-size:12px;color:#4a5568;margin-bottom:4px;">AutoRent SAS</div>
      <div class="sig-line"></div>
      <div class="sig-name">Date et signature</div>
    </div>
    <div class="sig-box">
      <div class="title">Signature du locataire</div>
      <div style="font-size:12px;color:#4a5568;margin-bottom:4px;">${user.first_name} ${user.last_name}</div>
      <div class="sig-line"></div>
      <div class="sig-name">Précédé de la mention « Lu et approuvé »</div>
    </div>
  </div>

  <div class="footer">
    AutoRent SAS — SIRET 123 456 789 00010 — TVA FR 12 123 456 789<br>
    1 Avenue de la Flotte, 75001 Paris — contact@autorent.fr — +33 1 00 00 00 00<br>
    Contrat généré automatiquement le ${formatDate(new Date().toISOString())}
  </div>

</div>
</body>
</html>`;
}

module.exports = { generateContractHtml };

'use strict';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '___________';

const fmtLong = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '___________';

const REASON_LABELS = {
  engine_failure: 'Panne moteur',
  accident:       'Accident de la route',
  body_damage:    'Dommages carrosserie',
};

const field = (label, value) => `
  <tr>
    <td class="label">${label}</td>
    <td class="value">${value || '___________'}</td>
  </tr>`;

function generateContractHtml({ reservation, user, car }) {
  const reason        = REASON_LABELS[reservation.reason] || reservation.reason || '___________';
  const lieuCause     = [reservation.vehicle_location, reason].filter(Boolean).join(' – ');
  const depositAmount = parseFloat(reservation.deposit_amount || 1000);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Contrat de location taxi relais</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12.5px;
    color: #000;
    background: #fff;
    line-height: 1.55;
  }
  .page { max-width: 750px; margin: 0 auto; padding: 36px 44px; }

  /* ── Header ── */
  .header { text-align: center; margin-bottom: 28px; }
  .header h1 {
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .header p { font-size: 12px; line-height: 1.6; }

  /* ── Conditions text ── */
  .conditions { margin-bottom: 24px; font-size: 12px; line-height: 1.65; }
  .conditions p { margin-bottom: 8px; }
  .conditions strong { font-weight: 700; }
  .conditions .caps { font-weight: 700; text-transform: uppercase; font-size: 12px; }

  /* ── Data table ── */
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .data-table td { padding: 3px 0; vertical-align: top; }
  .data-table td.label {
    font-weight: 700;
    width: 52%;
    padding-right: 8px;
    font-size: 12px;
  }
  .data-table td.value {
    font-size: 12px;
    border-bottom: 1px solid #888;
    min-width: 180px;
  }
  .data-table tr.spacer td { height: 8px; border: none; }

  /* ── Section heading ── */
  .section-title {
    font-weight: 900;
    font-size: 13px;
    text-decoration: underline;
    margin: 18px 0 6px;
    text-transform: uppercase;
  }

  /* ── Bold warning ── */
  .warning {
    font-weight: 900;
    font-size: 12.5px;
    margin: 14px 0 6px;
    text-transform: uppercase;
  }

  /* ── Signature section ── */
  .sig-section {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-top: 28px;
    margin-bottom: 28px;
  }
  .car-sketch {
    flex-shrink: 0;
    width: 160px;
  }
  .sig-cols {
    display: flex;
    flex: 1;
    gap: 40px;
    padding-top: 8px;
  }
  .sig-col { flex: 1; text-align: center; }
  .sig-col .sig-title { font-size: 12px; margin-bottom: 50px; }
  .sig-col .sig-line { border-bottom: 1px solid #000; margin-bottom: 4px; }

  /* ── Return section ── */
  .return-section { margin-top: 10px; font-size: 12px; }
  .return-section p { margin-bottom: 8px; }
  .return-line {
    display: inline-block;
    width: 300px;
    border-bottom: 1px solid #888;
    margin-left: 6px;
  }

  @media print {
    .page { padding: 18px 24px; }
    body { font-size: 11.5px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ══ EN-TÊTE ══ -->
  <div class="header">
    <h1>Contrat de location taxi relais</h1>
    <p>
      TAXI RENT<br>
      7 Allée de Lille<br>
      91170 Viry-Chatillon<br>
      Enregistré au RCS d'Evry<br>
      location de véhicule courte durée<br>
      Siren 921300190
    </p>
  </div>

  <!-- ══ CONDITIONS ══ -->
  <div class="conditions">
    <p>Le loueur met à disposition du locataire un véhicule équipé taxi en conformité avec la réglementation en vigueur&nbsp;:
    taximètre, lumineux, imprimante, et contrôles techniques à jour. Le véhicule est assuré par le locataire (transfert de
    son assurance tous risques de son taxi immobilisé), il devra immédiatement signaler tout incident à son assurance
    et au loueur.</p>

    <p>Au départ de la location le locataire devra laisser un chèque de caution de <strong>${depositAmount.toLocaleString('fr-FR')}€</strong>.</p>

    <p><strong>Le véhicule devra être restitué dans l'état où il a été emprunté</strong> et dans le cas contraire le loueur pourra
    facturer les frais de remise en état du véhicule ainsi que les jours d'immobilisation du véhicule relais le cas
    échéant. <strong>(Frais de Nettoyage forfaitaire 50€)</strong></p>

    <p><strong>Le véhicule relais devra toujours être restitué plein fait</strong> et dans le cas contraire il sera facturé au locataire
    2€/Litre manquant.</p>

    <p>Le véhicule relais est loué uniquement en cas d'immobilisation du véhicule taxi du locataire.</p>

    <p>Le locataire devra indiquer au loueur les raisons de l'immobilisation de son véhicule ainsi que le lieu où celui-ci
    est visible. En cas de contrôle ou de demandes des autorités et administrations compétentes le loueur se réserve
    la possibilité de vérifier où le véhicule du locataire est immobilisé.</p>

    <p>Le locataire doit transmettre le contrat de location à la Mairie de la Commune de Stationnement.</p>

    <p>La location s'entend kilométrage illimité.</p>

    <p class="caps">LE LOCATAIRE S'ENGAGE A ALLER MODIFIER LES TARIFS PREFECTORAUX DE SON
    DEPARTEMENT CHEZ JPM TAXI.</p>
  </div>

  <!-- ══ VÉHICULE ══ -->
  <table class="data-table">
    ${field('<strong>Véhicule loué</strong>', `${car.make} ${car.model}`)}
    ${field('<strong>Immatriculation</strong>', car.license_plate)}
    ${field('Prix par Jour', `${parseFloat(car.price_per_day).toFixed(0)}€ Hors Taxe`)}
    ${field('<strong>DATE DE DEBUT DU CONTRAT</strong>', fmt(reservation.start_date))}
    ${field('<strong>DATE PREVU DE RETOUR</strong>', fmt(reservation.end_date))}
  </table>

  <!-- ══ LOCATAIRE ══ -->
  <div class="section-title">Locataire :</div>
  <table class="data-table">
    ${field('NOM', `${user.first_name} ${user.last_name}`)}
    ${field('ADRESSE', user.commune || '')}
    ${field('PERMIS DE CONDUIRE N°', user.driver_license_number)}
    ${field('DELIVRE LE', user.date_of_birth ? fmt(user.date_of_birth) : '')}
    ${field('CARTE PROFESSIONNELLE N', user.professional_card_number)}
    ${field('COMMUNE DE STATIONNEMENT DU VEHICULE IMMOBILISE', user.commune)}
    ${field('IMMATRICULATION DU VEHICULE IMMOBILISE', '')}
    ${field('NUMERO CONVENTIONNEMENT', user.license_number)}
    ${field('LIEU D\'IMMOBILISATION DE VEHICULE + CAUSE', lieuCause)}
  </table>

  <p class="warning">Tous dommages sont à rembourser par le locataire</p>

  <!-- ══ SIGNATURES ══ -->
  <div class="sig-section">

    <!-- Schéma véhicule -->
    <div class="car-sketch">
      <svg viewBox="0 0 160 260" width="160" height="260" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="1.5">
        <!-- Carrosserie -->
        <rect x="20" y="40" width="120" height="180" rx="18" stroke-width="2"/>
        <!-- Pare-brise avant -->
        <path d="M38 80 Q80 65 122 80" stroke-width="1.2"/>
        <!-- Toit -->
        <path d="M38 80 Q80 68 122 80 L122 140 Q80 148 38 140 Z" stroke-width="1.2" stroke-dasharray="3 2"/>
        <!-- Pare-brise arrière -->
        <path d="M38 140 Q80 155 122 140" stroke-width="1.2"/>
        <!-- Rétros -->
        <rect x="6" y="110" width="14" height="20" rx="3"/>
        <rect x="140" y="110" width="14" height="20" rx="3"/>
        <!-- Roues avant -->
        <ellipse cx="38" cy="70" rx="14" ry="20" fill="#eee"/>
        <ellipse cx="122" cy="70" rx="14" ry="20" fill="#eee"/>
        <!-- Roues arrière -->
        <ellipse cx="38" cy="190" rx="14" ry="20" fill="#eee"/>
        <ellipse cx="122" cy="190" rx="14" ry="20" fill="#eee"/>
        <!-- Portes -->
        <line x1="30" y1="115" x2="130" y2="115" stroke-dasharray="2 2" stroke-width="0.8"/>
        <!-- Poignées -->
        <rect x="58" y="97" width="12" height="4" rx="2" fill="#000" stroke="none"/>
        <rect x="90" y="97" width="12" height="4" rx="2" fill="#000" stroke="none"/>
        <rect x="58" y="122" width="12" height="4" rx="2" fill="#000" stroke="none"/>
        <rect x="90" y="122" width="12" height="4" rx="2" fill="#000" stroke="none"/>
      </svg>
    </div>

    <!-- Colonnes signature -->
    <div class="sig-cols">
      <div class="sig-col">
        <p class="sig-title">locataire</p>
        <div class="sig-line"></div>
        <p style="font-size:11px;color:#555;">Signature</p>
      </div>
      <div class="sig-col">
        <p class="sig-title">Loueur</p>
        <div class="sig-line"></div>
        <p style="font-size:11px;color:#555;">Monir El Bahije</p>
      </div>
    </div>

  </div>

  <!-- ══ RETOUR ══ -->
  <div class="return-section">
    <p>RETOUR Véhicule&nbsp;: <span class="return-line"></span></p>
    <p>SINISTRE RESPONSABLE&nbsp;: <span class="return-line"></span></p>
    <p>CARBURANT&nbsp;: <span class="return-line"></span></p>
  </div>

</div>
</body>
</html>`;
}

module.exports = { generateContractHtml };

'use strict';

const PDFDocument = require('pdfkit');

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

  /* ── Print button ── */
  .print-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #1a1a1a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    z-index: 100;
    font-size: 13px;
  }
  .print-bar span { opacity: 0.75; }
  .print-btn {
    background: #e53e3e;
    color: #fff;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .print-btn:hover { background: #c53030; }
  body.has-bar { padding-top: 48px; }

  @media print {
    .print-bar { display: none !important; }
    body { padding-top: 0 !important; font-size: 11.5px; }
    .page { padding: 18px 24px; }
  }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body class="has-bar">
<div class="print-bar">
  <span>Contrat de location — Taxirent</span>
  <button class="print-btn" id="dlBtn" onclick="downloadPdf()">
    ⬇ Télécharger en PDF
  </button>
</div>
<div class="page" id="contractPage">

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
    ${field('ADRESSE', user.address || user.commune || '')}
    ${field('PERMIS DE CONDUIRE N°', user.driver_license_number)}
    ${field('DELIVRE LE', user.driver_license_date ? fmt(user.driver_license_date) : '')}
    ${field('CARTE PROFESSIONNELLE N', user.professional_card_number)}
    ${field('COMMUNE DE STATIONNEMENT DU VEHICULE IMMOBILISE', user.commune)}
    ${field('IMMATRICULATION DU VEHICULE IMMOBILISE', reservation.immobilized_plate || '')}
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
<script>
async function downloadPdf() {
  const btn = document.getElementById('dlBtn');
  btn.textContent = 'Génération...';
  btn.disabled = true;
  try {
    const el = document.getElementById('contractPage');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    while (y < imgH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, imgW, imgH);
      y += pageH;
    }
    pdf.save('contrat-taxirent.pdf');
  } catch(e) {
    alert('Erreur lors de la génération du PDF. Utilisez Ctrl+P → Enregistrer en PDF.');
  }
  btn.textContent = '⬇ Télécharger en PDF';
  btn.disabled = false;
}
</script>
</body>
</html>`;
}

function generateContractPdf({ reservation, user, car }) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const depositAmount = parseFloat(reservation.deposit_amount || 1000);
  const reason = REASON_LABELS[reservation.reason] || reservation.reason || '';
  const lieuCause = [reservation.vehicle_location, reason].filter(Boolean).join(' – ');
  const pricePerDay = parseFloat(car.price_per_day || 0).toFixed(0);

  const separator = () => {
    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#aaaaaa').stroke().strokeColor('#000000');
    doc.moveDown(0.5);
  };

  const fieldRow = (label, value) => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).text(label + ' :', 50, y, { width: 250, lineBreak: true });
    const afterLabel = doc.y;
    doc.font('Helvetica').fontSize(9).text(value || '', 310, y, { width: 235, lineBreak: true });
    const afterValue = doc.y;
    const endY = Math.max(afterLabel, afterValue);
    doc.moveTo(310, endY).lineTo(545, endY).lineWidth(0.4).strokeColor('#bbbbbb').stroke().strokeColor('#000000');
    doc.y = endY + 5;
  };

  // ── En-tête ──
  doc.font('Helvetica-Bold').fontSize(15).text('CONTRAT DE LOCATION TAXI RELAIS', { align: 'center' });
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9)
     .text("TAXI RENT  –  7 Allée de Lille  –  91170 Viry-Châtillon", { align: 'center' })
     .text("Enregistré au RCS d'Évry  –  SIREN 921 300 190  –  Location de véhicule courte durée", { align: 'center' });
  doc.moveDown(0.6);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).stroke();
  doc.moveDown(0.5);

  // ── Conditions ──
  const paras = [
    { bold: false, text: "Le loueur met à disposition du locataire un véhicule équipé taxi en conformité avec la réglementation en vigueur : taximètre, lumineux, imprimante, et contrôles techniques à jour. Le véhicule est assuré par le locataire (transfert de son assurance tous risques de son taxi immobilisé), il devra immédiatement signaler tout incident à son assurance et au loueur." },
    { bold: false, text: `Au départ de la location le locataire devra laisser un chèque de caution de ${depositAmount.toLocaleString('fr-FR')} €.` },
    { bold: false, text: "Le véhicule devra être restitué dans l'état où il a été emprunté et dans le cas contraire le loueur pourra facturer les frais de remise en état du véhicule ainsi que les jours d'immobilisation du véhicule relais le cas échéant. (Frais de nettoyage forfaitaire 50 €)" },
    { bold: false, text: "Le véhicule relais devra toujours être restitué plein fait et dans le cas contraire il sera facturé au locataire 2 €/litre manquant." },
    { bold: false, text: "Le véhicule relais est loué uniquement en cas d'immobilisation du véhicule taxi du locataire." },
    { bold: false, text: "Le locataire devra indiquer au loueur les raisons de l'immobilisation de son véhicule ainsi que le lieu où celui-ci est visible. En cas de contrôle ou de demandes des autorités et administrations compétentes, le loueur se réserve la possibilité de vérifier où le véhicule du locataire est immobilisé." },
    { bold: false, text: "Le locataire doit transmettre le contrat de location à la Mairie de la Commune de Stationnement." },
    { bold: false, text: "La location s'entend kilométrage illimité." },
    { bold: true,  text: "LE LOCATAIRE S'ENGAGE À ALLER MODIFIER LES TARIFS PRÉFECTORAUX DE SON DÉPARTEMENT CHEZ JPM TAXI." },
  ];

  paras.forEach((p) => {
    doc.font(p.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(p.text);
    doc.moveDown(0.35);
  });

  separator();

  // ── Véhicule ──
  doc.font('Helvetica-Bold').fontSize(10).text('VÉHICULE LOUÉ', { underline: true });
  doc.moveDown(0.4);
  fieldRow('Véhicule', `${car.make} ${car.model}`);
  fieldRow('Immatriculation', car.license_plate);
  fieldRow('Prix par jour', `${pricePerDay} € HT`);
  fieldRow('Date de début de contrat', fmt(reservation.start_date));
  fieldRow('Date prévue de retour', fmt(reservation.end_date));
  doc.moveDown(0.4);

  // ── Locataire ──
  doc.font('Helvetica-Bold').fontSize(10).text('LOCATAIRE', { underline: true });
  doc.moveDown(0.4);
  fieldRow('Nom', `${user.first_name} ${user.last_name}`);
  fieldRow('Adresse', user.address || user.commune || '');
  fieldRow('Permis de conduire N°', user.driver_license_number || '');
  fieldRow('Délivré le', user.driver_license_date ? fmt(user.driver_license_date) : '');
  fieldRow('Carte professionnelle N°', user.professional_card_number || '');
  fieldRow('Commune de stationnement du véhicule immobilisé', user.commune || '');
  fieldRow('Immatriculation du véhicule immobilisé', reservation.immobilized_plate || '');
  fieldRow('Numéro de conventionnement', user.license_number || '');
  fieldRow("Lieu d'immobilisation et cause", lieuCause);
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(9).text('TOUS DOMMAGES SONT À REMBOURSER PAR LE LOCATAIRE');
  doc.moveDown(1.2);

  // ── Signatures ──
  separator();
  const sigY = doc.y;

  doc.font('Helvetica').fontSize(9).text('Signature locataire', 50, sigY, { width: 200, align: 'center' });
  doc.moveTo(50, sigY + 55).lineTo(250, sigY + 55).lineWidth(0.6).stroke();
  doc.font('Helvetica').fontSize(8).text('Date et signature', 50, sigY + 58, { width: 200, align: 'center' });

  doc.font('Helvetica').fontSize(9).text('Signature loueur', 320, sigY, { width: 200, align: 'center' });
  doc.moveTo(320, sigY + 55).lineTo(520, sigY + 55).lineWidth(0.6).stroke();
  doc.font('Helvetica').fontSize(8).text('Monir El Bahije', 320, sigY + 58, { width: 200, align: 'center' });

  doc.y = sigY + 80;

  // ── Retour ──
  separator();
  doc.font('Helvetica-Bold').fontSize(9).text('RETOUR DU VÉHICULE');
  doc.moveDown(0.5);
  ['Retour véhicule', 'Sinistre responsable', 'Carburant'].forEach((label) => {
    const y = doc.y;
    doc.font('Helvetica').fontSize(9).text(`${label} :`, 50, y);
    doc.moveTo(170, y + 11).lineTo(545, y + 11).lineWidth(0.4).strokeColor('#bbbbbb').stroke().strokeColor('#000000');
    doc.moveDown(0.9);
  });

  return doc;
}

module.exports = { generateContractHtml, generateContractPdf };

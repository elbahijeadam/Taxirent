'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, Calendar, Car, MapPin, Clock, FileText, Mail,
  Loader2, Download, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { reservationApi, authApi } from '@/lib/api';
import { Reservation } from '@/types';
import { formatPrice, formatDate, isLoggedIn } from '@/lib/auth';
import toast from 'react-hot-toast';

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  engine_failure: { label: 'Panne moteur', icon: '🔧' },
  accident: { label: 'Accident de la route', icon: '🚨' },
  body_damage: { label: 'Dommages carrosserie', icon: '🔨' },
  other: { label: 'Autre', icon: '📝' },
};

const REASON_TEXT: Record<string, string> = {
  engine_failure: 'Panne moteur',
  accident: 'Accident de la route',
  body_damage: 'Dommages carrosserie',
  other: 'Autre',
};

function fmt(d: string | undefined) {
  if (!d) return '___________';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function generateContractPdf(reservation: any, user: any) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 20;

  const LINE_H = 6;

  const addLine = (h = LINE_H) => { y += h; };

  const text = (str: string, x: number, fontSize = 10, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(str || '', x, y, { align });
  };

  const fieldRow = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    const val = value || '___________';
    doc.text(val, margin + contentW * 0.55, y);
    doc.setDrawColor(150);
    doc.line(margin + contentW * 0.55, y + 1, margin + contentW, y + 1);
    doc.setDrawColor(0);
    y += LINE_H;
  };

  const sectionTitle = (title: string) => {
    y += 3;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin, y);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1, margin + contentW, y + 1);
    y += LINE_H + 1;
  };

  // ── EN-TÊTE ──
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT DE LOCATION TAXI RELAIS', W / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const headerLines = [
    'TAXI RENT — 7 Allée de Lille — 91170 Viry-Chatillon',
    'Enregistré au RCS d\'Evry — Location de véhicule courte durée — Siren 921300190',
  ];
  for (const line of headerLines) {
    doc.text(line, W / 2, y, { align: 'center' });
    y += 5;
  }
  y += 3;

  // ── CONDITIONS ──
  const depositAmount = parseFloat(reservation.deposit_amount || 1000);
  const conditions = [
    `Le loueur met à disposition du locataire un véhicule équipé taxi en conformité avec la réglementation en vigueur : taximètre, lumineux, imprimante, et contrôles techniques à jour. Le véhicule est assuré par le locataire (transfert de son assurance tous risques de son taxi immobilisé), il devra immédiatement signaler tout incident à son assurance et au loueur.`,
    `Au départ de la location le locataire devra laisser un chèque de caution de ${depositAmount}€.`,
    `Le véhicule devra être restitué dans l'état où il a été emprunté. En cas contraire le loueur pourra facturer les frais de remise en état (Frais de Nettoyage forfaitaire 50€).`,
    `Le véhicule relais devra toujours être restitué plein fait, sinon 2€/Litre manquant sera facturé.`,
    `La location s'entend kilométrage illimité. Le locataire doit transmettre le contrat à la Mairie de la Commune de Stationnement.`,
    `LE LOCATAIRE S'ENGAGE A ALLER MODIFIER LES TARIFS PREFECTORAUX DE SON DEPARTEMENT CHEZ JPM TAXI.`,
  ];

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  for (const para of conditions) {
    const lines = doc.splitTextToSize(para, contentW) as string[];
    for (const line of lines) {
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 1.5;
  }

  // ── VÉHICULE ──
  sectionTitle('Véhicule loué');
  fieldRow('Véhicule loué', `${reservation.make || ''} ${reservation.model || ''}`);
  fieldRow('Immatriculation', reservation.license_plate || '');
  fieldRow('Prix par Jour', `${parseFloat(reservation.price_per_day || 0).toFixed(0)}€ Hors Taxe`);
  fieldRow('DATE DE DEBUT DU CONTRAT', fmt(reservation.start_date));
  fieldRow('DATE PRÉVU DE RETOUR', fmt(reservation.end_date));

  // ── LOCATAIRE ──
  sectionTitle('Locataire');
  fieldRow('NOM', `${user?.first_name || ''} ${user?.last_name || ''}`);
  fieldRow('ADRESSE', user?.address || user?.commune || '');
  fieldRow('PERMIS DE CONDUIRE N°', user?.driver_license_number || '');
  fieldRow('DÉLIVRÉ LE', user?.driver_license_date ? fmt(user.driver_license_date) : '');
  fieldRow('CARTE PROFESSIONNELLE N°', user?.professional_card_number || '');
  fieldRow('COMMUNE DE STATIONNEMENT DU VÉHICULE IMMOBILISÉ', user?.commune || '');
  fieldRow('IMMATRICULATION DU VÉHICULE IMMOBILISÉ', reservation.immobilized_plate || '');
  fieldRow('NUMÉRO CONVENTIONNEMENT', user?.license_number || '');
  const lieuCause = [reservation.vehicle_location, REASON_TEXT[reservation.reason]].filter(Boolean).join(' – ');
  fieldRow("LIEU D'IMMOBILISATION + CAUSE", lieuCause);

  y += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOUS DOMMAGES SONT À REMBOURSER PAR LE LOCATAIRE', margin, y);
  y += 10;

  // ── SIGNATURES ──
  const sigY = y;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Locataire
  doc.text('Locataire', margin + 20, sigY, { align: 'center' });
  doc.line(margin, sigY + 20, margin + 55, sigY + 20);
  doc.setFontSize(8);
  doc.text('Signature', margin + 20, sigY + 24, { align: 'center' });

  // Loueur
  doc.setFontSize(9);
  doc.text('Loueur', margin + contentW - 20, sigY, { align: 'center' });
  doc.line(margin + contentW - 55, sigY + 20, margin + contentW, sigY + 20);
  doc.setFontSize(8);
  doc.text('Monir El Bahije', margin + contentW - 20, sigY + 24, { align: 'center' });

  y = sigY + 32;

  // ── RETOUR ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RETOUR Véhicule :', margin, y);
  doc.line(margin + 42, y + 1, margin + contentW, y + 1);
  y += 8;
  doc.text('SINISTRE RESPONSABLE :', margin, y);
  doc.line(margin + 52, y + 1, margin + contentW, y + 1);
  y += 8;
  doc.text('CARBURANT :', margin, y);
  doc.line(margin + 28, y + 1, margin + contentW, y + 1);

  const refId = reservation.id?.slice(0, 8).toUpperCase() || '';
  doc.save(`contrat-taxirent-${refId}.pdf`);
}

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    Promise.all([reservationApi.get(id), authApi.getMe()])
      .then(([resRes, meRes]) => {
        setReservation(resRes.data);
        setUser(meRes.data);
      })
      .catch(() => { toast.error('Réservation introuvable'); router.push('/reservations'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!reservation) return;
    setPdfLoading(true);
    try {
      await generateContractPdf(reservation, user);
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-28 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!reservation) return null;

  const refId = reservation.id.slice(0, 8).toUpperCase();
  const reason = reservation.reason ? REASON_LABELS[reservation.reason] : null;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-green-50 to-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Success banner */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Demande confirmée !</h1>
          <p className="text-gray-500 text-lg">Référence : <span className="font-bold text-gray-800">{refId}</span></p>
        </div>

        {/* Email notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800 mb-1">Contrat envoyé par email</p>
            <p className="text-sm text-blue-700">
              Votre contrat de location a été généré et envoyé à votre adresse email.
              Vérifiez votre boîte de réception (et les spams).
            </p>
          </div>
        </div>

        {/* Contract download */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" /> Contrat de location
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Téléchargez votre contrat, imprimez-le et présentez-le signé lors de la prise en charge du véhicule.
          </p>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 bg-dark-900 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-dark-800 transition disabled:opacity-60"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {pdfLoading ? 'Génération en cours...' : 'Télécharger le contrat PDF'}
          </button>
        </div>

        {/* Reservation summary */}
        <div className="card p-6 mb-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg mb-1">Récapitulatif de la demande</h2>

          {/* Vehicle */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🚗</div>
            <div>
              <p className="font-bold text-gray-900">{reservation.make} {reservation.model} {reservation.year}</p>
              <p className="text-sm text-gray-500">{reservation.color}</p>
            </div>
          </div>

          {/* Reason */}
          {reason && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-2xl">{reason.icon}</span>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Motif</p>
                <p className="font-semibold text-amber-900">{reason.label}</p>
              </div>
            </div>
          )}

          {/* Dates + times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Prise en charge</p>
              <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                <Calendar className="w-4 h-4 text-brand-500" />
                {formatDate(reservation.start_date)}
              </div>
              {reservation.pickup_time && (
                <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {reservation.pickup_time}
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Restitution</p>
              <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                <Calendar className="w-4 h-4 text-brand-500" />
                {formatDate(reservation.end_date)}
              </div>
              {reservation.return_time && (
                <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {reservation.return_time}
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
              <span>{formatPrice(reservation.price_per_day)} × {reservation.total_days} jour{reservation.total_days > 1 ? 's' : ''}</span>
              <span>{formatPrice(reservation.total_amount)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-base text-gray-900">
              <span>Total estimé</span>
              <span className="text-brand-500 text-xl">{formatPrice(reservation.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Prochaines étapes</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Notre équipe vérifie votre dossier et vos documents' },
              { step: '2', text: 'Vous recevrez une confirmation de disponibilité sous 24h' },
              { step: '3', text: 'Présentez-vous avec vos documents originaux à la prise en charge' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</div>
                <p className="text-sm text-gray-600 pt-0.5">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Documents reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">Documents requis à la prise en charge</p>
            <ul className="text-sm text-amber-700 space-y-0.5">
              <li>• Permis de conduire valide (recto/verso)</li>
              <li>• Carte professionnelle (recto/verso)</li>
              <li>• KBIS de votre entreprise</li>
              <li>• Carte grise du véhicule immobilisé</li>
            </ul>
            <Link href="/profile" className="inline-flex items-center gap-1 text-amber-700 font-semibold text-sm mt-2 hover:text-amber-900">
              Vérifier mes documents <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/reservations" className="flex-1 text-center bg-dark-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-dark-800 transition">
            Voir mes réservations
          </Link>
          <Link href="/cars" className="flex-1 text-center border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:border-gray-400 transition">
            Retour aux véhicules
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, Calendar, Car, MapPin, Clock, FileText, Mail,
  Loader2, Download, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { reservationApi } from '@/lib/api';
import { Reservation } from '@/types';
import { formatPrice, formatDate, isLoggedIn } from '@/lib/auth';
import toast from 'react-hot-toast';

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  engine_failure: { label: 'Panne moteur', icon: '🔧' },
  accident: { label: 'Accident de la route', icon: '🚨' },
  body_damage: { label: 'Dommages carrosserie', icon: '🔨' },
};

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    reservationApi.get(id)
      .then((res) => setReservation(res.data))
      .catch(() => { toast.error('Réservation introuvable'); router.push('/reservations'); })
      .finally(() => setLoading(false));
  }, [id]);

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
  const contractUrl = reservationApi.getContractUrl(id);

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
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-dark-900 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-dark-800 transition"
          >
            <Download className="w-4 h-4" />
            Ouvrir le contrat (PDF)
          </a>
          <p className="text-xs text-gray-400 mt-2">
            Une fois ouvert, cliquez sur &quot;Télécharger en PDF&quot; en haut de la page.
          </p>
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
              {reservation.pickup_location && (
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                  <MapPin className="w-3 h-3" /> {reservation.pickup_location}
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
              {reservation.dropoff_location && (
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                  <MapPin className="w-3 h-3" /> {reservation.dropoff_location}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle location */}
          {reservation.vehicle_location && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Véhicule immobilisé</p>
                <p className="text-sm text-gray-800">{reservation.vehicle_location}</p>
              </div>
            </div>
          )}

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
              { step: '1', text: 'Notre équipe vérifie votre dossier et vos documents', done: false },
              { step: '2', text: 'Vous recevrez une confirmation de disponibilité sous 24h', done: false },
              { step: '3', text: 'Présentez-vous avec vos documents originaux à la prise en charge', done: false },
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

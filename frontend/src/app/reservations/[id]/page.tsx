'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Calendar, Car, MapPin, FileText, Loader2, CheckCircle, XCircle, AlertTriangle, Download, Clock, Shield, Lock } from 'lucide-react';
import { reservationApi, paymentApi } from '@/lib/api';
import { Reservation } from '@/types';
import { formatPrice, formatDate, isLoggedIn } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'En attente de paiement', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Réservation confirmée', icon: <CheckCircle className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  active: { label: 'Location en cours', icon: <Car className="w-5 h-5" />, color: 'text-green-600 bg-green-50 border-green-200' },
  completed: { label: 'Location terminée', icon: <CheckCircle className="w-5 h-5" />, color: 'text-gray-600 bg-gray-50 border-gray-200' },
  cancelled: { label: 'Annulée', icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50 border-red-200' },
};

// Deposit authorization form (capture_method: manual — card hold, not charged)
function DepositForm({ onAuthorize }: { onAuthorize: () => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Erreur d\'autorisation');
      } else {
        await onAuthorize();
      }
    } catch {
      toast.error('Erreur lors de l\'autorisation du dépôt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAuthorize} className="space-y-5">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Votre carte sera <strong>réservée</strong> mais <strong>jamais débitée</strong> sauf en cas de dommages constatés à la restitution.</p>
      </div>
      <PaymentElement />
      <button type="submit" disabled={loading || !stripe} className="w-full py-4 text-base rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-60">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : <><Shield className="w-5 h-5" /> Autoriser le dépôt de garantie</>}
      </button>
    </form>
  );
}

// Stripe payment form component
function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href + '?payment=success' },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Paiement échoué');
      } else {
        toast.success('Paiement réussi !');
        onSuccess();
      }
    } catch {
      toast.error('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <PaymentElement />
      <button type="submit" disabled={loading || !stripe} className="btn-primary w-full py-4 text-base rounded-xl">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : 'Payer maintenant'}
      </button>
    </form>
  );
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [depositClientSecret, setDepositClientSecret] = useState<string | null>(null);
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    reservationApi.get(id).then((res) => setReservation(res.data)).catch(() => toast.error('Réservation introuvable')).finally(() => setLoading(false));
  }, [id]);

  const initPayment = async (paymentType: string) => {
    if (!reservation) return;
    setLoadingPayment(true);
    try {
      const res = await paymentApi.createIntent({ reservation_id: reservation.id, payment_type: paymentType });
      setClientSecret(res.data.clientSecret);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de paiement');
    } finally {
      setLoadingPayment(false);
    }
  };

  const loadDepositSecret = async () => {
    setLoadingDeposit(true);
    try {
      const res = await reservationApi.getDepositSecret(id);
      setDepositClientSecret(res.data.clientSecret);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de chargement du dépôt');
    } finally {
      setLoadingDeposit(false);
    }
  };

  const handleDepositConfirm = async () => {
    try {
      await reservationApi.confirmDeposit(id);
      toast.success('Dépôt de garantie autorisé !');
      window.location.reload();
    } catch {
      toast.error('Erreur de confirmation du dépôt');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Confirmer l\'annulation de cette réservation ?')) return;
    setCancelling(true);
    try {
      const res = await reservationApi.cancel(id);
      setReservation(res.data);
      toast.success('Réservation annulée');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Impossible d\'annuler');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="pt-28 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-500" /></div>;
  if (!reservation) return <div className="pt-28 text-center"><p>Réservation introuvable</p><Link href="/reservations" className="btn-primary mt-4 inline-block">Retour</Link></div>;

  const statusCfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const canPay = ['pending', 'confirmed'].includes(reservation.status) && ['unpaid', 'prepaid'].includes(reservation.payment_status);
  const canCancel = ['pending', 'confirmed'].includes(reservation.status);
  const canAuthorizeDeposit = reservation.deposit_stripe_intent_id &&
    reservation.deposit_status === 'awaiting_authorization' &&
    reservation.status !== 'cancelled';
  const totalDays = reservation.total_days;

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/reservations" className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">← Mes réservations</Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Réservation</h1>
            <p className="text-gray-500 text-sm mt-1">Réf. {reservation.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="md:col-span-2 space-y-5">
            {/* Status */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${statusCfg.color}`}>
              {statusCfg.icon}
              <span className="font-semibold">{statusCfg.label}</span>
            </div>

            {/* Car info */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-brand-500" /> Véhicule</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">🚗</div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">{reservation.make} {reservation.model} {reservation.year}</p>
                  <p className="text-gray-500">{reservation.color}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-500" /> Dates de location</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">PRISE EN CHARGE</p>
                  <p className="font-bold text-gray-900">{formatDate(reservation.start_date)}</p>
                  {reservation.pickup_time && <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{reservation.pickup_time}</p>}
                  {reservation.pickup_location && <p className="text-sm text-gray-500 mt-1">{reservation.pickup_location}</p>}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">RESTITUTION</p>
                  <p className="font-bold text-gray-900">{formatDate(reservation.end_date)}</p>
                  {reservation.return_time && <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{reservation.return_time}</p>}
                  {reservation.dropoff_location && <p className="text-sm text-gray-500 mt-1">{reservation.dropoff_location}</p>}
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-gray-500">
                Durée : <strong>{totalDays} jour{totalDays > 1 ? 's' : ''}</strong>
              </div>
            </div>

            {/* B2B info */}
            {(reservation.reason || reservation.vehicle_location) && (
              <div className="card p-6 space-y-3">
                <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-brand-500" /> Motif de location</h2>
                {reservation.reason && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Raison</p>
                    <p className="font-semibold text-amber-900">
                      {{ engine_failure: '🔧 Panne moteur', accident: '🚨 Accident de la route', body_damage: '🔨 Dommages carrosserie' }[reservation.reason] || reservation.reason}
                    </p>
                  </div>
                )}
                {reservation.vehicle_location && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span><strong>Véhicule immobilisé :</strong> {reservation.vehicle_location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Contract download */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /> Contrat de location</h2>
              <a
                href={reservationApi.getContractUrl(id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-dark-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-dark-800 transition"
              >
                <Download className="w-4 h-4" /> Télécharger le contrat
              </a>
            </div>

            {reservation.notes && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /> Notes</h2>
                <p className="text-gray-600 text-sm">{reservation.notes}</p>
              </div>
            )}

            {/* Deposit authorization */}
            {canAuthorizeDeposit && (
              <div className="card p-6 border-2 border-amber-300">
                <h2 className="font-bold text-gray-900 mb-2 text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" /> Dépôt de garantie
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Autorisez le blocage de <strong>{formatPrice(reservation.deposit_amount)}</strong> sur votre carte.
                  Aucun prélèvement sans dommages constatés.
                </p>
                {depositClientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret: depositClientSecret }}>
                    <DepositForm onAuthorize={handleDepositConfirm} />
                  </Elements>
                ) : (
                  <button
                    onClick={loadDepositSecret}
                    disabled={loadingDeposit}
                    className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
                  >
                    {loadingDeposit
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Chargement...</>
                      : <><Shield className="w-5 h-5" /> Autoriser le dépôt de garantie</>}
                  </button>
                )}
              </div>
            )}

            {/* Payment form */}
            {canPay && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-5 text-xl">Paiement</h2>
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm onSuccess={() => window.location.reload()} />
                  </Elements>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => initPayment('full_payment')} disabled={loadingPayment} className="btn-primary w-full py-4 rounded-xl flex items-center justify-between px-5">
                      <div className="text-left">
                        <p className="font-bold">Payer maintenant</p>
                        <p className="text-sm text-brand-100">Réservation immédiatement confirmée</p>
                      </div>
                      <p className="font-bold text-xl">{formatPrice(reservation.total_amount)}</p>
                    </button>
                    {loadingPayment && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Price summary */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">Récapitulatif</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{formatPrice(reservation.price_per_day)} × {totalDays}j</span>
                  <span>{formatPrice(reservation.total_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Dépôt de garantie</span>
                  <span>{formatPrice(reservation.deposit_amount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-brand-500">{formatPrice(reservation.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-gray-400">Statut paiement</span>
                  <span className={`font-semibold ${
                    reservation.payment_status === 'paid' ? 'text-green-600'
                    : reservation.payment_status === 'prepaid' ? 'text-blue-600'
                    : reservation.payment_status === 'refunded' ? 'text-purple-600'
                    : 'text-red-600'
                  }`}>
                    {reservation.payment_status === 'paid' ? 'Payé'
                      : reservation.payment_status === 'prepaid' ? 'Acompte versé'
                      : reservation.payment_status === 'refunded' ? 'Remboursé'
                      : 'Non payé'}
                  </span>
                </div>
                {reservation.deposit_stripe_intent_id && (
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-gray-400">Dépôt de garantie</span>
                    <span className={`font-semibold ${
                      reservation.deposit_status === 'authorized' ? 'text-blue-600'
                      : reservation.deposit_status === 'captured' ? 'text-red-600'
                      : reservation.deposit_status === 'released' ? 'text-green-600'
                      : 'text-amber-600'
                    }`}>
                      {reservation.deposit_status === 'authorized' ? '✓ Autorisé'
                        : reservation.deposit_status === 'captured' ? 'Prélevé'
                        : reservation.deposit_status === 'released' ? 'Libéré'
                        : 'En attente'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Documents reminder */}
            <div className="card p-5 bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-2 text-sm">📋 Documents requis</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Permis de conduire valide</li>
                <li>• Pièce d'identité</li>
                <li>• Carte professionnelle (si applicable)</li>
              </ul>
              <Link href="/profile" className="text-xs text-amber-700 font-semibold underline mt-3 block hover:text-amber-900">Gérer mes documents →</Link>
            </div>

            {/* Cancel */}
            {canCancel && (
              <button onClick={handleCancel} disabled={cancelling} className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm transition flex items-center justify-center gap-2">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Annuler la réservation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

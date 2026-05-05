'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Car, CreditCard, Loader2, ArrowRight, XCircle } from 'lucide-react';
import { userApi } from '@/lib/api';
import { Reservation } from '@/types';
import { formatPrice, formatDate, isLoggedIn } from '@/lib/auth';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'En cours', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminée', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-600' },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid:   { label: 'Non payé',     color: 'bg-red-100 text-red-700' },
  prepaid:  { label: 'Acompte versé', color: 'bg-blue-100 text-blue-700' },
  paid:     { label: 'Payé',          color: 'bg-green-100 text-green-700' },
  refunded: { label: 'Remboursé',     color: 'bg-gray-100 text-gray-600' },
};

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    userApi.getReservations().then((res) => setReservations(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="pt-28 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="bg-dark-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold mb-2">Mes réservations</h1>
          <p className="text-gray-400">{reservations.length} réservation{reservations.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {reservations.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-7xl mb-6">🚗</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Aucune réservation</h2>
            <p className="text-gray-500 mb-8">Découvrez notre flotte et effectuez votre première réservation !</p>
            <Link href="/cars" className="btn-primary px-8 py-4 text-base rounded-2xl">Voir les véhicules</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((r) => {
              const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              const payment = PAYMENT_CONFIG[r.payment_status] || PAYMENT_CONFIG.unpaid;
              return (
                <Link key={r.id} href={`/reservations/${r.id}`} className="card p-6 flex flex-col md:flex-row items-start md:items-center gap-5 hover:shadow-md transition group">
                  {/* Car icon */}
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-brand-50 transition">
                    🚗
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{r.make} {r.model} {r.year}</h3>
                      <span className={`badge ${status.color}`}>{status.label}</span>
                      <span className={`badge ${payment.color}`}>{payment.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(r.start_date)} → {formatDate(r.end_date)}</span>
                      <span className="flex items-center gap-1.5"><Car className="w-4 h-4" /> {r.total_days} jour{r.total_days > 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> {formatPrice(r.total_amount)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-3">
                    {r.payment_status === 'unpaid' && r.status !== 'cancelled' && (
                      <span className="badge bg-brand-500 text-white px-3 py-1">Payer maintenant</span>
                    )}
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

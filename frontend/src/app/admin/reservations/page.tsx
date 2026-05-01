'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Calendar, Car, User, MapPin, FileText,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/auth';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  pending:   { label: 'En attente',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  active:    { label: 'En cours',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  completed: { label: 'Terminée',    color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-600',      dot: 'bg-red-500' },
} as const;

const USER_STATUS_CFG = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
} as const;

const REASON_LABELS: Record<string, string> = {
  engine_failure: '🔧 Panne moteur',
  accident:       '🚨 Accident',
  body_damage:    '🔨 Carrosserie',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

interface NoteModalProps {
  onConfirm: (note: string) => void;
  onCancel: () => void;
  action: 'confirmed' | 'cancelled';
}
function NoteModal({ onConfirm, onCancel, action }: NoteModalProps) {
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-900 text-lg mb-2">
          {action === 'confirmed' ? 'Confirmer la réservation' : 'Annuler la réservation'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {action === 'confirmed'
            ? 'Ajoutez une note optionnelle pour le client (instruction de prise en charge, etc.).'
            : 'Indiquez le motif de l\'annulation pour le client.'}
        </p>
        <textarea
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          rows={3}
          placeholder={action === 'confirmed' ? 'Note optionnelle...' : 'Motif d\'annulation...'}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(note)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition ${
              action === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {action === 'confirmed' ? 'Confirmer' : 'Annuler la réservation'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminReservationsContent() {
  const searchParams = useSearchParams();

  const [items,   setItems]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; action: 'confirmed' | 'cancelled' } | null>(null);

  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [q, setQ]           = useState('');
  const [page, setPage]     = useState(1);
  const LIMIT = 15;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (filter) params.status = filter;
      if (q.trim()) params.q = q.trim();
      const res = await adminApi.listReservations(params);
      setItems(res.data.reservations);
      setTotal(res.data.total);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, filter, q]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id: string, status: 'confirmed' | 'cancelled', admin_note?: string) => {
    setModal(null);
    setActioning(id);
    try {
      await adminApi.updateReservationStatus(id, status, admin_note);
      toast.success(status === 'confirmed' ? 'Réservation confirmée ✓' : 'Réservation annulée');
      fetchItems();
    } catch {
      toast.error('Action échouée');
    } finally {
      setActioning(null);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {modal && (
        <NoteModal
          action={modal.action}
          onConfirm={(note) => handleAction(modal.id, modal.action, note)}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Réservations</h1>
          <p className="text-gray-500 mt-1">{total} réservation{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchItems} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Rechercher par client, email, référence..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '',          label: 'Toutes' },
            { value: 'pending',   label: 'En attente' },
            { value: 'confirmed', label: 'Confirmées' },
            { value: 'active',    label: 'En cours' },
            { value: 'cancelled', label: 'Annulées' },
          ].map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                filter === f.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-medium">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réf / Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Véhicule</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif / Localisation</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Ref + status */}
                    <td className="px-5 py-4">
                      <p className="font-mono font-bold text-gray-900 text-xs">{r.id.slice(0, 8).toUpperCase()}</p>
                      <div className="mt-1"><StatusBadge status={r.status} /></div>
                      {r.admin_note && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[120px] truncate" title={r.admin_note}>
                          Note : {r.admin_note}
                        </p>
                      )}
                    </td>
                    {/* Client */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${USER_STATUS_CFG[r.user_status as keyof typeof USER_STATUS_CFG] ?? ''}`}>
                        {r.user_status === 'approved' ? 'Approuvé' : r.user_status === 'rejected' ? 'Rejeté' : 'En attente'}
                      </span>
                    </td>
                    {/* Car */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{r.make} {r.model}</p>
                      <p className="text-xs text-gray-400">{r.year} · {r.color}</p>
                      <p className="text-xs font-mono text-gray-400">{r.license_plate}</p>
                    </td>
                    {/* Reason */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-gray-700">
                        {r.reason ? (REASON_LABELS[r.reason] || r.reason) : '—'}
                      </p>
                      {r.vehicle_location && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[140px]" title={r.vehicle_location}>
                          <MapPin className="w-3 h-3 inline mr-0.5" />
                          {r.vehicle_location.length > 30 ? r.vehicle_location.slice(0, 30) + '…' : r.vehicle_location}
                        </p>
                      )}
                    </td>
                    {/* Dates */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-700">{formatDate(r.start_date)}</p>
                      <p className="text-xs text-gray-400">→ {formatDate(r.end_date)}</p>
                      <p className="text-xs text-gray-400">{r.total_days} jour{r.total_days > 1 ? 's' : ''}</p>
                    </td>
                    {/* Amount */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{formatPrice(r.total_amount)}</p>
                      <p className="text-xs text-gray-400">{formatPrice(r.price_per_day)}/j</p>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2 items-end">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setModal({ id: r.id, action: 'confirmed' })}
                              disabled={actioning === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
                            >
                              {actioning === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Confirmer
                            </button>
                            <button
                              onClick={() => setModal({ id: r.id, action: 'cancelled' })}
                              disabled={actioning === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
                            >
                              <XCircle className="w-3 h-3" /> Refuser
                            </button>
                          </>
                        )}
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => setModal({ id: r.id, action: 'cancelled' })}
                            disabled={actioning === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
                          >
                            <XCircle className="w-3 h-3" /> Annuler
                          </button>
                        )}
                        <Link
                          href={`/reservations/${r.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition whitespace-nowrap"
                        >
                          <FileText className="w-3 h-3" /> Contrat
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">Page {page} sur {pages} · {total} résultats</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminReservationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-8 h-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>}>
      <AdminReservationsContent />
    </Suspense>
  );
}

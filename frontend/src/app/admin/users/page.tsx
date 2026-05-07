'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, CheckCircle, XCircle, Clock, ArrowRight,
  FileText, Loader2, ChevronLeft, ChevronRight, RefreshCw, KeyRound,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  pending:  { label: 'En attente',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  approved: { label: 'Approuvé',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  rejected: { label: 'Rejeté',      color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
} as const;

const DOC_REQUIRED = 7;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function AdminUsersContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [users,   setUsers]   = useState<User[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [q, setQ]           = useState('');
  const [page, setPage]     = useState(1);
  const LIMIT = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (filter) params.status = filter;
      if (q.trim()) params.q = q.trim();
      const res = await adminApi.listUsers(params);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, filter, q]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleResetPassword = async (id: string, name: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${name} ? Un mot de passe temporaire lui sera envoyé par email.`)) return;
    setResetting(id);
    try {
      await adminApi.resetUserPassword(id);
      toast.success(`Mot de passe réinitialisé — email envoyé à ${name}`);
    } catch {
      toast.error('Échec de la réinitialisation');
    } finally {
      setResetting(null);
    }
  };

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActioning(id);
    try {
      await adminApi.updateUserStatus(id, status);
      toast.success(status === 'approved' ? 'Utilisateur approuvé' : 'Utilisateur rejeté');
      fetchUsers();
    } catch {
      toast.error('Action échouée');
    } finally {
      setActioning(null);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">{total} client{total !== 1 ? 's' : ''} enregistré{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchUsers} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
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
            placeholder="Rechercher par nom, email, identifiant..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Tous' },
            { value: 'pending',  label: 'En attente' },
            { value: 'approved', label: 'Approuvés' },
            { value: 'rejected', label: 'Rejetés' },
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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">👤</p>
            <p className="font-medium">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commune</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Docs</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscrit le</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.first_name} {u.last_name}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{u.commune || '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: DOC_REQUIRED }).map((_, i) => (
                            <div key={i} className={`w-2 h-4 rounded-sm ${i < (u.doc_count ?? 0) ? 'bg-green-400' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <span className={`text-xs font-semibold ${(u.doc_count ?? 0) >= DOC_REQUIRED ? 'text-green-600' : 'text-gray-400'}`}>
                          {u.doc_count ?? 0}/{DOC_REQUIRED}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleStatus(u.id, 'approved')}
                            disabled={actioning === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            {actioning === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Approuver
                          </button>
                        )}
                        {u.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatus(u.id, 'rejected')}
                            disabled={actioning === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" /> Rejeter
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(u.id, `${u.first_name} ${u.last_name}`)}
                          disabled={resetting === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          title="Réinitialiser le mot de passe"
                        >
                          {resetting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                          MDP
                        </button>
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                        >
                          <ArrowRight className="w-3 h-3" /> Voir
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
            <p className="text-sm text-gray-500">Page {page} sur {pages}</p>
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

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-8 h-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>}>
      <AdminUsersContent />
    </Suspense>
  );
}

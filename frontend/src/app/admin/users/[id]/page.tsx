'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, FileText, ExternalLink,
  Loader2, User, Phone, MapPin, Calendar, Car, Shield, Trash2, ShieldCheck, Unlock,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/auth';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  pending:  { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approuvé',   color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejeté',     color: 'bg-red-100 text-red-700 border-red-200',       icon: XCircle },
} as const;

const DOC_LABELS: Record<string, string> = {
  driver_license_front:    'Permis de conduire — Recto',
  driver_license_back:     'Permis de conduire — Verso',
  professional_card_front: 'Carte professionnelle — Recto',
  professional_card_back:  'Carte professionnelle — Verso',
  vehicle_registration:    'Carte grise',
  license_document:        'Licence professionnelle',
  kbis:                    'KBIS',
};

const RES_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700' },
  active:    { label: 'En cours',    color: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminée',    color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-600' },
};

const REASON_LABELS: Record<string, string> = {
  engine_failure: '🔧 Panne moteur',
  accident:       '🚨 Accident',
  body_damage:    '🔨 Carrosserie',
};

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [actioning, setActioning] = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  useEffect(() => {
    adminApi.getUserDetails(id)
      .then((r) => setData(r.data))
      .catch(() => { toast.error('Utilisateur introuvable'); router.push('/admin/users'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleManualVerify = async () => {
    setActioning(true);
    try {
      const res = await adminApi.manualVerify(id);
      setData((d: any) => ({ ...d, user: { ...d.user, ...res.data } }));
      toast.success('Compte débloqué et approuvé ✓');
    } catch {
      toast.error('Échec du déblocage');
    } finally {
      setActioning(false);
    }
  };

  const handlePromote = async (role: 'admin' | 'user') => {
    setActioning(true);
    try {
      const res = await adminApi.promoteUser(id, role);
      setData((d: any) => ({ ...d, user: { ...d.user, role: res.data.role } }));
      toast.success(role === 'admin' ? 'Promu administrateur ✓' : 'Rétrogradé utilisateur ✓');
    } catch {
      toast.error('Échec de la modification du rôle');
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement le compte de ${data?.user?.first_name} ${data?.user?.last_name} ?`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(id);
      toast.success('Compte supprimé');
      router.push('/admin/users');
    } catch {
      toast.error('Échec de la suppression');
      setDeleting(false);
    }
  };

  const handleStatus = async (status: 'approved' | 'rejected' | 'pending') => {
    setActioning(true);
    try {
      const res = await adminApi.updateUserStatus(id, status);
      setData((d: any) => ({ ...d, user: { ...d.user, status: res.data.status } }));
      toast.success(
        status === 'approved' ? 'Utilisateur approuvé ✓'
        : status === 'rejected' ? 'Utilisateur rejeté'
        : 'Statut remis en attente'
      );
    } catch {
      toast.error('Échec de la mise à jour');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }
  if (!data) return null;

  const { user, documents, reservations } = data;
  const statusCfg = STATUS_CFG[user.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/admin/users" className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900">{user.first_name} {user.last_name}</h1>
          <p className="text-gray-500 mt-0.5">{user.email}</p>
        </div>
        {/* Status badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${statusCfg.color}`}>
          <StatusIcon className="w-4 h-4" />
          {statusCfg.label}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-500" /> Informations personnelles
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: 'Email',     value: user.email },
                { label: 'Téléphone', value: user.phone || '—' },
                { label: 'Commune',   value: user.commune || '—' },
                { label: 'Naissance', value: user.date_of_birth ? formatDate(user.date_of_birth) : '—' },
                { label: 'Lieu naissance', value: user.place_of_birth || '—' },
                { label: 'Inscrit le', value: formatDate(user.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Professional info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" /> Données professionnelles
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: 'N° permis',          value: user.driver_license_number || '—' },
                { label: 'Carte professionnelle', value: user.professional_card_number || '—' },
                { label: "N° d'immatriculation",  value: user.license_number || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
                  <dd className="text-gray-900 font-medium font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" /> Documents ({documents.length}/7)
            </h2>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Aucun document uploadé</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {DOC_LABELS[doc.type] || doc.type}
                      </p>
                      <p className="text-xs text-gray-400">{doc.file_name} · {(doc.file_size / 1024).toFixed(0)} KB</p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" /> Voir
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent reservations */}
          {reservations.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-4 h-4 text-brand-500" /> Réservations récentes
              </h2>
              <div className="space-y-2">
                {reservations.map((r: any) => {
                  const sc = RES_STATUS_CFG[r.status] ?? RES_STATUS_CFG.pending;
                  return (
                    <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{r.make} {r.model} {r.year}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {REASON_LABELS[r.reason] || r.reason || '—'} · {formatDate(r.start_date)} → {formatDate(r.end_date)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(r.total_amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column — actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-6">
            <h2 className="font-bold text-gray-900 mb-4">Décision sur le dossier</h2>

            <div className={`flex items-center gap-2 p-4 rounded-xl border mb-5 ${statusCfg.color}`}>
              <StatusIcon className="w-4 h-4" />
              <div>
                <p className="font-semibold text-sm">Statut actuel</p>
                <p className="text-xs opacity-75">{statusCfg.label}</p>
              </div>
            </div>

            <div className="space-y-3">
              {user.status !== 'approved' && (
                <button
                  onClick={() => handleStatus('approved')}
                  disabled={actioning}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
                >
                  {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approuver le dossier
                </button>
              )}
              {user.status !== 'rejected' && (
                <button
                  onClick={() => handleStatus('rejected')}
                  disabled={actioning}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Rejeter le dossier
                </button>
              )}
              {user.status !== 'pending' && (
                <button
                  onClick={() => handleStatus('pending')}
                  disabled={actioning}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" /> Remettre en attente
                </button>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-xs text-gray-400">
              <p>• Approuver permet au client d'effectuer des réservations.</p>
              <p>• Rejeter bloque l'accès aux réservations.</p>
              <p>• Documents requis : 7/7 pour dossier complet.</p>
            </div>
          </div>

          {/* Débloquer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-brand-500" /> Débloquer le compte
            </h2>
            <p className="text-xs text-gray-400 mb-4">Force la vérification email + téléphone et approuve le dossier immédiatement.</p>
            <button
              onClick={handleManualVerify}
              disabled={actioning}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              Forcer la vérification
            </button>
          </div>

          {/* Rôle */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" /> Rôle
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Rôle actuel : <span className="font-semibold text-gray-700">{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
            </p>
            {user.role !== 'admin' ? (
              <button
                onClick={() => handlePromote('admin')}
                disabled={actioning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" /> Promouvoir admin
              </button>
            ) : (
              <button
                onClick={() => handlePromote('user')}
                disabled={actioning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                Rétrograder en utilisateur
              </button>
            )}
          </div>

          {/* Danger */}
          <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
            <h2 className="font-bold text-red-600 mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Zone dangereuse
            </h2>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

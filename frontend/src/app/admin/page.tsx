'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Calendar, FileText, Clock, CheckCircle, XCircle, TrendingUp, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminStats } from '@/types';

function StatCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition" />}
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState<AdminStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting]     = useState(false);

  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    adminApi.getStats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleResetDb = async () => {
    setResetting(true);
    try {
      await adminApi.resetDatabase();
      setShowConfirm(false);
      adminApi.getStats().then((r) => setStats(r.data)).catch(() => {});
    } catch {
      // error handled silently; server-side logs the failure
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const u = stats?.users;
  const r = stats?.reservations;
  const d = stats?.documents;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble du système de location B2B</p>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-6">
        {u && u.pending > 0 && (
          <Link href="/admin/users?status=pending" className="block">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100 transition">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800">
                  {u.pending} dossier{u.pending > 1 ? 's' : ''} utilisateur{u.pending > 1 ? 's' : ''} en attente
                </p>
                <p className="text-sm text-amber-600">Approuver ou rejeter des comptes clients</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600" />
            </div>
          </Link>
        )}
        {d && d.pending > 0 && (
          <Link href="/admin/documents" className="block">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 hover:bg-blue-100 transition">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-blue-800">
                  {d.pending} document{d.pending > 1 ? 's' : ''} en attente de vérification
                </p>
                <p className="text-sm text-blue-600">Cliquez pour vérifier les pièces justificatives</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
          </Link>
        )}
      </div>

      {/* User stats */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Utilisateurs</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total clients" value={u?.total ?? 0} icon={Users} color="bg-blue-100 text-blue-600" href="/admin/users" />
        <StatCard label="En attente" value={u?.pending ?? 0} sub="Dossiers à traiter" icon={Clock} color="bg-amber-100 text-amber-600" href="/admin/users?status=pending" />
        <StatCard label="Approuvés" value={u?.approved ?? 0} icon={CheckCircle} color="bg-green-100 text-green-600" href="/admin/users?status=approved" />
        <StatCard label="Rejetés" value={u?.rejected ?? 0} icon={XCircle} color="bg-red-100 text-red-600" href="/admin/users?status=rejected" />
      </div>

      {/* Reservation stats */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Réservations</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={r?.total ?? 0} icon={Calendar} color="bg-purple-100 text-purple-600" href="/admin/reservations" />
        <StatCard label="En attente" value={r?.pending ?? 0} sub="À confirmer" icon={Clock} color="bg-amber-100 text-amber-600" href="/admin/reservations?status=pending" />
        <StatCard label="Confirmées" value={r?.confirmed ?? 0} icon={CheckCircle} color="bg-green-100 text-green-600" href="/admin/reservations?status=confirmed" />
        <StatCard label="En cours" value={r?.active ?? 0} icon={TrendingUp} color="bg-blue-100 text-blue-600" href="/admin/reservations?status=active" />
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Accès rapide</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/admin/users?status=pending" className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Dossiers clients</p>
            <p className="text-sm text-gray-500">Approuver ou rejeter des comptes</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition flex-shrink-0" />
        </Link>
        <Link href="/admin/documents" className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Documents</p>
            <p className="text-sm text-gray-500">Vérifier les pièces justificatives</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition flex-shrink-0" />
        </Link>
        <Link href="/admin/reservations?status=pending" className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Réservations</p>
            <p className="text-sm text-gray-500">Confirmer ou refuser des demandes</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition flex-shrink-0" />
        </Link>
      </div>

      {/* Dev-only danger zone */}
      {isDev && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-4">Zone de développement</h2>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Réinitialiser la base de données</p>
                <p className="text-sm text-red-500">Supprime tous les utilisateurs, réservations et documents. Les voitures sont réinitialisées.</p>
              </div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Reset DEV Database
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Confirmer la réinitialisation</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Cette action supprime <strong>tous les utilisateurs</strong> (sauf vous), toutes les réservations, tous les documents et réinitialise les voitures aux données de base.
              <br /><br />
              Cette opération est <strong>irréversible</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={resetting}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleResetDb}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
                {resetting ? 'Réinitialisation…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

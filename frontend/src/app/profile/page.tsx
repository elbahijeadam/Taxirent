'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, FileText, Shield, Save, Loader2, CheckCircle, XCircle, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { userApi, authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Document, User as UserType } from '@/types';
import DocumentUpload from '@/components/DocumentUpload';
import { formatDate, isLoggedIn } from '@/lib/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'info', label: 'Informations', icon: User },
  { id: 'professional', label: 'Données professionnelles', icon: Shield },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'security', label: 'Sécurité', icon: Lock },
];

function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab');
    return t && ['info', 'professional', 'documents', 'security'].includes(t) ? t : 'info';
  });
  const [form, setForm] = useState<Partial<UserType>>({});
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
  }, []);

  useEffect(() => {
    if (user) setForm({ ...user });
  }, [user]);

  useEffect(() => {
    if (tab === 'documents' && !docsLoaded) {
      userApi.getDocuments().then((res) => { setDocuments(res.data); setDocsLoaded(true); }).catch(() => {});
    }
  }, [tab]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    if (pwForm.next.length < 8) { toast.error('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setPwSaving(true);
    try {
      await authApi.changePassword({ current_password: pwForm.current, new_password: pwForm.next });
      toast.success('Mot de passe modifié.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de modification');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      toast.success('Profil mis à jour !');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="pt-28 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-500" /></div>;

  const notVerified = user && (!user.email_verified || !user.phone_verified);

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-dark-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
          <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">{user?.first_name} {user?.last_name}</h1>
            <p className="text-gray-400 mt-1">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${user?.email_verified ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                <Mail className="w-3 h-3" />
                Email {user?.email_verified ? 'vérifié' : 'non vérifié'}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${user?.phone_verified ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                <Phone className="w-3 h-3" />
                Téléphone {user?.phone_verified ? 'vérifié' : 'non vérifié'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Membre depuis {user ? formatDate(user.created_at) : '...'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Verification banner */}
        {notVerified && (
          <Link href="/auth/verify" className="block mb-6">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100 transition">
              <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 text-sm">Compte non vérifié</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Vérifiez votre {!user?.email_verified ? 'email' : 'téléphone'} pour accéder aux réservations
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg">
                Vérifier →
              </span>
            </div>
          </Link>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition ${tab === id ? 'bg-dark-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Personal Info tab */}
        {tab === 'info' && (
          <div className="card p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="label">Email</label>
                <input type="email" value={form.email || ''} className="input bg-gray-50 cursor-not-allowed" readOnly />
              </div>
              <div>
                <label className="label">Prénom</label>
                <input type="text" value={form.first_name || ''} onChange={set('first_name')} className="input" placeholder="Jean" />
              </div>
              <div>
                <label className="label">Nom</label>
                <input type="text" value={form.last_name || ''} onChange={set('last_name')} className="input" placeholder="Dupont" />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input type="tel" value={form.phone || ''} onChange={set('phone')} className="input" placeholder="+33 6 00 00 00 00" />
              </div>
              <div>
                <label className="label">Commune</label>
                <input type="text" value={form.commune || ''} onChange={set('commune')} className="input" placeholder="Paris 1er" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Adresse complète</label>
                <input type="text" value={(form as any).address || ''} onChange={set('address')} className="input" placeholder="44 rue Grande, 77176 Savigny-le-Temple" />
              </div>
              <div>
                <label className="label">Date de naissance</label>
                <input type="date" value={form.date_of_birth?.split('T')[0] || ''} onChange={set('date_of_birth')} className="input" />
              </div>
              <div>
                <label className="label">Lieu de naissance</label>
                <input type="text" value={form.place_of_birth || ''} onChange={set('place_of_birth')} className="input" placeholder="Paris, France" />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 rounded-xl">
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Sauvegarde...</> : <><Save className="w-5 h-5" /> Sauvegarder</>}
              </button>
            </div>
          </div>
        )}

        {/* Professional tab */}
        {tab === 'professional' && (
          <div className="card p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              Ces informations sont requises pour valider vos réservations professionnelles.
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="label">N° permis de conduire</label>
                <input type="text" value={form.driver_license_number || ''} onChange={set('driver_license_number')} className="input" placeholder="DUPOJ100012A1000" />
              </div>
              <div>
                <label className="label">Date de délivrance du permis</label>
                <input type="date" value={(form as any).driver_license_date?.split('T')[0] || ''} onChange={set('driver_license_date')} className="input" />
              </div>
              <div>
                <label className="label">N° carte professionnelle</label>
                <input type="text" value={form.professional_card_number || ''} onChange={set('professional_card_number')} className="input" placeholder="CPI 75123456" />
              </div>
              <div>
                <label className="label">Numéro d'immatriculation</label>
                <input type="text" value={form.license_number || ''} onChange={set('license_number')} className="input" placeholder="AB-123-CD" />
              </div>
              <div>
                <label className="label">Commune</label>
                <input type="text" value={form.commune || ''} onChange={set('commune')} className="input" placeholder="Paris 1er" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Motif d'immobilisation <span className="text-gray-400 font-normal">(si applicable)</span></label>
                <textarea value={form.reason_for_immobilization || ''} onChange={set('reason_for_immobilization')}
                  className="input min-h-[100px] resize-none" placeholder="Décrivez le motif d'immobilisation du véhicule..." />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 rounded-xl">
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Sauvegarde...</> : <><Save className="w-5 h-5" /> Sauvegarder</>}
              </button>
            </div>
          </div>
        )}

        {/* Documents tab */}
        {tab === 'documents' && (
          <div className="card p-8">
            <h2 className="font-bold text-gray-900 text-xl mb-2">Mes documents</h2>
            <p className="text-gray-500 text-sm mb-6">
              Uploadez vos documents d'identité. Ils sont stockés de façon sécurisée et ne seront consultés que par notre équipe pour valider vos réservations.
            </p>
            <DocumentUpload
              existing={documents}
              onUploaded={(doc) => {
                setDocuments((prev) => {
                  const filtered = prev.filter((d) => d.type !== doc.type);
                  return [...filtered, doc];
                });
              }}
            />
          </div>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <div className="card p-8 max-w-lg">
            <h2 className="font-bold text-gray-900 text-xl mb-1">Changer le mot de passe</h2>
            <p className="text-gray-500 text-sm mb-6">Choisissez un mot de passe d'au moins 8 caractères.</p>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {(['current', 'next', 'confirm'] as const).map((field) => {
                const labels = { current: 'Mot de passe actuel', next: 'Nouveau mot de passe', confirm: 'Confirmer le nouveau mot de passe' };
                return (
                  <div key={field}>
                    <label className="label">{labels[field]}</label>
                    <div className="relative">
                      <input
                        type={pwShow[field] ? 'text' : 'password'}
                        value={pwForm[field]}
                        onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                        className="input pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setPwShow((s) => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {pwShow[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2">
                <button type="submit" disabled={pwSaving} className="btn-primary px-8 py-3 rounded-xl">
                  {pwSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Modification...</> : <><Lock className="w-5 h-5" /> Modifier le mot de passe</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePageWrapper() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('Si cet email existe, un code vous a été envoyé.');
      setStep('reset');
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 8) { toast.error('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, new_password: newPassword });
      setStep('done');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm inline-block">
              <Image src="/logo-taxirent.png" alt="Taxirent" width={120} height={40} className="h-8 w-auto" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'done' ? 'Mot de passe réinitialisé' : 'Mot de passe oublié'}
          </h1>
          <p className="text-gray-500 mt-2">
            {step === 'email' && 'Entrez votre email pour recevoir un code de réinitialisation.'}
            {step === 'reset' && `Code envoyé à ${email}. Entrez-le ci-dessous avec votre nouveau mot de passe.`}
            {step === 'done' && 'Votre mot de passe a bien été mis à jour.'}
          </p>
        </div>

        <div className="card p-8">
          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label className="label">Adresse email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="vous@example.com" required autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base rounded-xl">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi...</> : 'Envoyer le code'}
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                </Link>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="label">Code reçu par email</label>
                <input
                  type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  className="input tracking-widest text-center text-lg font-mono"
                  placeholder="123456" maxLength={6} required autoFocus
                />
              </div>
              <div>
                <label className="label">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input pr-12" placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmer le mot de passe</label>
                <input
                  type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="input" placeholder="••••••••" required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base rounded-xl">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Réinitialisation...</> : 'Réinitialiser le mot de passe'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Renvoyer un code
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="btn-primary w-full py-3 text-base rounded-xl"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

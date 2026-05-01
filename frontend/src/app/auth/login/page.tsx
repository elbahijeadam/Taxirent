'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Car, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Bienvenue !');

      const u = data.user;
      if (!u.email_verified || !u.phone_verified) {
        router.push('/auth/verify');
      } else {
        router.push('/cars');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-brand-500 rounded-xl p-2"><Car className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-bold text-gray-900">AutoRent</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-2">Accédez à votre espace client</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="vous@example.com" required autoFocus
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base rounded-xl">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-brand-500 hover:text-brand-600 font-semibold">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

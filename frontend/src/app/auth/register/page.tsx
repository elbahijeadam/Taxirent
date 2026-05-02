'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, Check, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    commune: '',
    password: '',
    confirm: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const passwordStrength = () => {
    if (form.password.length === 0) return 0;
    let score = 0;
    if (form.password.length >= 8) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[0-9]/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;
    return score;
  };

  const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Mot de passe trop court (min 8 caractères)');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Le numéro de téléphone est requis');
      return;
    }
    setLoading(true);
    try {
      const data = await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        commune: form.commune || undefined,
        password: form.password,
      });

      if (data._dev_otp) {
        toast.success(`[DEV] Code email : ${data._dev_otp}`, { duration: 10000, icon: '🔑' });
      }

      router.push('/auth/verify');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm inline-block">
              <Image src="/logo-taxirent.png" alt="Taxirent" width={120} height={40} className="h-8 w-auto" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Créer un compte professionnel</h1>
          <p className="text-gray-500 mt-2">Accès B2B — Location de véhicules de remplacement</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom <span className="text-red-500">*</span></label>
                <input type="text" value={form.first_name} onChange={set('first_name')} className="input" placeholder="Jean" required />
              </div>
              <div>
                <label className="label">Nom <span className="text-red-500">*</span></label>
                <input type="text" value={form.last_name} onChange={set('last_name')} className="input" placeholder="Dupont" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email professionnel <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="jean@entreprise.fr" required />
            </div>

            {/* Phone + Commune */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Téléphone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    className="input pl-10"
                    placeholder="+33 6 00 00 00 00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Pour la vérification SMS</p>
              </div>
              <div>
                <label className="label">Commune <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.commune}
                    onChange={set('commune')}
                    className="input pl-10"
                    placeholder="Paris 1er"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input pr-12"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Force : <span className="font-medium">{strengthLabels[strength]}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirmer le mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  className="input pr-12"
                  placeholder="••••••••"
                  required
                />
                {form.confirm && form.confirm === form.password && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              Après l'inscription, vous devrez vérifier votre email et votre téléphone pour accéder aux réservations.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base rounded-xl mt-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Création du compte...</> : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-brand-500 hover:text-brand-600 font-semibold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

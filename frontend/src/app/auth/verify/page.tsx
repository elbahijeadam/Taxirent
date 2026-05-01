'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Mail, Phone, CheckCircle, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getUser, getToken, saveAuth } from '@/lib/auth';
import { User } from '@/types';
import toast from 'react-hot-toast';

/* ── 6-box OTP input ───────────────────────────────────────────────────── */
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const r0 = useRef<HTMLInputElement>(null);
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  const handleChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Handle paste of full code
    const pasted = raw.replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 1) {
      onChange(pasted);
      refs[Math.min(pasted.length, 5)].current?.focus();
      return;
    }
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(6, ' ').split('');
    chars[i] = digit || ' ';
    onChange(chars.join('').trimEnd().replace(/ /g, ''));
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      refs[Math.min(pasted.length, 5)].current?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          disabled={disabled}
          className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold border-2 rounded-xl transition
            focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20
            ${value[i] ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-900'}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}

/* ── Resend countdown button ────────────────────────────────────────────── */
function ResendButton({
  onResend,
  disabled,
}: {
  onResend: () => Promise<void>;
  disabled?: boolean;
}) {
  const [countdown, setCountdown] = useState(60);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    setSending(true);
    try {
      await onResend();
      setCountdown(60);
    } finally {
      setSending(false);
    }
  };

  if (countdown > 0) {
    return (
      <p className="text-sm text-gray-400 text-center">
        Renvoyer le code dans <span className="font-semibold text-gray-600">{countdown}s</span>
      </p>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={sending || disabled}
      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 mx-auto block"
    >
      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      Renvoyer le code
    </button>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
type Step = 'loading' | 'email' | 'phone' | 'done';

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load user state and determine step
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/auth/login'); return; }

    const stored = getUser();
    if (stored) applyUser(stored);

    authApi.getMe().then((res) => {
      const u: User = res.data;
      localStorage.setItem('user', JSON.stringify(u));
      applyUser(u);
    }).catch(() => {
      router.replace('/auth/login');
    });
  }, []);

  const applyUser = (u: User) => {
    setUser(u);
    if (u.email_verified && u.phone_verified) {
      setStep('done');
    } else if (u.email_verified) {
      setStep('phone');
    } else {
      setStep('email');
    }
  };

  // Redirect once done
  useEffect(() => {
    if (step === 'done') {
      toast.success('Compte vérifié !');
      router.replace('/profile');
    }
  }, [step]);

  const patchUser = (patch: Partial<User>) => {
    const token = getToken();
    const current = getUser();
    if (token && current) {
      const updated = { ...current, ...patch };
      saveAuth(token, updated);
      setUser(updated);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Entrez les 6 chiffres du code'); return; }
    setSubmitting(true);
    try {
      const res = await authApi.verifyEmail(otp);
      patchUser({ email_verified: true });
      setOtp('');
      if (res.data._dev_otp) {
        toast.success(`[DEV] Code SMS : ${res.data._dev_otp}`, { duration: 10000, icon: '📱' });
      }
      toast.success('Email vérifié !');
      setStep('phone');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Code invalide');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Entrez les 6 chiffres du code'); return; }
    setSubmitting(true);
    try {
      await authApi.verifyPhone(otp);
      patchUser({ phone_verified: true });
      setStep('done');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Code invalide');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = useCallback(async (type: 'email' | 'phone') => {
    try {
      const res = await authApi.resendOtp(type);
      if (res.data._dev_otp) {
        toast.success(`[DEV] Nouveau code : ${res.data._dev_otp}`, { duration: 10000, icon: '🔑' });
      } else {
        toast.success(`Code renvoyé !`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Échec de l'envoi");
      throw err;
    }
  }, []);

  /* ── Render helpers ── */
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {/* Email step */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition
          ${step === 'email' ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
            : (step === 'phone' || step === 'done') ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-500'}`}>
          {(step === 'phone' || step === 'done') ? <CheckCircle className="w-4 h-4" /> : '1'}
        </div>
        <span className={`text-sm font-medium hidden sm:block ${step === 'email' ? 'text-gray-900' : 'text-gray-400'}`}>
          Email
        </span>
      </div>

      <div className={`w-10 h-0.5 ${step !== 'email' ? 'bg-green-400' : 'bg-gray-200'}`} />

      {/* Phone step */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition
          ${step === 'phone' ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
            : step === 'done' ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-500'}`}>
          {step === 'done' ? <CheckCircle className="w-4 h-4" /> : '2'}
        </div>
        <span className={`text-sm font-medium hidden sm:block ${step === 'phone' ? 'text-gray-900' : 'text-gray-400'}`}>
          Téléphone
        </span>
      </div>
    </div>
  );

  if (step === 'loading') {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-900">Compte vérifié !</p>
          <p className="text-gray-500 mt-2">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-brand-500 rounded-xl p-2"><Car className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-bold text-gray-900">AutoRent</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Vérification du compte</h1>
          <p className="text-gray-500 mt-2 text-sm">Deux étapes pour sécuriser votre accès</p>
        </div>

        <div className="card p-8">
          <StepIndicator />

          {/* ── Email step ── */}
          {step === 'email' && (
            <form onSubmit={handleSubmitEmail} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">1. Vérifiez votre email</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Un code à 6 chiffres a été envoyé à<br />
                  <span className="font-semibold text-gray-700">{user?.email}</span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={submitting} />

              <button
                type="submit"
                disabled={submitting || otp.length < 6}
                className="btn-primary w-full py-3 text-base rounded-xl flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</>
                  : <><ArrowRight className="w-5 h-5" /> Vérifier l'email</>}
              </button>

              <div className="text-center">
                <ResendButton onResend={() => handleResend('email')} disabled={submitting} />
              </div>
            </form>
          )}

          {/* ── Phone step ── */}
          {step === 'phone' && (
            <form onSubmit={handleSubmitPhone} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">2. Vérifiez votre téléphone</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Un code à 6 chiffres a été envoyé par SMS au<br />
                  <span className="font-semibold text-gray-700">{user?.phone || 'votre numéro'}</span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={submitting} />

              <button
                type="submit"
                disabled={submitting || otp.length < 6}
                className="btn-primary w-full py-3 text-base rounded-xl flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</>
                  : <><CheckCircle className="w-5 h-5" /> Finaliser la vérification</>}
              </button>

              <div className="text-center">
                <ResendButton onResend={() => handleResend('phone')} disabled={submitting} />
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Problème ?{' '}
          <Link href="/auth/login" className="text-brand-500 hover:underline">
            Retourner à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

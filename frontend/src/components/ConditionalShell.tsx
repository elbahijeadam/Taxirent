'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './Navbar';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-gray-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── Trust strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14 pb-14 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-1">Données sécurisées</p>
              <p className="text-gray-500 text-xs leading-relaxed">Chiffrement bout en bout. Authentification 2FA. Conforme RGPD.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-1">Vérification automatisée</p>
              <p className="text-gray-500 text-xs leading-relaxed">OCR instantané + revue manuelle par notre équipe si nécessaire.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-1">Paiements protégés</p>
              <p className="text-gray-500 text-xs leading-relaxed">Dépôts via Stripe, certifié PCI-DSS. Aucune donnée bancaire stockée.</p>
            </div>
          </div>
        </div>

        {/* ── Main footer columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <div className="bg-white rounded-xl px-2 py-1 inline-block">
                <Image
                  src="/logo-taxirent.png"
                  alt="Taxirent"
                  width={120}
                  height={40}
                  className="h-9 w-auto"
                />
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs mb-6">
              La plateforme SaaS de référence pour la gestion et la mise en relation dans le secteur de la location de véhicules professionnels.
            </p>
            <div className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <p className="font-medium text-gray-500">Taxirent SARL — Capital 10 000 €</p>
              <p>RCS Paris 123 456 789</p>
              <p>TVA FR12 123456789</p>
              <p>7 Allée de Lille, 91170 Viry-Châtillon</p>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-widest mb-5">Plateforme</h4>
            <ul className="space-y-3">
              {[
                { href: '/cars',            label: 'Véhicules disponibles' },
                { href: '/auth/login',      label: 'Connexion' },
                { href: '/auth/register',   label: 'Créer un compte' },
                { href: '/profile',         label: 'Mon espace' },
                { href: '/reservations',    label: 'Mes réservations' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + contact */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-widest mb-5">Légal & Contact</h4>
            <ul className="space-y-3 mb-6">
              {[
                { href: '/mentions-legales', label: 'Mentions légales' },
                { href: '/confidentialite',  label: 'Confidentialité (RGPD)' },
                { href: '/cgu',              label: 'CGU' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="text-xs text-gray-600 space-y-1.5 leading-relaxed border-t border-white/5 pt-5">
              <p>
                <a href="mailto:taxirent.contact@gmail.com" className="text-gray-400 hover:text-white transition-colors">
                  taxirent.contact@gmail.com
                </a>
              </p>
              <p>
                <a href="tel:+33606763589" className="text-gray-400 hover:text-white transition-colors">
                  +33 6 06 76 35 89
                </a>
              </p>
              <p className="text-gray-600">Gérant : Monir El Bahije</p>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © {year} Taxirent SARL — Tous droits réservés
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-700">
            <span>Hébergé par OVHcloud (France)</span>
            <span className="text-gray-800">•</span>
            <span>Droit français applicable — Tribunaux de Paris</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Building2, Globe, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentions légales — Taxirent',
  description: 'Mentions légales de Taxirent EURL, conformément à la loi n° 2004-575 du 21 juin 2004.',
};

const SECTIONS = [
  { id: 'editeur',     label: 'Éditeur de la plateforme',    Icon: Building2 },
  { id: 'directeur',   label: 'Directeur de la publication',  Icon: Globe },
  { id: 'hebergement', label: 'Hébergement',                  Icon: Globe },
  { id: 'droit',       label: 'Droit applicable',             Icon: Scale },
];

export default function MentionsLegalesPage() {
  return (
    <div className="pt-16 bg-gray-50 min-h-screen">

      <div className="bg-dark-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-400">Mentions légales</span>
          </nav>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-3">Mentions légales</h1>
              <p className="text-gray-400 text-base max-w-xl leading-relaxed">
                Conformément à la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans
                l'Économie Numérique (LCEN).
              </p>
            </div>
            <div className="text-xs text-gray-600 shrink-0 mt-1">
              <p>Dernière mise à jour</p>
              <p className="text-gray-400 font-semibold mt-0.5">7 mai 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-10 items-start">

          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Sommaire</p>
              <nav className="space-y-1">
                {SECTIONS.map(({ id, label, Icon }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-brand-50 px-3 py-2 rounded-xl transition-colors duration-150 group"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-500 shrink-0" />
                    <span>{label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-6">

            {/* Éditeur */}
            <div id="editeur" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">1. Éditeur de la plateforme</h2>
              </div>
              <div className="px-8 py-7">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Dénomination sociale',         value: 'Taxirent' },
                    { label: 'Forme juridique',              value: 'EURL de droit français' },
                    { label: 'Capital social',               value: '100 €' },
                    { label: 'SIRET',                        value: '921 300 190 00011' },
                    { label: 'RCS',                          value: '921 300 190 RCS Évry' },
                    { label: 'TVA intracommunautaire',       value: 'FR42 921 300 190' },
                    { label: 'Siège social',                 value: '7 Allée de Lille, 91170 Viry-Châtillon, France' },
                    { label: 'Email',                        value: 'taxirent.contact@gmail.com', isLink: true, href: 'mailto:taxirent.contact@gmail.com' },
                    { label: 'Téléphone',                    value: '+33 6 06 76 35 89', isLink: true, href: 'tel:+33606763589' },
                  ].map(({ label, value, isLink, href }: { label: string; value: string; isLink?: boolean; href?: string }) => (
                    <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      {isLink ? (
                        <a href={href} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">{value}</a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Directeur */}
            <div id="directeur" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">2. Directeur de la publication</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Le directeur de la publication est <strong className="text-gray-900">Monir El Bahije</strong>,
                  en qualité de gérant de Taxirent EURL.
                </p>
              </div>
            </div>

            {/* Hébergement */}
            <div id="hebergement" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">3. Hébergement</h2>
              </div>
              <div className="px-8 py-7 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Frontend</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Hébergeur', value: 'Vercel, Inc.' },
                      { label: 'Adresse',   value: '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis' },
                      { label: 'Site web',  value: 'vercel.com', isLink: true, href: 'https://vercel.com' },
                    ].map(({ label, value, isLink, href }: { label: string; value: string; isLink?: boolean; href?: string }) => (
                      <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        {isLink ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">{value}</a>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Backend & base de données</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Hébergeur', value: 'Railway Corporation' },
                      { label: 'Adresse',   value: '1111 6th Avenue, San Diego, CA 92101, États-Unis' },
                      { label: 'Site web',  value: 'railway.app', isLink: true, href: 'https://railway.app' },
                    ].map(({ label, value, isLink, href }: { label: string; value: string; isLink?: boolean; href?: string }) => (
                      <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        {isLink ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">{value}</a>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Droit applicable */}
            <div id="droit" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">4. Droit applicable</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Les présentes mentions légales sont soumises au <strong className="text-gray-900">droit français</strong>.
                  Tout litige relève de la compétence exclusive du <strong className="text-gray-900">Tribunal de commerce d'Évry-Courcouronnes</strong>.
                </p>
              </div>
            </div>

            {/* Contact strip */}
            <div className="bg-dark-900 rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-white font-semibold text-base mb-1">Une question ?</p>
                <p className="text-gray-400 text-sm">Contactez-nous par email.</p>
              </div>
              <a
                href="mailto:taxirent.contact@gmail.com"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors duration-200 shrink-0"
              >
                taxirent.contact@gmail.com
              </a>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

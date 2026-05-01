import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Building2, Globe, Shield, AlertTriangle, Link2, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentions légales — Taxirent',
  description: 'Mentions légales de Taxirent SARL. Informations sur l\'éditeur, l\'hébergeur, la propriété intellectuelle et les conditions d\'utilisation.',
};

const SECTIONS = [
  { id: 'editeur',            label: 'Éditeur de la plateforme',    Icon: Building2 },
  { id: 'directeur',         label: 'Directeur de la publication',  Icon: Globe },
  { id: 'presentation',      label: 'Présentation du service',      Icon: Globe },
  { id: 'hebergement',       label: 'Hébergement',                  Icon: Globe },
  { id: 'propriete',         label: 'Propriété intellectuelle',     Icon: Shield },
  { id: 'responsabilite',    label: 'Limitation de responsabilité', Icon: AlertTriangle },
  { id: 'liens',             label: 'Liens hypertextes',            Icon: Link2 },
  { id: 'droit',             label: 'Droit applicable',             Icon: Scale },
];

export default function MentionsLegalesPage() {
  return (
    <div className="pt-16 bg-gray-50 min-h-screen">

      {/* ── Page header ── */}
      <div className="bg-dark-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Breadcrumb */}
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
                l'Économie Numérique (LCEN), les présentes mentions légales sont portées
                à la connaissance de tout utilisateur de la plateforme Taxirent.
              </p>
            </div>
            <div className="text-xs text-gray-600 shrink-0 mt-1">
              <p>Dernière mise à jour</p>
              <p className="text-gray-400 font-semibold mt-0.5">1er janvier 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-10 items-start">

          {/* ── Sticky table of contents ── */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Sommaire
              </p>
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

            {/* Legal badge */}
            <div className="mt-4 bg-brand-500/8 border border-brand-500/15 rounded-2xl p-4">
              <p className="text-xs text-brand-600 font-semibold mb-1">Droit applicable</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Droit français — Tribunaux de Paris compétents.
              </p>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* Company card */}
            <div id="editeur" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">1. Éditeur de la plateforme</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  La plateforme <strong className="text-gray-900">Taxirent</strong> est éditée par la société suivante :
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Dénomination sociale',         value: 'Taxirent SARL' },
                    { label: 'Forme juridique',              value: 'SARL de droit français' },
                    { label: 'Capital social',               value: '10 000 €' },
                    { label: 'Siège social',                 value: '7 Allée de Lille, 91170 Viry-Châtillon, France' },
                    { label: 'Immatriculation',              value: 'RCS Paris 123 456 789' },
                    { label: 'TVA intracommunautaire',       value: 'FR12 123456789' },
                    { label: 'Email',                        value: 'contact@taxirent.com', isLink: true, href: 'mailto:contact@taxirent.com' },
                    { label: 'Téléphone',                    value: '+33 6 06 76 35 89',    isLink: true, href: 'tel:+33606763589' },
                  ].map(({ label, value, isLink, href }) => (
                    <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      {isLink ? (
                        <a href={href} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Director */}
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
                  en qualité de gérant de Taxirent SARL.
                </p>
              </div>
            </div>

            {/* Service description */}
            <div id="presentation" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">3. Présentation de la plateforme</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  Taxirent est une <strong className="text-gray-900">plateforme SaaS spécialisée dans la gestion et la mise en relation dans le secteur de la location de véhicules professionnels</strong>.
                  Elle propose aux professionnels de la mobilité (conducteurs VTC, taxis, gestionnaires de flotte) les fonctionnalités suivantes :
                </p>
                <ul className="space-y-3">
                  {[
                    'Gestion de comptes professionnels avec vérification d\'identité renforcée',
                    'Vérification automatisée des documents par reconnaissance optique de caractères (OCR) et score de confiance algorithmique',
                    'Revue manuelle des documents par un administrateur qualifié si nécessaire',
                    'Demandes de réservation de véhicules de remplacement',
                    'Pré-autorisation de dépôt de garantie (1 500 €) via le prestataire Stripe, Inc.',
                    'Génération et conservation de contrats de location au format numérique',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="mt-1 w-4 h-4 rounded-full bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 block" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hosting */}
            <div id="hebergement" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">4. Hébergement</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  La plateforme Taxirent est hébergée par :
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Hébergeur',   value: 'OVHcloud SAS' },
                    { label: 'Adresse',     value: '2 rue Kellermann, 59100 Roubaix, France' },
                    { label: 'Téléphone',   value: '+33 9 72 10 10 07', isLink: true, href: 'tel:+33972101007' },
                    { label: 'Site web',    value: 'www.ovhcloud.com',  isLink: true, href: 'https://www.ovhcloud.com' },
                  ].map(({ label, value, isLink, href }) => (
                    <div key={label} className="bg-gray-50 rounded-xl px-5 py-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      {isLink ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Intellectual property */}
            <div id="propriete" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">5. Propriété intellectuelle</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  L'ensemble des éléments constituant la plateforme Taxirent — notamment la dénomination sociale,
                  le logo, la charte graphique, les textes, les fonctionnalités, les algorithmes de vérification
                  et le code source — est la propriété exclusive de <strong className="text-gray-900">Taxirent SARL</strong> et
                  est protégé par les dispositions du Code de la propriété intellectuelle français.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong>Important :</strong> Toute reproduction, représentation, modification, publication,
                    adaptation ou exploitation non autorisée de tout ou partie de ces éléments, par quelque moyen
                    ou procédé que ce soit, est strictement interdite et constitue une contrefaçon sanctionnée par
                    les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                  </p>
                </div>
              </div>
            </div>

            {/* Liability */}
            <div id="responsabilite" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">6. Limitation de responsabilité</h2>
              </div>
              <div className="px-8 py-7 space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Taxirent SARL s'efforce de maintenir la plateforme accessible et fonctionnelle en permanence.
                  Toutefois, conformément aux dispositions applicables du droit français, la société ne saurait
                  être tenue responsable des interruptions de service liées à des opérations de maintenance,
                  à des défaillances techniques imprévues, ou à des événements constitutifs de force majeure
                  au sens de l'article 1218 du Code civil.
                </p>
                <p>
                  Les informations présentées sur la plateforme sont fournies à titre indicatif et peuvent être
                  modifiées à tout moment sans préavis préalable. Taxirent SARL ne saurait garantir l'exactitude,
                  l'exhaustivité ou l'actualité des informations publiées.
                </p>
                <p>
                  Le système de vérification automatisée par OCR est un <strong className="text-gray-900">outil d'aide à la décision</strong>.
                  Taxirent SARL ne garantit pas l'exactitude absolue des résultats produits par l'analyse algorithmique.
                  La décision finale de validation reste soumise, le cas échéant, à l'examen d'un administrateur qualifié.
                </p>
              </div>
            </div>

            {/* Hyperlinks */}
            <div id="liens" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">7. Liens hypertextes</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed">
                  La plateforme peut contenir des liens vers des sites tiers. Taxirent SARL ne contrôle pas le
                  contenu de ces sites et décline toute responsabilité quant à leur contenu, leur politique de
                  confidentialité ou les éventuels dommages résultant de leur consultation. La création de liens
                  hypertextes vers la plateforme Taxirent est soumise à autorisation écrite préalable de
                  Taxirent SARL.
                </p>
              </div>
            </div>

            {/* Applicable law */}
            <div id="droit" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
              <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-brand-500" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">8. Droit applicable et juridiction compétente</h2>
              </div>
              <div className="px-8 py-7">
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  Les présentes mentions légales sont soumises et interprétées conformément au{' '}
                  <strong className="text-gray-900">droit français</strong>. Tout litige relatif à leur
                  interprétation ou à leur exécution, à défaut de résolution amiable, sera soumis à la
                  compétence exclusive des{' '}
                  <strong className="text-gray-900">tribunaux compétents du ressort de Paris</strong>,
                  et ce conformément aux règles du Code de procédure civile.
                </p>
                <div className="bg-brand-50 border border-brand-500/20 rounded-xl px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Scale className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-brand-900 mb-1">Juridiction compétente</p>
                      <p className="text-sm text-brand-700 leading-relaxed">
                        Tribunaux de Paris — Droit français applicable.
                        En cas de litige, les parties s'engagent à rechercher en priorité une résolution amiable
                        en contactant <a href="mailto:contact@taxirent.com" className="underline hover:text-brand-800">contact@taxirent.com</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer contact strip */}
            <div className="bg-dark-900 rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-white font-semibold text-base mb-1">Une question juridique ?</p>
                <p className="text-gray-400 text-sm">Notre équipe vous répond dans les meilleurs délais.</p>
              </div>
              <a
                href="mailto:contact@taxirent.com"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors duration-200 shrink-0"
              >
                contact@taxirent.com
              </a>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

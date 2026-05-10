import Link from 'next/link';
import { ArrowRight, Shield, FileCheck, CreditCard, FileText } from 'lucide-react';

const STATS = [
  { value: '100%',    label: 'Processus en ligne' },
  { value: '1 500€',  label: 'Dépôt de garantie sécurisé' },
  { value: 'Sous 48h', label: 'Validation de votre dossier' },
  { value: '24/7',    label: 'Disponibilité plateforme' },
];

const FEATURES = [
  {
    icon: FileCheck,
    title: 'Vérification documentaire automatisée',
    desc: 'Déposez vos pièces une seule fois : permis, carte professionnelle, carte grise, Kbis. Notre système les analyse par OCR et notifie l\'équipe si une revue manuelle est nécessaire.',
  },
  {
    icon: Shield,
    title: 'Sécurité & conformité RGPD',
    desc: 'Authentification à deux facteurs, chiffrement des données, stockage sécurisé. Vos informations personnelles sont protégées conformément au droit français.',
  },
  {
    icon: CreditCard,
    title: 'Dépôt de garantie sécurisé',
    desc: 'Un dépôt de 1 500 € est pré-autorisé via notre partenaire de caution agréé. Aucun prélèvement immédiat — la somme est libérée automatiquement à la fin de la location.',
  },
  {
    icon: FileText,
    title: 'Contrat numérique automatique',
    desc: 'Une fois votre dossier validé, votre contrat de location est généré et transmis automatiquement. Aucun document papier, aucune démarche supplémentaire de votre part.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Créez votre compte',
    desc: 'Inscription en ligne en quelques minutes. Votre adresse email et votre numéro de téléphone sont vérifiés pour sécuriser l\'accès.',
  },
  {
    num: '02',
    title: 'Déposez vos documents',
    desc: 'Permis de conduire, carte professionnelle VTC/taxi, carte grise et Kbis. Notre système les analyse automatiquement par OCR.',
  },
  {
    num: '03',
    title: 'Réservez et sécurisez',
    desc: 'Choisissez un véhicule disponible et autorisez un dépôt de garantie de 1 500 €. Aucun prélèvement n\'est effectué à ce stade.',
  },
  {
    num: '04',
    title: 'Validation & prise en charge',
    desc: 'Un administrateur valide votre dossier. Votre contrat est généré automatiquement et vous êtes notifié par email.',
  },
];

const USE_CASES = [
  {
    title: 'Panne ou accident',
    desc: 'Votre véhicule est immobilisé de façon inattendue ? Réservez un relais homologué taxi en ligne et limitez l\'interruption de votre activité au strict minimum.',
  },
  {
    title: 'Révision ou contrôle technique',
    desc: 'Planifiez votre entretien sereinement. Un véhicule de remplacement équipé est disponible le temps des interventions, sans impact sur vos courses.',
  },
  {
    title: 'Besoin ponctuel',
    desc: 'Besoin d\'un véhicule supplémentaire sur une période donnée ? Taxirent vous propose une solution flexible, sans engagement à long terme.',
  },
];

const CATEGORIES = [
  { name: 'Économique',  emoji: '🚗', desc: 'Pratique et économique', href: '/cars?category=economy' },
  { name: 'SUV',        emoji: '🚙', desc: 'Espace et confort',       href: '/cars?category=suv' },
  { name: 'Hybride',    emoji: '🌿', desc: 'Écologique et moderne',   href: '/cars?category=hybrid' },
  { name: 'Électrique', emoji: '⚡', desc: 'Zéro émission',           href: '/cars?category=electric' },
];

export default function HomePage() {
  return (
    <div className="pt-16">

      {/* ── Hero ── */}
      <section className="relative bg-dark-900 text-white overflow-hidden min-h-[85vh] flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(ellipse at 20% 60%, #16a34a 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #166534 0%, transparent 50%)' }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-brand-500/15 text-brand-400 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-brand-500/25 tracking-wide">
              ✦ Île-de-France · Véhicules homologués taxi
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.08] mb-7 tracking-tight">
              Votre taxi en panne ?<br />
              <span className="text-brand-500">Reprenez la route.</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
              Taxirent met à disposition des véhicules relais équipés pour les chauffeurs de taxi en Île-de-France. Réservation 100 % en ligne, contrat généré automatiquement.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="btn-primary text-base px-8 py-4 rounded-2xl shadow-lg shadow-brand-500/25">
                Démarrer gratuitement <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/cars" className="inline-flex items-center gap-2 text-base px-8 py-4 rounded-2xl bg-white/8 hover:bg-white/14 text-white border border-white/15 font-semibold transition-all duration-200">
                Voir les véhicules
              </Link>
            </div>
            <p className="mt-5 text-xs text-gray-600">
              Sans engagement &nbsp;·&nbsp; Conforme RGPD &nbsp;·&nbsp; Droit français applicable
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/8 bg-white/4 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((s) => (
                <div key={s.label} className="text-center py-1">
                  <p className="text-2xl lg:text-3xl font-extrabold text-brand-500 tabular-nums">{s.value}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="bg-gray-50 border-b border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-xs text-gray-500 font-medium">
            {[
              'Chiffrement bout en bout',
              'OCR + revue manuelle',
              'Stripe PCI-DSS niveau 1',
              'Infrastructure cloud sécurisée',
              'Conforme RGPD',
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Pour qui ?</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">Conçu pour les chauffeurs de taxi professionnels</h2>
          <p className="text-gray-500 mt-3 text-lg max-w-2xl mx-auto">
            Un véhicule immobilisé, c'est une journée de revenus perdue. Taxirent vous propose un relais homologué taxi, disponible en Île-de-France, réservable en ligne en quelques minutes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {USE_CASES.map(({ title, desc }) => (
            <div key={title} className="card p-8 border-l-2 border-brand-500">
              <h3 className="font-bold text-gray-900 text-lg mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Comment ça marche</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3">De l'inscription à la prise en charge</h2>
            <p className="text-gray-500 mt-3 text-lg max-w-lg mx-auto">Un processus guidé, entièrement en ligne, sans démarche papier.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative group">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-px bg-gradient-to-r from-brand-500/40 to-transparent z-0" />
                )}
                <div className="relative z-10 card p-7 h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 mb-5">
                    <span className="text-brand-500 font-extrabold text-lg">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-dark-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-4xl font-bold mt-3">Ce que Taxirent fait pour vous</h2>
            <p className="text-gray-400 mt-3 text-lg max-w-lg mx-auto">Une plateforme pensée pour simplifier chaque étape, de la constitution du dossier à la restitution du véhicule.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-7 rounded-2xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-brand-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-brand-500/15 rounded-xl flex items-center justify-center mb-5 group-hover:bg-brand-500 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-brand-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-base mb-2 text-white">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vehicle categories ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Flotte disponible</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">Un véhicule pour chaque mission</h2>
          <p className="text-gray-500 mt-3 text-lg">Berlines, SUV, hybrides et électriques disponibles en Île-de-France.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="card group p-8 text-center hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 hover:border-brand-500/30"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{c.emoji}</div>
              <h3 className="font-bold text-gray-900 text-base mb-1">{c.name}</h3>
              <p className="text-gray-500 text-xs">{c.desc}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/cars" className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 font-semibold text-sm transition-colors">
            Voir tous les véhicules <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 rounded-3xl px-8 py-16 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 0%, transparent 50%)' }} />
          <div className="relative flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                Prêt à reprendre la route ?
              </h2>
              <p className="text-brand-100 text-lg mb-8 leading-relaxed">
                Créez votre compte gratuitement et constituez votre dossier en ligne. Aucun engagement, aucun frais d'inscription.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-all duration-200 text-base shadow-lg">
                  Créer mon compte <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/cars" className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-2xl transition-all duration-200 text-base">
                  Voir les véhicules
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0 w-full lg:w-auto">
              <ul className="space-y-3 text-sm text-brand-100">
                {[
                  'Inscription et dépôt de dossier 100 % en ligne',
                  'Validation administrative sous 48 h',
                  'Dépôt de garantie sans prélèvement immédiat',
                  'Contrat généré et transmis automatiquement',
                  'Véhicules homologués taxi en Île-de-France',
                  'Données sécurisées et conformes RGPD',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-10 text-center text-brand-200 text-xs">
            Taxirent EURL — 7 Allée de Lille, 91170 Viry-Châtillon · taxirent.contact@gmail.com
          </p>
        </div>
      </section>

    </div>
  );
}

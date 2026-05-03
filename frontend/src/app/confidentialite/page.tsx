import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Taxirent',
  description: 'Politique de confidentialité et protection des données personnelles (RGPD) de Taxirent.',
};

export default function ConfidentialitePage() {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold mb-2">Politique de confidentialité</h1>
          <p className="text-gray-400">Conformité RGPD — Dernière mise à jour : mai 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Responsable du traitement</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Taxirent SARL — 7 Allée de Lille, 91170 Viry-Châtillon<br />
            Email : <a href="mailto:taxirent.contact@gmail.com" className="text-brand-500 hover:underline">taxirent.contact@gmail.com</a><br />
            Gérant : Monir El Bahije
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Données collectées</h2>
          <p className="text-gray-600 text-sm leading-relaxed">Dans le cadre de l'utilisation de la plateforme Taxirent, nous collectons les données suivantes :</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li>Données d'identité : nom, prénom, date et lieu de naissance</li>
            <li>Coordonnées : email, téléphone, adresse postale</li>
            <li>Données professionnelles : numéro de permis, carte professionnelle, numéro de conventionnement</li>
            <li>Documents justificatifs : permis de conduire, KBIS, carte grise</li>
            <li>Données de connexion : adresse IP, logs d'accès, tokens JWT</li>
            <li>Données de réservation : véhicule loué, dates, motif d'immobilisation, plaque du véhicule immobilisé</li>
          </ul>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">3. Finalités du traitement</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li>Gestion des comptes utilisateurs et authentification</li>
            <li>Vérification de l'éligibilité professionnelle (chauffeur de taxi)</li>
            <li>Génération et envoi des contrats de location</li>
            <li>Traitement des demandes de réservation</li>
            <li>Gestion des dépôts de garantie via Stripe</li>
            <li>Communication relative aux réservations (emails transactionnels)</li>
            <li>Obligations légales et comptables</li>
          </ul>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">4. Base légale</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Le traitement est fondé sur l'exécution du contrat (art. 6.1.b RGPD) pour les données nécessaires à la réservation, et sur l'intérêt légitime (art. 6.1.f RGPD) pour la sécurisation de la plateforme. Les documents d'identité sont traités sur la base du consentement explicite (art. 6.1.a RGPD).
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">5. Durée de conservation</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li>Données de compte actif : durée d'utilisation + 3 ans après la dernière connexion</li>
            <li>Documents justificatifs : durée du contrat + 5 ans (obligations comptables)</li>
            <li>Logs de connexion : 12 mois</li>
            <li>Données de réservation : 10 ans (prescription contractuelle)</li>
          </ul>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">6. Destinataires des données</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Les données sont accessibles uniquement aux équipes Taxirent habilitées. Elles peuvent être transmises à :
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li><strong>Stripe</strong> — traitement des paiements (certifié PCI-DSS)</li>
            <li><strong>Resend</strong> — envoi d'emails transactionnels</li>
            <li><strong>Railway / OVHcloud</strong> — hébergement des données en France/UE</li>
          </ul>
          <p className="text-sm text-gray-600">Aucune donnée n'est vendue à des tiers ni utilisée à des fins commerciales.</p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">7. Vos droits</h2>
          <p className="text-gray-600 text-sm leading-relaxed">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit à l'effacement ("droit à l'oubli")</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit de retrait du consentement</li>
          </ul>
          <p className="text-sm text-gray-600">
            Pour exercer ces droits : <a href="mailto:taxirent.contact@gmail.com" className="text-brand-500 hover:underline">taxirent.contact@gmail.com</a>. Réponse sous 30 jours. Vous pouvez également saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">CNIL</a> en cas de litige.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">8. Sécurité</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Taxirent met en œuvre les mesures techniques et organisationnelles appropriées : chiffrement TLS des communications, hachage bcrypt des mots de passe (coût 12), authentification à deux facteurs (OTP email), accès restreint aux documents par token JWT, protection contre les injections SQL (requêtes paramétrées).
          </p>
        </section>

      </div>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Taxirent",
  description: "Conditions Générales d'Utilisation de la plateforme Taxirent.",
};

export default function CguPage() {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-gray-400">Dernière mise à jour : mai 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Objet</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Taxirent, accessible à l'adresse taxirent.fr, éditée par Taxirent SARL (ci-après "Taxirent"). En créant un compte, l'utilisateur accepte sans réserve les présentes CGU.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Description du service</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Taxirent est une plateforme B2B destinée exclusivement aux chauffeurs de taxi professionnels titulaires d'une carte professionnelle en cours de validité. Elle permet la mise en relation entre chauffeurs et loueurs de véhicules taxi relais, en cas d'immobilisation du véhicule principal (panne, accident, dommages carrosserie).
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">3. Conditions d'accès</h2>
          <p className="text-gray-600 text-sm leading-relaxed">Pour accéder au service, l'utilisateur doit :</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li>Être chauffeur de taxi professionnel en activité</li>
            <li>Détenir une carte professionnelle taxi valide</li>
            <li>Fournir les documents requis : permis de conduire, KBIS, carte grise du véhicule immobilisé</li>
            <li>Vérifier son adresse email et son numéro de téléphone</li>
            <li>Obtenir la validation de son dossier par l'équipe Taxirent</li>
          </ul>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">4. Réservation et contrat de location</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Toute demande de réservation est soumise à validation par l'équipe Taxirent. La confirmation de la disponibilité du véhicule est communiquée sous 24h ouvrées. Un contrat de location est automatiquement généré et transmis par email lors de la validation de la demande. Ce contrat doit être imprimé, signé et présenté lors de la prise en charge du véhicule.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Le véhicule relais est loué uniquement en cas d'immobilisation avérée du véhicule taxi du locataire. La location est consentie kilométrage illimité.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">5. Dépôt de garantie</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Un dépôt de garantie par chèque est exigé au départ de la location, dont le montant est précisé dans le contrat. Ce dépôt est restitué à la fin de la location, sous réserve du bon état du véhicule et du plein de carburant effectué.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">6. Obligations du locataire</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-2">
            <li>Restituer le véhicule dans l'état où il a été emprunté</li>
            <li>Restituer le véhicule avec le plein fait (pénalité 2€/litre manquant)</li>
            <li>Signaler immédiatement tout incident à son assurance et à Taxirent</li>
            <li>Transmettre le contrat à la Mairie de la Commune de Stationnement</li>
            <li>Modifier les tarifs préfectoraux de son département chez JPM Taxi</li>
            <li>Ne pas sous-louer ou prêter le véhicule relais</li>
          </ul>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">7. Responsabilité</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Le locataire est responsable de tout dommage causé au véhicule relais pendant la durée de la location. Les frais de remise en état ainsi que les jours d'immobilisation du véhicule relais seront facturés au locataire. Des frais de nettoyage forfaitaires de 50€ pourront être prélevés en cas de nécessité.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Taxirent met à disposition un véhicule équipé taxi conforme à la réglementation (taximètre, lumineux, imprimante, contrôles techniques à jour). La responsabilité de Taxirent ne saurait être engagée en cas de mauvaise utilisation du véhicule par le locataire.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">8. Propriété intellectuelle</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            L'ensemble des éléments de la plateforme Taxirent (logo, textes, interface, code source) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">9. Modification et résiliation</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Taxirent se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email. La poursuite de l'utilisation de la plateforme après notification vaut acceptation des nouvelles CGU. Taxirent peut suspendre ou résilier l'accès d'un utilisateur en cas de violation des présentes CGU.
          </p>
        </section>

        <section className="card p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">10. Droit applicable</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux de Paris seront seuls compétents.
          </p>
          <p className="text-sm text-gray-600">
            Contact : <a href="mailto:taxirent.contact@gmail.com" className="text-brand-500 hover:underline">taxirent.contact@gmail.com</a>
          </p>
        </section>

      </div>
    </div>
  );
}

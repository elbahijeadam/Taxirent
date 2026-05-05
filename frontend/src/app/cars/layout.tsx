import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flotte de véhicules — Taxirent',
  description: 'Parcourez notre flotte de véhicules relais pour chauffeurs de taxi professionnels. Berlines, SUV, hybrides et électriques disponibles partout en France.',
  keywords: 'location taxi relais, véhicule équipé taxi, location professionnelle chauffeur, taxi de remplacement',
  openGraph: {
    title: 'Flotte de véhicules relais — Taxirent',
    description: 'Véhicules équipés taxi disponibles à la location. Réservation rapide, vérification documentaire automatisée.',
    type: 'website',
  },
};

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

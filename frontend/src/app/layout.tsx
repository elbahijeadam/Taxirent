import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ConditionalShell from '@/components/ConditionalShell';

export const metadata: Metadata = {
  title: {
    default: 'Taxirent — Location de véhicules relais pour chauffeurs de taxi',
    template: '%s — Taxirent',
  },
  description: 'Taxirent : plateforme B2B de location de véhicules équipés taxi. Vérification automatique des documents, réservations en ligne, dépôt de garantie sécurisé via Stripe.',
  keywords: 'location taxi relais, véhicule relais taxi, location professionnelle taxi, chauffeur taxi panne, voiture équipée taxi',
  authors: [{ name: 'Taxirent' }],
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'Taxirent',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ConditionalShell>{children}</ConditionalShell>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
          }}
        />
      </body>
    </html>
  );
}

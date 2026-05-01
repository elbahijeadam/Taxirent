import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ConditionalShell from '@/components/ConditionalShell';

export const metadata: Metadata = {
  title: 'Taxirent — Plateforme SaaS de location professionnelle',
  description: 'Taxirent simplifie la gestion des locations de véhicules professionnels. Vérification automatisée de documents, réservations en ligne et dépôts sécurisés via Stripe.',
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

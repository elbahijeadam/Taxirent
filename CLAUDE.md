# CLAUDE.md — Journal de bord Taxirent

> Fichier de contexte pour les sessions Claude. Mis a jour apres chaque session importante.
> Derniere mise a jour : 2026-05-05 (session 3 suite)

---

## Identite du projet

- **Nom** : Taxirent
- **Description** : Plateforme B2B de location de vehicules relais pour chauffeurs de taxi (panne, accident, revision)
- **Cible** : Chauffeurs de taxi professionnels en France
- **Objectif actuel** : Finaliser avant vente du site

---

## Stack technique

### Frontend (Vercel)
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Stripe.js (@stripe/react-stripe-js) pour le paiement
- react-hot-toast, lucide-react, jsPDF
- Deploy : Vercel (auto-deploy depuis main)

### Backend (Railway)
- Node.js + Express
- PostgreSQL (Railway managed)
- JWT auth + bcrypt
- Stripe SDK (PaymentIntents, capture_method: 'manual' pour les deposits)
- Tesseract.js + pdf-parse pour OCR verification documents
- Resend pour emails transactionnels
- Deploy : Railway (auto-deploy depuis main)

---

## Architecture des dossiers

Taxirent/
  backend/
    src/
      config/         database.js
      controllers/    adminController.js, carController.js, paymentController.js,
                      reservationController.js, userController.js, documentController.js
      middleware/     auth.js, upload.js
      routes/         admin.js, cars.js, payments.js, reservations.js, users.js, documents.js
      services/       emailService.js, ocrService.js, stripeService.js
      server.js
  frontend/
    src/
      app/
        admin/        layout.tsx, page.tsx, reservations/, users/, cars/
        auth/         login/, register/
        cars/         layout.tsx, page.tsx, [id]/
        reservations/ page.tsx, [id]/
        profile/      page.tsx
        page.tsx      (landing)
        layout.tsx    (root - SEO metadata)
      components/     ConditionalShell.tsx, Navbar.tsx, Footer.tsx, ...
      lib/            api.ts, auth.ts
      types/          index.ts

---

## Variables d'environnement

### Backend (Railway) — DEJA CONFIGURES
- DATABASE_URL (Railway PostgreSQL automatique)
- JWT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- FRONTEND_URL (URL Vercel de prod)
- PORT (Railway automatique)

### Frontend (Vercel) — DEJA CONFIGURES
- NEXT_PUBLIC_API_URL (URL Railway de prod)
- NEXT_PUBLIC_STRIPE_KEY (cle publique Stripe)

---

## Compte admin par defaut
- Email : admin@taxirent.fr
- Mot de passe : [defini a la creation de la DB via script seed ou manuellement]

---

## Historique des sessions

### Session 1 (env. 2026-04-23 a 2026-04-25)
- Creation complete du projet (scaffold Next.js + Express + PostgreSQL)
- Auth JWT avec OTP email
- Pages : landing, cars listing, car detail, reservation flow, profile
- Admin : dashboard, users, reservations
- Stripe : PaymentIntents pour paiement complet
- Railway + Vercel deploy configure

### Session 2 (env. 2026-05-01 a 2026-05-03)
- Ajout OCR verification documents (Tesseract.js + pdf-parse)
- Ajout emails transactionnels (Resend)
- Deposits Stripe (capture_method: 'manual')
- Fix bugs post-deploiement (UUID LIKE -> ::text LIKE, is_available SMALLINT, etc.)
- SEO metadata (layout.tsx par section)
- Push et deploy sur Railway + Vercel confirmes

### Session 3 (2026-05-05 — session actuelle)
Ameliorations implementees :
- Admin : page /admin/cars complete (liste, creation, edition, suppression, toggle dispo)
- Admin : stats flotte sur dashboard (total / dispo / indispo)
- Admin : lien acces rapide "Flotte de vehicules" sur dashboard
- Backend : carController.js — ajout deleteCar avec garde reservations actives
- Backend : carController.js — cache in-memory 60s correctement implemente
- Backend : routes/cars.js — route DELETE /:id ajoutee
- Backend : adminController.js — bug UUID LIKE corrige (::text LIKE)
- Backend : adminController.js — reprocessDocument archive avant reset OCR
- Backend : adminController.js — getStats ajoute query cars stats
- Backend : reservationController.js — cancelReservation complete (void Stripe + email)
- Backend : emailService.js — sendCancellationEmail ajoute
- Frontend : reservations/page.tsx — PAYMENT_CONFIG manquait 'prepaid'
- Frontend : reservations/[id]/page.tsx — canPay incluait pas 'prepaid'
- Frontend : reservations/[id]/page.tsx — affichage 'Acompte verse' corrige
- Frontend : types/index.ts — AdminStats etendu avec cars stats
- Frontend : api.ts — carApi.create/update/delete ajoutes
- SEO : layout.tsx root meta, cars/layout.tsx cree

---

## Taches restantes avant vente

### CRITIQUE (bloquant)
- [x] Stockage cloud pour uploads utilisateurs — FAIT
      upload.js : memoryStorage + uploadToStorage() -> S3/R2 si vars configurees, disque sinon
      Vars Railway a ajouter : S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION, S3_PUBLIC_URL
      Package ajoute : @aws-sdk/client-s3 ^3.600.0
      RESTE : creer le bucket R2/S3 et configurer les vars sur Railway

### IMPORTANT (fortement recommande)
- [x] Fix bug webhook Stripe — FAIT (bug de routing : le handler n'etait jamais atteint)
      index.js : webhook enregistre directement via app.post() avant express.json()
      routes/payments.js : route /webhook retiree (elle y etait en double)
      RESTE : verifier l'URL du webhook dans le dashboard Stripe = https://<railway-url>/api/payments/webhook
- [x] Stripe refund automatique sur annulation — FAIT
      reservationController.js cancelReservation : si pi.status === 'succeeded' -> stripe.refunds.create()
      emailService.js : sendRefundEmail() ajoutee (email remboursement envoye au lieu de annulation)
- [ ] UI pour que l'utilisateur voit le depot de garantie autorise (vs capture)
- [ ] Uploader d'images voitures (actuellement : champ texte URL)

### AMELIORATIONS (nice-to-have)
- [ ] Tests automatises (Jest / Playwright)
- [ ] Pagination API backend pour /admin/reservations et /admin/users
- [ ] Filtres avances sur listing voitures (rayon GPS, disponibilite temps reel)
- [ ] Notifications push ou SMS (Twilio) pour statut reservation

---

## Notes techniques importantes

### PostgreSQL
- Les UUIDs en PostgreSQL ne supportent pas LIKE directement -> utiliser ::text LIKE
- is_available est stocke en SMALLINT (0/1), normalise en boolean par le row normalizer
- Le schema est dans backend/src/config/database.js (createTables())

### Stripe
- Deposits : PaymentIntent avec capture_method: 'manual' -> autorisation seulement
- Capture : appel stripe.paymentIntents.capture() quand la voiture est rendue
- Annulation : stripe.paymentIntents.cancel() pour void le hold
- Paiement complet : PaymentIntent standard, capture automatique

### Cache
- carController.js : cache in-memory 60s TTL, invalide sur write (create/update/delete)
- Cle de cache = WHERE clause + params (unique par combinaison de filtres)

### OCR
- ocrService.js : Tesseract.js pour images, pdf-parse pour PDFs
- Score de confiance calcule par heuristique sur les champs extraits
- Resultat archive dans documents table (extracted_data, confidence_score, verification_log)

### Emails
- emailService.js : HTTP fetch vers api.resend.com
- Templates HTML inline avec branding Taxirent
- Emails : confirmation reservation, OTP auth, annulation, (a venir: rappels)

---

## Commandes utiles

### Demarrer en local
node start.js           # Lance backend + frontend ensemble
# ou separement :
cd backend && npm run dev
cd frontend && npm run dev

### Verifier le build TypeScript
cd frontend && npx tsc --noEmit --strict

### Verifier syntaxe backend
node --check backend/src/server.js
node --check backend/src/controllers/carController.js

### Base de donnees (Railway)
# Connexion via Railway CLI ou dashboard -> PostgreSQL -> Connect
# Tables creees automatiquement au demarrage (createTables() dans database.js)

### Git
git add -A && git commit -m "message" && git push origin main
# Railway et Vercel deployent automatiquement depuis main

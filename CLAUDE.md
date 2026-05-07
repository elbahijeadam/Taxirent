# CLAUDE.md — Journal de bord Taxirent

> Fichier de contexte pour les sessions Claude. Mis a jour apres chaque session importante.
> Derniere mise a jour : 2026-05-06 (session 4)

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

### Session 3 (2026-05-05)
- Admin : page /admin/cars complete (liste, creation, edition, suppression, toggle dispo)
- Admin : stats flotte + lien acces rapide sur dashboard
- Backend : carController.js — deleteCar + cache in-memory 60s + route DELETE
- Backend : adminController.js — bug UUID LIKE corrige + archive OCR + stats cars
- Backend : reservationController.js — cancelReservation (void Stripe + email)
- Backend : emailService.js — sendCancellationEmail
- Frontend : PAYMENT_CONFIG 'prepaid' + canPay fix + affichage 'Acompte verse'
- Frontend : types/index.ts AdminStats + api.ts carApi CRUD
- SEO : metadata root + cars/layout.tsx

### Session 3 suite (2026-05-05) — Priorites critiques
- [x] Stockage cloud S3/R2 : upload.js memoryStorage + uploadToStorage(), @aws-sdk/client-s3
- [x] Fix webhook Stripe : bug routing corrige (index.js app.post avant express.json)
- [x] Remboursement auto annulation : stripe.refunds.create() + sendRefundEmail()
- [x] OCR adapte URLs distantes : extractFromPdf download, Tesseract accepte URLs

### Session 4 (2026-05-06) — Flux depot de garantie complet
Backend :
- reservationController.js — getDepositSecret (GET /:id/deposit-secret)
- reservationController.js — confirmDepositAuthorization (POST /:id/deposit-confirm)
- adminController.js — captureDeposit + releaseDeposit
- adminController.js — listReservations inclut deposit_status, deposit_amount
- routes/reservations.js — nouvelles routes deposit-secret et deposit-confirm
- routes/admin.js — routes /deposit/capture et /deposit/release
- paymentController.js — webhook payment_intent.amount_capturable_updated
Frontend :
- reservations/[id]/page.tsx — section depot de garantie avec formulaire Stripe (amber)
  Composant DepositForm, etats depositClientSecret/loadingDeposit
  Statut depot dans sidebar (En attente / Autorise / Preleve / Libere)
  Statut 'refunded' affiche (badge violet)
- admin/reservations/page.tsx — boutons "Marquer en cours" et "Marquer terminee"
  Boutons "Liberer depot" et "Capturer depot" pour locations active/completed
  Badge statut depot sur chaque ligne
- cars/[id]/page.tsx — redirect corrige /confirmation -> /reservations/:id
- reservations/page.tsx — badge 'refunded' (violet) ajoute
- types/index.ts — deposit_status, deposit_stripe_intent_id dans Reservation
- lib/api.ts — reservationApi.getDepositSecret/confirmDeposit, adminApi.captureDeposit/releaseDeposit

Flux deposit complet :
  User cree reservation -> page /reservations/:id
  Section orange "Depot de garantie" s'affiche si deposit_status='awaiting_authorization'
  User clique -> formulaire Stripe -> hold place sur carte (jamais debite)
  Backend verifie requires_capture -> deposit_status='authorized'
  Webhook payment_intent.amount_capturable_updated en backup
  Admin : location en cours -> "Liberer" (pas de dommages) ou "Capturer" (dommages)

---

### Session 5 (2026-05-07) — Intégration Swikly + Stripe production

Backend :
- swiklyService.js — client API Swikly (createSwik, getSwik, deleteSwik, claimSwik)
- reservationController.js — createSwik() au lieu de Stripe deposit PI, retourne swiklyAcceptUrl
- reservationController.js — getSwiklyDepositUrl() (ex getDepositSecret) → retourne acceptUrl Swikly
- reservationController.js — confirmDepositAuthorization → vérifie via getSwik() + met à jour deposit_status
- reservationController.js — cancelReservation → deleteSwik() au lieu de Stripe cancel
- adminController.js — captureDeposit → claimSwik() / releaseDeposit → deleteSwik()
- database.js — migration ALTER TABLE reservations ADD COLUMN deposit_swikly_id
- routes/reservations.js — /deposit-url (ex /deposit-secret)

Frontend :
- types/index.ts — deposit_swikly_id, swiklyAcceptUrl, 'none' dans deposit_status union
- lib/api.ts — getDepositUrl() (ex getDepositSecret)
- reservations/[id]/page.tsx — supprime DepositForm Stripe Elements
  Bouton "Autoriser le dépôt" → redirect window.location.href vers Swikly acceptUrl
  Auto-confirmation au retour Swikly (?deposit=success) via useEffect + window.location.search

Config Railway (variables à vérifier) :
- SWIKLY_API_KEY ✓ (ajouté)
- STRIPE_SECRET_KEY ✓
- STRIPE_WEBHOOK_SECRET ✓ (webhook configuré sur Stripe dashboard)
- NEXT_PUBLIC_STRIPE_KEY ✓ (ajouté sur Vercel)

---

## Taches restantes avant vente

### CRITIQUE (bloquant)
- [x] Stockage cloud pour uploads utilisateurs — FAIT
      upload.js : memoryStorage + uploadToStorage() -> S3/R2 si vars configurees, disque sinon
      Vars Railway a ajouter : S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION, S3_PUBLIC_URL
      Package ajoute : @aws-sdk/client-s3 ^3.600.0
      RESTE : creer le bucket R2/S3 et configurer les vars sur Railway

### IMPORTANT (fortement recommande)
- [x] Fix bug webhook Stripe — FAIT
      RESTE : verifier l'URL dans dashboard Stripe = https://<railway-url>/api/payments/webhook
- [x] Stripe refund automatique sur annulation — FAIT
- [x] Flux depot de garantie complet — FAIT (session 4, migré vers Swikly en session 5)
- [ ] Uploader d'images voitures (actuellement : champ texte URL)
- [ ] Verifier que Twilio est configure en prod (sinon phone_verified jamais true -> aucune reservation possible)
      Si pas Twilio : envisager de rendre phone_verified optionnel ou OTP par email uniquement

### AMELIORATIONS (nice-to-have)
- [ ] Tests automatises (Jest / Playwright)
- [ ] Pagination API backend pour /admin/reservations et /admin/users
- [ ] Email de rappel J-1 avant prise en charge
- [ ] Notifications SMS (Twilio) pour changement de statut reservation

---

## Notes techniques importantes

### PostgreSQL
- Les UUIDs en PostgreSQL ne supportent pas LIKE directement -> utiliser ::text LIKE
- is_available est stocke en SMALLINT (0/1), normalise en boolean par le row normalizer
- Le schema est dans backend/src/config/database.js (createTables())

### Stripe
- Deposits : PaymentIntent avec capture_method: 'manual' -> autorisation seulement (hold carte)
- Webhook payment_intent.amount_capturable_updated -> deposit_status='authorized'
- Capture admin : stripe.paymentIntents.capture() -> preleve le montant (dommages)
- Liberation admin : stripe.paymentIntents.cancel() -> void le hold (pas de dommages)
- Paiement complet : PaymentIntent standard, capture automatique
- Annulation reservation payee : stripe.refunds.create() -> remboursement + email
- Webhook URL prod : https://<railway-url>/api/payments/webhook (a verifier dans dashboard Stripe)

### deposit_status (champ reservations) — Swikly depuis session 5
- 'awaiting_authorization' : swik cree, utilisateur n'a pas encore autorise sur Swikly
- 'authorized'             : hold place (utilisateur a autorise sur Swikly)
- 'captured'               : montant preleve via claimSwik() (admin, cas de dommages)
- 'released'               : swik supprime via deleteSwik() (admin ou annulation)
- 'none'                   : pas de depot (reservations admin ou SWIKLY_API_KEY absent)

### Cache
- carController.js : cache in-memory 60s TTL, invalide sur write (create/update/delete)
- Cle de cache = WHERE clause + params (unique par combinaison de filtres)

### OCR
- ocrService.js : Tesseract.js pour images, pdf-parse pour PDFs
- Score de confiance calcule par heuristique sur les champs extraits
- Resultat archive dans documents table (extracted_data, confidence_score, verification_log)

### Emails (emailService.js)
- sendOtpEmail / sendOtpSms
- sendWelcomeEmail
- sendReservationEmail
- sendAdminNotificationEmail
- sendContractEmail
- sendCancellationEmail
- sendRefundEmail (annulation reservation deja payee)
- sendPaymentConfirmationEmail

### Upload documents
- multer memoryStorage (pas de disque local)
- verifyFileIntegrity : magic bytes sur buffer (anti-spoofing MIME)
- uploadToStorage() : S3/R2 si vars S3_* configurees, sinon disque local (dev)
- documentVerificationService.js : OCR gere URLs distantes (Tesseract natif, PDF via fetch+buffer)

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

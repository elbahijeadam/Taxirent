# AutoRent — Fullstack Car Rental App

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT
- **Payments**: Stripe (sandbox)
- **Emails**: Nodemailer (SMTP)
- **File upload**: Multer (local disk, per-user folder)

## Project structure

```
car-rental/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # authController, carController, reservationController, paymentController, userController
│   │   ├── middleware/     # auth (JWT), upload (Multer)
│   │   ├── migrations/     # init.sql schema + seed data
│   │   ├── routes/         # auth, cars, users, reservations, payments
│   │   └── services/       # emailService (Nodemailer)
│   ├── uploads/            # user document uploads (gitignored)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # Landing page
    │   │   ├── auth/login/           # Login form
    │   │   ├── auth/register/        # Registration form
    │   │   ├── cars/                 # Car listing + filters
    │   │   ├── cars/[id]/            # Car detail + reservation calendar
    │   │   ├── reservations/         # User reservation list
    │   │   ├── reservations/[id]/    # Reservation detail + Stripe payment
    │   │   └── profile/              # Profile + documents upload
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── CarCard.tsx
    │   │   └── DocumentUpload.tsx
    │   ├── hooks/useAuth.ts
    │   ├── lib/api.ts        # Axios instance + all API calls
    │   ├── lib/auth.ts       # Token/user storage helpers
    │   └── types/index.ts
    └── package.json
```

## Quick start

### 1. PostgreSQL
Start PostgreSQL (local or Docker):
```bash
docker compose up postgres -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run migrate   # Creates tables + seeds sample cars
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Add your Stripe publishable key
npm install
npm run dev
```

App runs at **http://localhost:3000**, API at **http://localhost:5000**.

## Full Docker
```bash
cp backend/.env.example backend/.env
# Fill in Stripe + SMTP credentials
docker compose up --build
```

## Environment variables

### Backend `.env`
| Variable | Description |
|---|---|
| `DB_*` | PostgreSQL connection |
| `JWT_SECRET` | Secret for signing tokens |
| `STRIPE_SECRET_KEY` | Stripe secret (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `SMTP_*` | Email server credentials |
| `FRONTEND_URL` | Used in email links |

### Frontend `.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (pk_test_...) |

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Current user |
| PUT | /api/users/profile | JWT | Update profile |
| POST | /api/users/documents | JWT | Upload document |
| GET | /api/users/documents | JWT | List documents |
| GET | /api/users/reservations | JWT | User reservations |
| GET | /api/cars | — | List cars (with filters) |
| GET | /api/cars/:id | — | Car detail |
| GET | /api/cars/:id/availability | — | Booked date ranges |
| POST | /api/cars | Admin | Create car |
| PUT | /api/cars/:id | Admin | Update car |
| POST | /api/reservations | JWT | Create reservation |
| GET | /api/reservations/:id | JWT | Reservation detail |
| PATCH | /api/reservations/:id/cancel | JWT | Cancel reservation |
| POST | /api/payments/create-intent | JWT | Create Stripe payment intent |
| POST | /api/payments/webhook | — | Stripe webhook |
| GET | /api/payments/history | JWT | Payment history |

## Features

- **Auth**: Register/login with JWT, password hashing (bcrypt), auto-refresh
- **Profile**: Full personal + professional fields (license, commune, immobilization reason)
- **Documents**: Secure upload with drag-and-drop (ID, passport, driver license, professional card) — stored per-user in `uploads/`
- **Cars**: Filterable listing (category, transmission, fuel, price, seats), availability calendar blocking booked dates
- **Reservations**: Date picker blocks already-booked ranges, conflict check on server
- **Payments**: Stripe with prepayment (30%) or full payment options; webhook updates reservation status
- **Emails**: Welcome, reservation confirmation, admin notification, payment confirmation — all HTML-formatted

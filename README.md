# Hospital Management System (MERN Stack)

A production-oriented Hospital Management System with three role-based portals (Admin, Doctor, Patient), built on MongoDB, Express, React, and Node.

## 1. Architecture

```
                        ┌───────────────────────┐
                        │   React 19 + Vite      │
                        │  (Redux Toolkit, RTK)  │
                        └──────────┬────────────┘
                                   │ REST (Axios, JWT bearer + refresh cookie)
                        ┌──────────▼────────────┐
                        │   Express.js API        │
                        │  Controllers → Services │
                        │  → Mongoose Models      │
                        └──────────┬────────────┘
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             MongoDB Atlas   Cloudinary      Razorpay + SMTP
             (9 collections) (media)         (payments/email)
```

Backend follows MVC + service-layer separation:
`routes` (HTTP surface) → `controllers` (request/response + validation) → `services` (business logic, reused across controllers) → `models` (Mongoose schemas).

## 2. Folder Structure

```
hospital-management-system/
├── server/
│   ├── config/          # db, cloudinary, nodemailer, razorpay
│   ├── controllers/      # request handlers, one file per resource
│   ├── middleware/        # auth, role-check, error handler, async wrapper
│   ├── models/            # Mongoose schemas (9 collections)
│   ├── routes/            # Express routers, one file per resource
│   ├── services/          # reusable business logic (email, pdf, invoice, etc.)
│   ├── utils/              # ApiError, constants, helpers
│   ├── validators/         # express-validator chains
│   ├── uploads/             # local fallback storage for reports/prescriptions
│   ├── app.js
│   ├── server.js
│   └── package.json
└── client/
    ├── src/
    │   ├── components/    # common/, layout/, ui/ — reusable presentational pieces
    │   ├── pages/           # admin/, doctor/, patient/, auth/ — route-level views
    │   ├── layouts/          # DashboardLayout, AuthLayout, etc.
    │   ├── features/         # feature-scoped logic (e.g. appointment booking flow)
    │   ├── redux/             # slices/ + store/
    │   ├── hooks/              # custom hooks (useAuth, usePagination, etc.)
    │   ├── services/           # axios instance + per-resource API services
    │   ├── utils/                # formatters, validators
    │   └── assets/
    └── package.json
```

## 3. Install Commands

> Requires Node.js 18+ and a MongoDB Atlas connection string.

```bash
# Backend
cd server
npm install
cp .env.example .env    # then fill in real values
npm run dev              # starts on http://localhost:5000

# Frontend (separate terminal)
cd client
npm install
cp .env.example .env
npm run dev               # starts on http://localhost:5173
```

### Required accounts before full functionality works
| Service | Used for | Where to get keys |
|---|---|---|
| MongoDB Atlas | Database | https://cloud.mongodb.com |
| Cloudinary | Report/prescription file storage | https://cloudinary.com/console |
| SMTP (Gmail App Password or SendGrid) | Emails | Gmail: enable 2FA → App Passwords |
| Razorpay | Payments | https://dashboard.razorpay.com/app/keys (test keys are free) |

The `.env.example` files ship with **placeholder** Razorpay test keys — replace `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` with your own test keys from the Razorpay dashboard. Order creation will return a clear auth error until you do.

## Project Roadmap (build order)

- [x] 1. Project Architecture
- [x] 2. Folder Structure
- [x] 3. Install Commands
- [x] 4. Backend Setup (app.js, server.js, config/, middleware/, security)
- [x] 5. Frontend Setup (Vite, Tailwind, Redux store, routing shell)
- [x] 6. MongoDB Models (9 collections, relationships via ObjectId refs)
- [ ] 7. Authentication (JWT + refresh, RBAC, forgot/reset password, email verification)
- [ ] 8. REST APIs (validators, controllers wired to real logic)
- [ ] 9. Admin Module
- [ ] 10. Doctor Module
- [ ] 11. Patient Module
- [ ] 12. Appointment Module (calendar, conflict prevention)
- [ ] 13. Prescription Module (PDF generation)
- [ ] 14. Medical Reports Module (Cloudinary upload)
- [ ] 15. Payment Module (Razorpay + invoices)
- [ ] 16. Dashboard Analytics (charts, aggregation pipelines)
- [ ] 17. UI Components (cards, tables, skeletons, dark mode)
- [ ] 18. Testing
- [ ] 19. Deployment (Vercel / Render)
- [ ] 20. README (final, user-facing)

All route files under `server/routes/` currently return a placeholder JSON response — they're mounted in `app.js` already so the server boots cleanly, and get real controller logic as each module above is built.

## Database Relationships

- `User` — base identity (auth, role). `Doctor` and `Patient` each hold a 1:1 ref to `User` for domain-specific fields.
- `Doctor` → `Department` (many-to-one)
- `Appointment` → `Patient`, `Doctor`, `Department` (many-to-one each); unique index on `(doctor, date, startTime)` for active statuses prevents double-booking at the DB level.
- `Prescription` → `Appointment`, `Patient`, `Doctor`
- `MedicalReport` → `Patient`, optional `Doctor`/`Appointment`
- `Payment` → `Patient`, `Appointment`
- `Notification` → `User` (recipient), optional refs to `Appointment`/`Payment`

## Security Baseline Already in Place

- `helmet`, `cors` (credentialed, origin-locked to `CLIENT_URL`), `express-rate-limit` on `/api/*`
- `express-mongo-sanitize` + `xss-clean` on all input
- Centralized `ApiError` + `errorHandler` normalizing Mongoose/JWT errors into a consistent JSON shape
- Passwords hashed with bcrypt (cost factor 12), never returned in API responses (`select: false` + `toSafeObject()`)

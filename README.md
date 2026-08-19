# WeDonate — Adama Community Support & Charity Management System

> Official platform of Adama City Administration, Oromia, Ethiopia

---

## Project Structure

```
We_donate/
├── wedonate-frontend/     React 19 + TypeScript + Tailwind CSS v4
├── wedonate-backend/      Node.js + Express + Prisma + PostgreSQL
├── assets/                Original Adama city photos and logo
├── docs/                  SRS document and project specification
├── start-backend.bat      Quick-start backend
├── start-frontend.bat     Quick-start frontend
├── setup-database.bat     Database migration + seed
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 18 (running as service)

### 1. Database Setup
```bash
# Double-click setup-database.bat
# OR manually:
cd wedonate-backend
npx prisma migrate dev --name init
npm run db:seed
```

### 2. Start Backend
```bash
# Double-click start-backend.bat
# OR:
cd wedonate-backend
npm run dev
# → http://localhost:5000
```

### 3. Start Frontend
```bash
# Double-click start-frontend.bat
# OR:
cd wedonate-frontend
npm run dev
# → http://localhost:5173
```

---

## Login Credentials

| Role        | Email                      | Password       |
|-------------|----------------------------|----------------|
| Super Admin | superadmin@wedonate.et     | superadmin123  |
| City Admin  | cityadmin@adama.et         | cityadmin123   |
| User        | abebe@example.com          | user123        |

---

## Features

### For All Users
- Register with one account — no role selection needed
- Profile picture upload
- Post support requests (food, medicine, clothes, money, other)
- Full request form: payment accounts (TeleBirr, CBE, BOA, Awash), support letter, national ID
- Donate to any approved request — multiple payment methods
- View campaigns and donate

### Payment Methods Available
- **Chapa** — online checkout (ETB)
- **TeleBirr** — mobile money transfer
- **CBE** — Commercial Bank of Ethiopia
- **BOA** — Bank of Abyssinia
- **Awash Bank** — Awash International Bank
- **Other Bank** — any other bank
- **Item Donation** — donate physical items with photo + delivery method

### For Organizations (NGO, ORGANIZATION, GOVERNMENTAL_ORG)
- All user features
- Create fundraising campaigns with goal, deadline, cover photo
- Campaign needs admin approval before going live

### For Admins
- Approve/reject support requests and campaigns
- View full details: support letters, national ID, payment accounts
- Manage gallery photos shown on About page
- Assign roles to users
- View audit logs and donation reports

### Languages
- English 🇬🇧
- Amharic (አማርኛ) 🇪🇹
- Afaan Oromo 🇪🇹

### Dark/Light Mode
Toggle in the navbar — remembers your preference.

---

## Database Credentials
Update `wedonate-backend/.env`:
```
DATABASE_URL="postgresql://postgres:wedonate2026@localhost:5432/wedonate_db"
```

## Chapa Payment Keys
Get from https://dashboard.chapa.co and update `.env`:
```
CHAPA_SECRET_KEY=CHASECK_TEST-...
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-...
```

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 19, TypeScript 6, Tailwind CSS v4, Vite 8 |
| State     | TanStack Query v5, React Hook Form + Zod |
| Animation | Framer Motion, Lucide Icons |
| i18n      | i18next (EN/AM/OR) |
| Backend   | Node.js, Express 4, Prisma ORM |
| Database  | PostgreSQL 18 |
| Auth      | JWT + bcrypt |
| Payments  | Chapa gateway + direct bank transfers |
| Upload    | Multer (images stored in uploads/) |

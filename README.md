# WeDonate — Community Support & Charity Management System

> Official platform of Adama City Administration, Oromia, Ethiopia

## Overview

WeDonate is a full-stack, enterprise-grade community support and charity management system. Built with a modern technology stack, it facilitates transparent donation flows, rigorous verification of beneficiaries, and efficient management of organizational campaigns.

The platform is designed for the Adama City Administration, bridging the gap between donors, non-profit organizations, Kebele (local) administrations, and citizens in need.

## Core Features

- **Multi-Role Architecture:** Granular access control for `USER`, `ORGANIZATION`, `KEBELE_ADMIN`, `CITY_ADMIN`, and `SYSTEM_ADMIN`.
- **Intelligent AI Assistant:** Integrated RAG (Retrieval-Augmented Generation) chatbot powered by Google Gemini, capable of answering role-specific queries using embedded operational knowledge (`pgvector`).
- **Campaign & Request Management:** End-to-end lifecycle management (draft, pending review, approved, published) for both organizational campaigns and individual support requests.
- **Assisted Requests:** Kebele Admins can seamlessly create support requests on behalf of individuals without digital access, subject to City Admin approval.
- **Secure Donations:** Integrated with the Chapa payment gateway alongside traditional bank transfer tracking (CBE, BOA, Awash, TeleBirr) and physical item donations.
- **Multilingual Support:** Full i18n support for English, Amharic (አማርኛ), and Afaan Oromoo.
- **Theme Support:** Polished UI with seamless dark and light modes.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite 8, Framer Motion, TanStack Query, React Hook Form |
| **Backend** | Node.js, Express, Prisma ORM, JWT Authentication |
| **Database** | PostgreSQL 18 with `pgvector` extension |
| **AI / RAG** | Google Generative AI (Gemini), Custom Vector Embeddings |

## Project Structure

```
We_donate/
├── wedonate-frontend/     # React SPA frontend
├── wedonate-backend/      # Express API & Prisma database schema
├── docs/                  # System documentation & AI knowledge base
├── assets/                # Static brand assets
└── README.md              # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 18+ (running as a service, with `pgvector` extension installed)

### 1. Database Configuration
Update `wedonate-backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/wedonate_db"
AI_API_KEY="your-google-gemini-api-key"
```

Initialize the database:
```bash
cd wedonate-backend
npx prisma migrate dev --name init
npm run db:seed
```

*(Note: The seed script populates default test accounts for all roles).*

### 2. Knowledge Base Ingestion (AI Chatbot)
To enable the WeDonate AI Assistant, ingest the documentation into the vector database:
```bash
cd wedonate-backend
npx tsx src/ingest.ts
```

### 3. Start Backend Server
```bash
cd wedonate-backend
npm run dev
# Server runs on http://localhost:5000
```

### 4. Start Frontend Application
```bash
cd wedonate-frontend
npm install
npm run dev
# Application runs on http://localhost:5173
```

## Security & Architecture

WeDonate enforces strict data isolation and role-based access control (RBAC).
- Chatbot sessions are securely persisted and isolated by the authenticated user's ID.
- Cross-Kebele data visibility is strictly prohibited for Kebele Admins.
- All file uploads (National IDs, Support Letters) are processed securely and require authorization to view.
- Audit logs track all critical state transitions (e.g., campaign approvals, user verifications).

## License

This project is proprietary and intended for the Adama City Administration.

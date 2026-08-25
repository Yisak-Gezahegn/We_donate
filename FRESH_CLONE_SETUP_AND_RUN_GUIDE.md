# We Donate - Fresh Clone Setup & Run Guide

This guide provides the exact steps required to clone the We Donate repository and start the platform locally for development and testing.

---

## ⚡ Quick Start (Terminal-Only)

Run these commands in a new terminal window to bootstrap the entire project:

```bash
# 1. Clone & Enter
git clone https://github.com/Yisak-Gezahegn/We_donate.git
cd We_donate

# 2. Start PostgreSQL Database
docker compose up -d db

# 3. Setup Backend
cd wedonate-backend
npm install
cp .env.example .env
# Edit .env and change DATABASE_URL to use port 5433 (if not already): 
# postgresql://postgres:wedonate2026@localhost:5433/wedonate_db
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev

# 4. Setup Frontend (in a new terminal)
cd ../wedonate-frontend
npm install
npm run dev
```

---

## 🛠️ Step-by-Step Guide

### 1. Clone the Repository

Start by pulling the source code into your working directory:

```bash
git clone https://github.com/Yisak-Gezahegn/We_donate.git
cd We_donate
```

Verify you are on the latest `main` branch:

```bash
git remote -v
git branch
git pull origin main
```

### 2. Configure Environment Variables

You need to create a local environment configuration file for the backend. 

```bash
cd wedonate-backend
cp .env.example .env
```

Open `wedonate-backend/.env` and verify the `DATABASE_URL`. The repository uses a Docker container that maps PostgreSQL to port `5433` on your host. Make sure it looks like this for local development:

```text
DATABASE_URL="postgresql://postgres:wedonate2026@localhost:5433/wedonate_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
CHAPA_SECRET_KEY="CHASECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
FRONTEND_URL="http://localhost:5173"
```

*(You do not need an `.env` file for the frontend out of the box, as it proxies or hardcodes to the backend at `:5000` via Vite).*

### 3. Install Dependencies

Install packages for both the backend and frontend.

```bash
# In the wedonate-backend folder:
npm install

# In the wedonate-frontend folder:
cd ../wedonate-frontend
npm install
cd ..
```

### 4. Start the Database (Hybrid Docker Setup)

The recommended daily workflow is a hybrid setup where Docker runs the database, and you run the Node.js apps natively in your terminal.

From the root `We_donate` folder, start the development database:

```bash
docker compose up -d db
```

*This spins up PostgreSQL on port `5433` with the username `postgres`, password `wedonate2026`, and database `wedonate_db`.*

### 5. Initialize Prisma and Seed the Database

With the database running, you must set up the schema and seed accounts. In the `wedonate-backend` folder:

```bash
cd wedonate-backend

# Generate the Prisma client
npx prisma generate

# Apply the latest migrations to the database
npx prisma migrate dev

# Seed the development accounts and test data
npm run db:seed
```

### 6. Start the Application

You need two separate terminal windows to run the frontend and backend concurrently.

**Terminal 1 (Backend):**
```bash
cd wedonate-backend
npm run dev
```
*(The backend runs on `http://localhost:5000`)*

**Terminal 2 (Frontend):**
```bash
cd wedonate-frontend
npm run dev
```
*(The frontend runs on `http://localhost:5173`)*

---

## 🐳 Running the Full Stack with Docker (Optional)

If you prefer to run the entire application (Frontend, Backend, and DB) inside Docker containers, you can use the production composition:

```bash
# Run from the root We_donate directory
docker compose up --build
```

**Services:**
*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:5000`
*   **Database**: Port `5433`

To stop the containers: `docker compose down`
To view logs: `docker compose logs -f`

---

## 🧪 Running Tests & Validation

The project is configured with strict TypeScript and testing suites.

**In `wedonate-backend`:**
```bash
# Typecheck
npm run build

# Unit & Integration Tests (Requires the test DB to be running)
# First start the test DB: docker compose up -d db_test
npm test
```

**In `wedonate-frontend`:**
```bash
# Typecheck and Build
npm run build

# Linting
npm run lint
```

---

## 🔑 Available Seed Accounts

The `npm run db:seed` command provisions several accounts with different roles so you can test RBAC (Role-Based Access Controls). Use any of these credentials to log in:

| Role | Email | Password |
| :--- | :--- | :--- |
| **SYSTEM_ADMIN** | `superadmin@wedonate.et` | `superadmin123` |
| **CITY_ADMIN** | `cityadmin@adama.et` | `cityadmin123` |
| **KEBELE_ADMIN** | `kebeleadmin@adama.et` | `kebeleadmin123` |
| **ORGANIZATION** | `org@example.com` | `organization123` |
| **USER** (Verified) | `abebe@example.com` | `user123` |
| **USER** (Unverified) | `unverified@example.com` | `user123` |

---

## 🔄 Daily Development Workflow

After this initial setup, your daily development routine will look like this:

1.  **Pull changes**: `git pull origin main`
2.  **Start DB**: `docker compose up -d db`
3.  **Terminal 1**: `cd wedonate-backend && npm run dev`
4.  **Terminal 2**: `cd wedonate-frontend && npm run dev`

**Recommended Git Workflow:**
```bash
git pull origin main
git checkout -b feature/your-feature-name
# Make changes...
npm run build # (Validate frontend/backend)
git add .
git commit -m "feat: your conventional commit message"
git push origin feature/your-feature-name
```

---

## 🚨 Troubleshooting

*   **`PrismaClientInitializationError` / Database connection failure:**
    Ensure Docker is running and you executed `docker compose up -d db`. Verify that `DATABASE_URL` in `.env` uses port `5433` and password `wedonate2026`.
*   **Port already in use:**
    If `5433` or `5434` fails, you have another Postgres instance running. Stop it or change the port mapping in `docker-compose.yml`.
*   **Frontend cannot reach Backend (CORS / Network Error):**
    Ensure the backend is running on `http://localhost:5000`. The Vite frontend expects the API at that port.
*   **"Type error: Cannot find module '@prisma/client'"**:
    You forgot to run `npx prisma generate` in the `wedonate-backend` folder.
*   **Old `node_modules` behaving weirdly:**
    Delete them and reinstall: `rm -rf node_modules package-lock.json && npm install`.
*   **Missing relations / Columns in DB:**
    You forgot to apply migrations. Run `npx prisma migrate dev` in the backend folder.

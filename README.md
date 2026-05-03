# AuditChain — Blockchain-Backed Audit Trail DBMS

A full-stack DBMS with an immutable blockchain layer for logging all transactions, schema changes, and access events. Built for finance and healthcare compliance use cases.

## Architecture

```
┌─────────────────────────────────────────┐
│          Application Layer              │  React frontend (Vite)
│   Dashboard · Query Editor · Explorer   │
└────────────────────┬────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────┐
│       Transaction Processing Layer      │  transactionProcessor.js
│   Parse · Validate · Execute · ACID     │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│          Audit Logging Layer            │  auditLogger.js
│  Change tracker · Metadata · Formatter  │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│       Blockchain Integration Layer      │  Blockchain.js / Block.js
│   SHA-256 hashing · PoW mining · Chain  │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│            Storage Layer                │
│   SQLite (data) · JSON ledger (chain)   │
└─────────────────────────────────────────┘
```

## Project Structure

```
blockchain-audit-dbms/
├── backend/
│   ├── src/
│   │   ├── blockchain/
│   │   │   ├── Block.js          # Block structure + PoW mining
│   │   │   ├── Blockchain.js     # Chain management + validation
│   │   │   └── HashGenerator.js  # SHA-256 hashing utilities
│   │   ├── config/
│   │   │   └── database.js       # SQLite setup + schema init
│   │   ├── layers/
│   │   │   ├── accessControl.js  # Auth, JWT, RBAC
│   │   │   ├── auditLogger.js    # Log to DB + blockchain
│   │   │   └── transactionProcessor.js  # SQL parse/validate/execute
│   │   ├── middleware/
│   │   │   └── authenticate.js   # JWT middleware + role guards
│   │   ├── routes/
│   │   │   ├── auth.js           # Login, user management
│   │   │   ├── audit.js          # Audit log retrieval + verify
│   │   │   ├── blockchain.js     # Chain explorer + tamper demo
│   │   │   └── query.js          # SQL execution endpoint
│   │   ├── utils/
│   │   │   └── seedData.js       # Demo users + sample data
│   │   └── index.js              # Express app entry point
│   ├── data/                     # Auto-created: SQLite DB + blockchain.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   └── Sidebar.jsx
│   │   │   └── common/
│   │   │       ├── Badge.jsx
│   │   │       └── HashDisplay.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state + token management
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx     # Stats + recent activity
│   │   │   ├── QueryPage.jsx     # SQL editor + schema browser
│   │   │   ├── AuditPage.jsx     # Log explorer + integrity verify
│   │   │   └── BlockchainPage.jsx # Block explorer + tamper demo
│   │   ├── services/
│   │   │   └── api.js            # Axios instance + interceptors
│   │   ├── styles/
│   │   │   └── global.css        # Design system (CSS vars + components)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# Install all (root + backend + frontend)
npm run install:all

# Or individually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment (optional)

```bash
cp backend/.env.example backend/.env
# Edit JWT_SECRET for production
```

### 3. Start the backend

```bash
npm run dev:backend
# Server starts on http://localhost:3001
# SQLite database and blockchain ledger auto-initialized
# Demo data seeded automatically
```

### 4. Start the frontend

```bash
npm run dev:frontend
# App available at http://localhost:5173
```

## Demo Credentials

| Username  | Password    | Role    | Capabilities                     |
|-----------|-------------|---------|----------------------------------|
| admin     | admin123    | admin   | Full access + tamper simulation  |
| analyst   | analyst123  | analyst | Read + write, no DROP            |
| viewer    | viewer123   | viewer  | SELECT only                      |

## Key Features

### 🔗 Blockchain Audit Trail
- Every SQL transaction generates a SHA-256 hash and is mined into a block (Proof of Work, difficulty 2)
- Blocks form a cryptographic chain — altering any block breaks the chain
- Before/after state snapshots captured for INSERT/UPDATE/DELETE

### 🔍 Tamper Detection Demo
1. Log in as **admin**
2. Go to **Blockchain** page
3. Click **"Demo: Simulate Tamper"** — this mutates a block's data without recalculating its hash
4. The chain validity indicator immediately shows the compromise
5. Go to **Audit Logs**, open any log, click **Verify** to see per-log integrity status

### 🗃️ SQL Query Editor
- Execute raw SQL against live database tables
- Role-based validation (viewers: SELECT only; analysts: no DROP; admins: full)
- System tables (users, audit_logs) protected from non-admin access
- Results displayed inline, every execution logged

### 📊 Dashboard
- Live stats: total logs, blocks mined, chain validity, error counts
- Operations breakdown with visual bars
- Real-time recent activity feed (auto-refreshes every 10s)

### 🛡️ Sample Data
- **patients** table — healthcare records
- **financial_records** table — transactions with status flags
- **employees** table — HR records with salaries

## API Reference

| Method | Endpoint                        | Auth   | Description                       |
|--------|---------------------------------|--------|-----------------------------------|
| POST   | /api/auth/login                 | None   | Authenticate, get JWT             |
| GET    | /api/auth/me                    | Any    | Current user info                 |
| GET    | /api/auth/users                 | Admin  | List all users                    |
| POST   | /api/auth/users                 | Admin  | Create user                       |
| POST   | /api/query/execute              | Any    | Execute SQL                       |
| GET    | /api/query/schema               | Any    | Table schemas                     |
| GET    | /api/audit/logs                 | Any    | Paginated audit logs              |
| GET    | /api/audit/logs/:id             | Any    | Single log entry                  |
| GET    | /api/audit/verify/:id           | Any    | Verify log against blockchain     |
| GET    | /api/blockchain/chain           | Any    | Paginated blockchain              |
| GET    | /api/blockchain/validate        | Any    | Full chain integrity check        |
| GET    | /api/blockchain/stats           | Any    | Chain stats                       |
| GET    | /api/blockchain/block/:index    | Any    | Single block                      |
| POST   | /api/blockchain/tamper/:index   | Admin  | Demo: simulate tampering          |
| GET    | /api/stats                      | Any    | Aggregate system stats            |
| GET    | /api/health                     | None   | Health check                      |

## Security Notes

- JWT tokens expire after 24 hours
- Passwords hashed with bcrypt (10 rounds)
- System tables protected at query validation layer
- Blockchain ledger is append-only; tampered blocks are detectable but the tamper is flagged, not silently accepted
- For production: rotate JWT_SECRET, use HTTPS, and consider a distributed blockchain node setup
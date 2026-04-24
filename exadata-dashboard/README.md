# Exadata Database Monitoring Dashboard

A full-stack monitoring dashboard for Oracle Exadata. Built with **FastAPI + python-oracledb** on the backend and **React + Vite + Recharts + Tailwind** on the frontend.

## Features

- **Overview** — instance status, CPU, session count, blocking sessions, offload efficiency at a glance
- **CPU & Sessions** — per-instance CPU and session breakdowns
- **Memory** — SGA composition (pie chart) and PGA statistics
- **Wait Events** — Top 10 system waits + live ASH activity
- **Storage** — Tablespace and ASM disk group usage with colour-coded health pills
- **Top SQL** — highest elapsed-time queries
- **Exadata Smart Scan** — offload efficiency, flash cache stats
- **Backups** — recent RMAN job status
- **Alerts** — last 24 h of alert-log entries (severity ≤ 8)
- **Blocking** — real-time blocker/waiter chain
- Auto-refresh every 10–60 seconds depending on panel
- JWT-based authentication

## Architecture

```
┌──────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   React + Vite   │ HTTPS │  FastAPI + JWT   │ TNS   │  Oracle Exadata │
│   Tailwind UI    │ ────> │  python-oracledb │ ────> │     RAC DB      │
│   Recharts       │       │  Connection Pool │       │   V$ / DBA_*    │
└──────────────────┘       └──────────────────┘       └─────────────────┘
```

---

## Prerequisites

| Component       | Version                             |
|-----------------|-------------------------------------|
| Python          | 3.11+                               |
| Node.js         | 20+                                 |
| Oracle DB       | 19c, 21c, or 23ai on Exadata        |
| Oracle Client   | Instant Client 21c+ (for thick mode)|
| Docker          | 24+ (optional, for containerised run)|

Privileges you need:
- **On the DB**: a SYSDBA account to create the monitoring user
- **On the app server**: network connectivity to the Exadata SCAN listener (port 1521)
- **Diagnostics Pack** licence (for ASH and SQL tuning views — optional)

---

## Step-by-step setup

### Step 1 — Create the monitoring user on Exadata

```bash
sqlplus / as sysdba @docs/01_create_monitoring_user.sql
```

Edit the password in the script first. Confirm grants:
```sql
SELECT privilege FROM dba_tab_privs WHERE grantee = 'DASHBOARD_MON';
```

### Step 2 — Install Oracle Instant Client (on the backend host)

Download "Basic Light" from [oracle.com/database/technologies/instant-client](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html).

```bash
# Linux example
sudo mkdir -p /opt/oracle
cd /opt/oracle
sudo unzip ~/Downloads/instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip
sudo ln -s instantclient_21_12 instantclient
echo "/opt/oracle/instantclient" | sudo tee /etc/ld.so.conf.d/oracle.conf
sudo ldconfig
```

### Step 3 — Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Exadata SCAN host, service name, and dashboard_mon credentials
```

Install dependencies and run:
```bash
python -m venv venv
source venv/bin/activate       # Linux/Mac
# .\venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Smoke-test the API:
```bash
curl http://localhost:8000/health
# -> {"status":"ok"}

# Login and grab a token
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=admin&password=admin123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### Step 4 — Configure and run the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:3000 and sign in with `admin / admin123` (change in production — see `app/core/security.py`).

### Step 5 — Run with Docker Compose (optional)

Download Instant Client into `backend/instantclient/` first (the Dockerfile expects it there), then:

```bash
cp backend/.env.example backend/.env   # edit credentials
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/docs

---

## Production hardening checklist

- Replace the hard-coded user in `backend/app/core/security.py` with LDAP/AD integration or a users table
- Rotate `SECRET_KEY` — use a 64-char random string (`openssl rand -hex 32`)
- Put nginx/HAProxy with TLS certificates in front of the frontend container
- Use an Oracle Wallet for password-less DB authentication (set `ORACLE_WALLET_LOCATION` in `.env`)
- Restrict CORS (`FRONTEND_URL`) to the exact dashboard hostname
- Run the backend behind a WAF — the `/api/metrics/*` endpoints expose sensitive DB telemetry
- Point metric polling at a read-only standby if available, to avoid load on the primary
- Monitor the monitor — scrape `/health` with your existing alerting platform

---

## Extending the dashboard

### Adding a new metric

1. Add the SQL to `backend/app/db/queries.py`
2. Expose it in `backend/app/services/monitoring.py`
3. Wire a route in `backend/app/api/metrics.py`
4. Add an axios call in `frontend/src/services/api.js`
5. Build a page in `frontend/src/pages/` and register it in `App.jsx` + `Layout.jsx`

### Adding historical trend charts

The current dashboard is point-in-time. For trends:
- Add a background scheduler (`apscheduler`, already in `requirements.txt`) to snapshot metrics every N minutes into a local SQLite or Postgres
- Build `/api/metrics/history/<metric>?range=24h` endpoints
- Render with Recharts `LineChart`

### Cell-level drill-down (Exadata-only)

Grant `V$CELL_STATE`, `V$CELL_CONFIG`, `V$CELL_THREAD_HISTORY` and add queries that break down stats per cell node. Useful for spotting a single bad storage cell.

---

## Troubleshooting

| Symptom                                       | Fix                                                                                           |
|-----------------------------------------------|-----------------------------------------------------------------------------------------------|
| `DPI-1047: Cannot locate a 64-bit Oracle Client` | Instant Client not on `LD_LIBRARY_PATH`, or `ORACLE_CLIENT_LIB_DIR` wrong                     |
| `ORA-00942: table or view does not exist`     | Monitoring user missing a grant — re-run the setup SQL                                        |
| Offload / flash cache panels show "unavailable" | Database is not on Exadata, or stats are zero on a fresh instance                             |
| 401 on every API call                         | Token expired. Log out and back in, or bump `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`          |
| CORS errors in browser console                | `FRONTEND_URL` in backend `.env` must match the URL you're loading the frontend from          |
| ASH queries return empty                      | You may not have Diagnostics Pack licensed — remove ASH queries or use sampling alternatives |

---

## File layout

```
exadata-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, metrics)
│   │   ├── core/         # Config + security
│   │   ├── db/           # Oracle pool + SQL catalogue
│   │   └── services/     # Business logic
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, reusable widgets
│   │   ├── hooks/        # usePolling
│   │   ├── pages/        # One per dashboard view
│   │   └── services/     # axios client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/
│   └── 01_create_monitoring_user.sql
├── docker-compose.yml
└── README.md
```

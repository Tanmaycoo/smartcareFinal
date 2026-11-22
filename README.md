# 🏥 SmartCare – Real-Time Hospital Resource & Emergency Coordination Platform

**SmartCare** is an institutional-grade emergency healthcare grid that connects citizens, trauma centers, and state health regulators in real time. It enables live tracking of ICU bed availability, oxygen reserves, blood banks, incoming emergency admissions, inter-hospital transfers, and healthcare facility accreditation verification.

---

## 🏛️ System Architecture

```text
                    SMARTCARE
                       │
              ┌────────┴────────┐
              │                 │
           PATIENT           HOSPITAL
              │                 │
        Find Hospital       Hospital Login (/login/hospital)
        Near Me             Dashboard
        Search              ├── Beds (General, ICU, Ventilator, etc.)
        Filters             ├── Resources (Oxygen, Blood, Doctors)
        Hospital Details    ├── Requests (Triage, Bed Allocation)
                            ├── Transfers (Priority, Owner, Deadline)
                            └── Profile & Accreditation
                                  │
                                  │
                               ADMIN
                                  │
                         Admin Dashboard (/login/admin)
                         ├── Applications Review
                         ├── Verify Documents
                         ├── Approve / Reject
                         ├── Hospital Accounts Directory
                         └── Audit / Regulatory Reports
```

---

## 💻 Tech Stack & Deployment Targets

| Layer | Technology | Production Deployment Target |
| :--- | :--- | :--- |
| **Frontend** | React 18, Next.js 14 (App Router), Tailwind CSS, Lucide Icons, Radix UI Primitives | **Vercel** (`vercel.json` included) |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Bcrypt | **Render** (`backend/render.yaml` included) |
| **Database** | PostgreSQL (with automatic zero-setup SQLite fallback for instant local run) | **Render Managed PostgreSQL** |

---

## 🔑 Distinct Login Experiences & Demo Credentials

Each role possesses a **custom-designed, distinct login experience** tailored to its operational context:

### 1. 🧑‍⚕️ Hospital Medical Staff Portal
* **URL:** `http://localhost:3000/login/hospital`
* **Theme:** High-tech clinical teal & slate with hospital identification card styling and one-click provider pre-fills.
* **Credentials:**
  * **Apollo Apex Multispecialty Hospital:** `apollo@smartcare.org` / `hospitalpass123`
  * **City Care Trauma Center:** `citycare@smartcare.org` / `hospitalpass123`
  * **Mercy Memorial Specialty Children's:** `mercy@smartcare.org` / `hospitalpass123`
* **Features:**
  * **Beds Controller:** Real-time bed counter (+1 / -1 incrementers) for ICU, Ventilator, Oxygen Support, Pediatric, General, and Trauma bays.
  * **Resource Inventory:** Real-time oxygen cylinder pressure tracking, rare blood group reserves (A+, B+, O+, O-, AB-, etc.), and on-duty trauma surgeons.
  * **Emergency Admission Queue:** Pre-arrival patient triage, live ETA countdown, and one-click bed reservation.
  * **Inter-Hospital Transfers:** Outgoing and incoming patient transfers tracking **Priority (P1 Immediate, P2 Urgent, P3 Stable)**, **Owner Physician**, **Golden Hour Deadline**, and **ALS Ambulance status**.
  * **Accreditation Profile:** Facility licensing information and document review status.

---

### 2. 🛡️ SuperAdmin Central Authority
* **URL:** `http://localhost:3000/login/admin`
* **Theme:** Executive cyber slate & indigo with security passkey styling and audit enforcement warnings.
* **Credentials:** `admin@smartcare.org` / `adminpassword123`
* **Features:**
  * **Network Overview:** Live system-wide metrics (Total Network Beds, ICU Occupancy %, Active Transfers, Queued Emergencies).
  * **Applications Verification:** Review pending hospital applications, inspect uploaded establishment licenses, NABH certificates, fire safety NOCs, and one-click **Approve** or **Reject** with audit notes.
  * **Hospital Accounts Directory:** View and toggle active/suspended status of network hospitals.
  * **Regulatory Audit Trail:** Real-time immutable event ledger tracking all bed adjustments, transfers, and admission requests with timestamps and actor emails.

---

### 3. 🚑 Patient & Citizen Emergency Portal
* **URL:** `http://localhost:3000` (Direct access) or `http://localhost:3000/login/patient`
* **Theme:** Warm, reassuring emerald & teal medical gradient with instant SOS hotline access.
* **Demo Credentials:** `patient@smartcare.org` / `patientpass123`
* **Features:**
  * **Find Hospital Near Me:** Geolocation distance calculator (Haversine formula) with 5km, 10km, 25km, 50km radius filters.
  * **Real-Time Bed & Resource Filters:** Filter by ICU beds, Ventilators, Oxygen beds, and Trauma bays.
  * **Live Status Cards:** Displays available beds, ICU status (🟢 Ready, 🟡 Low, 🔴 Critical Divert), distance in km, driving time, and direct emergency numbers.
  * **Live Admission Request:** Submit urgent admission details (Patient condition, severity, ETA) and receive an instant tracking ticket code (e.g. `SC-EMG-7721`).
  * **Live Ticket Tracking:** Anyone with a ticket code can track status in real-time (`PENDING` ➔ `TRIAGED` ➔ `BED ALLOCATED` ➔ `ADMITTED`) without signing in.

---

### 4. 📝 Hospital Registration Portal
* **URL:** `http://localhost:3000/register/hospital`
* **Features:** Onboarding flow for medical facilities to submit license numbers, GPS coordinates, bed capacities, emergency hotlines, and accreditation document summaries for Admin verification.

---

## 🚀 Running Locally

### Prerequisites
* Node.js 18+ and npm
* Python 3.10+

### 1. Start FastAPI Backend
```bash
cd backend

# Create virtualenv (if not existing)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run server on port 8001
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
* **API Documentation (Swagger UI):** `http://127.0.0.1:8001/docs`

### 2. Start Next.js Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
* **Frontend Application:** `http://localhost:3000`

---

## 🌐 Production Deployment Guide

### A. Deploy Backend to Render
1. Connect your repository to [Render](https://render.com).
2. Use the provided blueprint `backend/render.yaml` or create a **Web Service**:
   * **Root Directory:** `backend`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Environment Variables:**
     * `DATABASE_URL`: Connection string from your managed PostgreSQL database.
     * `SECRET_KEY`: Random 64-character secret.
     * `CORS_ORIGINS`: `*` or your Vercel frontend domain.

### B. Deploy Database (PostgreSQL)
1. On Render, click **New ➔ PostgreSQL**.
2. Copy the Internal Database URL into the backend `DATABASE_URL` environment variable.
3. The backend automatically handles schema migration and seeds default facilities on first boot!

### C. Deploy Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Add Environment Variable:
   * `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g. `https://smartcare-backend.onrender.com`).
4. Click **Deploy**.

---

## 🛡️ License & Compliance
Built under the SmartCare Emergency Health Coordination Initiative, compliant with standard Digital Health Mission protocols.

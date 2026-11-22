# SmartCare – Unified Clinical Ecosystem 🏥

The official multi-portal healthcare application for **SmartCare**, engineered in **Flutter** for **Mobile, Web, and Desktop**.

The application provides a unified, cross-platform client with identical styling, theme, and typography across all three primary user roles:
1. **Patient Mobile Application**: Emergency discovery, bed availability telemetry, ticket tracking, and direct GPS dispatch.
2. **Hospital Clinical Operations Portal**: Real-time bed counter synchronizers with live `+`/`-` toggles, medical resource and oxygen inventory telemetry, emergency trauma pipeline, and inter-hospital patient transfers.
3. **State SuperAdmin Command Center**: Hospital license accreditation review queue with document verification modal, hospitals active/inactive mesh toggle, statewide telemetry, and audit logs.

---

## 🎨 Design System: Clinical Pulse & Clinical Clarity

Faithfully translated from the Google Stitch production design exports:
- **Design Specifications**:
  - `stitch_smartcare_hospital_resource_app` (Patient Mobile Interface)
  - `stitch_smartcare_hospital_management_portal` (Hospital & SuperAdmin Web Dashboard)
- **Primary Color Palette**:
  - `Primary`: `#1A73E8` / `#006194` (Clinical Medical Blue)
  - `Surface`: `#FAF8FF` / `#F9F9FF`
  - `Surface Containers`: `#EAEDFF` / `#DEE8FF` / `#FFFFFF`
  - `Critical & Trauma Accent`: `#EF4444` / `#B61722` (Code Red Triage)
  - `Confirmed / Available Status`: `#10B981` / `#006947` (Mesh Synced)
- **Typography**: `Plus Jakarta Sans` & `Inter` via Google Fonts with tabular figures for telemetry numbers.
- **Responsive Layout**:
  - **Screen Width ≥ 900px (Web / Desktop)**: Displays the fixed 280px sidebar, top clinical header with facility ID and 911 hotline, dual-mode switcher (`[ Operations ]` / `[ Admin ]`), and high-density workspaces.
  - **Screen Width < 900px (Mobile Phone)**: Automatically presents the Patient Mobile App with 4-tab bottom navigation (`Home`, `Find Hospitals`, `Saved & Track`, `Profile`) and instant one-tap shortcuts to the Hospital and Admin portals.

---

## 🏥 1. Hospital Management Portal

Located at `lib/ui/screens/web/`:
- **Hospital Operations Dashboard (`hospital_dashboard_screen.dart`)**:
  - Welcome Banner with live node sync indicator and facility coordinates.
  - **Acute Code Red Emergency Bar**: Direct 911 county triage link, mass casualty standby notices, and emergency bed alerts.
  - **4-Column Telemetry KPI Tiles**:
    - Reported Bed Telemetry: General, ICU, and ER occupancy percentages with visual capacity progress bars.
    - Life Support & Oxygen: Liquid medical O2 reservoir pressure sparkline and invasive ventilator counts.
    - Emergency Triage Queue: Critical pending tickets, active ER trauma bays, and average intake times.
    - Dispatch & Transit: Available ambulance fleet telemetry and active transfers.
  - **Interactive Bed Counter Synchronizer**: Real-time live `+` and `−` increment/decrement buttons that instantly update the shared FastAPI backend and database.
  - **Emergency Transfer & Inbound Patient Queue**: Triage status indicators, ETA countdown, and one-tap bed allocation modal.
- **Bed Management Workspace (`bed_management_screen.dart`)**:
  - Full table of wards and bed categories (General Ward, ICU, Pediatric, Oxygen Support, Emergency Triage).
  - Modal dialog to add new bed categories or adjust total/available capacity and daily tariffs.
- **Resource Management Workspace (`resource_management_screen.dart`)**:
  - Inventory tracking for Medical Oxygen Cylinders, Invasive Ventilators, Blood Units, PPE, and on-duty ER specialists.
  - Classification filters: `ADEQUATE`, `LOW`, and `CRITICAL`.
  - Quick stock replenishment and status override dialog.
- **Requests & Inbound Transfers Workspace (`requests_transfers_screen.dart`)**:
  - Live intake board for incoming patient emergency tickets and inter-hospital transfers.
  - "Allocate Bed" workflow to accept patient tickets, assign bed categories, and alert triage teams.
- **Hospital Profile & Verification (`hospital_profile_screen.dart`)**:
  - Medical Establishment License, NABH accreditation badge, contact numbers, and GPS coordinates.

---

## 🛡️ 2. State SuperAdmin Command Center

Located at `lib/ui/screens/web/admin_dashboard_screen.dart`:
- **Pending Approvals Queue**:
  - Shows newly registered hospitals in `PENDING` status.
  - Document review modal inspecting attached Medical Establishment License, NABH Certificate, and Fire Safety Clearances.
  - **Approve / Reject Workflow**: Allows adding clinical inspection audit notes or rejection reasons. Approving immediately unlocks the hospital's portal access and broadcasts its beds onto the patient map.
- **Hospitals Directory**:
  - Searchable directory of all registered hospitals across the state.
  - Live active/inactive toggle switch to temporarily disconnect or reconnect a hospital from the regional mesh.
- **Platform Monitoring & Telemetry**:
  - Statewide totals: Total hospitals, active bed mesh capacity, ICU readiness, available ambulances, and active transfers.
- **Audit Logs Feed**:
  - Real-time immutable activity log recording all actor emails, roles, actions, and timestamps.

---

## 📱 3. Patient Mobile Application

Located at `lib/ui/screens/`:
- **Home Dashboard (`home_screen.dart`)**:
  - Fast "Locate Nearest ER" button and direct 911 hotline dialer.
  - Hospital search by name or specialty, with radius control (`< 5 km`, `10 km`, `25 km`, `50 km`).
  - Synced telemetry cards showing available general beds, ICU beds, and ambulances.
- **Hospital Discovery (`find_hospitals_screen.dart`)**:
  - Interactive map view and list view toggle.
  - Distance computation from the patient's current GPS location.
  - Filtering by services (Emergency 24/7, ICU Beds, Oxygen Supply, Pediatric Care).
- **Hospital Details Screen (`hospital_details_screen.dart`)**:
  - Live bed capacity breakdown with real-time occupancy bars.
  - Direct actions: Call ER, Open Google Maps Directions, Call Reception, Bookmark facility.
  - "Request Emergency Bed" button opening fast triage intake modal.
- **Ticket Tracking (`ticket_tracking_screen.dart`)**:
  - Live emergency ticket status tracker (`PENDING` ➔ `ACCEPTED` ➔ `ALLOCATED`).
  - Displays hospital allocation notes and assigned bed type.
- **Patient Profile & Portal Switcher (`profile_screen.dart`)**:
  - Patient account login/registration.
  - Network node selector (LAN Wi-Fi, Emulator, Localhost).
  - One-tap launcher for Hospital Operations Portal and SuperAdmin Command Center.

---

## 🔐 Role-Based Access Control

- **Patient**: Accesses patient discovery, bed status, and emergency requests (`role: PATIENT`).
- **Hospital Staff**: Logs into the Hospital Operations Portal (`role: HOSPITAL`).
  - **Strict Gate**: If `verification_status != 'APPROVED'`, the backend returns `403 Forbidden` and access is locked until approved by SuperAdmin.
- **Platform Administrator**: Logs into the SuperAdmin Command Center (`role: ADMIN`).

### Pre-Configured Test Accounts:
1. **SuperAdmin Account**:
   - Email: `admin@smartcare.org`
   - Password: `adminpassword123`
2. **Approved Hospital Account**:
   - Email: `rector@gmail.com`
   - Password: `rectorpassword`
3. **Register New Hospital**:
   - Can register any new hospital via the "Register Hospital" screen.
   - It will appear in the SuperAdmin "Pending Approvals" tab for live review and activation.

---

## 🚀 How to Run the Unified Suite

### Prerequisites:
- Ensure the FastAPI backend is running:
  ```powershell
  cd D:\SmartCare\backend
  .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
  ```

### 1. Launch in Google Chrome (Web & Desktop Portal):
Double-click `run_web.bat` or run:
```powershell
cd D:\SmartCare\smartcare_patient_app
C:\Users\Tanmay Kulkarni\flutter\bin\flutter.bat run -d chrome --web-port=8080
```
- Open `http://localhost:8080` in your browser.
- The web dashboard will automatically display the Clinical Operations & SuperAdmin portal shell.
- Use the sidebar toggle `[ Operations ]` / `[ Admin ]` or click "Patient Mobile App" to switch views.

### 2. Launch on Physical Android Phone / Emulator:
Double-click `run_patient_app.bat` or run:
```powershell
cd D:\SmartCare\smartcare_patient_app
C:\Users\Tanmay Kulkarni\flutter\bin\flutter.bat run
```
- On mobile viewport (< 900px), the application boots directly into the Patient Mobile Experience.
- Go to the **Profile** tab ➔ **Specialized Clinical Portals** to open the Hospital Operations or SuperAdmin portals at any time.

---

## 🧪 Testing and Quality Assurance

- **Static Analysis**: Run `flutter analyze` — **0 errors, 0 warnings**.
- **Unit & Widget Tests**: Run `flutter test` — **All tests passing**.
- **Web Build**: Run `flutter build web` — **Successfully compiled to `build\web`**.

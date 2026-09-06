# Implementation Plan: Kryptic - Document Scanner, Expiry Alert & Encrypted Vault App

Kryptic is an end-to-end document management and vault application designed for Android (APK via Capacitor/React) backed by a Python FastAPI engine. It scans all documents line-by-line regardless of format, detects vehicle registration & insurance/PUC expiry dates, issues 7-day advance expiration notifications until renewed, enables document conversion (PDF ↔ Word ↔ HTML), native sharing, re-uploading, deletion, and protects passwords, bank account details, and social links in an AES-256 encrypted vault with a multi-color theme engine.

## User Review Required

> [!IMPORTANT]
> - **Backend**: Python 3.14 + FastAPI + SQLite with PyMuPDF, python-docx, pdf2docx, mammoth, and cryptography (Fernet AES-256).
> - **Frontend**: React + Vite + Capacitor, designed mobile-first with 5 theme modes (Cyberpunk, Matrix Neon, Midnight Dark, Crimson Stealth, Light).
> - **Android APK Compilation**: We configure Capacitor (`capacitor.config.json`) and Android build scripts. Since the local machine currently lacks the Java JDK / Android SDK binaries, we provide the complete runnable app locally (with hot reload, mobile viewport simulation, and live API connectivity) and provide the exact 1-command build step (`npx cap build android` / `gradlew assembleRelease`) for compiling the standalone `.apk`.

## Proposed Changes

### Python Backend (`backend/`)

#### [NEW] [requirements.txt](file:///c:/Users/user/Desktop/kryptic-/backend/requirements.txt)
Dependencies: `fastapi`, `uvicorn`, `python-multipart`, `pydantic`, `python-dateutil`, `PyMuPDF`, `pypdf`, `python-docx`, `pdf2docx`, `mammoth`, `cryptography`.

#### [NEW] [database.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/database.py)
SQLite database engine with table creation and session management.

#### [NEW] [models.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/models.py)
- `Document`: Storing filename, storage path, format, detected category (e.g., Vehicle PUC, Vehicle Insurance, License, General), vehicle registration number, expiry date, replacement link.
- `DocumentLine`: Storing line-by-line extracted text with page number and line number for deep search.
- `VaultItem`: Passwords, bank account details, and social links (GitHub, LinkedIn, Instagram) with AES encrypted payload.
- `Notification`: Expiry alerts (7 days before expiry date until renewed/replaced).

#### [NEW] [extractor.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/services/extractor.py)
Multi-format line-by-line extractor supporting PDF (selectable & scanned via PyMuPDF/pypdf), DOCX (`python-docx`), TXT, CSV, MD, and image metadata/text.

#### [NEW] [regex_detector.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/services/regex_detector.py)
Pattern recognition for:
- Vehicle registration numbers (e.g. `DL 01 AB 1234`, `MH 12 DE 5678`)
- Vehicle Pollution (PUC) & Emission test expiry dates
- Vehicle Insurance policy end dates
- General document expiration dates

#### [NEW] [converter.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/services/converter.py)
Format conversion:
- PDF ➔ Word (`.docx`) via `pdf2docx`
- Word (`.docx`) ➔ HTML via `mammoth`
- PDF ➔ HTML via `PyMuPDF`
- HTML / Text ➔ downloadable files

#### [NEW] [security.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/services/security.py)
AES-256 Fernet encryption and decryption for passwords, bank account information, and social media handles.

#### [NEW] [main.py](file:///c:/Users/user/Desktop/kryptic-/backend/app/main.py)
FastAPI REST API routes:
- `POST /api/documents/upload`: Upload file, extract text line-by-line, detect vehicle/expiry, schedule alerts.
- `GET /api/documents`: List all documents with filter & search.
- `GET /api/documents/search`: Line-by-line full-text search across all documents.
- `GET /api/documents/{id}/lines`: Retrieve scanned lines for preview.
- `POST /api/documents/{id}/convert`: Convert to Word or HTML.
- `POST /api/documents/{id}/reupload`: Re-upload a document, update expiry, and auto-dismiss previous alerts.
- `DELETE /api/documents/{id}`: Delete document and its scanned lines.
- `GET /api/documents/{id}/download`: Download original or converted file.
- `GET /api/notifications`: Get active alerts (especially documents expiring $\le 7$ days).
- `GET /api/vault` & `POST /api/vault`: Manage passwords, bank accounts, and social links.
- `DELETE /api/vault/{id}`: Delete vault entry.

---

### React Frontend (`frontend/`)

#### [NEW] [package.json](file:///c:/Users/user/Desktop/kryptic-/frontend/package.json)
Vite + React + Lucide Icons + `@capacitor/core` + `@capacitor/cli` + `@capacitor/share`.

#### [NEW] [capacitor.config.json](file:///c:/Users/user/Desktop/kryptic-/frontend/capacitor.config.json)
Capacitor configuration setting app id `com.kryptic.app`, app name `Kryptic`, and web dir `dist`.

#### [NEW] [ThemeContext.jsx](file:///c:/Users/user/Desktop/kryptic-/frontend/src/context/ThemeContext.jsx)
5 dynamic themes:
1. **Cyberpunk Neon** (Electric Pink `#ff007f`, Cyan `#00f0ff`, Dark Violet `#0f051d`)
2. **Matrix Neon** (Phosphor Green `#00ff41`, Emerald `#10b981`, Deep Green-Black `#051205`)
3. **Midnight Dark** (Indigo `#6366f1`, Sky Blue `#38bdf8`, OLED Black `#121214`)
4. **Crimson Stealth** (Crimson `#ef4444`, Amber `#f59e0b`, Charcoal `#18181b`)
5. **Nordic Clean** (Sapphire `#2563eb`, Sky `#0284c7`, Snow Light `#f8fafc`)

#### [NEW] [App.jsx](file:///c:/Users/user/Desktop/kryptic-/frontend/src/App.jsx) & Navigation Shell
Mobile app shell with top header (Theme Selector & Expiry Notification Bell with badge) and bottom navigation bar:
- **Documents**: Upload, view cards, badges for vehicle number & expiry, re-upload, share, delete, format conversion.
- **Line Search**: Deep line-by-line search query input, displaying matching lines with line & page numbers.
- **Vault**: Tabs for Passwords (with reveal/hide & copy), Bank Accounts (Account number, IFSC, Bank name), Social Links (LinkedIn, Instagram, GitHub with 1-click links).
- **Alerts / Notifications**: Dedicated screen showing expiring documents (flags $\le 7$ days until expiry).

---

## Verification Plan

### Automated & Unit Verification
- Start FastAPI backend with `uvicorn` on port 8000.
- Verify health check `GET /api/health`.
- Test upload of PDF, DOCX, and TXT documents.
- Test line-by-line extraction and vehicle/expiry regex recognition.
- Test conversion: PDF ➔ DOCX and PDF ➔ HTML.
- Test vault encryption/decryption.

### Manual & Interactive Browser Verification
- Start Vite frontend on port 5173 with proxy to backend.
- Use `browser_subagent` to open `http://localhost:5173`:
  1. Switch between all 5 color themes and verify contrast and visual polish.
  2. Upload a sample vehicle pollution / insurance document with an expiry date within 7 days.
  3. Verify the 7-day expiry warning badge and notification alert.
  4. Perform line-by-line search for specific text.
  5. Test format conversion (PDF to Word/HTML) and verify download button.
  6. Add Passwords, Bank Accounts, and Social links in the Vault.
  7. Test Re-upload and Delete document.

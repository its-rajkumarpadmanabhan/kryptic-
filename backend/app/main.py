import os
import shutil
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import engine, Base, get_db
from app.models import Document, DocumentLine, VaultItem
from app.services.extractor import extract_lines_from_file
from app.services.regex_detector import analyze_extracted_lines
from app.services.converter import convert_document
from app.services.security import encrypt_secret, decrypt_secret

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kryptic API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
CONVERT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "converted")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CONVERT_DIR, exist_ok=True)

app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/static/converted", StaticFiles(directory=CONVERT_DIR), name="converted")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Kryptic", "version": "1.0.0"}

# ==========================================
# DOCUMENT ENDPOINTS
# ==========================================

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    original_name = file.filename
    ext = os.path.splitext(original_name)[1].lower()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{original_name.replace(' ', '_')}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)

    # 1. Scan line-by-line
    lines_data = extract_lines_from_file(saved_path, ext)

    # 2. Analyze lines for smart metadata (vehicle, PUC, insurance, expiry)
    meta = analyze_extracted_lines(lines_data)

    # 3. Create document record
    doc = Document(
        filename=safe_filename,
        original_name=original_name,
        file_path=saved_path,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        doc_category=meta["category"],
        vehicle_number=meta["vehicle_number"],
        expiry_date=meta["expiry_date"],
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 4. Save each line in DB for deep full-text line searching
    line_objects = [
        DocumentLine(
            document_id=doc.id,
            page_number=item["page"],
            line_number=item["line_no"],
            text=item["text"]
        )
        for item in lines_data
    ]
    if line_objects:
        db.bulk_save_objects(line_objects)
        db.commit()

    return {
        "success": True,
        "message": f"Uploaded and scanned {len(line_objects)} lines.",
        "document": {
            "id": doc.id,
            "filename": doc.original_name,
            "category": doc.doc_category,
            "vehicle_number": doc.vehicle_number,
            "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
            "lines_count": len(line_objects),
            "file_type": doc.file_type
        }
    }

@app.get("/api/documents")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.upload_date.desc()).all()
    results = []
    now = datetime.utcnow()
    for d in docs:
        is_expiring_soon = False
        days_remaining = None
        if d.expiry_date and not d.is_replaced:
            diff = (d.expiry_date - now).days
            days_remaining = diff
            if diff <= 7:
                is_expiring_soon = True

        results.append({
            "id": d.id,
            "filename": d.original_name,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "category": d.doc_category,
            "vehicle_number": d.vehicle_number,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "days_remaining": days_remaining,
            "is_expiring_soon": is_expiring_soon,
            "is_replaced": d.is_replaced,
            "upload_date": d.upload_date.isoformat(),
            "download_url": f"/static/uploads/{d.filename}"
        })
    return results

@app.get("/api/documents/{doc_id}/lines")
def get_document_lines(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    lines = db.query(DocumentLine).filter(DocumentLine.document_id == doc_id).order_by(DocumentLine.page_number, DocumentLine.line_number).all()
    return {
        "document_id": doc.id,
        "filename": doc.original_name,
        "total_lines": len(lines),
        "lines": [{"page": l.page_number, "line_no": l.line_number, "text": l.text} for l in lines]
    }

@app.get("/api/documents/search")
def search_lines(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """
    Full-text search querying each scanned line across all documents.
    """
    search_term = f"%{q.strip()}%"
    matching_lines = (
        db.query(DocumentLine, Document)
        .join(Document, DocumentLine.document_id == Document.id)
        .filter(DocumentLine.text.ilike(search_term))
        .limit(100)
        .all()
    )

    results = []
    for line, doc in matching_lines:
        results.append({
            "document_id": doc.id,
            "filename": doc.original_name,
            "category": doc.doc_category,
            "vehicle_number": doc.vehicle_number,
            "page_number": line.page_number,
            "line_number": line.line_number,
            "matched_text": line.text
        })
    return {"query": q, "total_matches": len(results), "matches": results}

@app.post("/api/documents/{doc_id}/convert")
def convert_doc(doc_id: int, format: str = Query(..., pattern="^(docx|html|txt)$"), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        output_path = convert_document(doc.file_path, format, CONVERT_DIR)
        converted_filename = os.path.basename(output_path)
        return {
            "success": True,
            "format": format,
            "converted_filename": converted_filename,
            "download_url": f"/static/converted/{converted_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")

@app.post("/api/documents/{doc_id}/reupload")
async def reupload_document(
    doc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    old_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not old_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    original_name = file.filename
    ext = os.path.splitext(original_name)[1].lower()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{original_name.replace(' ', '_')}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)
    lines_data = extract_lines_from_file(saved_path, ext)
    meta = analyze_extracted_lines(lines_data)

    # Mark old doc as replaced (this immediately cancels its active expiry warning)
    old_doc.is_replaced = True

    new_doc = Document(
        filename=safe_filename,
        original_name=original_name,
        file_path=saved_path,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        doc_category=meta["category"] if meta["category"] != "General Document" else old_doc.doc_category,
        vehicle_number=meta["vehicle_number"] or old_doc.vehicle_number,
        expiry_date=meta["expiry_date"],
        replaced_by_id=None
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    old_doc.replaced_by_id = new_doc.id
    db.commit()

    # Save new lines
    line_objects = [
        DocumentLine(
            document_id=new_doc.id,
            page_number=item["page"],
            line_number=item["line_no"],
            text=item["text"]
        )
        for item in lines_data
    ]
    if line_objects:
        db.bulk_save_objects(line_objects)
        db.commit()

    return {
        "success": True,
        "message": "Document renewed & re-uploaded successfully. Previous expiry alerts cleared!",
        "new_document_id": new_doc.id,
        "expiry_date": new_doc.expiry_date.isoformat() if new_doc.expiry_date else None
    }

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"success": True, "message": f"Document {doc.original_name} deleted successfully"}

# ==========================================
# NOTIFICATIONS & EXPIRY ALERTS (1 WEEK PRIOR)
# ==========================================

@app.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db)):
    """
    Returns notifications for documents with expiry dates within 7 days from now
    up to the expiration date (and overdue items), until the user replaces/renews them.
    """
    now = datetime.utcnow()
    one_week_later = now + timedelta(days=7)

    expiring_docs = (
        db.query(Document)
        .filter(
            Document.expiry_date.isnot(None),
            Document.is_replaced == False,
            Document.expiry_date <= one_week_later
        )
        .order_by(Document.expiry_date.asc())
        .all()
    )

    alerts = []
    for d in expiring_docs:
        diff_days = (d.expiry_date - now).days
        is_overdue = d.expiry_date < now

        if is_overdue:
            status = "OVERDUE"
            title = f"🚨 EXPIRED: {d.doc_category}"
            desc = f"'{d.original_name}' expired on {d.expiry_date.strftime('%d-%b-%Y')}. Please re-upload renewed document."
        elif diff_days == 0:
            status = "CRITICAL"
            title = f"⚠️ EXPIRES TODAY: {d.doc_category}"
            desc = f"'{d.original_name}' expires TODAY ({d.expiry_date.strftime('%d-%b-%Y')})."
        else:
            status = "WARNING"
            title = f"⚠️ Expiry Warning: {d.doc_category}"
            desc = f"'{d.original_name}' expires in {diff_days} day(s) on {d.expiry_date.strftime('%d-%b-%Y')}."

        if d.vehicle_number:
            desc += f" (Vehicle: {d.vehicle_number})"

        alerts.append({
            "document_id": d.id,
            "title": title,
            "description": desc,
            "status": status,
            "days_left": diff_days,
            "vehicle_number": d.vehicle_number,
            "expiry_date": d.expiry_date.isoformat(),
            "category": d.doc_category,
            "filename": d.original_name
        })

    return {"total_alerts": len(alerts), "alerts": alerts}

# ==========================================
# ENCRYPTED VAULT (PASSWORDS, BANKS, SOCIALS)
# ==========================================

@app.get("/api/vault")
def get_vault_items(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(VaultItem)
    if category:
        query = query.filter(VaultItem.category == category)
    items = query.order_by(VaultItem.created_at.desc()).all()

    results = []
    for it in items:
        meta_dict = {}
        if it.extra_meta:
            try:
                meta_dict = json.loads(it.extra_meta)
            except Exception:
                pass

        results.append({
            "id": it.id,
            "category": it.category, # 'password', 'bank_account', 'social_link'
            "title": it.title,
            "identifier": it.identifier,
            "decrypted_secret": decrypt_secret(it.encrypted_secret),
            "meta": meta_dict,
            "created_at": it.created_at.isoformat()
        })
    return results

@app.post("/api/vault")
def create_vault_item(
    category: str = Form(...), # 'password', 'bank_account', 'social_link'
    title: str = Form(...),
    identifier: Optional[str] = Form(None),
    secret: str = Form(...),
    extra_meta: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    encrypted = encrypt_secret(secret)
    item = VaultItem(
        category=category,
        title=title,
        identifier=identifier,
        encrypted_secret=encrypted,
        extra_meta=extra_meta
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"success": True, "id": item.id, "message": "Vault item stored securely with AES-256."}

@app.delete("/api/vault/{item_id}")
def delete_vault_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(VaultItem).filter(VaultItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")
    db.delete(item)
    db.commit()
    return {"success": True, "message": f"Vault item '{item.title}' removed."}

# ==========================================
# DEMO SEED DATA (FOR INSTANT TESTING)
# ==========================================

@app.post("/api/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """Populates realistic demo documents and vault entries for immediate testing."""
    existing_count = db.query(Document).count()
    if existing_count > 0:
        return {"message": "Data already seeded."}

    # 1. Sample Vehicle Pollution Certificate (Expires in 4 days - tests 7-day notification!)
    puc_date = datetime.utcnow() + timedelta(days=4)
    puc_lines = [
        "GOVERNMENT OF NCT OF DELHI - TRANSPORT DEPARTMENT",
        "POLLUTION UNDER CONTROL CERTIFICATE (PUC)",
        "Certificate No: DL01/PUC/2026/89412",
        "Vehicle Registration No: DL 01 AB 1234",
        "Vehicle Class: 4 Wheeler Petrol LMV",
        "Date of Testing: 01/03/2026",
        f"Valid Upto: {puc_date.strftime('%d/%m/%Y')}",
        "Carbon Monoxide (CO): 0.12% (Prescribed Standard <= 0.5%)",
        "Hydrocarbon (HC): 110 ppm (Prescribed Standard <= 750 ppm)",
        "Result: PASS - Compliant with Bharat Stage VI"
    ]
    puc_file_path = os.path.join(UPLOAD_DIR, "DL01AB1234_Pollution_Certificate.txt")
    with open(puc_file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(puc_lines))

    doc_puc = Document(
        filename="DL01AB1234_Pollution_Certificate.txt",
        original_name="DL01AB1234_Pollution_Certificate.txt",
        file_path=puc_file_path,
        file_type="txt",
        file_size=len("\n".join(puc_lines)),
        doc_category="Vehicle Pollution Certificate (PUC)",
        vehicle_number="DL 01 AB 1234",
        expiry_date=puc_date
    )
    db.add(doc_puc)
    db.commit()
    db.refresh(doc_puc)

    for idx, l in enumerate(puc_lines, start=1):
        db.add(DocumentLine(document_id=doc_puc.id, page_number=1, line_number=idx, text=l))
    db.commit()

    # 2. Sample Vehicle Insurance Policy (Expires in 6 days)
    ins_date = datetime.utcnow() + timedelta(days=6)
    ins_lines = [
        "HDFC ERGO GENERAL INSURANCE COMPANY LIMITED",
        "COMPREHENSIVE MOTOR VEHICLE INSURANCE POLICY",
        "Policy Number: MOT-99214-2025-V2",
        "Insured Name: Rajkumar Padmanabhan",
        "Vehicle Number: MH 12 DE 5678",
        "Chassis No: MA3EWA12S00129481",
        "Engine No: K12MN8921849",
        "IDV (Insured Declared Value): Rs. 7,50,000",
        f"Policy End Date: {ins_date.strftime('%d/%m/%Y')}",
        "Valid Till: 23:59 Hours of Midnight",
        "Third Party Liability Covered: Yes",
        "Zero Depreciation Add-on: Active"
    ]
    ins_file_path = os.path.join(UPLOAD_DIR, "MH12DE5678_Insurance_Policy.txt")
    with open(ins_file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ins_lines))

    doc_ins = Document(
        filename="MH12DE5678_Insurance_Policy.txt",
        original_name="MH12DE5678_Insurance_Policy.txt",
        file_path=ins_file_path,
        file_type="txt",
        file_size=len("\n".join(ins_lines)),
        doc_category="Vehicle Insurance Policy",
        vehicle_number="MH 12 DE 5678",
        expiry_date=ins_date
    )
    db.add(doc_ins)
    db.commit()
    db.refresh(doc_ins)

    for idx, l in enumerate(ins_lines, start=1):
        db.add(DocumentLine(document_id=doc_ins.id, page_number=1, line_number=idx, text=l))
    db.commit()

    # 3. Sample PDF Document (Generated on the fly using PyMuPDF)
    pdf_path = os.path.join(UPLOAD_DIR, "Vehicle_Road_Tax_Receipt.pdf")
    import fitz
    pdf_doc = fitz.open()
    pdf_page = pdf_doc.new_page()
    pdf_text = (
        "TRANSPORT DEPARTMENT - ROAD TAX PAYMENT RECEIPT\n"
        "Receipt Number: RT-2026-99381\n"
        "Registration Number: KA 05 MB 9999\n"
        "Owner Name: Kryptic User\n"
        "Tax Period: 5 Years Motor Vehicle Tax\n"
        "Amount Paid: Rs. 14,500\n"
        "Payment Mode: Online Netbanking\n"
        "Valid Upto: 25/11/2030\n"
        "Status: Paid and Verified"
    )
    pdf_page.insert_text((50, 72), pdf_text, fontsize=12)
    pdf_doc.save(pdf_path)
    pdf_doc.close()

    doc_pdf = Document(
        filename="Vehicle_Road_Tax_Receipt.pdf",
        original_name="Vehicle_Road_Tax_Receipt.pdf",
        file_path=pdf_path,
        file_type="pdf",
        file_size=os.path.getsize(pdf_path),
        doc_category="Vehicle Registration (RC)",
        vehicle_number="KA 05 MB 9999",
        expiry_date=datetime(2030, 11, 25)
    )
    db.add(doc_pdf)
    db.commit()
    db.refresh(doc_pdf)

    for idx, line in enumerate(pdf_text.splitlines(), start=1):
        db.add(DocumentLine(document_id=doc_pdf.id, page_number=1, line_number=idx, text=line))
    db.commit()

    # 4. Vault Items: Social links, Bank Account, Passwords
    socials = [
        ("social_link", "GitHub", "https://github.com/its-rajkumarpadmanabhan", "Personal & OSS Projects", {"platform": "github", "icon": "github"}),
        ("social_link", "LinkedIn", "https://linkedin.com/in/rajkumarpadmanabhan", "Professional Profile", {"platform": "linkedin", "icon": "linkedin"}),
        ("social_link", "Instagram", "https://instagram.com/kryptic_app", "Official App Page", {"platform": "instagram", "icon": "instagram"}),
        ("bank_account", "HDFC Salary Account", "Account No: 50100492817264", "Branch: Connaught Place", {"ifsc": "HDFC0000123", "account_type": "Savings", "nominee": "Registered"}),
        ("bank_account", "Chase Freedom Unlimited", "Card Ending: **** 8821", "Exp: 08/29 | CVV: 742", {"card_type": "Visa Signature", "limit": "$15,000"}),
        ("password", "AWS Cloud Root Account", "admin@kryptic.internal", "Krypt!c#9920@CloudAWS$", {"service": "Cloud Hosting", "mfa": "Hardware YubiKey"}),
        ("password", "Google Workspace", "rajkumar@kryptic.dev", "G00gle#PassKey$2026!", {"service": "Email & Drive", "mfa": "Authenticator App"})
    ]

    for cat, title, ident, sec, meta in socials:
        db.add(VaultItem(
            category=cat,
            title=title,
            identifier=ident,
            encrypted_secret=encrypt_secret(sec),
            extra_meta=json.dumps(meta)
        ))
    db.commit()

    return {"message": "Demo documents, vehicle expiry alerts, and vault items seeded successfully!"}

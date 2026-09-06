from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, txt, png, etc.
    file_size = Column(Integer, default=0)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Auto-detected smart metadata
    doc_category = Column(String(100), default="General Document")
    vehicle_number = Column(String(50), nullable=True) # e.g. DL 01 AB 1234
    expiry_date = Column(DateTime, nullable=True)
    is_replaced = Column(Boolean, default=False)
    replaced_by_id = Column(Integer, ForeignKey("documents.id"), nullable=True)

    # Relationships
    lines = relationship("DocumentLine", back_populates="document", cascade="all, delete-orphan")

class DocumentLine(Base):
    __tablename__ = "document_lines"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    page_number = Column(Integer, default=1)
    line_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

    document = relationship("Document", back_populates="lines")

class VaultItem(Base):
    __tablename__ = "vault_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False) # 'password', 'bank_account', 'social_link'
    title = Column(String(150), nullable=False)   # e.g., 'GitHub', 'Chase Bank Checking', 'Netflix'
    identifier = Column(String(255), nullable=True) # username, profile URL, account number
    encrypted_secret = Column(Text, nullable=False) # AES encrypted payload
    extra_meta = Column(Text, nullable=True)       # JSON string for extra fields (IFSC, bank name, card expiry)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

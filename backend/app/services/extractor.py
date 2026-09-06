import os
from typing import List, Dict, Any
import fitz  # PyMuPDF
from docx import Document as DocxDocument

def extract_lines_from_file(file_path: str, extension: str) -> List[Dict[str, Any]]:
    """
    Extracts content line-by-line from any uploaded file.
    Returns: [{"page": int, "line_no": int, "text": str}]
    """
    lines_output = []
    ext = extension.lower()

    if ext == ".pdf":
        try:
            doc = fitz.open(file_path)
            for page_idx, page in enumerate(doc, start=1):
                page_text = page.get_text("text")
                raw_lines = page_text.splitlines()
                line_no = 1
                for line in raw_lines:
                    cleaned = line.strip()
                    if cleaned:
                        lines_output.append({
                            "page": page_idx,
                            "line_no": line_no,
                            "text": cleaned
                        })
                        line_no += 1
            doc.close()
        except Exception as e:
            print(f"[PDF Extract Error] {e}")

    elif ext in [".docx", ".doc"]:
        try:
            doc = DocxDocument(file_path)
            line_no = 1
            # Extract paragraphs
            for p in doc.paragraphs:
                cleaned = p.text.strip()
                if cleaned:
                    lines_output.append({
                        "page": 1,
                        "line_no": line_no,
                        "text": cleaned
                    })
                    line_no += 1
            # Extract table cells as lines too
            for table in doc.tables:
                for row in table.rows:
                    row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_texts:
                        lines_output.append({
                            "page": 1,
                            "line_no": line_no,
                            "text": " | ".join(row_texts)
                        })
                        line_no += 1
        except Exception as e:
            print(f"[DOCX Extract Error] {e}")

    elif ext in [".txt", ".csv", ".tsv", ".md", ".json", ".log"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f, start=1):
                    cleaned = line.strip()
                    if cleaned:
                        lines_output.append({
                            "page": 1,
                            "line_no": idx,
                            "text": cleaned
                        })
        except Exception as e:
            print(f"[Text Extract Error] {e}")

    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp"]:
        # Try pytesseract if available
        try:
            from PIL import Image
            import pytesseract
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            for idx, line in enumerate(text.splitlines(), start=1):
                cleaned = line.strip()
                if cleaned:
                    lines_output.append({
                        "page": 1,
                        "line_no": idx,
                        "text": cleaned
                    })
        except Exception as e:
            print(f"[OCR Warning] Image OCR fallback: {e}")
            lines_output.append({
                "page": 1,
                "line_no": 1,
                "text": f"[Scanned Image File: {os.path.basename(file_path)}]"
            })

    return lines_output

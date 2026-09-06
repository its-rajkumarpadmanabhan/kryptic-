import os
import fitz # PyMuPDF
from pdf2docx import Converter as PdfToDocxConverter
import mammoth

def convert_document(input_path: str, target_format: str, output_dir: str) -> str:
    """
    Converts document to desired target format: 'docx', 'html', 'txt'
    Returns absolute path of converted file.
    """
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    input_ext = os.path.splitext(input_path)[1].lower()
    target_format = target_format.lower().replace(".", "")

    os.makedirs(output_dir, exist_ok=True)
    output_filename = f"{base_name}_converted.{target_format}"
    output_path = os.path.join(output_dir, output_filename)

    # 1. PDF -> Word (DOCX)
    if input_ext == ".pdf" and target_format == "docx":
        cv = PdfToDocxConverter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return output_path

    # 2. PDF -> HTML
    elif input_ext == ".pdf" and target_format == "html":
        doc = fitz.open(input_path)
        html_chunks = [
            "<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<title>Kryptic Export</title>"
            "<style>body{font-family:sans-serif;max-width:850px;margin:30px auto;padding:20px;background:#f9fafb;color:#111;}"
            ".page{background:#fff;padding:30px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-radius:8px;}</style>"
            "</head><body>"
        ]
        for idx, page in enumerate(doc, start=1):
            html_chunks.append(f"<div class='page'><h3>Page {idx}</h3>")
            html_chunks.append(page.get_text("html"))
            html_chunks.append("</div>")
        html_chunks.append("</body></html>")
        doc.close()

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("".join(html_chunks))
        return output_path

    # 3. Word (DOCX) -> HTML
    elif input_ext in [".docx", ".doc"] and target_format == "html":
        with open(input_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            full_html = (
                "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                "<style>body{font-family:sans-serif;max-width:800px;margin:30px auto;padding:20px;line-height:1.6;color:#222;}</style>"
                f"</head><body><h2>{base_name}</h2><hr/>{result.value}</body></html>"
            )
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(full_html)
        return output_path

    # 4. Any format -> TXT / HTML fallback
    elif target_format == "html":
        # Extract lines & write styled HTML
        with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        html_content = (
            f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>"
            f"body{{font-family:monospace;padding:24px;background:#111;color:#00ff41;white-space:pre-wrap;}}"
            f"</style></head><body>{content}</body></html>"
        )
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return output_path

    elif target_format == "txt":
        doc = fitz.open(input_path) if input_ext == ".pdf" else None
        if doc:
            text = "\n".join([page.get_text("text") for page in doc])
            doc.close()
        else:
            with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        return output_path

    else:
        raise ValueError(f"Conversion from {input_ext} to {target_format} is not supported.")

import re
from datetime import datetime
from dateutil import parser as date_parser

# RegEx for vehicle registration numbers (e.g., DL 01 AB 1234, MH-12-DE-5678, KA05MB9999)
VEHICLE_REGEX = re.compile(
    r'\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{3,4})\b',
    re.IGNORECASE
)

# Date formats like DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
DATE_REGEX = re.compile(
    r'\b(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{2,4}|\d{4}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{1,2})\b'
)

EXPIRY_TRIGGERS = [
    "expiry", "expires", "valid upto", "valid up to", "valid till", 
    "valid through", "validity", "due date", "puc valid", "policy end date",
    "fitness upto", "insurance upto", "end date"
]

def analyze_extracted_lines(lines: list) -> dict:
    """
    Analyzes line objects: [{"page": int, "line_no": int, "text": str}]
    Returns detected category, vehicle number, and extracted expiry datetime.
    """
    full_text_lower = " ".join([l["text"].lower() for l in lines])

    category = "General Document"
    if any(k in full_text_lower for k in ["pollution", "puc", "emission test", "smoke test"]):
        category = "Vehicle Pollution Certificate (PUC)"
    elif any(k in full_text_lower for k in ["motor insurance", "vehicle insurance", "policy schedule", "policy certificate"]):
        category = "Vehicle Insurance Policy"
    elif any(k in full_text_lower for k in ["driving licence", "driving license", "driver license"]):
        category = "Driving License"
    elif any(k in full_text_lower for k in ["registration certificate", "rc book", "form 23"]):
        category = "Vehicle Registration (RC)"
    elif any(k in full_text_lower for k in ["passport", "republic of india"]):
        category = "Passport / ID"

    # Search for vehicle number
    vehicle_number = None
    vehicle_match = VEHICLE_REGEX.search(full_text_lower)
    if vehicle_match:
        # Standardize formatting to uppercase with standard spacing
        raw_num = vehicle_match.group(1).upper()
        # Clean double spaces or weird punctuation
        vehicle_number = re.sub(r'[\s-]+', ' ', raw_num)

    # Search for expiry date
    expiry_date = None
    for item in lines:
        text_lower = item["text"].lower()
        if any(trig in text_lower for trig in EXPIRY_TRIGGERS):
            date_matches = DATE_REGEX.findall(item["text"])
            for raw_date in date_matches:
                try:
                    # Clean punctuation
                    cleaned_date = raw_date.replace('.', '/').replace('-', '/')
                    parsed = date_parser.parse(cleaned_date, dayfirst=True)
                    # Filter out implausible years
                    if 2000 <= parsed.year <= 2100:
                        expiry_date = parsed
                        break
                except Exception:
                    continue
        if expiry_date:
            break

    # If no trigger keyword found, scan entire text for words like "valid: 12/09/2026"
    if not expiry_date:
        for item in lines:
            if "valid" in item["text"].lower() or "date" in item["text"].lower():
                matches = DATE_REGEX.findall(item["text"])
                for raw_date in matches:
                    try:
                        parsed = date_parser.parse(raw_date, dayfirst=True)
                        if 2024 <= parsed.year <= 2100:
                            expiry_date = parsed
                            break
                    except Exception:
                        pass
            if expiry_date:
                break

    return {
        "category": category,
        "vehicle_number": vehicle_number,
        "expiry_date": expiry_date
    }

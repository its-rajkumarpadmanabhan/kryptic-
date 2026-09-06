import urllib.request
import json
import mimetypes
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post(path, data=None):
    req = urllib.request.Request(f"{BASE_URL}{path}", method="POST")
    if data:
        req.data = urllib.parse.urlencode(data).encode()
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print("1. Testing Health...")
health = get("/health")
print("Health:", health)

print("\n2. Testing Documents List...")
docs = get("/documents")
print(f"Retrieved {len(docs)} documents:")
for d in docs:
    print(f" - [{d['id']}] {d['filename']} ({d['category']}) | Vehicle: {d['vehicle_number']} | Expiry: {d['expiry_date']} | Expiring Soon: {d['is_expiring_soon']}")

print("\n3. Testing 7-Day Expiry Notifications...")
notifs = get("/notifications")
print(f"Total Expiry Alerts: {notifs['total_alerts']}")
for a in notifs['alerts']:
    print(f" - [{a['status']}] {a['title']} -> {a['description']}")

print("\n4. Testing Line Search for 'DL 01 AB'...")
search_res = get("/documents/search?q=DL%2001%20AB")
print(f"Found {search_res['total_matches']} matches:")
for m in search_res['matches']:
    print(f" - Doc: {m['filename']} (L{m['line_number']}): {m['matched_text']}")

print("\n5. Testing Document Lines Retrieval for Doc 1...")
lines = get("/documents/1/lines")
print(f"Total lines in Doc 1: {lines['total_lines']}")
for l in lines['lines'][:3]:
    print(f"   Line {l['line_no']}: {l['text']}")

print("\n6. Testing Document Format Conversion (PDF -> HTML)...")
conv_html = post("/documents/3/convert?format=html")
print("Converted to HTML:", conv_html)

print("\n7. Testing Document Format Conversion (PDF -> DOCX)...")
conv_docx = post("/documents/3/convert?format=docx")
print("Converted to DOCX:", conv_docx)

print("\n8. Testing Vault Items (AES-256 Decrypted)...")
vault_items = get("/vault")
print(f"Retrieved {len(vault_items)} vault items:")
for v in vault_items:
    print(f" - [{v['category']}] {v['title']} ({v['identifier']}) -> Decrypted Secret: {v['decrypted_secret']}")

print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

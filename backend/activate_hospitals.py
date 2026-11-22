import sys
import os

sys.path.insert(0, r"d:\SmartCare\backend")
os.chdir(r"d:\SmartCare\backend")

from app.database import SessionLocal
from app import models

db = SessionLocal()
hosps = db.query(models.Hospital).all()
print(f"Found {len(hosps)} hospitals:")
for h in hosps:
    print(f"  ID: {h.id}, Name: {h.name}, Status: {h.verification_status}, is_active: {h.is_active}")
    h.is_active = True
    h.verification_status = "APPROVED"

db.commit()
print("All hospitals set to is_active=True and verification_status='APPROVED'")
db.close()

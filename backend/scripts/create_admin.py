import getpass
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from app.database import SessionLocal
from app.models import User
from app.security import hash_password

db = SessionLocal(); email = input("Admin email: ").strip().lower(); password = getpass.getpass("Password (8+ characters): ")
if len(password) < 8: raise SystemExit("Password is too short")
if db.scalar(select(User).where(User.email == email)): raise SystemExit("User already exists")
db.add(User(full_name=input("Full name: ").strip(), email=email, password_hash=hash_password(password), role="admin")); db.commit(); db.close(); print("Administrator created")

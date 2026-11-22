import os, sys, shutil
from pathlib import Path
import traceback

def run_test(test_name, func):
    print(f"--- Running {test_name} ---")
    try:
        func()
        print(f"{test_name}: PASS\n")
    except Exception as e:
        print(f"{test_name}: FAIL")
        traceback.print_exc()
        print("\n")

# Helper to set up env for a temporary SQLite DB
def init_env(db_path):
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ["ADMIN_EMAIL"] = "admin@test.local"
    os.environ["ADMIN_PASSWORD"] = "VeryStrongPassword123!"
    os.environ["ADMIN_NAME"] = "Test Admin"

# Clean any previous test DB
def remove_db(path):
    if Path(path).exists():
        Path(path).unlink()

# Test 1: first initialization creates exactly one admin
def test_first_init_creates_admin():
    db_file = "test_smartcare1.db"
    remove_db(db_file)
    init_env(db_file)
    from app.seed import seed_database
    seed_database()
    # Verify one admin exists
    from app.database import SessionLocal
    from app import models
    db = SessionLocal()
    users = db.query(models.User).all()
    assert len(users) == 1, f"Expected 1 user, got {len(users)}"
    admin = users[0]
    assert admin.email == os.getenv("ADMIN_EMAIL").strip().lower()
    assert admin.role == "ADMIN"
    db.close()
    remove_db(db_file)

# Test 2: second init does not duplicate admin and password unchanged
def test_second_init_no_duplicate():
    db_file = "test_smartcare2.db"
    remove_db(db_file)
    init_env(db_file)
    from app.seed import seed_database
    # First run
    seed_database()
    from app.database import SessionLocal
    from app import models, auth
    db = SessionLocal()
    admin = db.query(models.User).filter(models.User.email == os.getenv("ADMIN_EMAIL").strip().lower()).first()
    old_hash = admin.hashed_password
    db.close()
    # Second run
    seed_database()
    db = SessionLocal()
    admins = db.query(models.User).filter(models.User.email == os.getenv("ADMIN_EMAIL").strip().lower()).all()
    assert len(admins) == 1, "Duplicate admin created"
    assert admins[0].hashed_password == old_hash, "Admin password changed on second init"
    db.close()
    remove_db(db_file)

# Test 3: existing non‑ADMIN with same email raises clear error
def test_conflict_non_admin():
    db_file = "test_smartcare3.db"
    remove_db(db_file)
    init_env(db_file)
    from app.database import SessionLocal
    from app import models, auth
    # Create a non‑admin user with the admin email
    db = SessionLocal()
    non_admin = models.User(
        email=os.getenv("ADMIN_EMAIL").strip().lower(),
        hashed_password=auth.get_password_hash("SomeOtherPassword123!"),
        name="Conflict User",
        phone="",
        role="HOSPITAL",
        is_active=True,
    )
    db.add(non_admin)
    db.commit()
    db.close()
    from app.seed import seed_database
    try:
        seed_database()
        raise AssertionError("Expected RuntimeError due to role conflict, but seeding succeeded")
    except RuntimeError as e:
        assert "exists but has role 'HOSPITAL'" in str(e), "Error message does not mention role conflict"
    finally:
        remove_db(db_file)

# Test 4: missing environment variables cause clear error
def test_missing_env_vars():
    db_file = "test_smartcare4.db"
    remove_db(db_file)
    # Set only some vars
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file}"
    os.environ.pop("ADMIN_EMAIL", None)
    os.environ.pop("ADMIN_PASSWORD", None)
    os.environ.pop("ADMIN_NAME", None)
    from app.seed import seed_database
    try:
        seed_database()
        raise AssertionError("Expected RuntimeError due to missing env vars, but seeding succeeded")
    except RuntimeError as e:
        msg = str(e)
        assert "Missing required environment variables" in msg, "Error does not mention missing env vars"
    finally:
        remove_db(db_file)

# Test 5: ensure no demo data inserted
def test_no_demo_data():
    db_file = "test_smartcare5.db"
    remove_db(db_file)
    init_env(db_file)
    from app.seed import seed_database
    seed_database()
    from app.database import SessionLocal
    from app import models
    db = SessionLocal()
    # Check a few demo tables that used to be seeded
    assert db.query(models.BloodBank).count() == 0, "Demo BloodBank found"
    assert db.query(models.Hospital).count() == 0, "Demo Hospital found"
    assert db.query(models.HospitalReferral).count() == 0, "Demo Referral found"
    db.close()
    remove_db(db_file)

if __name__ == "__main__":
    run_test("First init creates admin", test_first_init_creates_admin)
    run_test("Second init no duplicate & password unchanged", test_second_init_no_duplicate)
    run_test("Conflict with non‑ADMIN role", test_conflict_non_admin)
    run_test("Missing env vars error", test_missing_env_vars)
    run_test("No demo data inserted", test_no_demo_data)

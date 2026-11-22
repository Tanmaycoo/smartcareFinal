import os
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app import models, auth


def _get_admin_credentials():
    """Read admin credentials from environment variables.
    Returns a tuple (email, password, name).
    Raises RuntimeError with a clear message if any variable is missing.
    """
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    name = os.getenv("ADMIN_NAME")
    missing = [var for var, val in [("ADMIN_EMAIL", email), ("ADMIN_PASSWORD", password), ("ADMIN_NAME", name)] if not val]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables for SuperAdmin creation: {', '.join(missing)}. "
            "Please set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in the Render environment (or locally)."
        )
    return email, password, name


def seed_database():
    """Create database tables (if they do not exist) and ensure a SuperAdmin account.
    This function is safe for production – it never inserts demo data and is idempotent.
    """
    # 1️⃣ Validate admin credentials BEFORE any DB work
    admin_email_raw, admin_password, admin_name = _get_admin_credentials()
    # Normalise email (strip whitespace and lower‑case)
    admin_email = admin_email_raw.strip().lower()
    # Validate password strength (minimum 16 characters)
    if len(admin_password) < 16:
        raise RuntimeError("ADMIN_PASSWORD must be at least 16 characters long for security.")

    # 2️⃣ Initialise tables – SQLAlchemy will skip existing tables
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # ----- SuperAdmin creation -----
        # admin_email, admin_password, admin_name already obtained & validated
        existing_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not existing_user:
            # No user with this email – create a new ADMIN account
            new_admin = models.User(
                email=admin_email,
                hashed_password=auth.get_password_hash(admin_password),
                name=admin_name,
                phone="",
                role="ADMIN",
                is_active=True,
            )
            db.add(new_admin)
            db.commit()
            print("SuperAdmin account created successfully.")
        else:
            # User exists – verify role
            if existing_user.role != "ADMIN":
                raise RuntimeError(
                    f"User with email {admin_email} exists but has role '{existing_user.role}'. "
                    "Expected role 'ADMIN'. Resolve this conflict before seeding."
                )
            # Existing ADMIN – do not modify password or other fields
            print("SuperAdmin account already exists with ADMIN role – no changes made.")
        # No other seed data is inserted for production environments.
        db.commit()
    except Exception as e:
        db.rollback()
        # Re‑raise with a clear message; do not swallow the exception.
        raise RuntimeError(f"Error during database seeding: {e}") from e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

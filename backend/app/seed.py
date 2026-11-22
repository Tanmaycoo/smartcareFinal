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
    # Ensure all tables are created – SQLAlchemy will skip existing tables.
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # ----- SuperAdmin creation -----
        admin_email, admin_password, admin_name = _get_admin_credentials()
        existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not existing_admin:
            # Create a new admin user; password is hashed using the existing utility.
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
            print("SuperAdmin account already exists – no changes made.")
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

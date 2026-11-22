import os
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app import models, auth

def seed_database():
    """
    Initializes database schema and ensures the master SuperAdmin user exists.
    No mock or dummy hospitals, tickets, or transfers are seeded.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin_user = db.query(models.User).filter(models.User.email == "admin@smartcare.org").first()
        if not admin_user:
            print("Creating clean master SuperAdmin account...")
            admin_user = models.User(
                email="admin@smartcare.org",
                hashed_password=auth.get_password_hash("adminpassword123"),
                name="System Administrator",
                phone="+91-800-999-0001",
                role="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Master SuperAdmin account created successfully (admin@smartcare.org).")
        else:
            print("Master SuperAdmin account is ready.")

        # Seed sample accredited Blood Bank if not exists
        bb_user = db.query(models.User).filter(models.User.email == "bloodbank@smartcare.org").first()
        if not bb_user:
            print("Creating default Blood Bank center & account...")
            blood_bank = models.BloodBank(
                name="Solapur District Red Cross Blood Center",
                license_number="BB-MH-2026-90412",
                type="Red Cross / Government",
                address="Near Civil Hospital, Station Road, Solapur",
                city="Pune",
                state="Maharashtra",
                pincode="413001",
                latitude=18.5204,
                longitude=73.8567,
                phone="+91-217-274-1100",
                emergency_phone="+91-9881122334",
                email="bloodbank@smartcare.org",
                is_active=True,
                verification_status="APPROVED",
                total_units=48
            )
            db.add(blood_bank)
            db.flush()

            bb_user = models.User(
                email="bloodbank@smartcare.org",
                hashed_password=auth.get_password_hash("bloodbank123"),
                name="Admin - Red Cross Blood Center",
                phone="+91-9881122334",
                role="BLOOD_BANK",
                is_active=True,
                blood_bank_id=blood_bank.id
            )
            db.add(bb_user)

            # Seed standard blood stock
            sample_stock = [
                ("A+", "Whole Blood", 12, 1),
                ("A-", "Whole Blood", 4, 0),
                ("B+", "Whole Blood", 14, 2),
                ("B-", "Whole Blood", 3, 0),
                ("O+", "Whole Blood", 18, 3),
                ("O-", "Whole Blood", 5, 1),
                ("AB+", "Whole Blood", 8, 1),
                ("AB-", "Whole Blood", 2, 0),
            ]
            for group, comp, avail, res in sample_stock:
                db.add(models.BloodInventory(
                    blood_bank_id=blood_bank.id,
                    blood_group=group,
                    component_type=comp,
                    available_units=avail,
                    reserved_units=res
                ))

            # Seed sample voluntary donors near the area
            sample_donors = [
                models.BloodDonor(
                    name="Rahul Deshmukh",
                    phone="+91-9823011223",
                    email="rahul.deshmukh@gmail.com",
                    blood_group="O+",
                    age=28,
                    gender="Male",
                    city="Pune",
                    state="Maharashtra",
                    address="Shivaji Nagar, Pune",
                    latitude=18.5310,
                    longitude=73.8450,
                    is_available=True,
                    last_donation_date="2026-08-15",
                    notes="Universal red-cell compatible. Active emergency donor."
                ),
                models.BloodDonor(
                    name="Snehal Kulkarni",
                    phone="+91-9765432109",
                    email="snehal.k@gmail.com",
                    blood_group="B+",
                    age=24,
                    gender="Female",
                    city="Pune",
                    state="Maharashtra",
                    address="Kothrud, Pune",
                    latitude=18.5074,
                    longitude=73.8077,
                    is_available=True,
                    last_donation_date="2026-07-20",
                    notes="Available on 20-minute notice for trauma emergencies."
                ),
                models.BloodDonor(
                    name="Amit Patil",
                    phone="+91-9422019988",
                    email="amit.patil@gmail.com",
                    blood_group="O-",
                    age=32,
                    gender="Male",
                    city="Pune",
                    state="Maharashtra",
                    address="Camp Area, Pune",
                    latitude=18.5140,
                    longitude=73.8780,
                    is_available=True,
                    last_donation_date="2026-09-01",
                    notes="Universal O- Negative donor. Verified platelet donor."
                ),
                models.BloodDonor(
                    name="Pooja Sharma",
                    phone="+91-9890123456",
                    email="pooja.s@gmail.com",
                    blood_group="AB+",
                    age=26,
                    gender="Female",
                    city="Pune",
                    state="Maharashtra",
                    address="Hadapsar, Pune",
                    latitude=18.5020,
                    longitude=73.9260,
                    is_available=True,
                    last_donation_date="2026-06-10",
                    notes="Universal plasma donor."
                )
            ]
            for donor in sample_donors:
                db.add(donor)

            db.commit()
            print("Blood Bank center & sample donors seeded successfully.")

        # Seed sample referral partner hospital for resource booking
        apex_hosp = db.query(models.Hospital).filter(models.Hospital.license_number == "HOSP-MH-2026-APEX").first()
        if not apex_hosp:
            print("Seeding Apex Advanced Diagnostic & Specialty Center for referral network...")
            apex_hosp = models.Hospital(
                name="Apex Advanced Diagnostic & Specialty Center",
                license_number="HOSP-MH-2026-APEX",
                type="Tertiary & Diagnostic",
                address="Plot 42, Senapati Bapat Road, Shivajinagar",
                city="Pune",
                state="Maharashtra",
                pincode="411016",
                latitude=18.5314,
                longitude=73.8340,
                emergency_phone="+91-20-2565-1122",
                reception_phone="+91-20-2565-1100",
                email="apex@smartcare.org",
                website="https://apexhealth.smartcare.org",
                verification_status="APPROVED",
                total_capacity=80,
                ambulance_count=4,
                available_ambulances=2,
                is_active=True
            )
            db.add(apex_hosp)
            db.flush()

            # Staff account for apex hospital
            apex_user = models.User(
                email="apex@smartcare.org",
                hashed_password=auth.get_password_hash("hospital123"),
                name="Dr. Arvind Deshmukh (Medical Director)",
                phone="+91-9822019944",
                role="HOSPITAL",
                hospital_id=apex_hosp.id,
                is_active=True
            )
            db.add(apex_user)

            # Add beds
            beds = [
                models.BedCategory(hospital_id=apex_hosp.id, category="ICU (Critical Care)", total_beds=12, available_beds=4, occupied_beds=8, price_per_day=7500.0),
                models.BedCategory(hospital_id=apex_hosp.id, category="HDU (High Dependency)", total_beds=10, available_beds=3, occupied_beds=7, price_per_day=4500.0),
                models.BedCategory(hospital_id=apex_hosp.id, category="General Ward", total_beds=25, available_beds=8, occupied_beds=17, price_per_day=1800.0),
            ]
            for b in beds:
                db.add(b)

            # Add Diagnostic & Laboratory Services with published prices
            svc_mri = models.HospitalService(
                hospital_id=apex_hosp.id,
                service_code="DIAG-MRI-01",
                name="MRI 3T Brain & Spine Scan",
                category="Diagnostic Services",
                description="High resolution 3-Tesla digital MRI with neuro-navigation sequencing.",
                billing_unit="per scan",
                is_active=True
            )
            svc_ct = models.HospitalService(
                hospital_id=apex_hosp.id,
                service_code="DIAG-CT-02",
                name="CT Scan Multi-Slice Whole Abdomen",
                category="Diagnostic Services",
                description="128-slice contrast enhanced computed tomography scan.",
                billing_unit="per scan",
                is_active=True
            )
            svc_usg = models.HospitalService(
                hospital_id=apex_hosp.id,
                service_code="DIAG-USG-03",
                name="High-Resolution Ultrasound Doppler",
                category="Diagnostic Services",
                description="Color Doppler scan for vascular and arterial evaluation.",
                billing_unit="per scan",
                is_active=True
            )
            svc_lab = models.HospitalService(
                hospital_id=apex_hosp.id,
                service_code="LAB-CMP-04",
                name="Comprehensive Metabolic Panel & CBC",
                category="Laboratory Services",
                description="Complete blood count, LFT, KFT, and electrolyte evaluation.",
                billing_unit="per test",
                is_active=True
            )
            db.add_all([svc_mri, svc_ct, svc_usg, svc_lab])
            db.flush()

            # Publish prices
            for svc, amt in [(svc_mri, 6500.0), (svc_ct, 4200.0), (svc_usg, 2200.0), (svc_lab, 1200.0)]:
                price_rec = models.HospitalPrice(
                    hospital_id=apex_hosp.id,
                    service_id=svc.id,
                    price=amt,
                    status="PUBLISHED"
                )
                db.add(price_rec)

            db.commit()
            print("Apex Advanced Diagnostic & Specialty Center seeded successfully.")

        # Seed sample referral if table empty
        if db.query(models.HospitalReferral).count() == 0:
            first_hosp = db.query(models.Hospital).first()
            if first_hosp and apex_hosp:
                ref1 = models.HospitalReferral(
                    referral_code="REF-2026-10492",
                    referring_hospital_id=first_hosp.id,
                    receiving_hospital_id=apex_hosp.id,
                    patient_name="Sunita V. Jadhav",
                    patient_phone="+91-9822334455",
                    patient_age=48,
                    patient_gender="Female",
                    patient_reference_id="MRN-40291",
                    request_type="DIAGNOSTIC",
                    service_category="Diagnostic Services",
                    service_name="MRI 3T Brain & Spine Scan",
                    clinical_urgency="URGENT",
                    preferred_date="2026-10-28",
                    preferred_time_slot="Morning (10:00 AM - 11:00 AM)",
                    quantity=1,
                    clinical_summary="Suspected disc herniation L4-L5 with severe radiating radiculopathy. Refractory to conservative analgesia.",
                    special_instructions="Claustrophobia screening required; patient instructed to fast 4 hours prior.",
                    required_by_time="Within 24 Hours",
                    status="AWAITING_ACCEPTANCE",
                    quoted_price=6500.0,
                    billing_unit="per scan",
                    referring_doctor_name="Dr. Rohan Mehta",
                    referring_contact_phone=first_hosp.emergency_phone
                )
                db.add(ref1)
                db.flush()

                db.add(models.ReferralTimelineEvent(
                    referral_id=ref1.id,
                    action="REFERRAL_CREATED",
                    from_status=None,
                    to_status="AWAITING_ACCEPTANCE",
                    performed_by=f"Dr. Rohan Mehta ({first_hosp.name})",
                    actor_role="REFERRING_HOSPITAL",
                    notes="Urgent MRI referral initiated. Awaiting confirmation from Apex Diagnostic Center."
                ))

                ref2 = models.HospitalReferral(
                    referral_code="REF-2026-09821",
                    referring_hospital_id=first_hosp.id,
                    receiving_hospital_id=apex_hosp.id,
                    patient_name="Ramesh K. Rao",
                    patient_phone="+91-9422556677",
                    patient_age=55,
                    patient_gender="Male",
                    patient_reference_id="MRN-39182",
                    request_type="DIAGNOSTIC",
                    service_category="Diagnostic Services",
                    service_name="CT Scan Multi-Slice Whole Abdomen",
                    clinical_urgency="ROUTINE",
                    preferred_date="2026-10-28",
                    preferred_time_slot="11:30 AM - 12:30 PM",
                    quantity=1,
                    clinical_summary="Follow-up imaging post appendicular phlegmon resolution.",
                    status="CONFIRMED",
                    booking_reference="BKG-2026-44012",
                    confirmed_date="2026-10-28",
                    confirmed_time_slot="11:30 AM - 12:30 PM",
                    preparation_instructions="Oral contrast protocol: arrive 45 minutes prior for hydration and prep.",
                    quoted_price=4200.0,
                    billing_unit="per scan",
                    referring_doctor_name="Dr. Rohan Mehta",
                    receiving_contact_name="Dr. Arvind Deshmukh",
                    receiving_contact_phone=apex_hosp.reception_phone
                )
                db.add(ref2)
                db.flush()

                db.add(models.ReferralTimelineEvent(
                    referral_id=ref2.id,
                    action="REFERRAL_CONFIRMED",
                    from_status="AWAITING_ACCEPTANCE",
                    to_status="CONFIRMED",
                    performed_by="Dr. Arvind Deshmukh (Apex Diagnostic)",
                    actor_role="RECEIVING_HOSPITAL",
                    notes="Appointment confirmed for 2026-10-28 at 11:30 AM. Booking Ref: BKG-2026-44012."
                ))

                db.commit()
                print("Sample referrals seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during initialization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

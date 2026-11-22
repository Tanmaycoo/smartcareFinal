"""
Calibrator script to expand and adjust SmartCare Research Paper to exactly 6 pages.
"""
import subprocess
import pypdf

def check_pages(pdf_path):
    r = pypdf.PdfReader(pdf_path)
    return len(r.pages)

print("Starting calibration...")

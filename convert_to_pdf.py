import os
import re
import docx
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, PageBreak, Spacer, Table, TableStyle, Image, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

class AcademicNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            # Do not draw page number on Cover / Title page (Page 1)
            if self._pageNumber > 1:
                self.saveState()
                self.setFont("Times-Roman", 12)
                # Right aligned at right margin: A4 width (595.27 pt) - 1.0 inch (72 pt) = 523.27 pt
                # Bottom margin is 1.32 inches (95.04 pt); footer number positioned at 54 pt
                self.drawRightString(523.27, 54, str(self._pageNumber))
                self.restoreState()
            super().showPage()
        super().save()

def clean_text(t):
    """Normalize typography quotes and dashes for clean standard PDF rendering."""
    t = t.replace('“', '"').replace('”', '"')
    t = t.replace('‘', "'").replace('’', "'")
    t = t.replace('–', '-').replace('—', ' - ')
    t = t.replace('•', '&bull;')
    return t

def generate_pdf():
    docx_path = "d:/SmartCare/SmartCare_Project_Report.docx"
    pdf_path = "d:/SmartCare/SmartCare_Project_Report.pdf"
    logo_path = "d:/SmartCare/college_logo.png"

    if not os.path.exists(docx_path):
        print(f"Error: {docx_path} does not exist!")
        return

    # Document margins: A4 (8.27 x 11.69 inches)
    # Left = 1.5 in (108 pt), Right = 1.0 in (72 pt), Top = 1.0 in (72 pt), Bottom = 1.32 in (95.04 pt)
    printable_width = A4[0] - (1.5 + 1.0) * inch  # 415.27 pt

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=1.5 * inch,
        rightMargin=1.0 * inch,
        topMargin=1.0 * inch,
        bottomMargin=1.32 * inch
    )

    # Configure Styles
    styles = getSampleStyleSheet()

    # Base Styles (Times New Roman, 12 pt, 1.5 line spacing = 18 pt leading)
    body_justify = ParagraphStyle(
        'BodyJustify',
        fontName='Times-Roman',
        fontSize=12,
        leading=18,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )
    body_left = ParagraphStyle(
        'BodyLeft',
        fontName='Times-Roman',
        fontSize=12,
        leading=18,
        alignment=TA_LEFT,
        spaceAfter=6
    )
    body_center = ParagraphStyle(
        'BodyCenter',
        fontName='Times-Roman',
        fontSize=12,
        leading=18,
        alignment=TA_CENTER,
        spaceAfter=6
    )
    body_right = ParagraphStyle(
        'BodyRight',
        fontName='Times-Roman',
        fontSize=12,
        leading=18,
        alignment=TA_RIGHT,
        spaceAfter=6
    )

    # Heading Styles (Times-Bold, 14 pt, 18 pt leading)
    h1_style = ParagraphStyle(
        'ReportH1',
        fontName='Times-Bold',
        fontSize=14,
        leading=18,
        alignment=TA_LEFT,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    h1_center = ParagraphStyle(
        'ReportH1Center',
        fontName='Times-Bold',
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        spaceBefore=8,
        spaceAfter=12,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'ReportH2',
        fontName='Times-Bold',
        fontSize=13,
        leading=17,
        alignment=TA_LEFT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'ReportH3',
        fontName='Times-Bold',
        fontSize=12,
        leading=16,
        alignment=TA_LEFT,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    # Title Page Specific Styles
    title_main = ParagraphStyle(
        'TitleMain',
        fontName='Times-Bold',
        fontSize=14,
        leading=18,
        alignment=TA_CENTER,
        spaceBefore=4,
        spaceAfter=10
    )
    title_sub = ParagraphStyle(
        'TitleSub',
        fontName='Times-Bold',
        fontSize=12,
        leading=16,
        alignment=TA_CENTER,
        spaceBefore=2,
        spaceAfter=2
    )
    title_small = ParagraphStyle(
        'TitleSmall',
        fontName='Times-Bold',
        fontSize=10.5,
        leading=14,
        alignment=TA_CENTER,
        spaceBefore=2,
        spaceAfter=3
    )

    # Table Cell Styles
    cell_header = ParagraphStyle(
        'CellHeader',
        fontName='Times-Bold',
        fontSize=10,
        leading=13,
        alignment=TA_CENTER
    )
    cell_body = ParagraphStyle(
        'CellBody',
        fontName='Times-Roman',
        fontSize=9.5,
        leading=12.5,
        alignment=TA_LEFT
    )
    cell_body_center = ParagraphStyle(
        'CellBodyCenter',
        fontName='Times-Roman',
        fontSize=9.5,
        leading=12.5,
        alignment=TA_CENTER
    )
    cell_body_right = ParagraphStyle(
        'CellBodyRight',
        fontName='Times-Roman',
        fontSize=9.5,
        leading=12.5,
        alignment=TA_RIGHT
    )

    story = []

    # Read the docx document
    doc_in = docx.Document(docx_path)

    body_elements = []
    for child in doc_in.element.body:
        if isinstance(child, CT_P):
            p = docx.text.paragraph.Paragraph(child, doc_in)
            body_elements.append(('p', p))
        elif isinstance(child, CT_Tbl):
            t = docx.table.Table(child, doc_in)
            body_elements.append(('t', t))

    page_num = 1
    in_title_page = True
    title_logo_inserted = False
    cert_logo_inserted = False

    for elem_type, elem in body_elements:
        if elem_type == 'p':
            p = elem
            text = clean_text(p.text.strip())

            # Check for page break in runs
            has_page_break = False
            for r in p.runs:
                if 'lastRenderedPageBreak' in r._r.xml or 'w:br w:type="page"' in r._r.xml:
                    has_page_break = True

            if has_page_break:
                story.append(PageBreak())
                page_num += 1
                if page_num > 1:
                    in_title_page = False
                continue

            if not text:
                continue

            # Determine paragraph style and alignment
            align = p.alignment

            # Escape XML special characters
            escaped_text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            escaped_text = escaped_text.replace('&amp;bull;', '&bull;')  # restore bullet
            escaped_text = escaped_text.replace('\n', '<br/>')

            # Cover / Title Page Layout
            if in_title_page:
                if "PROJECT REPORT" in text or "SMARTCARE" in text:
                    story.append(Paragraph(escaped_text, title_main))
                elif "DEPARTMENT OF" in text or "MIT COLLEGE" in text or "BACHELOR OF" in text or "COMPUTER SCIENCE" in text:
                    story.append(Paragraph(escaped_text, title_sub))
                elif "SUBMITTED" in text or "UNDER THE" in text or "ACADEMIC YEAR" in text or "AFFILIATED TO" in text or "PUNYASHLOK" in text:
                    story.append(Paragraph(escaped_text, title_small))
                elif "Tanmay" in text or "[Project Guide" in text:
                    story.append(Paragraph(escaped_text, title_small))
                    if not title_logo_inserted and os.path.exists(logo_path) and "[Project Guide" in text:
                        story.append(Spacer(1, 4))
                        story.append(Image(logo_path, width=1.35 * inch, height=1.35 * inch))
                        story.append(Spacer(1, 4))
                        title_logo_inserted = True
                else:
                    story.append(Paragraph(escaped_text, title_small))
                continue

            # Certificate Page Logo
            if "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING" in text and not cert_logo_inserted and page_num == 2:
                if os.path.exists(logo_path):
                    story.append(Image(logo_path, width=1.15 * inch, height=1.15 * inch))
                    story.append(Spacer(1, 4))
                cert_logo_inserted = True

            # Front Matter Headings
            if text in ["CERTIFICATE", "DECLARATION", "ACKNOWLEDGEMENT", "ABSTRACT", "TABLE OF CONTENTS", "LIST OF FIGURES", "LIST OF TABLES", "REFERENCES", "APPENDICES"]:
                story.append(Paragraph(escaped_text, h1_center))
                story.append(Spacer(1, 6))
                continue

            # Chapter Titles (Heading 1)
            if text.startswith("CHAPTER ") or text.startswith("Appendix "):
                story.append(Paragraph(escaped_text, h1_style))
                story.append(Spacer(1, 4))
                continue

            # Section Headings (Heading 2: e.g. 1.1, 1.2, 5.3)
            if re.match(r'^\d+\.\d+\s+', text):
                story.append(Paragraph(escaped_text, h2_style))
                story.append(Spacer(1, 2))
                continue

            # Sub-section Headings (Heading 3: e.g. 5.3.1)
            if re.match(r'^\d+\.\d+\.\d+\s+', text):
                story.append(Paragraph(escaped_text, h3_style))
                story.append(Spacer(1, 2))
                continue

            # Signatures block or place/date
            if "Place: Barshi" in text or "Date:" in text:
                story.append(Paragraph(escaped_text, body_left))
                continue
            if "Yours faithfully" in text or "Project Guide" in text or ("Tanmay Kulkarni" in text and "Dept." in text):
                story.append(Paragraph(escaped_text, body_right))
                continue

            # Bullet points or normal text
            if text.startswith("&bull;") or text.startswith("- "):
                clean_bullet = text.lstrip("&bull;- ")
                if ":" in clean_bullet and clean_bullet.index(":") < 45:
                    parts = clean_bullet.split(":", 1)
                    bullet_formatted = f"&bull; <b>{parts[0]}:</b>{parts[1]}"
                else:
                    bullet_formatted = f"&bull; {clean_bullet}"
                story.append(Paragraph(bullet_formatted, body_justify))
                continue

            # Standard Paragraph
            if align == docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER:
                story.append(Paragraph(escaped_text, body_center))
            elif align == docx.enum.text.WD_ALIGN_PARAGRAPH.RIGHT:
                story.append(Paragraph(escaped_text, body_right))
            else:
                story.append(Paragraph(escaped_text, body_justify))

        elif elem_type == 't':
            table = elem
            num_rows = len(table.rows)
            num_cols = len(table.columns)
            if num_rows == 0 or num_cols == 0:
                continue

            col_widths = [printable_width / num_cols] * num_cols

            if num_cols == 2:
                col_widths = [printable_width * 0.82, printable_width * 0.18]
            elif num_cols == 4:
                col_widths = [printable_width * 0.22, printable_width * 0.26, printable_width * 0.26, printable_width * 0.26]
            elif num_cols == 5:
                col_widths = [printable_width * 0.22, printable_width * 0.18, printable_width * 0.15, printable_width * 0.22, printable_width * 0.23]
            elif num_cols == 6:
                col_widths = [printable_width * 0.18, printable_width * 0.18, printable_width * 0.16, printable_width * 0.16, printable_width * 0.16, printable_width * 0.16]
            elif num_cols == 7:
                col_widths = [printable_width * 0.22] + [printable_width * 0.13] * 6

            table_data = []
            for row_idx, row in enumerate(table.rows):
                row_data = []
                for col_idx, cell in enumerate(row.cells):
                    cell_text = clean_text(cell.text.strip())
                    cell_text = cell_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    cell_text = cell_text.replace('\n', '<br/>')

                    if row_idx == 0 and num_rows > 2:
                        p_cell = Paragraph(f"<b>{cell_text}</b>", cell_header)
                    elif col_idx == 1 and num_cols == 2 and ("PAGE" in table.rows[0].cells[1].text or table.rows[row_idx].cells[1].text.strip().isdigit()):
                        p_cell = Paragraph(cell_text, cell_body_right)
                    else:
                        p_cell = Paragraph(cell_text, cell_body)
                    row_data.append(p_cell)
                table_data.append(row_data)

            t_flow = Table(table_data, colWidths=col_widths, repeatRows=(1 if num_rows > 3 else 0))

            t_style = [
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
                ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
            ]

            if num_rows == 2 and num_cols == 2 and "Guide" in table.rows[0].cells[0].text:
                t_style.append(('BOX', (0, 0), (-1, -1), 0, colors.transparent))
                t_style.append(('INNERGRID', (0, 0), (-1, -1), 0, colors.transparent))
            else:
                t_style.append(('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EAEAEA")))
                t_style.append(('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#333333")))
                t_style.append(('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")))

            t_flow.setStyle(TableStyle(t_style))
            story.append(Spacer(1, 4))
            story.append(t_flow)
            story.append(Spacer(1, 6))

    print("Compiling final publication-grade PDF document...")
    doc.build(story, canvasmaker=AcademicNumberedCanvas)
    print(f"PDF successfully created at: {pdf_path}")

if __name__ == "__main__":
    generate_pdf()

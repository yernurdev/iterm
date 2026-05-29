from datetime import datetime
from io import BytesIO
from typing import Optional
from zipfile import ZipFile
import html
import re
import xml.etree.ElementTree as ET

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile

from api.auth import get_current_user
from database.mongo import get_database
from models.schemas import CheckRequest, CheckResponse, HistoryInDB, UserInDB
from services.nlp_checker import NLPChecker

router = APIRouter()


@router.post("/text", response_model=CheckResponse)
async def check_text(request: CheckRequest, db=Depends(get_database)):
    result = await run_check(db, request.text, request.language)
    if request.save_history:
        await save_history(db, None, request.text, request.language, "text", result["stats"])
    return result


@router.post("/file", response_model=CheckResponse)
async def check_file(file: UploadFile = File(...), language: str = Form("kz"), db=Depends(get_database)):
    text = await extract_text(file)
    return await run_check(db, text, language)


@router.get("/history", response_model=list[HistoryInDB])
async def history(current_user: UserInDB = Depends(get_current_user), db=Depends(get_database)):
    cursor = db.check_history.find({"user_email": current_user.email}).sort("created_at", -1).limit(50)
    return await cursor.to_list(length=50)


@router.post("/report/{report_format}")
async def make_report(report_format: str, request: CheckRequest, db=Depends(get_database)):
    result = await run_check(db, request.text, request.language)
    if report_format == "docx":
        content = build_docx_report(request.text, result)
        return Response(
            content,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="iterm-report.docx"'},
        )
    if report_format == "pdf":
        content = build_pdf_report(request.text, result)
        return Response(
            content,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="iterm-report.pdf"'},
        )
    raise HTTPException(status_code=400, detail="Формат отчета должен быть pdf или docx")


async def run_check(db, text: str, language: str):
    cursor = db.terms.find({})
    db_terms = await cursor.to_list(length=None)
    checker = NLPChecker(db_terms)
    return checker.check_text(text, language)


async def save_history(db, user: Optional[UserInDB], text: str, language: str, source: str, stats: dict):
    if not user:
        return
    await db.check_history.insert_one(
        {
            "user_email": user.email,
            "language": language,
            "source": source,
            "created_at": datetime.utcnow(),
            "stats": stats,
            "preview": text[:240],
        }
    )


async def extract_text(file: UploadFile) -> str:
    content = await file.read()
    name = (file.filename or "").lower()

    if name.endswith(".txt") or file.content_type == "text/plain":
        return content.decode("utf-8-sig")

    if name.endswith(".docx"):
        return extract_docx_text(content)

    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise HTTPException(status_code=400, detail="Для PDF установите pypdf") from exc
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    raise HTTPException(status_code=400, detail="Поддерживаются TXT, DOCX и PDF")


def extract_docx_text(content: bytes) -> str:
    try:
        with ZipFile(BytesIO(content)) as docx:
            xml = docx.read("word/document.xml")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Не удалось прочитать DOCX") from exc

    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    root = ET.fromstring(xml)
    paragraphs = []
    for paragraph in root.findall(".//w:p", namespace):
        texts = [node.text or "" for node in paragraph.findall(".//w:t", namespace)]
        if texts:
            paragraphs.append("".join(texts))
    return "\n".join(paragraphs)


def build_docx_report(source_text: str, result: dict) -> bytes:
    body = [
        "Iterm - отчет проверки",
        f"Слов: {result['stats'].get('words', 0)}",
        f"Ошибок: {result['stats'].get('errors', 0)}",
        f"Предупреждений: {result['stats'].get('warnings', 0)}",
        f"Уровень унификации: {result['stats'].get('quality', 0)}%",
        "",
        "Рекомендации:",
    ]
    for item in result.get("recommendations", []):
        body.append(f"- {item['fragment']}: {item.get('suggestion') or '-'} ({item.get('reason')})")
    body.extend(["", "Исходный текст:", source_text])

    paragraphs = "".join(
        f"<w:p><w:r><w:t>{html.escape(line)}</w:t></w:r></w:p>" for line in body
    )
    document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>{paragraphs}<w:sectPr /></w:body>
</w:document>"""

    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", DOCX_CONTENT_TYPES)
        archive.writestr("_rels/.rels", DOCX_RELS)
        archive.writestr("word/document.xml", document)
        archive.writestr("word/_rels/document.xml.rels", DOCX_DOCUMENT_RELS)
    return buffer.getvalue()


def build_pdf_report(source_text: str, result: dict) -> bytes:
    lines = [
        "Iterm report",
        f"Words: {result['stats'].get('words', 0)}",
        f"Errors: {result['stats'].get('errors', 0)}",
        f"Warnings: {result['stats'].get('warnings', 0)}",
        f"Unification: {result['stats'].get('quality', 0)}%",
        "",
        "Recommendations:",
    ]
    for item in result.get("recommendations", [])[:20]:
        safe = re.sub(r"[^\x20-\x7E]+", "?", f"- {item['fragment']} -> {item.get('suggestion') or '-'}")
        lines.append(safe)

    text_stream = "BT /F1 12 Tf 50 780 Td " + " T* ".join(
        f"({line.replace('(', '[').replace(')', ']')})" for line in lines
    ) + " ET"
    stream_bytes = text_stream.encode("latin-1", "replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1") + stream_bytes + b"\nendstream",
    ]
    pdf = BytesIO()
    pdf.write(b"%PDF-1.4\n")
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(pdf.tell())
        pdf.write(f"{index} 0 obj\n".encode("latin-1"))
        pdf.write(obj)
        pdf.write(b"\nendobj\n")
    xref = pdf.tell()
    pdf.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin-1"))
    for offset in offsets:
        pdf.write(f"{offset:010d} 00000 n \n".encode("latin-1"))
    pdf.write(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode("latin-1"))
    return pdf.getvalue()


DOCX_CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

DOCX_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

DOCX_DOCUMENT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>"""

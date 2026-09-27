import os
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from zipfile import BadZipFile, ZipFile
from xml.etree import ElementTree
from typing import List, Dict


def extract_text_from_docx(file_path: str) -> List[Dict]:
    """Extract paragraph text from a DOCX without an extra runtime dependency."""
    try:
        with ZipFile(file_path) as document:
            xml = document.read("word/document.xml")
        root = ElementTree.fromstring(xml)
    except (BadZipFile, KeyError, ElementTree.ParseError) as exc:
        raise ValueError("The uploaded DOCX file is invalid or unreadable.") from exc

    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []
    for paragraph in root.findall(".//w:p", namespace):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", namespace)).strip()
        if text:
            paragraphs.append(text)
    content = "\n".join(paragraphs)
    return [{"page_number": 1, "text": content}] if content else []

def extract_text_from_pdf(file_path: str) -> List[Dict]:
    """
    Extract text page by page from a PDF using pdfplumber.
    Falls back to Tesseract OCR if the PDF contains no extractable text (e.g. scanned images).
    Returns a list of dicts: {"page_number": int, "text": str}
    """
    pages = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text and text.strip():
                    pages.append({"page_number": i + 1, "text": text.strip()})
    except Exception as e:
        print(f"pdfplumber failed for {file_path}: {e}")
                
    # Fallback: If no text was extracted, it's likely a scanned/image-based PDF
    if len(pages) == 0:
        print(f"No text found in {file_path}, falling back to OCR...")
        try:
            images = convert_from_path(file_path)
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                if text and text.strip():
                    pages.append({"page_number": i + 1, "text": text.strip()})
        except Exception as e:
            print(f"OCR failed for {file_path}: {e}")
                
    return pages

def chunk_text(pages: List[Dict], chunk_size: int = 1000, overlap: int = 200) -> List[Dict]:
    """
    Split page text into chunks of specified character size with overlap.
    Returns a list of dicts: {"page_number": int, "chunk_index": int, "text": str}
    """
    # Ensure overlap is smaller than chunk_size to guarantee forward progress
    if overlap >= chunk_size:
        overlap = chunk_size // 2

    chunks = []
    chunk_index = 0
    
    for page in pages:
        text = page["text"]
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunk_text_str = text[start:end]
            
            # Try to avoid splitting words: pull back to last space
            if end < text_length and ' ' in chunk_text_str:
                last_space = chunk_text_str.rfind(' ')
                if last_space > 0:  # only if we found a space that isn't at position 0
                    end = start + last_space
                    chunk_text_str = text[start:end]
                
            stripped = chunk_text_str.strip()
            if stripped:
                chunks.append({
                    "page_number": page["page_number"],
                    "chunk_index": chunk_index,
                    "text": stripped
                })
                chunk_index += 1

            # The final chunk must be emitted once. Continuing to apply overlap
            # after reaching the end would repeatedly reprocess its tail.
            if end >= text_length:
                break
            
            next_start = end - overlap
            if next_start <= start:
                next_start = end
            start = next_start
                
    return chunks

def process_document_file(file_path: str) -> List[Dict]:
    """
    Main processing pipeline.
    """
    ext = file_path.split('.')[-1].lower()
    
    if ext == 'pdf':
        pages = extract_text_from_pdf(file_path)
    elif ext == 'docx':
        pages = extract_text_from_docx(file_path)
    elif ext == 'txt':
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1") as f:
                content = f.read().strip()
        pages = [{"page_number": 1, "text": content}] if content else []
    else:
        raise ValueError(f"Unsupported document type: .{ext or 'unknown'}")
            
    return chunk_text(pages)

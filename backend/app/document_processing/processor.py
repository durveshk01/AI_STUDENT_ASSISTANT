import os
import PyPDF2
from typing import List, Dict

def extract_text_from_pdf(file_path: str) -> List[Dict]:
    """
    Extract text page by page from a PDF.
    Returns a list of dicts: {"page_number": int, "text": str}
    """
    pages = []
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages.append({"page_number": i + 1, "text": text.strip()})
    return pages

def chunk_text(pages: List[Dict], chunk_size: int = 1000, overlap: int = 200) -> List[Dict]:
    """
    Split page text into chunks of specified token/character size with overlap.
    For simplicity, we split by character count here, but a real app might use TikToken.
    Returns a list of dicts: {"page_number": int, "chunk_index": int, "text": str}
    """
    chunks = []
    chunk_index = 0
    
    for page in pages:
        text = page["text"]
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk_text = text[start:end]
            
            # Simple heuristic to avoid splitting words: push back to last space
            if end < text_length and ' ' in chunk_text:
                last_space = chunk_text.rfind(' ')
                end = start + last_space
                chunk_text = text[start:end]
                
            chunks.append({
                "page_number": page["page_number"],
                "chunk_index": chunk_index,
                "text": chunk_text.strip()
            })
            
            chunk_index += 1
            start = end - overlap
            if start < 0:
                start = 0
                
    return chunks

def process_document_file(file_path: str) -> List[Dict]:
    """
    Main processing pipeline.
    """
    ext = file_path.split('.')[-1].lower()
    
    if ext == 'pdf':
        pages = extract_text_from_pdf(file_path)
    else:
        # Fallback for txt
        with open(file_path, "r", encoding="utf-8") as f:
            pages = [{"page_number": 1, "text": f.read().strip()}]
            
    return chunk_text(pages)

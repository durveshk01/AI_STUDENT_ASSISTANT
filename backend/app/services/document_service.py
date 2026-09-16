from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.document_processing.processor import process_document_file
from app.ai.factory import get_ai_provider

def process_document_background(db: Session, document_id: str):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        return

    try:
        document.status = "processing"
        db.commit()

        # Extract and chunk text
        chunks = process_document_file(document.file_path)
        document.page_count = max([c["page_number"] for c in chunks]) if chunks else 0
        
        # Get embeddings
        ai_provider = get_ai_provider()
        texts = [c["text"] for c in chunks]
        
        # Batch requests if texts is too large, assuming small lists for now
        batch_size = 100
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            embeddings = ai_provider.get_embeddings(batch_texts)
            all_embeddings.extend(embeddings)

        # Insert chunks into db
        db_chunks = []
        for idx, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document.id,
                user_id=document.user_id,
                subject_id=document.subject_id,
                page_number=chunk["page_number"],
                chunk_index=chunk["chunk_index"],
                text=chunk["text"],
                embedding=all_embeddings[idx]
            )
            db_chunks.append(db_chunk)
            
        db.add_all(db_chunks)
        document.status = "completed"
        db.commit()
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        document.status = "failed"
        db.commit()

from app.database.session import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.document_processing.processor import process_document_file
from app.ai.factory import get_ai_provider
from app.services.file_storage import local_document_path

def process_document_background(document_id: str):
    """
    Background task to process a document: extract text, chunk it, generate embeddings.
    Uses its own DB session since BackgroundTasks run outside the request lifecycle.
    """
    print(f"--- STARTING BACKGROUND TASK FOR DOCUMENT {document_id} ---", flush=True)
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return

        document.status = "processing"
        # A failed retry must not leave stale or duplicate chunks behind.
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete(
            synchronize_session=False
        )
        db.commit()

        # Extract and chunk text
        print(f"[{document_id}] Extracting text...", flush=True)
        with local_document_path(document.file_path) as local_path:
            chunks = process_document_file(local_path)
        print(f"[{document_id}] Got {len(chunks) if chunks else 0} chunks", flush=True)
        
        if not chunks:
            document.status = "failed"
            document.page_count = 0
            db.commit()
            print(f"Document {document_id}: No readable text found.")
            return
            
        document.page_count = max([c["page_number"] for c in chunks])
        
        # Get embeddings
        ai_provider = get_ai_provider()
        texts = [c["text"] for c in chunks]
        
        # Batch embedding requests
        batch_size = 100
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            embeddings = ai_provider.get_embeddings(batch_texts)
            all_embeddings.extend(embeddings)

        if len(all_embeddings) != len(chunks):
            raise ValueError(
                f"Embedding service returned {len(all_embeddings)} vectors for {len(chunks)} text chunks."
            )

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
        print(f"Document {document_id}: Successfully processed {len(db_chunks)} chunks.")
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        db.rollback() # Rollback the failed transaction first!
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.status = "failed"
                db.commit()
        except Exception as inner_e:
            print(f"Failed to set document status to failed: {inner_e}")
            db.rollback()
    finally:
        db.close()

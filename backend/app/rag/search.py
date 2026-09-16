from sqlalchemy.orm import Session
from typing import List
from app.models.document_chunk import DocumentChunk
from app.ai.factory import get_ai_provider

def semantic_search(db: Session, user_id: str, query: str, subject_id: str = None, document_id: str = None, top_k: int = 5) -> List[DocumentChunk]:
    ai_provider = get_ai_provider()
    
    # Get query embedding
    query_embedding = ai_provider.get_embeddings([query])[0]
    
    # Base query filtered by user
    db_query = db.query(DocumentChunk).filter(DocumentChunk.user_id == user_id)
    
    if subject_id:
        db_query = db_query.filter(DocumentChunk.subject_id == subject_id)
    if document_id:
        db_query = db_query.filter(DocumentChunk.document_id == document_id)
        
    # pgvector order by cosine distance
    results = db_query.order_by(DocumentChunk.embedding.cosine_distance(query_embedding)).limit(top_k).all()
    
    return results

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class Source(BaseModel):
    document_id: str
    document_name: str
    page_number: int | None

class MessageBase(BaseModel):
    role: str
    content: str
    sources: Optional[List[Source]] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ConversationBase(BaseModel):
    title: str
    subject_id: str | None = None

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime | None = None
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    conversation_id: str | None = None
    subject_id: str | None = None
    document_id: str | None = None
    query: str

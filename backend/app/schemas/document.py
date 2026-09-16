from pydantic import BaseModel
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int
    subject_id: str

class DocumentCreate(DocumentBase):
    file_path: str

class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    status: str
    page_count: int | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router

app = FastAPI(
    title="AI-Powered Study Assistant API",
    description="API for the AI-Powered Study Assistant",
    version="1.0.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

from app.api.subjects import router as subjects_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.quizzes import router as quizzes_router
from app.api.flashcards import router as flashcards_router
from app.api.analytics import router as analytics_router
from app.api.study_plan import router as study_plan_router
from app.api.viva import router as viva_router

app.include_router(subjects_router, prefix="/api/subjects", tags=["subjects"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(quizzes_router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(flashcards_router, prefix="/api/flashcards", tags=["flashcards"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(study_plan_router, prefix="/api/study-plan", tags=["study-plan"])
app.include_router(viva_router, prefix="/api/viva", tags=["viva"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-Powered Study Assistant API"}

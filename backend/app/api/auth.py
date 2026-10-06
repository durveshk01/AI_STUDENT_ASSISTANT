from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any
import secrets
from sqlalchemy.exc import IntegrityError

from app.database.session import get_db
from app.models.user import User
from app.models.subject import Subject
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

# This account is shared by every visitor who chooses the public demo login.
DEMO_USER_ID = "public-demo-user"
DEMO_USER_EMAIL = "demo@studyassistant.example"
DEMO_USER_NAME = "Study Assistant Demo"

# Demo subjects to seed for every new user
DEMO_SUBJECTS = [
    {"name": "Data Structures & Algorithms", "description": "Arrays, Linked Lists, Trees, Graphs, Sorting, Searching, Dynamic Programming, and Complexity Analysis."},
    {"name": "Operating Systems", "description": "Process management, CPU scheduling, memory management, file systems, deadlocks, and virtualization."},
    {"name": "Database Management Systems", "description": "SQL, normalization, ER diagrams, transactions, indexing, and query optimization."},
    {"name": "Computer Networks", "description": "OSI model, TCP/IP, HTTP, DNS, routing, switching, and network security."},
    {"name": "Object-Oriented Programming", "description": "Classes, inheritance, polymorphism, encapsulation, abstraction, and design patterns."},
]

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user and seed demo subjects.
    """
    if user_in.email.lower() == DEMO_USER_EMAIL:
        raise HTTPException(status_code=400, detail="This email is reserved for the public demo account.")

    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        name=user_in.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed demo subjects for the new user
    for subj in DEMO_SUBJECTS:
        db.add(Subject(
            name=subj["name"],
            description=subj["description"],
            user_id=user.id,
        ))
    db.commit()

    return user


@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)) -> Any:
    """Create the shared demo workspace on first use and issue a demo token."""
    user = db.query(User).filter(User.id == DEMO_USER_ID).first()

    if user is None:
        email_collision = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
        if email_collision:
            raise HTTPException(status_code=503, detail="The demo account is unavailable. Please try again later.")

        user = User(
            id=DEMO_USER_ID,
            email=DEMO_USER_EMAIL,
            name=DEMO_USER_NAME,
            hashed_password=get_password_hash(secrets.token_urlsafe(48)),
        )
        db.add(user)
        try:
            db.flush()
        except IntegrityError:
            # Another first-time demo request may have created the row concurrently.
            db.rollback()
            user = db.query(User).filter(User.id == DEMO_USER_ID).first()
            if user is None:
                raise HTTPException(status_code=503, detail="The demo account is unavailable. Please try again later.")

    if user.email != DEMO_USER_EMAIL:
        raise HTTPException(status_code=503, detail="The demo account is unavailable. Please try again later.")

    if not db.query(Subject).filter(Subject.user_id == user.id).first():
        for subj in DEMO_SUBJECTS:
            db.add(Subject(name=subj["name"], description=subj["description"], user_id=user.id))

    db.commit()
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if len(form_data.password.encode("utf-8")) > 72 or not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user.
    """
    return current_user

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api import chat, flashcards
from app.core.config import Settings
from app.schemas.flashcard import FlashcardGenerateRequest, GeneratedDeck
from app.schemas.chat import ChatRequest
from app.schemas.user import UserCreate


def test_settings_reject_a_short_jwt_secret():
    with pytest.raises(ValidationError):
        Settings(JWT_SECRET="short")


def test_settings_generate_a_private_secret_when_explicitly_blank():
    settings = Settings(JWT_SECRET="")

    assert len(settings.JWT_SECRET.encode("utf-8")) >= 32
    assert settings.JWT_SECRET != "supersecretkey_please_change_in_production"


@pytest.mark.parametrize("password", ["short", "€" * 25])
def test_registration_rejects_passwords_bcrypt_cannot_safely_hash(password):
    with pytest.raises(ValidationError):
        UserCreate(email="student@example.com", password=password)


def test_flashcard_generation_rejects_a_subject_owned_by_another_user():
    subject_query = MagicMock()
    subject_query.filter.return_value.first.return_value = None
    db = MagicMock()
    db.query.return_value = subject_query

    with pytest.raises(HTTPException) as error:
        flashcards.generate_flashcards(
            FlashcardGenerateRequest(subject_id="foreign-subject"),
            db=db,
            current_user=SimpleNamespace(id="user-1"),
        )

    assert error.value.status_code == 404


def test_chat_rejects_a_subject_owned_by_another_user():
    subject_query = MagicMock()
    subject_query.filter.return_value.first.return_value = None
    db = MagicMock()
    db.query.return_value = subject_query

    with pytest.raises(HTTPException) as error:
        chat.chat(
            ChatRequest(query="Explain this", subject_id="foreign-subject"),
            db=db,
            current_user=SimpleNamespace(id="user-1"),
        )

    assert error.value.status_code == 404


def test_flashcard_generation_rejects_an_empty_ai_response(monkeypatch):
    subject = SimpleNamespace(id="subject-1", name="Biology")
    subject_query = MagicMock()
    subject_query.filter.return_value.first.return_value = subject
    db = MagicMock()
    db.query.return_value = subject_query

    provider = MagicMock()
    provider.generate_structured.return_value = GeneratedDeck(cards=[])
    monkeypatch.setattr(
        flashcards,
        "semantic_search",
        lambda *args, **kwargs: [SimpleNamespace(text="Biology notes")],
    )
    monkeypatch.setattr(flashcards, "get_ai_provider", lambda: provider)

    with pytest.raises(HTTPException) as error:
        flashcards.generate_flashcards(
            FlashcardGenerateRequest(subject_id="subject-1"),
            db=db,
            current_user=SimpleNamespace(id="user-1"),
        )

    assert error.value.status_code == 502
    db.add.assert_not_called()

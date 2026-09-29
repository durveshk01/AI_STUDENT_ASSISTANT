from types import SimpleNamespace
from unittest.mock import MagicMock

from app.api import documents
from app.api import subjects
from app.models.chat import Conversation
from app.models.quiz import Quiz


def test_delete_document_detaches_quizzes_before_deleting_document(monkeypatch):
    document = SimpleNamespace(id="document-1", file_path="user/document.txt")
    current_user = SimpleNamespace(id="user-1")
    document_query = MagicMock()
    document_query.filter.return_value.first.return_value = document
    quiz_query = MagicMock()
    events = []

    db = MagicMock()
    db.query.side_effect = [document_query, quiz_query]
    db.delete.side_effect = lambda _: events.append("delete_document")
    db.commit.side_effect = lambda: events.append("commit")
    quiz_query.filter.return_value.update.side_effect = (
        lambda *_args, **_kwargs: events.append("detach_quizzes")
    )
    monkeypatch.setattr(
        documents,
        "delete_file",
        lambda path: events.append(f"delete_file:{path}"),
    )

    result = documents.delete_document(
        "document-1",
        db=db,
        current_user=current_user,
    )

    assert result == {"message": "Document deleted successfully"}
    quiz_query.filter.return_value.update.assert_called_once_with(
        {Quiz.document_id: None},
        synchronize_session=False,
    )
    db.delete.assert_called_once_with(document)
    assert events == [
        "delete_file:user/document.txt",
        "detach_quizzes",
        "delete_document",
        "commit",
    ]


def test_delete_subject_cleans_dependent_rows_and_cloud_files(monkeypatch):
    subject = SimpleNamespace(id="subject-1")
    document = SimpleNamespace(id="document-1", file_path="user/document.txt")
    current_user = SimpleNamespace(id="user-1")
    subject_query = MagicMock()
    subject_query.filter.return_value.first.return_value = subject
    document_query = MagicMock()
    document_query.filter.return_value.all.return_value = [document]
    document_quiz_query = MagicMock()
    subject_quiz_query = MagicMock()
    flashcard_query = MagicMock()
    conversation_query = MagicMock()
    events = []

    db = MagicMock()
    db.query.side_effect = [
        subject_query,
        document_query,
        document_quiz_query,
        subject_quiz_query,
        flashcard_query,
        conversation_query,
    ]
    db.delete.side_effect = lambda row: events.append(f"delete:{row.id}")
    db.commit.side_effect = lambda: events.append("commit")
    document_quiz_query.filter.return_value.update.side_effect = (
        lambda *_args, **_kwargs: events.append("detach_document_quizzes")
    )
    subject_quiz_query.filter.return_value.delete.side_effect = (
        lambda **_kwargs: events.append("delete_subject_quizzes")
    )
    flashcard_query.filter.return_value.delete.side_effect = (
        lambda **_kwargs: events.append("delete_flashcard_decks")
    )
    conversation_query.filter.return_value.update.side_effect = (
        lambda *_args, **_kwargs: events.append("detach_conversations")
    )
    monkeypatch.setattr(
        subjects,
        "delete_file",
        lambda path: events.append(f"delete_file:{path}"),
    )

    result = subjects.delete_subject(
        "subject-1",
        db=db,
        current_user=current_user,
    )

    assert result == {"message": "Subject deleted successfully"}
    document_quiz_query.filter.return_value.update.assert_called_once_with(
        {Quiz.document_id: None},
        synchronize_session=False,
    )
    subject_quiz_query.filter.return_value.delete.assert_called_once_with(
        synchronize_session=False,
    )
    flashcard_query.filter.return_value.delete.assert_called_once_with(
        synchronize_session=False,
    )
    conversation_query.filter.return_value.update.assert_called_once_with(
        {Conversation.subject_id: None},
        synchronize_session=False,
    )
    assert events == [
        "delete_file:user/document.txt",
        "detach_document_quizzes",
        "delete:document-1",
        "delete_subject_quizzes",
        "delete_flashcard_decks",
        "detach_conversations",
        "delete:subject-1",
        "commit",
    ]

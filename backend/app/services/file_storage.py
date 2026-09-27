"""Local development and Supabase Storage helpers for uploaded documents."""

from contextlib import contextmanager
import os
from pathlib import Path
import tempfile
from typing import BinaryIO, Iterator
from urllib.parse import quote

import httpx

from app.core.config import settings


def _storage_config() -> tuple[str, str, str] | None:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not url and not key:
        return None
    if not url or not key:
        raise RuntimeError(
            "Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use remote file storage."
        )
    bucket = quote(settings.SUPABASE_STORAGE_BUCKET, safe="")
    base_url = f"{url.rstrip('/')}/storage/v1/object"
    return base_url, key, bucket


def remote_storage_enabled() -> bool:
    return _storage_config() is not None


def _headers(key: str, content_type: str | None = None) -> dict[str, str]:
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _object_url(base_url: str, bucket: str, object_key: str) -> str:
    return f"{base_url}/{bucket}/{quote(object_key, safe='/')}"


def upload_fileobj(file_obj: BinaryIO, object_key: str, content_type: str) -> None:
    config = _storage_config()
    if config is None:
        raise RuntimeError("Remote file storage is not configured.")
    base_url, key, bucket = config
    file_obj.seek(0)
    with httpx.Client(timeout=120) as client:
        response = client.post(
            _object_url(base_url, bucket, object_key),
            content=file_obj,
            headers={**_headers(key, content_type), "x-upsert": "false"},
        )
        response.raise_for_status()


def delete_file(object_key: str) -> None:
    config = _storage_config()
    if config is None:
        if os.path.isfile(object_key):
            os.remove(object_key)
        return
    base_url, key, bucket = config
    with httpx.Client(timeout=30) as client:
        response = client.request(
            "DELETE",
            f"{base_url}/{bucket}",
            json={"prefixes": [object_key]},
            headers=_headers(key),
        )
        response.raise_for_status()


def file_exists(object_key: str) -> bool:
    config = _storage_config()
    if config is None:
        return os.path.isfile(object_key)
    base_url, key, bucket = config
    with httpx.Client(timeout=30) as client:
        with client.stream(
            "GET", _object_url(base_url, bucket, object_key), headers=_headers(key)
        ) as response:
            return response.status_code == 200


@contextmanager
def local_document_path(object_key: str) -> Iterator[str]:
    """Yield a local path for document parsing, downloading remote objects as needed."""
    config = _storage_config()
    if config is None:
        if not os.path.isfile(object_key):
            raise FileNotFoundError("The uploaded document file is missing.")
        yield object_key
        return

    base_url, key, bucket = config
    suffix = Path(object_key).suffix
    temp_path: str | None = None
    try:
        with httpx.Client(timeout=120) as client:
            with client.stream(
                "GET", _object_url(base_url, bucket, object_key), headers=_headers(key)
            ) as response:
                response.raise_for_status()
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                    temp_path = temp_file.name
                    for chunk in response.iter_bytes():
                        temp_file.write(chunk)
        yield temp_path
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

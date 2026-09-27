from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the AI-Powered Study Assistant API"}

def test_unauthorized_access():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

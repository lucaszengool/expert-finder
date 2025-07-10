import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Expert Finder API is running"}

def test_search_experts():
    response = client.post(
        "/api/search/",
        json={"query": "machine learning", "limit": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert "experts" in data
    assert "query" in data
    assert data["query"] == "machine learning"

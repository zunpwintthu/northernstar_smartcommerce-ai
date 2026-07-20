import os
os.environ["DATABASE_URL"] = "sqlite:///./test_smartcommerce.db"
os.environ["SECRET_KEY"] = "test-secret-key"
import pytest
from fastapi.testclient import TestClient
from app.database import Base, engine
from app.main import app

@pytest.fixture(autouse=True)
def database():
    Base.metadata.drop_all(engine); Base.metadata.create_all(engine); yield; Base.metadata.drop_all(engine)

@pytest.fixture
def client(): return TestClient(app)

@pytest.fixture
def user_token(client):
    client.post("/api/auth/register", json={"full_name":"Jane Doe","email":"jane@example.com","password":"verysecure"})
    return client.post("/api/auth/login", json={"email":"jane@example.com","password":"verysecure"}).json()["access_token"]


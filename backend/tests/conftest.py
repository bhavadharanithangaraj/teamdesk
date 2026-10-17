from collections.abc import Iterator

import pyodbc
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db import get_db
from app.main import app


@pytest.fixture
def offline_client() -> Iterator[TestClient]:
    """A client whose database dependency is a dummy, for tests that must not touch SQL Server."""
    app.dependency_overrides[get_db] = lambda: object()
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def db_conn() -> Iterator[pyodbc.Connection]:
    """A real connection inside a transaction that is rolled back afterwards, so tests never
    change the seed data. Skips the test when SQL Server isn't reachable."""
    settings = get_settings()
    try:
        conn = pyodbc.connect(settings.connection_string, autocommit=False, timeout=3)
    except pyodbc.Error as exc:
        pytest.skip(f"SQL Server not reachable: {exc.args[-1] if exc.args else exc}")
    try:
        yield conn
    finally:
        conn.rollback()
        conn.close()


@pytest.fixture
def client(db_conn) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db_conn
    yield TestClient(app)
    app.dependency_overrides.clear()

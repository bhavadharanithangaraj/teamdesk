"""Tests that need no database: error parsing, validation and the LIKE escaping."""

import pyodbc
import pytest

from app.db import parse_sql_error
from app.repository import _like_pattern


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (
            ("42000", "[42000] [Microsoft][ODBC Driver 18 for SQL Server][SQL Server]Department does not exist. (50001) (SQLExecDirectW)"),
            (50001, "Department does not exist."),
        ),
        (
            ("42000", "[42000] [Microsoft][ODBC Driver 18 for SQL Server][SQL Server]An employee with this email already exists. (50002) (SQLExecDirectW)"),
            (50002, "An employee with this email already exists."),
        ),
        (("08001", "[08001] Login timeout expired (0) (SQLDriverConnect)"), (None, "08001 [08001] Login timeout expired (0) (SQLDriverConnect)")),
    ],
)
def test_parse_sql_error(raw, expected):
    assert parse_sql_error(pyodbc.Error(*raw)) == expected


def test_like_pattern_escapes_wildcards():
    assert _like_pattern("50%_off[1]") == "%50\\%\\_off\\[1]%"


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        ({"name": "A", "email": "a@b.co", "role": "Dev", "salary": 1, "department_id": 1}, "name: "),
        ({"name": "Asha", "email": "not-an-email", "role": "Dev", "salary": 1, "department_id": 1}, "email: "),
        ({"name": "Asha", "email": "a@b.co", "role": "Dev", "salary": -5, "department_id": 1}, "salary: "),
        ({"name": "Asha", "email": "a@b.co", "role": "Dev", "salary": 1, "department_id": 1, "joined_on": "2999-01-01"}, "joined_on: cannot be in the future"),
        ({"name": "Asha", "email": "a@b.co", "role": "Dev", "salary": 1}, "department_id: Field required"),
    ],
)
def test_invalid_input_returns_400_with_message(offline_client, payload, message):
    response = offline_client.post("/employees", json=payload)
    assert response.status_code == 400
    assert message in response.json()["detail"]

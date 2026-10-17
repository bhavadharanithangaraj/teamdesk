"""Database connection and SQL Server error handling."""

import re
from collections.abc import Iterator

import pyodbc

from app.config import get_settings

# ODBC-level connection pooling: closed connections go back to a pool instead of
# doing a full login handshake on every request.
pyodbc.pooling = True


def connect() -> pyodbc.Connection:
    settings = get_settings()
    # autocommit=True: each statement commits on its own, and usp_AddEmployee manages
    # its own BEGIN/COMMIT TRANSACTION. Without it, pyodbc would wrap everything in an
    # outer transaction that we'd have to remember to commit.
    return pyodbc.connect(settings.connection_string, autocommit=True, timeout=settings.db_login_timeout_seconds)


def get_db() -> Iterator[pyodbc.Connection]:
    """FastAPI dependency: one connection per request, always closed (returned to the pool)."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()


def rows_as_dicts(cursor: pyodbc.Cursor) -> list[dict]:
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


# pyodbc puts the SQL Server error number in brackets at the end of the message, e.g.
# "[Microsoft][ODBC Driver 18 for SQL Server][SQL Server]Department does not exist. (50001) (SQLExecDirectW)"
_SQL_ERROR = re.compile(r"\[SQL Server\](?P<message>.*?)\s*\((?P<number>\d+)\)", re.DOTALL)


def parse_sql_error(exc: pyodbc.Error) -> tuple[int | None, str]:
    """Return (SQL Server error number, clean message) from a pyodbc error."""
    text = " ".join(str(arg) for arg in exc.args)
    match = _SQL_ERROR.search(text)
    if match is None:
        return None, text
    return int(match.group("number")), match.group("message").strip()

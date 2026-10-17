"""All SQL lives here. Every value goes in as a ? parameter, never by string formatting,
so user input can't change the query (no SQL injection)."""

import pyodbc

from app.db import rows_as_dicts
from app.schemas import EmployeeCreate

EMPLOYEE_COLUMNS = "id, name, email, role, salary, joined_on, department_id, department_name"


def _like_pattern(text: str) -> str:
    """'%' and '_' and '[' are wildcards in LIKE; escape them so a search for '50%' is literal."""
    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_").replace("[", "\\[")
    return f"%{escaped}%"


def list_employees(conn: pyodbc.Connection, search: str | None = None, department_id: int | None = None) -> list[dict]:
    sql = f"SELECT {EMPLOYEE_COLUMNS} FROM dbo.vw_EmployeeDetails WHERE 1 = 1"
    params: list[object] = []

    if search:
        # Only the query *shape* is built dynamically; the values are still parameters.
        sql += " AND (name LIKE ? ESCAPE '\\' OR department_name LIKE ? ESCAPE '\\')"
        pattern = _like_pattern(search)
        params += [pattern, pattern]
    if department_id is not None:
        sql += " AND department_id = ?"
        params.append(department_id)

    sql += " ORDER BY name"
    cursor = conn.cursor()
    cursor.execute(sql, params)
    return rows_as_dicts(cursor)


def add_employee(conn: pyodbc.Connection, data: EmployeeCreate) -> dict:
    """Calls usp_AddEmployee, which validates, inserts and returns the new row.
    SQL Server errors (unknown department, duplicate email) propagate as pyodbc.Error."""
    cursor = conn.cursor()
    cursor.execute(
        """
        EXEC dbo.usp_AddEmployee
            @name = ?, @email = ?, @role = ?, @salary = ?, @department_id = ?, @joined_on = ?
        """,
        data.name,
        str(data.email),
        data.role,
        data.salary,
        data.department_id,
        data.joined_on,
    )
    return rows_as_dicts(cursor)[0]


def list_departments(conn: pyodbc.Connection) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM dbo.departments ORDER BY name")
    return rows_as_dicts(cursor)


def department_summary(conn: pyodbc.Connection) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT department_id, department_name, employee_count,
               avg_salary, min_salary, max_salary, total_payroll
        FROM dbo.vw_DepartmentSummary
        ORDER BY employee_count DESC, department_name
        """
    )
    return rows_as_dicts(cursor)


def ping(conn: pyodbc.Connection) -> None:
    conn.cursor().execute("SELECT 1").fetchone()

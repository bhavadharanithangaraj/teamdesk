import logging
from typing import Annotated

import pyodbc
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import repository
from app.config import get_settings
from app.db import get_db, parse_sql_error
from app.schemas import Department, DepartmentSummary, Employee, EmployeeCreate

logger = logging.getLogger("teamdesk")

# Error numbers raised with THROW inside usp_AddEmployee -> HTTP status codes.
SQL_ERROR_STATUS = {
    50001: status.HTTP_400_BAD_REQUEST,  # department does not exist
    50002: status.HTTP_409_CONFLICT,  # email already exists
    50003: status.HTTP_400_BAD_REQUEST,  # invalid input
}

Db = Annotated[pyodbc.Connection, Depends(get_db)]

settings = get_settings()
app = FastAPI(title="TeamDesk API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Return 400 with one readable sentence instead of FastAPI's default 422 error list."""
    problems = []
    for error in exc.errors():
        field = ".".join(str(part) for part in error["loc"] if part not in ("body", "query"))
        message = error["msg"].removeprefix("Value error, ")
        problems.append(f"{field}: {message}" if field else message)
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": "; ".join(problems)})


@app.exception_handler(pyodbc.Error)
async def database_error_handler(_: Request, exc: pyodbc.Error) -> JSONResponse:
    number, message = parse_sql_error(exc)
    if number in SQL_ERROR_STATUS:
        return JSONResponse(status_code=SQL_ERROR_STATUS[number], content={"detail": message})
    logger.exception("Database error", exc_info=exc)
    if isinstance(exc, (pyodbc.OperationalError, pyodbc.InterfaceError)):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "The database is unavailable. Is the SQL Server container running?"},
        )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Database error."})


@app.get("/health", tags=["health"])
def health(db: Db) -> dict:
    repository.ping(db)
    return {"status": "ok", "database": settings.db_name}


@app.get("/employees", response_model=list[Employee], tags=["employees"])
def list_employees(
    db: Db,
    search: Annotated[str | None, Query(max_length=100, description="Matches employee or department name")] = None,
    department_id: Annotated[int | None, Query(ge=1)] = None,
) -> list[dict]:
    return repository.list_employees(db, search=(search or "").strip() or None, department_id=department_id)


@app.post("/employees", response_model=Employee, status_code=status.HTTP_201_CREATED, tags=["employees"])
def add_employee(payload: EmployeeCreate, db: Db) -> dict:
    return repository.add_employee(db, payload)


@app.get("/departments", response_model=list[Department], tags=["departments"])
def list_departments(db: Db) -> list[dict]:
    return repository.list_departments(db)


@app.get("/reports/department-summary", response_model=list[DepartmentSummary], tags=["reports"])
def department_summary(db: Db) -> list[dict]:
    rows = repository.department_summary(db)
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No departments found. Did you run the seed script?")
    return rows

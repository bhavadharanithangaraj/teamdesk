from datetime import date
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, field_validator


class Department(BaseModel):
    id: int
    name: str


class Employee(BaseModel):
    """One row of dbo.vw_EmployeeDetails."""

    id: int
    name: str
    email: str
    role: str
    salary: float
    joined_on: date
    department_id: int
    department_name: str


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr = Field(max_length=254)
    role: str = Field(min_length=2, max_length=100)
    salary: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    department_id: int = Field(ge=1)
    joined_on: date | None = None

    @field_validator("name", "role")
    @classmethod
    def _strip(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("must be at least 2 characters")
        return value

    @field_validator("joined_on")
    @classmethod
    def _not_in_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("cannot be in the future")
        return value


class DepartmentSummary(BaseModel):
    """One row of dbo.vw_DepartmentSummary."""

    department_id: int
    department_name: str
    employee_count: int
    avg_salary: float
    min_salary: float
    max_salary: float
    total_payroll: float

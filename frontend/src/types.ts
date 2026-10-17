// Mirrors the Pydantic models in backend/app/schemas.py.

export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  salary: number;
  joined_on: string; // YYYY-MM-DD
  department_id: number;
  department_name: string;
}

export interface NewEmployee {
  name: string;
  email: string;
  role: string;
  salary: number;
  department_id: number;
  joined_on: string | null;
}

export interface DepartmentSummary {
  department_id: number;
  department_name: string;
  employee_count: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
  total_payroll: number;
}

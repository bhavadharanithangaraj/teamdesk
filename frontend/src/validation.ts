// Client-side checks mirror the API and usp_AddEmployee, so most mistakes are caught before a request.

export interface EmployeeFormValues {
  name: string;
  email: string;
  role: string;
  salary: string;
  department_id: string;
  joined_on: string;
}

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmployee(values: EmployeeFormValues, today: string): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};

  if (values.name.trim().length < 2) errors.name = "Enter the employee's full name.";
  if (!EMAIL.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.role.trim().length < 2) errors.role = "Enter a role, e.g. Frontend Engineer.";

  const salary = Number(values.salary);
  if (values.salary.trim() === "" || Number.isNaN(salary)) errors.salary = "Enter the annual salary.";
  else if (salary < 0) errors.salary = "Salary can't be negative.";
  else if (salary > 9_999_999_999) errors.salary = "Salary is too large.";

  if (!values.department_id) errors.department_id = "Choose a department.";
  if (values.joined_on && values.joined_on > today) errors.joined_on = "Joining date can't be in the future.";

  return errors;
}

import { formatDate, formatSalary, initials } from "../format";
import type { Employee } from "../types";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  highlightId?: number | null;
  onRetry: () => void;
}

/** On narrow screens CSS turns each row into a card, using data-label for the field names. */
export function EmployeeTable({ employees, loading, error, highlightId, onRetry }: EmployeeTableProps) {
  if (error) {
    return (
      <div className="alert" role="alert">
        {error}
        <button type="button" className="btn btn--small" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="table-wrap" aria-busy={loading}>
      <table className="table">
        <caption className="visually-hidden">Employees</caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Role</th>
            <th scope="col">Department</th>
            <th scope="col" className="num">
              Salary
            </th>
            <th scope="col">Joined</th>
          </tr>
        </thead>
        <tbody>
          {loading && employees.length === 0
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="row--loading" aria-hidden="true">
                  {Array.from({ length: 5 }, (__, j) => (
                    <td key={j}>
                      <span className="skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            : employees.map((employee) => (
                <tr key={employee.id} className={employee.id === highlightId ? "row--new" : undefined}>
                  <td data-label="Employee">
                    <div className="person">
                      <span className="avatar" aria-hidden="true">
                        {initials(employee.name)}
                      </span>
                      <span>
                        <span className="person__name">{employee.name}</span>
                        <a className="person__email" href={`mailto:${employee.email}`}>
                          {employee.email}
                        </a>
                      </span>
                    </div>
                  </td>
                  <td data-label="Role">{employee.role}</td>
                  <td data-label="Department">
                    <span className="tag">{employee.department_name}</span>
                  </td>
                  <td data-label="Salary" className="num">
                    {formatSalary(employee.salary)}
                  </td>
                  <td data-label="Joined">
                    <time dateTime={employee.joined_on}>{formatDate(employee.joined_on)}</time>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && employees.length === 0 && <p className="empty">No employees match your search.</p>}
    </div>
  );
}

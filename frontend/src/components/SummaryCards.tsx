import { formatSalary, formatSalaryCompact } from "../format";
import type { DepartmentSummary } from "../types";

interface SummaryCardsProps {
  summary: DepartmentSummary[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** One card per department: headcount and average salary, from GET /reports/department-summary. */
export function SummaryCards({ summary, loading, error, onRetry }: SummaryCardsProps) {
  const totalEmployees = summary.reduce((sum, row) => sum + row.employee_count, 0);
  const payroll = summary.reduce((sum, row) => sum + row.total_payroll, 0);

  return (
    <section className="summary" aria-labelledby="summary-title">
      <div className="section-head">
        <h2 id="summary-title">Departments</h2>
        {!loading && !error && (
          <p className="section-head__meta">
            {totalEmployees} people · {formatSalaryCompact(payroll)} annual payroll
          </p>
        )}
      </div>

      {error ? (
        <div className="alert" role="alert">
          {error}
          <button type="button" className="btn btn--small" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : (
        <ul className="summary__grid" aria-busy={loading}>
          {loading
            ? Array.from({ length: 5 }, (_, i) => <li key={i} className="summary-card summary-card--loading" aria-hidden="true" />)
            : summary.map((row, index) => (
                <li key={row.department_id} className={`summary-card summary-card--c${index % 5}`}>
                  <p className="summary-card__name">{row.department_name}</p>
                  <p className="summary-card__count">
                    {row.employee_count}
                    <span> {row.employee_count === 1 ? "employee" : "employees"}</span>
                  </p>
                  <p className="summary-card__salary">
                    <span className="summary-card__label">Avg salary</span>
                    <span title={formatSalary(row.avg_salary)}>{formatSalaryCompact(row.avg_salary)}</span>
                  </p>
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}

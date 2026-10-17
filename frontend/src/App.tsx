import { useCallback, useEffect, useState } from "react";

import { api } from "./api";
import { EmployeeForm } from "./components/EmployeeForm";
import { EmployeeTable } from "./components/EmployeeTable";
import { SummaryCards } from "./components/SummaryCards";
import type { Department, DepartmentSummary, Employee, NewEmployee } from "./types";

const SEARCH_DELAY_MS = 300;

function localToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Waits until the user stops typing before the value changes, so we don't query on every key. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<DepartmentSummary[]>([]);
  const [summaryState, setSummaryState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesState, setEmployeesState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search, SEARCH_DELAY_MS);
  const [reloadKey, setReloadKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  const loadSummary = useCallback(async () => {
    setSummaryState({ loading: true, error: null });
    try {
      const [summaryRows, departmentRows] = await Promise.all([api.departmentSummary(), api.listDepartments()]);
      setSummary(summaryRows);
      setDepartments(departmentRows);
      setSummaryState({ loading: false, error: null });
    } catch (err) {
      setSummaryState({ loading: false, error: message(err, "Could not load departments.") });
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  // Reload the table whenever the filters change. An AbortController cancels the previous
  // request, so a slow old response can never overwrite newer results.
  useEffect(() => {
    const controller = new AbortController();
    setEmployeesState((prev) => ({ ...prev, loading: true }));
    api
      .listEmployees({ search: debouncedSearch, departmentId }, controller.signal)
      .then((rows) => {
        setEmployees(rows);
        setEmployeesState({ loading: false, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setEmployeesState({ loading: false, error: message(err, "Could not load employees.") });
      });
    return () => controller.abort();
  }, [debouncedSearch, departmentId, reloadKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function addEmployee(employee: NewEmployee): Promise<Employee> {
    const created = await api.addEmployee(employee);
    setShowForm(false);
    setToast(`${created.name} was added to ${created.department_name}.`);
    setHighlightId(created.id);
    setReloadKey((key) => key + 1);
    void loadSummary();
    return created;
  }

  const filtered = Boolean(debouncedSearch.trim() || departmentId);

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              TD
            </span>
            <div>
              <h1 className="brand__name">TeamDesk</h1>
              <p className="brand__tagline">Employee directory</p>
            </div>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)} disabled={showForm}>
            <span aria-hidden="true">＋</span> Add employee
          </button>
        </div>
      </header>

      <main className="main">
        <SummaryCards summary={summary} loading={summaryState.loading} error={summaryState.error} onRetry={() => void loadSummary()} />

        {showForm && (
          <EmployeeForm departments={departments} today={localToday()} onSubmit={addEmployee} onCancel={() => setShowForm(false)} />
        )}

        <section className="card directory" aria-labelledby="directory-title">
          <div className="section-head">
            <h2 id="directory-title">Employees</h2>
            <p className="section-head__meta" role="status">
              {employeesState.loading ? "Loading…" : `${employees.length} ${filtered ? "matching" : "total"}`}
            </p>
          </div>

          <div className="toolbar" role="search">
            <label className="toolbar__search">
              <span className="visually-hidden">Search by name or department</span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                placeholder="Search by name or department…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={100}
              />
            </label>
            <label className="toolbar__filter">
              <span className="visually-hidden">Filter by department</span>
              <select value={departmentId ?? ""} onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : null)}>
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            {filtered && (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => {
                  setSearch("");
                  setDepartmentId(null);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <EmployeeTable
            employees={employees}
            loading={employeesState.loading}
            error={employeesState.error}
            highlightId={highlightId}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        </section>
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

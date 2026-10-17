import type { Department, DepartmentSummary, Employee, NewEmployee } from "./types";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8002").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      signal: init.signal ?? AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err; // superseded request
    throw new ApiError("Can't reach the TeamDesk API. Is the backend running?", 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : `Request failed (${response.status})`;
    throw new ApiError(detail, response.status);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listEmployees(filters: { search?: string; departmentId?: number | null }, signal?: AbortSignal): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    if (filters.departmentId) params.set("department_id", String(filters.departmentId));
    const query = params.toString();
    return request<Employee[]>(`/employees${query ? `?${query}` : ""}`, { signal });
  },

  addEmployee(employee: NewEmployee): Promise<Employee> {
    return request<Employee>("/employees", { method: "POST", body: JSON.stringify(employee) });
  },

  listDepartments(): Promise<Department[]> {
    return request<Department[]>("/departments");
  },

  departmentSummary(): Promise<DepartmentSummary[]> {
    return request<DepartmentSummary[]>("/reports/department-summary");
  },
};

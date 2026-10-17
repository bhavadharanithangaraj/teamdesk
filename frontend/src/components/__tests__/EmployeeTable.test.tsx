import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { DepartmentSummary, Employee } from "../../types";
import { EmployeeTable } from "../EmployeeTable";
import { SummaryCards } from "../SummaryCards";

const EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "Priya Nair",
    email: "priya.nair@teamdesk.dev",
    role: "Senior Backend Engineer",
    salary: 2400000,
    joined_on: "2020-07-01",
    department_id: 1,
    department_name: "Engineering",
  },
  {
    id: 2,
    name: "Rahul Verma",
    email: "rahul.verma@teamdesk.dev",
    role: "Sales Director",
    salary: 2800000,
    joined_on: "2017-10-09",
    department_id: 4,
    department_name: "Sales",
  },
];

describe("EmployeeTable", () => {
  it("renders one row per employee with formatted salary and date", () => {
    render(<EmployeeTable employees={EMPLOYEES} loading={false} error={null} onRetry={vi.fn()} />);

    const rows = screen.getAllByRole("row").slice(1); // skip the header row
    expect(rows).toHaveLength(2);
    const priya = within(rows[0]);
    expect(priya.getByText("Priya Nair")).toBeInTheDocument();
    expect(priya.getByText("PN")).toBeInTheDocument();
    expect(priya.getByRole("link", { name: "priya.nair@teamdesk.dev" })).toHaveAttribute("href", "mailto:priya.nair@teamdesk.dev");
    expect(priya.getByText("₹24,00,000")).toBeInTheDocument();
    expect(priya.getByText("1 Jul 2020")).toBeInTheDocument();
    // data-label powers the stacked card layout on phones.
    expect(rows[0].querySelector('[data-label="Salary"]')).toHaveTextContent("₹24,00,000");
  });

  it("shows an empty state", () => {
    render(<EmployeeTable employees={[]} loading={false} error={null} onRetry={vi.fn()} />);
    expect(screen.getByText("No employees match your search.")).toBeInTheDocument();
  });

  it("shows the error with a retry button", async () => {
    const onRetry = vi.fn();
    render(<EmployeeTable employees={[]} loading={false} error="Can't reach the TeamDesk API." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Can't reach the TeamDesk API.");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("SummaryCards", () => {
  const SUMMARY: DepartmentSummary[] = [
    { department_id: 1, department_name: "Engineering", employee_count: 10, avg_salary: 1850000, min_salary: 750000, max_salary: 3200000, total_payroll: 18500000 },
    { department_id: 5, department_name: "Human Resources", employee_count: 1, avg_salary: 850000, min_salary: 850000, max_salary: 850000, total_payroll: 850000 },
  ];

  it("shows count and average salary per department, plus totals", () => {
    render(<SummaryCards summary={SUMMARY} loading={false} error={null} onRetry={vi.fn()} />);

    const cards = screen.getAllByRole("listitem");
    expect(cards[0]).toHaveTextContent("Engineering");
    expect(cards[0]).toHaveTextContent("10 employees");
    expect(cards[0]).toHaveTextContent("₹18.5L");
    expect(cards[1]).toHaveTextContent("1 employee");
    expect(screen.getByText(/11 people/)).toHaveTextContent("₹1.9Cr annual payroll");
  });
});

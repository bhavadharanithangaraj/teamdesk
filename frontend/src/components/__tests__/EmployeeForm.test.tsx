import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api";
import type { Employee } from "../../types";
import { EmployeeForm } from "../EmployeeForm";

const DEPARTMENTS = [
  { id: 1, name: "Engineering" },
  { id: 2, name: "Design" },
];

function setup(onSubmit = vi.fn().mockResolvedValue({} as Employee)) {
  const user = userEvent.setup({ delay: null });
  render(<EmployeeForm departments={DEPARTMENTS} today="2026-10-17" onSubmit={onSubmit} onCancel={vi.fn()} />);
  return { user, onSubmit };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "  Asha Rao ");
  await user.type(screen.getByLabelText("Work email"), "asha.rao@teamdesk.dev");
  await user.type(screen.getByLabelText("Role"), "Backend Engineer");
  await user.selectOptions(screen.getByLabelText("Department"), "Design");
  await user.type(screen.getByLabelText("Annual salary (₹)"), "1450000");
}

describe("EmployeeForm", () => {
  it("shows an error for every invalid field and focuses the first one", async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Enter the employee's full name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Choose a department.")).toBeInTheDocument();
    expect(screen.getByText("Enter the annual salary.")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    expect(screen.getByLabelText("Full name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Full name")).toHaveAccessibleDescription("Enter the employee's full name.");
  });

  it("rejects a future joining date and a negative salary", async () => {
    const { user, onSubmit } = setup();
    await fillValid(user);
    await user.clear(screen.getByLabelText("Annual salary (₹)"));
    await user.type(screen.getByLabelText("Annual salary (₹)"), "-5");
    await user.type(screen.getByLabelText("Joined on (optional)"), "2030-01-01");

    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Salary can't be negative.")).toBeInTheDocument();
    expect(screen.getByText("Joining date can't be in the future.")).toBeInTheDocument();
  });

  it("submits trimmed, typed values", async () => {
    const { user, onSubmit } = setup();
    await fillValid(user);

    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Asha Rao",
      email: "asha.rao@teamdesk.dev",
      role: "Backend Engineer",
      salary: 1450000,
      department_id: 2,
      joined_on: null,
    });
  });

  it("shows a duplicate-email conflict (409) next to the email field", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("An employee with this email already exists.", 409));
    const { user } = setup(onSubmit);
    await fillValid(user);

    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(await screen.findByText("An employee with this email already exists.")).toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Work email")).toHaveFocus();
  });

  it("shows other server errors at the top of the form", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Department does not exist.", 400));
    const { user } = setup(onSubmit);
    await fillValid(user);

    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Department does not exist.");
  });
});

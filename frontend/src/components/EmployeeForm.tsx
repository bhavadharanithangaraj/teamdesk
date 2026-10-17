import { cloneElement, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";

import { ApiError } from "../api";
import type { Department, Employee, NewEmployee } from "../types";
import { validateEmployee, type EmployeeFormErrors, type EmployeeFormValues } from "../validation";

const EMPTY: EmployeeFormValues = { name: "", email: "", role: "", salary: "", department_id: "", joined_on: "" };

interface EmployeeFormProps {
  departments: Department[];
  today: string;
  onSubmit: (employee: NewEmployee) => Promise<Employee>;
  onCancel: () => void;
}

export function EmployeeForm({ departments, today, onSubmit, onCancel }: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>(EMPTY);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function update(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user edits it.
    if (errors[name as keyof EmployeeFormValues]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found = validateEmployee(values, today);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role.trim(),
        salary: Number(values.salary),
        department_id: Number(values.department_id),
        joined_on: values.joined_on || null,
      });
      setValues(EMPTY);
    } catch (err) {
      // A duplicate email (409 from the stored procedure) belongs next to the email field.
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: err.message });
        formRef.current?.querySelector<HTMLElement>('[name="email"]')?.focus();
      } else {
        setFormError(err instanceof Error ? err.message : "Could not add the employee.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} className="form card" onSubmit={handleSubmit} noValidate aria-labelledby="form-title">
      <div className="form__head">
        <h2 id="form-title">Add employee</h2>
        <button type="button" className="btn btn--ghost btn--small" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {formError && (
        <p className="alert" role="alert">
          {formError}
        </p>
      )}

      <div className="form__grid">
        <Field label="Full name" name="name" error={errors.name}>
          <input id="name" name="name" value={values.name} onChange={update} autoComplete="off" maxLength={120} />
        </Field>
        <Field label="Work email" name="email" error={errors.email}>
          <input id="email" name="email" type="email" value={values.email} onChange={update} autoComplete="off" maxLength={254} />
        </Field>
        <Field label="Role" name="role" error={errors.role}>
          <input id="role" name="role" value={values.role} onChange={update} maxLength={100} />
        </Field>
        <Field label="Department" name="department_id" error={errors.department_id}>
          <select id="department_id" name="department_id" value={values.department_id} onChange={update}>
            <option value="">Select…</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Annual salary (₹)" name="salary" error={errors.salary}>
          <input id="salary" name="salary" type="number" inputMode="numeric" min={0} step="1000" value={values.salary} onChange={update} />
        </Field>
        <Field label="Joined on (optional)" name="joined_on" error={errors.joined_on}>
          <input id="joined_on" name="joined_on" type="date" max={today} value={values.joined_on} onChange={update} />
        </Field>
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Add employee"}
        </button>
      </div>
    </form>
  );
}

type ControlProps = { "aria-invalid"?: boolean; "aria-describedby"?: string };

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: ReactElement<ControlProps> }) {
  const errorId = `${name}-error`;
  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {/* Mark the control invalid and link it to its error text, so screen readers announce both. */}
      {cloneElement(children, { "aria-invalid": Boolean(error), "aria-describedby": errorId })}
      <span id={errorId} className="field__error">
        {error}
      </span>
    </div>
  );
}

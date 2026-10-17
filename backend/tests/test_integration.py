"""Tests against the real SQL Server (Docker) with the seed data from sql/02_seed.sql.
Each test runs in a transaction that is rolled back, so nothing is left behind."""


def department_id(client, name: str) -> int:
    return next(d["id"] for d in client.get("/departments").json() if d["name"] == name)


NEW_EMPLOYEE = {
    "name": "Asha Rao",
    "email": "asha.rao@teamdesk.dev",
    "role": "Backend Engineer",
    "salary": 1450000.50,
    "joined_on": "2025-02-03",
}


def test_lists_all_seeded_employees_from_the_view(client):
    employees = client.get("/employees").json()
    assert len(employees) == 30
    assert set(employees[0]) == {"id", "name", "email", "role", "salary", "joined_on", "department_id", "department_name"}
    assert [e["name"] for e in employees] == sorted(e["name"] for e in employees)


def test_search_matches_employee_or_department_name(client):
    assert [e["name"] for e in client.get("/employees", params={"search": "nair"}).json()] == ["Priya Nair"]
    sales = client.get("/employees", params={"search": "sales"}).json()
    assert len(sales) == 6 and {e["department_name"] for e in sales} == {"Sales"}


def test_search_treats_wildcards_literally(client):
    assert client.get("/employees", params={"search": "%"}).json() == []


def test_department_filter(client):
    design = department_id(client, "Design")
    employees = client.get("/employees", params={"department_id": design}).json()
    assert len(employees) == 5 and {e["department_name"] for e in employees} == {"Design"}


def test_departments(client):
    assert [d["name"] for d in client.get("/departments").json()] == [
        "Design", "Engineering", "Human Resources", "Product", "Sales",
    ]


def test_add_employee_through_procedure(client):
    payload = {**NEW_EMPLOYEE, "email": "  Asha.Rao@TeamDesk.dev ", "department_id": department_id(client, "Engineering")}

    response = client.post("/employees", json=payload)

    assert response.status_code == 201
    created = response.json()
    assert created["email"] == "asha.rao@teamdesk.dev"  # trimmed and lower-cased by the procedure
    assert created["department_name"] == "Engineering"
    assert created["salary"] == 1450000.5
    assert len(client.get("/employees").json()) == 31


def test_duplicate_email_is_409_even_with_different_case(client):
    payload = {**NEW_EMPLOYEE, "email": "PRIYA.NAIR@teamdesk.dev", "department_id": department_id(client, "Product")}

    response = client.post("/employees", json=payload)

    assert response.status_code == 409
    assert response.json() == {"detail": "An employee with this email already exists."}


def test_unknown_department_is_400(client):
    response = client.post("/employees", json={**NEW_EMPLOYEE, "department_id": 999})
    assert response.status_code == 400
    assert response.json() == {"detail": "Department does not exist."}


def test_department_summary_report(client):
    summary = client.get("/reports/department-summary").json()

    assert [row["department_name"] for row in summary] == ["Engineering", "Sales", "Design", "Product", "Human Resources"]
    assert sum(row["employee_count"] for row in summary) == 30
    engineering = summary[0]
    assert engineering["employee_count"] == 10
    assert engineering["avg_salary"] == 1850000.0
    assert engineering["min_salary"] == 750000.0 and engineering["max_salary"] == 3200000.0


def test_health(client):
    assert client.get("/health").json() == {"status": "ok", "database": "TeamDesk"}

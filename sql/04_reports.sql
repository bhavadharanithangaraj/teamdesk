/* ============================================================================
   TeamDesk - 04_reports.sql
   Department summary: employee count and salary statistics per department.
   Saved as a view (vw_DepartmentSummary) so the API runs one simple SELECT.
   ============================================================================ */

USE TeamDesk;
GO

-- LEFT JOIN keeps departments that have no employees yet: they show 0 instead of disappearing.
-- COUNT(e.id) counts only matched employees (COUNT(*) would count the empty row as 1).
CREATE OR ALTER VIEW dbo.vw_DepartmentSummary
AS
SELECT
    d.id                                                     AS department_id,
    d.name                                                   AS department_name,
    COUNT(e.id)                                              AS employee_count,
    CAST(COALESCE(AVG(e.salary), 0) AS DECIMAL(12, 2))       AS avg_salary,
    CAST(COALESCE(MIN(e.salary), 0) AS DECIMAL(12, 2))       AS min_salary,
    CAST(COALESCE(MAX(e.salary), 0) AS DECIMAL(12, 2))       AS max_salary,
    CAST(COALESCE(SUM(e.salary), 0) AS DECIMAL(14, 2))       AS total_payroll
FROM dbo.departments AS d
LEFT JOIN dbo.employees AS e
    ON e.department_id = d.id
GROUP BY d.id, d.name;
GO

PRINT N'04_reports.sql: vw_DepartmentSummary created.';
GO

-- Report 1: the department summary, biggest teams first.
SELECT department_name, employee_count, avg_salary, total_payroll
FROM dbo.vw_DepartmentSummary
ORDER BY employee_count DESC, department_name;

-- Report 2: departments whose average salary is above the company-wide average.
-- HAVING filters groups (after GROUP BY); WHERE filters rows (before it).
SELECT d.name AS department_name, CAST(AVG(e.salary) AS DECIMAL(12, 2)) AS avg_salary
FROM dbo.departments AS d
INNER JOIN dbo.employees AS e
    ON e.department_id = d.id
GROUP BY d.name
HAVING AVG(e.salary) > (SELECT AVG(salary) FROM dbo.employees)
ORDER BY avg_salary DESC;

-- Report 3: highest-paid employee in each department, using a window function.
-- ROW_NUMBER() restarts at 1 for every department (PARTITION BY) in salary order.
WITH ranked AS (
    SELECT
        department_name,
        name,
        role,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC, id) AS salary_rank
    FROM dbo.vw_EmployeeDetails
)
SELECT department_name, name, role, salary
FROM ranked
WHERE salary_rank = 1
ORDER BY salary DESC;

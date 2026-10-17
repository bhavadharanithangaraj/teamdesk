/* ============================================================================
   TeamDesk - 02_seed.sql
   Sample data: 5 departments and 30 employees (annual salaries in INR).
   Safe to re-run: clears existing rows and restarts the id counters.
   ============================================================================ */

USE TeamDesk;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;  -- any error rolls back the whole transaction

BEGIN TRANSACTION;

DELETE FROM dbo.employees;
DELETE FROM dbo.departments;

-- Restart ids at 1. Gotcha: on a table that has NEVER held rows, RESEED 0 makes the next id 0
-- (not 1), so only reseed tables whose identity has been used (last_value is not NULL).
IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE object_id = OBJECT_ID(N'dbo.employees') AND last_value IS NOT NULL)
    DBCC CHECKIDENT (N'dbo.employees', RESEED, 0) WITH NO_INFOMSGS;
IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE object_id = OBJECT_ID(N'dbo.departments') AND last_value IS NOT NULL)
    DBCC CHECKIDENT (N'dbo.departments', RESEED, 0) WITH NO_INFOMSGS;

INSERT INTO dbo.departments (name)
VALUES (N'Engineering'), (N'Product'), (N'Design'), (N'Sales'), (N'Human Resources');

-- Employees reference departments by NAME here and the JOIN looks up each id, so the seed
-- never depends on which identity values the departments happened to get.
INSERT INTO dbo.employees (name, email, role, salary, department_id, joined_on)
SELECT v.name, v.email, v.role, v.salary, d.id, v.joined_on
FROM (VALUES
    (N'Aarav Sharma',      N'aarav.sharma@teamdesk.dev',      N'Engineering Manager',       3200000, N'Engineering',     '2019-04-15'),
    (N'Priya Nair',        N'priya.nair@teamdesk.dev',        N'Senior Backend Engineer',   2400000, N'Engineering',     '2020-07-01'),
    (N'Rohan Mehta',       N'rohan.mehta@teamdesk.dev',       N'Frontend Engineer',         1500000, N'Engineering',     '2022-01-10'),
    (N'Divya Krishnan',    N'divya.krishnan@teamdesk.dev',    N'Full Stack Engineer',       1650000, N'Engineering',     '2021-09-20'),
    (N'Karthik Raman',     N'karthik.raman@teamdesk.dev',     N'DevOps Engineer',           1800000, N'Engineering',     '2021-03-08'),
    (N'Sneha Iyer',        N'sneha.iyer@teamdesk.dev',        N'QA Engineer',               1100000, N'Engineering',     '2023-02-13'),
    (N'Arjun Reddy',       N'arjun.reddy@teamdesk.dev',       N'Data Engineer',             1900000, N'Engineering',     '2020-11-02'),
    (N'Meera Pillai',      N'meera.pillai@teamdesk.dev',      N'Junior Developer',           750000, N'Engineering',     '2024-06-17'),
    (N'Vikram Singh',      N'vikram.singh@teamdesk.dev',      N'Senior Frontend Engineer',  2200000, N'Engineering',     '2019-12-02'),
    (N'Lakshmi Venkat',    N'lakshmi.venkat@teamdesk.dev',    N'Database Administrator',    2000000, N'Engineering',     '2018-08-27'),
    (N'Ananya Gupta',      N'ananya.gupta@teamdesk.dev',      N'Head of Product',           3000000, N'Product',         '2018-05-14'),
    (N'Siddharth Rao',     N'siddharth.rao@teamdesk.dev',     N'Product Manager',           2100000, N'Product',         '2021-06-01'),
    (N'Kavya Menon',       N'kavya.menon@teamdesk.dev',       N'Associate Product Manager', 1200000, N'Product',         '2023-08-21'),
    (N'Nikhil Joshi',      N'nikhil.joshi@teamdesk.dev',      N'Product Analyst',           1050000, N'Product',         '2022-10-03'),
    (N'Ishita Banerjee',   N'ishita.banerjee@teamdesk.dev',   N'Business Analyst',           980000, N'Product',         '2024-01-15'),
    (N'Aditya Kulkarni',   N'aditya.kulkarni@teamdesk.dev',   N'Design Lead',               2300000, N'Design',          '2019-02-18'),
    (N'Neha Chatterjee',   N'neha.chatterjee@teamdesk.dev',   N'Senior UX Designer',        1700000, N'Design',          '2020-09-14'),
    (N'Varun Desai',       N'varun.desai@teamdesk.dev',       N'UI Designer',               1150000, N'Design',          '2022-04-25'),
    (N'Pooja Hegde',       N'pooja.hegde@teamdesk.dev',       N'UX Researcher',             1250000, N'Design',          '2021-11-08'),
    (N'Harini Subramanian',N'harini.subramanian@teamdesk.dev',N'Visual Designer',            900000, N'Design',          '2024-03-04'),
    (N'Rahul Verma',       N'rahul.verma@teamdesk.dev',       N'Sales Director',            2800000, N'Sales',           '2017-10-09'),
    (N'Deepika Saxena',    N'deepika.saxena@teamdesk.dev',    N'Account Executive',         1300000, N'Sales',           '2021-01-18'),
    (N'Manoj Patil',       N'manoj.patil@teamdesk.dev',       N'Account Executive',         1250000, N'Sales',           '2022-07-11'),
    (N'Swathi Reddy',      N'swathi.reddy@teamdesk.dev',      N'Sales Development Rep',      700000, N'Sales',           '2024-02-26'),
    (N'Gaurav Malhotra',   N'gaurav.malhotra@teamdesk.dev',   N'Customer Success Manager',  1400000, N'Sales',           '2020-05-04'),
    (N'Tanvi Shah',        N'tanvi.shah@teamdesk.dev',        N'Sales Operations Analyst',   950000, N'Sales',           '2023-09-12'),
    (N'Sunita Bhat',       N'sunita.bhat@teamdesk.dev',       N'HR Manager',                1900000, N'Human Resources', '2018-01-22'),
    (N'Ramesh Gowda',      N'ramesh.gowda@teamdesk.dev',      N'Talent Acquisition Lead',   1350000, N'Human Resources', '2020-03-16'),
    (N'Fatima Sheikh',     N'fatima.sheikh@teamdesk.dev',     N'HR Business Partner',       1200000, N'Human Resources', '2022-08-29'),
    (N'Joseph Thomas',     N'joseph.thomas@teamdesk.dev',     N'Payroll Specialist',         850000, N'Human Resources', '2023-05-08')
) AS v (name, email, role, salary, department_name, joined_on)
INNER JOIN dbo.departments AS d
    ON d.name = v.department_name;

COMMIT TRANSACTION;
GO

DECLARE @departments INT = (SELECT COUNT(*) FROM dbo.departments);
DECLARE @employees INT = (SELECT COUNT(*) FROM dbo.employees);
PRINT CONCAT(N'02_seed.sql: ', @departments, N' departments, ', @employees, N' employees.');

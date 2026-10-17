/* ============================================================================
   TeamDesk - 01_schema.sql
   Creates the TeamDesk database, the two tables and the supporting index.
   Safe to re-run: existing objects are dropped first (dependents before parents).
   ============================================================================ */

IF DB_ID(N'TeamDesk') IS NULL
    CREATE DATABASE TeamDesk;
GO

USE TeamDesk;
GO

-- Drop in dependency order: objects that reference the tables, then the child table, then the parent.
DROP VIEW IF EXISTS dbo.vw_DepartmentSummary;
DROP VIEW IF EXISTS dbo.vw_EmployeeDetails;
DROP PROCEDURE IF EXISTS dbo.usp_AddEmployee;
DROP TABLE IF EXISTS dbo.employees;
DROP TABLE IF EXISTS dbo.departments;
GO

CREATE TABLE dbo.departments (
    id   INT IDENTITY(1, 1) NOT NULL
         CONSTRAINT PK_departments PRIMARY KEY,
    name NVARCHAR(100) NOT NULL
         CONSTRAINT UQ_departments_name UNIQUE
);
GO

CREATE TABLE dbo.employees (
    id            INT IDENTITY(1, 1) NOT NULL
                  CONSTRAINT PK_employees PRIMARY KEY,
    name          NVARCHAR(120) NOT NULL,
    -- The default collation is case-insensitive, so 'A@x.com' and 'a@x.com' count as duplicates.
    email         NVARCHAR(254) NOT NULL
                  CONSTRAINT UQ_employees_email UNIQUE,
    role          NVARCHAR(100) NOT NULL,
    salary        DECIMAL(12, 2) NOT NULL
                  CONSTRAINT CK_employees_salary CHECK (salary >= 0),
    department_id INT NOT NULL
                  CONSTRAINT FK_employees_departments REFERENCES dbo.departments (id),
    joined_on     DATE NOT NULL
                  CONSTRAINT DF_employees_joined_on DEFAULT (CAST(SYSDATETIME() AS DATE))
);
GO

-- SQL Server indexes PRIMARY KEY and UNIQUE columns automatically, but NOT foreign keys.
-- This index speeds up "employees in department X" filters and the department JOINs.
CREATE INDEX IX_employees_department_id ON dbo.employees (department_id);
GO

PRINT N'01_schema.sql: tables and index created.';

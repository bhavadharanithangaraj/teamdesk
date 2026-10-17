/* ============================================================================
   TeamDesk - 03_procedures.sql
   vw_EmployeeDetails : employees joined with their department name
   usp_AddEmployee    : validates and inserts one employee, returns the new row

   Error numbers raised by usp_AddEmployee (the API maps them to HTTP codes):
     50001  department does not exist                 -> 400 Bad Request
     50002  an employee with this email already exists -> 409 Conflict
     50003  invalid input (blank field, salary < 0)    -> 400 Bad Request
   ============================================================================ */

USE TeamDesk;
GO

CREATE OR ALTER VIEW dbo.vw_EmployeeDetails
AS
SELECT
    e.id,
    e.name,
    e.email,
    e.role,
    e.salary,
    e.joined_on,
    e.department_id,
    d.name AS department_name
FROM dbo.employees AS e
INNER JOIN dbo.departments AS d
    ON d.id = e.department_id;
GO

CREATE OR ALTER PROCEDURE dbo.usp_AddEmployee
    @name          NVARCHAR(120),
    @email         NVARCHAR(254),
    @role          NVARCHAR(100),
    @salary        DECIMAL(12, 2),
    @department_id INT,
    @joined_on     DATE = NULL,          -- optional: defaults to today
    @new_id        INT = NULL OUTPUT     -- optional: the new employee's id
AS
BEGIN
    SET NOCOUNT ON;     -- no "1 row affected" messages mixed into the results
    SET XACT_ABORT ON;  -- a runtime error inside the transaction rolls it back

    SET @name  = TRIM(@name);
    SET @email = LOWER(TRIM(@email));
    SET @role  = TRIM(@role);

    -- 1. Validate input. THROW stops the procedure and sends the error to the caller.
    IF @name = N'' OR @email = N'' OR @role = N'' OR @name IS NULL OR @email IS NULL OR @role IS NULL
        THROW 50003, N'Name, email and role are required.', 1;
    IF @salary IS NULL OR @salary < 0
        THROW 50003, N'Salary must be zero or more.', 1;

    -- 2. The department must exist (the FK would also catch it, but with a vaguer message).
    IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE id = @department_id)
        THROW 50001, N'Department does not exist.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 3. Email must be unique. UPDLOCK + HOLDLOCK lock the checked range until COMMIT,
        --    so two simultaneous requests can't both pass this check with the same email.
        IF EXISTS (SELECT 1 FROM dbo.employees WITH (UPDLOCK, HOLDLOCK) WHERE email = @email)
            THROW 50002, N'An employee with this email already exists.', 1;

        INSERT INTO dbo.employees (name, email, role, salary, department_id, joined_on)
        VALUES (@name, @email, @role, @salary, @department_id,
                COALESCE(@joined_on, CAST(SYSDATETIME() AS DATE)));

        SET @new_id = SCOPE_IDENTITY();  -- id created by THIS insert (not by triggers or other sessions)

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Safety net: if the UNIQUE constraint fires anyway (2627/2601), report it as a duplicate email.
        IF ERROR_NUMBER() IN (2601, 2627)
            THROW 50002, N'An employee with this email already exists.', 1;

        THROW;  -- re-raise anything else unchanged
    END CATCH;

    -- 4. Return the created row in the same shape as the view, so the API can send it back.
    SELECT id, name, email, role, salary, joined_on, department_id, department_name
    FROM dbo.vw_EmployeeDetails
    WHERE id = @new_id;
END;
GO

PRINT N'03_procedures.sql: vw_EmployeeDetails and usp_AddEmployee created.';

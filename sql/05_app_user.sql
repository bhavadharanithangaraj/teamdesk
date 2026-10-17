/* ============================================================================
   TeamDesk - 05_app_user.sql
   A least-privilege login for the API, so the app never connects as 'sa'.

   The app may only:
     - SELECT from the departments table and the two views
     - EXECUTE usp_AddEmployee
   It cannot UPDATE/DELETE rows or INSERT into tables directly: every new employee
   goes through the procedure's validation.

   Run with sqlcmd and pass the password as a scripting variable, e.g.
     sqlcmd ... -v APP_PASSWORD="YourStrong#Pass1" -i 05_app_user.sql
   ============================================================================ */

USE master;
GO

IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'teamdesk_app')
    ALTER LOGIN teamdesk_app WITH PASSWORD = N'$(APP_PASSWORD)';
ELSE
    CREATE LOGIN teamdesk_app WITH PASSWORD = N'$(APP_PASSWORD)', CHECK_POLICY = ON, DEFAULT_DATABASE = TeamDesk;
GO

USE TeamDesk;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'teamdesk_app')
    CREATE USER teamdesk_app FOR LOGIN teamdesk_app;
GO

GRANT SELECT ON dbo.departments          TO teamdesk_app;
GRANT SELECT ON dbo.vw_EmployeeDetails   TO teamdesk_app;
GRANT SELECT ON dbo.vw_DepartmentSummary TO teamdesk_app;
GRANT EXECUTE ON dbo.usp_AddEmployee     TO teamdesk_app;
GO

PRINT N'05_app_user.sql: login teamdesk_app created with SELECT on views and EXECUTE on usp_AddEmployee.';

-- =========================================================================
-- TEMS Database Initializer & Native RLS Predicates for MS SQL Server
-- Apex Global Consulting Group
-- =========================================================================

-- 1. Create Tables
CREATE TABLE Users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    resource NVARCHAR(50) NOT NULL,
    action NVARCHAR(50) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE User_Roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE
);

CREATE TABLE Role_Permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE
);

CREATE TABLE Projects (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'PLANNING',
    manager_id BIGINT NOT NULL,
    total_budget DECIMAL(18, 4) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (manager_id) REFERENCES Users(id),
    CONSTRAINT chk_project_budget CHECK (total_budget >= 0.00)
);

CREATE TABLE Project_Assignments (
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Tasks (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    project_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'TO_DO',
    priority NVARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    assignee_id BIGINT NOT NULL,
    est_hours DECIMAL(10, 2) NOT NULL,
    actual_hours DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES Users(id),
    CONSTRAINT chk_task_est_hours CHECK (est_hours >= 0.00),
    CONSTRAINT chk_task_actual_hours CHECK (actual_hours >= 0.00)
);

CREATE TABLE Expenses (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    task_id BIGINT NULL,
    amount DECIMAL(18, 4) NOT NULL,
    currency NVARCHAR(3) NOT NULL DEFAULT 'USD',
    category NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    bill_image_url NVARCHAR(512) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (employee_id) REFERENCES Users(id),
    FOREIGN KEY (project_id) REFERENCES Projects(id),
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES Users(id),
    CONSTRAINT chk_expense_amount CHECK (amount > 0.00)
);

CREATE TABLE Notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    title NVARCHAR(150) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (recipient_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Audit_Logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NULL,
    action NVARCHAR(100) NOT NULL,
    resource NVARCHAR(100) NOT NULL,
    resource_id BIGINT NOT NULL,
    changes NVARCHAR(MAX) NULL,
    ip_address NVARCHAR(45) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 2. Performance Indexes
CREATE UNIQUE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_tasks_project ON Tasks(project_id);
CREATE INDEX idx_tasks_assignee ON Tasks(assignee_id);
CREATE INDEX idx_expenses_employee_status ON Expenses(employee_id, status);
CREATE INDEX idx_project_assignments_user ON Project_Assignments(user_id);

-- 3. Row-Level Security Enforcements
GO
CREATE SCHEMA Security;
GO

-- Predicate Function
CREATE FUNCTION Security.fn_ExpenseSecurityPredicate(@EmployeeID BIGINT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_Result
WHERE
    -- Admins bypass security checks
    IS_MEMBER('db_owner') = 1
    OR IS_MEMBER('AdminRole') = 1
    -- Users can access their own expense entries
    OR @EmployeeID = CAST(SESSION_CONTEXT(N'EmployeeID') AS BIGINT)
    -- Managers can access expenses for projects they manage
    OR EXISTS (
        SELECT 1 FROM dbo.Projects p
        INNER JOIN dbo.Tasks t ON t.project_id = p.id
        INNER JOIN dbo.Expenses e ON e.task_id = t.id
        WHERE e.employee_id = @EmployeeID
          AND p.manager_id = CAST(SESSION_CONTEXT(N'ManagerID') AS BIGINT)
    );
GO

-- Bind Policy to Expenses
CREATE SECURITY POLICY Security.ExpenseAccessPolicy
ADD FILTER PREDICATE Security.fn_ExpenseSecurityPredicate(employee_id)
ON dbo.Expenses
WITH (STATE = ON, SCHEMABINDING = ON);
GO

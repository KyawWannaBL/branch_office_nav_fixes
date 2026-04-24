-- Add branch-office role to the enum
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'branch-office';
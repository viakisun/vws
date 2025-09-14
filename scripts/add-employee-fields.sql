-- Add birth_date and termination_date columns to employees table
-- Migration script for employee data enhancement

-- Add birth_date column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add termination_date column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_date DATE;

-- Add index for birth_date for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_birth_date ON employees(birth_date);

-- Add index for termination_date for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_termination_date ON employees(termination_date);

-- Update status to 'terminated' for employees with termination_date
UPDATE employees 
SET status = 'terminated' 
WHERE termination_date IS NOT NULL AND status != 'terminated';

-- Add comment to columns
COMMENT ON COLUMN employees.birth_date IS 'Employee birth date';
COMMENT ON COLUMN employees.termination_date IS 'Employee termination date (when they left the company)';

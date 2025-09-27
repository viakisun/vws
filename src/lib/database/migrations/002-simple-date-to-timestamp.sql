-- Simple Date to Timestamp Migration
-- Convert only existing DATE columns to TIMESTAMP WITH TIME ZONE

-- 1. transactions.date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date' AND data_type = 'date') THEN
        ALTER TABLE transactions ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE USING date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted transactions.date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 2. employees.hire_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'hire_date' AND data_type = 'date') THEN
        ALTER TABLE employees ALTER COLUMN hire_date TYPE TIMESTAMP WITH TIME ZONE USING hire_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted employees.hire_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 3. leave_requests.start_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'start_date' AND data_type = 'date') THEN
        ALTER TABLE leave_requests ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted leave_requests.start_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 4. leave_requests.end_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'end_date' AND data_type = 'date') THEN
        ALTER TABLE leave_requests ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted leave_requests.end_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 5. projects.start_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date' AND data_type = 'date') THEN
        ALTER TABLE projects ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted projects.start_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 6. projects.end_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date' AND data_type = 'date') THEN
        ALTER TABLE projects ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted projects.end_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 7. reports.period_start
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'period_start' AND data_type = 'date') THEN
        ALTER TABLE reports ALTER COLUMN period_start TYPE TIMESTAMP WITH TIME ZONE USING period_start::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted reports.period_start to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 8. reports.period_end
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'period_end' AND data_type = 'date') THEN
        ALTER TABLE reports ALTER COLUMN period_end TYPE TIMESTAMP WITH TIME ZONE USING period_end::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted reports.period_end to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 9. leads.last_contact
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_contact' AND data_type = 'date') THEN
        ALTER TABLE leads ALTER COLUMN last_contact TYPE TIMESTAMP WITH TIME ZONE USING last_contact::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted leads.last_contact to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 10. sales_activities.date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_activities' AND column_name = 'date' AND data_type = 'date') THEN
        ALTER TABLE sales_activities ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE USING date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted sales_activities.date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 11. sales_activities.next_action_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_activities' AND column_name = 'next_action_date' AND data_type = 'date') THEN
        ALTER TABLE sales_activities ALTER COLUMN next_action_date TYPE TIMESTAMP WITH TIME ZONE USING next_action_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted sales_activities.next_action_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 12. customer_interactions.date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_interactions' AND column_name = 'date' AND data_type = 'date') THEN
        ALTER TABLE customer_interactions ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE USING date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted customer_interactions.date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 13. customer_interactions.next_action_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_interactions' AND column_name = 'next_action_date' AND data_type = 'date') THEN
        ALTER TABLE customer_interactions ALTER COLUMN next_action_date TYPE TIMESTAMP WITH TIME ZONE USING next_action_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted customer_interactions.next_action_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 14. contracts.start_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'start_date' AND data_type = 'date') THEN
        ALTER TABLE contracts ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted contracts.start_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 15. contracts.end_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'end_date' AND data_type = 'date') THEN
        ALTER TABLE contracts ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted contracts.end_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- 16. contracts.renewal_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'renewal_date' AND data_type = 'date') THEN
        ALTER TABLE contracts ALTER COLUMN renewal_date TYPE TIMESTAMP WITH TIME ZONE USING renewal_date::TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Converted contracts.renewal_date to TIMESTAMP WITH TIME ZONE';
    END IF;
END $$;

-- Migration completed
SELECT 'Date to Timestamp migration completed successfully' as status;

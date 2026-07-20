-- Add CHECK constraint to prevent negative credit balances
-- This is the last line of defense against race conditions in credit deduction.
-- Even if the application-level atomic check (.gte()) fails,
-- the database will refuse to set credits below 0.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'credits_non_negative'
          AND conrelid = 'public.customers'::regclass
    ) THEN
        ALTER TABLE public.customers
            ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);
    END IF;
END $$;

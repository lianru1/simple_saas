-- Create skills table for AI personality distillation
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    flavor TEXT NOT NULL DEFAULT '',
    rules TEXT[] NOT NULL DEFAULT '{}',
    material TEXT,
    mode TEXT NOT NULL DEFAULT 'host' CHECK (mode IN ('host', 'draw')),
    price_credits INTEGER NOT NULL DEFAULT 0,
    quota_used INTEGER NOT NULL DEFAULT 0,
    quota_total INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT price_credits_non_negative CHECK (price_credits >= 0),
    CONSTRAINT quota_used_non_negative CHECK (quota_used >= 0),
    CONSTRAINT quota_total_positive CHECK (quota_total > 0)
);

-- Indexes
CREATE INDEX skills_user_id_idx ON public.skills(user_id);
CREATE INDEX skills_created_at_idx ON public.skills(created_at DESC);
CREATE INDEX skills_mode_idx ON public.skills(mode);

-- Updated_at trigger
CREATE TRIGGER handle_skills_updated_at
    BEFORE UPDATE ON public.skills
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS: Enable
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read skills
CREATE POLICY "Anyone can read skills"
    ON public.skills FOR SELECT
    USING (true);

-- RLS: Only owner can insert their own skills
CREATE POLICY "Users can create their own skills"
    ON public.skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS: Only owner can update their own skills
CREATE POLICY "Users can update their own skills"
    ON public.skills FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS: Only owner can delete their own skills
CREATE POLICY "Users can delete their own skills"
    ON public.skills FOR DELETE
    USING (auth.uid() = user_id);

-- RLS: Service role can manage all
CREATE POLICY "Service role can manage all skills"
    ON public.skills FOR ALL
    USING (auth.role() = 'service_role');

-- Grants
GRANT ALL ON public.skills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT SELECT ON public.skills TO anon;

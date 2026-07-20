-- ============================================
-- P1 商业化：购买记录 + 对话计数 + 积分历史追踪
-- ============================================

-- 1. 购买记录表（Draw 买断）
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    price_credits INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

-- 2. 对话计数表（追踪每个用户对每个 Skill 的聊天条数）
CREATE TABLE IF NOT EXISTS public.skill_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    free_messages_used INTEGER NOT NULL DEFAULT 0,
    credits_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

-- 3. credits_history 加 skill_id 字段（用于后续分成统计）
ALTER TABLE public.credits_history ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id);

-- 4. RLS for new tables
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_conversations ENABLE ROW LEVEL SECURITY;

-- Purchases: users can read their own purchases
CREATE POLICY "Users can read own purchases"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Purchases: service role only for insert (via API)
CREATE POLICY "Service role can insert purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (true);

-- skill_conversations: users can read own records
CREATE POLICY "Users can read own conversation records"
    ON public.skill_conversations FOR SELECT
    USING (auth.uid() = user_id);

-- skill_conversations: upsert via API
CREATE POLICY "Service role can upsert conversation records"
    ON public.skill_conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update conversation records"
    ON public.skill_conversations FOR UPDATE
    USING (true);

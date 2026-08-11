-- Supabase migration for Content Moderation & Safety

-- 1. Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'other')),
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 3. Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can only insert their own reports
CREATE POLICY "Users can insert their own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can only read their own reports
CREATE POLICY "Users can read their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Users can insert blocks
CREATE POLICY "Users can insert blocks" ON public.blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can read their own blocks
CREATE POLICY "Users can read their own blocks" ON public.blocked_users
    FOR SELECT USING (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);

-- 5. RPC function to get blocked users
CREATE OR REPLACE FUNCTION get_blocked_users()
RETURNS TABLE (blocked_id UUID) 
AS $$
BEGIN
    RETURN QUERY 
    SELECT bu.blocked_id 
    FROM public.blocked_users bu
    WHERE bu.blocker_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

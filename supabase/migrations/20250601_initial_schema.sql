-- Reproducible baseline for a fresh Supabase project.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.mistake_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mistake_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  answer TEXT NOT NULL,
  user_answer TEXT,
  explanation TEXT,
  image_url TEXT,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT false,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mistake_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mistake_questions_user_created_idx
  ON public.mistake_questions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mistake_questions_user_subject_idx
  ON public.mistake_questions(user_id, subject);
CREATE INDEX IF NOT EXISTS mistake_questions_user_difficulty_idx
  ON public.mistake_questions(user_id, difficulty);
CREATE INDEX IF NOT EXISTS mistake_questions_user_mastered_idx
  ON public.mistake_questions(user_id, is_mastered);
CREATE INDEX IF NOT EXISTS mistake_questions_content_trgm_idx
  ON public.mistake_questions USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS mistake_questions_category_trgm_idx
  ON public.mistake_questions USING gin (category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS mistake_feedbacks_user_created_idx
  ON public.mistake_feedbacks(user_id, created_at DESC);

ALTER TABLE public.mistake_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.mistake_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.mistake_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.mistake_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own questions" ON public.mistake_questions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own questions" ON public.mistake_questions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questions" ON public.mistake_questions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own questions" ON public.mistake_questions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.mistake_feedbacks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON TABLE public.mistake_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mistake_questions TO authenticated;
GRANT SELECT ON TABLE public.mistake_feedbacks TO authenticated;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_mistake_profiles_updated_at
  BEFORE UPDATE ON public.mistake_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mistake_questions_updated_at
  BEFORE UPDATE ON public.mistake_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mistake_feedbacks_updated_at
  BEFORE UPDATE ON public.mistake_feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

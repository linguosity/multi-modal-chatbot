-- Creates per-user multi-site storage with RLS and helpful triggers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.user_school_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_school_sites_user ON public.user_school_sites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_school_sites_user_name ON public.user_school_sites(user_id, name);

ALTER TABLE public.user_school_sites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_school_sites' AND policyname = 'select_own_sites'
  ) THEN
    CREATE POLICY select_own_sites ON public.user_school_sites
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_school_sites' AND policyname = 'insert_own_sites'
  ) THEN
    CREATE POLICY insert_own_sites ON public.user_school_sites
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_school_sites' AND policyname = 'update_own_sites'
  ) THEN
    CREATE POLICY update_own_sites ON public.user_school_sites
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_school_sites' AND policyname = 'delete_own_sites'
  ) THEN
    CREATE POLICY delete_own_sites ON public.user_school_sites
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Touch updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_school_sites_updated_at ON public.user_school_sites;
CREATE TRIGGER trg_user_school_sites_updated_at
BEFORE UPDATE ON public.user_school_sites
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Ensure at most one default per user
CREATE OR REPLACE FUNCTION public.enforce_single_default_site()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default IS TRUE THEN
    UPDATE public.user_school_sites
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_school_sites_single_default ON public.user_school_sites;
CREATE TRIGGER trg_user_school_sites_single_default
AFTER INSERT OR UPDATE OF is_default ON public.user_school_sites
FOR EACH ROW EXECUTE PROCEDURE public.enforce_single_default_site();


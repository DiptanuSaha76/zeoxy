ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS id_kind text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS id_min_len integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS id_max_len integer NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS id_help text,
  ADD COLUMN IF NOT EXISTS requires_server_id boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS server_label text NOT NULL DEFAULT 'Server / Zone ID';

ALTER TABLE public.games
  ADD CONSTRAINT games_id_kind_check CHECK (id_kind IN ('text','numeric'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS player_server text;

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites" ON public.admin_invites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can add invites" ON public.admin_invites
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can remove invites" ON public.admin_invites
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_invites_updated_at
  BEFORE UPDATE ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.grant_invited_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_invites
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_invited_admin() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_invited_admin();

UPDATE public.games SET id_kind = 'numeric', id_min_len = 6, id_max_len = 12,
  requires_server_id = true, server_label = 'Zone ID',
  id_help = 'Find your UID and Zone ID in your in-game profile.'
WHERE slug IN (SELECT slug FROM public.games ORDER BY sort_order LIMIT 1);
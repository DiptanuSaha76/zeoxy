REVOKE ALL ON FUNCTION public.ensure_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_invited_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_email(text) TO anon, authenticated;
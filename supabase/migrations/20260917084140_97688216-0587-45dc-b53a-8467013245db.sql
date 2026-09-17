CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  discount_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "settings admin update" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
INSERT INTO public.site_settings (id, discount_percent) VALUES (true, 0) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.packages DROP CONSTRAINT packages_game_id_fkey;
ALTER TABLE public.packages ADD CONSTRAINT packages_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
ALTER TABLE public.banners DROP CONSTRAINT banners_game_id_fkey;
ALTER TABLE public.banners ADD CONSTRAINT banners_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL;
ALTER TABLE public.orders DROP CONSTRAINT orders_game_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL;
ALTER TABLE public.orders DROP CONSTRAINT orders_package_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE SET NULL;

CREATE POLICY "games admin delete" ON public.games FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
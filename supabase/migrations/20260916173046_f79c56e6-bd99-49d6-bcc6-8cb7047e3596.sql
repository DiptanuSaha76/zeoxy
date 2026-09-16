-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- games
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'Mobile',
  cover_url text,
  currency_label text NOT NULL DEFAULT 'Gems',
  id_label text NOT NULL DEFAULT 'Player ID',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT SELECT ON public.games TO anon;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games public read" ON public.games FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "games admin write" ON public.games FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER games_touch BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  badge text DEFAULT 'Featured',
  image_url text,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT SELECT ON public.banners TO anon;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read" ON public.banners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "banners admin write" ON public.banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER banners_touch BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL DEFAULT 0,
  bonus_text text,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT SELECT ON public.packages TO anon;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages public read" ON public.packages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "packages admin write" ON public.packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER packages_touch BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  player_ref text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own read" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders own insert" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- seed
INSERT INTO public.games (name, slug, category, cover_url, currency_label, sort_order) VALUES
  ('Aether Clash', 'aether-clash', 'Battle Royale', '/images/game-aether.jpg', 'Gems', 1),
  ('Neon Drift', 'neon-drift', 'Esports', '/images/game-neon.jpg', 'Chips', 2),
  ('Starlight Saga', 'starlight-saga', 'RPG', '/images/game-starlight.jpg', 'Crystals', 3),
  ('Iron Vanguard', 'iron-vanguard', 'FPS', '/images/game-iron.jpg', 'Credits', 4);

INSERT INTO public.banners (title, subtitle, badge, image_url, game_id, sort_order)
SELECT 'Aether Clash', 'Battle Royale · 4.8★', 'Featured', '/images/banner-aether.jpg', id, 1 FROM public.games WHERE slug = 'aether-clash';
INSERT INTO public.banners (title, subtitle, badge, image_url, game_id, sort_order)
SELECT 'Neon Drift', 'Esports · 2x chips weekend', 'Live event', '/images/banner-neon.jpg', id, 2 FROM public.games WHERE slug = 'neon-drift';
INSERT INTO public.banners (title, subtitle, badge, image_url, game_id, sort_order)
SELECT 'Starlight Saga', 'RPG · Season 4 out now', 'New', '/images/banner-starlight.jpg', id, 3 FROM public.games WHERE slug = 'starlight-saga';

INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '100 Gems', 100, 99, NULL, false, 1 FROM public.games WHERE slug = 'aether-clash';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '500 Gems', 500, 469, '+20% bonus', true, 2 FROM public.games WHERE slug = 'aether-clash';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '1200 Gems', 1200, 999, NULL, false, 3 FROM public.games WHERE slug = 'aether-clash';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '2600 Gems', 2600, 1999, NULL, false, 4 FROM public.games WHERE slug = 'aether-clash';

INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '80 Chips', 80, 79, NULL, false, 1 FROM public.games WHERE slug = 'neon-drift';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '420 Chips', 420, 399, '+15% bonus', true, 2 FROM public.games WHERE slug = 'neon-drift';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '900 Chips', 900, 849, NULL, false, 3 FROM public.games WHERE slug = 'neon-drift';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '2000 Chips', 2000, 1799, NULL, false, 4 FROM public.games WHERE slug = 'neon-drift';

INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '150 Crystals', 150, 149, NULL, false, 1 FROM public.games WHERE slug = 'starlight-saga';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '600 Crystals', 600, 549, '+10% bonus', true, 2 FROM public.games WHERE slug = 'starlight-saga';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '1500 Crystals', 1500, 1299, NULL, false, 3 FROM public.games WHERE slug = 'starlight-saga';

INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '200 Credits', 200, 199, NULL, false, 1 FROM public.games WHERE slug = 'iron-vanguard';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '750 Credits', 750, 699, '+12% bonus', true, 2 FROM public.games WHERE slug = 'iron-vanguard';
INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT id, '1800 Credits', 1800, 1599, NULL, false, 3 FROM public.games WHERE slug = 'iron-vanguard';

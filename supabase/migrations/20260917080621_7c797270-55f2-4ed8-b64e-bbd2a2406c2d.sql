CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE u uuid := auth.uid(); m jsonb; em text;
BEGIN
  IF u IS NULL THEN RETURN; END IF;
  SELECT raw_user_meta_data, email INTO m, em FROM auth.users WHERE id = u;
  INSERT INTO public.profiles (id, display_name, username, phone)
  VALUES (
    u,
    COALESCE(m->>'display_name', m->>'username', split_part(em, '@', 1)),
    NULLIF(lower(m->>'username'), ''),
    NULLIF(regexp_replace(COALESCE(m->>'phone', ''), '[^0-9]', '', 'g'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (u, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  IF EXISTS (SELECT 1 FROM public.admin_invites WHERE lower(email) = lower(em)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (u, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;

INSERT INTO public.admin_invites (email)
SELECT 'moobit_69@moobit.app'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_invites WHERE lower(email) = 'moobit_69@moobit.app');

INSERT INTO public.games (name, slug, category, cover_url, currency_label, id_label, id_kind, id_min_len, id_max_len, id_help, requires_server_id, server_label, sort_order)
VALUES
 ('Aether Clash', 'aether-clash', 'MOBA', '/images/game-aether.jpg', 'Diamonds', 'User ID (UID)', 'numeric', 6, 12, 'Tap your avatar in game — the UID is under your name.', true, 'Zone ID', 1),
 ('Neon Drift', 'neon-drift', 'Racing', '/images/game-neon.jpg', 'Chips', 'Racer ID', 'numeric', 6, 12, 'Profile > Settings > Racer ID', false, 'Server', 2),
 ('Starlight Saga', 'starlight-saga', 'RPG', '/images/game-starlight.jpg', 'Crystals', 'Player ID', 'text', 4, 24, 'Found in the account panel.', true, 'Server', 3),
 ('Iron Vanguard', 'iron-vanguard', 'Shooter', '/images/game-iron.jpg', 'Credits', 'Commander ID', 'numeric', 6, 14, 'Open your commander card to see the ID.', false, 'Server', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT g.id, v.label, v.amount, v.price, v.bonus, v.pop, v.so
FROM public.games g
JOIN (VALUES
 ('86 ' , 86, 99.00, NULL, false, 1),
 ('172 ', 172, 189.00, '+8 bonus', false, 2),
 ('257 ', 257, 279.00, '+15 bonus', true, 3),
 ('706 ', 706, 749.00, '+60 bonus', false, 4),
 ('1412 ', 1412, 1489.00, '+140 bonus', false, 5),
 ('3688 ', 3688, 3799.00, '+400 bonus', false, 6)
) AS v(label, amount, price, bonus, pop, so) ON true
WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.game_id = g.id);

UPDATE public.packages p SET label = p.label || g.currency_label
FROM public.games g WHERE g.id = p.game_id AND p.label LIKE '% ';

INSERT INTO public.banners (title, subtitle, badge, image_url, game_id, sort_order)
SELECT v.title, v.subtitle, v.badge, v.img, g.id, v.so
FROM (VALUES
 ('Aether Clash Season 12', 'Instant diamond top-ups, delivered in seconds', 'Featured', '/images/banner-aether.jpg', 'aether-clash', 1),
 ('Neon Drift Turbo Pass', 'Grab bonus chips on every recharge', 'Hot', '/images/banner-neon.jpg', 'neon-drift', 2),
 ('Starlight Saga Festival', 'Limited crystal bundles with extra rewards', 'New', '/images/banner-starlight.jpg', 'starlight-saga', 3)
) AS v(title, subtitle, badge, img, slug, so)
JOIN public.games g ON g.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM public.banners b WHERE b.title = v.title);
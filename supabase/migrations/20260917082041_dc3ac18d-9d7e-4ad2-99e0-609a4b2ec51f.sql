INSERT INTO public.admin_invites (email)
SELECT 'moobit_69@moobit.app'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_invites WHERE lower(email) = 'moobit_69@moobit.app');

INSERT INTO public.games (name, slug, category, cover_url, currency_label, id_label, id_kind, id_min_len, id_max_len, id_help, requires_server_id, server_label, sort_order)
VALUES
 ('Aether Clash', 'aether-clash', 'MOBA', '/images/game-aether.jpg', 'Diamonds', 'User ID (UID)', 'numeric', 6, 12, 'Tap your avatar in game — the UID is under your name.', true, 'Zone ID', 1),
 ('Neon Drift', 'neon-drift', 'Racing', '/images/game-neon.jpg', 'Chips', 'Racer ID', 'numeric', 6, 12, 'Profile > Settings > Racer ID', false, 'Server', 2),
 ('Starlight Saga', 'starlight-saga', 'RPG', '/images/game-starlight.jpg', 'Crystals', 'Player ID', 'text', 4, 24, 'Found in the account panel.', true, 'Server', 3),
 ('Iron Vanguard', 'iron-vanguard', 'Shooter', '/images/game-iron.jpg', 'Credits', 'Commander ID', 'numeric', 6, 14, 'Open your commander card to see the ID.', false, 'Server', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.packages (game_id, label, amount, price, bonus_text, is_popular, sort_order)
SELECT g.id, v.label || g.currency_label, v.amount, v.price, v.bonus, v.pop, v.so
FROM public.games g
JOIN (VALUES
 ('86 ', 86, 99.00, NULL, false, 1),
 ('172 ', 172, 189.00, '+8 bonus', false, 2),
 ('257 ', 257, 279.00, '+15 bonus', true, 3),
 ('706 ', 706, 749.00, '+60 bonus', false, 4),
 ('1412 ', 1412, 1489.00, '+140 bonus', false, 5),
 ('3688 ', 3688, 3799.00, '+400 bonus', false, 6)
) AS v(label, amount, price, bonus, pop, so) ON true
WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.game_id = g.id);

INSERT INTO public.banners (title, subtitle, badge, image_url, game_id, sort_order)
SELECT v.title, v.subtitle, v.badge, v.img, g.id, v.so
FROM (VALUES
 ('Aether Clash Season 12', 'Instant diamond top-ups, delivered in seconds', 'Featured', '/images/banner-aether.jpg', 'aether-clash', 1),
 ('Neon Drift Turbo Pass', 'Grab bonus chips on every recharge', 'Hot', '/images/banner-neon.jpg', 'neon-drift', 2),
 ('Starlight Saga Festival', 'Limited crystal bundles with extra rewards', 'New', '/images/banner-starlight.jpg', 'starlight-saga', 3)
) AS v(title, subtitle, badge, img, slug, so)
JOIN public.games g ON g.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM public.banners b WHERE b.title = v.title);
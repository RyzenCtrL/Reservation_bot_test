-- Run this once after schema.sql, in the same query editor, to load starter data.

INSERT INTO services (id, name, emoji, price, duration_min, description) VALUES
  ('haircut-women', 'Женская стрижка', '💇‍♀️', 2200, 60, 'Стрижка любой сложности + укладка'),
  ('haircut-men', 'Мужская стрижка', '💈', 1500, 45, 'Стрижка машинкой и ножницами, оформление бороды'),
  ('coloring', 'Окрашивание', '🎨', 4500, 120, 'Однотонное окрашивание, тонирование, омбре'),
  ('manicure', 'Маникюр', '💅', 1800, 90, 'Классический или аппаратный маникюр с покрытием'),
  ('pedicure', 'Педикюр', '🦶', 2400, 90, 'Аппаратный педикюр с покрытием гель-лак'),
  ('beard', 'Оформление бороды', '🧔', 900, 30, 'Стрижка и моделирование бороды, горячее полотенце'),
  ('brows', 'Брови', '✨', 1200, 40, 'Коррекция формы и окрашивание бровей')
ON CONFLICT (id) DO NOTHING;

INSERT INTO masters (id, name, specialization, initials, color, rating) VALUES
  ('irina', 'Ирина', 'Топ-стилист, окрашивание', 'ИР', '#d9a8ff', 4.9),
  ('anna', 'Анна', 'Ногтевой сервис', 'АН', '#ff9fd6', 4.8),
  ('maxim', 'Максим', 'Барбер', 'МА', '#8ec9ff', 5.0),
  ('sofia', 'София', 'Стрижки, укладки', 'СО', '#ffcf8e', 4.7),
  ('denis', 'Денис', 'Барбер, окрашивание', 'ДЕ', '#9fffcf', 4.9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO master_services (master_id, service_id) VALUES
  ('irina', 'haircut-women'), ('irina', 'coloring'), ('irina', 'brows'),
  ('anna', 'manicure'), ('anna', 'pedicure'),
  ('maxim', 'haircut-men'), ('maxim', 'beard'),
  ('sofia', 'haircut-women'), ('sofia', 'brows'),
  ('denis', 'haircut-men'), ('denis', 'beard'), ('denis', 'coloring')
ON CONFLICT DO NOTHING;

-- Schéma initial des commentaires anonymes de Mon Skyblog.
--
-- `page` est le chemin du billet (ex. `/blog/mon-article/`) ; `message` est
-- stocké en texte brut et restitué tel quel en JSON (le frontend utilise
-- textContent). Aucune adresse IP ni adresse email n'est stockée ici : seule
-- une empreinte (`ip_hash`) sert au rate limit, dans `rate_limits`.

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  author TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_page
  ON comments (page, hidden, created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT PRIMARY KEY,
  last_post INTEGER NOT NULL
);

// Préfixe un chemin interne avec le `base` d'Astro (`import.meta.env.BASE_URL`).
// Exemple : en page de projet GitHub Pages montée sur `/skyblog`,
// `withBase('/blog/mon-article/')` renvoie `/skyblog/blog/mon-article/`,
// tandis qu'à la racine (`base = '/'`) il renvoie `/blog/mon-article/`.
export function withBase(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

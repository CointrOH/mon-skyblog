// En mode legacy, `entry.id` est le chemin du fichier dans la collection
// (extension comprise). On le transforme en slug d'URL historique :
// segments minuscules, sans accents, séparés par des tirets.
export function entryIdToSlug(id: string): string {
  return id
    .replace(/\.(md|mdx|markdown)$/i, '')
    .split('/')
    .map((segment) =>
      segment
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .join('/')
    .replace(/\/index$/, '');
}

/**
 * Plugin rehype : rend « base-aware » les chemins absolus écrits en Markdown.
 *
 * Decap CMS insère les médias avec un chemin absolu (`/images/uploads/...`) et
 * les rédacteurs peuvent écrire des liens internes absolus (`/blog/...`). Ces
 * chemins ne sont valides qu'à la racine du site. Lorsque le site est publié
 * dans un sous-dossier GitHub Pages (`base = '/mon-skyblog'`), il faut les
 * préfixer par la base, sans toucher aux URL externes, aux ancres, aux chemins
 * déjà préfixés ni aux protocoles (`https:`, `mailto:`, etc.).
 *
 * Le préfixage est fait au rendu : le Markdown stocké dans le dépôt garde des
 * chemins portables, et le même contenu fonctionne à la racine (`base = '/'`)
 * comme dans un sous-dossier.
 */

function walk(node, fn) {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, fn);
  }
}

function prefixPath(value, prefix) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  // URL externes, protocoles (mailto:, tel:), ancres, chemins relatifs : intacts.
  if (!value.startsWith('/')) return undefined;
  if (value.startsWith('//')) return undefined;
  // Déjà préfixé par la base : ne pas doubler.
  if (value === prefix || value.startsWith(`${prefix}/`)) return undefined;
  return `${prefix}${value}`;
}

export function rehypeBasePath({ base = '/' } = {}) {
  const prefix = base === '/' ? '' : base.replace(/\/+$/, '');
  return (tree) => {
    if (!prefix) return;
    walk(tree, (node) => {
      if (node.type !== 'element' || !node.properties) return;
      if (node.tagName === 'img') {
        const next = prefixPath(node.properties.src, prefix);
        if (next) node.properties.src = next;
      } else if (node.tagName === 'a') {
        const next = prefixPath(node.properties.href, prefix);
        if (next) node.properties.href = next;
      }
    });
  };
}

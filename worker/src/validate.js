// Fonctions pures de validation, partagées par le Worker et les tests.
//
// Les messages sont stockés en texte brut : ce module ne fait aucune
// transformation HTML. Le frontend doit les afficher avec `textContent`.

const PAGE_MAX_LENGTH = 200;
const AUTHOR_MIN_LENGTH = 2;
const AUTHOR_MAX_LENGTH = 40;
const MESSAGE_MIN_LENGTH = 2;
const MESSAGE_MAX_LENGTH = 2000;
const MAX_LINKS = 2;

// Espaces (y compris Unicode) et caractères de contrôle C0 + DEL.
const PAGE_FORBIDDEN_RE = /[\s\u0000-\u001F\u007F-\u009F]/;
// Contrôles interdits dans un pseudo (retour à la ligne, tabulation, etc.).
const AUTHOR_FORBIDDEN_RE = /[\u0000-\u001F\u007F-\u009F]/;
// Contrôles retirés d'un message : tout sauf \t (0x09) et \n (0x0A).
const MESSAGE_CONTROL_RE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
const URL_RE = /https?:\/\//gi;

/**
 * Valide un chemin de page.
 * @param {unknown} value
 * @returns {string|null} le chemin nettoyé, ou null s'il est invalide.
 */
export function normalizePage(value) {
  if (typeof value !== 'string') return null;
  const page = value.trim();
  if (page.length === 0 || page.length > PAGE_MAX_LENGTH) return null;
  if (!page.startsWith('/')) return null;
  if (PAGE_FORBIDDEN_RE.test(page)) return null;
  return page;
}

/**
 * Valide un pseudo : 2 à 40 caractères, sans caractère de contrôle.
 * @param {unknown} value
 * @returns {{ ok: boolean, value: string|null, error: string }}
 */
export function validateAuthor(value) {
  if (typeof value !== 'string') {
    return { ok: false, value: null, error: 'Le pseudo est requis.' };
  }
  const author = value.trim();
  if (author.length === 0) {
    return { ok: false, value: null, error: 'Le pseudo est requis.' };
  }
  if (AUTHOR_FORBIDDEN_RE.test(author)) {
    return {
      ok: false,
      value: null,
      error: 'Le pseudo contient des caractères non autorisés.',
    };
  }
  const length = [...author].length;
  if (length < AUTHOR_MIN_LENGTH) {
    return {
      ok: false,
      value: null,
      error: `Le pseudo doit faire au moins ${AUTHOR_MIN_LENGTH} caractères.`,
    };
  }
  if (length > AUTHOR_MAX_LENGTH) {
    return {
      ok: false,
      value: null,
      error: `Le pseudo ne doit pas dépasser ${AUTHOR_MAX_LENGTH} caractères.`,
    };
  }
  return { ok: true, value: author, error: '' };
}

/**
 * Valide un message : 2 à 2000 caractères. Les retours à la ligne et
 * tabulations sont conservés, les autres caractères de contrôle retirés.
 * @param {unknown} value
 * @returns {{ ok: boolean, value: string|null, error: string }}
 */
export function validateMessage(value) {
  if (typeof value !== 'string') {
    return { ok: false, value: null, error: 'Le message est requis.' };
  }
  const message = value.replace(MESSAGE_CONTROL_RE, '').trim();
  if (message.length === 0) {
    return { ok: false, value: null, error: 'Le message est requis.' };
  }
  const length = [...message].length;
  if (length < MESSAGE_MIN_LENGTH) {
    return {
      ok: false,
      value: null,
      error: `Le message doit faire au moins ${MESSAGE_MIN_LENGTH} caractères.`,
    };
  }
  if (length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      value: null,
      error: `Le message ne doit pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
    };
  }
  return { ok: true, value: message, error: '' };
}

/**
 * Compte les occurrences de `http://` et `https://` (insensible à la casse).
 * @param {unknown} value
 * @returns {number}
 */
export function countLinks(value) {
  if (typeof value !== 'string') return 0;
  const matches = value.match(URL_RE);
  return matches ? matches.length : 0;
}

/**
 * Détecte le honeypot : le champ caché `website` doit rester vide.
 * Une valeur non textuelle (objet, nombre…) est considérée comme suspecte.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isHoneypot(value) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'string') return true;
  return value.trim().length > 0;
}

/**
 * Comparaison à temps constant (pas de sortie anticipée sur le contenu).
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const maxLength = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

/**
 * Réponse JSON avec les en-têtes de sécurité imposés par le Worker.
 * @param {unknown} data
 * @param {number} [status]
 * @param {Record<string, string>} [extraHeaders]
 * @returns {Response}
 */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data ?? null), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders,
    },
  });
}

/**
 * En-têtes CORS pour une origine autorisée ; objet vide sinon.
 * @param {string|null} origin
 * @param {string|string[]|null|undefined} allowedOrigins
 * @returns {Record<string, string>}
 */
export function corsHeaders(origin, allowedOrigins) {
  if (typeof origin !== 'string' || origin.trim() === '') return {};
  const configured = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : String(allowedOrigins ?? '').split(',');
  const allowed = configured.map((entry) => String(entry).trim()).filter(Boolean);
  if (!allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const LIMITS = Object.freeze({
  MAX_LINKS,
  PAGE_MAX_LENGTH,
  AUTHOR_MIN_LENGTH,
  AUTHOR_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  MESSAGE_MAX_LENGTH,
});

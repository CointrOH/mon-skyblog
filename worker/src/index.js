// Worker des commentaires anonymes de Mon Skyblog.
//
// Routes :
//   OPTIONS *                 → 204 (préflight CORS)
//   GET     /health           → { ok: true }
//   GET     /comments?page=/… → { comments: [...] } (visibles, plus anciens d'abord)
//   POST    /comments         → { comment: {...} } (Turnstile + honeypot + rate limit)
//   DELETE  /comments/:id     → 204 (admin, Authorization: Bearer <ADMIN_TOKEN>)
//
// Aucune IP brute n'est stockée ni journalisée : l'IP ne sert qu'au `remoteip`
// de Turnstile et à une empreinte SHA-256 éphémère pour le rate limit.

import {
  constantTimeEqual,
  corsHeaders,
  countLinks,
  isHoneypot,
  json,
  normalizePage,
  validateAuthor,
  validateMessage,
} from './validate.js';

const MAX_BODY_CHARS = 10_000;
const MAX_LINKS = 2;
const MAX_COMMENTS_CAP = 500;
const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;
const TURNSTILE_SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// Un POST ne doit pas rester bloqué si Cloudflare ne répond pas : au-delà de
// ce délai, la vérification est considérée comme un échec (refus).
const TURNSTILE_TIMEOUT_MS = 5000;

const SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
});

function parsePositiveInt(rawValue, fallback) {
  const value = Number.parseInt(rawValue ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '') || '/';
  }
  return pathname;
}

function noContent(status, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: { ...SECURITY_HEADERS, ...extraHeaders },
  });
}

// Purge les empreintes de rate limit expirées (> 24 h). Silencieuse : elle ne
// doit jamais faire échouer une requête ni journaliser de donnée, et reste
// opportuniste après un POST comme planifiée par le Cron Trigger.
function purgeStaleRateLimits(env, now) {
  try {
    return env.DB.prepare('DELETE FROM rate_limits WHERE last_post < ?')
      .bind(now - RATE_LIMIT_RETENTION_MS)
      .run()
      .catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchWithTimeout(url, init, timeoutMs) {
  if (
    typeof AbortSignal !== 'undefined' &&
    typeof AbortSignal.timeout === 'function'
  ) {
    return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  }

  // Repli pour les runtimes sans AbortSignal.timeout : course simple.
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error('turnstile verification timeout')),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([fetch(url, init), timeout]);
  } finally {
    clearTimeout(timerId);
  }
}

async function verifyTurnstile(secret, token, remoteIp) {
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  try {
    const response = await fetchWithTimeout(
      TURNSTILE_SITEVERIFY_URL,
      { method: 'POST', body: form },
      TURNSTILE_TIMEOUT_MS,
    );
    if (!response.ok) return false;
    const result = await response.json();
    return result?.success === true;
  } catch {
    // Panne réseau, timeout ou réponse illisible : on refuse la publication.
    return false;
  }
}

async function handleGetComments(request, env, url, cors) {
  const page = normalizePage(url.searchParams.get('page'));
  if (page === null) {
    return json({ error: 'Paramètre « page » invalide.' }, 400, cors);
  }

  const limit = Math.min(
    parsePositiveInt(env.MAX_COMMENTS, 200),
    MAX_COMMENTS_CAP,
  );

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, author, message, created_at FROM comments WHERE page = ? AND hidden = 0 ORDER BY created_at ASC LIMIT ?',
    )
      .bind(page, limit)
      .all();
    return json({ comments: results ?? [] }, 200, cors);
  } catch {
    return json({ error: 'Erreur interne du serveur.' }, 500, cors);
  }
}

async function handlePostComment(request, env, ctx, cors) {
  const origin = request.headers.get('Origin');
  const corsAllowed = Object.hasOwn(cors, 'Access-Control-Allow-Origin');
  if (origin !== null && !corsAllowed) {
    // Origine refusée : pas d'en-tête CORS dans la réponse.
    return json({ error: 'Origine non autorisée.' }, 403);
  }

  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_CHARS) {
    return json({ error: 'Requête trop volumineuse.' }, 413, cors);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_CHARS) {
    return json({ error: 'Requête trop volumineuse.' }, 413, cors);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400, cors);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Corps JSON invalide.' }, 400, cors);
  }

  // Honeypot : réponse factice, aucune insertion, rien n'est révélé au bot.
  if (isHoneypot(body.website)) {
    return json({ ok: true }, 201, cors);
  }

  const page = normalizePage(body.page);
  if (page === null) {
    return json({ error: 'Paramètre « page » invalide.' }, 400, cors);
  }

  const author = validateAuthor(body.author);
  if (!author.ok) {
    return json({ error: author.error }, 400, cors);
  }

  const message = validateMessage(body.message);
  if (!message.ok) {
    return json({ error: message.error }, 400, cors);
  }

  if (countLinks(message.value) > MAX_LINKS) {
    return json(
      { error: `Le message ne doit pas contenir plus de ${MAX_LINKS} liens.` },
      400,
      cors,
    );
  }

  const turnstileSecret = env.TURNSTILE_SECRET;
  if (typeof turnstileSecret !== 'string' || turnstileSecret === '') {
    return json(
      { error: "Le service anti-robot n'est pas configuré." },
      503,
      cors,
    );
  }

  const turnstileToken =
    typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';
  if (turnstileToken === '' || turnstileToken.length > 4096) {
    return json(
      { error: 'Vérification anti-robot manquante ou invalide.' },
      400,
      cors,
    );
  }

  const remoteIp = request.headers.get('CF-Connecting-IP') || '';
  const humanVerified = await verifyTurnstile(
    turnstileSecret,
    turnstileToken,
    remoteIp,
  );
  if (!humanVerified) {
    return json(
      { error: 'Vérification anti-robot échouée. Réessayez.' },
      400,
      cors,
    );
  }

  const now = Date.now();
  const rateLimitMs =
    Math.max(1, parsePositiveInt(env.RATE_LIMIT_SECONDS, 30)) * 1000;
  const utcDay = new Date(now).toISOString().slice(0, 10);
  const ipHash = await sha256Hex(
    `${remoteIp || 'unknown'}|${utcDay}|${turnstileSecret}`,
  );

  try {
    const rateRow = await env.DB.prepare(
      'SELECT last_post FROM rate_limits WHERE ip_hash = ?',
    )
      .bind(ipHash)
      .first();

    if (rateRow && Number(rateRow.last_post) > now - rateLimitMs) {
      const retryAfter = Math.max(
        1,
        Math.ceil((Number(rateRow.last_post) + rateLimitMs - now) / 1000),
      );
      return json(
        { error: 'Patientez avant de publier un nouveau commentaire.' },
        429,
        { ...cors, 'Retry-After': String(retryAfter) },
      );
    }

    await env.DB.prepare(
      'INSERT INTO rate_limits (ip_hash, last_post) VALUES (?, ?) ON CONFLICT(ip_hash) DO UPDATE SET last_post = excluded.last_post',
    )
      .bind(ipHash, now)
      .run();

    const cleanup = purgeStaleRateLimits(env, now);
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(cleanup);
    } else {
      await cleanup;
    }

    const createdAt = Date.now();
    const inserted = await env.DB.prepare(
      'INSERT INTO comments (page, author, message, created_at) VALUES (?, ?, ?, ?)',
    )
      .bind(page, author.value, message.value, createdAt)
      .run();

    return json(
      {
        comment: {
          id: inserted?.meta?.last_row_id ?? null,
          author: author.value,
          message: message.value,
          created_at: createdAt,
        },
      },
      201,
      cors,
    );
  } catch {
    return json({ error: 'Erreur interne du serveur.' }, 500, cors);
  }
}

async function handleDeleteComment(request, env, commentId, cors) {
  const adminToken = typeof env.ADMIN_TOKEN === 'string' ? env.ADMIN_TOKEN : '';
  const authorization = (request.headers.get('Authorization') || '').trim();
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  const providedToken = bearerMatch ? bearerMatch[1].trim() : '';

  if (
    adminToken === '' ||
    providedToken === '' ||
    !constantTimeEqual(providedToken, adminToken)
  ) {
    return json({ error: 'Non autorisé.' }, 401, cors);
  }

  if (!Number.isSafeInteger(commentId) || commentId <= 0) {
    return json({ error: 'Identifiant invalide.' }, 400, cors);
  }

  try {
    const result = await env.DB.prepare('DELETE FROM comments WHERE id = ?')
      .bind(commentId)
      .run();
    if (!result?.meta?.changes) {
      return json({ error: 'Commentaire introuvable.' }, 404, cors);
    }
    return noContent(204, cors);
  } catch {
    return json({ error: 'Erreur interne du serveur.' }, 500, cors);
  }
}

async function route(request, env, ctx) {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

  if (request.method === 'OPTIONS') {
    return noContent(204, cors);
  }

  if (request.method === 'GET' && path === '/health') {
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET' && path === '/comments') {
    return handleGetComments(request, env, url, cors);
  }

  if (request.method === 'POST' && path === '/comments') {
    return handlePostComment(request, env, ctx, cors);
  }

  const deleteMatch = /^\/comments\/([0-9]+)$/.exec(path);
  if (request.method === 'DELETE' && deleteMatch) {
    return handleDeleteComment(request, env, Number(deleteMatch[1]), cors);
  }

  return json({ error: 'Route inconnue.' }, 404, cors);
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch {
      // Journalisation volontairement minimale : ni message ni IP.
      console.error('[mon-skyblog-comments] erreur interne');
      const cors = corsHeaders(
        request.headers.get('Origin'),
        env?.ALLOWED_ORIGINS,
      );
      return json({ error: 'Erreur interne du serveur.' }, 500, cors);
    }
  },

  // Cron Trigger horaire : garantit la purge des hashes d'IP au-delà de 24 h,
  // même si aucun commentaire n'est publié entre-temps.
  async scheduled(event, env, ctx) {
    const cleanup = purgeStaleRateLimits(env, Date.now());
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(cleanup);
    } else {
      await cleanup;
    }
  },
};

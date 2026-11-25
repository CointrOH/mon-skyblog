import test from 'node:test';
import assert from 'node:assert/strict';

import {
  constantTimeEqual,
  corsHeaders,
  countLinks,
  isHoneypot,
  json,
  normalizePage,
  validateAuthor,
  validateMessage,
} from '../src/validate.js';

test('normalizePage accepte un chemin simple et le nettoie', () => {
  assert.equal(normalizePage('/'), '/');
  assert.equal(normalizePage('/blog/mon-article/'), '/blog/mon-article/');
  assert.equal(normalizePage('  /blog/article/?x=1  '), '/blog/article/?x=1');
});

test('normalizePage refuse les valeurs non textuelles ou vides', () => {
  for (const value of [undefined, null, 42, {}, [], '']) {
    assert.equal(normalizePage(value), null);
  }
  assert.equal(normalizePage('   '), null);
});

test('normalizePage exige un chemin commençant par /', () => {
  assert.equal(normalizePage('blog/article'), null);
  assert.equal(normalizePage('https://exemple.test/'), null);
  assert.equal(normalizePage('./relatif'), null);
});

test('normalizePage refuse espaces et caractères de contrôle', () => {
  assert.equal(normalizePage('/blog/mon article'), null);
  assert.equal(normalizePage('/blog/arti\ncle'), null);
  assert.equal(normalizePage('/blog/arti\u0000cle'), null);
  assert.equal(normalizePage('/blog/arti\tcle'), null);
  // Le trim est appliqué avant la validation : un saut de ligne final disparaît.
  assert.equal(normalizePage('/blog/article\n'), '/blog/article');
});

test('normalizePage applique la limite de 200 caractères', () => {
  const maxLengthPage = `/${'a'.repeat(199)}`;
  const tooLongPage = `/${'a'.repeat(200)}`;
  assert.equal(maxLengthPage.length, 200);
  assert.equal(normalizePage(maxLengthPage), maxLengthPage);
  assert.equal(normalizePage(tooLongPage), null);
});

test('validateAuthor accepte un pseudo valide et le trim', () => {
  assert.deepEqual(validateAuthor('  Alice  '), {
    ok: true,
    value: 'Alice',
    error: '',
  });
  assert.deepEqual(validateAuthor('Al'), { ok: true, value: 'Al', error: '' });
  assert.equal(validateAuthor('a'.repeat(40)).ok, true);
});

test('validateAuthor refuse vide, trop court ou trop long', () => {
  for (const value of [undefined, null, 42, '', '   ']) {
    const result = validateAuthor(value);
    assert.equal(result.ok, false);
    assert.equal(result.value, null);
    assert.match(result.error, /pseudo/i);
  }
  assert.equal(validateAuthor('A').ok, false);
  assert.equal(validateAuthor('a'.repeat(41)).ok, false);
});

test('validateAuthor refuse les caractères de contrôle', () => {
  assert.equal(validateAuthor('Ali\nce').ok, false);
  assert.equal(validateAuthor('Ali\tce').ok, false);
  assert.equal(validateAuthor('Ali\u0000ce').ok, false);
  assert.equal(validateAuthor('Ali\u0085ce').ok, false);
});

test('validateMessage accepte un message valide et le trim', () => {
  assert.deepEqual(validateMessage('  Bonjour !  '), {
    ok: true,
    value: 'Bonjour !',
    error: '',
  });
  assert.equal(validateMessage('a'.repeat(2000)).ok, true);
});

test('validateMessage refuse vide, trop court ou trop long', () => {
  for (const value of [undefined, null, 42, '', '   ', 'a']) {
    const result = validateMessage(value);
    assert.equal(result.ok, false);
    assert.equal(result.value, null);
    assert.match(result.error, /message/i);
  }
  assert.equal(validateMessage('a'.repeat(2001)).ok, false);
});

test('validateMessage conserve \\n et \\t mais retire les autres contrôles', () => {
  const result = validateMessage('Ligne 1\nLigne 2\tfin\u0000\u0007');
  assert.equal(result.ok, true);
  assert.equal(result.value, 'Ligne 1\nLigne 2\tfin');
  assert.equal(validateMessage('a\r\nb').value, 'a\nb');
  assert.equal(validateMessage('a\u0085b').value, 'ab');
});

test('validateMessage refuse un message composé uniquement de contrôles', () => {
  assert.equal(validateMessage('\u0000\u0001\u0002').ok, false);
  assert.equal(validateMessage('\n\t').ok, false);
});

test("validateMessage ne filtre pas le HTML (le frontend utilise textContent)", () => {
  const result = validateMessage('<script>alert(1)</script>');
  assert.equal(result.ok, true);
  assert.equal(result.value, '<script>alert(1)</script>');
});

test('countLinks compte les URLs http(s), insensible à la casse', () => {
  assert.equal(countLinks('aucun lien'), 0);
  assert.equal(countLinks('voir https://exemple.test'), 1);
  assert.equal(countLinks('http://a.test et https://b.test'), 2);
  assert.equal(countLinks('HTTPS://A.TEST HTTP://B.TEST https://c.test'), 3);
  assert.equal(countLinks('https://a.test https://a.test'), 2);
});

test('countLinks tolère les valeurs non textuelles', () => {
  for (const value of [undefined, null, 42, {}]) {
    assert.equal(countLinks(value), 0);
  }
});

test('isHoneypot détecte un champ website rempli', () => {
  assert.equal(isHoneypot(undefined), false);
  assert.equal(isHoneypot(null), false);
  assert.equal(isHoneypot(''), false);
  assert.equal(isHoneypot('   '), false);
  assert.equal(isHoneypot('https://spam.test'), true);
  assert.equal(isHoneypot('bot'), true);
  assert.equal(isHoneypot(42), true);
});

test('constantTimeEqual compare correctement les chaînes', () => {
  assert.equal(constantTimeEqual('secret-token', 'secret-token'), true);
  assert.equal(constantTimeEqual('secret-token', 'secret-tokeN'), false);
  assert.equal(constantTimeEqual('secret', 'secret-plus-long'), false);
  assert.equal(constantTimeEqual('', ''), true);
});

test('constantTimeEqual refuse les valeurs non textuelles', () => {
  assert.equal(constantTimeEqual(null, 'secret'), false);
  assert.equal(constantTimeEqual('secret', undefined), false);
  assert.equal(constantTimeEqual(42, 42), false);
});

test('json ajoute les en-têtes de sécurité et le statut', async () => {
  const response = json({ ok: true }, 201, { 'X-Test': '1' });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-test'), '1');
  assert.deepEqual(await response.json(), { ok: true });
});

test('corsHeaders autorise uniquement les origines de la liste', () => {
  const allowedOrigins =
    'https://cointroh.github.io,http://localhost:4321,http://127.0.0.1:4321';

  const allowed = corsHeaders('http://localhost:4321', allowedOrigins);
  assert.equal(allowed['Access-Control-Allow-Origin'], 'http://localhost:4321');
  assert.match(allowed['Access-Control-Allow-Methods'], /POST/);
  assert.match(allowed['Access-Control-Allow-Headers'], /Content-Type/);

  assert.deepEqual(corsHeaders('https://evil.test', allowedOrigins), {});
  assert.deepEqual(corsHeaders(null, allowedOrigins), {});
  assert.deepEqual(corsHeaders('', allowedOrigins), {});
});

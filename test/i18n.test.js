import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, LOCALES, MESSAGES, detectLocale, fromLocaleSan, tagLabel, toLocaleSan, translate } from '../src/i18n.js';

test('toLocaleSan shows Danish piece letters in Danish and keeps English otherwise', () => {
  assert.equal(toLocaleSan('Nf3', 'da'), 'Sf3');
  assert.equal(toLocaleSan('Bb5', 'da'), 'Lb5');
  assert.equal(toLocaleSan('Qxd5+', 'da'), 'Dxd5+');
  assert.equal(toLocaleSan('e8=Q#', 'da'), 'e8=D#');
  assert.equal(toLocaleSan('O-O', 'da'), 'O-O');
  assert.equal(toLocaleSan('exd5', 'da'), 'exd5');
  assert.equal(toLocaleSan('Nf3', 'en'), 'Nf3');
});

test('fromLocaleSan accepts Danish piece letters and returns English SAN', () => {
  assert.equal(fromLocaleSan('Sf3'), 'Nf3');
  assert.equal(fromLocaleSan('Dxd5+'), 'Qxd5+');
  assert.equal(fromLocaleSan('e8=D'), 'e8=Q');
  assert.equal(fromLocaleSan('exd5'), 'exd5');
});

test('toLocaleSan shows figurines in the moving side colour, also for English', () => {
  assert.equal(toLocaleSan('Nf3', 'en', { figurine: true, color: 'w' }), '♘f3');
  assert.equal(toLocaleSan('Nf6', 'da', { figurine: true, color: 'b' }), '♞f6');
  assert.equal(toLocaleSan('e8=Q#', 'en', { figurine: true, color: 'w' }), 'e8=♕#');
  assert.equal(toLocaleSan('e4', 'da', { figurine: true, color: 'w' }), 'e4');
});

test('fromLocaleSan accepts figurines', () => {
  assert.equal(fromLocaleSan('♘f3'), 'Nf3');
  assert.equal(fromLocaleSan('e8=♕'), 'e8=Q');
});

test('translate fills in named parameters', () => {
  assert.equal(translate('en', 'pgn.illegalMove', { san: 'e4', fen: 'x' }), 'illegal move "e4" in position x');
  assert.equal(translate('da', 'pgn.illegalMove', { san: 'e4', fen: 'x' }), 'ugyldigt træk "e4" i stillingen x');
});

test('translate falls back to the default locale and then to the key', () => {
  assert.equal(translate('fr', 'viewer.empty'), MESSAGES.en['viewer.empty']);
  assert.equal(translate('en', 'missing.key'), 'missing.key');
});

test('tagLabel translates known extra tags and keeps unknown tag names as they are', () => {
  assert.equal(tagLabel('da', 'WhiteFideId'), 'Hvid FIDE-id');
  assert.equal(tagLabel('en', 'WhiteFideId'), 'White FIDE ID');
  assert.equal(tagLabel('en', 'SomeUnknownTag'), 'SomeUnknownTag');
});

test('detectLocale uses the language code and falls back to English', () => {
  assert.equal(detectLocale('da-DK'), 'da');
  assert.equal(detectLocale('en-GB'), 'en');
  assert.equal(detectLocale('fr-FR'), 'en');
  assert.equal(detectLocale(''), 'en');
});

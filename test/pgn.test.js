import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePgn, parseMoveText, recordMove } from '../src/pgn.js';

const SAMPLE = `[Event "Testturnering"]
[White "Hvid, Anna"]
[Black "Sort, Bo"]
[Result "1-0"]

1. e4 e5 {Klassisk svar} 2. Nf3 (2. f4 exf4 (2... d5)) 2... Nc6 $1 3. Bb5 1-0`;

test('parses headers, result and the main line', () => {
  const [game] = parsePgn(SAMPLE);
  assert.equal(game.headers.White, 'Hvid, Anna');
  assert.equal(game.headers.Event, 'Testturnering');
  assert.equal(game.result, '1-0');
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);
  assert.equal(game.line.moves[1].color, 'b');
  assert.equal(game.line.moves[2].moveNumber, 2);
});

test('accepts Danish piece letters and stores English SAN', () => {
  const [game] = parsePgn('1. e4 e5 2. Sf3 Nc6 3. Lb5 a6 4. La4 Sf6 5. O-O');
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O']);
});

test('attaches variations to the move they replace, including nested ones', () => {
  const [game] = parsePgn(SAMPLE);
  const nf3 = game.line.moves[2];
  assert.equal(nf3.variations.length, 1);
  const variation = nf3.variations[0];
  assert.equal(variation.startFen, nf3.fenBefore);
  assert.deepEqual(variation.moves.map((m) => m.san), ['f4', 'exf4']);
  assert.equal(variation.moves[0].variations.length, 0);
  const exf4 = variation.moves[1];
  assert.deepEqual(exf4.variations[0].moves.map((m) => m.san), ['d5']);
});

test('a FEN header sets the start position', () => {
  const fen = '8/P7/8/8/8/8/8/k6K w - - 0 1';
  const [game] = parsePgn(`[FEN "${fen}"]\n[SetUp "1"]\n\n1. a8=Q+ Kb2 *`);
  assert.equal(game.line.startFen, fen);
  assert.equal(game.line.moves[0].san, 'a8=Q+');
  assert.equal(game.result, '*');
});

test('splits multiple games in one file', () => {
  const games = parsePgn(`${SAMPLE}\n\n[Event "Anden"]\n\n1. d4 d5 0-1`);
  assert.equal(games.length, 2);
  assert.equal(games[1].headers.Event, 'Anden');
  assert.deepEqual(games[1].line.moves.map((m) => m.san), ['d4', 'd5']);
});

test('line comments and move annotations are ignored', () => {
  const [game] = parsePgn('1. e4! ; kommentar\n1... e5?!\n% linje\n*');
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5']);
});

test('an illegal move reports the move and the position', () => {
  assert.throws(() => parsePgn('1. e4 e4'), /illegal move "e4"/);
});

test('error messages follow the requested locale', () => {
  assert.throws(() => parsePgn('1. e4 e4', { locale: 'da' }), /ugyldigt træk "e4"/);
});

test('an unbalanced variation is rejected', () => {
  assert.throws(() => parsePgn('1. e4 (1. d4 e5'), /missing "\)"/);
  assert.throws(() => parsePgn('1. e4 ) e5'), /without a matching "\("/);
});

test('a variation without a preceding move is rejected', () => {
  assert.throws(() => parsePgn('(1. d4)'), /preceding move/);
});

test('parseMoveText reads a typed variation from a given position', () => {
  const start = parsePgn('1. e4 e5')[0].line.moves[0].fenBefore;
  const line = parseMoveText('1. e4 c5 (1... e6)', start);
  assert.equal(line.startFen, start);
  assert.deepEqual(line.moves.map((m) => m.san), ['e4', 'c5']);
  assert.equal(line.moves[1].variations[0].moves[0].san, 'e6');
});

test('a move that continues the line is appended', () => {
  const [game] = parsePgn('1. e4 e5');
  const result = recordMove(game.line, 2, 'Nf3');
  assert.equal(result.line, game.line);
  assert.equal(result.ply, 3);
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5', 'Nf3']);
  assert.equal(game.line.moves[2].moveNumber, 2);
});

test('a different move in the middle becomes a variation of the move it replaces', () => {
  const [game] = parsePgn('1. e4 e5 2. Nf3 Nc6');
  const { line, ply } = recordMove(game.line, 2, 'Bc4');
  assert.equal(ply, 1);
  assert.equal(line.startFen, game.line.moves[2].fenBefore);
  assert.deepEqual(line.moves.map((m) => m.san), ['Bc4']);
  assert.equal(game.line.moves[2].variations[0], line);
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5', 'Nf3', 'Nc6']);
});

test('an alternative to the first move of a variation is a sibling of that variation', () => {
  const [game] = parsePgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6');
  const first = recordMove(game.line, 4, 'Bc4').line;
  const second = recordMove(first, 0, 'Bd3', { root: game.line }).line;
  assert.deepEqual(game.line.moves[4].variations.map((v) => v.moves[0].san), ['Bc4', 'Bd3']);
  assert.equal(game.line.moves[4].variations[1], second);
  assert.equal(first.moves[0].variations.length, 0);
});

test('an alternative to the first move of a free variation is a free variation next to it', () => {
  const [game] = parsePgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6');
  const free = parseMoveText('Bc4 Nf6', game.line.moves[4].fenBefore);
  const freeVariants = [free];
  const second = recordMove(free, 0, 'Bd3', { root: game.line, freeVariants }).line;
  assert.deepEqual(freeVariants.map((v) => v.moves[0].san), ['Bc4', 'Bd3']);
  assert.equal(freeVariants[1], second);
  assert.equal(free.moves[0].variations.length, 0);
  assert.equal(recordMove(free, 0, 'Bd3', { root: game.line, freeVariants }).line, second);
  assert.equal(freeVariants.length, 2);
});

test('playing an existing variation again reuses it', () => {
  const [game] = parsePgn('1. e4 e5 2. Nf3 Nc6');
  const first = recordMove(game.line, 2, 'Bc4').line;
  const again = recordMove(game.line, 2, 'Bc4');
  assert.equal(again.line, first);
  assert.equal(game.line.moves[2].variations.length, 1);
});

test('a move after the end of a finished game becomes an end variation', () => {
  const [game] = parsePgn('1. e4 e5 *');
  const { line, ply } = recordMove(game.line, 2, 'Nf3', { finished: true });
  assert.equal(ply, 1);
  assert.ok(line.startFen.startsWith('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w'));
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5']);
  assert.deepEqual(line.moves.map((m) => m.san), ['Nf3']);
  assert.equal(game.line.endVariations.length, 1);
  assert.equal(recordMove(game.line, 2, 'Nf3', { finished: true }).line, line);
  assert.equal(game.line.endVariations.length, 1);
});

test('a move after the end of an unfinished game still extends the line', () => {
  const [game] = parsePgn('1. e4 e5');
  recordMove(game.line, 2, 'Nf3', { finished: false });
  assert.deepEqual(game.line.moves.map((m) => m.san), ['e4', 'e5', 'Nf3']);
  assert.equal(game.line.endVariations, undefined);
});

test('playing the next move of the line just moves on', () => {
  const [game] = parsePgn('1. e4 e5');
  assert.deepEqual(recordMove(game.line, 0, 'e4'), { line: game.line, ply: 1 });
  assert.equal(game.line.moves.length, 2);
});

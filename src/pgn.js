import { Chess } from 'chess.js';
import { DEFAULT_LOCALE, fromLocaleSan, translate } from './i18n.js';

const TAG = /\[\s*(\w+)\s+"((?:[^"\\]|\\.)*)"\s*\]/y;
const RESULTS = new Set(['1-0', '0-1', '1/2-1/2', '*']);

function startChess(fen, locale) {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch {
    throw new Error(translate(locale, 'pgn.invalidFen', { fen }));
  }
}

// Parses a PGN text into games. Each game is { headers, result, line }, where
// line = { startFen, moves: [{ san, color, moveNumber, fenBefore, variations: [line] }] }.
// locale only sets the language of error messages.
export function parsePgn(text, { locale = DEFAULT_LOCALE } = {}) {
  const games = [];
  let game = null;
  let pos = 0;

  const fail = (key, params) => {
    const message = translate(locale, key, params);
    throw new Error(translate(locale, 'pgn.error', { message, position: pos }));
  };

  const begin = (target) => {
    if (target.stack) return;
    const chess = startChess(target.headers.FEN, locale);
    target.line = { startFen: chess.fen(), moves: [] };
    target.stack = [{ line: target.line, chess }];
  };

  const ensureGame = () => {
    if (!game) {
      game = { headers: {}, result: null, line: null, stack: null };
      games.push(game);
    }
    begin(game);
    return game;
  };

  while (pos < text.length) {
    const ch = text[pos];

    if (/\s/.test(ch)) {
      pos++;
    } else if (ch === '{') {
      const end = text.indexOf('}', pos);
      if (end === -1) fail('pgn.comment');
      pos = end + 1;
    } else if (ch === ';' || (ch === '%' && (pos === 0 || text[pos - 1] === '\n'))) {
      const end = text.indexOf('\n', pos);
      pos = end === -1 ? text.length : end + 1;
    } else if (ch === '[') {
      TAG.lastIndex = pos;
      const match = TAG.exec(text);
      if (!match) fail('pgn.tag');
      if (!game || game.stack) {
        game = { headers: {}, result: null, line: null, stack: null };
        games.push(game);
      }
      game.headers[match[1]] = match[2].replace(/\\(.)/g, '$1');
      pos = TAG.lastIndex;
    } else if (ch === '(') {
      pos++;
      const current = ensureGame();
      const last = current.stack.at(-1).line.moves.at(-1);
      if (!last) fail('pgn.variationStart');
      const line = { startFen: last.fenBefore, moves: [] };
      last.variations.push(line);
      current.stack.push({ line, chess: new Chess(last.fenBefore) });
    } else if (ch === ')') {
      pos++;
      if (!game?.stack || game.stack.length < 2) fail('pgn.unmatchedClose');
      game.stack.pop();
    } else {
      const start = pos;
      while (pos < text.length && !/[\s(){}[\];]/.test(text[pos])) pos++;
      const word = text.slice(start, pos);

      if (word.startsWith('$')) continue;

      if (RESULTS.has(word)) {
        const current = ensureGame();
        if (current.stack.length === 1) {
          current.result = word;
          game = null;
        }
        continue;
      }

      const san = word.replace(/^\d+\.+/, '').replace(/[!?]+$/, '');
      if (!san) continue;

      const current = ensureGame();
      const { chess, line } = current.stack.at(-1);
      const move = {
        san: null,
        color: chess.turn(),
        moveNumber: chess.moveNumber(),
        fenBefore: chess.fen(),
        variations: [],
      };
      try {
        move.san = chess.move(fromLocaleSan(san)).san;
      } catch {
        fail('pgn.illegalMove', { san, fen: move.fenBefore });
      }
      line.moves.push(move);
    }
  }

  for (const target of games) begin(target);
  const unclosed = games.find((target) => target.stack.length > 1);
  if (unclosed) throw new Error(translate(locale, 'pgn.unclosed'));

  return games.map(({ headers, result, line }) => ({ headers, result, line }));
}

// Parses bare move text (e.g. a variation typed by the user) from startFen.
export function parseMoveText(text, startFen, { locale } = {}) {
  const [game] = parsePgn(`[FEN "${startFen}"]\n${text}`, { locale });
  return game.line;
}

function fenAt(line, ply) {
  const chess = new Chess(line.startFen);
  for (const move of line.moves.slice(0, ply)) chess.move(move.san);
  return chess.fen();
}

// Returns the list that holds line as one of its alternatives (a move's variations or an end variation), or null.
function findAlternatives(node, line) {
  const lists = [...node.moves.map((move) => move.variations), node.endVariations ?? []];
  for (const list of lists) {
    if (list.includes(line)) return list;
    for (const variation of list) {
      const found = findAlternatives(variation, line);
      if (found) return found;
    }
  }
  return null;
}

// Compares the board part, side to move, castling and en passant, but not the move counters.
function samePosition(fenA, fenB) {
  return fenA.split(' ').slice(0, 4).join(' ') === fenB.split(' ').slice(0, 4).join(' ');
}

// Records a move played from position ply of line and returns the line and ply to show.
// The same move as the next one just moves on. A move that continues the line is appended,
// unless the game is finished: then a move after the last move becomes an end variation.
// Any other move becomes a variation of the next move, or reuses one that already exists.
// At the start of a variation, the alternative is a sibling of that variation: it is found under root,
// or it is added to freeVariants when the variation is a free variation typed from the board.
export function recordMove(line, ply, san, { finished = false, root = line, freeVariants = [] } = {}) {
  const next = line.moves[ply];
  if (next?.san === san) return { line, ply: ply + 1 };

  const fen = fenAt(line, ply);
  const [move] = parseMoveText(san, fen).moves;
  if (!next && !finished) {
    line.moves.push(move);
    return { line, ply: ply + 1 };
  }

  let alternatives = next ? next.variations : (line.endVariations ??= []);
  if (next && ply === 0) alternatives = findAlternatives(root, line) ?? (freeVariants.includes(line) ? freeVariants : alternatives);
  const existing = alternatives.find((variation) => variation.moves[0]?.san === san && samePosition(variation.startFen, fen));
  if (existing) return { line: existing, ply: 1 };

  const variation = { startFen: fen, moves: [move] };
  alternatives.push(variation);
  return { line: variation, ply: 1 };
}

// Removes the moves after ply of line, with their variations and the alternatives after the last move.
// Returns the set of lines that were removed, so the caller can forget them.
export function removeMovesAfter(line, ply) {
  const removed = line.moves.splice(ply);
  const detached = [...removed.flatMap((move) => move.variations), ...(line.endVariations ?? [])];
  delete line.endVariations;
  return collectLines(detached);
}

// Finds where target branches off below line: the line and ply it starts from, and the list that holds it.
export function findBranch(line, target) {
  const branches = [
    ...line.moves.map((move, ply) => ({ ply, list: move.variations })),
    { ply: line.moves.length, list: line.endVariations ?? [] },
  ];
  for (const { ply, list } of branches) {
    if (list.includes(target)) return { line, ply, list };
    for (const variation of list) {
      const found = findBranch(variation, target);
      if (found) return found;
    }
  }
  return null;
}

function collectLines(lines, found = new Set()) {
  for (const line of lines) {
    found.add(line);
    line.moves.forEach((move) => collectLines(move.variations, found));
    collectLines(line.endVariations ?? [], found);
  }
  return found;
}

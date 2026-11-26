# chess-pgn-nyp

A standalone app that shows a PGN file with its headers and game. Each move can be clicked, and the position is shown on a [chess-board-nyp](../chess-board-nyp) board. Variations (in parentheses) are shown as separate lines, or as indented bullets if you turn that on under the gear icon next to the game title. Under the same gear icon, move text can be shown with figurine symbols (♘ ♗ ♕ etc.) instead of letters. This is on by default. Both choices are remembered in the browser between page loads. Moves played on the board are recorded in the game: after the last move they are added to the main line, and a move made in the middle of the line becomes a variation.

## Getting started

```bash
npm install
npm run dev     # development
npm run build   # production (dist/)
npm test        # parser tests
```

## Usage

Install it from another project by pointing npm at this folder: `npm install <path>/chess-pgn-nyp`. The styles (CSS) are imported by the JavaScript files, so they come along when a bundler (e.g. Vite) builds the project. The styles are SCSS and are compiled by Vite, so the consuming project must install `sass` itself: `npm install -D sass`.

```js
import PgnViewer from 'chess-pgn-nyp';

const viewer = new PgnViewer(document.querySelector('#pgn-root'), { locale: 'da' });
viewer.setLocale('en');           // changes the language at runtime (viewer and board)
viewer.loadPgn(pgnText);          // loads all games in the text
viewer.showGame(0);               // selects a game (index)
viewer.showLine(line, ply);       // shows a line from parsing; ply is the move that should be current
viewer.addVariant('1. d4 d5 2. c4 (2. Nf3)'); // variation from the board's current position
viewer.board;                     // the ChessBoard instance
viewer.games;                     // parsed games
```

The size is controlled by the containing element: the board fills the width of the board column in `#pgn-root`. The board width can be set with the CSS variable `--board-column` (the demo in `src/main.js` sets it).

## Language

Supported languages are Danish (`da`) and English (`en`). The language is an application-level choice and cannot be changed in the board's settings.

- Without `locale`, the browser language (`navigator.language`) is used. Languages other than Danish fall back to English.
- `locale` in the constructor and `setLocale()` control both the viewer and the board. Unknown languages throw an error.
- Tags from the PGN file are shown unchanged. Move text uses the language's piece letters (Danish: K, D, T, L, S, e.g. `Sf3`, `Lb5`, `O-O`; English: K, Q, R, B, N, e.g. `Nf3`, `Bb5`, `O-O`), or figurine symbols (♘, ♗, ♕ etc.) when the "Show pieces as figurines" setting is on. Figurines are the default, and the choice is remembered in the browser. Download (PGN) is always in English, including `Event` and the file name.
- Variations can be typed with Danish or English piece letters, or with figurines, and PGN files are read in either notation.
- The example in `index.html` has a language selector that calls `setLocale()` and translates the page's own texts.

## Project structure

- `src/i18n.js` – translations (da/en), `detectLocale` and `translate`.
- `src/pgn.js` – PGN parser (`parsePgn`, `parseMoveText`). Pure logic, no DOM. Error messages follow `locale`.
- `src/PgnViewer.js` – shows headers, the move list and the board. The header shows Event/Site/Date/Round, players, Opening/ECO/Date/Eval and Result. Opening, ECO and Eval are read from the PGN file, and empty fields are hidden. Extra tags are shown behind the "Show more tags" button, with names translated to the current language (for example "Hvid FIDE-id" in Danish) for the common tags. Unknown tags are shown with their PGN name. The icon before the game in the move list shows the start position.
- `src/styles/pgn-viewer.scss` – styling, ported from `chessworkspace/frontend/src/styles/main.scss`.
- `src/main.js` – setup, example PGN, file selection and the variation form.

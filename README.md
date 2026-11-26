# chess-pgn-nyp

A standalone app that shows a PGN file with its headers and game. Each move can be clicked, and the position is shown on a [chess-board-nyp](../chess-board-nyp) board. Variations (in parentheses) are shown as separate lines, or as indented bullets if you turn that on under the gear icon next to the game title. Under the same gear icon, move text can be shown with figurine symbols (♘ ♗ ♕ etc.) instead of letters. This is on by default. The text size can be set from 80% to 160% under the gear icon, and also with the "Text size" slider on the demo page. The font can be chosen under the gear icon and on the demo page: default, serif (Georgia), Verdana or monospace. These choices are remembered in the browser between page loads. Moves played on the board are recorded in the game: after the last move they are added to the main line, and a move made in the middle of the line becomes a variation.

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
viewer.deleteMovesAfterPosition();  // removes the moves after the shown position, with their variations; returns the count
viewer.setTextScale(120);         // text size in percent (80-160, steps of 10); remembered in the browser
viewer.setFontFamily('serif');    // 'default', 'serif', 'verdana' or 'mono'; remembered in the browser
viewer.setMainLine(line, ply);    // shows a line without a PGN game (e.g. built by the page); ply defaults to the last move
viewer.setFigurine(true);         // figurine (♘) or letter (N) piece symbols; not saved in the browser
viewer.board;                     // the ChessBoard instance
viewer.games;                     // parsed games
```

The size is controlled by the containing element: the board fills the width of the board column in `#pgn-root`. The board width can be set with the CSS variable `--board-column` (the demo in `src/main.js` sets it). The text size is set with `setTextScale()` and is not changed by the board's own labels. The font is set with `setFontFamily()` and applies to the viewer's text.

The viewer dispatches a `textscalechange` event on `viewer.element` when the text size changes, with the new value in `event.detail.textScale`. It dispatches `fontfamilychange` in the same way, with `event.detail.fontFamily`.

The viewer dispatches a `pgnchange` event on `viewer.element` when the user adds a move on the board (`reason` `'move'`, `san` is the move) or when `deleteMovesAfterPosition()` is called (`reason` `'delete'`, `san` is `null`). `event.detail` also has `line` (the line shown, which is changed in place), `ply` (the current ply) and `fen` (the board position). The page can use it to save the game.

When a move in the move list is clicked, the viewer sets the position on its board and dispatches a bubbling `pgnnavigate` event on `viewer.element` with `event.detail` of `line`, `ply` and `fen`. A page can use it to update its own state (e.g. the selected move).

Moves can have an `evaluation` string (e.g. `'+0.35'`). It is shown as a small muted value after the move in the move list.

### Embedded mode

Pass an existing board as `options.board` to show only the move list. The viewer then does not create a board and does not record moves made on that board (no `pgnchange`), so the page must handle its own moves and call `setMainLine()` or `showLine()` after them. Clicking a move, and `showLine()`, still set the position on the board. Only the move list is added to the page; the header and settings are not shown.

```js
const viewer = new PgnViewer(moveListRoot, { board: existingChessBoard });
viewer.setMainLine(line, ply);
viewer.element.addEventListener('pgnnavigate', (event) => { selectedPly = event.detail.ply; });
```



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

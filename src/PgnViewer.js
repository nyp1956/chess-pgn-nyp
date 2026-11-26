import { ChessBoard } from 'chess-board-nyp/src/index.js';
import './styles/pgn-viewer.scss';
import { parsePgn, parseMoveText, recordMove, removeMovesAfter, findBranch } from './pgn.js';
import { detectLocale, isLocale, tagLabel, toLocaleSan, translate } from './i18n.js';

const EVENT_TAGS = ['Event', 'Site', 'EventDate', 'Round'];
const OPENING_TAGS = ['Opening', 'ECO', 'Date', 'Eval'];
// Tags shown directly in the header; all other tags are behind the "Vis flere tags" button.
const SHOWN_TAGS = new Set([...EVENT_TAGS, ...OPENING_TAGS, 'White', 'Black', 'WhiteElo', 'BlackElo', 'Result', 'FEN', 'SetUp']);
const CHESS_BOARD_ICON = '<svg class="svg-inline--fa fa-chess-board" aria-hidden="true" focusable="false" viewBox="0 0 448 512"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96V416C0 451.3 28.7 480 64 480H384C419.3 480 448 451.3 448 416V96C448 60.7 419.3 32 384 32H64ZM128 96V160H192V96H256V160H320V96H384V160H320V224H384V288H320V352H384V416H320V352H256V416H192V352H128V416H64V352H128V288H64V224H128V160H64V96H128ZM192 224H256V160H192V224ZM192 288V224H128V288H192ZM256 288H192V352H256V288ZM256 288H320V224H256V288Z"></path></svg>';
// Same gear as the board's settings button.
const SETTINGS_ICON = '<svg class="game-controls__icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 0 0 0 160z"></path></svg>';

// PGN uses "?" and "????.??.??" for unknown values, so those count as missing.
const hasValue = (value) => typeof value === 'string' && /[^?.\s]/.test(value);

function joinKnown(headers, keys, separator = ' / ') {
  return keys.filter((key) => hasValue(headers[key])).map((key) => headers[key]).join(separator);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const SETTINGS_KEY = 'chess-pgn-nyp:settings';
// Text size in percent of the normal size. The CSS multiplies the text sizes by this.
const TEXT_SCALE = { min: 80, max: 160, step: 10, default: 100 };
// Font stacks for the viewer. 'default' is the page's font, so the viewer looks as before unless changed.
const FONT_FAMILIES = {
  default: '"Open Sans", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  verdana: 'Verdana, Tahoma, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
};
const isFontFamily = (value) => Object.hasOwn(FONT_FAMILIES, value);
const DEFAULT_SETTINGS = { variationList: false, figurine: true, textScale: TEXT_SCALE.default, fontFamily: 'default' };

const isTextScale = (value) => Number.isInteger(value)
  && value >= TEXT_SCALE.min
  && value <= TEXT_SCALE.max
  && value % TEXT_SCALE.step === 0;

function loadSettings() {
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(SETTINGS_KEY)) ?? {};
    return {
      variationList: saved.variationList === true,
      figurine: saved.figurine !== false,
      textScale: isTextScale(saved.textScale) ? saved.textScale : TEXT_SCALE.default,
      fontFamily: isFontFamily(saved.fontFamily) ? saved.fontFamily : 'default',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    globalThis.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be blocked or full; the choice still applies for this page view.
  }
}

function containsLine(line, target) {
  return line === target
    || line.moves.some((move) => move.variations.some((variation) => containsLine(variation, target)))
    || (line.endVariations ?? []).some((variation) => containsLine(variation, target));
}

export default class PgnViewer {
  #games = [];
  #game = null;
  #variants = [];
  #line = null;
  #ply = 0;
  #selectedChip = null;
  #board;
  #refs = {};
  #locale;
  #settings = loadSettings();

  constructor(container, options = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('PgnViewer needs a container element');
    }
    if (options.locale !== undefined && !isLocale(options.locale)) {
      throw new RangeError(`Unknown locale: ${options.locale}`);
    }
    this.#locale = options.locale ?? detectLocale();

    this.element = el('section', 'pgn-viewer');

    const boardFrame = el('div', 'pgn-viewer__board');
    const boardHost = el('div', 'pgn-viewer__board-host');
    boardFrame.append(boardHost);

    const details = el('article', 'game-detail pgn-viewer__details');
    this.#refs.select = el('select', 'pgn-viewer__select');
    this.#refs.select.addEventListener('change', () => this.showGame(Number(this.#refs.select.value)));
    this.#refs.moves = el('div', 'move-list');
    this.#refs.result = el('p', 'game-detail-result');
    details.append(this.#refs.select, this.#buildHeader(), this.#refs.moves, this.#refs.result);

    this.element.append(boardFrame, details);
    container.append(this.element);

    this.#board = new ChessBoard(boardHost, { ariaLabel: options.ariaLabel, locale: this.#locale, controls: true, promotion: 'ask' });
    this.#board.element.addEventListener('chessboard:change', this.#handleBoardChange);

    this.#applyTextScale();
    this.#applyFontFamily();
    this.#applyLocale();
  }

  get locale() {
    return this.#locale;
  }

  get textScale() {
    return this.#settings.textScale;
  }

  // Sets the text size in percent (80-160 in steps of 10). The choice is remembered in the browser.
  // Dispatches 'textscalechange' on the viewer element, so the page can keep its own control in sync.
  setTextScale(percent) {
    if (!isTextScale(percent)) throw new RangeError(`Unknown text size: ${percent}`);
    this.#settings = { ...this.#settings, textScale: percent };
    saveSettings(this.#settings);
    this.#refs.textScale.input.value = String(percent);
    this.#applyTextScale();
    this.element.dispatchEvent(new CustomEvent('textscalechange', { bubbles: true, detail: { textScale: percent } }));
  }

  get fontFamily() {
    return this.#settings.fontFamily;
  }

  // Sets the font for the viewer: 'default', 'serif', 'verdana' or 'mono'. The choice is remembered in the browser.
  // Dispatches 'fontfamilychange' on the viewer element, so the page can keep its own control in sync.
  setFontFamily(name) {
    if (!isFontFamily(name)) throw new RangeError(`Unknown font: ${name}`);
    this.#settings = { ...this.#settings, fontFamily: name };
    saveSettings(this.#settings);
    this.#refs.fontFamily.select.value = name;
    this.#applyFontFamily();
    this.element.dispatchEvent(new CustomEvent('fontfamilychange', { bubbles: true, detail: { fontFamily: name } }));
  }

  // Changes the language of the viewer and its board. Only 'da' and 'en' are supported.
  setLocale(locale) {
    if (!isLocale(locale)) throw new RangeError(`Unknown locale: ${locale}`);
    this.#locale = locale;
    this.#board.configure({ locale });
    this.#applyLocale();
  }

  get board() {
    return this.#board;
  }

  get games() {
    return this.#games;
  }

  // Parses PGN text, shows the first game and returns the number of games.
  loadPgn(text) {
    const games = parsePgn(text, { locale: this.#locale });
    if (games.length === 0) throw new Error(this.#t('error.noGames'));
    this.#games = games;
    this.#variants = [];
    this.#renderGameOptions();
    this.#refs.select.hidden = games.length < 2;
    this.showGame(0);
    return games.length;
  }

  showGame(index) {
    const game = this.#games[index];
    if (!game) throw new RangeError(this.#t('error.noGame', { index }));
    this.#game = game;
    this.#variants = [];
    this.#refs.select.value = String(index);
    this.#renderHeaders();
    this.#board.setHeaders(this.#boardHeaders());
    this.showLine(game.line, 0);
  }

  // Shows a line in the board. ply is how many moves of the line are played (default: all).
  showLine(line, ply = line.moves.length) {
    if (!Number.isInteger(ply) || ply < 0 || ply > line.moves.length) {
      throw new RangeError(this.#t('error.ply', { ply }));
    }
    const roots = [this.#game?.line, ...this.#variants].filter(Boolean);
    if (!roots.some((root) => containsLine(root, line))) this.#variants.push(line);

    this.#line = line;
    this.#ply = ply;
    this.#board.setLine(line.startFen, line.moves.map((move) => move.san), ply);
    this.#renderMoves();
  }

  // Parses typed moves (SAN, variations allowed) from the position on the board and shows them.
  addVariant(text) {
    const line = parseMoveText(text, this.#board.game.fen(), { locale: this.#locale });
    if (line.moves.length === 0) throw new Error(this.#t('error.emptyVariation'));
    this.showLine(line);
    return line;
  }

  // Removes the moves after the shown position, with their variations. A variation left empty is removed from its line.
  // Returns the number of moves removed.
  deleteMovesAfterPosition() {
    const line = this.#line;
    if (!line) return 0;
    const count = line.moves.length - this.#ply;
    const removed = removeMovesAfter(line, this.#ply);
    this.#variants = this.#variants.filter((variant) => !removed.has(variant));

    let target = { line, ply: this.#ply };
    if (line.moves.length === 0 && line !== this.#game?.line) {
      const branch = this.#findBranchFromRoots(line);
      if (branch) {
        branch.list.splice(branch.list.indexOf(line), 1);
        this.#variants = this.#variants.filter((variant) => variant !== line);
        target = { line: branch.line, ply: branch.ply };
      }
    }
    this.showLine(target.line, target.ply);
    this.#emitChange('delete', null);
    return count;
  }

  #findBranchFromRoots(target) {
    for (const root of [this.#game?.line, ...this.#variants].filter(Boolean)) {
      const branch = findBranch(root, target);
      if (branch) return branch;
    }
    return null;
  }

  // Dispatches 'pgnchange' on the viewer element after the game changes, so the page can save it.
  // reason is 'move' or 'delete'; san is the move played, or null.
  #emitChange(reason, san) {
    this.element.dispatchEvent(new CustomEvent('pgnchange', {
      bubbles: true,
      detail: { reason, san, line: this.#line, ply: this.#ply, fen: this.#board.game.fen() },
    }));
  }

  #handleBoardChange = (event) => {
    const { reason, ply } = event.detail;
    if (reason === 'navigate' && this.#line) {
      this.#ply = ply;
      this.#renderMoves();
    } else if (reason === 'move' && this.#line) {
      this.#recordBoardMove(ply);
    }
  };

  // The board has played a move from the shown position, so it is added to the line or as a variation.
  // After a finished game (Result other than *), a move after the end of the main line is kept as a variation.
  // Moves after the end of a variation extend that variation.
  #recordBoardMove(ply) {
    const san = this.#board.game.history().at(-1);
    const onMainLine = this.#line === this.#game?.line;
    const target = recordMove(this.#line, ply - 1, san, { finished: onMainLine && this.#isFinished(), root: this.#game?.line ?? this.#line, freeVariants: this.#variants });
    this.showLine(target.line, target.ply);
    this.#emitChange('move', san);
  }

  #isFinished() {
    const result = this.#game?.result ?? this.#game?.headers.Result;
    return Boolean(result) && result !== '*';
  }

  #t(key, params) {
    return translate(this.#locale, key, params);
  }

  // Sets the texts that do not come from the PGN. Called on creation and when the language changes.
  #applyLocale() {
    this.element.setAttribute('aria-label', this.#t('viewer.label'));
    this.#refs.select.setAttribute('aria-label', this.#t('game.select'));
    this.#refs.settingsSummary.setAttribute('aria-label', this.#t('settings.open'));
    this.#refs.settingsSummary.title = this.#t('settings.open');
    this.#refs.variationList.text.textContent = this.#t('settings.variations');
    this.#refs.figurine.text.textContent = this.#t('settings.figurine');
    this.#refs.textScale.text.textContent = this.#t('settings.textSize');
    this.#refs.fontFamily.text.textContent = this.#t('settings.font');
    this.#refs.fontFamily.select.querySelectorAll('option').forEach((option) => {
      option.textContent = this.#t(`font.${option.value}`);
    });
    this.#refs.white.label.textContent = `${this.#t('header.white')}:`;
    this.#refs.black.label.textContent = `${this.#t('header.black')}:`;
    this.#renderGameOptions();
    if (this.#game) this.#renderExtraTags();
    this.#setTagsOpen(this.#refs.tagsToggle.getAttribute('aria-expanded') === 'true');
    if (this.#game) this.#renderMoves();
    else this.#renderEmpty();
  }

  #renderGameOptions() {
    this.#refs.select.replaceChildren(...this.#games.map((game, index) => {
      const option = el('option', null, this.#t('game.option', {
        number: index + 1,
        white: game.headers.White ?? '?',
        black: game.headers.Black ?? '?',
      }));
      option.value = String(index);
      return option;
    }));
    if (this.#game) this.#refs.select.value = String(this.#games.indexOf(this.#game));
  }

  #renderEmpty() {
    this.#refs.header.hidden = true;
    this.#refs.moves.replaceChildren(el('p', 'game-detail-empty', this.#t('viewer.empty')));
  }

  #buildHeader() {
    const refs = this.#refs;
    refs.header = el('div', 'game-detail-head');
    refs.event = el('p', 'game-detail-event');

    // Same markup and classes as the board's settings, so the board's stylesheet gives it the same look.
    refs.settings = el('details', 'game-controls__settings pgn-viewer__settings');
    refs.settingsSummary = el('summary', 'game-controls__button game-controls__summary');
    refs.settingsSummary.innerHTML = SETTINGS_ICON;
    refs.settingsPanel = el('div', 'game-controls__panel');
    refs.settingsPanel.append(
      this.#settingOption('variationList'),
      this.#settingOption('figurine'),
      this.#textScaleOption(),
      this.#fontFamilyOption(),
    );
    refs.settings.append(refs.settingsSummary, refs.settingsPanel);
    document.addEventListener('click', (event) => {
      if (!refs.settings.contains(event.target)) refs.settings.open = false;
    });
    refs.titleRow = el('div', 'game-detail-titlebar');
    refs.titleRow.append(refs.event, refs.settings);

    refs.tagsToggle = el('button', 'game-detail-tags-toggle');
    refs.tagsToggle.type = 'button';
    refs.tagsToggle.addEventListener('click', () => this.#setTagsOpen(refs.extraTags.hidden));
    refs.extraTags = el('dl', 'game-detail-extra-tags');

    refs.white = this.#playerRow();
    refs.black = this.#playerRow();

    refs.opening = el('p', 'game-detail-opening');

    const eventSection = el('div', 'game-detail-section');
    eventSection.append(refs.titleRow, refs.tagsToggle, refs.extraTags);
    const playerSection = el('div', 'game-detail-section');
    playerSection.append(refs.white.row, refs.black.row);
    refs.openingSection = el('div', 'game-detail-section');
    refs.openingSection.append(refs.opening);

    refs.header.append(eventSection, playerSection, refs.openingSection);
    return refs.header;
  }

  #settingOption(name) {
    const input = el('input');
    input.type = 'checkbox';
    input.checked = this.#settings[name];
    input.addEventListener('change', () => this.#setSetting(name, input.checked));
    const text = el('span');
    const label = el('label', 'game-controls__check');
    label.append(input, ' ', text);
    this.#refs[name] = { input, text };
    return label;
  }

  #textScaleOption() {
    const input = el('input');
    input.type = 'range';
    input.min = String(TEXT_SCALE.min);
    input.max = String(TEXT_SCALE.max);
    input.step = String(TEXT_SCALE.step);
    input.value = String(this.#settings.textScale);
    input.addEventListener('input', () => this.setTextScale(Number(input.value)));
    const text = el('span');
    const label = el('label', 'pgn-viewer__text-size');
    label.append(text, input);
    this.#refs.textScale = { input, text };
    return label;
  }

  #fontFamilyOption() {
    const select = el('select');
    select.append(...Object.keys(FONT_FAMILIES).map((name) => {
      const option = el('option');
      option.value = name;
      return option;
    }));
    select.value = this.#settings.fontFamily;
    select.addEventListener('change', () => this.setFontFamily(select.value));
    const text = el('span');
    const label = el('label', 'pgn-viewer__font');
    label.append(text, select);
    this.#refs.fontFamily = { select, text };
    return label;
  }

  #applyTextScale() {
    this.element.style.setProperty('--text-scale', String(this.#settings.textScale / 100));
  }

  #applyFontFamily() {
    this.element.style.fontFamily = FONT_FAMILIES[this.#settings.fontFamily];
  }

  #playerRow() {
    const row = el('p', 'game-detail-player');
    const label = el('span', 'game-detail-label');
    const name = el('span', 'game-detail-name');
    const rating = el('span', 'game-detail-rating');
    row.append(label, name, rating);
    return { row, label, name, rating };
  }

  #renderHeaders() {
    const { headers, result } = this.#game;
    const refs = this.#refs;
    refs.header.hidden = false;
    refs.event.textContent = joinKnown(headers, EVENT_TAGS);
    this.#renderPlayer(refs.white, headers.White, headers.WhiteElo);
    this.#renderPlayer(refs.black, headers.Black, headers.BlackElo);
    const opening = joinKnown(headers, OPENING_TAGS);
    refs.opening.textContent = opening;
    refs.openingSection.hidden = !opening;
    refs.result.textContent = result ?? headers.Result ?? '';
    this.#renderExtraTags();
    this.#setTagsOpen(false);
  }

  #renderExtraTags() {
    const { headers } = this.#game;
    const refs = this.#refs;
    const extra = Object.entries(headers)
      .filter(([key]) => !SHOWN_TAGS.has(key))
      .flatMap(([key, value]) => [el('dt', null, tagLabel(this.#locale, key)), el('dd', null, value)]);
    refs.extraTags.replaceChildren(...extra);
    refs.tagsToggle.hidden = extra.length === 0;
  }

  #renderPlayer(player, name, elo) {
    player.name.textContent = name ?? '?';
    player.rating.textContent = hasValue(elo) ? ` ${elo}` : '';
  }

  #setTagsOpen(open) {
    this.#refs.extraTags.hidden = !open;
    this.#refs.tagsToggle.setAttribute('aria-expanded', String(open));
    this.#refs.tagsToggle.textContent = this.#t(open ? 'tags.hide' : 'tags.show');
  }

  #setSetting(name, value) {
    this.#settings = { ...this.#settings, [name]: value };
    saveSettings(this.#settings);
    if (this.#game) this.#renderMoves();
  }

  // FEN and SetUp are left out: chess.js writes them from each line's own start position.
  #boardHeaders() {
    return Object.fromEntries(Object.entries(this.#game.headers).filter(([key]) => key !== 'FEN' && key !== 'SetUp'));
  }

  #showStart() {
    this.showLine(this.#game.line, 0);
  }

  #renderMoves() {
    const list = this.#refs.moves;
    list.replaceChildren();
    this.#selectedChip = null;

    if (this.#game) list.append(this.#lineBlock(this.#game.line, [this.#startIcon()]));
    this.#variants.forEach((variant, index) => {
      list.append(this.#lineBlock(variant, [el('span', 'move-label', this.#t('move.variation', { number: index + 1 })), this.#chip(variant, 0, this.#t('move.start'))]));
    });

    this.#selectedChip?.scrollIntoView({ block: 'nearest' });
  }

  #startIcon() {
    const button = el('button', 'game-detail-start');
    button.type = 'button';
    button.title = this.#t('start.show');
    button.setAttribute('aria-label', this.#t('start.show'));
    button.innerHTML = CHESS_BOARD_ICON;
    button.addEventListener('click', () => this.#showStart());
    return button;
  }

  #lineBlock(line, lead) {
    const block = el('div', 'move-row move-row--tree');
    if (this.#settings.variationList) {
      this.#renderBlocks(line, 0, block, lead);
    } else {
      block.append(...lead, ' ');
      this.#renderLine(line, block);
    }
    return block;
  }

  // Variation list: each variation is its own indented block, and the rest of the line continues in a new block.
  #renderBlocks(line, depth, container, lead = []) {
    let block = null;
    let pendingLead = lead;
    const current = () => {
      if (block) return block;
      block = el('div', depth > 0 ? 'move-block move-block--branch' : 'move-block');
      block.style.setProperty('--depth', String(depth));
      if (depth > 0) block.append(el('span', 'move-bullet', '•'), ' ');
      block.append(...pendingLead, ' ');
      pendingLead = [];
      container.append(block);
      return block;
    };

    current();
    line.moves.forEach((move, index) => {
      this.#appendMove(line, index, current());
      move.variations.forEach((variation) => this.#renderBlocks(variation, depth + 1, container));
      if (move.variations.length > 0) block = null;
    });
    (line.endVariations ?? []).forEach((variation) => this.#renderBlocks(variation, depth + 1, container));
  }

  #renderLine(line, container) {
    line.moves.forEach((move, index) => {
      this.#appendMove(line, index, container);
      this.#renderVariations(move.variations, container);
    });
    this.#renderVariations(line.endVariations ?? [], container);
  }

  #appendMove(line, index, container) {
    const move = line.moves[index];
    if (move.color === 'w') {
      container.append(el('span', 'move-number', `${move.moveNumber}.`));
    } else if (index === 0 || line.moves[index - 1].variations.length > 0) {
      container.append(el('span', 'move-number', `${move.moveNumber}...`));
    }
    const display = toLocaleSan(move.san, this.#locale, { figurine: this.#settings.figurine, color: move.color });
    container.append(this.#chip(line, index + 1, display), ' ');
  }

  #renderVariations(variations, container) {
    variations.forEach((variation) => {
      const wrap = el('span', 'move-variation');
      wrap.append('(');
      this.#renderLine(variation, wrap);
      wrap.append(')');
      container.append(wrap, ' ');
    });
  }

  #chip(line, ply, label) {
    const button = el('button', 'move-chip', label);
    button.type = 'button';
    const selected = line === this.#line && ply === this.#ply;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    if (selected) this.#selectedChip = button;
    button.addEventListener('click', () => this.showLine(line, ply));
    return button;
  }
}

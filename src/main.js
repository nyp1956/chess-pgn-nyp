import PgnViewer from './PgnViewer.js';
import { translate } from './i18n.js';

const SAMPLE_PGN = `[Event "Eksempelturnering"]
[Site "København"]
[Date "2024.05.12"]
[Round "3"]
[White "Hansen, Mette"]
[WhiteElo "2110"]
[Black "Larsen, Jens"]
[BlackElo "2045"]
[Result "1-0"]
[ECO "C84"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 {Morphy-forsvaret} 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O (8... Na5 9. Bc2 c5) 9. h3 Nb8 10. d4 Nbd7 1-0`;

const root = document.querySelector('#pgn-root');
const viewer = new PgnViewer(root);

const languageInput = document.querySelector('#language');
const fileInput = document.querySelector('#pgn-file');
const textInput = document.querySelector('#pgn-text');
const sizeInput = document.querySelector('#board-size');
const textSizeInput = document.querySelector('#text-size');
const fontFamilyInput = document.querySelector('#font-family');
const variantForm = document.querySelector('#variant-form');
const variantInput = document.querySelector('#variant-text');
const errorBox = document.querySelector('#pgn-error');

// Sets the language of the page texts. The viewer and board are changed separately,
// so nodes inside #pgn-root are skipped: the board uses its own data-i18n keys.
function pageNodes(selector) {
  return [...document.querySelectorAll(selector)].filter((node) => !root.contains(node));
}

function translatePage(locale) {
  document.documentElement.lang = locale;
  pageNodes('[data-i18n]').forEach((node) => {
    node.textContent = translate(locale, node.dataset.i18n);
  });
  pageNodes('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = translate(locale, node.dataset.i18nPlaceholder);
  });
  pageNodes('[data-i18n-aria-label]').forEach((node) => {
    node.setAttribute('aria-label', translate(locale, node.dataset.i18nAriaLabel));
  });
}

languageInput.value = viewer.locale;
translatePage(viewer.locale);
languageInput.addEventListener('change', () => {
  viewer.setLocale(languageInput.value);
  translatePage(viewer.locale);
  clearError();
});

function showError(error) {
  errorBox.textContent = error.message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = '';
  errorBox.hidden = true;
}

function load(text) {
  try {
    viewer.loadPgn(text);
    clearError();
  } catch (error) {
    showError(error);
  }
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (file) load(await file.text());
});

document.querySelector('#load-text').addEventListener('click', () => load(textInput.value));
document.querySelector('#load-sample').addEventListener('click', () => {
  textInput.value = SAMPLE_PGN;
  load(SAMPLE_PGN);
});

// The board's width comes from its parent column, so the slider only sets that column's width.
const setBoardColumn = () => root.style.setProperty('--board-column', `${sizeInput.value}px`);
sizeInput.addEventListener('input', setBoardColumn);
setBoardColumn();

// The text size can also be changed in the viewer's gear panel, so this slider follows the viewer's value.
textSizeInput.value = String(viewer.textScale);
textSizeInput.addEventListener('input', () => viewer.setTextScale(Number(textSizeInput.value)));
viewer.element.addEventListener('textscalechange', (event) => {
  textSizeInput.value = String(event.detail.textScale);
});

// The font can also be changed in the viewer's gear panel, so this select follows the viewer's value.
fontFamilyInput.value = viewer.fontFamily;
fontFamilyInput.addEventListener('change', () => viewer.setFontFamily(fontFamilyInput.value));
viewer.element.addEventListener('fontfamilychange', (event) => {
  fontFamilyInput.value = event.detail.fontFamily;
});

variantForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    viewer.addVariant(variantInput.value);
    clearError();
  } catch (error) {
    showError(error);
  }
});

load(SAMPLE_PGN);

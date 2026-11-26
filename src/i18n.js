export const LOCALES = ['da', 'en'];
// Bruges når browserens sprog ikke findes i LOCALES, og som fallback for manglende oversættelser.
export const DEFAULT_LOCALE = 'en';

export const LOCALE_NAMES = { da: 'Dansk', en: 'English' };

// Kendte ekstra PGN-tags har en 'tag.<navn>'-oversættelse (se tagLabel). PGN-værdierne vises uændret. Træktekst vises med sprogets brikbogstaver eller figurer; de engelske er standard i PGN-formatet.
export const MESSAGES = {
  da: {
    'app.topbar': 'PGN-visning',
    'app.language': 'Sprog',
    'load.label': 'Indlæs PGN',
    'load.file': 'PGN-fil',
    'load.width': 'Brætbredde',
    'load.textSize': 'Tekststørrelse',
    'load.paste': 'Eller indsæt PGN',
    'load.text': 'Indlæs tekst',
    'load.example': 'Eksempel',
    'variant.label': 'Variant fra stillingen på brættet',
    'variant.placeholder': 'fx 1... c5 2. Sf3 (2. c3 d5)',
    'variant.submit': 'Vis variant',
    'viewer.label': 'PGN-visning',
    'viewer.empty': 'Ingen PGN indlæst',
    'game.select': 'Vælg parti',
    'game.option': 'Parti {number}: {white} – {black}',
    'header.white': 'Hvid',
    'header.black': 'Sort',
    'tags.show': 'Vis flere tags',
    'tags.hide': 'Skjul tags',
    'tag.WhiteFideId': 'Hvid FIDE-id',
    'tag.BlackFideId': 'Sort FIDE-id',
    'tag.WhiteTitle': 'Hvid titel',
    'tag.BlackTitle': 'Sort titel',
    'tag.WhiteUSCF': 'Hvid USCF',
    'tag.BlackUSCF': 'Sort USCF',
    'tag.WhiteType': 'Hvid type',
    'tag.BlackType': 'Sort type',
    'tag.WhiteTeam': 'Hvid hold',
    'tag.BlackTeam': 'Sort hold',
    'tag.WhiteRatingDiff': 'Hvid ratingændring',
    'tag.BlackRatingDiff': 'Sort ratingændring',
    'tag.EventSponsor': 'Arrangør',
    'tag.EventCountry': 'Turneringsland',
    'tag.EventCategory': 'Turneringskategori',
    'tag.EventType': 'Turneringstype',
    'tag.EventRounds': 'Antal runder',
    'tag.Section': 'Sektion',
    'tag.Stage': 'Fase',
    'tag.Board': 'Bræt',
    'tag.Variant': 'Spilvariant',
    'tag.Mode': 'Spilform',
    'tag.Time': 'Starttid',
    'tag.UTCDate': 'UTC-dato',
    'tag.UTCTime': 'UTC-tidspunkt',
    'tag.TimeControl': 'Betænkningstid',
    'tag.Termination': 'Afslutning',
    'tag.Annotator': 'Kommentator',
    'tag.PlyCount': 'Antal halvtræk',
    'tag.Variation': 'Åbningsvariant',
    'tag.SubVariation': 'Undervariant',
    'tag.Source': 'Kilde',
    'tag.SourceTitle': 'Kildetitel',
    'tag.Link': 'Link',
    'start.show': 'Vis startstilling',
    'move.start': 'Start',
    'move.variation': 'Variant {number}: ',
    'settings.open': 'Indstillinger',
    'settings.variations': 'Vis varianter som punktliste',
    'settings.figurine': 'Vis brikker som figurer',
    'settings.textSize': 'Tekststørrelse',
    'settings.font': 'Skrifttype',
    'font.default': 'Standard',
    'font.serif': 'Serif (Georgia)',
    'font.verdana': 'Verdana',
    'font.mono': 'Monospace',
    'load.font': 'Skrifttype',
    'error.noGames': 'Filen indeholder ingen partier',
    'error.noGame': 'Intet parti med nummer {index}',
    'error.ply': 'Ply {ply} ligger uden for linjen',
    'error.emptyVariation': 'Varianten er tom',
    'pgn.error': 'PGN: {message} (tegn {position})',
    'pgn.comment': 'kommentar uden slutning "}"',
    'pgn.tag': 'ugyldigt header-tag',
    'pgn.variationStart': 'variant uden et foregående træk',
    'pgn.unmatchedClose': '")" uden tilsvarende "("',
    'pgn.illegalMove': 'ugyldigt træk "{san}" i stillingen {fen}',
    'pgn.unclosed': 'PGN: variant mangler ")"',
    'pgn.invalidFen': 'Ugyldig FEN i PGN-header: {fen}',
  },
  en: {
    'app.topbar': 'PGN viewer',
    'app.language': 'Language',
    'load.label': 'Load PGN',
    'load.file': 'PGN file',
    'load.width': 'Board width',
    'load.textSize': 'Text size',
    'load.paste': 'Or paste PGN',
    'load.text': 'Load text',
    'load.example': 'Example',
    'variant.label': 'Variation from the position on the board',
    'variant.placeholder': 'e.g. 1... c5 2. Nf3 (2. c3 d5)',
    'variant.submit': 'Show variation',
    'viewer.label': 'PGN viewer',
    'viewer.empty': 'No PGN loaded',
    'game.select': 'Choose game',
    'game.option': 'Game {number}: {white} – {black}',
    'header.white': 'White',
    'header.black': 'Black',
    'tags.show': 'Show more tags',
    'tags.hide': 'Hide tags',
    'tag.WhiteFideId': 'White FIDE ID',
    'tag.BlackFideId': 'Black FIDE ID',
    'tag.WhiteTitle': 'White title',
    'tag.BlackTitle': 'Black title',
    'tag.WhiteUSCF': 'White USCF',
    'tag.BlackUSCF': 'Black USCF',
    'tag.WhiteType': 'White type',
    'tag.BlackType': 'Black type',
    'tag.WhiteTeam': 'White team',
    'tag.BlackTeam': 'Black team',
    'tag.WhiteRatingDiff': 'White rating change',
    'tag.BlackRatingDiff': 'Black rating change',
    'tag.EventSponsor': 'Event sponsor',
    'tag.EventCountry': 'Event country',
    'tag.EventCategory': 'Event category',
    'tag.EventType': 'Event type',
    'tag.EventRounds': 'Rounds',
    'tag.Section': 'Section',
    'tag.Stage': 'Stage',
    'tag.Board': 'Board',
    'tag.Variant': 'Game variant',
    'tag.Mode': 'Mode',
    'tag.Time': 'Start time',
    'tag.UTCDate': 'UTC date',
    'tag.UTCTime': 'UTC time',
    'tag.TimeControl': 'Time control',
    'tag.Termination': 'Termination',
    'tag.Annotator': 'Annotator',
    'tag.PlyCount': 'Ply count',
    'tag.Variation': 'Opening variation',
    'tag.SubVariation': 'Sub-variation',
    'tag.Source': 'Source',
    'tag.SourceTitle': 'Source title',
    'tag.Link': 'Link',
    'start.show': 'Show start position',
    'move.start': 'Start',
    'move.variation': 'Variation {number}: ',
    'settings.open': 'Settings',
    'settings.variations': 'Show variations as a list',
    'settings.figurine': 'Show pieces as figurines',
    'settings.textSize': 'Text size',
    'settings.font': 'Font',
    'font.default': 'Default',
    'font.serif': 'Serif (Georgia)',
    'font.verdana': 'Verdana',
    'font.mono': 'Monospace',
    'load.font': 'Font',
    'error.noGames': 'The file contains no games',
    'error.noGame': 'No game with number {index}',
    'error.ply': 'Ply {ply} is outside the line',
    'error.emptyVariation': 'The variation is empty',
    'pgn.error': 'PGN: {message} (character {position})',
    'pgn.comment': 'comment without closing "}"',
    'pgn.tag': 'invalid header tag',
    'pgn.variationStart': 'variation without a preceding move',
    'pgn.unmatchedClose': '")" without a matching "("',
    'pgn.illegalMove': 'illegal move "{san}" in position {fen}',
    'pgn.unclosed': 'PGN: variation is missing ")"',
    'pgn.invalidFen': 'Invalid FEN in PGN header: {fen}',
  },
};

export function isLocale(value) {
  return LOCALES.includes(value);
}

// Navnet på et ekstra PGN-tag. Ukendte tags vises med deres eget navn.
export function tagLabel(locale, tag) {
  const key = `tag.${tag}`;
  const messages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  return messages[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? tag;
}

// Brikbogstaver i SAN. Dansk bruger K (konge), D (dronning), T (tårn), L (løber) og S (springer).
const SAN_PIECE_LETTERS = {
  da: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'S' },
  en: { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N' },
};
const ENGLISH_SAN_LETTERS = { K: 'K', D: 'Q', T: 'R', L: 'B', S: 'N' };

// Figursymboler i samme farve som trækkets side. Bønder har ingen symbol i SAN.
const FIGURINES = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞' },
};
const ENGLISH_LETTER_FROM_FIGURINE = Object.fromEntries(
  Object.entries(FIGURINES).flatMap(([, glyphs]) => Object.entries(glyphs).map(([letter, glyph]) => [glyph, letter])),
);

// Viser et engelsk SAN-træk, fx Nxe5+ eller e8=Q, med sprogets brikbogstaver eller figursymboler.
export function toLocaleSan(san, locale = DEFAULT_LOCALE, { figurine = false, color = 'w' } = {}) {
  const letters = figurine
    ? FIGURINES[color]
    : SAN_PIECE_LETTERS[locale] ?? SAN_PIECE_LETTERS[DEFAULT_LOCALE];
  return san.replace(/^[KQRBN]|(?<==)[QRBN]/g, (letter) => letters[letter]);
}

// Oversætter danske brikbogstaver og figursymboler til engelske, så træk kan skrives i alle notationer.
export function fromLocaleSan(san) {
  return san
    .replace(/[♔♕♖♗♘♚♛♜♝♞]/g, (glyph) => ENGLISH_LETTER_FROM_FIGURINE[glyph])
    .replace(/^[KDTLS]|(?<==)[DTLS]/g, (letter) => ENGLISH_SAN_LETTERS[letter]);
}

// Tager sprogkoden fra browserens sprog, fx 'da-DK' -> 'da'.
export function detectLocale(language = globalThis.navigator?.language) {
  const code = String(language ?? '').slice(0, 2).toLowerCase();
  return isLocale(code) ? code : DEFAULT_LOCALE;
}

// Erstatter {navn} i teksten med params.navn. Ukendte navne står uændret.
export function translate(locale, key, params = {}) {
  const messages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const template = messages[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

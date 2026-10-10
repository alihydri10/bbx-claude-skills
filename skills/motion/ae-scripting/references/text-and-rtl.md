# Text layers, fonts, and Persian / Arabic (RTL) text

## Basic edit cycle — always get → modify → set

```js
var st = layer.property("ADBE Text Properties").property("ADBE Text Document");
var td = st.value;                 // a copy
td.text = "New text";
td.fontSize = 72;
td.fillColor = [1, 1, 1];
td.applyFill = true;
td.font = "Vazirmatn-Bold";        // PostScript name, not the menu name
st.setValue(td);                   // nothing changes until this
```

- Set layout props (`justification`, `tracking`, `leading`, `boxText*`) on a document read from
  an existing layer. On a bare `new TextDocument()` some of them throw "not associated with a
  layer". Pattern: `addText("x")` → read `.value` → modify → `setValue`.
- If Source Text is keyframed, use `st.setValueAtTime(t, td)` instead of `setValue`.
- Line breaks: `"\r"` (AE's paragraph separator). `"\n"` also works on most versions, but `\r`
  is what AE writes back, so compare with `\r`.
- `td.justification = ParagraphJustification.CENTER_JUSTIFY` (LEFT_JUSTIFY, RIGHT_JUSTIFY, FULL_JUSTIFY_LASTLINE_*).
- Anchor to visual center after changing text:
  ```js
  var r = layer.sourceRectAtTime(comp.time, false);
  layer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([r.left + r.width/2, r.top + r.height/2]);
  ```

## Fonts (AE 24.0+)

`td.font` needs the PostScript name. Wrong name → silently falls back to a default font
(looks like "the script ignored my font"). Resolve it:

```js
function findFont(family, style) {           // AE 24+
    if (!app.fonts) return null;
    var list = app.fonts.getFontsByFamilyNameAndStyleName(family, style);
    return (list && list.length) ? list[0].postScriptName : null;
}
// var ps = findFont("Vazirmatn", "Bold") || "ArialMT";
```

`app.fonts.allFonts`, `app.fonts.missingOrSubstitutedFonts`, `app.project.usedFonts` (24.5+),
`app.project.replaceFont(oldFontObj, newFontObj)` (24.5+). Check `parseInt(app.version)` before
using these and fall back gracefully on older versions.

Per-character styling (AE 24.3+): `td.characterRange(start, end)` returns a CharacterRange with
its own `fontSize`, `fillColor`, `font`, etc. Before 24.3 the only way to style part of a
text layer from script is text animators with a Range Selector.

## !! Latin text on a Persian/Arabic system: FORCE left-to-right

Seen in production: on a user's AE with Middle-Eastern text defaults, new text layers came out
with RTL paragraph direction. Every LEFT-justified Latin label then grew *leftwards* from its
anchor ("U COULD_" cut off, "4 USDT" off the card, BONK on top of its icon). Fix on every Latin
text layer, before justification and before measuring the anchor:

```js
try { if (typeof ParagraphDirection !== "undefined")
        td.direction = ParagraphDirection.DIRECTION_LEFT_TO_RIGHT; } catch (e) {}
```

Also: never build one title out of several word layers placed by hand — a fallback font with
different widths makes them collide ("BRIDGEASSETS"). Use ONE layer; for spread-out words use
box text with `FULL_JUSTIFY_LASTLINE_FULL`; animate letters with an Expression Selector so the
layout never shifts.

## Persian UI strings in ScriptUI panels / alerts

Write them as `\uXXXX` escapes (convert the file to pure ASCII before delivery). ExtendScript
may read a BOM-less file in the system code page and garble raw Persian.

## Persian / Arabic / RTL

The user works with Persian (Farsi) and Arabic copy, so these matter for both:

- **Engine**: new text layers use the Universal Type Engine (formerly "South Asian and Middle
  Eastern") — required for correct letter joining. Older projects may still be on the Latin/CJK
  engine; `td.composerEngine = ComposerEngine.UNIVERSAL_TYPE_ENGINE` upgrades (one-way). Not
  settable in the other direction.
- **Direction** (24.0+): `td.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT;` Pair it
  with `ParagraphJustification.RIGHT_JUSTIFY` for right-aligned Persian paragraphs.
- **Digits**: `td.digitSet` (24.0+) controls Latin vs Arabic-Indic vs Farsi digits
  (`DigitSet.DEFAULT_DIGITS`, `ARABIC_DIGITS`, `ARABIC_DIGITS_RTL`, `FARSI_DIGITS`, `HINDI_DIGITS`).
  It reads the first character only but writes to all characters.
- **Encoding**: save the .jsx as UTF-8 and put Persian strings directly in the file, or use
  `\u` escapes (`"\u0633\u0644\u0627\u0645"` = سلام) if the file might be re-saved in a non-UTF-8
  editor. Reading text files: set `file.encoding = "UTF-8"` before `open("r")`.
- **Ligatures / kashida / ZWNJ**: keep the ZWNJ (`\u200C`, نیم‌فاصله) in strings — it's part of
  correct Persian spelling (e.g. می‌شود). Don't strip or trim it.
- **Per-character animation** on Persian: animators with "Characters" units split joined letters
  visually in some fonts; for word-by-word reveals set the Range Selector's Advanced > Based On
  to Words (not in the official matchName tables — confirm its matchName with the discovery
  snippet in matchnames.md before scripting it), or animate per-word layers.
- **Fonts**: Vazirmatn, IRANSans, Yekan Bakh, Estedad, Dana… — PostScript names differ from the
  menu names; always resolve via `findFont` or ask the user to run the matchName/font
  discovery snippet.

## Arabic-specific notes

Persian and Arabic share the script but not every letter, digit or typographic habit. When the
copy is Arabic (Dubai/Gulf clients, bilingual EN/AR deliverables), check these:

- **Letter variants — do not mix them**: Arabic yeh `ي` (`ي`) vs Persian yeh `ی` (`ی`),
  Arabic kaf `ك` (`ك`) vs Persian keheh `ک` (`ک`). They look alike in many fonts but are
  different characters: text pasted from a Persian keyboard into Arabic copy (or the reverse)
  breaks search/replace, matching against a CSV, and sometimes shaping in strict Arabic fonts.
  When replacing text from data, normalise to the target language first:
  ```js
  function toArabicLetters(s) { return s.replace(/ی/g, "ي").replace(/ک/g, "ك"); }
  function toPersianLetters(s) { return s.replace(/ي/g, "ی").replace(/ك/g, "ک"); }
  ```
  Also keep `ة` (teh marbuta, `ة`) and `ى` (alef maksura, `ى`) as they are — they are
  real Arabic letters, not typos for `ه` / `ی`.
- **Digits**: Arabic copy usually wants Arabic-Indic digits `٠١٢٣٤٥٦٧٨٩` (`٠`–`٩`);
  Persian uses the extended set `۰۱۲۳۴۵۶۷۸۹` (`۰`–`۹`), where 4, 5 and 6 are drawn
  differently. Use `DigitSet.ARABIC_DIGITS` for Arabic and `FARSI_DIGITS` for Persian, and never
  convert numbers with a Persian table for an Arabic job. Many Gulf brands use Latin digits even in
  Arabic text — ask before converting prices or dates.
- **Harakat (diacritics)**: fatha, kasra, damma, shadda, sukun, tanwin (`ً`–`ْ`) are
  separate combining characters. They count in `text.length` and in Range Selector character
  indices, so a "first 5 characters" reveal can stop mid-word. Animate by Words, or strip
  harakat with `s.replace(/[ً-ْ]/g, "")` when the design does not need them. If they
  are kept, raise `leading` — stacked marks clip on tight line spacing.
- **Tatweel / kashida** `ـ` (`ـ`): designers sometimes type it to stretch words. It is a real
  character, so it breaks text matching and per-character counts. Strip it before comparing
  strings; leave it in the final text only if the design asks for it.
- **Mixed EN/AR lines (bidi)**: a Latin brand name or number inside Arabic text can jump to the
  wrong side. Keep the paragraph `DIRECTION_RIGHT_TO_LEFT`, and if a phrase still lands wrong,
  wrap it with directional marks: RLM `‏` around Arabic runs, LRM `‎` around Latin
  runs. Prefer separate layers for EN and AR versions instead of one mixed line.
- **Punctuation**: Arabic comma `،` (`،`), semicolon `؛` (`؛`), question mark `؟`
  (`؟`). A Latin `?` or `,` in Arabic copy looks wrong and may mirror — use the Arabic forms.
- **Fonts**: Arabic-first families such as Noto Kufi Arabic, Noto Naskh Arabic, Cairo, Tajawal,
  Almarai, IBM Plex Sans Arabic, Dubai, Lyon Arabic. A Persian font may lack Arabic-only glyphs
  (and the reverse), which shows as empty boxes or a fallback font — check with the font
  discovery snippet below and `app.fonts.missingOrSubstitutedFonts`.
- **Arabic in ScriptUI / alerts**: same rule as Persian — `\uXXXX` escapes, pure-ASCII file.

Font discovery snippet (user selects a text layer, runs it):

```js
(function () {
    var c = app.project.activeItem;
    if (!(c instanceof CompItem) || !c.selectedLayers.length) { alert("Select a text layer"); return; }
    var td = c.selectedLayers[0].property("ADBE Text Properties").property("ADBE Text Document").value;
    alert("font (PostScript): " + td.font + "\nfamily: " + td.fontFamily + "\nstyle: " + td.fontStyle);
})();
```

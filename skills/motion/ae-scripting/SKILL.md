---
name: "ae-scripting"
description: Write, fix, and extend Adobe After Effects scripts (ExtendScript .jsx) and ScriptUI panels that run first time. Use this whenever the user wants an After Effects script, a .jsx file, a ScriptUI/dockable panel, an automation for AE (build grids of layers, generate shapes, batch-rename, stagger keyframes, create controller/null rigs, replace text, import files, set up render queue), or pastes an AE script error like "Unable to execute script at line…". Also use it when the user writes in Persian or Arabic about "اسکریپت افتر افکت" / "سكربت أفتر إفكتس" / "AE script", or asks for expressions to be applied by a script. Covers ES3 constraints, matchNames, keyframe easing, shape/text layers, RTL Persian and Arabic text, version differences up to AE 26.5, and a linter that must be run before delivering.
---

# After Effects scripting

Goal: hand the user a `.jsx` that runs the first time, is safe to re-run, undoes in one step,
and produces motion that looks designed rather than scripted.

The user is a working motion designer (AE, Premiere, Figma, AI tools). Skip AE basics; explain
only script-specific things (how to run it, what the CONFIG knobs do).

## Hard facts about the environment

- Scripts run in ExtendScript = **ES3**. No `let/const`, arrows, template literals, classes,
  destructuring, spread, default params, `forEach/map/filter`, `trim`, `Object.keys`, `JSON`.
  Still true in AE 26.x (2026) — AE has no UXP scripting. Details: `references/extendscript-es3.md`.
- AE collections are **1-based**; JS arrays AE returns (`selectedLayers`) are 0-based.
- Address properties by **matchName** (`"ADBE Transform Group"`, `"ADBE Opacity"`), never by
  English display name — breaks on non-English AE. Table: `references/matchnames.md`.
- `addProperty()` on an indexed group **invalidates earlier references** into that group.
  Configure each added thing fully before adding the next, or re-fetch it.
- Expressions are a separate engine (usually modern JS). Expression *strings* can be modern;
  the script building them cannot.

## Every script follows this skeleton

Start from `assets/template_basic.jsx` (one-shot script) or `assets/template_panel.jsx`
(dockable panel with inputs). Read the template before writing — it already contains the
helpers below. Non-negotiables, each for a reason:

1. **IIFE wrapper** — AE's engine keeps globals alive between runs; leaked vars collide.
2. **`CONFIG` object at the top** with commented, designer-friendly knobs (counts, sizes, colors
   as hex, timing in frames, seed). The user will tweak and re-run instead of asking for a new
   version for every number.
3. **Validate context** — `activeItem instanceof CompItem`, selection count, layer types — and
   stop with one clear `alert` in the user's terms.
4. **One undo group**, closed in `finally` — a single Ctrl/Cmd+Z reverts the whole run even if it
   throws.
5. **Re-run safe** — tag created layers (`layer.comment = CONFIG.tag`) and delete tagged layers at
   the start (loop backwards), or reuse/update them. Never pile up duplicates or orphan solids.
6. **Frame-snapped keys** and **eased keys** (`keyInTemporalEase(k).length` decides the ease
   array size — never hard-code it).
7. **One summary alert at the end** (what was created, anything skipped). No `alert` in loops.
8. **Version guards** for APIs newer than AE 2023 (`parseInt(app.version, 10)`), see
   `references/version-notes.md`.

## Workflow

1. **Understand the ask.** Pin down: which comp/selection it acts on, what gets created or
   changed, whether the result should be *baked keyframes* or a *live rig* (null with sliders +
   expressions). Default: rig for generative/grid work the user will iterate on; baked keys for
   one-off reveals. Ask at most one question, only if the answer changes the script's structure
   (e.g. "act on selected layers or build new ones?"). Everything else becomes a CONFIG knob with a
   sensible default.
2. **Load only the references you need** (table below).
3. **Write the script** into `/mnt/user-data/outputs/<purpose>_v1.jsx` (bump `_v2`, `_v3` on
   revisions so the user can keep old versions). Comments in English; UI strings/alerts in the
   language the user is writing in (Persian is fine — file is UTF-8).
4. **Lint — mandatory:** `node <skill-dir>/scripts/lint_jsx.js /mnt/user-data/outputs/<file>.jsx`.
   Fix every ERROR. Fix warnings unless there is a stated reason. Re-run until clean. The linter
   parses as real ES3, so a clean pass means AE will at least parse the file.
5. **Self-review** against the checklist below, then present the file.
6. **Reply briefly** in the user's language: what the script does, how to run it
   (`File > Scripts > Run Script File…` with the comp selected; panels go in the
   `ScriptUI Panels` folder + restart), the 3–5 CONFIG knobs that matter, and anything the user
   must do by hand. Don't paste the whole script into chat if it's in the file.

When the user reports an error: ask for (or read) the exact message and line number, check it
against `references/errors.md`, fix the root cause in the file, bump the version, lint again.
If they changed the comp by hand, have them run the state-dump snippet in `errors.md` first.

## Reference map

| Need | Read |
|---|---|
| ES3 rules, helper functions, seeded random | `references/extendscript-es3.md` |
| Creating comps/layers/shapes/effects, value shapes, keyframes & easing, expressions, rigs, parenting, mattes, render queue, performance | `references/dom-cheatsheet.md` |
| Any matchName (transform, shape contents, text animators, effects & params) | `references/matchnames.md` |
| Text layers, fonts, Persian/Arabic RTL, digits, ZWNJ | `references/text-and-rtl.md` |
| Easing presets, stagger patterns, grid math, rig expressions, taste checks | `references/motion-craft.md` |
| Error messages → causes, debug log, state dump | `references/errors.md` |
| Is API X available in version Y? | `references/version-notes.md` |
| JSON needed | `assets/lib/json2.jsx` (public domain) — paste inside the IIFE for single-file delivery |

For anything not covered, the authoritative docs are https://ae-scripting.docsforadobe.dev —
fetch the relevant page instead of guessing a method name or signature.

## Pre-delivery checklist

- [ ] Linter clean (`scripts/lint_jsx.js`)
- [ ] IIFE, CONFIG block, context validation, undo group in `finally`
- [ ] Re-running doesn't duplicate or corrupt anything
- [ ] matchNames only; no references held across `addProperty()`
- [ ] Keys snapped to frames and eased; no hard-coded ease array lengths
- [ ] Latin text layers forced LTR (`td.direction`), titles are ONE layer each
- [ ] Colors 0–1 floats (hex helper for user-facing CONFIG); opacity 0–100; scale in %
- [ ] Newer-than-2023 APIs guarded or the user's version confirmed
- [ ] Large counts considered (>300 layers → warn or use a single shape layer / Repeater)
- [ ] File I/O only if needed, with a clear message if the scripting-files preference is off
- [ ] Final alert summarizes the result

## Scope notes

- `.jsxbin` can't be read or produced here; work from `.jsx` sources.
- CEP/HTML extensions are a different, much larger build — only on explicit request.
- Scripts can't see the viewer. When the look matters, ask for a screenshot after the first run
  and iterate on CONFIG values or the code.

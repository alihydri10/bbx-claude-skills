---
name: seedance-prompts
description: Write, fix, or restructure prompts for ByteDance Seedance 2.5 / 2.0 video generation — including reference-image binding with @Image N, multi-shot timed sequences, native audio, style locks, and edit/extend jobs. Use this whenever the user is preparing a video prompt for Seedance, Dreamina, Jimeng, Doubao, or a Seedance endpoint on Higgsfield / fal / MuAPI / Together, or when they paste a video prompt alongside reference images and ask to make the prompt match those images, fix the style, restructure it, or split it into shots. Also use it when a user's prompt describes one visual style but their attached references clearly show another — catching that contradiction is the single highest-value thing this skill does. Trigger even if the user never says the word "Seedance" but is obviously writing a shot brief for an AI video model with attached references.
---

# Seedance 2.5 prompt construction

Seedance 2.5 reads a prompt as a **shot brief for a whole scene**, not a caption for one moment. It generates up to 30s in a single pass with native audio, accepts up to 30 reference images / 10 video clips / 10 audio clips per generation, and addresses each of them by number (`@Image 1`, `@Video 1`, `@Audio 1`). Prompts that fail usually fail for one of three reasons: the references were never bound to a role, the brief contradicts the references, or the timing was left to the model.

Work in this order. Step 1 is the one people skip, and it's the one that ruins generations.

---

## Step 1 — Audit the references against the brief (do this first, always)

Before writing a single line, look at every attached reference and compare it to what the brief asks for. The model will try to satisfy both, and when they conflict it produces mush.

Check for:

- **Style contradiction.** The brief says "2D anime, cel-shaded, flat" but the reference is a sculpted stop-motion puppet. Or the brief says "photoreal" and the reference is a painterly 3D render. The reference almost always wins in the output, so the *text* is what has to change.
- **Character contradiction.** The brief describes "short dark brown hair, slight build" and the reference clearly shows wild black curls and a long narrow face. Rewrite the description from the reference, not from the brief.
- **Set contradiction.** The brief invents a room full of posters and speakers; the reference shows a bare terracotta plaster wall. Pick one — and if the reference is the style anchor, keep the reference's world.
- **Prop plausibility.** A mechanical field watch can't show a smartwatch UI. Re-stage the gag so it works with the prop that actually exists (hand-drawn light painted over the plate, a projected panel, a practical glow) instead of asking the model to turn the prop into something else.
- **Unusable references.** A reference whose backdrop you don't want still leaks. Say so explicitly: `@Image 2 — take the watch only; ignore its background and its sheet layout.`

When you find a contradiction, **name it to the user in one or two lines and state which way you resolved it** before delivering the prompt. Don't silently pick a side. If the contradiction is fundamental (they genuinely want anime and only have stop-motion references), say the references need to change, not the text.

Then write a short **REFERENCE ROLES** block and put it near the top of the prompt. One reference per thing that must stay stable — a face, a product, a location, a palette. A deliberate set of four beats a cluttered set of twenty.

```
REFERENCE ROLES:
@Image 1 — master style AND character. Inherit the look, the puppet, the palette, the set.
@Image 2 — the watch prop only. Inherit case, dial, strap. Ignore its background and layout.
```

After that, re-tag the references **inline at every point they matter** — in the character block, in each shot where the prop appears, in the style lock. A reference named once at the top drifts by shot three. The user's own inline tags are a feature, not clutter: preserve them.

---

## Step 2 — Build the prompt as labeled sections

One continuous block of plain prose, broken by ALL-CAPS labels. Not keyword tags, not bullet lists, not JSON. Seedance reads sentences.

The skeleton, in order:

```
GLOBAL STYLE: ...
SCENE: ...
REFERENCE ROLES: ...
CHARACTERS: ...
LOCATION: ...
FIRST FRAME AND BLOCKING: ...
FORMAT MODE: ...
SHOT / ACTION TIMING: ...
ACTING AND EMOTIONAL CONTROL: ...
OPTICS AND CAMERA: ...
PHYSICS: ...
LIGHTING: ...
ATMOSPHERE: ...
AUDIO: ...
LOCKS: ...
```

Only GLOBAL STYLE, the shot breakdown, AUDIO, and LOCKS are near-mandatory — plus ACTING AND EMOTIONAL CONTROL whenever a human face is on screen, and ATMOSPHERE whenever the space is meant to feel like a place. Those two are what stop a technically correct render from coming back emotionally flat. Drop any section a reference is already doing the work for — but say that it's the reference doing it. Full section-by-section guidance, including what each section prevents, is in `references/sections.md`. Read it when writing anything longer than a single shot.

Two rules that matter more than the rest:

**One visual rule at the top, one sound rule at the bottom.** Everything between them is shots. GLOBAL STYLE is the contract every later line has to honor; if a shot line implies a different look, the shot line is wrong.

**Timing is explicit or it is improvised.** Give real timestamps with the beat that lands on them — `at 10.9s he plants his foot and the wave detonates` — and write `Hard cut.` where a cut belongs. Pacing lives in the shot breakdown, never in a separate "fast cuts" adjective.

---

## Step 3 — Write LOCKS as positives

Seedance responds better to a stated rule than to a negation. `Exactly two people exist in this video, no third figure, no background double` outperforms a bare `no crowds`. Lock whatever the model is most likely to drift on:

- identity and wardrobe across cuts ("same face, zero drift")
- object count and finger count
- screen direction ("she always travels right-to-left; the camera never crosses the axis")
- one-way state (wet stays wet, the cookie only shrinks, ash never reassembles)
- text and branding ("no logos, all signage unreadable")
- what the effect may and may not do ("the color wave repaints permanently and never strobes exposure")

Negations still belong in GLOBAL STYLE for look ("NOT a clean CGI render, no glossy sheen"), where they're doing style work rather than event work.

---

## Step 4 — Audio, because it generates whether or not you write it

Seedance 2.5 produces dialogue, ambience, and foley in the same pass. Silence in the prompt means the model invents a score. Write AUDIO last and always: the ambient bed, specific effects at specific times, any spoken line in quotes with a delivery note, and what must not be there — usually `No music, no narration, no subtitles.` If music will be added in post, say so explicitly and add `no generated vocals, no melody`.

---

## Step 5 — Match the output to the platform

Ask which endpoint this is going to if it isn't obvious, because the reference syntax and the limits differ:

- **API / MuAPI / Together / fal** — references are array slots; `@Image 1` maps to `images_list[0]`. Duration, aspect ratio, seed are parameters, not prose. Don't put `16:9` in the text if the endpoint takes an `aspect_ratio` field, and note that some Seedance 2.5 endpoints ignore ratio/size params entirely.
- **Higgsfield / Dreamina / Jimeng / Doubao UI** — references are uploaded in slots and referenced in prose; `@Image 1` or plain "the reference image" both read. Aspect ratio and duration are UI fields.
- **Edit or extend jobs** — point at the source clip as the baseline, not as a loose reference, and describe only the change. These modes carry their own ratio/duration constraints.

Deliver the prompt as one copy-pasteable block. If the user works in Persian, Arabic, or another RTL language, keep the prompt itself in English (Seedance handles English and Chinese best) and put any explanation in their language.

---

## Step 6 — Hand back more than the prompt

Close with what's worth knowing, briefly:

- which contradictions you resolved and how
- which single change to try first if the result drifts (see `references/failure-modes.md` — it maps common bad outputs to the section that fixes them)
- when a sequence is too much for one pass: a 15-shot 30s brief in one generation will lose character consistency somewhere. Suggest splitting at a hard cut, generating in two passes with the same references, and cutting them together.

Don't pad. The prompt is the deliverable.

---

## Reference files

- `references/sections.md` — every section, what to put in it, and the specific failure it prevents. Read before writing a multi-shot prompt.
- `references/failure-modes.md` — symptom → fix table for drifting faces, invented music, ignored references, mushy style, timing chaos.
- `references/example-photoreal.md` — two live-action worked examples (product commercial with a real product reference; cinematic narrative), plus the acting and atmosphere vocabulary that carries feeling in photoreal work. Read before any live-action brief.
- `references/example-restyle.md` — a worked example of Step 1: a brief written for one style, attached references showing another, and the rewrite.

This skill is medium-agnostic. GLOBAL STYLE is the slot where the medium goes — photoreal, stop-motion, 2D, documentary, product, UGC — and every other section works the same regardless. The two example files cover opposite ends on purpose.

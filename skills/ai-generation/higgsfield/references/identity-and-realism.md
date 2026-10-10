# Identity and realism

Two recurring problems on this platform, with the fixes that actually work.

---

## Identity Lock — anti face-drift

Soft phrasing ("keep the face the same", "same identity") is not enough; models drift anyway. For each person driven by a face reference, emit an explicit lock:

> CHARACTER N: the person from attached face reference #K — IDENTITY LOCK: reproduce this exact person with a photographic identity match — same bone structure, eye shape, nose, lips, jawline, skin tone, hairline and hair texture as the reference photo. Do NOT beautify, do NOT average with other faces, do NOT restyle the face; it must be recognizably the same person at a glance. Expression: `<emotion phrase>`.

Notes:

- Up to 3 characters in one frame; each gets its own lock, mapped positionally onto the attached references.
- With two or more references, make the **first prompt line** a manifest: `IMAGE REFERENCES: image 1 = CHARACTER 1 face reference; image 2 = brand logo.`
- Drift is stochastic even with the lock. The fix is a re-render, not a reworded prompt — but inspect every render against the reference before showing it.
- Never invent or substitute a person when one was supplied. If a concept needs a person and no face reference exists, ask whose face it should be rather than generating a stranger by default.

**Style references are not face references.** A reference thumbnail or mood image that happens to contain a person is analyzed by eye and turned into prompt fields — it should not go into `medias` at all. Mixing the two is how a stranger's face ends up in the output.

## The de-slop pass — killing waxy skin

`soul_2` holds identity well but renders over-smoothed, waxy skin. The fix is a second pass that changes *only* micro-realism:

1. `media_import_url` on the first render's URL to get an input id. Seedream's `image_references` role rejects a chained `job_id`, so this step is mandatory.
2. `generate_image` with `seedream_v5_pro`, same aspect ratio, `resolution: "2k"`, `medias: [{ value: <input_id>, role: "image_references" }]`, and a prompt shaped like this:

> KEEP EXACTLY the framing, composition, pose, subject and identity of this portrait — no reframe, no zoom, no crop, no change to the person's face / hair / body / clothing. CHANGE ONLY micro-realism: true-to-life pore-level skin with natural texture and fine vellus hair, real material detail, even natural light with gentle highlight roll-off and faint true sensor noise, deep focus. PRESERVE the face's exact shape and proportions 1:1 — do NOT squeeze, narrow, slim or stretch the face. AVOID: waxy plastic skin, airbrushed poreless skin, beauty-filter smoothing, over-saturation, HDR glow, bloom, halos, oversharpening, teal-orange grade, shallow depth of field, bokeh. No added text, no watermark.

The output replaces the original as the locked seed for everything downstream. Moderation block → retry once on `seedream_v5_lite`; still failing → keep the raw render rather than stalling.

Skip this entirely for a user-supplied photo. That gets used as-is and never edited.

## The anti-AI realism module

For any photoreal work, "realistic" is not a synonym for flawless. Idealized skin is the default failure mode, so name the imperfection:

> visible fine skin texture with natural pores, fine lines, subtle asymmetries and texture irregularities, natural visible makeup with slightly uneven foundation blending rather than flawless coverage, faint natural blush, slight natural sheen rather than a glossy or dewy retouched finish, no digital smoothing, no beauty filter, no AI-airbrushed look, skin free of artificial glare or highlight blooms, matte-to-natural complexion

Optional imperfection anchors help: a few faint freckles, a small mole near the collarbone.

Eyes get their own clause, because glowing irises are a strong AI tell:

> naturally muted catchlights, no oversized specular glare in the iris, eye color muted rather than glowing

Hair reads as real through **finish**, not color: "loose voluminous waves, round-barrel blowout finish" beats "wavy brown hair".

## Adult facial structure

Models bias toward babyface proportions. When a character should read as an adult, say so structurally — defined (not soft-round) jaw and cheekbones, longer facial thirds, mature bone structure — and add `no babyface, no overly youthful rounded proportions` to the negative tail.

## Surgical edits on a finished render

For a targeted change, feed the finished render back as i2i (`seedream_v5_pro` at `2k`, the completed job id as the `medias` value) and state that everything else stays pixel-faithful. The pattern:

> Change ONLY `<the one thing>`. Keep identity, face structure, hair, pose, body, clothing, background, lighting and composition EXACTLY unchanged, pixel-faithful.

Edits chain — each accepted output becomes the source for the next. This is far more reliable than re-rendering from scratch and hoping the rest survives.

## Iterating on an established character

Every detail already established — face, hair, body, outfit, accessories, jewelry — carries forward unchanged unless the person explicitly changes it. Restate the whole description each round and alter only what was asked. Leaving details out is what makes a character drift between rounds.

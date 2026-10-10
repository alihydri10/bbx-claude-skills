# Worked example: brief says one style, references show another

This is the most common real situation and the one Step 1 exists for.

## What the user brought

**References:**
- `@Image 1` — a frame from a handcrafted stop-motion film. Sculpted puppet with a long narrow face, wild black curls, very large round eyes, periwinkle matte fabric t-shirt. Sitting up in a sage-green bed. Terracotta plaster wall with hand-painted red-orange stripes. Teal nightstand, potted plant, dusty blue-grey floor. Soft warm daylight, matte surfaces, visible brushstrokes.
- `@Image 2` — a prop design sheet for a vintage mechanical field watch: brushed pewter case, cream dial, brown leather strap, laid out in orthographic views on a terracotta backdrop.

**Brief (abridged):** a 15-second video, "bold 2D anime illustration, cel-shaded flat coloring, thick confident outlines… anime speed lines and impact frames." Character described as "short dark brown hair, slight build." Room described as "anime-style room covered in posters, speakers on shelves." The watch pops up a "glowing holographic notification… a dating app."

## The audit (Step 1)

Four contradictions, all of which would have produced mush:

1. **Medium.** Every style word in the brief (cel-shading, flat color, speed lines) fights `@Image 1`'s sculpted matte materials. The reference wins in the output, so the text has to move. → **Resolved toward the reference:** stop-motion throughout.
2. **Character.** "Short dark brown hair, slight build" contradicts the visible wild black curls, heavy brows, long narrow face. → **Resolved toward the reference,** description rewritten from what's actually in the image.
3. **Set.** Posters and speakers contradict the bare terracotta plaster and painted stripes. → **Resolved toward the reference;** the reference set is also the style anchor, so replacing it would throw away the look.
4. **Prop logic.** `@Image 2` is a mechanical watch with no screen. It cannot display a smartwatch UI. → **Re-staged rather than overruled:** the notification becomes hand-drawn 2D light painted over the puppet plate — which is how stop-motion features actually do FX, so it strengthens the style instead of breaking it.

The brief's *structure* survived all four. Beats, timings, the third-option gag, the detonation — none of that needed touching. Only the medium, the character anchors, the set, and the FX mechanism changed.

**What to tell the user:** name the four, in a sentence or two, and say which way each went. Don't bury it and don't silently pick a side.

## The rewrite (abridged)

```
GLOBAL STYLE: Handcrafted stop-motion animation as in @Image 1 — sculpted
clay-and-fabric puppet, matte painted surfaces with visible brushstrokes and
thumbprint imperfections, zero gloss. Practical miniature set, shallow depth of
field, soft warm directional daylight with gentle falloff. Palette from
@Image 1: terracotta, warm apricot, sage green, muted orange, dusty blue-grey
floor. Electric blue appears only in the hand-drawn light FX. Stepped animation
on 2s, subtle frame-to-frame jitter, fine grain, warm grade. NOT cel-shaded,
NOT flat 2D, NOT a clean CGI render. 2.35:1.

SCENE: A young man oversleeps, panics, rushes to get ready, and picks a
suspicious third option on his watch's route menu.

REFERENCE ROLES:
@Image 1 — master style AND character AND location. Inherit all three.
@Image 2 — the watch prop only. Inherit case, dial, strap. Ignore its
backdrop and its sheet layout.

CHARACTERS: THE MAN, the @Image 1 puppet unchanged — long narrow face, pale
sculpted skin with rosy painted cheeks, very large round eyes with painted
irises, thick dark brows, wild messy black curly hair standing up, periwinkle
matte fabric t-shirt, slim build. He wears the @Image 2 watch on his LEFT
wrist throughout.

FORMAT MODE: Four segments, 15.0s total, three hard cuts, real-time motion.

SHOT / ACTION TIMING: 0.0s–4.0s, SEGMENT 1, the @Image 1 set and framing. He
bolts upright in the sage bed, eyes wide, mouth open, hair standing up. At
1.6s the @Image 2 watch buzzes and a hand-drawn 2D light panel unfolds above
it — painted-glass look, slight flicker — carrying a short message. At 3.2s
his face drops and he throws the duvet off. Hard cut. [...]

LOCKS: The puppet's face, hair and wardrobe are identical in every frame, zero
drift. Exactly one person exists in this video. The @Image 2 watch stays on
the left wrist in every shot and is never redesigned into a screen device. The
hand-drawn FX are the only 2D elements; the puppet and set are never flattened.
Panel text is treated as shapes and marks, not readable type.

AUDIO: Sparse handcrafted foley — fabric rustle, a soft mechanical buzz at
1.6s, bare feet on a hard floor, a small electric pulse at the button press.
No music, no dialogue, no narration, no subtitles.
```

## The lesson

The brief's creative intent was fine. Its *medium* was inherited from a different project and never reconciled with the assets. Catching that before generation saved four wasted renders — and the fix made the style stronger, because a hand-drawn FX layer over a practical plate is a real technique rather than a compromise.

# Video prompts — Cinema Studio 3.5 / Kling 3

## Three-layer architecture

Separate the prompt into three labeled layers. This consistently outperforms one long block, because a single block lets the model average the three concerns together and lose all of them.

**IMAGE** — the frame. Composition, environment, lighting, color, texture, grade.

**IDENTITY** — what must stay the same. Face, hair, build, wardrobe, props. Keep `@image` tags here and repeat them wherever identity matters elsewhere.

**MOTION** — what moves and exactly how. The hardest layer, and the one below.

## Motion must be physical and measured

Vague motion words do nothing on Kling 3. "Slowly flapping", "gently swaying", "moves dynamically" all produce either nothing or an averaged wobble.

Describe motion the way you'd describe it to an animator — with angles, counts, durations, and offsets:

| Doesn't work | Works |
|---|---|
| slowly flapping | rises 30 degrees upward, one full flap every 3 seconds, lower wings delayed |
| gently swaying | tilts 8 degrees left over 2 seconds, holds, returns |
| walks quickly | four steps in 2 seconds, weight landing on each, shoulders leading |
| camera moves in | camera pushes from 4 meters to 2 meters at constant speed |

The pattern: **magnitude + rate + offset.** How far, how fast, and what lags behind what. Offset is what makes motion read as physical rather than rigid — the delayed lower wing, the hair arriving a beat after the head.

## Six-part shot framework

For a single shot, cover in this order:

**Subject → Action → Setting → Camera → Lighting → Style**

Each part one or two sentences. This maps onto the three layers — Subject and Action are IDENTITY and MOTION; Setting, Camera, Lighting, Style are IMAGE. Use the six-part version for a single shot, the three-layer version when identity has to hold across several.

## Positive phrasing

Same platform rule as images, and it matters most here because motion artifacts are what you're tempted to forbid. Write `dimensionally stable throughout the movement`, `proportions hold as the limb extends`, `the silhouette stays readable in every frame` — never `no morphing`, `no warping`, `no distortion`. Naming the artifact tends to produce it.

## Reference tags

`@image1` / `@image2` sit next to the instruction they govern, repeated across layers. In IDENTITY for the face and wardrobe; in IMAGE again if the same reference sets the palette or the set.

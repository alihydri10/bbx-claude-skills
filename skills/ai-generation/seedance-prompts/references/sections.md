# Section catalog

Each section below: what goes in it, and the specific failure that appears when it's missing. Sections are ALL-CAPS labels followed by plain prose. Order matters — the model treats earlier sections as constraints on later ones.

## Contents

1. GLOBAL STYLE
2. SCENE
3. REFERENCE ROLES
4. CHARACTERS
5. LOCATION
6. FIRST FRAME AND BLOCKING
7. FORMAT MODE
8. SHOT / ACTION TIMING
9. OPTICS AND CAMERA
10. PHYSICS
11. LIGHTING
12. AUDIO
13. LOCKS
14. ACTING AND EMOTIONAL CONTROL
15. ATMOSPHERE
16. Optional specialist sections

---

## 1. GLOBAL STYLE

Genre, medium, color grade, film stock or render look, texture, grain, aspect ratio, and an explicit list of what must not appear. Everything after this section has to be consistent with it.

Write the medium concretely. "Cinematic" means nothing; "handcrafted stop-motion, sculpted clay-and-fabric puppet, matte painted surfaces with visible brushstrokes, zero gloss" gives the model something to hold. Negations belong here and nowhere else: `NOT a clean CGI render, no plastic sheen, no video-game look.`

**Missing →** the look drifts between shots, and the model defaults to glossy generic 3D or a stock cinematic grade.

## 2. SCENE

One line. What happens, where, in what mood. Save all detail for later sections — this is the logline that orients everything else.

**Missing →** the model over-weights whichever later section is most detailed and loses the through-line.

## 3. REFERENCE ROLES

One line per reference, naming what it governs and what to ignore in it.

```
@Image 1 — master style and character; inherit look, palette, set.
@Image 2 — product only; ignore its background.
@Video 1 — camera movement and blocking only; ignore its subject.
@Audio 1 — voice timbre for the narrator.
```

A textureless 3D blockout passed as `@Video 1` works as literal staging — the model reads camera movement and spatial layout from it rather than inventing them.

**Missing →** references blend: backgrounds leak, a style reference starts dictating wardrobe, a product reference contributes its studio backdrop.

## 4. CHARACTERS

Face, hair, build, wardrobe, age, and any permanent identifying detail (a scar, a bracelet, a hat). One paragraph per person, named in caps (`THE MAN`, `ANNA`). If a reference covers a character, still write two or three anchors — hair, wardrobe, build — because those are what the model checks against between cuts.

Add progressive state where it applies: what accumulates (soot, sweat, ash) and never resets.

**Missing →** faces drift after the second cut; wardrobe changes mid-sequence.

## 5. LOCATION

The space and its props, separate from the people in it. Materials, colors, what's foreground / midground / background, and what is explicitly absent.

**Missing →** this is the single most common cause of drift across cuts in a multi-shot sequence.

## 6. FIRST FRAME AND BLOCKING

Exact starting positions at t=0: who is where, facing which direction, at what screen coordinates if it matters (`x 42%, head at y 44%`). Note reverse-angle behavior so characters don't swap sides.

State if the first frame must already contain the subject — otherwise the model often burns the first second on an empty establishing frame.

**Missing →** positions get invented and flip across cuts.

## 7. FORMAT MODE

Total runtime, number of segments, where the hard cuts fall, real-time vs slow motion, whether ambience is continuous across cuts, and whether there's spoken dialogue at all.

**Missing →** the model chooses its own cut rhythm and may add speed ramps or slow motion you didn't ask for.

## 8. SHOT / ACTION TIMING

The core of the prompt. Label each shot or segment, give its time range, its shot type, and the action in one or two sentences. End with `Hard cut.` where a cut belongs.

Put beats on real timestamps: `at 6.4s he draws the sword`, `at 13.2s a single tear breaks from her right eye`. For anything recurring — waves, footfalls, impacts, explosions — write it as an **event track**: a list of times with magnitudes, deliberately irregular so no two read alike.

Rule of thumb: under 2s per shot reads as fast cutting; a held beat needs 2s or more to land. Nine shots in 15s is aggressive but works; twenty-four beats in 30s is at the edge.

**Missing →** pacing is improvised, cuts land on still poses, and timed gags (a notification appearing, a button press) drift off their beat.

## 9. OPTICS AND CAMERA

Two things: the glass (focal length or diagonal field of view, depth of field, anamorphic character, flare) and the movement (handheld, dolly, crane, locked-off, orbit) — per shot.

Lock focal length per segment if you want consistency (`LENS LOCK SEGMENT 2: 29° diagonal FOV, camera 4m from the face`). Describe camera *behavior*, not just type: "the camera lags behind her, over-corrects, catches up" produces something specific; "dynamic camera" doesn't.

**Missing →** every shot arrives as a smooth mid-shot dolly.

## 10. PHYSICS

How anything non-rigid behaves: fabric, hair, liquid, smoke, paper, ash, crowds. Also real-weight rules for bodies and vehicles — heel strike, weight transfer, suspension dip, follow-through on a swing.

This section is where you kill the floaty look. If a substance is going to appear in quantity, give it explicit mechanics: individual banknotes with fibre texture drifting on their own air currents, not a rigid block of money.

**Missing →** solids float, liquids read as plastic, crowds move as one mass.

## 11. LIGHTING

Source, direction, quality, motivation, and how it falls on faces. Go further than GLOBAL STYLE: name where the light comes from and whether it changes during the clip.

For effect-heavy shots, state whether an effect adds saturation or exposure — "the waves add saturation, not exposure" prevents strobing.

**Missing →** flat even lighting, or exposure that pumps between cuts.

## 12. AUDIO

Always present. Ambient bed, specific effects on specific timestamps, spoken lines in quotes with delivery notes, and the exclusions — `No music, no narration, no subtitles.`

If music is added in post: say `music added in post, no generated vocals, no words, no melody from the model`, and if mouths move, note that mouth motion is cadence, not synced to specific words.

**Missing →** the model scores the clip itself, usually with generic library music, and may add unwanted dialogue.

## 13. LOCKS

Positively-phrased invariants. Identity and wardrobe consistency, exact counts (people, objects, fingers), screen direction, one-way state changes, branding and text rules, and the boundaries of any effect.

Phrase as a rule, not a prohibition: `exactly four members, never five, no duplicated member, no reflection showing an extra copy` beats `no extra people`.

**Missing →** counts multiply, states reset, text appears, effects spread where they shouldn't.

---

## 14. ACTING AND EMOTIONAL CONTROL

Near-mandatory whenever a human face is on screen. Name the feeling once, then spend the section on physical behavior and timing — and state what the face must not do.

Describe suppression, not expression: `grief held beneath composure`, `understated, self-conscious, no performing`, `reactions arrive a half-beat late`, `smiles start small and grow`, `tears welling without falling`, `tension held without release`, `her gaze never finds the lens`. Add micro-acting: natural blink rate, throat swallows, a breath caught and let go. Close with the prohibition: `no wide eyes, no exaggerated faces, no performing`.

Also specify what the body may *not* do, if restraint is the point — a STILLNESS LOCK (`nobody stands, nobody embraces`) is what makes held emotion read as held rather than absent.

**Missing →** performed emotion. Announced feelings, camera-ready smiles, instant reactions — the single most common reason a technically correct photoreal render feels dead.

## 15. ATMOSPHERE

Give the air a material and the space layers. What's suspended in it — haze, dust motes, steam, spray, fine rain, smoke (and where the smoke travels). Three depth layers, each with something in it. One named motivated source. How the atmosphere changes over the clip, because static air reads as a set rather than a place.

Pair it with an **event track** for ambient life: timed, irregular, magnitudes stated, deliberately non-repeating. Dropping the ambient level under a spoken line is a sound decision doing emotional work.

**Missing →** empty clean air between camera and subject, flat depth, and a space that reads as a studio no matter how well it's lit.

## 16. Optional specialist sections

Add only when the shot needs them — each one is a place to concentrate a rule that would otherwise be scattered:

- **TEXTURE AND REALISM** — the anti-plastic block. Grain, gate weave, halation, chromatic aberration, lens breathing, subsurface response. Or, for handcrafted looks: brushstrokes, thumbprints, fabric weave, stepped animation on 2s.
- **DUAL-QUALITY SYSTEM** — when a clip mixes looks (clean cinema vs degraded phone footage). Tag each beat and state that the degradation never leaks into the clean beats.
- **TRANSITION MOTIF** — match cuts and what they rhyme on (round shapes, eyes, light).
- **EVENT TRACK** — timed environmental events: waves, gusts, impacts, sparks.
- **SLOW MOTION** — exactly which beats, and `no other slow motion, no speed ramps` for the rest.
- **DIRECTION / BEACH MAP / LOCATION MAP** — the spatial axis rule when screen direction must hold across many cuts.
- **PROGRESSION LOCK** — when time passes within the clip: crowd size, light state, accumulated mess as the clock.
- **FRAMING RESPECT LOCK** — when a human subject should be filmed as a person, not a body: face and action only, no lingering pans, no isolated body-part shots, no low angles.
- **IDENTITY LOCK / NO-IP LOCK** — all faces fictional and resembling no real person; no logos, trademarks, or readable signage; original non-descript music.

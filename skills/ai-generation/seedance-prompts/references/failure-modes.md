# Failure modes: symptom → fix

When a generation comes back wrong, change one thing. Changing five sections at once means you learn nothing from the next render.

| Symptom | Most likely cause | Fix |
|---|---|---|
| Output looks nothing like the reference | reference never bound to a role | add REFERENCE ROLES, then re-tag `@Image N` inline in every section where it matters |
| The reference's *background* showed up | reference passed wholesale | `@Image 2 — the product only; ignore its background and layout` |
| Style is a mush of two looks | brief contradicts the reference | rewrite the text to match the reference; the reference wins in the output |
| Face changes after the second cut | CHARACTERS too thin, or too many references | give 3 hard anchors (hair, build, wardrobe) + `same face, zero drift`; cut the reference set down |
| A fifth person appears in a group of four | no count lock | `exactly four, never five, no duplicate, no reflection showing an extra copy` |
| Everything reads glossy 3D / plastic | no TEXTURE section | add TEXTURE AND REALISM with concrete material behavior and explicit `NOT a clean CGI render` |
| Music you didn't ask for | AUDIO section missing | always write AUDIO; `No music, no narration, no subtitles` |
| Unwanted dialogue or lip flap | AUDIO didn't exclude speech | `nobody speaks` or `mouth motion is cadence, not synced to words` |
| Cuts land on still poses | pacing left implicit | put timestamps on beats and `Hard cut.` at each cut; every cut lands on movement |
| A timed gag drifts off its beat | beat not timestamped | `at 10.9s the notification panel unfolds` |
| Characters swap sides between cuts | no axis rule | DIRECTION block: subject always travels one way, camera never crosses the axis |
| Wet/dirty/damaged state resets | no one-way rule | `wetness only accumulates, never resets`; `the cookie only shrinks, never regrows` |
| Slow motion appears uninvited | no speed rule | name the exact slow beats, then `no other slow motion, no speed ramps` |
| Water, cloth, smoke moves like a solid | no PHYSICS section | give the substance explicit mechanics — individual units, drag, inertia |
| Exposure pumps during an effect | effect not bounded | `the effect adds saturation, not exposure` |
| First second wasted on an empty frame | no first-frame rule | `the first visible frame already contains the subject; no delayed reveal` |
| Readable text is garbled | model can't render type reliably | don't rely on it — ask for the text element as a *shape* and set real type in post; or keep it to one short word and accept the risk |
| Character consistency collapses late in a long clip | too much for one pass | split at a hard cut, generate two passes with the same references, cut together |
| Aspect ratio ignored | ratio in prose but endpoint has a parameter | move it to the parameter; some Seedance 2.5 endpoints ignore ratio/size params entirely |

## On splitting

A 30s single-pass generation is possible but consistency degrades with shot count. Practical guidance: up to about 8–10 shots in one pass holds together with good locks. Beyond that, split at a hard cut. Reuse the identical reference set and the identical GLOBAL STYLE / CHARACTERS / LOCKS blocks in both passes — that's what makes the two halves cut together.

## On text and UI elements

Generated type is unreliable in every current video model. For anything with readable words — a notification, a button label, a sign — either:

1. Describe the panel as a *shape* with unreadable placeholder marks, and composite real type in After Effects; or
2. Keep it to one or two short words, accept that some renders will be garbled, and plan to reroll.

Option 1 is almost always the right call for client work.

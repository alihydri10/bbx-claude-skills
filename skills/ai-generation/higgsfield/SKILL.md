---
name: higgsfield
description: Generate or edit images and video through Higgsfield — model selection, the MCP asset-upload and editing workflow, aspect ratios, retry behavior, and the prompt architecture that actually converges. Use this whenever the user is generating an image or video on Higgsfield, Cinema Studio, or Kling 3 through Higgsfield, editing an existing image with nano_banana, building a character turnaround or design sheet, or asking why a Higgsfield generation failed, drifted, or ignored their reference. Also use it whenever writing an image or video prompt that uses @image tags, or when a generation "failed to build" and the user wants to know what to do. Trigger even if the user only names a model (gpt_image_2, nano_banana_2, nano_banana_pro, Kling 3) without naming Higgsfield.
---

# Higgsfield

Everything here is hard-won from actual runs on this account. Follow the mechanics exactly — most Higgsfield failures are workflow mistakes, not prompt mistakes.

---

## Model selection

Pick by job, not by version number. Newer is not better here.

| Job | Model | Notes |
|---|---|---|
| Character design, portraits, turnarounds | `gpt_image_2` | Consistently high quality for character work on this account. |
| Editing an existing image (image-to-image) | `nano_banana_2` | Pass the source via the `medias` parameter. |
| Text rendering, layout-structured prompts, design sheets | `nano_banana_pro` | Strong on type and layout — but less reliable for character design. Don't reach for it just because it's "pro". **Its default resolution is 1k — pass `resolution: "4k"` explicitly** or you get a soft render. |
| Highest-quality poster/thumbnail render | `nano_banana_pro` at `4k` | Note `nano_banana_2` is the faster Flash/base tier, not a downgrade of pro. |
| Surgical i2i edit on a finished render | `seedream_v5_pro` at `2k` | Paid plans only; on a free plan or catalog miss fall back to `seedream_v4_5` with `quality: "high"`. |
| Identity-locked person (portrait, UGC, editorial) | `soul_2` | Needs the de-slop pass below. |
| Product, commercial, ad stills | `marketing_studio_image` | |
| Upscaling | ByteDance upscale provider | |
| Video | Cinema Studio 3.5 with Kling 3; `seedance_2_5` for general video | See `references/video-prompts.md`. |

Before assuming a model exists, verify with `Higgsfield:models_explore` using `action: "list"` and `type: "image"`. Keyword search on that tool is unreliable; the full list is not.

## Aspect ratios

- `3:4` — single character portraits
- `16:9` — turnarounds, multi-angle sheets, design sheets
- `4:5` — exists on Nano Banana only. **No Seedream tier has 4:5**, so an i2i tweak on a 4:5 render has to drop to `3:4`.

## Credits and unlim

`use_unlim` is opt-in and the person's call — never add it to save them credits on your own initiative. Unlim grants have so far covered `1k` and `2k` only, so a `4k` render with the flag comes back `unlim_config_not_covered`. When they want to spend unlim on something that locks 4k, ask which they prefer rather than silently downgrading the output or silently charging.

## One submit per variant

Never use `count: N` to produce variants that need different prompts. Emotions, takes, and angles each need their own prompt, so they each need their own call — submitted in parallel. `count` is only for true variants of one identical prompt.

## Getting images in

This is the step people get wrong, and it silently produces a generation that ignores the reference.

**A local file** must go through `Higgsfield:media_upload_widget`. A Claude chat attachment is *not* a Higgsfield asset — attaching it here does nothing on their side.

**A URL** goes through `Higgsfield:media_import_url`, which returns an asset ID.

Then pass the asset into the `medias` array:

```json
{"role": "image", "value": "[asset-id]"}
```

## When a generation fails

"Failed to build" is usually transient. **Resubmit the identical prompt, unchanged.** Don't rewrite it — rewriting a prompt that would have worked is how you lose a good prompt. Only after a second identical failure should you look at the prompt itself.

---

## Prompt architecture

Two rules cut across both image and video work on this platform:

**Positive descriptors in the prompt body.** Inside the main prompt, Higgsfield responds to constructive phrasing rather than prohibitions: write `dimensionally stable` rather than `no morphing`, `edges hold their shape` rather than `no warping`. A negation buried mid-prompt often produces the thing it names.

The exception is a **negative tail** — a dedicated exclusion list at the very end, or in the model's negative field where one exists. That does work, and the official workflows rely on it heavily (`no text, no watermark, no logos, no frame borders`, `no babyface`, `no beauty filter, no digital smoothing, no plastic skin`, `single subject only, exactly one person, no duplicate figures`). So: positive phrasing throughout the body, exclusions collected in one block at the end. Don't scatter negations through the description.

Seedance behaves differently again — there, negations belong in the GLOBAL STYLE block at the top. Don't carry habits between platforms.

**`@image` tags go next to the instruction they govern, not grouped at the top.** A tag block at the start drifts. Repeat the tag inline in every section where that reference matters — lighting, composition, color grade, subject form. One reference per thing that must stay stable.

Then read the relevant file:

- `references/identity-and-realism.md` — the Identity Lock block, the de-slop pass for waxy skin, the anti-AI realism module, and surgical i2i edits. Read before any work with a face reference or any photoreal output.
- `references/image-prompts.md` — image prompt structure, `@image` role assignment, negative prompt blocks, and the iteration order that converges.
- `references/video-prompts.md` — the three-layer IMAGE / IDENTITY / MOTION architecture, the six-part shot framework, and how to describe motion so Kling 3 actually executes it.

---

## Iteration is the workflow

Higgsfield output converges through rounds, not through one perfect prompt. Start from a reference and narrow in a fixed order:

1. **Composition** — framing, shot type, placement
2. **Element removal** — get rid of what shouldn't be there
3. **Action specificity** — pin down exactly what the subject is doing

Doing these out of order wastes rounds: refining an action inside a composition you're going to change is work thrown away. Change one thing per round so each render tells you something.

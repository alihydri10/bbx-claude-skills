# Image prompts

## Structure

A working Higgsfield image prompt has four parts:

1. **Shot type** — close-up, medium, or wide. State it explicitly; leaving it out is the most common cause of a framing you didn't want.
2. **Main prompt** — detailed, in prose, with `@image` tags placed inline wherever a reference governs something.
3. **Negative prompt block** — separate from the main prompt, not mixed into it.
4. **Parameters** — model, aspect ratio, `medias` array for image-to-image.

## Assigning reference roles

Give each reference one job and name it at the point of use, not in a list at the top:

```
@image1 — lighting, mood, and scene
@image2 — botanical form / subject form
```

Then in the prompt body, the tag reappears wherever it applies:

> Soft directional light raking from the left as in @image1, the leaf structure and venation exactly as in @image2, warm color grade carried from @image1 across the whole frame.

The same reference appearing in the lighting note, the composition note, and the color-grade note is what holds it in place. A reference named once at the top stops mattering by the time the model reaches the composition.

## Negative prompt block

Keep it separate and keep it short. Note the platform split: negatives belong *only* in this block. Inside the main prompt, phrase everything positively — `dimensionally stable`, `edges hold their shape`, `consistent proportions` — because a prohibition in the main body tends to summon what it forbids.

## Text in images

When the image has to carry readable words:

- put the exact text in quotes
- give a font descriptor rather than a font name
- keep it to roughly 20 words maximum

Beyond that, fidelity drops fast. For client work with real typography, generate the layout with placeholder marks and set the actual type in Figma or After Effects — cleaner result, full control over hierarchy, and no rerolls chasing a rendered letterform.

Use `nano_banana_pro` when type and layout structure are the point of the image.

## Image-to-image editing

1. Get the source in — `media_upload_widget` for a local file, `media_import_url` for a URL.
2. Take the returned asset ID.
3. Pass it as `{"role": "image", "value": "[asset-id]"}` in the `medias` array.
4. Use `nano_banana_2`.
5. Describe the *change*, not the whole image. An edit prompt that re-describes everything invites the model to regenerate everything.

## Iteration order

Composition → element removal → action specificity. One change per round.

Refining a subject's action inside a frame you're about to recompose is wasted work. Get the frame right, clear out what shouldn't be in it, then pin the action.

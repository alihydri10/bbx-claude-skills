# Motion craft for scripted animation

The user is a professional motion designer. Scripted motion should look hand-keyed: eased,
staggered, with hierarchy. Linear keys and everything-at-once read as "made by a script".

## Easing presets (KeyframeEase influence; speed 0 unless noted)

| Feel | Out of first key | Into last key | Notes |
|---|---|---|---|
| AE Easy Ease (F9) | 33.33 | 33.33 | Baseline, a bit soft |
| Smooth UI | 60 | 80 | Good default for cards/text |
| Expo-like (fast start, long settle) | 90 | 95 | Premium/tech look |
| Snappy in | 10 | 90 | Quick launch, soft landing |
| Anticipation | add a small opposite key ~3–5 frames before | | Adds weight |
| Overshoot | extra key past target at ~70% time, then settle | 70 / 70 | Or use an expression rig |

Implement with the `easeKey()` helper (dom-cheatsheet §5): out-influence is set on the first
key's *out*, in-influence on the last key's *in*. For multi-key moves, ease every key.

## Stagger patterns

Compute a delay per element, in frames, then offset its keys by `delay * comp.frameDuration`.

```js
// i = element index (0-based), n = total, col/row = grid coords, cols/rows = grid size
function staggerOrder(mode, i, n, col, row, cols, rows, rnd) {
    switch (mode) {
        case "linear":   return i;
        case "reverse":  return n - 1 - i;
        case "rows":     return row;
        case "cols":     return col;
        case "diagonal": return col + row;
        case "center": {                                    // ripple from middle
            var cx = (cols - 1) / 2, cy = (rows - 1) / 2;
            return Math.sqrt((col - cx) * (col - cx) + (row - cy) * (row - cy));
        }
        case "random":   return rnd() * n;                  // seeded, see extendscript-es3.md
    }
    return i;
}
// delayFrames = order * CONFIG.staggerFrames  (normalize "center"/"random" if you want a fixed total spread)
```

Normalizing to a total duration is often nicer to control than per-step frames:
`delay = (order / maxOrder) * CONFIG.totalStaggerFrames`.

## Grid math

```js
// Fit a cols x rows grid of cells with a gap, centered in the comp
var cellW = (comp.width  - CONFIG.margin * 2 - CONFIG.gap * (cols - 1)) / cols;
var cellH = (comp.height - CONFIG.margin * 2 - CONFIG.gap * (rows - 1)) / rows;
var x = CONFIG.margin + col * (cellW + CONFIG.gap) + cellW / 2;
var y = CONFIG.margin + row * (cellH + CONFIG.gap) + cellH / 2;
```

For square cells: `size = Math.min(cellW, cellH)` then recompute margins to re-center.
Name layers so the timeline stays readable: `"Cell_r03_c07"` with `pad()`.

## Rig expressions worth reusing (inject as strings)

Stagger driven by layer index and a CTRL null:
```
var c = thisComp.layer("CTRL");
var d = c.effect("Delay (frames)")("Slider") * framesToTime(1);
var i = index - c.index - 1;
valueAtTime(time - i * d)
```
(Apply to a property that already has the "hero" keyframes — every layer copies them, offset.)

Inertial bounce after last key (classic, safe for JS engine):
```
var amp = 0.06, freq = 3.0, decay = 6.0, n = 0;
if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }
if (n > 0 && time > key(n).time) {
  var t = time - key(n).time, v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
} else value;
```

Loop: `loopOut("cycle")`, `loopOut("pingpong")`. Seeded wiggle: `seedRandom(index, true); wiggle(1, 20)`.

When writing expression strings from ExtendScript, join lines:
```js
prop.expression = [
    'var c = thisComp.layer("CTRL");',
    'var d = c.effect("Delay (frames)")("Slider") * framesToTime(1);',
    'valueAtTime(time - (index - c.index - 1) * d)'
].join("\n");
```

## Taste checks before delivering
- Nothing linear unless intentional (type-on, counters, mechanical).
- Opacity alone is weak — combine with a small position/scale move (10–40 px, 90→100%).
- Stagger total ≤ ~40% of the move duration, or it drags.
- Motion blur on for fast moves (`layer.motionBlur = true; comp.motionBlur = true`).
- Durations: UI/micro 8–15 frames @30fps; reveals 15–25; big transitions 20–40.

# After Effects DOM cheatsheet

Source of truth: https://ae-scripting.docsforadobe.dev (community mirror of Adobe's guide).
When unsure whether a method exists or what it returns, look it up there — don't guess.

## Contents
1. Object tree & indexing
2. Getting the comp / selection
3. Creating things (comps, layers, shapes, text, nulls, solids)
4. Properties: reading, setting, value shapes
5. Keyframes & easing
6. Expressions from a script (and controller rigs)
7. Parenting, precomposing, track mattes, markers
8. Files, import, render queue
9. Performance

---

## 1. Object tree & indexing

```
app
└─ project
   ├─ items (ItemCollection)        project.item(i), 1-based
   │   ├─ CompItem  → layers (LayerCollection), comp.layer(i) 1-based, 1 = top
   │   ├─ FootageItem (mainSource: FileSource | SolidSource | PlaceholderSource)
   │   └─ FolderItem
   └─ renderQueue → items → RenderQueueItem → outputModule(i)
Layer → PropertyGroup ("ADBE Transform Group", "ADBE Effect Parade", ...) → Property
```

- AE collections: 1-based (`layer(1)`, `item(1)`, `property(1)`, `keyTime(1)`).
- Plain JS arrays AE hands you are 0-based: `comp.selectedLayers`, `comp.selectedProperties`,
  `prop.selectedKeys`.
- Deleting while looping → loop backwards.
- Stable references: `layer.id` (AE 22+) with `app.project.layerByID(id)`; `item.id` for items.
  Names are not unique; indices shift.

## 2. Getting the comp / selection

```js
var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) { alert("Select a comp"); return; }
var sel = comp.selectedLayers;             // [] if none
```

`activeItem` is whatever panel has focus: null, a comp, footage, or folder. If the script will
be run while the Project panel has several items selected, `activeItem` is null — tell the
user to click in the timeline first. For batch jobs, find comps by name instead:

```js
function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}
```

## 3. Creating things

```js
var c = app.project.items.addComp("Name", 1920, 1080, 1, 10, 30); // w,h,pixelAspect,duration(s),fps
c.bgColor = [0, 0, 0];
c.openInViewer();

var nul = comp.layers.addNull();                // default 100x100
var sol = comp.layers.addSolid([1,1,1], "BG", comp.width, comp.height, 1, comp.duration);
var adj = comp.layers.addSolid([1,1,1], "Adj", comp.width, comp.height, 1); adj.adjustmentLayer = true;
var txt = comp.layers.addText("Hello");         // point text
var box = comp.layers.addBoxText([800, 200]);  // box text: size only — set text via Source Text afterwards
var cam = comp.layers.addCamera("Cam", [comp.width/2, comp.height/2]);
var shp = comp.layers.addShape();               // empty shape layer
```

Solids create a FootageItem every time → re-running a script piles up "Solids" in the
project. Prefer shape layers for rectangles/backgrounds, or reuse an existing solid source
with `layer.replaceSource(existingSolidItem, false)`.

New layers are inserted at the top (index 1) and span the whole comp. Trim with
`layer.inPoint`, `layer.outPoint`, move with `layer.startTime`.

### Shape layer: rectangle with fill (the canonical pattern)

```js
var shp = comp.layers.addShape();
shp.name = "Box";
var contents = shp.property("ADBE Root Vectors Group");
var grp = contents.addProperty("ADBE Vector Group");
grp.name = "Box";
var inner = grp.property("ADBE Vectors Group");
var rect = inner.addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([200, 200]);
rect.property("ADBE Vector Rect Roundness").setValue(12);
var fill = inner.addProperty("ADBE Vector Graphic - Fill");
fill.property("ADBE Vector Fill Color").setValue([1, 0.4, 0.2]);   // RGB 0–1 (4th alpha optional)
```

After every `addProperty()` on an *indexed* group, earlier references into that group can go
invalid ("Object is invalid"). Safe order: add a child, configure it fully, then add the next.
If you must come back to an earlier one, re-fetch it by `propertyIndex` or matchName. This also
applies to the Effects parade (add effect → set its params → add next effect).

Shape position: the group's transform (`ADBE Vector Transform Group` → `ADBE Vector Position`)
moves the shape inside the layer; the layer transform moves the whole layer. For grids of many
elements decide which one you're animating (see §9).

Custom path:

```js
var pathGrp = inner.addProperty("ADBE Vector Shape - Group");
var s = new Shape();
s.vertices = [[0,0],[100,0],[100,100]];
s.inTangents = [[0,0],[0,0],[0,0]];
s.outTangents = [[0,0],[0,0],[0,0]];
s.closed = true;
pathGrp.property("ADBE Vector Shape").setValue(s);
```

### Effects

```js
var fx = layer.property("ADBE Effect Parade");
var blur = fx.addProperty("ADBE Gaussian Blur 2");
blur.property("ADBE Gaussian Blur 2-0001").setValue(20);   // Blurriness
```

Effect parameter matchNames are `<effect matchName>-000N`. If you don't know N, it's safer
to read `effect.property(i).name` in a loop once, or address by index with a comment.
Third-party effects (Deep Glow, Saber, etc.) only work if installed — check
`app.effects` or wrap `addProperty` in try/catch and report.

## 4. Properties

```js
var tr = layer.property("ADBE Transform Group");
var pos = tr.property("ADBE Position");
pos.value;                       // current value at comp time (not animated → constant)
pos.valueAtTime(1.5, false);     // false = with expressions applied
pos.setValue([960, 540]);        // fails if the prop has keyframes → use setValueAtTime
```

| Property            | Value shape                        | Notes |
|---------------------|------------------------------------|-------|
| Position / Anchor   | `[x, y]` or `[x, y, z]` if 3D       | pixels, layer space for anchor |
| Scale               | `[x, y]` / `[x, y, z]`              | percent (100 = 100%) |
| Rotation (Z)        | number                             | degrees |
| Opacity             | number 0–100                       | |
| Colors              | `[r, g, b]` or `[r, g, b, a]` 0–1   | hex → `[r/255, g/255, b/255]` |
| Slider / Angle      | number                             | |
| Checkbox            | 0 / 1                              | |
| Point Control       | `[x, y]`                            | comp pixels |
| Dropdown            | 1-based index                      | set items via `setPropertyParameters([...])` (17.0.1+) |
| Source Text         | `TextDocument`                     | see text-and-rtl.md |
| Path                | `Shape` object                     | |

Separated dimensions: if `pos.dimensionsSeparated`, use `ADBE Position_0/_1/_2`.
Enable 3D: `layer.threeDLayer = true` before setting 3-value arrays.
`prop.canSetExpression`, `prop.canVaryOverTime`, `prop.propertyValueType` help guard generic code.

Hex helper:
```js
function hex(h) { h = h.replace("#", ""); return [parseInt(h.substr(0,2),16)/255, parseInt(h.substr(2,2),16)/255, parseInt(h.substr(4,2),16)/255]; }
```

## 5. Keyframes & easing

```js
var op = tr.property("ADBE Opacity");
op.setValuesAtTimes([0, 0.5], [0, 100]);      // fast: many keys in one call
var k = op.addKey(1.0); op.setValueAtKey(k, 50);
op.numKeys; op.keyTime(1); op.keyValue(1);
op.removeKey(1);                               // loop backwards to clear: for (k=numKeys; k>=1; k--)
```

- Snap times to frames: `Math.round(t / comp.frameDuration) * comp.frameDuration`. Off-frame
  keys look fine in the graph but cause half-frame jitter and confuse the user when editing.
- Times are comp time in seconds. For a layer whose `startTime` ≠ 0 the key time is still comp
  time.

Easing (`KeyframeEase(speed, influence)`; influence 0.1–100):

```js
function easeKey(prop, k, inInfl, outInfl) {
    var n = prop.keyInTemporalEase(k).length;   // 1, 2 or 3 — ask AE, don't guess
    var a = [], b = [];
    for (var d = 0; d < n; d++) { a.push(new KeyframeEase(0, inInfl)); b.push(new KeyframeEase(0, outInfl)); }
    prop.setTemporalEaseAtKey(k, a, b);
}
```

Why ask AE for the length: Position is spatial → 1 ease object even though it's `[x,y]`;
Scale is non-spatial `[x,y,z]` → 3; Color → 1. Hard-coding lengths is a classic crash
("Value is not an array of the correct length").

Other key controls:
```js
prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);   // hold key
prop.setSpatialContinuousAtKey(k, true); prop.setSpatialAutoBezierAtKey(k, false);
prop.setTemporalAutoBezierAtKey(k, false);
prop.setRovingAtKey(k, true);
```
Speed ≠ 0 is only needed for "overshoot"-style curves; for classic easy-ease, speed 0 is right.

## 6. Expressions from a script

```js
prop.expression = "wiggle(2, 30)";
if (prop.expressionError) report.push(layer.name + ": " + prop.expressionError);
```

- Project engine: `app.project.expressionEngine` is `"javascript-1.0"` (default for new
  projects since AE 16) or `"extendscript"`. With the JS engine the expression text may use
  modern syntax (`const`, arrows, template literals) — but you are building that text inside
  an ES3 script, so assemble it with `+` / `.join("\n")`.
- `expressionError` is only filled after AE evaluates; reading it right after assignment usually
  works but can be empty until the comp renders.
- Reference other layers/effects by name inside expressions (`thisComp.layer("CTRL").effect("Delay")("Slider")`)
  — that's what users expect to see and edit. Expressions can't read script variables; bake
  numbers into the string.

### Controller rig pattern (preferred when the user will tweak)

Instead of baking 400 keyframes, create one null with slider/checkbox/color controls and
expressions that read them. The user tweaks timing/spacing live without re-running.

```js
var ctrl = comp.layers.addNull(); ctrl.name = "CTRL"; ctrl.enabled = false; // guide-ish, invisible
var fx = ctrl.property("ADBE Effect Parade");
var s1 = fx.addProperty("ADBE Slider Control"); s1.name = "Delay (frames)";
s1.property("ADBE Slider Control-0001").setValue(2);      // set before adding the next effect
var s2 = fx.addProperty("ADBE Slider Control"); s2.name = "Spacing";
s2.property("ADBE Slider Control-0001").setValue(120);
```

Control matchNames: `ADBE Slider Control`(-0001), `ADBE Angle Control`(-0001),
`ADBE Checkbox Control`(-0001), `ADBE Color Control`(-0001), `ADBE Point Control`(-0001),
`ADBE Point3D Control`(-0001), `ADBE Layer Control`(-0001), `ADBE Dropdown Control`(-0001).

Rule of thumb: bake keyframes when the user wants to hand-edit curves afterwards or the
result must be frozen; build a rig when they want to iterate on numbers. Ask if it's unclear
and it matters; otherwise default to a rig for generative/grid work and keyframes for one-off
reveals.

## 7. Parenting, precompose, mattes, markers

```js
child.parent = ctrl;                                    // keeps visual position
child.setParentWithJump(ctrl);                          // jumps to parent's space
var idx = [1, 2, 3];                                    // layer indices, not objects
var pre = comp.layers.precompose(idx, "Precomp Name", true); // true = move attributes into new comp
// Track matte (AE 23+):
layer.setTrackMatte(matteLayer, TrackMatteType.ALPHA);  // ALPHA, ALPHA_INVERTED, LUMA, LUMA_INVERTED
layer.removeTrackMatte();
// Markers:
var m = new MarkerValue("Beat"); m.duration = 0;
comp.markerProperty.setValueAtTime(2, m);               // comp marker
layer.property("ADBE Marker").setValueAtTime(1, new MarkerValue("hit"));
layer.label = 9;                                        // 0–16 label color index
layer.shy = true; comp.hideShyLayers = true;
layer.motionBlur = true; comp.motionBlur = true;
layer.blendingMode = BlendingMode.ADD;
layer.quality = LayerQuality.BEST;
```

## 8. Files, import, render queue

Writing files requires Preferences > Scripting & Expressions > "Allow Scripts to Write Files
and Access Network". The community-standard check is
`app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY")`
(0 = off) — if off, tell the user where the checkbox is instead of failing silently.

```js
var f = new File(Folder.desktop.fsName + "/out.txt");
f.encoding = "UTF-8"; f.open("w"); f.write("hello"); f.close();
var picked = File.openDialog("Pick a CSV", "*.csv");
var io = new ImportOptions(new File(path)); io.importAs = ImportAsType.FOOTAGE;
var item = app.project.importFile(io);
var folder = app.project.items.addFolder("Generated");  item.parentFolder = folder;

var rq = app.project.renderQueue.items.add(comp);
rq.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps"); // template names vary per install
rq.outputModule(1).file = new File("~/Desktop/" + comp.name + ".mp4");
// app.project.renderQueue.render();  // blocks AE until done — only if the user asked
```

Output-module template names differ between versions/languages — list them from
`rq.outputModule(1).templates` if unsure.

## 9. Performance (matters for grids / pixel generators)

- Creating layers is the slow part (~ms each, grows with comp size). 2,000 layers → minutes and a
  sluggish project. For >300 elements, consider: one shape layer with many groups, a Repeater, or
  CC Ball Action/Mosaic-type effects, and say so.
- One `setValuesAtTimes()` beats N `setValueAtTime()` calls.
- Expressions on hundreds of layers slow down previews; baked keys are faster to play back.
  Mention the trade-off when choosing rig vs bake at scale.
- `app.beginSuppressDialogs()` / `app.endSuppressDialogs(false)` around imports to avoid modal
  popups mid-script.
- Long runs: show progress with a ScriptUI progressbar palette, and `win.update()` inside the loop.

# Reading AE script errors

AE reports: `Unable to execute script at line N. <message>`. Line N counts from the top of the
.jsx *including* any `#include`d file content placed at that point — if the number looks wrong,
check included files. When the user pastes an error, find line N in the version you last gave
them (ask which version if unclear), then match the message below.

| Message (roughly) | Usual cause | Fix |
|---|---|---|
| `Syntax error` / `Expected: ;` / `Illegal use of reserved word 'const'` | Modern JS syntax | Run lint_jsx.js; rewrite to ES3 |
| `X is not a function` (on arrays/strings) | `.forEach`, `.map`, `.trim`, `Object.keys`... | Loop or helper |
| `JSON is undefined` | No polyfill | Include json2 |
| `null is not an object` / `undefined is not an object` | `activeItem` null, wrong matchName → `property()` returned null, layer has no such group | Guard + check matchName |
| `Object is invalid` | Reference held across `addProperty()` / layer delete / precompose | Re-fetch by index/matchName after structural changes |
| `Value is not an array of the correct length` / `Array is not of the correct length` | 2 values to a 3D prop (layer is 3D) or wrong KeyframeEase array length | Match `prop.value.length`; use `keyInTemporalEase(k).length` |
| `Unable to call "setValue" because of parameter 1. Value X out of range` | Opacity > 100, influence 0 or > 100, scale negative where not allowed | Clamp values (influence 0.1–100) |
| `Can not "setValue" ... property has keyframes` | setValue on animated prop | `setValueAtTime` or remove keys first |
| `Can't set value, property is hidden` / `cannot be modified` | Prop hidden (e.g. 3D-only prop on 2D layer), layer locked, or expression-only | Unlock layer, enable 3D, check `prop.canVaryOverTime` |
| `Unable to set value as it is not associated with a layer` | Layout TextDocument attrs on a detached `new TextDocument()` | Read doc from the layer first |
| `After Effects error: ... Could not find the effect` / addProperty returns null | Third-party effect not installed, or wrong effect matchName | Check `app.effects`, try/catch, report |
| `Index out of range` / `bad argument - index` | 0-based index on AE collection, or deleting forward | 1-based; loop backwards |
| `Permission denied` / file write silently fails | Scripting file/network pref off | Preferences > Scripting & Expressions > "Allow Scripts to Write Files and Access Network" |
| Script runs, nothing happens | Wrong comp active, layers created in another comp, IIFE never invoked `})` missing `()` | Check `comp.name` in the final report alert |
| Very slow / "not responding" | Thousands of layers, expressions evaluated per layer, `alert` in loops | See dom-cheatsheet §9 |
| Expression error banner after script | Expression string invalid for the project's engine | Read `prop.expressionError`; check `app.project.expressionEngine` |

Debug helper to drop in temporarily:

```js
function log(msg) {           // writes next to the script, since alert() in loops is painful
    var f = new File(Folder.desktop.fsName + "/ae_script_log.txt");
    f.encoding = "UTF-8"; f.open("a"); f.writeln(new Date().toTimeString().substr(0,8) + "  " + msg); f.close();
}
```
(needs the file-write preference on). Remove before final delivery.

State dump — when the user has edited the comp by hand since the last script and you need to
patch it, ask them to run this and paste the result instead of guessing:

```js
(function () {
    var c = app.project.activeItem; if (!(c instanceof CompItem)) { alert("Select a comp"); return; }
    var L = ["COMP " + c.name + "  " + c.width + "x" + c.height + " @" + c.frameRate + "fps, " + c.duration + "s, AE " + app.version];
    for (var i = 1; i <= c.numLayers; i++) {
        var ly = c.layer(i), tr = ly.property("ADBE Transform Group");
        var s = i + ". " + ly.name + " [" + ly.matchName + "] in " + ly.inPoint.toFixed(2) + " out " + ly.outPoint.toFixed(2);
        if (ly.parent) s += " parent=" + ly.parent.name;
        if (tr) {
            var p = tr.property("ADBE Position");
            s += " pos=" + p.value.toString() + (p.numKeys ? " (" + p.numKeys + " keys)" : "");
        }
        L.push(s);
    }
    var txt = L.join("\n");
    var w = new Window("dialog", "State dump — copy all");
    var e = w.add("edittext", [0, 0, 700, 400], txt, { multiline: true });
    w.add("button", undefined, "OK"); w.show();
})();
```

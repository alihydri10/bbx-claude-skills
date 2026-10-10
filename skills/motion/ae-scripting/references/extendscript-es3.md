# ExtendScript = ES3 (plus a few Adobe extras)

After Effects scripts (`.jsx`, `.jsxbin`) run in Adobe's ExtendScript engine, which implements
ECMAScript 3 (1999). As of AE 26.x (2026) this is still the only scripting engine in AE — UXP has
not shipped for After Effects. Modern JS habits are the #1 cause of scripts that fail instantly.

Note: this is about the SCRIPT. Expressions are a different engine (see dom-cheatsheet.md →
"Expressions from a script"): with the default "JavaScript" expression engine, the expression
*strings* you write may use modern syntax.

## Syntax that will not parse (script dies before line 1 runs)

| Don't write                         | Write instead                                   |
|-------------------------------------|-------------------------------------------------|
| `let x` / `const x`                 | `var x`                                          |
| `(a) => a * 2`                      | `function (a) { return a * 2; }`                 |
| `` `Layer ${i}` ``                  | `"Layer " + i`                                   |
| `class Foo {}`                      | constructor function + `Foo.prototype.bar = ...` |
| `var {a, b} = obj` / `var [x,y]=p`  | `var a = obj.a; var x = p[0];`                   |
| `function f(w = 100)`               | `if (w === undefined) w = 100;`                  |
| `[...a, ...b]`, `f(...args)`        | `a.concat(b)`, `f.apply(null, args)`             |
| `for (var x of arr)`                | index loop                                       |
| `{a: 1, b: 2,}` trailing comma      | no trailing comma                                |
| `get foo() {}` in object literal    | plain function                                   |
| `2 ** 3`                            | `Math.pow(2, 3)`                                 |
| `a ?? b`, `a?.b`                    | explicit `(a !== undefined && a !== null) ? a : b`, null checks |
| `0b1010`, `0o17`, `1_000`           | `10`, `15`, `1000`                               |

Multi-line strings: no template literals, so build them with `+ "\n" +` or `[...].join("\n")`.
This matters most when a script writes a multi-line expression.

## Runtime methods that don't exist (script parses, then throws "is not a function")

- Array: `forEach map filter reduce some every find findIndex includes fill flat`
- String: `trim startsWith endsWith padStart repeat includes`
- `Object.keys/values/entries/assign/create/defineProperty`, `Array.isArray`, `Date.now`,
  `Number.isNaN`, `Math.sign/trunc/log10/hypot`, `Function.prototype.bind`
- `JSON` — not built in. `#include "lib/json2.jsx"` or paste json2 (public domain) into the file.
  For a single-file deliverable, prefer pasting a minified copy inside the IIFE, or avoid JSON
  entirely by writing simple `key=value` lines.
- `Array.prototype.indexOf` — ExtendScript does add it, but don't rely on it for arrays of AE
  objects (comparison by identity is flaky across DOM wrappers); compare `.id`, `.index` or names.

Drop-in helpers (put inside the IIFE, not on prototypes — keeps AE's global engine clean):

```js
function each(arr, fn) { for (var i = 0; i < arr.length; i++) fn(arr[i], i); }
function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
function keys(o) { var r = []; for (var k in o) if (o.hasOwnProperty(k)) r.push(k); return r; }
function isArray(a) { return Object.prototype.toString.call(a) === "[object Array]"; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function pad(n, w) { var s = String(n); while (s.length < w) s = "0" + s; return s; }
```

## Seeded randomness

`Math.random()` can't be seeded, so a re-run gives a different layout. Designers usually want
"same result until I change the seed". Use a tiny PRNG:

```js
function mul32(a, b) {                 // 32-bit integer multiply (Math.imul isn't in ES3)
    var ah = (a >>> 16) & 0xffff, al = a & 0xffff, bh = (b >>> 16) & 0xffff, bl = b & 0xffff;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
}
function makeRandom(seed) {            // mulberry32 — same seed, same sequence
    var a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        var t = mul32(a ^ (a >>> 15), a | 1);
        t = (t ^ (t + mul32(t ^ (t >>> 7), t | 61))) >>> 0;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// var rnd = makeRandom(CONFIG.seed);  rnd() -> [0, 1)
```

## Scope & globals

AE keeps one global ExtendScript engine alive for the whole session. Top-level `var`s from
one script are still there when the next script runs — name collisions produce bizarre bugs.
Always wrap: `(function () { ... })();` and for panels `(function (thisObj) { ... })(this);`.

## Adobe extras you *can* use

- `$.writeln()` → console of VS Code "ExtendScript Debugger" (no effect for normal runs)
- `$.fileName` → path of the running script (useful to find sibling files)
- `$.os`, `$.sleep(ms)`, `$.hiresTimer` (µs since last read — cheap profiling)
- `File`, `Folder` objects for disk I/O (see dom-cheatsheet.md)
- `#include "file.jsx"` / `//@include` — path relative to the running script
- `#targetengine "name"` — persistent engine for panels that need to keep state
- `app.scheduleTask(code, delayMs, repeat)` — run code later (string of code)

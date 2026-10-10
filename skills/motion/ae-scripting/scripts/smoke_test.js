#!/usr/bin/env node
/*
 * smoke_test.js — run an AE .jsx against a small MOCK of the After Effects DOM.
 *
 * Usage: node smoke_test.js script.jsx [--comp 1920x1080@30] [--select N] [--text] [--runs 2]
 *   --runs 2    run the script twice (checks re-run safety: layer count should not double)
 *   --select N  pre-create N solid layers and mark them selected
 *   --text      make the pre-created layers text layers instead
 *
 * What it catches: typos, undefined variables/functions, calling missing methods,
 * wrong ease-array lengths, influence out of range, 0-based indexing of AE collections,
 * setValue on keyframed props, and the "Object is invalid" trap (using a reference into
 * an indexed group after addProperty() rebuilt it).
 *
 * What it does NOT prove: that matchNames are right (unknown names are accepted and
 * reported as "unverified"), that the visual result looks good, or that every real
 * AE method exists. It's a smoke test — the real test is running it in AE.
 */
"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path");

var args = process.argv.slice(2);
if (!args.length) { console.error("usage: node smoke_test.js file.jsx [--comp WxH@fps] [--select N] [--text]"); process.exit(2); }
var file = args[0], W = 1920, H = 1080, FPS = 30, SELECT = 0, TEXT = false, RUNS = 1;
for (var a = 1; a < args.length; a++) {
  if (args[a] === "--comp") { var m = /(\d+)x(\d+)@([\d.]+)/.exec(args[++a]); W = +m[1]; H = +m[2]; FPS = +m[3]; }
  else if (args[a] === "--select") SELECT = parseInt(args[++a], 10);
  else if (args[a] === "--text") TEXT = true;
  else if (args[a] === "--runs") RUNS = parseInt(args[++a], 10);
}

var log = { alerts: [], unverified: {}, created: { layers: 0, groups: 0, keys: 0, expressions: 0 } };
var KNOWN = /^(ADBE |CC |CS |APC |VIDEOCOPILOT)/;

var thrown = [];
function AEError(msg) { var e = new Error(msg); e.line = "?"; thrown.push(msg); return e; }
function isArr(v) { return Array.isArray(v); }

// ---------- Property / PropertyGroup (one class for both) ----------
var SPATIAL = { "ADBE Position": 1, "ADBE Anchor Point": 1, "ADBE Vector Position": 1, "ADBE Vector Anchor": 1,
  "ADBE Vector Rect Position": 1, "ADBE Vector Ellipse Position": 1, "ADBE Vector Star Position": 1 };
function defaultValue(mn, layer) {
  var is3D = layer && layer.threeDLayer;
  if (/Position$|Anchor Point$|Vector Anchor$/.test(mn)) return is3D ? [0, 0, 0] : [0, 0];
  if (/Scale$/.test(mn)) return is3D ? [100, 100, 100] : [100, 100];
  if (/Opacity$/.test(mn)) return 100;
  if (/Color$/.test(mn)) return [1, 1, 1];
  if (/Rect Size|Ellipse Size/.test(mn)) return [100, 100];
  if (mn === "ADBE Text Document") return new TextDocument("Text");
  if (mn === "ADBE Vector Shape" || mn === "ADBE Mask Shape") return new Shape();
  if (mn === "ADBE Marker") return new MarkerValue("");
  return 0;
}

function Node(mn, parent, layer) {
  this.matchName = mn; this.name = mn.replace(/^ADBE (Vector )?/, "");
  this.parentProperty = parent; this.propertyGroupLayer = layer;
  this._children = []; this._valid = true; this._keys = []; this._value = undefined;
  this.expression = ""; this.expressionEnabled = false; this.expressionError = "";
  this.enabled = true; this.canSetExpression = true; this.canVaryOverTime = true;
  this.dimensionsSeparated = false;
  if (!KNOWN.test(mn) && !/^\d+$/.test(mn)) log.unverified[mn] = true;
}
Node.prototype._check = function () { if (!this._valid) throw AEError("Object is invalid (reference used after addProperty()/remove() rebuilt its group: " + this.matchName + ")"); };
Object.defineProperty(Node.prototype, "numProperties", { get: function () { this._check(); return this._children.length; } });
Object.defineProperty(Node.prototype, "propertyIndex", { get: function () { this._check(); return this.parentProperty ? this.parentProperty._children.indexOf(this) + 1 : 0; } });
Object.defineProperty(Node.prototype, "numKeys", { get: function () { this._check(); return this._keys.length; } });
Object.defineProperty(Node.prototype, "value", {
  get: function () { this._check(); if (this._keys.length) return this._keys[0].v; if (this._value === undefined) this._value = defaultValue(this.matchName, this.propertyGroupLayer); return this._value; },
  set: function () { throw AEError("value is read-only; use setValue()"); }
});
Node.prototype.property = function (id) {
  this._check();
  if (typeof id === "number") {
    if (id < 1) throw AEError("property(" + id + "): index out of range (AE collections are 1-based)");
    if (id > this._children.length) return null;
    return this._children[id - 1];
  }
  for (var i = 0; i < this._children.length; i++) if (this._children[i].matchName === id || this._children[i].name === id) return this._children[i];
  var n = new Node(id, this, this.propertyGroupLayer); this._children.push(n); return n; // lazily materialize fixed children
};
Node.prototype.addProperty = function (mn) {
  this._check();
  // AE rebuilds indexed groups: all existing child references become invalid
  var fresh = [];
  for (var i = 0; i < this._children.length; i++) fresh.push(cloneNode(this._children[i], this));
  for (i = 0; i < this._children.length; i++) invalidate(this._children[i]);
  this._children = fresh;
  var n = new Node(mn, this, this.propertyGroupLayer); this._children.push(n);
  log.created.groups++;
  return n;
};
Node.prototype.canAddProperty = function () { return true; };
Node.prototype.remove = function () { this._check(); var p = this.parentProperty; if (p) { var i = p._children.indexOf(this); p._children.splice(i, 1); } invalidate(this); };
Node.prototype.moveTo = function () { this._check(); };
Node.prototype.duplicate = function () { this._check(); var c = cloneNode(this, this.parentProperty); this.parentProperty._children.push(c); return c; };
Node.prototype.setValue = function (v) {
  this._check();
  if (this._keys.length) throw AEError("Can not setValue on '" + this.matchName + "': property has keyframes (use setValueAtTime)");
  checkShape(this, v); this._value = v;
};
Node.prototype.setValueAtTime = function (t, v) { this._check(); checkShape(this, v); addKey(this, t, v); };
Node.prototype.setValuesAtTimes = function (ts, vs) {
  this._check();
  if (ts.length !== vs.length) throw AEError("setValuesAtTimes: times and values must be the same length");
  for (var i = 0; i < ts.length; i++) { checkShape(this, vs[i]); addKey(this, ts[i], vs[i]); }
};
Node.prototype.addKey = function (t) { this._check(); return addKey(this, t, this.value); };
Node.prototype.removeKey = function (k) { this._check(); keyIdx(this, k); this._keys.splice(k - 1, 1); };
Node.prototype.keyTime = function (k) { this._check(); keyIdx(this, k); return this._keys[k - 1].t; };
Node.prototype.keyValue = function (k) { this._check(); keyIdx(this, k); return this._keys[k - 1].v; };
Node.prototype.setValueAtKey = function (k, v) { this._check(); keyIdx(this, k); checkShape(this, v); this._keys[k - 1].v = v; };
Node.prototype.nearestKeyIndex = function (t) { this._check(); var b = 1, d = 1e9; for (var i = 0; i < this._keys.length; i++) { var dd = Math.abs(this._keys[i].t - t); if (dd < d) { d = dd; b = i + 1; } } return b; };
Node.prototype.valueAtTime = function () { this._check(); return this.value; };
Node.prototype.keyInTemporalEase = function (k) { this._check(); keyIdx(this, k); return easeArr(this); };
Node.prototype.keyOutTemporalEase = Node.prototype.keyInTemporalEase;
Node.prototype.setTemporalEaseAtKey = function (k, inE, outE) {
  this._check(); keyIdx(this, k);
  var need = easeArr(this).length;
  [inE, outE || inE].forEach(function (arr, j) {
    if (!arr || arr.length !== need) throw AEError("setTemporalEaseAtKey: " + (j ? "out" : "in") + " ease array length " + (arr ? arr.length : "none") + " but '" + this.matchName + "' needs " + need);
    arr.forEach(function (e) { if (!(e instanceof KeyframeEase)) throw AEError("ease array must contain KeyframeEase objects"); });
  }, this);
};
["setInterpolationTypeAtKey", "setSpatialTangentsAtKey", "setTemporalContinuousAtKey", "setTemporalAutoBezierAtKey",
 "setSpatialContinuousAtKey", "setSpatialAutoBezierAtKey", "setRovingAtKey", "setSelectedAtKey", "setLabelAtKey"].forEach(function (fn) {
  Node.prototype[fn] = function (k) { this._check(); keyIdx(this, k); };
});
Node.prototype.setPropertyParameters = function (a) { this._check(); return this; };
Object.defineProperty(Node.prototype, "expressionSetter", { set: function () {} });

function easeArr(p) {
  var v = p.value, n = (SPATIAL[p.matchName] || typeof v === "number" || /Color$/.test(p.matchName) || !(isArr(v))) ? 1 : v.length;
  var r = []; for (var i = 0; i < n; i++) r.push(new KeyframeEase(0, 33.33)); return r;
}
function keyIdx(p, k) { if (k < 1 || k > p._keys.length) throw AEError("key index " + k + " out of range 1.." + p._keys.length + " on " + p.matchName); }
function addKey(p, t, v) {
  for (var i = 0; i < p._keys.length; i++) if (Math.abs(p._keys[i].t - t) < 1e-6) { p._keys[i].v = v; return i + 1; }
  p._keys.push({ t: t, v: v }); p._keys.sort(function (a, b) { return a.t - b.t; }); log.created.keys++;
  var fd = 1 / FPS; if (Math.abs(Math.round(t / fd) * fd - t) > 1e-4) log.offFrame = (log.offFrame || 0) + 1;
  for (i = 0; i < p._keys.length; i++) if (p._keys[i].t === t) return i + 1;
}
function checkShape(p, v) {
  if (p._value === undefined && /-\d{4}$/.test(p.matchName)) return;   // effect param of unknown type: first set defines it
  var cur = p._value !== undefined ? p._value : defaultValue(p.matchName, p.propertyGroupLayer);
  if (isArr(cur)) {
    if (!(isArr(v))) throw AEError("'" + p.matchName + "' expects an array, got " + typeof v);
    var okLen = (/Color$/.test(p.matchName)) ? (v.length === 3 || v.length === 4) : v.length === cur.length || (v.length === 3 && cur.length === 2 && false);
    if (!okLen && !/Color$/.test(p.matchName) && v.length !== cur.length) throw AEError("Value is not an array of the correct length for '" + p.matchName + "' (got " + v.length + ", need " + cur.length + ")");
    if (/Color$/.test(p.matchName)) for (var i = 0; i < v.length; i++) if (v[i] > 1.0001 || v[i] < 0) log.colorRange = (log.colorRange || 0) + 1;
  } else if (typeof cur === "number") {
    if (typeof v !== "number" || isNaN(v)) throw AEError("'" + p.matchName + "' expects a number, got " + (isArr(v) ? "array" : v));
    if (/Opacity$/.test(p.matchName) && (v < 0 || v > 100)) throw AEError("Value " + v + " out of range 0..100 for " + p.matchName);
  }
}
function invalidate(n) { n._valid = false; for (var i = 0; i < n._children.length; i++) invalidate(n._children[i]); }
function cloneNode(n, parent) {
  var c = new Node(n.matchName, parent, n.propertyGroupLayer);
  c.name = n.name; c._value = n._value; c._keys = n._keys.slice(); c.expression = n.expression; c.enabled = n.enabled;
  for (var i = 0; i < n._children.length; i++) c._children.push(cloneNode(n._children[i], c));
  return c;
}

// ---------- Layers ----------
var nextId = 1;
function Layer(kind, comp, name) {
  this._kind = kind; this.containingComp = comp; this.name = name || kind; this.comment = ""; this.id = nextId++;
  this.locked = false; this.enabled = true; this.shy = false; this.solo = false; this.label = 1;
  this.threeDLayer = false; this.motionBlur = false; this.adjustmentLayer = false; this.nullLayer = kind === "null";
  this.inPoint = 0; this.outPoint = comp.duration; this.startTime = 0; this.parent = null; this.selected = false;
  this.matchName = { shape: "ADBE Vector Layer", text: "ADBE Text Layer", camera: "ADBE Camera Layer", light: "ADBE Light Layer" }[kind] || "ADBE AV Layer";
  this._root = new Node(this.matchName, null, this); this._valid = true;
  if (kind === "text") this._root.property("ADBE Text Properties").property("ADBE Text Document")._value = new TextDocument(name || "Text");
  log.created.layers++;
}
Layer.prototype._check = function () { if (!this._valid) throw AEError("Object is invalid (layer was removed)"); if (this.locked) throw AEError("layer '" + this.name + "' is locked"); };
Layer.prototype.property = function (id) { if (!this._valid) throw AEError("Object is invalid (layer was removed)"); return this._root.property(id); };
Layer.prototype.remove = function () { this.locked && (function () { throw AEError("layer is locked"); })(); var L = this.containingComp._layers; L.splice(L.indexOf(this), 1); this._valid = false; };
Layer.prototype.moveToBeginning = Layer.prototype.moveToEnd = Layer.prototype.moveBefore = Layer.prototype.moveAfter = function () { this._check(); };
Layer.prototype.duplicate = function () { this._check(); var d = new Layer(this._kind, this.containingComp, this.name); this.containingComp._layers.unshift(d); return d; };
Layer.prototype.setParentWithJump = function (p) { this.parent = p; };
Layer.prototype.sourceRectAtTime = function () { return { top: -50, left: -100, width: 200, height: 100 }; };
Layer.prototype.setTrackMatte = Layer.prototype.removeTrackMatte = Layer.prototype.applyPreset = Layer.prototype.replaceSource = function () { this._check(); };
Object.defineProperty(Layer.prototype, "index", { get: function () { return this.containingComp._layers.indexOf(this) + 1; } });
Object.defineProperty(Layer.prototype, "source", { get: function () { if (this._kind === "camera" || this._kind === "light") throw AEError("layer has no source"); return this._source || null; } });

function TextLayer() {} function ShapeLayer() {} function AVLayer() {} function CameraLayer() {} function LightLayer() {}
TextLayer.prototype = ShapeLayer.prototype = AVLayer.prototype = Layer.prototype;
// instanceof checks by kind
[["TextLayer", "text"], ["ShapeLayer", "shape"], ["CameraLayer", "camera"], ["LightLayer", "light"]].forEach(function (p) {
  Object.defineProperty(eval(p[0]), Symbol.hasInstance, { value: function (o) { return o instanceof Layer && o._kind === p[1]; } });
});
Object.defineProperty(AVLayer, Symbol.hasInstance, { value: function (o) { return o instanceof Layer && o._kind !== "camera" && o._kind !== "light"; } });

// ---------- Items ----------
function Item(name) { this.name = name; this.id = nextId++; this.comment = ""; this.parentFolder = null; this.label = 1; this.selected = false; }
function CompItem(name, w, h, pa, dur, fps) {
  Item.call(this, name); this.width = w; this.height = h; this.pixelAspect = pa; this.duration = dur; this.frameRate = fps;
  this.frameDuration = 1 / fps; this.time = 0; this.bgColor = [0, 0, 0]; this.motionBlur = false; this.hideShyLayers = false;
  this.workAreaStart = 0; this.workAreaDuration = dur; this._layers = [];
  var self = this;
  this.markerProperty = new Node("ADBE Marker", null, null);
  this.layers = {
    add: function () { return push(new Layer("footage", self, "Footage")); },
    addShape: function () { return push(new Layer("shape", self, "Shape Layer " + (self._layers.length + 1))); },
    addNull: function () { return push(new Layer("null", self, "Null " + (self._layers.length + 1))); },
    addSolid: function (c, n, w, h, pa, d) { if (!(isArr(c)) || c.length !== 3) throw AEError("addSolid color must be [r,g,b] 0-1"); if (typeof w !== "number" || typeof h !== "number") throw AEError("addSolid width/height must be numbers"); var L = new Layer("solid", self, n); L._source = new Item(n); return push(L); },
    addText: function (t) { return push(new Layer("text", self, typeof t === "string" ? t : "Text")); },
    addBoxText: function (sz) { if (!(isArr(sz))) throw AEError("addBoxText expects [width, height]"); return push(new Layer("text", self, "Box Text")); },
    addCamera: function (n) { return push(new Layer("camera", self, n)); },
    addLight: function (n) { return push(new Layer("light", self, n)); },
    precompose: function (idx, n) { if (!(isArr(idx))) throw AEError("precompose expects an array of layer INDICES"); return app.project.items.addComp(n, self.width, self.height, 1, self.duration, self.frameRate); },
    byName: function (n) { for (var i = 0; i < self._layers.length; i++) if (self._layers[i].name === n) return self._layers[i]; return null; }
  };
  function push(L) { self._layers.unshift(L); return L; }
}
CompItem.prototype.layer = function (i) {
  if (typeof i === "string") return this.layers.byName(i);
  if (i < 1 || i > this._layers.length) throw AEError("comp.layer(" + i + "): index out of range 1.." + this._layers.length + " (AE collections are 1-based)");
  return this._layers[i - 1];
};
Object.defineProperty(CompItem.prototype, "numLayers", { get: function () { return this._layers.length; } });
Object.defineProperty(CompItem.prototype, "selectedLayers", { get: function () { return this._layers.filter(function (l) { return l.selected; }); } });
Object.defineProperty(CompItem.prototype, "selectedProperties", { get: function () { return []; } });
CompItem.prototype.openInViewer = function () {};
function FolderItem(n) { Item.call(this, n); }
function FootageItem(n) { Item.call(this, n); }

// ---------- Globals ----------
function KeyframeEase(speed, influence) {
  if (typeof influence !== "number" || influence < 0.1 || influence > 100) throw AEError("KeyframeEase influence must be 0.1..100 (got " + influence + ")");
  this.speed = speed; this.influence = influence;
}
function TextDocument(t) { this.text = t; this.fontSize = 72; this.font = "ArialMT"; this.fillColor = [1, 1, 1]; this.applyFill = true; this.applyStroke = false; this.justification = 0; this.tracking = 0; }
function Shape() { this.vertices = []; this.inTangents = []; this.outTangents = []; this.closed = true; }
function MarkerValue(c) { this.comment = c; this.duration = 0; }
function enumProxy(name) { return new Proxy({}, { get: function (t, k) { return typeof k === "string" ? name + "." + k : undefined; } }); }

var project = {
  _items: [], expressionEngine: "javascript-1.0", activeItem: null,
  items: { addComp: function (n, w, h, pa, d, f) { var c = new CompItem(n, w, h, pa, d, f); project._items.push(c); return c; },
           addFolder: function (n) { var f = new FolderItem(n); project._items.push(f); return f; } },
  item: function (i) { if (i < 1 || i > project._items.length) throw AEError("project.item(" + i + ") out of range (1-based)"); return project._items[i - 1]; },
  layerByID: function (id) { for (var i = 0; i < project._items.length; i++) { var it = project._items[i]; if (it instanceof CompItem) for (var j = 0; j < it._layers.length; j++) if (it._layers[j].id === id) return it._layers[j]; } return null; },
  importFile: function () { var f = new FootageItem("import"); project._items.push(f); return f; },
  renderQueue: { items: { add: function () { return { outputModule: function () { return { applyTemplate: function () {}, templates: [], file: null }; } }; } }, render: function () {} }
};
Object.defineProperty(project, "numItems", { get: function () { return project._items.length; } });
var undoDepth = 0;
var app = {
  version: "26.5.0", project: project, effects: [], fonts: { getFontsByFamilyNameAndStyleName: function () { return []; }, allFonts: [] },
  beginUndoGroup: function () { undoDepth++; }, endUndoGroup: function () { undoDepth--; },
  beginSuppressDialogs: function () {}, endSuppressDialogs: function () {},
  preferences: { getPrefAsLong: function () { return 1; } }, scheduleTask: function () {}, purge: function () {}
};
var comp = project.items.addComp("Test Comp", W, H, 1, 10, FPS);
project.activeItem = comp;
for (var s = 0; s < SELECT; s++) {
  var L = TEXT ? comp.layers.addText("Sample " + (s + 1)) : comp.layers.addSolid([0.5, 0.5, 0.5], "Sel " + (s + 1), 200, 200, 1);
  L.selected = true;
}
log.created.layers = 0;

function Window(type, title) { this.type = type; this.title = title; this.children = []; this.layout = { layout: function () {}, resize: function () {} }; this.graphics = {}; }
Window.prototype.add = function (t, b, text) { var c = new Window(t, text); c.text = text || ""; c.value = (t === "slider" || t === "progressbar") ? (text || 0) : false; c.preferredSize = {}; c.characters = 0; this.children.push(c); return c; };
Window.prototype.show = function () { return 1; }; Window.prototype.center = Window.prototype.close = Window.prototype.update = function () {};
function Panel() {}

var sandbox = {
  app: app, CompItem: CompItem, FolderItem: FolderItem, FootageItem: FootageItem, AVLayer: AVLayer, TextLayer: TextLayer,
  ShapeLayer: ShapeLayer, CameraLayer: CameraLayer, LightLayer: LightLayer, KeyframeEase: KeyframeEase, TextDocument: TextDocument,
  Shape: Shape, MarkerValue: MarkerValue, Window: Window, Panel: Panel,
  alert: function (m) { log.alerts.push(String(m)); }, confirm: function () { return true; }, prompt: function (a, b) { return b || ""; },
  File: function (p) { this.fsName = p; this.exists = false; this.open = function () { return true; }; this.write = this.writeln = this.close = function () {}; this.read = function () { return ""; }; },
  Folder: { desktop: { fsName: "/tmp" }, temp: { fsName: "/tmp" } },
  $: { writeln: function () {}, fileName: path.resolve(file), os: "mock", sleep: function () {}, hiresTimer: 0 },
  KeyframeInterpolationType: enumProxy("KeyframeInterpolationType"), BlendingMode: enumProxy("BlendingMode"),
  TrackMatteType: enumProxy("TrackMatteType"), ParagraphJustification: enumProxy("ParagraphJustification"),
  ParagraphDirection: enumProxy("ParagraphDirection"), ComposerEngine: enumProxy("ComposerEngine"), DigitSet: enumProxy("DigitSet"),
  LayerQuality: enumProxy("LayerQuality"), ImportAsType: enumProxy("ImportAsType"), PropertyValueType: enumProxy("PropertyValueType"),
  PropertyType: enumProxy("PropertyType"), ImportOptions: function () {}, Math: Math
};
sandbox.Folder.prototype = {};
vm.createContext(sandbox);

var src = fs.readFileSync(file, "utf8").replace(/^[ \t]*[#@](include|target|targetengine|script|strict)\b.*$/gm, "// $&");
var ok = true;
var countsPerRun = [];
try {
  for (var run = 0; run < RUNS; run++) { vm.runInContext(src, sandbox, { filename: path.basename(file) }); countsPerRun.push(comp.numLayers); }
} catch (e) {
  ok = false;
  var where = (e.stack || "").split("\n").filter(function (l) { return l.indexOf(path.basename(file)) !== -1; })[0] || "";
  console.log("RUNTIME ERROR: " + e.message + (where ? "\n  " + where.trim().replace(/^at /, "at ") : ""));
}
if (undoDepth !== 0) { ok = false; console.log("UNDO GROUP LEFT OPEN (depth " + undoDepth + ")"); }
console.log("Created: " + log.created.layers + " layer(s), " + log.created.groups + " added propert(ies)/group(s), " + log.created.keys + " keyframe(s)");
console.log("Layers in comp after each run: " + countsPerRun.join(" -> "));
if (RUNS > 1 && countsPerRun.length > 1 && countsPerRun[countsPerRun.length - 1] > countsPerRun[0]) console.log("warning: layer count grew on re-run — script is not re-run safe");
if (log.offFrame) console.log("warning: " + log.offFrame + " keyframe(s) not on a frame boundary");
if (log.colorRange) console.log("warning: " + log.colorRange + " color channel value(s) outside 0..1 (did you pass 0-255?)");
var un = Object.keys(log.unverified); if (un.length) console.log("unverified names (not ADBE matchNames — check they exist): " + un.join(", "));
if (log.alerts.length) console.log("alert() output:\n  " + log.alerts.join("\n  ").replace(/\n/g, "\n  "));
if (thrown.length) { ok = false; console.log("AE errors raised during the run (including ones the script caught itself):\n  - " + thrown.filter(function (m, i) { return thrown.indexOf(m) === i; }).join("\n  - ")); }
console.log(ok ? "SMOKE TEST PASSED" : "SMOKE TEST FAILED");
process.exit(ok ? 0 : 1);

#!/usr/bin/env node
/*
 * lint_jsx.js — static checker for After Effects ExtendScript (.jsx) files.
 *
 * Usage:  node lint_jsx.js path/to/script.jsx [more.jsx ...]
 * Exit:   0 = no errors (warnings allowed), 1 = errors found, 2 = bad usage
 *
 * What it catches:
 *   1. Syntax that ExtendScript (ES3) cannot parse: let/const, arrow functions,
 *      template literals, classes, destructuring, spread, default params,
 *      for...of, trailing commas in object literals, getters in literals, etc.
 *      (Real parse with acorn in ecmaVersion 3 mode.)
 *   2. Runtime methods that do not exist in ES3 (forEach, map, trim, Object.keys,
 *      JSON without a polyfill...), unless the script defines a polyfill.
 *   3. AE-specific mistakes: index 0 on 1-based collections, undo groups that
 *      are not closed in a finally block, activeItem used without a CompItem
 *      check, display names instead of matchNames, alert() inside loops.
 *
 * It cannot catch wrong matchNames or wrong property value shapes — those only
 * show up when the script runs inside After Effects.
 */
"use strict";
var fs = require("fs");
var path = require("path");
var acorn = require(path.join(__dirname, "vendor", "acorn.js"));

var ES3_MISSING_METHODS = {
  forEach: "Array", map: "Array", filter: "Array", reduce: "Array", reduceRight: "Array",
  some: "Array", every: "Array", find: "Array", findIndex: "Array", includes: "Array/String",
  fill: "Array", flat: "Array", flatMap: "Array",
  trim: "String", trimStart: "String", trimEnd: "String", startsWith: "String",
  endsWith: "String", padStart: "String", padEnd: "String", repeat: "String",
  bind: "Function"
};
var ES3_MISSING_STATICS = {
  Object: ["keys", "values", "entries", "assign", "create", "freeze", "defineProperty",
           "getPrototypeOf", "getOwnPropertyNames", "fromEntries"],
  Array: ["isArray", "from", "of"],
  Date: ["now"],
  Number: ["isNaN", "isFinite", "isInteger", "parseFloat", "parseInt", "EPSILON"],
  Math: ["sign", "trunc", "log10", "log2", "hypot", "cbrt"]
};
// Common English display names that should be matchNames instead.
var DISPLAY_NAMES = {
  "Transform": "ADBE Transform Group", "Position": "ADBE Position", "Scale": "ADBE Scale",
  "Rotation": "ADBE Rotate Z", "Opacity": "ADBE Opacity", "Anchor Point": "ADBE Anchor Point",
  "Effects": "ADBE Effect Parade", "Masks": "ADBE Mask Parade", "Contents": "ADBE Root Vectors Group",
  "Source Text": "ADBE Text Document", "Text": "ADBE Text Properties",
  "Marker": "ADBE Marker", "Time Remap": "ADBE Time Remapping",
  "Fill": "ADBE Vector Graphic - Fill", "Stroke": "ADBE Vector Graphic - Stroke",
  "Color": "ADBE Vector Fill Color / ADBE Vector Stroke Color",
  "Trim Paths": "ADBE Vector Filter - Trim", "Repeater": "ADBE Vector Filter - Repeater",
  "Slider": "ADBE Slider Control-0001", "Checkbox": "ADBE Checkbox Control-0001",
  "Gaussian Blur": "ADBE Gaussian Blur 2", "Blurriness": "ADBE Gaussian Blur 2-0001",
  "Rectangle Path 1": "ADBE Vector Shape - Rect", "Size": "ADBE Vector Rect Size"
};
var MUTATORS = ["addSolid", "addShape", "addText", "addBoxText", "addNull", "addCamera",
  "addLight", "addComp", "addProperty", "setValue", "setValueAtTime", "setValuesAtTimes",
  "remove", "duplicate", "precompose", "addKey", "setTemporalEaseAtKey", "moveTo",
  "importFile", "applyPreset", "setTrackMatte"];

function stripPreprocessor(src) {
  // #include, #target, #targetengine, #script, #strict, @target... -> comments
  return src.replace(/^[ \t]*[#@](include|includepath|target|targetengine|script|strict|engine)\b.*$/gm,
    function (m) { return "//" + m; });
}

function walk(node, cb, parents) {
  if (!node || typeof node.type !== "string") return;
  parents = parents || [];
  cb(node, parents);
  var next = parents.concat([node]);
  for (var key in node) {
    if (key === "loc" || key === "start" || key === "end") continue;
    var child = node[key];
    if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) walk(child[i], cb, next);
    } else if (child && typeof child.type === "string") {
      walk(child, cb, next);
    }
  }
}

function memberName(n) {
  if (!n || n.type !== "MemberExpression") return null;
  if (!n.computed && n.property.type === "Identifier") return n.property.name;
  if (n.computed && n.property.type === "Literal") return String(n.property.value);
  return null;
}
function isLoop(n) {
  return /^(For|ForIn|While|DoWhile)Statement$/.test(n.type);
}

function lintFile(file) {
  var raw = fs.readFileSync(file, "utf8");
  var src = stripPreprocessor(raw.replace(/^\uFEFF/, ""));
  var out = { errors: [], warnings: [] };
  function err(line, msg) { out.errors.push({ line: line, msg: msg }); }
  function warn(line, msg) { out.warnings.push({ line: line, msg: msg }); }

  var ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 3, sourceType: "script", locations: true,
      allowReserved: true, allowReturnOutsideFunction: false });
  } catch (e) {
    var ln = e.loc ? e.loc.line : "?";
    var codeLine = src.split("\n")[(e.loc ? e.loc.line : 1) - 1] || "";
    err(ln, "ES3 SYNTAX ERROR (ExtendScript will refuse to run this): " + e.message.replace(/\s*\(\d+:\d+\)$/, "") +
      "\n        > " + codeLine.trim().slice(0, 120) +
      "\n        Hint: no let/const, =>, `template`, class, ...spread, {destructuring}, default params, for...of, trailing commas in {objects}.");
    return out;
  }

  var hasJsonPolyfill = /#include\s+["'][^"']*json/i.test(raw) ||
    /\bJSON\s*=\s*|\bvar\s+JSON\b|typeof\s+JSON\s*!==?\s*["']object/.test(src);
  var polyfilled = {};           // "Array.prototype.forEach", "Object.keys", ...
  var usesActiveItem = [];
  var hasCompCheck = /instanceof\s+CompItem/.test(src) || /typeName\s*===?\s*["']Composition/.test(src);
  var undoBegins = [], undoEnds = [], endsInFinally = 0, mutations = [];
  var topLevelLeaks = [];

  // Pass 1: polyfill detection
  walk(ast, function (n) {
    if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression") {
      var l = n.left, parts = [];
      while (l && l.type === "MemberExpression") { parts.unshift(memberName(l)); l = l.object; }
      if (l && l.type === "Identifier") { parts.unshift(l.name); polyfilled[parts.join(".")] = true; }
    }
  });

  // Top-level leakage (globals persist between script runs in AE's engine)
  ast.body.forEach(function (st) {
    if (st.type === "VariableDeclaration" || st.type === "FunctionDeclaration") {
      topLevelLeaks.push(st.loc.start.line);
    }
  });

  walk(ast, function (n, parents) {
    var line = n.loc ? n.loc.start.line : "?";

    if (n.type === "CallExpression" && n.callee.type === "MemberExpression") {
      var name = memberName(n.callee);
      var obj = n.callee.object;

      // ES3 missing prototype methods
      if (name && Object.prototype.hasOwnProperty.call(ES3_MISSING_METHODS, name) &&
          !(obj.type === "Identifier" && Object.prototype.hasOwnProperty.call(ES3_MISSING_STATICS, obj.name))) {
        var owner = ES3_MISSING_METHODS[name];
        var poly = polyfilled["Array.prototype." + name] || polyfilled["String.prototype." + name] ||
                   polyfilled["Function.prototype." + name];
        if (!poly) err(line, "." + name + "() does not exist in ExtendScript (ES3 " + owner + "). Use a for-loop / manual helper, or define a polyfill first.");
      }
      // ES3 missing statics
      if (obj.type === "Identifier" && Object.prototype.hasOwnProperty.call(ES3_MISSING_STATICS, obj.name) &&
          ES3_MISSING_STATICS[obj.name].indexOf(name) !== -1 && !polyfilled[obj.name + "." + name]) {
        err(line, obj.name + "." + name + "() does not exist in ExtendScript (ES3). Write a helper instead.");
      }
      // JSON without polyfill
      if (obj.type === "Identifier" && obj.name === "JSON" && !hasJsonPolyfill) {
        err(line, "JSON." + name + "() needs a polyfill in ExtendScript. #include json2.jsx (assets/lib) or inline it.");
      }
      // 0 index on 1-based AE collections
      if ((name === "layer" || name === "item" || name === "property" || name === "keyTime" ||
           name === "keyValue" || name === "outputModule") &&
          n.arguments.length === 1 && n.arguments[0].type === "Literal" && n.arguments[0].value === 0) {
        err(line, "." + name + "(0): AE collections are 1-based. First element is ." + name + "(1).");
      }
      // Undo groups
      if (name === "beginUndoGroup") undoBegins.push(line);
      if (name === "endUndoGroup") {
        undoEnds.push(line);
        for (var p = parents.length - 1; p >= 1; p--) {
          if (parents[p - 1].type === "TryStatement" && parents[p - 1].finalizer === parents[p]) { endsInFinally++; break; }
        }
      }
      if (name && MUTATORS.indexOf(name) !== -1) mutations.push(line);

      // Display names instead of matchNames
      if (name === "property" && n.arguments.length === 1 && n.arguments[0].type === "Literal" &&
          typeof n.arguments[0].value === "string") {
        var s = n.arguments[0].value;
        if (DISPLAY_NAMES.hasOwnProperty(s)) {
          warn(line, 'property("' + s + '") uses an English display name; it breaks in non-English AE. Prefer matchName "' + DISPLAY_NAMES[s] + '".');
        }
      }
    }

    // alert() inside loops blocks AE once per iteration
    if (n.type === "CallExpression" && n.callee.type === "Identifier" && n.callee.name === "alert") {
      for (var q = parents.length - 1; q >= 0; q--) {
        if (/Function/.test(parents[q].type)) break;
        if (isLoop(parents[q])) { warn(line, "alert() inside a loop: AE will show a modal dialog every iteration. Collect messages and alert once at the end."); break; }
      }
    }

    // activeItem usage
    if (n.type === "MemberExpression" && memberName(n) === "activeItem") usesActiveItem.push(line);

    // Array literal holes / trailing comma (length differs in ES3)
    if (n.type === "ArrayExpression") {
      for (var k = 0; k < n.elements.length; k++) {
        if (n.elements[k] === null) { warn(line, "Array literal has a hole or trailing comma; in ExtendScript this adds an undefined element and changes .length."); break; }
      }
    }

    // `with`, `eval` are legal but risky
    if (n.type === "WithStatement") warn(line, "`with` statement: avoid, it makes AE object lookups ambiguous.");
  });

  if (usesActiveItem.length && !hasCompCheck) {
    warn(usesActiveItem[0], "app.project.activeItem is used but never checked with `instanceof CompItem`. It can be null, footage, or a folder.");
  }
  if (undoBegins.length !== undoEnds.length) {
    err(undoBegins[0] || undoEnds[0], "beginUndoGroup() count (" + undoBegins.length + ") != endUndoGroup() count (" + undoEnds.length + "). An unclosed undo group corrupts AE's undo history.");
  } else if (undoBegins.length && endsInFinally < undoEnds.length) {
    warn(undoEnds[0], "endUndoGroup() is not inside a finally block. If the script throws, the undo group stays open.");
  }
  if (!undoBegins.length && mutations.length) {
    warn(mutations[0], "Script modifies the project but has no app.beginUndoGroup(). The user will need many Cmd/Ctrl+Z presses to revert.");
  }
  if (topLevelLeaks.length) {
    warn(topLevelLeaks[0], "Top-level var/function declarations leak into AE's global scope and persist between runs. Wrap everything in (function(){ ... })(); (or (function(thisObj){...})(this) for panels).");
  }
  return out;
}

function main() {
  var files = process.argv.slice(2);
  if (!files.length) { console.error("usage: node lint_jsx.js file.jsx [...]"); process.exit(2); }
  var totalErr = 0, totalWarn = 0;
  files.forEach(function (f) {
    var r;
    try { r = lintFile(f); } catch (e) { console.error(f + ": could not lint: " + e.message); totalErr++; return; }
    console.log("== " + f);
    r.errors.sort(function (a, b) { return a.line - b.line; }).forEach(function (e) { console.log("  ERROR   line " + e.line + ": " + e.msg); });
    r.warnings.sort(function (a, b) { return a.line - b.line; }).forEach(function (w) { console.log("  warning line " + w.line + ": " + w.msg); });
    if (!r.errors.length && !r.warnings.length) console.log("  OK — ES3-clean, no AE pitfalls detected.");
    totalErr += r.errors.length; totalWarn += r.warnings.length;
  });
  console.log("\n" + totalErr + " error(s), " + totalWarn + " warning(s).");
  process.exit(totalErr ? 1 : 0);
}
main();

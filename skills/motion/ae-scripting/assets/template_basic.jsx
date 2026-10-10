/*
 * ==========================================================================
 *  SCRIPT_NAME  v1
 *  What it does : ONE_LINE_DESCRIPTION
 *  Run          : File > Scripts > Run Script File...  (open/select a comp first)
 *  Re-run safe  : yes — removes layers it created last time (tagged in comment)
 *  Tested for   : After Effects 2024+ (ExtendScript / ES3)
 * ==========================================================================
 */
(function () {

    // ------------------------------------------------------------------
    //  CONFIG — the only part you should need to edit
    // ------------------------------------------------------------------
    var CONFIG = {
        tag: "SCRIPT_TAG",          // written into layer.comment; used for clean re-runs
        cleanPrevious: true,        // delete layers this script made last time
        startTime: 0,               // seconds
        staggerFrames: 2,           // delay between elements, in frames
        easeInfluence: 75           // 0.1–100; higher = smoother/"heavier" ease
    };

    var SCRIPT_NAME = "SCRIPT_NAME";

    // ------------------------------------------------------------------
    //  Helpers
    // ------------------------------------------------------------------
    function getActiveComp() {
        var item = app.project.activeItem;
        if (item && item instanceof CompItem) return item;
        return null;
    }

    // Snap a time (seconds) to the comp's frame grid so keys land on frames.
    function snap(comp, t) {
        return Math.round(t / comp.frameDuration) * comp.frameDuration;
    }
    function frames(comp, n) { return n * comp.frameDuration; }

    // Apply the same temporal ease to every keyframe of a property.
    // Works for 1D, 2D, 3D, spatial and color props: the ease array length is
    // read from the property itself instead of guessed.
    function easeAllKeys(prop, influence) {
        for (var k = 1; k <= prop.numKeys; k++) {
            var dims = prop.keyInTemporalEase(k).length;
            var ease = [];
            for (var d = 0; d < dims; d++) ease.push(new KeyframeEase(0, influence));
            prop.setTemporalEaseAtKey(k, ease, ease);
        }
    }

    function tagLayer(layer) { layer.comment = CONFIG.tag; }

    function removeTagged(comp) {
        var removed = 0;
        for (var i = comp.numLayers; i >= 1; i--) {       // reverse: indices shift on delete
            var L = comp.layer(i);
            if (L.comment === CONFIG.tag) {
                if (L.locked) L.locked = false;
                L.remove();
                removed++;
            }
        }
        return removed;
    }

    function xform(layer) { return layer.property("ADBE Transform Group"); }

    // ------------------------------------------------------------------
    //  Main
    // ------------------------------------------------------------------
    var comp = getActiveComp();
    if (!comp) {
        alert(SCRIPT_NAME + ": open or select a composition first.");
        return;
    }

    var report = [];
    app.beginUndoGroup(SCRIPT_NAME);
    try {
        if (CONFIG.cleanPrevious) {
            var n = removeTagged(comp);
            if (n) report.push("Removed " + n + " old layer(s).");
        }

        // ---- build here -------------------------------------------------
        // var layer = comp.layers.addShape();
        // layer.name = "Example";
        // tagLayer(layer);
        // var op = xform(layer).property("ADBE Opacity");
        // op.setValuesAtTimes([snap(comp, 0), snap(comp, 0.5)], [0, 100]);
        // easeAllKeys(op, CONFIG.easeInfluence);
        // -----------------------------------------------------------------

        report.push("Done.");
    } catch (e) {
        report.push("ERROR line " + e.line + ": " + e.toString());
    } finally {
        app.endUndoGroup();
    }
    alert(SCRIPT_NAME + "\n\n" + report.join("\n"));
})();

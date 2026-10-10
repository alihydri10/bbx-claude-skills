/*
 * ==========================================================================
 *  PANEL_NAME  v1  — dockable ScriptUI panel
 *  Install : copy this file into
 *     Win: C:\Program Files\Adobe\Adobe After Effects <ver>\Support Files\Scripts\ScriptUI Panels\
 *     Mac: /Applications/Adobe After Effects <ver>/Scripts/ScriptUI Panels/
 *    then restart AE and open it from the Window menu (bottom of the list).
 *  Quick test without installing: File > Scripts > Run Script File... (opens as floating window)
 * ==========================================================================
 */
(function (thisObj) {

    var PANEL_NAME = "PANEL_NAME";

    function getActiveComp() {
        var item = app.project.activeItem;
        return (item && item instanceof CompItem) ? item : null;
    }

    // The actual work. Receives plain values read from the UI.
    function run(opts) {
        var comp = getActiveComp();
        if (!comp) { alert(PANEL_NAME + ": select a composition first."); return; }
        app.beginUndoGroup(PANEL_NAME);
        try {
            // ---- build here using opts.count, opts.size, opts.animate ----
        } catch (e) {
            alert(PANEL_NAME + " error (line " + e.line + "):\n" + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", PANEL_NAME, undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 6;
        win.margins = 10;

        // Row: number field
        var r1 = win.add("group");
        r1.add("statictext", undefined, "Count:");
        var countField = r1.add("edittext", undefined, "10");
        countField.characters = 6;

        // Row: slider + live value
        var r2 = win.add("group");
        r2.add("statictext", undefined, "Size:");
        var sizeSlider = r2.add("slider", undefined, 100, 10, 500);
        sizeSlider.preferredSize.width = 140;
        var sizeLabel = r2.add("statictext", undefined, "100");
        sizeLabel.characters = 4;
        sizeSlider.onChanging = function () { sizeLabel.text = Math.round(sizeSlider.value); };

        var animateBox = win.add("checkbox", undefined, "Animate in");
        animateBox.value = true;

        var goBtn = win.add("button", undefined, "Build");
        goBtn.onClick = function () {
            var count = parseInt(countField.text, 10);
            if (isNaN(count) || count < 1) { alert("Count must be a whole number above 0."); return; }
            run({ count: count, size: Math.round(sizeSlider.value), animate: animateBox.value });
        };

        win.onResizing = win.onResize = function () { this.layout.resize(); };

        if (win instanceof Window) { win.center(); win.show(); }
        else { win.layout.layout(true); }
        return win;
    }

    buildUI(thisObj);

})(this);

# Scripting API by After Effects version

From the official changelog (ae-scripting.docsforadobe.dev/introduction/changelog), checked
Sept 2026. `parseInt(app.version, 10)` gives the major number (22 = 2022 … 26 = 2026; 19–21
were skipped). Guard anything newer than the user's version, or ask which AE they run when a
feature below is central to the script.

| Version | Date | What scripts gained |
|---|---|---|
| 16.0 (CC 2019) | 2018 | `app.project.expressionEngine` ("extendscript" / "javascript-1.0") |
| 17.0.1 | Nov 2019 | Dropdown Menu Control: `isDropdownEffect`, `setPropertyParameters()` |
| 17.1.1 | May 2020 | Shape Stroke Taper / Wave, Offset Paths copies matchNames; `displayStartFrame` |
| 18.0 | Mar 2021 | Media replacement / Essential Properties scripting, `addToMotionGraphicsTemplate()` |
| 22.0 | Oct 2021 | `Layer.id`, `Project.layerByID()`, MFR config, render queue notifications |
| 22.3 | Apr 2022 | `Layer.doSceneEditDetection()` |
| 22.6 | Aug 2022 | Keyframe labels: `keyLabel()`, `setLabelAtKey()` |
| 23.0 | Oct 2022 | New track matte API: `setTrackMatte()`, `removeTrackMatte()`, `trackMatteLayer` (any layer can be the matte) |
| 24.0 | Oct 2023 | `app.fonts` / Font objects, big TextDocument expansion (direction, composerEngine, digitSet, kerning, ligature, indents, space before/after…), `getEnumAsString()` |
| 24.2 | Feb 2024 | Vertical text: `addVerticalText()`, `addVerticalBoxText()`, `lineOrientation` |
| 24.3 | Mar 2024 | Per-character / paragraph / line ranges: `characterRange()`, `paragraphRange()`, `composedLineRange()` |
| 24.4 | May 2024 | `ThreeDModelLayer` |
| 24.5 | May 2024 | `Project.usedFonts`, `Project.replaceFont()` |
| 24.6 | Aug 2024 | Box text auto-fit / overflow / vertical alignment / inset spacing, more font utilities |
| 25.1 | Dec 2024 | `CharacterRange.pasteFrom()`, CT-script default fonts |
| 25.2 | Apr 2025 | `LightLayer.lightSource` (environment lights) |
| 25.4 | Aug 2025 | `app.restart()` |
| 26.0 | Jan 2026 | `PropertyGroup.addVariableFontAxis()`, `Property.propertyParameters` (read dropdown items), `Property.valueText` |
| 26.3 | Jun 2026 | `addParametricMesh()` / `ParametricMeshLayer`; camera FocusAreaWidth, NearFarBlurMultiplier (Advanced 3D) |
| 26.5 | Sep 2026 | Guides via `GuideOptions` (percent position, color, pinning); layer-input render stage (`layerInputStage`, `setInputLayerAndStage()`). Guide enum integers differ between versions — compare to constants |

Not coming yet: UXP scripting for After Effects. Everything is still ExtendScript (ES3) + CEP
panels + ScriptUI.

Pre-23 track matte style (only if the user is on AE 2022 or older): the matte must be the layer
directly above, and you set `layer.trackMatteType = TrackMatteType.ALPHA`.

Version guard pattern:
```js
var AE = parseInt(app.version, 10);
if (AE >= 24) { td.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT; }
else { report.push("RTL direction needs AE 2024+; set it manually in the Paragraph panel."); }
```

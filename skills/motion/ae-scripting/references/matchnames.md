# matchName reference

Always address properties by matchName: display names are translated in non-English AE and
some change between versions. Condensed from the official tables at
https://ae-scripting.docsforadobe.dev/matchnames/ (layer/*, effects/firstparty).

Discovering an unknown matchName at runtime (tell the user to select the property, run this):

```js
(function () {
    var c = app.project.activeItem, out = [];
    if (!(c instanceof CompItem)) return;
    var ps = c.selectedProperties;
    for (var i = 0; i < ps.length; i++) out.push(ps[i].name + "  →  " + ps[i].matchName);
    alert(out.join("\n") || "Select a property in the timeline first.");
})();
```

Effect *parameters* follow `<effect matchName>-000N` (e.g. `ADBE Gaussian Blur 2-0001` =
Blurriness). N is the parameter order in the Effect Controls panel (groups/topics count too).
If unsure, loop `effect.property(i)` and read `.name` / `.matchName` once.

## Layer level

`ADBE Transform Group` → `ADBE Anchor Point` · `ADBE Position` (`ADBE Position_0/_1/_2` when
separated) · `ADBE Scale` · `ADBE Orientation` · `ADBE Rotate X` · `ADBE Rotate Y` ·
`ADBE Rotate Z` (the normal "Rotation") · `ADBE Opacity`

Top-level groups: `ADBE Marker` · `ADBE Time Remapping` · `ADBE Mask Parade` (Masks) ·
`ADBE Effect Parade` (Effects) · `ADBE Layer Overrides` (Essential Properties) ·
`ADBE Text Properties` (text layers) · `ADBE Root Vectors Group` (shape Contents) ·
`ADBE Audio Group` · `ADBE Layer Styles` · `ADBE Material Options Group` (3D)

Mask: `ADBE Mask Atom` (one mask) → `ADBE Mask Shape` · `ADBE Mask Feather` ·
`ADBE Mask Opacity` · `ADBE Mask Offset` (Expansion)

Layer types via `layer.matchName`: `ADBE AV Layer` · `ADBE Text Layer` · `ADBE Vector Layer`
(shape) · `ADBE Camera Layer` · `ADBE Light Layer`

## Shape layers

Structure: Contents (`ADBE Root Vectors Group`) → Group (`ADBE Vector Group`) →
its Contents (`ADBE Vectors Group`) → shapes / fills / strokes / operators; the group's own
transform is `ADBE Vector Transform Group`.

**Layer**: `ADBE Vector Layer` (Shape Layer)
**Contents**: `ADBE Root Vectors Group` (Contents)
**Group**: `ADBE Vector Group` (Group) · `ADBE Vector Blend Mode` (Blend Mode) · `ADBE Vectors Group` (Contents) · `ADBE Vector Transform Group` (Transform) · `ADBE Vector Materials Group` (Material Options)
**Group Transform Properties**: `ADBE Vector Anchor` (Shape Group Transform Anchor Point) · `ADBE Vector Position` (Shape Group Transform Position) · `ADBE Vector Scale` (Shape Group Transform Scale) · `ADBE Vector Skew` (Shape Group Transform Skew) · `ADBE Vector Skew Axis` (Shapw Group Transform Skew Axis) · `ADBE Vector Rotation` (Shape Group Transform Rotation) · `ADBE Vector Group Opacity` (Shape Group Transform Opacity)
**Rectangle**: `ADBE Vector Shape - Rect` (Rectangle) · `ADBE Vector Shape Direction` (Shape Direction) · `ADBE Vector Rect Size` (Size) · `ADBE Vector Rect Position` (Position) · `ADBE Vector Rect Roundness` (Roundness)
**Ellipse**: `ADBE Vector Shape - Ellipse` (Ellipse) · `ADBE Vector Shape Direction` (Shape Direction) · `ADBE Vector Ellipse Size` (Size) · `ADBE Vector Ellipse Position` (Position)
**Polystar**: `ADBE Vector Shape - Star` (Polystar) · `ADBE Vector Shape Direction` (Shape Direction) · `ADBE Vector Star Type` (Type) · `ADBE Vector Star Points` (Points) · `ADBE Vector Star Position` (Position) · `ADBE Vector Star Rotation` (Rotation) · `ADBE Vector Star Inner Radius` (Inner Radius) · `ADBE Vector Star Outer Radius` (Outer Radius) · `ADBE Vector Star Inner Roundess` (Inner Roundness) · `ADBE Vector Star Outer Roundess` (Outer Roundness)
**Path**: `ADBE Vector Shape - Group` (Path) · `ADBE Vector Shape Direction` (Shape Direction) · `ADBE Vector Shape` (Path)
**Fill**: `ADBE Vector Graphic - Fill` (Fill) · `ADBE Vector Blend Mode` (Blend Mode) · `ADBE Vector Composite Order` (Composite) · `ADBE Vector Fill Rule` (Fill Rule) · `ADBE Vector Fill Color` (Color) · `ADBE Vector Fill Opacity` (Opacity)
**Stroke**: `ADBE Vector Graphic - Stroke` (Stroke) · `ADBE Vector Blend Mode` (Blend Mode) · `ADBE Vector Composite Order` (Composite) · `ADBE Vector Stroke Color` (Color) · `ADBE Vector Stroke Opacity` (Opacity) · `ADBE Vector Stroke Width` (Stroke Width) · `ADBE Vector Stroke Line Cap` (Line Cap) · `ADBE Vector Stroke Line Join` (Line Join) · `ADBE Vector Stroke Miter Limit` (Miter Limit)
**Stroke Dashes**: `ADBE Vector Stroke Dashes` (Dashes) · `ADBE Vector Stroke Dash 1` (Dash) · `ADBE Vector Stroke Gap 1` (Gap) · `ADBE Vector Stroke Dash 2` (Dash 2) · `ADBE Vector Stroke Gap 2` (Gap 2) · `ADBE Vector Stroke Dash 3` (Dash 3) · `ADBE Vector Stroke Gap 3` (Gap 3) · `ADBE Vector Stroke Offset` (Offset)
**Stroke Taper**: `ADBE Vector Stroke Taper` (Taper) · `ADBE Vector Taper Start Width` (Start Width) · `ADBE Vector Taper Length Units` (Length Units) · `ADBE Vector Taper End Width` (End Width) · `ADBE Vector Taper End Ease` (End Ease) · `ADBE Vector Taper End Length` (End Length) · `ADBE Vector Taper Start Length` (Start Length) · `ADBE Vector Taper Start Ease` (Start Ease)
**Stroke Wave**: `ADBE Vector Stroke Wave` (Wave) · `ADBE Vector Taper Wave Amount` (Amount) · `ADBE Vector Taper Wave Units` (Units) · `ADBE Vector Taper Wave Phase` (Phase) · `ADBE Vector Taper Wavelength` (Wavelength)
**Gradient Fill**: `ADBE Vector Graphic - G-Fill` (Gradient Fill) · `ADBE Vector Blend Mode` (Blend Mode) · `ADBE Vector Composite Order` (Composite) · `ADBE Vector Fill Rule` (Fill Rule) · `ADBE Vector Grad Type` (Type) · `ADBE Vector Grad Start Pt` (Start Point) · `ADBE Vector Grad End Pt` (End Point) · `ADBE Vector Grad HiLite Length` (Highlight Length) · `ADBE Vector Grad HiLite Angle` (Highlight Angle) · `ADBE Vector Grad Colors` (Colors) · `ADBE Vector Fill Opacity` (Opacity)
**Gradient Stroke**: `ADBE Vector Graphic - G-Stroke` (Gradient Stroke) · `ADBE Vector Blend Mode` (Blend Mode) · `ADBE Vector Composite Order` (Composite) · `ADBE Vector Grad Type` (Type) · `ADBE Vector Grad Start Pt` (Start Point) · `ADBE Vector Grad End Pt` (End Point) · `ADBE Vector Grad HiLite Length` (Highlight Length) · `ADBE Vector Grad HiLite Angle` (Highlight Angle) · `ADBE Vector Grad Colors` (Colors) · `ADBE Vector Stroke Opacity` (Opacity) · `ADBE Vector Stroke Width` (Stroke Width) · `ADBE Vector Stroke Line Cap` (Line Cap) · `ADBE Vector Stroke Line Join` (Line Join) · `ADBE Vector Stroke Miter Limit` (Miter Limit) · `ADBE Vector Stroke Dashes` (Dashes)
**Merge Paths**: `ADBE Vector Filter - Merge` (Merge Paths) · `ADBE Vector Merge Type` (Mode)
**Offset Paths**: `ADBE Vector Filter - Offset` (Offset Paths) · `ADBE Vector Offset Amount` (Amount) · `ADBE Vector Offset Line Join` (Line Join) · `ADBE Vector Offset Miter Limit` (Miter Limit) · `ADBE Vector Offset Copies` (Copies) · `ADBE Vector Offset Copy Offset` (Copy Offset)
**Pucker & Bloat**: `ADBE Vector Filter - PB` (Pucker & Bloat) · `ADBE Vector PuckerBloat Amount` (Amount)
**Repeater**: `ADBE Vector Filter - Repeater` (Repeater) · `ADBE Vector Repeater Copies` (Copies) · `ADBE Vector Repeater Offset` (Offset) · `ADBE Vector Repeater Order` (Composite) · `ADBE Vector Repeater Transform` (Transform)
**Round Corners**: `ADBE Vector Filter - RC` (Round Corners) · `ADBE Vector RoundCorner Radius` (Radius)
**Trim Paths**: `ADBE Vector Filter - Trim` (Trim Paths) · `ADBE Vector Trim Start` (Start) · `ADBE Vector Trim End` (End) · `ADBE Vector Trim Offset` (Offset) · `ADBE Vector Trim Type` (Trim Multiple Shapes)
**Twist**: `ADBE Vector Filter - Twist` (Twist) · `ADBE Vector Twist Angle` (Angle) · `ADBE Vector Twist Center` (Center)
**Wiggle Paths**: `ADBE Vector Filter - Roughen` (Wiggle Paths) · `ADBE Vector Roughen Size` (Size) · `ADBE Vector Roughen Detail` (Detail) · `ADBE Vector Roughen Points` (Points) · `ADBE Vector Temporal Freq` (Wiggles/Second) · `ADBE Vector Correlation` (Correlation) · `ADBE Vector Temporal Phase` (Temporal Phase) · `ADBE Vector Spatial Phase` (Spatial Phase) · `ADBE Vector Random Seed` (Random Seed)
**Wiggle Transform**: `ADBE Vector Filter - Wiggler` (Wiggle Transform) · `ADBE Vector Xform Temporal Freq` (Wiggles/Second) · `ADBE Vector Correlation` (Correlation) · `ADBE Vector Temporal Phase` (Temporal Phase) · `ADBE Vector Spatial Phase` (Spatial Phase) · `ADBE Vector Random Seed` (Random Seed) · `ADBE Vector Wiggler Transform` (Transform)
**Zig Zag**: `ADBE Vector Filter - Zigzag` (Zig Zag) · `ADBE Vector Zigzag Size` (Size) · `ADBE Vector Zigzag Detail` (Ridges per segment) · `ADBE Vector Zigzag Points` (Points)

## Text layers

**Layer**: `ADBE Text Layer`
**Text**: `ADBE Text Properties` (Text) · `ADBE Text Document` (Source Text) · `ADBE Text Path Options` (Path Options) · `ADBE Text Reverse Path` (Reverse Path) · `ADBE Text Perpendicular To Path` (Perpendicular To Path) · `ADBE Text Force Align Path` (Force Alignment) · `ADBE Text First Margin` (First Margin) · `ADBE Text Last Margin` (Last Margin) · `ADBE Text More Options` (More Options) · `ADBE Text Variable Font Spacing` (Variable Font Spacing) · `ADBE Text Anchor Point Align` (Grouping Alignment) · `ADBE Text Animators` (Animators)
**Animators**: `ADBE Text Animator` (Animator) · `ADBE Text Selectors` (Selectors) · `ADBE Text Selector` (Range Selector) · `ADBE Text Percent Start` (Start) · `ADBE Text Percent End` (End) · `ADBE Text Percent Offset` (Offset) · `ADBE Text Index Start` (Start) · `ADBE Text Index End` (End) · `ADBE Text Index Offset` (Offset) · `ADBE Text Range Advanced` (Advanced) · `ADBE Text Range Units` (Units) · `ADBE Text Selector Mode` (Mode) · `ADBE Text Selector Max Amount` (Amount) · `ADBE Text Selector Smoothness` (Smoothness) · `ADBE Text Levels Max Ease` (Ease High) · `ADBE Text Levels Min Ease` (Ease Low) · `ADBE Text Random Seed` (Random Seed) · `ADBE Text Animator Properties` (Properties) · `ADBE Text Anchor Point 3D` (Anchor Point) · `ADBE Text Position 3D` (Position) · `ADBE Text Scale 3D` (Scale) · `ADBE Text Skew` (Skew) · `ADBE Text Skew Axis` (Skew Axis) · `ADBE Text Rotation X` (X Rotation) · `ADBE Text Rotation Y` (Y Rotation) · `ADBE Text Rotation` (Z Rotation) · `ADBE Text Opacity` (Opacity) · `ADBE Text Fill Opacity` (Fill Opacity) · `ADBE Text Stroke Opacity` (Stroke Opacity) · `ADBE Text Fill Color` (Fill Color) · `ADBE Text Stroke Color` (Stroke Color) · `ADBE Text Fill Hue` (Fill Hue) · `ADBE Text Stroke Hue` (Stroke Hue) · `ADBE Text Fill Saturation` (Fill Saturation) · `ADBE Text Stroke Saturation` (Stroke Saturation) · `ADBE Text Fill Brightness` (Fill Brightness) · `ADBE Text Stroke Brightness` (Stroke Brightness) · `ADBE Text Stroke Width` (Stroke Width) · `ADBE Text Line Anchor` (Line Anchor) · `ADBE Text Track Type` (Tracking Type) · `ADBE Text Tracking Amount` (Tracking Amount) · `ADBE Text Character Replace` (Character Value) · `ADBE Text Character Offset` (Character Offset) · `ADBE Text Line Spacing` (Line Spacing) · `ADBE Text Blur` (Blur)

Adding an animator:
```js
var anims = textLayer.property("ADBE Text Properties").property("ADBE Text Animators");
var an = anims.addProperty("ADBE Text Animator");
var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
var props = an.property("ADBE Text Animator Properties");
var op = props.addProperty("ADBE Text Opacity");    // re-fetch `an`/`sel` after this if needed
```

## Effects (first-party)

**Blur & Sharpen**: `ADBE Bilateral` = Bilateral Blur · `ADBE Camera Lens Blur` = Camera Lens Blur · `ADBE CameraShakeDeblur` = Camera-Shake Deblur · `CS CrossBlur` = CC Cross Blur · `CC Radial Blur` = CC Radial Blur · `CC Radial Fast Blur` = CC Radial Fast Blur · `CC Vector Blur` = CC Vector Blur · `ADBE Channel Blur` = Channel Blur · `ADBE Compound Blur` = Compound Blur · `ADBE Motion Blur` = Directional Blur · `ADBE Box Blur2` = Fast Box Blur · `ADBE Gaussian Blur 2` = Gaussian Blur · `ADBE Radial Blur` = Radial Blur · `ADBE Sharpen` = Sharpen · `ADBE Smart Blur` = Smart Blur · `ADBE Unsharp Mask2` = Unsharp Mask
**Channel**: `ADBE Arithmetic` = Arithmetic · `ADBE Blend` = Blend · `ADBE Calculations` = Calculations · `CC Composite` = CC Composite · `ADBE Channel Combiner` = Channel Combiner · `ADBE Compound Arithmetic` = Compound Arithmetic · `ADBE Invert` = Invert · `ADBE Minimax` = Minimax · `ADBE Remove Color Matting` = Remove Color Matting · `ADBE Set Channels` = Set Channels · `ADBE Set Matte3` = Set Matte · `ADBE Shift Channels` = Shift Channels · `ADBE Solid Composite` = Solid Composite
**Color Correction**: `ADBE AutoColor` = Auto Color · `ADBE AutoContrast` = Auto Contrast · `ADBE AutoLevels` = Auto Levels · `ADBE Black&White` = Black & White · `ADBE Brightness & Contrast 2` = Brightness & Contrast · `ADBE Broadcast Colors` = Broadcast Colors · `CS Color Neutralizer` = CC Color Neutralizer · `CC Color Offset` = CC Color Offset · `CS Kernel` = CC Kernel · `CC Toner` = CC Toner · `ADBE Change Color` = Change Color · `ADBE Change To Color` = Change to Color · `ADBE CHANNEL MIXER` = Channel Mixer · `ADBE Color Balance 2` = Color Balance · `ADBE Color Balance (HLS)` = Color Balance (HLS) · `ADBE Color Link` = Color Link · `ADBE Deflicker` = Color Stabilizer · `APC Colorama` = Colorama · `ADBE CurvesCustom` = Curves · `ADBE Equalize` = Equalize · `ADBE Exposure2` = Exposure · `ADBE Gamma/Pedestal/Gain2` = Gamma/Pedestal/Gain · `ADBE HUE SATURATION` = Hue/Saturation · `ADBE Leave Color` = Leave Color · `ADBE Easy Levels2` = Levels · `ADBE Pro Levels2` = Levels (Individual Controls) · `ADBE Lumetri` = Lumetri Color · `ADBE PhotoFilterPS` = Photo Filter · `ADBE PS Arbitrary Map` = PS Arbitrary Map · `ADBE SelectiveColor` = Selective Color · `ADBE ShadowHighlight` = Shadow/Highlight · `ADBE Tint` = Tint · `ADBE Tritone` = Tritone · `ADBE Vibrance` = Vibrance
**Distort**: `ADBE BEZMESH` = Bezier Warp · `ADBE Bulge` = Bulge · `CC Bend It` = CC Bend It · `CC Bender` = CC Bender · `CC Blobbylize` = CC Blobbylize · `CC Flo Motion` = CC Flo Motion · `CC Griddler` = CC Griddler · `CC Lens` = CC Lens · `CC Page Turn` = CC Page Turn · `CC Power Pin` = CC Power Pin · `CC Ripple Pulse` = CC Ripple Pulse · `CC Slant` = CC Slant · `CC Smear` = CC Smear · `CC Split` = CC Split · `CC Split 2` = CC Split 2 · `CC Tiler` = CC Tiler · `ADBE Corner Pin` = Corner Pin · `ADBE Upscale` = Detail-preserving Upscale · `ADBE Displacement Map` = Displacement Map · `ADBE LIQUIFY` = Liquify · `ADBE Magnify` = Magnify · `ADBE MESH WARP` = Mesh Warp · `ADBE Mirror` = Mirror · `ADBE Offset` = Offset · `ADBE Optics Compensation` = Optics Compensation · `ADBE Polar Coordinates` = Polar Coordinates · `ADBE RESHAPE` = Reshape · `ADBE Ripple` = Ripple · `ADBE Rolling Shutter` = Rolling Shutter Repair · `ADBE SCHMEAR` = Smear · `ADBE Spherize` = Spherize · `ADBE Geometry2` = Transform · `ADBE Turbulent Displace` = Turbulent Displace · `ADBE Twirl` = Twirl · `ADBE WRPMESH` = Warp · `ADBE SubspaceStabilizer` = Warp Stabilizer VFX · `ADBE Wave Warp` = Wave Warp
**Expression Controls**: `ADBE Point3D Control` = 3D Point Control · `ADBE Angle Control` = Angle Control · `ADBE Checkbox Control` = Checkbox Control · `ADBE Color Control` = Color Control · `ADBE Dropdown Control` = Dropdown Control · `ADBE Layer Control` = Layer Control · `ADBE Point Control` = Point Control · `ADBE Slider Control` = Slider Control
**Generate**: `ADBE 4ColorGradient` = 4-Color Gradient · `ADBE Lightning 2` = Advanced Lightning · `ADBE AudSpect` = Audio Spectrum · `ADBE AudWave` = Audio Waveform · `ADBE Laser` = Beam · `CC Glue Gun` = CC Glue Gun · `CC Light Burst 2.5` = CC Light Burst 2.5 · `CC Light Rays` = CC Light Rays · `CC Light Sweep` = CC Light Sweep · `CS Threads` = CC Threads · `ADBE Cell Pattern` = Cell Pattern · `ADBE Checkerboard` = Checkerboard · `ADBE Circle` = Circle · `ADBE ELLIPSE` = Ellipse · `ADBE Eyedropper Fill` = Eyedropper Fill · `ADBE Fill` = Fill · `ADBE Fractal` = Fractal · `ADBE Ramp` = Gradient Ramp · `ADBE Grid` = Grid · `ADBE Lens Flare` = Lens Flare · `ADBE Paint Bucket` = Paint Bucket · `APC Radio Waves` = Radio Waves · `ADBE Scribble Fill` = Scribble · `ADBE Stroke` = Stroke · `APC Vegas` = Vegas · `ADBE Write-on` = Write-on
**Keying**: `ADBE Spill2` = Advanced Spill Suppressor · `CC Simple Wire Removal` = CC Simple Wire Removal · `ADBE Color Difference Key` = Color Difference Key · `ADBE Color Range` = Color Range · `ADBE Difference Matte2` = Difference Matte · `ADBE Extract` = Extract · `ADBE ATG Extract` = Inner/Outer Key · `ADBE KeyCleaner` = Key Cleaner · `Keylight 906` = Keylight (1.2) · `ADBE Linear Color Key2` = Linear Color Key
**Matte**: `ADBE Matte Choker` = Matte Choker · `ISL MochaShapeImporter` = mocha shape · `ADBE RefineRBMatte` = Refine Hard Matte · `ADBE RefineMatte2` = Refine Soft Matte · `ADBE Simple Choker` = Simple Choker
**Noise & Grain**: `VISINF Grain Implant` = Add Grain · `ADBE Dust & Scratches` = Dust & Scratches · `ADBE Fractal Noise` = Fractal Noise · `VISINF Grain Duplication` = Match Grain · `ADBE Median` = Median · `ADBE Noise` = Noise · `ADBE Noise Alpha2` = Noise Alpha · `ADBE Noise HLS2` = Noise HLS · `ADBE Noise HLS Auto2` = Noise HLS Auto · `VISINF Grain Removal` = Remove Grain · `ADBE AIF Perlin Noise 3D` = Turbulent Noise
**Perspective**: `ADBE 3D Tracker` = 3D Camera Tracker · `ADBE 3D Glasses2` = 3D Glasses · `ADBE Bevel Alpha` = Bevel Alpha · `ADBE Bevel Edges` = Bevel Edges · `CC Cylinder` = CC Cylinder · `CC Environment` = CC Environment · `CC Sphere` = CC Sphere · `CC Spotlight` = CC Spotlight · `ADBE Drop Shadow` = Drop Shadow · `ADBE Radial Shadow` = Radial Shadow
**Simulation**: `APC CardDanceCam` = Card Dance · `APC Caustics` = Caustics · `CC Ball Action` = CC Ball Action · `CC Bubbles` = CC Bubbles · `CC Drizzle` = CC Drizzle · `CC Hair` = CC Hair · `CC Mr. Mercury` = CC Mr. Mercury · `CC Particle Systems II` = CC Particle Systems II · `CC Particle World` = CC Particle World · `CC Pixel Polly` = CC Pixel Polly · `CSRainfall` = CC Rainfall · `CC Scatterize` = CC Scatterize · `CSSnowfall` = CC Snowfall · `CC Star Burst` = CC Star Burst · `APC Foam` = Foam · `ADBE Playgnd` = Particle Playground · `APC Shatter` = Shatter · `APC Wave World` = Wave World
**Stylize**: `ADBE Brush Strokes` = Brush Strokes · `ADBE Cartoonify` = Cartoon · `CS BlockLoad` = CC Block Load · `CC Burn Film` = CC Burn Film · `CC Glass` = CC Glass · `CS HexTile` = CC HexTile · `CC Kaleida` = CC Kaleida · `CC Mr. Smoothie` = CC Mr. Smoothie · `CC Plastic` = CC Plastic · `CC RepeTile` = CC RepeTile · `CC Threshold` = CC Threshold · `CC Threshold RGB` = CC Threshold RGB · `CS Vignette` = CC Vignette · `ADBE Color Emboss` = Color Emboss · `ADBE Emboss` = Emboss · `ADBE Find Edges` = Find Edges · `ADBE Glo2` = Glow · `ADBE Mosaic` = Mosaic · `ADBE Tile` = Motion Tile · `ADBE Posterize` = Posterize · `ADBE Roughen Edges` = Roughen Edges · `ADBE Scatter` = Scatter · `ADBE Strobe` = Strobe Light · `ADBE Texturize` = Texturize · `ADBE Threshold2` = Threshold
**Text**: `ADBE Numbers2` = Numbers · `ADBE Timecode` = Timecode
**Time**: `CC Force Motion Blur` = CC Force Motion Blur · `CC Wide Time` = CC Wide Time · `ADBE Echo` = Echo · `ADBE OFMotionBlur` = Pixel Motion Blur · `ADBE Posterize Time` = Posterize Time · `ADBE Difference` = Time Difference · `ADBE Time Displacement` = Time Displacement · `ADBE Timewarp` = Timewarp
**Transition**: `ADBE Block Dissolve` = Block Dissolve · `APC CardWipeCam` = Card Wipe · `CC Glass Wipe` = CC Glass Wipe · `CC Grid Wipe` = CC Grid Wipe · `CC Image Wipe` = CC Image Wipe · `CC Jaws` = CC Jaws · `CC Light Wipe` = CC Light Wipe · `CS LineSweep` = CC Line Sweep · `CC Radial ScaleWipe` = CC Radial ScaleWipe · `CC Scale Wipe` = CC Scale Wipe · `CC Twister` = CC Twister · `CC WarpoMatic` = CC WarpoMatic · `ADBE Gradient Wipe` = Gradient Wipe · `ADBE IRIS_WIPE` = Iris Wipe · `ADBE Linear Wipe` = Linear Wipe · `ADBE Radial Wipe` = Radial Wipe · `ADBE Venetian Blinds` = Venetian Blinds
**Utility**: `ADBE Apply Color LUT2` = Apply Color LUT · `CC Overbrights` = CC Overbrights · `ADBE Cineon Converter2` = Cineon Converter · `ADBE ProfileToProfile` = Color Profile Converter · `ADBE GROW BOUNDS` = Grow Bounds · `ADBE Compander` = HDR Compander · `ADBE HDR ToneMap` = HDR Highlight Compression

Common parameter matchNames used a lot:
- Gaussian Blur: `-0001` Blurriness, `-0002` Blur Dimensions, `-0003` Repeat Edge Pixels
- Fill (`ADBE Fill`): `-0002` Color (check `-0001` = Fill Mask)
- Tint (`ADBE Tint`): `-0001` Map Black To, `-0002` Map White To, `-0003` Amount
- Expression controls: all use `-0001` for their single value
Verify any other index with the discovery snippet above before relying on it.

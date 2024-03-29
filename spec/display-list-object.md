Display List Object (DLO)
=========================

> This explainer is an incomplete working draft.

**Status**: explainer.

_A format and API for efficiently creating, transmitting, modifying and rendering UI and graphics on 2D Canvas._


Rationale
---------

HTML and the DOM provide a format and API respectively to manipulate content using high level abstractions. In the graphics sense, these abstractions operate in "retained mode."

In contrast, HTML Canvas provides APIs to draw directly to logical and physical surfaces. These abstractions operate in "immediate mode."

| Abstraction level | Immediate mode | Retained mode                       |
|-------------------|----------------|-------------------------------------|
| High level        | --             | HTML & DOM                          |
| Low level         | 2D Canvas      | _**Proposal**: Display List Object_ |

Retained mode has several benefits over immediate mode:

* **Accessibility**: retained mode graphics can be inspected by the platform and exposed to accessibility tools
* **Faster loads of initial UI state**: initial state of an application for certain common display sizes can be serialized, cached, streamed and displayed quickly
* **Faster updates of displayed state**: implementation can calculate minimal deltas and apply them more efficiently (e.g. using GPU-accelerated code)
* **Indexability**: retained mode text can be exposed to Web crawlers and search engines

Display List Object (DLO) is a proposal to add a retained mode API to the low level drawing abstraction provided by HTML Canvas.

Use cases
---------

### Accessibility, Testability, Indexability

Currently, applications drawing text to Canvas are inaccessible to browsers, extensions and tools without the use of complex, brittle and resource-intensive approaches like OCR or ML.

A retained mode Canvas allows applications to present graphics and text to the implementation in a retained object that can be directly inspected by the application, by related code (e.g. testing frameworks), by extensions, and by web services (e.g. search engine crawlers). Text in this retained object remains in a machine readable UTF-8 format, with styling, positional and dimensional information preserved.

It is expected that this will enable simple and robust pipelines for accessibility and indexabilty of Canvas-based content on the Web than is possible today.

### Efficient UI updates

Currently, applications updating Canvas-based UI state must maintain their own representation of the UI to perform layout and compute invalidation. Although the application possesses a declarative representation of the new desired UI state, it must apply the needed changes imperatively and serially to a Canvas via the high-level, and comparatively slow, JavaScript APIs.

A retained mode graphics object can serve as a common data structure for both applications and implementations to represent UI state. Updates to this shared representation can be performed by the application efficiently in batches and the resulting end state presented to the implementation for display. This allows the implementation to optimize invalidation and incremental paint using an efficient static internal representation, native platform code, hardware acceleration, and delegation to lower stages of the paint pipeline.

### Animation

Animation simply tightens the bounds and exacerbates the challenges identified above. In addition, applications must maintain and compute updates to a state machine to track progress through an animation's timeline. These state machine updates must then be applied to the graphical elements, which are then repainted to a Canvas.

A retained mode Canvas allows the Canvas state to be [parameterized](#variables). Future proposals like the Animation State Machine will allow applications to delegate frame-to-frame updates of the Canvas state to the implementation as well.

This approach unburdens JavaScript execution, reduces call pressure along the API boundary and provides the opportunity for animation engines to support more complex graphics and animations at higher frame rates.

Requirements
------------

The retained mode Canvas will provide the following features:

* **Legible text**: text should be programmatically inspectable in human-understandable spans like formatted multi-line paragraphs (not glyphs, words or other fragments) without the need for OCR
* **Styled text**: applied text styles should be programmatically inspectable (e.g. size, bold, etc.)
* **Fast**: updating a retained mode Canvas should scale proportional to the size of the update, not the size of the display list
* **Inexpensive**: display lists should not consume backing memory for raster storage unless and until needed (e.g. when a raster image is requested or when a drawing is displayed on screen)
* **Scalable**: scaling a retained mode Canvas does not produce pixelation artifacts like with the current immediate mode Canvas
* **Incrementally adoptable**: applications using the current Canvas APIs should be able to gradually migrate to using a retained mode Canvas


Strawman Proposal
-----------------

We propose a new lightweight low-level drawing object called the Display List Object (DLO) which stores draw commands but does not apply them to any raster backing memory. We further propose a new HTML Canvas context type called `2dretained` as a drawing interface with support for both immediate-mode draw commands and retained-mode DLOs:

|        | Canvas `2d` context                                    | Canvas `2dretained` context <sup>new</sup>                            | Display List Object <sup>new</sup>       |
|--------|--------------------------------------------------------|-----------------------------------------------------------------------|------------------------------------------|
|        | _Draw commands applied to raster memory and discarded_ | _Draw commands applied to raster memory and appended to display list_ | _Draw commands appended to display list_ |
| Memory | **High**: O(_canvas area_)                             | **High**: O(_canvas area_) + O(_# draw commands_)                     | **Low**: O(_# draw commands_)            |

For most vector-based UI and graphics, O(_canvas area_) >> O(# draw commands).

### Context


A `2dretained` context type is a drop-in replacement for the current `2d` context type and supports the same drawing methods.

As with existing `2d` contexts, the draw methods of `2dretained` context immediately draw to the context's raster backing memory (and display if on screen). However a `2dretained` context also retains the draw calls in an internal display list.

```js
const canvas = document.getElementById("my-canvas-element");
const ctx = canvas.getContext("2dretained");
ctx.strokeRect(50, 50, 50, 50);
```

> _**Why**: A drop-in replacement context type allows applications to incrementally adopt retained-mode Canvas. A separate context type ensures that the added internal storage of a retained display list is only required when requested by the application, rather than added to the memory footprint of all existing 2D Canvas contexts._

### Accessing a DLO

The retained display list of a Canvas `2dretained` context can be accessed using `getDisplayList`:

```js
dlo = ctx.getDisplayList();
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["strokeRect", 50, 50, 50, 50]
    ]
}
```

### Modifying a DLO

A DLO can be modified by issuing additional drawing commands using the methods of the DLO instead of the Canvas context. These commands are applied in retained mode and merely appended to the command list of the DLO.

```js
dlo.fillText("Hello", 10, 10);
dlo.toJSON();
```


```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["strokeRect", 50, 50, 50, 50],
        ["fillText", "Hello", 10, 10]
    ]
}
```

Modifications to a DLO do not result in changes to any Canvas contexts or any displayed graphics. 

> **Implementation note**: DLOs are inexpensive to create and modify. Implementations do not need to allocate raster backing memory. The draw methods of a DLO should run in amortized constant time.


### Nesting DLOs

DLOs can be nested by inserting a display list inon another display list. This creates a tree structure that allows for faster incremental updates to a complex scene:

```js
dlo2 = DisplayList();
dlo2.fillText("World", 30, 10);

dlo.insert(dlo2);
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["strokeRect", 50, 50, 50, 50],
        ["fillText", "Hello", 10, 10],
        {
            "commands": [
                ["fillText", "World", 30, 10]
            ]
        }
    ]
}
```

Inserting a display list onto another display list returns a handle that can be used to update the nested display list.

```js
handle = dlo.insert(dlo2);
handle.reset();
handle.fillText("世界", 30, 10);
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["strokeRect", 50, 50, 50, 50],
        ["fillText", "Hello", 10, 10],
        {
            "commands": [
                ["fillText", "世界", 30, 10]
            ]
        }
    ]
}
```

An optional identifier can be provided to `insert()`. The identifier is serialized with the display list and can be used to obtain handles after deserializing a saved display list.

```js
handle = dlo.insert(dlo2, "mySubDisplayList");
jsonDLO = dlo.toJSON();

newDLO = DisplayList();
newDLO.fromJSON(jsonDLO);
newHandle = newDLO.getById("mySubDisplayList"); // same sub-display list as above
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["strokeRect", 50, 50, 50, 50],
        ["fillText", "Hello", 10, 10],
        {
            "commands": [
                ["fillText", "世界", 30, 10]
            ],
            "id": "mySubDisplayList"
        }
    ]
}
```

> _**Why**: nested DLOs create a tree of grouped draw commands which allows implementations to efficiently compute deltas between DLOs for fast incremental updates in the paint pipeline. This allows drawings to be updated with performance proportional to the change in the drawing rather than performance proportional to the size and complexity of the overall drawing. DLO trees can implement copy-on-write semantics to reduce the memory overhead of accessing, modifying and drawing complex scenes._

### Drawing and updating a Canvas with a DLO

A DLO can be drawn into a Canvas `2dretained` context:

```js
ctx.insert(dlo);
```

Drawing a DLO applies the commands in the DLO immediately to the Canvas raster backing memory (and display if on screen). Drawing a DLO to a `2dretained` context also appends the commands in the DLO to the internal command list of the context.

> _**Why**: The append behavior of `drawDisplayList` aids in incremental adoption: applications can draw some parts of their scene with unmodified code that calls `ctx.draw*()` methods directly and get the expected immediate-mode behavior, while newer application code can draw other parts of the scene into a retained-mode DLO which is then appended to the same context. The application can be updated over time to draw more of the scene into the DLO and issue fewer draw commands to the context. Implementations have efficient access to the entire DLO when `drawDisplayList` is used, rather than receiving draw commands one by one from the application when using the `2d` Canvas context._

A Canvas context of type `2dretained` can be entirely _updated_ to match a given DLO:

```js
ctx.updateDisplayList(dlo);
console.assert(ctx.getDisplayList().equals(dlo));
```

Updating a `2dretained` canvas context with a DLO is equivalent to resetting the context and drawing the DLO. However in reality, only the difference between the internal display list of the context and the DLO is applied to the canvas, which can be much faster for complex scenes and small updates.

```js
// Equivalent approaches with different performance

// 1. Runs in O(len(dlo)) time
ctx.reset()
ctx.insert(dlo);

// 2. Runs in O(len(diff(ctx, dlo))) time
ctx.updateDisplayList(dlo);
```


> _**Why**: The replacement behavior of `updateDisplayList` allows applications that do all drawing for a given context into a DLO and get maximum performance by presenting the desired DLO in its entirety to the implementation. The implementation can then efficiently determine and apply the needed updates to the context._

### Save and Restore

> Note: In a retained-mode Canvas application, methods like `save()` and `restore()` should be considered deprecated and DLO-native applications should create scenes by assembling nested DLO's as described above.

The `save()` method creates a new unnamed sub-display list and moves the DLO's "cursor" into it.

```js
dlo.fillText("Hello", 50, 50);
dlo.save();
dlo.fillRect(0, 0, 25, 25); // written into a new nested DLO
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["fillText", "Hello", 50, 50],
        {
            "commands": [
                ["fillRect", 0, 0, 25, 25]
            ],
        }
    ]
}
```

The `restore()` method simply moves the "cursor" of the DLO out of the most recent sub-display list created by the `save()` method:

```js
dlo.restore();
dlo.fillText("world", 100, 50);
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["fillText", "Hello", 50, 50],
        {
            "commands": [
                ["fillRect", 0, 0, 25, 25]
            ],
        },
        ["fillText", "world", 100, 50]
    ]
}
```

### Changing canvas state

Certain Canvas methods change the current drawing state of the Canvas and affect all _subsequent_ draw method calls. These methods include grid transformations (`transform()`, `translate()`, `rotate()`, and `scale()`), default styles (`strokeStyle()`, `fillStyle()`, `lineWidth()`, `font()`, etc.), and the current clipping path.

These methods can be called against a `2dretained` Canvas context and a DLO object to achieve the same effect.

```js
dlo = DisplayList();
dlo.fillText("Hello", 50, 50);

dlo.translate(5, 5);           // DLO not empty, new nested DLO created
dlo.font("bold 48px serif");

dlo.fillText("world", 45, 45); // translated origin and font style applied
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["fillText", "Hello", 50, 50],
        {
            "transform": [1, 0, 5, 0, 1, 5, 0, 0, 1],
            "font": "bold 48px serif",
            "commands": [
                ["fillText", "world", 45, 45]
            ],
        }
    ]
}
```

Since the nested DLOs created by these functions are unavailable to the application, the implementation can optimize the tree of DLOs by moving state transformations up or down in the tree in a way that balances the tree while preserving Canvas semantics:

```js
dlo.font("");                           // clear font selection made above
dlo.fillText("How are you?", 50, 100);  // implementation can move "world" to nested DLO and put this text in parent
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["fillText", "Hello", 50, 50],
        {
            "transform": [1, 0, 5, 0, 1, 5, 0, 0, 1],
            "commands": [
                {
                    "font": "bold 48px serif",
                    "commands": [
                        ["fillText", "world", 45, 45]
                    ]
                },
                ["fillText", "How are you?", 50, 100]
            ],
        },
    ]
}
```

### Formatted Text

Applications drawing text to a Canvas often apply their own layout rules (e.g. a document editor wrapping text at some document-defined page margin). To do this, applications need to know the dimensions of formatted text under some constraints, as well as apply line- and word-breaking according to language-specific rules.

This proposal is meant to interoperate with the [WICG Canvas Formatted Text proposal](https://github.com/WICG/canvas-formatted-text) for handling formatted text. An application would usually create a formatted text metrics object, inspect the resulting dimensions to make application-specific layout decisions, and then draw the (possubly adjusted) text to a Canvas.

```js
ftxt = FormattedText.format( [   "The quick ", 
                                {
                                    text: "brown",
                                    style: "color: brown; font-weight: bold"
                                },
                                " fox jumps over the lazy dog." 
                            ], "font-style: italic", 350 );


// inspect ftxt to make layout decisions...
// adjust text as needed (split, relayout, reformat)...

// once it is ready, draw to DLO
dlo.fillFormattedText(ftxt, 50, 50 );
dlo.toJSON();
```

```json
{
     "metadata": {
        "version": "0.0.1",
    },
    "commands": [
        "fillFormattedText", [
            [
                "the quick ",
                {
                    "text": "brown",
                    "style": "color: brown; font-weight: bold",
                },
                " fox jumps over the lazy dog."
            ],
            {"fontStyle": "italic"},
            350,
            50,
            50
        ]
    ],
}
```

> _**Why**: As above, drawing formatted text makes the text and its associated style information available to the application, extensions and the implementation, improving the accessibility of Canvas-based applications._

In Discussion
-------------

### Variables

Numeric values can be specified as variables with an initial value and efficiently updated later. Since variables are a retained-mode concept, they are only available on the display list object and not on the retained mode Canvas context.

```js
myVar = dlo.variable("myHeight");
myVar.setValue(50);
dlo.drawRect(10, 10, 10, myVar);
dlo.toJSON();
```

```json
{
    "metadata": {
        "version": "0.0.1"
    },
    "commands": [
        ["drawRect", 10, 10, 10, {"var": "myHeight"}]
    ],
    "variables": [
        {"var": "myHeight", "value": 50}
    ]
}
```

Variables can be updated, for example in a tight animation loop:

```js
dlo = ctx.getDisplayList();
myVar = dlo.getVariable("myHeight");
for (;;) {
    // something something rAF
    myVar.setValue(myVar.getValue() + 1);
    ctx.updateDisplayList(dlo);
}
```

> _**Why**: Variables allow the application to delegate multiple updates to a DLO to the implementation, which can compute and apply the delta to a Canvas context more efficiently than the application._

> _**TODO**: Variables and nested display lists (expressions?)_

> _**TODO**: Variables and embedded curves?_

> _**Future**: The animation state machine proposal lets applications delegate even variable updates to the implementation, along pre-specified curves, allowing potentially all frame-to-frame updates of a DLO animation to run near the native speed of the implementation with minimal load on the JavaScript main thread._


Resources
---------

* [WICG Canvas Formatted Text proposal](https://github.com/WICG/canvas-formatted-text)

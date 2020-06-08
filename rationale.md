
Rationale
=========

Canvas is the web’s direct mode rendering solution that closely matches traditional programming models. This is particularly targeted for games and full featured apps.

Modern 2D developers sometimes have to fallback to GL for features that are expected to be available in 2D but currently aren’t supported by Canvas 2D. There's a always a balance to be struck when adding new APIs to the web. That said, it's important that Canvas2D is able to address developer's use cases in game development and text manipulation.

The [current Canvas 2D API](https://html.spec.whatwg.org/multipage/canvas.html) was originally proposed in 2013. Since then, a lot of 2D graphics APIs have appeared and changed what developers expect from a good 2D API. This proposal tries to modernize Canvas 2D API, considering current and future usage of Canvas and considering 3 pillars:

1. feature parity with other 2D APIs;
2. access to current capabilities of the Web/CSS;
3. performance improvement.


Feature Parity with 2D APIs
---------------------------

Modern 2D graphics developers have grown a set of expectations around what a 2D
API should provide. By looking at other popular APIs, we can figure out blind
spots of Canvas2D and focus on areas where there are developer-driven needs.

Here's a small round up of 2D APIs used in different libraries. Speically focused on the APIs proposed in this change.

[**PixiJS**](https://www.pixijs.com/) *[Web, Javascript]*: Filters: generic filters, AlphaFilter (alpha across a set of operations), DisplacementFilter, BlurFilter, ColorMatrixFilter (5x4), NoiseFilter, generic shader filters. RoundRect. Perspective transforms. Batch image drawing.

[**Direct2D**](https://docs.microsoft.com/en-us/windows/win32/direct2d/direct2d-portal) *[Windows, C++]*: Non-affine transforms through filters. RoundRect. Big support for filters ([effects](https://docs.microsoft.com/en-us/windows/win32/direct2d/built-in-effects)): color matrix, premul, tint, white level, blending and compositing, blur, edge, displacement, light, emboss, brightness, contrast, exposure, sharpen, turbulence. DrawSpriteBatch.

[**CoreGraphics**](https://developer.apple.com/documentation/coregraphics)/[**Quartz](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Conceptual/drawingwithquartz2d/Introduction/Introduction.html) *[OSX, objectiveC/Swift]*: Non-affine transforms through CATransform3D (CoreAnimation). RoundedRect. [Filters](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Reference/CoreImageFilterReference/index.html).

[**Skia**](https://skia.org/) *[C++]*: full perspective transform. drawRoundRect. Image filters.


Current HTML/CSS rendering features
-----------------------------------

Modern browsers implement a rich set of rendering features that are currently unavailable to developers in a immediate API. Bridging that gap and giving more power to developers is a good thing. Canvas should have most (if not all) capabilities that a regular page rendered with CSS has.


Canvas2D Specific improvements
------------------------------

A common bottleneck for Canvas2D rendering is how many Javascript functions are needed to render a particular scene. With this in mind, adding more expressive APIs (that allow you to render the same scene with fewer commands) will result in better performance.

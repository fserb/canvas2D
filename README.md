Modern Canvas 2D API
====================

This repo contains proposal for an updated modern version of the Canvas 2D API.

Feature list
------------

| Feature | Explainer | Status |
| ------- |------|-----|
| Non-affine transforms | | |
| Batch drawImage | [explainer](spec/batch-drawimage.md) | initial explainer |
| Draw primitives | | |
| Modern filter | | |
| Recorded pictures | | |
| Path2D Inspection | | |
| willReadFrequently | | |
| Canvas context loss | | |
| More text modifiers | | |
| Wide gamut | | |
| Color spaces | | |
| Text layout | | |


Rationale
---------

The current Canvas 2D API was proposed in 2013. Since then, a lot of 2D graphics APIs have evolved and changed what developers expect from a good 2D API. This proposal tries to modernize Canvas 2D API, considering current and future usage of Canvas.

Canvas is the web’s direct mode rendering solution that closely matches traditional programming models. This is a particularly common need for games and full featured apps.

A common bottleneck for Canvas2D rendering is how many Javascript functions are needed to render a particular scene. With this in mind, adding more expressive APIs (that allow you to render the same scene with fewer commands) will result in better performance.

Also, modern 2D developers sometimes have to fallback to GL for features that are expected to be available in 2D but currently aren’t.

Finally, modern browsers implement a rich set of rendering features that are currently unavailable to developers. Bridging that gap and giving more power to developers is a good thing.



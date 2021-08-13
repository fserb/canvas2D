---
recipe: api-interface
title: '2dcontextrestored'
mdn_url: /en-US/docs/Web/API/2dcontextrestored_event
specifications: [[specURL]]#[[HeadingAnchor]]
browser_compatibility: api.2dcontextlost
---

**When this feature ships, the content below will live on MDN under
[developer.mozilla.org/en-US/docs/Web/API](https://developer.mozilla.org/en-US/docs/Web/API).**

## Description

The `contextrestored` [`EventHandler`](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers) of the [Canvas Api](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
is triggered when the user agent "restores" the backing storage associated with
`CanvasRenderingContext2D` on the page after being "lost".

Once the context is restored, the resources such as drawings that were created before
the context was lost are no longer valid. You need to reinitialize the state of your 
context and recreate resources.

## Examples

```js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('contextrestored', (event) => {
  console.log(event);
});
```

If this context ctx is lost, this context will then be restored automatically. The event "contextRestored" will be logged in the console.

## See also
[webglcontextlost event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event)

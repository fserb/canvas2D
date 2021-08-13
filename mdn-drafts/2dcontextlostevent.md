---
recipe: api-interface
title: '2dcontextlost'
mdn_url: /en-US/docs/Web/API/2dcontextlost_event
specifications: [[specURL]]#[[HeadingAnchor]]
browser_compatibility: api.2dcontextlost
---

**When this feature ships, the content below will live on MDN under
[developer.mozilla.org/en-US/docs/Web/API](https://developer.mozilla.org/en-US/docs/Web/API).**

## Description

The `contextlost` [`EventHandler`](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers) of the[Canvas Api](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
is triggered when the user agent detects
that the backing storage associated with 'CanvasRenderingContext2D' on the page is "lost". Contexts
can be lost for several reasons, such as a driver crashes, the application runs out of memory, etc.

## Examples

```js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('contextlost', (event) => {
  console.log(event);
});
```

If this context ctx is lost, the event "contextlost" will be logged in the console.

## See also
[webglcontextlost event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event)

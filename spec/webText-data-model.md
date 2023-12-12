# WebText - Data Model

**Status**: explainer

## Creation
Text is hard. Luckily, the browser has already solved this problem as indicated 
above. Canvas can leverage on the existing browser capabilities of rendering
multi-line formatted text. This solves the use case 1, 3 and 4 (partially). We
can then add metrics incorporating grapheme clusters to solve the cursor
placement issues (use case 2 & case 4). With this solution, the new metrics
will be available for other components of the web platform to use as well.

Note: Its users’ responsibility to ensure rendered text is properly constrained
to fit in the space provided by adjusting font-size, line width, line-spacing,
etc., on the input text objects.

```javascript
// Creation
const g = document.createElement("div");
g.style.textAlign = "center";
g.style.fontFamily = "Arial, sans-serif";
g.innerText = "Hello 👪";

// Users can:
// 1. set up a container box for display for the div element
// 2. set up a viewbox for text to render temporary to and a container box for the result display on the screen.
ctx.drawElement(divElement, dx, dy, dWidth, dHeight)
ctx.drawElement(divElement, vx, vy, vWidth, vHeight, dx, dy, dWidth, dHeight)

canvas = document.createElement("canvas");
ctx = canvas.getContext('2d');

ctx.canvas.width = 100;
ctx.canvas.height = 50;
ctx.drawElement(g, 10, 10, 100, 20); // everything fits in nicely.

ctx.canvas.width = 20; // chanve canvas size to 20x50.
// viewbox: 0, 0, 100x20, output box 10, 0, 20x10. So "Hello 👪" is scalled down to fit in 20x10. 
ctx.drawElement(g, 0, 0, 100, 20, 10, 0, 20, 10);
```

### Creat paragraphs with Variable length
Text blocks need to be flexible, so that users can insert images, animations or
videos in between the text. The following is an example of having a picture
floating on the left.

![paragraphs with variable](../images/variable-width-paragraph.png)
*<center>example of paragraphs with variable length</center>*

```javascript
const g = document.createElement("div");
g.style.textAlign = "center";
g.style.fontFamily = "Arial, sans-serif";
g.innerText = "text and more text ...";

// Set up image
const img = document.createElement("img");
img.src = "images/dog.png";            // Set the image source
img.style.width = "100px";            // Example width
img.style.height = "auto";            // Keep aspect ratio
img.style.float = "left";             // Float to the left of the text
g.appendChild(img);

canvas = document.createElement("canvas");
ctx = canvas.getContext('2d');

ctx.canvas.width = 300;
ctx.canvas.height = 3000;
ctx.drawElement(g, 10, 10, 100, 20);
```

### Special case: Inconsistent style over a grapheme cluster
If the users force the grapheme cluster to have two styles by applying 2
different styles to the glyphs, the grapheme cluster should still be
rendered as one, uniform style, the style should be the one the glyphs start
with. For example: the symbol “क्षि” in the example above is drawn by combining
the four glyphs क,  ् ,  ष  and  ि, user could force the first two glyphs ‘क’
and ‘ ् ’to have 1 style (ex: size 10); and force the last two glyphs ‘ष’ and
‘ ि’ to have a different style (ex: size 12 and bold). The resulting grapheme,
क्षि, should follow style one (e.g. size 10).

```javascript
// Existing code
const g = document.createElement("div");
g.style.textAlign = "center";
g.style.fontFamily = "Arial, sans-serif";

// Create a span for 'Hello 👪'
const firstPart = document.createElement("span");
firstPart.innerText = "\u0915\u094D";
firstPart.style.fontWeight = "bold"; 
firstPart.style.fontSize = "12px";

const secondPart = document.createElement("span");
secondPart.innerText = "\u0937\u093F";
secondPart.style.color = "blue";
secondPart.style.fontSize = "10px";

g.appendChild(secondPart);
document.body.appendChild(g);

//क्षि shoul be bold and has a fontsize of bold, black, 12px.
```

## Edit
This section describes how insertion and deletion is done.

### Insertion
To insert text, it follows the same way as insertion is currently done with html. 

``` javasctipt
// Initial set up:
const g = document.createElement("div");
g.style.textAlign = "center";
g.style.fontFamily = "Arial, sans-serif";
g.innerText = "Hello 👪";

// Add more text to g.innerText:
g.innerText += ", welcome.";

// Add more text with different style
const additionalText = document.createElement("span");
additionalText.style.color = "blue"; // different style
additionalText.style.fontWeight = "bold";
additionalText.innerText = " More styled text!";

// Append the new element to the div
g.appendChild(additionalText);

```
### Deletion
The API should support 2 deletion modes:
Delete by Grapheme clusters
Delete by glyphs

Delete by grapheme clusters:
Considering graphemes like emojis, ex: 👨‍👩‍👧‍👧 (U+1F468 U+200D U+1F469 U+200D
U+1F467 U+200D U+1F467, which means "family: man, woman, girl, girl"), letters
with accent, ex; Ç (C U+0043 + ̧ U+0327), the “backspace” key deletes the
entire grapheme clusters. With the example above, the emoji 👨‍👩‍👧‍👧is removed
instead of turning to 👨‍👩‍👧 (delete one girl); the letter Ç is removed instead
of turning to C.

Delete by glyphs:
Consider languages like Sanskrit, backspace deletes glyphs instead of grapheme.
This is because new grapheme clusters can be created by alternating glyphs.
Example: किमपि (pronunciation: kimapi, meaning: something) is made of 3
grapheme clusters e.g. (ka, i), (ma), (pa, i). In the ideal implementation
(implementation in android and mac), backspace deletes the last glyph
(i.e., i). So users can insert another vowel to make a new grapheme cluster,
ex: (pa, u) instead of (pa, i). This example, किमपि takes 5 backspace to delete
it completely: 
किमपि→किमप(remove i)→किम(remove pa)→कि(remove ma)→क(remove i)→’’ (remove ka). 

However, with the same language, Sanskrit, the delete key (delete after the
cursor) behaves differently. Delete deletes the whole grapheme cluster. This is
because the grapheme clusters cannot start with a vowel. With the example
above, it would take 3 deletes to delete all: किमपि→मपि→पि→’’.

*Developer notes: Emojis should always be deleted as a grapheme cluster. For
grapheme clusters for characters, I think we can use uft-8 as a standard.
The main difference between the two grapheme clusters is that Ç is a utf-8
char itself with code U+00c7 and grapheme clusters like ‘पि’, ‘म’ or ‘कि’ are
not.*

```javascript
grapheme = grapheme1 // backspace hit on grapheme1
const emojiRegex = /\p{Emoji}/u; // Uses the buildin javascript emoji regex. By checking unicode range for emojis, the simplified version for c++ could be the following:
// std::wregex emojiRegex(L"[\\x{1F600}-\\x{1F64F}]") = \p{Emoji}/u; 

if (emojiRegex.test(grapheme1)) { // it's an emoji
  grapheme1.destroy(); // remove the emoji
}

if (grapheme1.length() > 1) {
  return grapheme1.substring(0, grapheme1.length()-1) // remove the last glyph
} else {
  grapheme1.destroy(); // remove the emoji
}
```

### Change style
This section describes how to change styles for text on the screen.


``` javascript
// Existing code
const g = document.createElement("div");
g.style.textAlign = "center";
g.style.fontFamily = "Arial, sans-serif";

// Create a span for 'Hello 👪'
const helloText = document.createElement("span");
helloText.innerText = "Hello 👪";
// Apply initial styles to 'Hello 👪'
helloText.style.color = "red"; // Example style


const additionalText = document.createElement("span");
additionalText.style.color = "blue";
additionalText.style.fontWeight = "bold";
additionalText.innerText = " More styled text!";

g.appendChild(additionalText);
document.body.appendChild(g);

// Now change style for helloText
helloText.style.color = "green"; // Change color
helloText.style.fontSize = "24px"; // Change font size

// Now change style for additionalText.
additionalText.style.color = "green"; // Change color to green
additionalText.style.fontSize = "20px"; // Change font size
```
# @sugars/highlight

A standalone ESM port of TangramJS syntax highlighting. It transforms source text in Node.js and renders code blocks in browsers.

## Highlight page code blocks

Place `data-language` or `data-lang` on the code element or one of its ancestors. Insert the source as text.

<!-- example:1 -->

<!-- example:2 -->

The CSS import works with a bundler that supports CSS imports. With direct browser modules, load the chosen CSS as a stylesheet. Themes include `default.css`, `dark.css`, `coy.css`, `funky.css`, `okaidia.css`, `solarizedColor.css`, and `Twilight.css`.

- `renderElement(element, callback?)` processes one element. On success the callback’s `this` is the element.
- `renderAll(callback?)` scans the document. Pass a root to limit the scan.
- `render(element, callback?)` and `render(callback?)` provide the original single-element and page-wide forms.
- Call the rendering methods again after changing content. An unknown language or an empty block leaves its current content in place.

## Transform code text

<!-- example:3 -->

`highlight` produces HTML with `ib-hl` classes, or escaped text for an unknown language. `languages` exposes the registered grammars and their extension methods. `tokenize(text, grammar)` returns tokens. `hooks` provides callbacks for markup generation and rendering. The default export groups the common functions, grammars, and hooks.

Tokenization throws `TypeError` when a nested grammar revisits the same text with the same grammar on the active call path. Nested rules should consume part of the outer text or advance the grammar.

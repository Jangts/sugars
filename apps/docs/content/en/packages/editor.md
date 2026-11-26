# SimpleEditor

`@sugars/editor` is a browser-native rich text editor. Attach it to an ordinary element, a textarea, or a single-line text field. Import from the package entry in a frontend that supports ESM.

<!-- example:1 -->

When attached to a form field, the editor creates an editable surface and keeps the field in sync. Use `getValue()` to read HTML and `resetValue()` to restore the initial content. Before a toolbar moves focus, save the selection with `editor.selection.saveRange()`, then call a command such as `execCommand('bold')`. Insertion and paste sanitize HTML.

Use `readOnly` to suspend editing and `destroy()` when removing the editor. The bundled emoticons and their origins are listed in the attribution notice.

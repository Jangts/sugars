# Sugars Editor Element

`@sugars/editor-element` wraps `@sugars/editor` as a custom element that uses the Light DOM. Its package manifest selects the matching editor dependency. The host needs ESM and Custom Elements support.

<!-- example:1 -->

<!-- example:2 -->

After registration, connecting the element creates the editor and emits `editor-ready`. The element exposes `value`, `readOnly`, and `execCommand()`. Content changes emit `editor-change`. Disconnecting releases the editor. Reconnecting creates a new instance from the preserved Light DOM content.

# 3D Pictures

`@sugars/3d-pictures` displays a sequence of photographs as a rotating view. Drag horizontally to move through the frames.

<!-- example:1 -->

The second argument can be an array of URLs, a directory configuration with `imagePath`, `totalImages`, `imageExtension`, and `defaultImageNumber`, or a JSON manifest URL. Image filenames start at 1 and frame indices at 0. Relative image URLs resolve against the manifest URL. Await `ready` for manifest processing.

Click the loading bar to start preloading, or call `loading()`. If the container provides `img.ib-3deyes-item` elements, omit the second argument to enable dragging from those frames. Mouse and touch share the same logic. Movement over each 25-pixel threshold changes the frame and the sequence wraps. Assign a zero-based `cur` to select a frame directly. `ThreeDimensionalEyes` is an alias for `Pictures3D`.

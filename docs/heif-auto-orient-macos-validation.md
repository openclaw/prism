# HEIF auto-orientation macOS validation

This is a redacted transcript from a real iPhone HEIC processed on macOS with
the original implementation at commit `e3fd172`. The private source image and
its content are intentionally not included. Later commits bind the geometry to
the primary item and accumulate split property associations; those container
shapes are covered by automated tests.

## Build identity

The installed build used for the real-device run matched commit `e3fd172`
exactly:

```text
$ shasum -a 256 dist/index.js
8d62c36e3ed59d270c3a707fb43223319946bcef2a695da317dcea33521e3366  dist/index.js

$ shasum -a 256 <installed-rastermill>/dist/index.js
8d62c36e3ed59d270c3a707fb43223319946bcef2a695da317dcea33521e3366  <installed-rastermill>/dist/index.js
```

## Real-device conversion

Rastermill probed the source container transform, resized it with the macOS
`sips` backend, physically normalized the output pixels, and stripped metadata:

```json
{
  "probe": {
    "width": 4032,
    "height": 3024,
    "format": "heif",
    "hasAlpha": null,
    "orientation": 6,
    "bytes": 1140698
  },
  "result": {
    "format": "jpeg",
    "mimeType": "image/jpeg",
    "width": 1536,
    "height": 2048,
    "bytes": 791622,
    "base64Bytes": 1055496,
    "metadata": "stripped",
    "resized": true,
    "chosen": {
      "format": "jpeg"
    }
  }
}
```

The corresponding `sips` metadata check used redacted paths:

```text
$ sips -g format -g pixelWidth -g pixelHeight -g orientation <private-input.heic>
<private-input.heic>
  format: heic
  pixelWidth: 4032
  pixelHeight: 3024
  orientation: <nil>

$ sips -g format -g pixelWidth -g pixelHeight -g orientation <output.jpg>
<output.jpg>
  format: jpeg
  pixelWidth: 1536
  pixelHeight: 2048
  orientation: <nil>
```

The source's HEIF `irot` property is not surfaced by `sips -g orientation`, but
Rastermill reports its EXIF-equivalent orientation as 6. The portrait output is
therefore represented by physically upright `1536×2048` pixels with no residual
orientation metadata.

## `imir` axis semantics

[ISO/IEC 23008-12](https://www.iso.org/standard/89035.html) section 6.5.12.3
defines `imir` axis 0 as exchanging the top and bottom parts of the image (EXIF
orientation 4), and axis 1 as exchanging the left and right parts (EXIF
orientation 2). The automated test suite covers both axis values and their
compositions with all four `irot` values.

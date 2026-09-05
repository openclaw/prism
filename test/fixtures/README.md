# Synthetic codec fixtures

`green.heic.base64` and `green.avif.base64` contain 64×64 solid green images for the native Windows
fallback smoke check. They contain no photographs or user data. Generate them
with an ImageMagick build that includes HEIC/AVIF encoders:

```sh
magick -size 64x64 xc:lime heic:- | base64 > test/fixtures/green.heic.base64
magick -size 64x64 xc:lime avif:- | base64 > test/fixtures/green.avif.base64
```

Windows CI decodes these fixtures with FFmpeg after skipping System.Drawing,
then independently checks the resized JPEG's dimensions and pixels with Photon.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PhotonImage } from "@silvia-odwyer/photon-node";
import { createRastermill, isRastermillUnavailableError } from "../dist/index.js";

assert.equal(process.platform, "win32", "This smoke check requires native Windows");
for (const format of ["heic", "avif"]) {
  const input = Buffer.from(
    await readFile(new URL(`../test/fixtures/green.${format}.base64`, import.meta.url), "utf8"),
    "base64",
  );
  const native = createRastermill({
    execution: "external",
    commandResolver: (command) => (command === "powershell" ? command : null),
  });
  await assert.rejects(
    native.encode(input, { format: "jpeg", resize: { maxSide: 32 } }),
    (error) =>
      isRastermillUnavailableError(error) &&
      error.causes.some((cause) => String(cause).includes("does not convert HEIC")),
  );
  const attempted = [];
  const rastermill = createRastermill({
    execution: "external",
    commandResolver: (command) => {
      attempted.push(command);
      return command === "powershell" || command === "ffmpeg" ? command : null;
    },
  });
  const result = await rastermill.encode(input, {
    format: "jpeg",
    resize: { maxSide: 32 },
  });
  assert.equal(result.width, 32);
  assert.equal(result.height, 32);
  assert.equal(result.format, "jpeg");
  assert.deepEqual(attempted, ["powershell", "magick", "gm", "ffmpeg"]);
  const decoded = PhotonImage.new_from_byteslice(result.data);
  try {
    assert.equal(decoded.get_width(), 32);
    assert.equal(decoded.get_height(), 32);
    const pixels = decoded.get_raw_pixels();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      assert.ok(pixels[offset] < 40 && pixels[offset + 1] > 210 && pixels[offset + 2] < 40);
    }
  } finally {
    decoded.free();
  }
  console.log(`${format} -> jpeg: Windows native skipped; FFmpeg encoded 32x32 green pixels`);
}

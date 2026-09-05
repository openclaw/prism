import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createRastermill, isRastermillUnavailableError } from "../dist/index.js";

assert.equal(process.platform, "win32", "This smoke check requires native Windows");
const exec = promisify(execFile);
const workspace = await mkdtemp(path.join(os.tmpdir(), "rastermill-fallback-smoke-"));
try {
  for (const format of ["heic", "avif"]) {
    const file = path.join(workspace, `input.${format}`);
    await exec("magick", ["-size", "80x60", "xc:lime", file]);
    const input = await readFile(file);
    const native = createRastermill({
      execution: "external",
      commandResolver: (command) => (command === "powershell" ? command : null),
    });
    await assert.rejects(
      native.encode(input, { format: "jpeg", resize: { maxSide: 40 } }),
      (error) =>
        isRastermillUnavailableError(error) &&
        error.causes.some((cause) => String(cause).includes("does not convert HEIC")),
    );
    for (const output of ["jpeg", "png"]) {
      const attempted = [];
      const rastermill = createRastermill({
        execution: "external",
        commandResolver: (command) => {
          attempted.push(command);
          return command === "powershell" || command === "magick" ? command : null;
        },
      });
      const result = await rastermill.encode(input, {
        format: output,
        resize: { maxSide: 40 },
      });
      assert.equal(result.width, 40);
      assert.equal(result.height, 30);
      assert.equal(result.format, output);
      assert.deepEqual(attempted, ["powershell", "magick"]);
      const probe = await rastermill.probe(result.data);
      assert.equal(probe.width, 40);
      assert.equal(probe.height, 30);
      console.log(`${format} -> ${output}: Windows native skipped; ImageMagick encoded 40x30`);
    }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

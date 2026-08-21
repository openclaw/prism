import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true })));
});

describe("docs site", () => {
  it("escapes table-of-contents text directly from markdown headings", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "rastermill-docs-"));
    workspaces.push(workspace);
    await cp(path.join(process.cwd(), "docs"), path.join(workspace, "docs"), { recursive: true });

    const source = path.join(workspace, "docs", "error-handling.md");
    await writeFile(
      source,
      `${await readFile(source, "utf8")}\n## <script>alert(1)</script>\n`,
      "utf8",
    );

    await execFileAsync(
      process.execPath,
      [path.join(process.cwd(), "scripts/build-docs-site.mjs")],
      {
        cwd: workspace,
      },
    );

    const html = await readFile(path.join(workspace, "docs", "error-handling.html"), "utf8");
    expect(html).toContain(
      '<a class="toc-l2" href="#script-alert-1-script">&lt;script&gt;alert(1)&lt;/script&gt;</a>',
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});

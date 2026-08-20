import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build emits a static ME Preset Lab entry", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /ME Preset Lab/);
  assert.match(html, /<script type="module"[^>]+src="[^"]+"/);
  await access(new URL("../dist", import.meta.url));
});

test("editor keeps file work in the browser", async () => {
  const source = await readFile(new URL("../app/ME1Editor.tsx", import.meta.url), "utf8");
  assert.match(source, /parseME1/);
  assert.match(source, /writeME1/);
  assert.match(source, /new Blob/);
  assert.doesNotMatch(source, /fetch\(|axios|ChatGPT|D1|cloudflare/i);
});

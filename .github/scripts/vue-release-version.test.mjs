import { strict as assert } from "node:assert";
import { test } from "node:test";
import { nextVueVersion } from "./vue-release-version.mjs";

test("advances beyond an already published version after a failed Git update", () => {
  assert.equal(nextVueVersion("0.0.5", ["0.0.4", "0.0.6"]), "0.0.7");
  assert.equal(nextVueVersion("0.0.8", ["0.0.5", "0.0.6"]), "0.0.9");
  assert.equal(nextVueVersion("0.0.5", []), "0.0.6");
});
test("keeps prereleases and other version lines outside the patch sequence", () => {
  assert.equal(
    nextVueVersion("0.0.5", ["0.1.0", "0.0.10-beta.1", "0.0.9"]),
    "0.0.10",
  );
});
test("fails on malformed registry data rather than guessing a version", () => {
  assert.throws(() => nextVueVersion("1.0.0", []));
  assert.throws(() => nextVueVersion("0.0.5", { error: "registry failure" }));
});

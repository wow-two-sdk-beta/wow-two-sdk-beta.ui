import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

/** Beta-forever patch sequence, including versions published before a failed Git update. */
export function nextVueVersion(localVersion, publishedVersions) {
  if (!(/^0\.0\.(0|[1-9]\d*)$/.exec(localVersion)?.[0] === localVersion))
    throw new Error("Expected a 0.0.y Vue package version.");
  if (
    !Array.isArray(publishedVersions) ||
    publishedVersions.some((version) => typeof version !== "string")
  )
    throw new Error("Expected the npm version list.");
  let patch = BigInt(localVersion.slice(4));
  for (const version of publishedVersions) {
    if (!(/^0\.0\.(0|[1-9]\d*)$/.exec(version)?.[0] === version)) continue;
    const candidate = BigInt(version.slice(4));
    if (candidate > patch) patch = candidate;
  }
  return `0.0.${patch + 1n}`;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const published = JSON.parse(
    execFileSync("npm", ["view", manifest.name, "versions", "--json"], {
      encoding: "utf8",
      timeout: 60000,
    }),
  );
  console.log(
    nextVueVersion(
      manifest.version,
      typeof published === "string" ? [published] : published,
    ),
  );
}

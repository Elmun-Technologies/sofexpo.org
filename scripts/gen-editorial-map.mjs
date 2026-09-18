#!/usr/bin/env node
/**
 * Generate `src/data/editorial-owners.json`: which hostname publishes which news note or
 * long-read. Derived from the `event:` field in the content frontmatter — the same field the
 * app reads — so `ownerOf()` can resolve a post path without knowing anything about collections.
 *
 * Runs before every build (npm run build / build:hosts), which is what keeps a hand-written
 * link inside an article and a canonical tag on a post page agreeing with each other.
 */
import { writeFileSync } from "node:fs";
import { editorialOwnership } from "./content-ownership.mjs";
import { ROOT_HOST } from "./host-rules.mjs";

const rows = editorialOwnership(process.argv[2] || "src/content");
const map = {};
for (const r of rows) {
  if (r.host === ROOT_HOST && !r.event) continue; // untagged pieces need no entry: the centre is the default owner
  map[r.path] = { host: r.host, event: r.event };
}

const out = "src/data/editorial-owners.json";
writeFileSync(
  out,
  JSON.stringify(
    { generatedFrom: "src/content/**/ru|en/*.md — do not edit by hand", map },
    null,
    2,
  ) + "\n",
);

const moved = Object.entries(map).filter(([, v]) => v.host !== ROOT_HOST);
console.log(
  `editorial-map: ${rows.length / 2} piece(s) per locale, ${moved.length} published on a show hostname${
    moved.length
      ? ": " + [...new Set(moved.map(([, v]) => v.host))].join(", ")
      : ""
  }`,
);

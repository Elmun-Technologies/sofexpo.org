/**
 * Who publishes which editorial piece — for the plain-Node build scripts.
 *
 * The app knows this from collection data; the scripts know it from the same frontmatter
 * field (`event:`) read straight off the file. Both sides only apply the ONE rule from
 * host-rules.mjs (`hostOfEvent`), so there is nothing to drift apart.
 *
 * Rule (decided 2026-09-18): a news note or long-read tagged with an exhibition that owns a
 * hostname is PUBLISHED ON THAT HOSTNAME — the centre's `/news/` and `/articles/` indexes
 * still list it, but link to it absolutely. Untagged pieces (and pieces about a show without
 * a hostname) stay on the centre.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT_HOST, hostOfEvent } from "./host-rules.mjs";

const FIELDS = ["event"];

function frontmatter(text) {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) return {};
  const out = {};
  for (const line of text.slice(4, end).split("\n")) {
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (m && FIELDS.includes(m[1]))
      out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/** [{ kind, locale, slug, event, path, host }] — path is the host-LOCAL path of the owner. */
export function editorialOwnership(root = "src/content") {
  const rows = [];
  for (const kind of ["news", "articles"]) {
    for (const locale of ["ru", "en"]) {
      const dir = join(root, kind, locale);
      let names = [];
      try {
        names = readdirSync(dir).filter((n) => n.endsWith(".md"));
      } catch {
        continue;
      }
      for (const name of names) {
        const fm = frontmatter(readFileSync(join(dir, name), "utf8"));
        const slug = name.replace(/\.md$/, "");
        const def = fm.event ? hostOfEvent(fm.event) : null;
        rows.push({
          kind,
          locale,
          slug,
          event: fm.event ?? null,
          host: def ? def.host : ROOT_HOST,
          path: `/${kind}/${slug}/`,
        });
      }
    }
  }
  return rows;
}

/** Map used by the link rewriter: `/{locale}/{kind}/{slug}/` -> owning host. */
export function editorialOwnerByPath(root = "src/content") {
  const map = new Map();
  for (const r of editorialOwnership(root)) {
    for (const locale of ["ru", "en"]) map.set(`/${locale}${r.path}`, r.host);
  }
  return map;
}

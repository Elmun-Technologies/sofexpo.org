# public/files

Downloads referenced by the site: technical data sheet, venue regulations, rate card,
service order form, organizer checklist and the per-show catalogues and sponsorship
proposals.

**These PDFs are placeholders.** They exist so that no link on the site 404s while the
production documents are still being exported from the marketing drive. Replace each file
with the real document (same filename) before deploy; keep the names in
`src/data/site.ts` -> `site.files` in sync.

Publication status and actual document language are tracked in
`src/data/downloads.json`. After replacing a sample, review it and update that metadata;
the website uses it to label sample downloads. Run `npm run audit:downloads` to inspect
readiness, or `npm run check:release` to block release while samples remain.
See `docs/10-download-readiness.md` for the complete inventory and translation blocker.

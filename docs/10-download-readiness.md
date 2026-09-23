# Download publication readiness

Updated: 2026-09-23.

## Current blocker

**All 21 PDFs currently in `public/files/` are English placeholder documents, not the
actual catalogues, terms, technical specifications or rate cards.** This is stated in
`public/files/README.md` and in each PDF. There is no substantive source document to
translate yet. Do not create fictional prices, legal terms, safety specifications or
exhibitor lists to fill these files.

The website now labels these files as samples in its download lists, in all four
languages, with a visible explanation and a link to request current documents at
`site.contacts.email`. Sample files no longer display authored size/format notes as if
they were finished publications. Direct asset URLs remain unchanged.

`src/data/downloads.json` records each PDF's publication status and language.
`DownloadNotice.astro`, `Blocks.astro` and `EventSections.astro` consume that metadata;
`src/lib/downloads.mjs` only recognizes registered files on the site's own domains.
External links and non-PDF media do not inherit sample status.

## Inventory requiring originals

| File | Required source document |
| --- | --- |
| `agro-sponsor.pdf` | AGROPRO sponsorship proposal |
| `build-2023-catalog.pdf` | BUILD PRO 2023 catalogue |
| `build-2024-catalog.pdf` | BUILD PRO 2024 catalogue |
| `build-2025-catalog.pdf` | BUILD PRO 2025 catalogue |
| `build-sponsor.pdf` | BUILD PRO sponsorship proposal |
| `catalog-agro-2023.pdf` | AGROPRO 2023 catalogue |
| `catalog-agro-2024.pdf` | AGROPRO 2024 catalogue |
| `catalog-agro-2025.pdf` | AGROPRO 2025 catalogue |
| `catalog-agro-2026.pdf` | AGROPRO 2026 catalogue |
| `ecom-presentation.pdf` | ECOM & RETAIL presentation |
| `ecom-sponsorship.pdf` | ECOM & RETAIL sponsorship proposal |
| `foodera-2026-presentation.pdf` | FOODERA 2026 presentation |
| `foodera-catalogue.pdf` | FOODERA exhibitor catalogue |
| `organizer-checklist.pdf` | Organizer checklist |
| `promotors-2026.pdf` | PROMOTORS 2026 presentation |
| `promotors-sponsorship.pdf` | PROMOTORS sponsorship proposal |
| `service-order.pdf` | Service order form |
| `sof-expo-rate-card.pdf` | Venue rate card |
| `sof-expo-regulations.pdf` | Venue regulations |
| `sof-expo-technical-datasheet.pdf` | Venue technical data sheet |
| `world-edu-catalog-2024.pdf` | WORLD EDU 2024 catalogue |

## Publishing real documents

1. Obtain the authoritative originals from the marketing/operations team, with the
   applicable edition/date. Technical, legal and pricing materials need owner approval.
2. Replace each placeholder under its existing filename to preserve inbound links.
3. Inspect the actual PDF contents, then update its manifest entry to `status: "ready"`
   and its actual language (`en`, `ru`, `zh-CN`, `tr` or `multilingual`). Do not change
   the status merely to satisfy the check.
4. Obtain reviewed Chinese/Turkish document editions separately. Register any new PDF
   paths in the manifest and wire the corresponding language-specific links. The current
   shared paths do **not** automatically select or generate translated documents.
5. Rebuild; the sample notice disappears from lists only when none of their files is
   marked as a placeholder.

```sh
npm run audit:downloads                  # inventory audit; lists pending documents
npm run audit:downloads -- --require-final # fails when any sample remains
npm run check:release                    # normal checks, then the strict PDF gate
```

The normal development build and `npm run check` intentionally permit **disclosed**
samples so work can continue without real assets. The strict release command currently
exits with status 1 because all 21 originals are missing. Deployment automation should
invoke this command if it is to enforce the document gate; adding this command does not
itself change a hosting provider's deployment pipeline.

The audit catches missing files, unregistered PDFs, invalid metadata, missing PDF header
or EOF markers, and files marked ready that still contain the known repository placeholder.
It is not a full PDF parser, malware scanner, linguistic review or legal approval.

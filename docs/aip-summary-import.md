# AIP Summary Import — import logic

> This doc describes the IMPORT SIDE ONLY: the wizard pipeline that reads the
> file and writes records. The sheet layout it operates on is defined in
> `docs/aip-summary-file-structure.md` — file structure and import logic are
> separate docs, linked together. This doc references that spec; the spec
> never references back into wizard detail.
>
> Status: **docs-first — pipeline sketched, no implementation yet.**

Route: `/aip-summary-import` (`AipSummaryImportController@index`,
`resources/js/pages/aip-summary-import/index.tsx`). Listed in the Imports hub
(`resources/js/pages/imports/index.tsx`). Accepts **`.xlsx` only** (ExcelJS),
same as the other importers.

## Input spec (linked)

- Sheet spec: `docs/aip-summary-file-structure.md` — 15 columns in sheet
  order (AIP ref code → PPA desc → implementing office → start/end →
  expected outputs → funding source → PS/MOOE/FE/CO/Total → CC
  adaptation/mitigation → typology code).
- One row per expected output × funding source; `Total` is recomputed, never trusted.
- **Not imported:** the Amount (in thousand pesos) columns — PS (H),
  MOOE (I), Financial Expenses FE (J), Capital Outlay CO (K), Total (L).
  They exist in the sheet but the import pipeline ignores them; only
  columns A–G and M–O are consumed.

## Pipeline (TBD)

Same wizard shape as the PPMP importers (`docs/imports.md`): **Upload &
Sheets → Calibrate → Verify → Review/Extract → Import**. Each stage TBD:

1. **Upload & Sheets** — pick `.xlsx`, select sheets. TBD.
2. **Calibrate** — header-row number (default 7; number row is always
   `headerRow + 1`, data starts at `headerRow + 2`) + per-column letter
   remapping for the 10 imported fields (A–G, M–O; amount cols H–L have no
   entry), grouped identity/schedule/output/climate
   (`lib/aip-summary-import/sheet-config.ts`, single-sheet so no
   shared/per-sheet scope). "Log contents" dumps the data rows to the
   console per the effective config.
3. **Verify** — "Run verify" on the third tab judges the sheet in two
   passes (`lib/aip-summary-import/verify.ts`, pure + vitest-covered,
   structural only, no DB). Pass 1 per row: header set, number row matches
   at calibrated letters (strict), ref-code shape (office prefix, 5–9
   segments, per-level widths), col B prefix matches code depth on PPA rows
   (description is the only required cell). Office, expected output,
   funding source, and schedule are optional — a present schedule must
   still parse (`Mon-YY`/`YYYY-MM-DD`). Pass 2
   hierarchy: no skipped levels (mirrors `UpdatePpaRequest` parent-type
   rule), parent present in sheet, parent before child, no duplicate PPA
   blocks, sibling sequence (`A,B,C…` programs from A; `1,2,3…` dotted
   from 1 per parent). Blank + signatory skips surface as info lines,
   never errors. Result panel shows `Format OK — N blocks, M rows` or the
   row-numbered issue list.
4. **Review/Extract** — human resolves matches, selects rows. TBD.
5. **Import** — POST endpoint + upsert/dedupe behavior. TBD
   (controller currently serves `index` only).

## Linked docs

- File structure: `docs/aip-summary-file-structure.md` (the 15-col sheet
  spec this pipeline consumes).
- Shared PPMP importer pattern: `docs/imports.md`.

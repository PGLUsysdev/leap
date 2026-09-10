# AIP Summary Import — Complete Guide

> Covers the full wizard: Upload → Calibrate → Verify → Extract → Import
> (PPA, Expected Outputs, Funding Sources). Status: **working, in
> production use.**
>
> Related docs: `docs/aip-summary-file-structure.md` (15-column sheet
> spec), `docs/aip-summary-import.md` (pipeline sketch, now largely
> realized), `docs/aip-summary-import-ppa-entries.md` (entries invariant).
> Frontend: `resources/js/pages/aip-summary-import/index.tsx`. Backend:
> `app/Http/Controllers/AipSummaryImportController.php`.

## 1. Overview

The AIP Summary Import reads a `.xlsx` AIP summary sheet (ExcelJS,
client-side) and writes structured records in three stages: **PPAs**
(program/project/activity tree), **expected outputs** (schedules +
implementing offices), and **funding-source links** (+ climate data).
Each stage has its own review tab with match status and its own POST
endpoint with an auditable `importReport`.

Route: `/aip-summary-import` (`aip-summary-import.index`). Listed in the
Imports hub. Accepts **`.xlsx` only**.

```
Upload & Sheet → Calibrate → Verify → Extract → Import (PPA | Outputs | Funds)
```

## 2. Wizard stages

### 2.1 Upload & Sheet

Pick a `.xlsx` file; select one worksheet. Parsing is entirely client-side
(ExcelJS); nothing is sent to the server until Confirm.

### 2.2 Calibrate

- **Header row** (1-indexed, default 7). The number row (`1`–`15`) is
  always `headerRow + 1`; data starts at `headerRow + 2`.
- **Column letters** per imported field (identity / schedule / output /
  climate groups in `lib/aip-summary-import/sheet-config.ts`). Amount
  columns H–L (PS, MOOE, FE, CO, Total) have no entry — they are never
  imported. `Total` is recomputed downstream, never trusted.
- **Log contents** dumps the effective data rows to the dev console.

### 2.3 Verify (structural only, no DB)

`lib/aip-summary-import/verify.ts`, pure + vitest-covered. Two passes:

**Pass 1 (per row):** header set; number row matches at calibrated letters
(strict); ref-code shape (4-segment office prefix, 5–9 total segments,
per-level zero-padded widths); col B prefix matches code depth on PPA rows
(description is the only required cell); schedule parses (`Mon-YY` /
`YYYY-MM-DD`) when present.

**Funding-source anchor rule** (`outputRowState` — blank means empty, `-`,
or `—`):

| Row state | Condition | Fund handling |
|---|---|---|
| `output` | Expected output set | Fund allowed, even without office/schedule |
| `context` | Output blank, office/schedule present | Fund **silently coerced to null** |
| `hierarchy` | Office, schedule, output all blank | Fund present → **error** |

Continuation rows (blank A–B by format) inherit their block leader's
office/schedule/output for this judgment (`resolveRowContext`); their own
non-blank values win. Each continuation judges its own fund cell.

**One fund per row:** a cell naming several funds (`GF-Proper /GF-20% DF`)
is an error — split across continuation rows first (`splitFundSources`).

**Climate rule:** Adaptation / Mitigation / Typology ride on the
*effective* (post-coercion) fund — GF Proper only (dash/space/case
ignored). Blank, `-`, and numeric zero count as empty.

**Pass 2 (hierarchy):** no skipped levels, parent present in sheet, parent
before child, no duplicate PPA blocks, sibling sequencing (programs
`A,B,C…` from A; dotted `1,2,3…` from 1 per parent). Blank + signatory
rows surface as info lines, never errors.

Result panel: `Format OK — N blocks, M rows` or a row-numbered issue
list. Errors block; warnings pass.

### 2.4 Extract (review)

`lib/aip-summary-import/extract.ts`. One record per kept row — the sheet
grain is one row per expected output × funding source. Continuation rows
attach to their PPA block (`isContinuation`, `blockRow`) and **inherit the
leader's output/offices/schedule for blank cells**, while keeping their
own fund cell — so sibling fund links stay attached to the block's
expected output. Record carries normalized keys (`fullCodeNorm`,
`nameNorm`, `outputNorm`, `fundNorm`, `typologyNorm`) for matching.

### 2.5 Import PPA (`POST aip-summary-import`)

Review: PPA blocks grouped by ref code, matched by normalized `full_code`
within the selected office + fiscal year → `Exists` / `New` (counts +
table). Confirm posts **new blocks only**.

Backend (`store`): parents-first ordering, parent resolution by ref-code
prefix, `code_suffix` zero-trimmed, sibling `sort_order = max + 1`,
transactional, `importReport` + toast flashes. **Every processed block
also gets a bare `AipEntry`** (`firstOrCreate`, on insert *and* re-import
healing) — file membership ⇔ entry existence (see
`docs/aip-summary-import-ppa-entries.md`). Gate: `create Ppa`.

### 2.6 Import Expected Outputs (`POST aip-summary-import/outputs`)

Review: one row per record — Row (↳ continuation marker), PPA code/name,
offices (auto-matched badges + amber unmatched badges + per-row picker),
schedule, expected output, **Status** (`Exists` / `New` / `No PPA` / `No
offices` informational).

- **Office matching** (`lib/aip-summary-import/match-offices.ts`):
  strict-normalized acronym equality only. Per-row override via the shared
  `MultiTableSelect` picker; per-token 1:1 mapping via single-select
  `TableSelect` (`TOKEN → OFFICE` link badges); per-token dismiss;
  unmatched-frequency strip shows loosening candidates. Overrides seed
  from the effective selection; reset restores auto state.
- **Import rule:** any row with ≥1 valid column (office, start, end, or
  output) imports; pure-hierarchy rows excluded. Offices attach via the
  `aip_output_office` pivot; officeless rows import with zero pivot rows
  (DB supports it; offices attach later via the edit dialog, which still
  requires ≥1 office interactively).
- Backend (`storeOutputs`): matches PPA by **normalized name** (+ ref-code
  tiebreak), `firstOrCreate`s the entry **plus bare ancestor entries**,
  dedupes on `(entry, expected_output)` (null-safe), per-entry
  `sort_order = max + 1`, validates `end ≥ start`. Gate: per-entry
  `AipEntryPolicy@update` (`aip-summary.edit` + office scope).

### 2.7 Import Funding Source (`POST aip-summary-import/funding-sources`)

Review: PPA/output, fund badge (auto-match + single-select Map + dismiss +
link badge), climate (adaptation/mitigation amounts + typology badge),
**Status** (`Exists` / `New` / `No output`).

- **Matching** (`lib/aip-summary-import/match-funds.ts`):
  strict-normalized code equality (separators stripped, lowercased) for
  both funding-source codes and typology codes.
- Backend (`storeFundingSources`): resolves PPA (name + code tiebreak) →
  requires the entry → resolves the output by expected-output text →
  dedupes on `(output, fund, supplemental null)` → creates the link with
  **zero PS/MOOE/FE/CO**, `ccet_adaptation`/`ccet_mitigation` amounts, and
  nullable `cc_typology_id`. Peso amounts stay out by design (filled later
  via PPMP/funding dialogs). Same gate as outputs.

## 3. Target selectors

The Import steps share **Target Office** (trigger shows acronym, name
fallback) and **Fiscal Year** (trigger shows year) dropdowns. PPA/output
existence, matching scope, and all writes are bound to the selected
office + fiscal year. Defaults: user's office, active fiscal year.

## 4. Guarantees and invariants

1. **File membership ⇔ entry.** Every PPA block the PPA import processes
   ends with an `aip_entries` row (bare header if nothing else).
2. **No duplicate writes.** PPAs dedupe by `(office, FY, full_code)`;
   outputs by `(entry, expected_output)`; fund links by `(output, fund,
   supplemental)`. Re-imports report `skipped: exists`.
3. **Financial amounts never import.** H–L stay zero; only A–G and M–O
   are consumed.
4. **Reviews are honest.** Counts reflect what Confirm will send
   (new-only payloads); skipped rows come back named with reasons in the
   console-logged `importReport` (`page.props.flash.importReport`).
5. **The summary can't blank on gaps.** `sortFlatLikeTree`
   (`lib/aip-summary/sort-tree.ts`) appends orphan subtrees as depth-0
   roots; entries self-heal on import.

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `/aip/{fy}/summary` empty, data exists | Wrong fiscal year selected (page binds one FY) | Switch year selector |
| Summary empty on the right year | Root PPAs lack entries (pre-fix data) | Re-run PPA import (heals) or backfill bare entries |
| Verify: `has no expected output` on fund rows | Continuation rows detached from block output, or hierarchy row carrying a fund | Keep continuations blank-A under the leader; clear stray funds |
| Verify: `one funding source per row` | Stacked funds in one cell | Split into leader + blank-A continuation rows |
| Outputs stuck `No offices` | No acronym match and no manual mapping | Map via picker, or import officeless and attach later |
| Outputs `No PPA` / funds `No output` | Ordering — upstream step not imported | Import PPA → outputs → funds, in order; props refresh between steps |
| Repeated `skipped: exists` | Correct dedupe on re-import | No action — expected on retry |
| Imported but summary still stale | Background tab never refetched props | Hard-reload the summary tab |

## 6. Testing

- **Vitest** (`resources/js/lib/aip-summary-import/`, `lib/aip-summary/`):
  verify (anchor, multi-fund, inheritance, climate, hierarchy), extract
  (records, continuations, coercion, inheritance), matchers (offices,
  funds), sort-tree (ordering, orphans). 70+ cases.
- **Pest** (`tests/Feature/AipSummaryImportTest.php`): PPA insert +
  parent linkage + bare entries + heal-on-reimport; outputs (name match,
  disambiguation, null outputs, officeless, ancestor creation, skips);
  fund links (climate insert, dedupe, skip paths, validation).
- Run narrowly: `npx vitest run resources/js/lib/aip-summary-import/`,
  `vendor/bin/pest tests/Feature/AipSummaryImportTest.php`.

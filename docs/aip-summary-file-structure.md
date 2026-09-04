# AIP Summary file structure — sheet spec (columns)

> This doc describes the FILE ONLY: column order, header groups, source
> fields. It knows nothing about the import wizard. The import side lives in
> `docs/aip-summary-import.md` and links here — file structure and import
> logic are separate docs, linked together.
>
> Separate from `docs/imports.md`: the PPMP importers (Category,
> Category–COA Mappings, Price List) share one sheet structure (`D`–`AH`,
> category / COA / item rows). **AIP Summary uses a different file sheet
> structure** — one flat row per PPA × funding source, described below.
> This doc covers **columns only** for now.

Column order mirrors the on-screen table
(`resources/js/pages/aip-summary/columns/columns.tsx`) and the PDF export
(`resources/js/pages/aip-summary/pdf-render/cols.tsx`,
`table-header.tsx`).

## Column map (A–O, in sheet order)

| Col | #   | Sheet header                         | Group                      | Source field                                                | Notes                                                                                                    |
| --- | --- | ------------------------------------ | -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A   | 1   | AIP Reference Code                   | —                          | `ppa.full_code`                                             | Displayed mono. Column `columns.tsx:55` (`full_code`), PDF `ref_code`                                    |
| B   | 2   | Program/Project/Activity Description | —                          | `ppa.name` (+ `ppa.type` label, `↳` indent by depth)        | `columns.tsx:64`. Depth 0 = bold                                                                         |
| C   | 3   | Implementing Office                  | —                          | `output.offices[].acronym` joined by `/` (e.g. `PICTO/SDU`) | Single nested office renders `PARENT/CHILD`. `columns.tsx:108`                                           |
| D   | 4   | Start                                | Schedule                   | `aip_entry.start_date`                                      | Rendered `Mon-YY` (e.g. `Dec-27`). `columns.tsx:132`                                                     |
| E   | 5   | End                                  | Schedule                   | `aip_entry.end_date`                                        | Same `Mon-YY` format. `columns.tsx:145`                                                                  |
| F   | 6   | Expected Outputs                     | —                          | `aip_entry.expected_output`                                 | Free text. `columns.tsx:158`                                                                             |
| G   | 7   | Funding Source                       | —                          | `current_fs.funding_source.code`                            | Badge in UI. One row per expected output × funding source (`columns.tsx:167`, PDF `funding_source_code`) |
| H   | 8   | PS                                   | Amount (in thousand pesos) | `current_fs.ps_amount`                                      | 2-decimals, right-aligned                                                                                |
| I   | 9   | MOOE                                 | Amount (in thousand pesos) | `current_fs.mooe_amount`                                    | 2-decimals, right-aligned                                                                                |
| J   | 10  | FE                                   | Amount (in thousand pesos) | `current_fs.fe_amount`                                      | Financial Expenses. 2-decimals                                                                           |
| K   | 11  | CO                                   | Amount (in thousand pesos) | `current_fs.co_amount`                                      | Capital Outlay. 2-decimals                                                                               |
| L   | 12  | Total                                | Amount (in thousand pesos) | `ps + mooe + fe + co` (computed, `Decimal`)                 | Not stored — derived per row. `columns.tsx:240`                                                          |
| M   | 13  | Adaptation                           | Climate Change Expenditure | `current_fs.ccet_adaptation`                                | 2-decimals, right-aligned                                                                                |
| N   | 14  | Mitigation                           | Climate Change Expenditure | `current_fs.ccet_mitigation`                                | 2-decimals, right-aligned                                                                                |
| O   | 15  | Typology                             | —                          | `current_fs.cc_typology.code`                               | `-` when empty. `columns.tsx:322`                                                                        |

Amounts are in **thousand pesos**, 2 decimal places (`formatNumber`,
`columns.tsx:8`). Missing amounts render `-`.

## Sheet visualization

Header has two levels — group row + leaf row — followed by a number row
(`1`–`15`) directly below the header, then data rows:

```
| A       | B                | C       | D     | E   | F        | G    | H    | I    | J   | K   | L     | M     | N     | O      |
| AIP Ref | PPA              | Impl.   | Schedule    | Expected | Fund | Amount (in thousand pesos)          | Climate Change | Typo-  |
| Code    | Description      | Office  | Start | End | Outputs  | Src  | PS   | MOOE | FE  | CO  | Total | Adapt | Mitig | logy   |
| 1       | 2                | 3       | 4     | 5   | 6        | 7    | 8    | 9    | 10  | 11  | 12    | 13    | 14    | 15     |
|---------|------------------|---------|-------|-----|----------|------|------|------|-----|-----|-------|-------|-------|--------|
| 1000-01 | Health Program   | MHO     | Jan-26| Dec-26| Served… | GF   | 0.00 | 500  | 0.00| 100 | 600   | 50.00 | 0.00  | A123   |
| 1000-01 |  ↳ Immunization  | MHO     | Jan-26| Jun-26| 500 kids| GF   | 0.00 | 200  | 0.00| 0.00| 200   | 20.00 | 0.00  | A123   |
| 2000-03 | Road Rehab       | MEO     | Mar-26| Nov-26| 2 km…   | SEF  | 0.00 | 0.00 | 0.00|1000 |1000   | 0.00  | 300   | M456   |
```

Notes:

- Row order: **header rows → number row (`1`–`15`, one per column A–O) →
  data rows**. The number row sits directly below the header and mirrors the
  `#` column in the map above.
- One **row per expected output × funding source**, grouped into PPA
  blocks: the same PPA repeats only as blank-continued rows, each carrying
  its own output amounts.
- Footer / signatory rows (`Prepared by:`, names, titles) are excluded by a
  sure-fire gate: a data row's col A must open with the office prefix
  (`SSSS-L-TT-OOO`, e.g. `1000-1-03-009`). Rows whose col A doesn't match
  are skipped, never imported (`hasAipRefCodePrefix`,
  `lib/aip-summary-import/ref-code.ts`).
- `Total` (col L) is **computed** (`ps + mooe + fe + co`) — the sheet may
  carry it for readability, but the importer must recompute, never trust it.
- `Schedule` dates are written `Mon-YY` — e.g. `Jan-27` means January 2027
  (`formatDate`, `columns.tsx:23`; PDF `formatScheduleDate`,
  `pdf-render/cols.tsx:14`). Two-digit year is `20YY`, month is the
  3-letter English abbreviation. Raw values may also be full dates
  (`YYYY-MM-DD`) — import should accept both and normalize to `YYYY-MM-DD`
  (day defaults to `01` when the file only gives month-year).
- `Implementing Office` holds one or more office acronyms separated by `/`
  (e.g. `PICTO/SDU`). A single nested office renders as `PARENT/CHILD`
  (`columns.tsx:112`); outputs with several offices join them (`" / "` in
  the app: `pdf-render/prepare-rows.ts:104-105`, `output-columns.tsx:39`).
  The importer must split on `/` and trim whitespace around each acronym.
- `Typology` is the CC typology **code** (not description).
- No category / COA / `- TOTAL` grouping rows here — unlike the PPMP sheets,
  this layout is flat. Hierarchy is shown via indent (`depth`), not via
  header/total rows.

## AIP Reference Code (col A)

Dash-separated segments. The first four are the office prefix
(`app/Models/Office.php:31-59`: `sector(4)-lgu(1)-officeType(2)-office(3)`);
each further segment is a PPA `code_suffix` left-padded with zeros to its
type width (`app/Models/Ppa.php:38-62`, widths in `config/ppa.php:4-10`).
A child's code is its parent's code plus one segment, so **segment count ⇒
type**, uniform across all rows:

| Type           | Suffix width | Total segments |
| -------------- | ------------ | -------------- |
| Program        | 3            | 5              |
| Project        | 3            | 6              |
| Activity       | 2            | 7              |
| Subactivity    | 1            | 8              |
| Subsubactivity | 1            | 9              |

Canonical shapes:

```
1000-1-03-009-001                 program
1000-1-03-009-002-001             project
1000-1-03-009-002-001-01          activity
1000-1-03-009-002-001-02-1        subactivity
1000-1-03-009-002-004-01-1-2      subsubactivity
```

Rules:

- Every level has a fixed width — all Programs use 3 digits, all Activities
  2, and so on. Non-padded or wrong-width suffixes are malformed.
- Hierarchy is identified from the code alone: start at the Program code,
  then each level appends its own suffix to its parent's code. Walking down:
  `1000-1-03-009-002` (program) → append `001` ⇒ project
  `1000-1-03-009-002-001` → append `01` ⇒ activity
  `1000-1-03-009-002-001-01` → append `1` ⇒ subactivity, and so on.
  Conversely, the parent of any row = its code minus the last segment, so
  the full ancestor chain is recoverable without extra columns.
- The Program segment embeds the office code, so a Program whose prefix
  doesn't match a known office is malformed.
- Strict cap: max depth is **Subsubactivity (9 segments)**. A code with
  **more than 9 segments is a verify error** — the importer must reject the
  row, never silently accept or truncate it.

## PPA Description numbering (col B)

Col B carries a hierarchical number prefix before the name, derived from
sibling order (`sort_order`) within each parent — same scheme in the table,
the PDF, and the Excel export
(`aip-summary/index.tsx:131-179` `sortFlatLikeTree`,
`pdf-render/prepare-rows.ts:198-205,237`,
`export-to-excel.ts:270-291`):

| Type           | Prefix shape | Example                                  |
| -------------- | ------------ | ---------------------------------------- |
| Program        | Letter       | `B. OPERATIONAL ACTIVITIES`              |
| Project        | `n.`         | `1. Information Systems (IS) Management` |
| Activity       | `n.n.`       | `1.1. Information Systems Maintenance…`  |
| Subactivity    | `n.n.n.`     | `1.1.1. …`                               |
| Subsubactivity | `n.n.n.n.`   | `1.1.1.1. …`                             |

Rules:

- Programs are lettered (`A.`, `B.`, …) in `sort_order`; below that, each
  level counts its position among its siblings, restarting at `1` under
  every parent.
- The prefix is **display-only, recomputed from tree position** — like the
  col L total, the importer must never trust it from the file. Type still
  comes from the col A segment count; the prefix is at most a
  cross-check (mismatched prefix shape vs code depth ⇒ verify error).
- Repeated funding-source rows for one PPA show the prefixed name once and
  leave it blank on continuation rows (same suppression as col A).

## Col A + col B in tandem

Both columns identify the same hierarchy position — col A by segment count,
col B by prefix shape — so they must agree on every row:

| Type           | Col A (segments)        | Col B (prefix) |
| -------------- | ----------------------- | -------------- |
| Program        | `1000-1-03-009-001` (5) | `A. …`         |
| Project        | `…-001` (6)             | `1. …`         |
| Activity       | `…-01` (7)              | `1.1. …`       |
| Subactivity    | `…-1` (8)               | `1.1.1. …`     |
| Subsubactivity | `…-2` (9)               | `1.1.1.1. …`   |

A row whose prefix shape doesn't match its code's segment count (e.g. a
6-segment code labelled `1.1. …`) is a verify error. Col A is the
authority for type; col B is the cross-check.

## Multiple expected outputs per PPA

A PPA can have more than one expected output. Each expected output carries
its own schedule, offices, funding source, amounts, and climate entries —
so one PPA spans a block of rows:

- Cols A–B (ref code + prefixed description) appear only on the first row
  of the block; continuation rows leave them blank.
- Cols C–O vary per row: offices (C), start/end (D–E), expected-output
  text (F), funding source (G), PS/MOOE/FE/CO (H–K), Total (L), CC
  adaptation/mitigation (M–N), typology (O).
- An output with more than one funding source spans further rows that
  differ in G–O.

Example — one PPA, two expected outputs, the first with two funding
sources:

| A (code)   | B (desc, prefixed) | C (office) | D–E (sched)   | F (output)         | G (fund) | H–O (amounts…) |
| ---------- | ------------------ | ---------- | ------------- | ------------------ | -------- | -------------- |
| 1000-…-001 | A. Health Program  | MHO        | Jan-26 Dec-26 | 500 kids immunized | GF       | 200 …          |
| (blank)    | (blank)            | MHO        | Jan-26 Dec-26 | 500 kids immunized | SEF      | 100 …          |
| (blank)    | (blank)            | MHO/SDU    | Mar-26 Nov-26 | 2 RHUs upgraded    | GF       | 1000 …         |

So the sheet's row grain is one row per expected output × funding source,
grouped into PPA blocks led by a single A–B row.

## Linked docs

- Import logic: `docs/aip-summary-import.md` (references this spec, owns the
  wizard pipeline — TBD).

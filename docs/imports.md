# Imports — file & sheet structure

Central hub: `/imports` (`ImportsController@index`, `resources/js/pages/imports/index.tsx`).
All importers accept **`.xlsx` only** (parsed with ExcelJS) and follow the same
wizard: **Upload & Sheets → Calibrate → Verify → Review/Extract → Import**.

## Order dependency

Run in this order — each step requires the previous one's data to exist:

1. **Category Import** (`/category-import`) — bulk-creates PPMP categories.
2. **Category–COA Mappings** (`/category-coa-mapping`) — links each category to a
   postable Chart of Account.
3. **Price List Import** (`/price-list-import`) — imports priced items. Every row
   must resolve to an existing Category + COA **mapping**, otherwise it errors
   with “create mapping via Category–COA Mappings first”.

## Shared sheet structure (all importers)

Category Import, Category–COA Mappings, and Price List Import all read the
**same sheet structure** — one format to learn. They differ only in which
columns they consume:

| Importer | E (item no.) | F (data) | D (COA) | G (unit) | H (price) |
| -------- | ------------ | -------- | ------- | -------- | --------- |
| Category Import | item-row intent + placeholder detection | category / description | COA hint | standard field, not consumed | standard field, not consumed |
| Category–COA Mappings | placeholder detection | category | COA | standard field, not consumed | standard field, not consumed |
| Price List Import | placeholder detection | description (category from enclosing group) | COA | unit | price |

> Exception: the AIP Summary importer (`/aip-summary-import`) uses its own
> column map (PPA, dates, expected output, funding source, PS/MOOE/FE/CO
> amounts) and is not covered by this section.

### Standard calibration

Identical in all three importers (`SharedSheetConfig` — one type, one
defaults function, same Calibrate screen). Applies per sheet; can be shared
across sheets or set per sheet in step 2.

| Setting        | Default | Meaning                                        |
| -------------- | ------- | ---------------------------------------------- |
| Category column| `F`     | Category headers, COA labels, descriptions, `TOTAL` rows |
| COA column     | `D`     | Per-item COA value (item rows have both D + F) |
| Unit column    | `G`     | Unit of measurement (consumed by price-list)   |
| Price column   | `H`     | Unit price, commas allowed (consumed by price-list) |
| Item no. column| `E`     | Item number — placeholder detection (see below) |
| Header row     | `7`     | 1-indexed data header row; rows above are ignored |
| COA label mode | `with-label` | COA names appear as label rows (see below) |
| COA match field| `account_title` | Match extracted COA against account titles (D always holds titles). Mappings exposes a dropdown to switch per sheet; the other two lock this default |

Additional-sections calibration (optional): **Additional Items header row** and
**Non-Procurement header row** mark where those sections start.

### Full column map (D → AH)

The complete PPMP sheet runs from COA at `D` to Dec amount at `AH`.
The importers currently consume `D`/`F`/`G`/`H`; the rest is documented here
for the full file contract.

| Col | Field | Used by importers |
| --- | ----- | ----------------- |
| `D` | COA | Yes — per-item COA value |
| `E` | Item no. | Placeholder detection (E+D+G+H all falsy → placeholder; E present marks an item row) |
| `F` | Description (also category headers, COA labels, `TOTAL` rows) | Yes — data column |
| `G` | Unit of measurement | Yes — price-list only |
| `H` | Price list (unit price, commas allowed) | Yes — price-list only |
| `I` | Total quantity (year) | No |
| `J` | Total amount (year) | No |
| `K`–`L` | Jan qty, Jan amount | No |
| `M`–`N` | Feb qty, Feb amount | No |
| `O`–`P` | Mar qty, Mar amount | No |
| `Q`–`R` | Apr qty, Apr amount | No |
| `S`–`T` | May qty, May amount | No |
| `U`–`V` | Jun qty, Jun amount | No |
| `W`–`X` | Jul qty, Jul amount | No |
| `Y`–`Z` | Aug qty, Aug amount | No |
| `AA`–`AB` | Sep qty, Sep amount | No |
| `AC`–`AD` | Oct qty, Oct amount | No |
| `AE`–`AF` | Nov qty, Nov amount | No |
| `AG`–`AH` | Dec qty, Dec amount | No |

> Layout check: 12 monthly qty/amount pairs = 24 columns (`K`–`AH`), preceded
> by the two year-total columns (`I` total quantity, `J` total amount).

### Sheet layout

Each sheet is divided into up to three sections: **procurement**,
**additional**, **non-procurement**. Sections are optional — a sheet may hold
only procurement, procurement + additional, or any combination. Leave a
section's header row uncalibrated and that section is simply skipped (no rows
expected there). Within a section rows are one of:

| Row kind       | Col D (COA)   | Col F (data)              | Notes |
| -------------- | ------------- | ------------------------- | ----- |
| Header         | —             | `description`             | Skipped automatically (case-insensitive) |
| Category       | empty         | `Office Supplies`         | Opens a group; must come before its items |
| COA label      | empty         | `Printers`                | `with-label` mode: next row's D must repeat it |
| Item           | `Printers`    | `Bond paper A4` (+G/H)    | The actual importable row |
| Total          | empty         | `Office Supplies - TOTAL` | Closes the category; name must match `<Category> - TOTAL` |

Example (`with-label`) — note the category holding **two** COA groups:

```
D (coa)       | F (data)                  | G (unit) | H (price)
              | Office Supplies           |          |
              | Printers                  |          |
Printers      | Bond paper A4             | ream     | 250
Printers      | Ballpoint pen             | pc       | 15
              | Inks                      |          |
Inks          | Printer ink black         | btl      | 850
              | Office Supplies - TOTAL   |          |
```

A category can hold **many COA groups** — just stack another COA label plus
its items before the single `- TOTAL` row that closes the category. A category
with zero COA groups is an error.

#### Format 2 — without COA label headers (`without-label`)

Same rows, except there are **no COA label rows**: every item carries its COA
directly in `D`, and each run of equal `D` values forms one COA group (a new
group starts wherever `D` changes).

```
D (coa)       | F (data)                  | G (unit) | H (price)
              | Office Supplies           |          |
Printers      | Bond paper A4             | ream     | 250
Printers      | Ballpoint pen             | pc       | 15
Inks          | Printer ink black         | btl      | 850
              | Office Supplies - TOTAL   |          |
```

Pick the format per sheet in Calibrate via **COA label mode**
(`with-label` default, or `without-label`); it can be shared across sheets or
set per sheet.

#### Additional / non-procurement items

Both sections work the same way: **just rows of items — no category headers,
no COA labels, no `- TOTAL` rows.** Every row carries its COA directly in `D`
(no category); all rows land in the section's Uncategorized bucket
(`Additional Items (Uncategorized)` / `Non-Procurement (Uncategorized)`).

```
D (coa)       | F (data)                  | G (unit) | H (price)
Printers      | Bond paper A4             | ream     | 250
Inks          | Printer ink black         | btl      | 850
```

A row with F but no `D` is a Verify error (`missing COA (D)`); F-only rows
with no values at all are ignored.

#### Placeholder rows (not pricelists)

Some rows are layout placeholders, not data. A row is a placeholder — and is
skipped, never imported — when **all** of these are falsy: `E` (item no.),
`D` (COA), `G` (unit of measurement), `H` (pricelist). Empty, `0`, `-`, and
`0.00` all count as falsy. Conversely, an item number in `E` marks the row as
an item row: in category-import, `E` + description without `D` is a Verify
error (item missing its COA) instead of becoming a category.

Rules enforced at Verify time:

- A category opened but never closed with `- TOTAL` is an error.
- An item before any category is an error (in `additional` / `non-procurement`
  it falls under `Additional Items (Uncategorized)` /
  `Non-Procurement (Uncategorized)` sentinels instead).
- In `with-label` mode an item whose D doesn't match the active COA label is an
  error unless implicit creation is on; in `without-label` mode each distinct D
  value starts a new COA group.
- Totals must read exactly `<Category> - TOTAL` (after normalization);
  mismatches and orphan totals are errors.

## Matching (Review step)

Extracted names are matched against existing records by **normalized** comparison
(trimmed, single-spaced, lowercased). COA matching uses the `account_title`
standard (column D always holds titles); only the mappings importer lets you
switch this per sheet:

- **Strict** (exact normalized equality) → auto-matched, importable.
- **Partial** (typo within a length-based threshold, or substring length ≥ 4) →
  top-3 suggestions shown with ★, ranked with COA paths under **`5-02` first,
  then any other `5-*`**, then the rest. A human must pick (per row, or once per
  extracted name via **batch match**, which applies one choice to every row
  sharing that extracted COA).
- **None** → must be created upstream first (category) or picked manually.

Short roots (`oil`, `gas`, `ink`, `lab`, `cop`, `car`, `med`, `law`) are allowed
as substring matches despite being under 4 chars.

Price-list rows additionally require: non-empty description (≤ 1000 chars),
unit (≤ 20 chars), price > 0, and an existing mapping for the resolved pair.
Matched-but-existing price lists are reported as **updates** (price changed)
instead of inserts.

## Normalization rule

**Normalize once at extraction; everything downstream uses normalized data.**
"Normalized" has exactly one definition (`lib/ppmp/normalize.ts`): trimmed,
single-spaced, lowercased.

- Extraction output carries both forms: raw strings plus `*Norm` fields
  (`categoryNorm`, `coaNorm`, `descriptionNorm`, `unitNorm`), stamped at
  extraction time.
- All downstream logic — grouping, dedupe keys, strict/partial matching,
  selection sets, batch-match groups, junction/upsert lookups — compares
  **normalized values only**. Never re-derive or compare raw strings in logic.
- Raw strings are **display and storage only**: UI labels, POST payloads, and
  database writes keep the human-typed form.
- Backend mirrors this: compare normalized, store display form.
- Scan loops (`groupSheet`, extract scans) normalize inline while scanning —
  that is the boundary, and still counts as "normalize first".

Anti-pattern (do not add new instances): page-local copies of `normalize` /
matching helpers. Category-import still carries its own today
(`category-import/index.tsx`, ~lines 32–194, identical to lib) — slated for
deletion in a later pass; until then the lib is the definition.

## Normalization process

The full pipeline every imported value travels, in order:

1. **Read** — `cellText()` pulls the cell value, unwrapping formula results,
   rich text, and hyperlinks, and trims it. Empty/`null` stays `null`.
2. **Normalize** — `normalize()` runs once per value (trim → collapse inner
   whitespace → lowercase). The extracted record keeps both: raw for display,
   `*Norm` for logic.
3. **Group** — rows are scanned with normalized comparisons only: section
   headers, `description` header skip, COA-label detection, `- TOTAL`
   matching, placeholder falsy checks (`0`, `-`, `0.00` count as empty).
4. **Dedupe** — raw rows collapse into unique items on normalized keys
   (`category|coa|description|unit`), keeping raw label + row count.
5. **Verify + match** — structure rules checked (see above); each normalized
   name matched against normalized DB values: strict → auto-matched,
   partial → top-3 ★ suggestions (`5-02` first), none → manual/upstream.
6. **Review** — human resolves partials (per-row override or one batch-match
   pick per normalized extracted name, applied to the whole group), then
   selects ready/update rows.
7. **Import** — POST sends raw display values; the backend re-normalizes for
   its dedupe/upsert decisions, stores the display form, and replies with the
   `inserted`/`skipped`/`updated`/`errors` report + toast.

## Backend behavior

| Importer | Endpoint | Result |
| -------- | -------- | ------ |
| Category | `POST /category-import` | Creates missing categories (`is_non_procurement=false`); strict-normalized dupes skipped (`inserted`/`skipped` report) |
| Mapping  | `POST /category-coa-mappings/bulk` | Creates missing pairs transactionally; existing pairs skipped |
| Price list | `POST /price-list-import` | Validates rows; requires the mapping junction; upserts on junction + normalized description + unit (`inserted`/`updated`/`errors` report) |

All three validate IDs against the database (`exists` rules), authorize via
policies (`create`), and reply with a toast (`success`/`error`, incl.
`partial_success` counts). Validation failures return 422 and import nothing.

## Code map

- Matching/grouping lib: `resources/js/lib/ppmp/normalize.ts`,
  `sheet-config.ts`, `sheet-grouping.ts`, `batch-match.ts`,
  `resources/js/lib/excel/cell-helpers.ts` (unit-tested with vitest).
- Pages: `resources/js/pages/{imports,category-import,category-coa-mapping,price-list-import}/`.
- Controllers: `app/Http/Controllers/{Imports,CategoryImport,CategoryCoaMapping,PriceListImport}Controller.php`.
- Routes: `routes/web.php` (`imports.*`, `category-import.*`, `category-coa-mappings.*`, `price-list-import.*`).

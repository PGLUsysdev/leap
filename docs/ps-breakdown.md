# PS Breakdown — Template Status (mock-data driven, pending personnel API)

> **Status**: TEMPORATE ONLY. Table shell + hardcoded calcs + mock personnel
> data. The numbers are not real until the personnel API lands and replaces
> `App\Services\MockPersonnelData`. See `docs/ps-coa-calcs.md` for the
> authoritative formulas and rates.

## What this page is

`GET /aip/{fiscalYear}/summary/{aipEntry}/ps-breakdown?ppa_funding_source_id=…`
shows one row per personnel position, with one dynamic column per active PS
chart of account. Opened from the AIP funding-sources dialog (PS Pool only).

The only database query this page makes is for the chart of accounts. Positions,
salary rates and the annual rate map are served from mock data.

## Data source

`ios`, `positions` and `salary_standards` are **deprecated** — they will be
removed once the personnel API (which supplies step and all personnel/job
fields) is available. Nothing in the application reads them.

`app/Services/MockPersonnelData.php` is the single source of truth for mock
personnel data, so the PS Breakdown table and the LBP Form 2 report cannot
disagree. **Swapping in the API should touch that one file only**; no caller
needs to change.

| Accessor            | Returns                           | Shape                                                                                                                                                                                |
| ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `positions()`       | 8 positions                       | `id`, `office_id`, `item_number`, `employment_type`, `is_funded`, `status`, nested `ios` (`id`, `class`, `class_id`, `salary_grade`), nested `user` (`id`, `name`, `step`) or `null` |
| `rates()`           | 11 statutory rates                | keyed as `PsRate::rate_key`                                                                                                                                                          |
| `annualRateMap()`   | `position id → {current, budget}` | `budget` = authorized monthly rate × 12                                                                                                                                              |
| `monthsOfService()` | empty                             | positions absent from this map are budgeted for a full year                                                                                                                          |

Mock composition: 8 positions, SG 1–24, 6 permanent / 1 casual / 1 contractual,
6 occupied / 2 vacant, 6 with a named incumbent. All 16 computed COAs resolve to
non-zero totals; grand total ₱5,357,519.16.

## Current wiring

| Piece              | File                                        | State                                                                                                                                    |
| ------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Page shell + props | `resources/js/pages/ps-breakdown/index.tsx` | Receives `positions` / `rates` / `annualRateMap` / `monthsOfService` as Inertia props                                                    |
| Mock dataset       | `app/Services/MockPersonnelData.php`        | Server-side; see above                                                                                                                   |
| Dynamic columns    | `columns/ps-breakdown-cols.tsx`             | `coas.filter(expense_class === 'PS')` → one col per PS COA                                                                               |
| Cell formulas      | `resources/js/lib/ps-calculations.ts`       | Hardcoded switch on `coa.path` (note: `account_number` holds only the last segment, e.g. `010`; full code is `path`, e.g. `5-01-01-010`) |
| Backend totals     | `PsBreakdownController::computePsCoaTotals` | Mirrors the frontend switch; feeds the LBP Form 2 report                                                                                 |
| Column source      | `PsBreakdownController@index`               | `chart_of_accounts` where `expense_class='PS'` + `is_active`, ordered by `path`                                                          |
| Prop source        | `PsBreakdownController@index`               | `MockPersonnelData::*`                                                                                                                   |

Footer = per-column sum. Cells without a deterministic rule render `-`.

`computePsCoaTotals` reads positions as **plain arrays** (`$pos['ios']['salary_grade']`),
not Eloquent models, so it works against both mock arrays and future API
payloads. Keep it that way — a property access like `$pos->ios?->salary_grade`
is a lazy relation load and returns `null` on an array.

## Formula coverage (hardcoded)

Computed (16): salaries regular (010), salaries casual/contractual (020), PERA,
RA (020), TA (030), clothing (₱8,000), laundry, PEI, hazard (SG-banded), YEB
(= 1-mo pay), cash gift, `5-01-02-990` (= 1-mo pay), GSIS 12%, Pag-IBIG 2%
(MFS ₱10k), PhilHealth 2.5% (floor/ceiling), ECIP (`min(1%, ₱1,200)`).

Dashes (11): subsistence, quarters, overseas, honoraria, longevity,
overtime/NSD, provident, and all `5-01-04-*` (pension / retirement gratuity /
terminal leave / other personnel benefits).

Eligibility: abolished/unfunded posts compute nothing; flat person-benefits
require `occupied`; salaries + salary-derived cover all other posts.

### Casual and contractual proration

`5-01-01-020` uses the daily-rate formula rather than a flat annual figure:

```
Daily Wage Rate = Authorized Monthly Salary / 22 days
Actual Pay     = Daily Wage Rate * Days Actually Worked
```

Months of service are clamped to 1–12 and default to 12, so a full-year
casual still receives `monthly × 12`. Proration only bites once
`monthsOfService` carries real figures — currently it is empty, so the formula
is inert by design. Threaded through
`getCellNumericValue → getPsBreakdownCols → PsBreakdown`.

Covered by `resources/js/lib/ps-calculations.test.ts` and the backend proration
test in `tests/Feature/PsBreakdownTest.php`.

## Other consumers of these totals

`PsBreakdownController::computePsCoaTotalsForOffice` is also called by
`FiscalYearController@index`, which builds the `lbp2` prop for the **LBP Form 2
report on the AIP page**. Only the PS section of that report is affected;
MOOE, CO and FE come from PPMP lines and are untouched.

`recalculateOfficePsAmounts → syncPoolPsAmount` writes the pool's `ps_amount`
onto the GF Proper funding source. It now sources from the mock too. Its only
callers are in `PositionController`, whose routes are disabled.

> **LBP Form 2 lives only in the AIP page** (`resources/js/pages/aip/pdf-render/lbp-form-2/`).
> A duplicate 1,098-line renderer that existed on this page has been deleted.

## When the personnel API lands

1. Replace the bodies of `MockPersonnelData::*` with API data. Keep the return
   shapes — `index()` and `computePsCoaTotalsForOffice` both consume them.
2. Remove the "Mock data — temporary" badge in `index.tsx`.
3. Re-check totals: every salary-derived cell scales with the real step.
4. Consider populating `monthsOfService` so casual/contractual proration applies.
5. Drop the `ios`, `positions`, `salary_standards` and `ps_rates` tables (see below).

## Known issues

### Wrongly grants money

These inflate live `ps_amount` and LBP Form 2 figures. Each needs a PGLU
ordinance or rate decision, not just a code change:

- **`5-01-02-990`** grants 1 month basic pay to every budgeted post, but
  `docs/ps-coa-calcs.md` classifies it **Optional** (PBB / CNA incentive).
- **`5-01-02-080` (PEI)** auto-grants ₱5,000 to every occupied post; the doc
  says Optional and requires a Sangguninian ordinance.
- **RA/TA rates are fabricated.** The SG bands (`rata_sg_24_above` = ₱4,000,
  `rata_sg_16_23` = ₱2,000, `ta_sg_24_above` = ₱2,000, `ta_sg_16_23` = ₱1,000)
  appear nowhere in the doc, which specifies **LBC No. 157 Annex B** — varying
  by _rank and LGU income class_, not salary grade.
- **RA/TA exclude contractual officials** (gated on `employment_type ===
'permanent'`), though LBC No. 157 covers officials regardless of plantilla
  status.
- **Hazard pay is granted to every occupied post**; the doc scopes it to Public
  Health Workers under RA 7305. No PHW flag exists in the data.

### Coverage gap

6 of the 11 unimplemented accounts are **Mandatory** per the doc's Part V
classification, while 2 of the 7 _optional_ accounts are auto-granted:

- Mandatory, unimplemented: subsistence (`050`), overseas (`090`),
  overtime/NSD (`130`), pension (`5-01-04-010`), retirement gratuity (`020`),
  terminal leave (`030`)
- Genuinely optional: quarters, honoraria, longevity, provident, other
  personnel benefits

Most need per-position data the API may or may not carry (days worked, leave
credits, service years, post index, PHW designation).

### Orphaned tables

These are no longer read by any application code:

| Table                | Note                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ps_rates`           | 18 rows. Superseded by `MockPersonnelData::rates()`. `PsRate` model and `PsRateSeeder` remain but have no callers             |
| `fe_breakdown_items` | Already had **zero** code references before this work — no model, controller or route                                         |
| `ps_breakdown_items` | 0 rows. Its `store` / `destroy` / `recalculate` methods and routes were deleted; still holds the `position_id → positions` FK |

### Not verified

The page has not been exercised in a browser. All checks to date are static
analysis plus the Pest and Vitest suites.

## Removed (this refactor)

- `pdf-preview-dialog.tsx` — duplicate LBP Form 2 renderer (1,098 lines)
- `form-dialog.tsx` — never imported (170 lines)
- `columns/coa-cols.tsx` — never imported, stale 13-case switch (162 lines)
- `mock-data.ts` — moved server-side to `MockPersonnelData`
- `store()` / `destroy()` / `recalculate()` and their routes — the manual
  per-position override path. It read `is_manual` off `chart_of_accounts`,
  where no such column exists, and wrote `plantilla_position_id` against a
  `position_id` column, so it would have thrown on any write.
- `ps-breakdown.export` permission and `PsBreakdownItemPolicy::export()` — the
  permission existed in the database but not in `PermissionSeeder`, so it
  vanished on `migrate:fresh --seed`.

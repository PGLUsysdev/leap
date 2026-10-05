# PS Breakdown — Template Status (placeholder while tranches API is pending)

> **Status**: TEMPLATE ONLY. Table shell + hardcoded calcs + mock data.
> Nothing here is final until the salary tranches API lands and provides
> per-position `step`. See `docs/ps-coa-calcs.md` for the authoritative
> formulas and rates.

## What this page is

`GET /aip/{fiscalYear}/summary/{aipEntry}/ps-breakdown?ppa_funding_source_id=…`
shows one row per position in the funding source's office, with one dynamic
column per active PS chart of account. Opened from the AIP funding-sources
dialog (PS Pool only).

## Current wiring (temporary)

| Piece | File | State |
|---|---|---|
| Page shell + props | `resources/js/pages/ps-breakdown/index.tsx` | `USE_MOCK = true` → renders mock positions/rates/annualRateMap; `chartOfAccounts` still live from DB |
| Mock dataset | `resources/js/pages/ps-breakdown/mock-data.ts` | 8 hardcoded positions (SG 1–24, permanent/casual/contractual, occupied/vacant), mock rates, mock annual rates |
| Dynamic columns | `columns/ps-breakdown-cols.tsx` | `coas.filter(expense_class === 'PS')` → one col per PS COA |
| Cell formulas | `resources/js/lib/ps-calculations.ts` | Hardcoded switch on `coa.path` (note: `account_number` holds only the last segment, e.g. `010`; full code is `path`, e.g. `5-01-01-010`) |
| Backend totals | `PsBreakdownController::computePsCoaTotals` | Mirrors the frontend switch; feeds pool-amount sync |
| Column source | `PsBreakdownController@index` | `chart_of_accounts` where `expense_class='PS'` + `is_active`, ordered by `path` |

Footer = per-column sum. Cells without a deterministic rule render `-`.

## Formula coverage (hardcoded)

Computed: salaries (010/020), PERA, RA/TA (SG-banded RATA placeholder),
clothing (₱8,000), laundry, PEI, hazard (SG-banded), YEB (= 1-mo pay),
cash gift, 990 placeholder (= 1-mo pay), GSIS 12%, Pag-IBIG 2% (MFS ₱10k),
PhilHealth 2.5% (floor/ceiling), ECIP (`min(1%, ₱1,200)`).

Dashes (need data or manual input): subsistence, quarters, overseas,
honoraria, longevity, overtime/NSD, provident, all `5-01-04-*`
(pension/gratuity/terminal-leave/AIG).

Eligibility: abolished/unfunded posts compute nothing; flat person-benefits
require `occupied`; salaries + salary-derived cover all other posts.

## Blocked on tranches API

`annualRateMap` (monthly rate × 12 per position) is currently built with
`step = 1` for everyone (`$pos->user?->step` is dead — no `user()` relation,
no `step` column). When the tranches API is ready:

1. Wire real `step` per position → `salary_standards` lookup
   (`fiscal_year × salary_grade × step_increment`) in
   `PsBreakdownController@index` (and `computePsCoaTotalsForOffice`,
   `recalculate`).
2. Set `USE_MOCK = false` in `index.tsx` and delete `mock-data.ts`.
3. Re-check totals: every salary-derived cell scales with step.

## Known issues (pre-existing, not touched)

- `store()` writes `plantilla_position_id` but the migration column is
  `position_id` (also missing from fillable) — per-position manual
  persistence is broken; its routes are commented out in `web.php`.
- `resources/js/pages/ps-breakdown/columns/coa-cols.tsx` is unused.
- `form-dialog.tsx` / `pdf-preview-dialog.tsx` still reference the old
  calc shape; PDF preview reuses `getCellNumericValue`, so it follows
  the hardcoded rules automatically.

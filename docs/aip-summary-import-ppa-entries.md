# AIP Summary PPA Import — Automatic AIP Entry Creation

> Implementation plan. Status: **implemented 2026-09-09** (`store()` creates
> bare entries on insert + heals on re-import; Pest-covered).
>
> Parent doc: `docs/aip-summary-import.md` (pipeline). Sheet spec:
> `docs/aip-summary-file-structure.md`.

## 1. Invariant

Importing an AIP summary `.xlsx` guarantees **every PPA block in the file
ends up with an `aip_entries` row**. The file _is_ an AIP summary, so file
membership ⇔ entry existence.

- Entries created this way are **bare headers**: no outputs, no schedules,
  no offices. Roots/parents are structural containers; their scope is
  defined by their children's outputs.
- Entries are **not** outputs. "Root has no expected output" is valid;
  "root has no entry" is what broke `/aip/4/summary` (empty page with 92
  child entries present — the tree walk seeds from root entries only).

## 2. Current behavior (as of 2026-09-09)

- `POST aip-summary-import` (`AipSummaryImportController@store`) creates
  **PPAs only** — zero entries. Frontend posts `new` blocks scoped to the
  selected office + fiscal year; duplicates skip (`skipped: exists`).
- Entries come solely from `POST aip-summary-import/outputs`
  (`storeOutputs`): `firstOrCreate` per matched PPA **plus bare ancestor
  entries** up the `parent_id` chain.
- Gap: a PPA gets an entry iff it (or a descendant) ships importable
  content. A pure-hierarchy PPA with no imported descendants stays
  entry-less permanently. Rendering survives via orphan-append
  (`lib/aip-summary/sort-tree.ts`), but the DB-level invariant above does
  not hold.

## 3. Change

In `store()`, inside the existing transaction, after each block's PPA is
resolved (inserted **or** matched as existing):

```php
$entry = AipEntry::firstOrCreate(['ppa_id' => $ppa->id]);
```

- Runs for **both** paths so re-imports heal entries that were never
  created (idempotent — no duplicates by construction).
- Add `'entry_id' => $entry->id` to the inserted `importReport` details
  for auditability.
- Nothing else changes: parents-first sort, sibling `sort_order` /
  `code_suffix`, dedupe keys, flash/toast shape, frontend step-5 UX.

`storeOutputs` ancestor logic stays untouched (redundant-but-harmless
safety net); its per-entry `aip-summary.edit` authorization still guards
all real content writes.

## 4. Authorization (decision: fold under `ppa.create`)

Entry creation rides on the existing `Gate::authorize('create', Ppa::class)`
in `store()`. Rationale:

- The entries are empty structural rows produced by the same licensed
  import action — not user-authored content.
- Any real content (outputs, funds) landing later is independently
  re-authorized per entry (`AipEntryPolicy@update`, `aip-summary.edit` +
  office scope).
- Alternative (rejected): additionally requiring `aip-summary.edit` in
  `store()` — would 403 PPA-import roles that work today unless seeders
  change. Revisit only if bare-entry creation ever needs tighter control.

## 5. Scope boundaries (deliberately out)

- No frontend changes (counts, badges, payloads unchanged).
- No backfill of other offices' entry-less PPAs in this change (OPG/FY27
  is whole at 110/110; audit other offices separately if needed).
- No change to `aip-summary.show.own` scoping, fiscal-year binding, or the
  orphan-append renderer (defense in depth, stays).

## 6. Tests

Pest (`tests/Feature/AipSummaryImportTest.php`):

1. Parent + child PPA import asserts **both PPAs and both entries**
   exist, entries bare (0 outputs), child entry's PPA parented correctly.
2. Re-import asserts stable counts (no duplicate PPAs **or** entries;
   `skipped: exists` preserved, entry healed if previously missing —
   cover by deleting one entry between posts and asserting recreation).
3. Full existing suite (12 tests) stays green — entry creation is purely
   additive to asserted PPA counts.

## 7. Verification checklist

- [ ] `vendor/bin/pest tests/Feature/AipSummaryImportTest.php` green
- [ ] `vendor/bin/pint --dirty` clean
- [ ] `tsc` scope clean (no frontend changes expected)
- [ ] Real import: read-only DB check — entry coverage = 100% of
      imported blocks; `/aip/{fy}/summary` renders the full tree

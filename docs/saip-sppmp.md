# SAIP & SPPMP Logic Documentation

## Flow 1: AIP Page → AIP Summary → SAIP Lifecycle

### Step 1: AIP Landing Page

**Route:** `GET /aip` → `FiscalYearController::index` → renders `resources/js/pages/aip/index.tsx`

**Backend** (`app/Http/Controllers/FiscalYearController.php:20-28`):
- Fetches all fiscal years ordered by year ascending
- Detects if user is control office (`office_id === 2` or `role === 'admin'`)
- Passes `fiscalYears`, `offices`, and `app` (for PDF generation) to Inertia

**Frontend** (`resources/js/pages/aip/index.tsx`):
- Renders a `DataTable` listing all fiscal years
- Columns: Year, Status, Created At, Updated At, Actions
- **Open AIP action** → calls `handleOpenAipSummary(data)` → `router.get('/aip/{id}/summary')`
- Other actions: Change status, Generate PDF, Open PPMP Summary

### Step 2: Navigate to AIP Summary

**Route:** `GET /aip/{fiscalYear}/summary?scope=original` → `AipEntryController::index` → renders `resources/js/pages/aip-summary/index.tsx`

**Backend** (`app/Http/Controllers/AipEntryController.php:25-163`):

| Step | What happens |
|------|-------------|
| 1 | Reads `scope` query param (defaults to `'original'`) and `supplemental_aip_id` |
| 2 | Builds closure `$fundingSourceFilter` — scopes `ppa_funding_sources` by `supplemental_aip_id` |
| 3 | Builds closure `$aipEntryFilter` — scopes `aip_entries` the same way |
| 4 | Builds `$onlyAipItems` — scopes child PPA queries to only include those with AIP entries in the current scope |
| 5 | Queries root-level PPAs (`WHERE parent_id IS NULL`) filtered by office hierarchy, fiscal year, and scope |
| 6 | Eager-loads `office`, `aipEntries` with funding sources, and 3 levels of children |
| 7 | Passes `supplementalAips` — all SAIPs for this fiscal year + office |
| 8 | Passes `currentScope` — reflects the active tab's scope + SAIP ID |
| 9 | Lazy-loads `dialogPpaTree` — the PPA library navigator for importing items |

**Scope filtering applied to all queries:**

| Scope | SQL condition |
|-------|--------------|
| `original` | `WHERE supplemental_aip_id IS NULL` |
| `supplemental` with `saipId` | `WHERE supplemental_aip_id = {saipId}` |
| `combined` | No filter — loads all entries; merging happens on frontend |

### Step 3: Tab UI & SAIP Lifecycle

**Frontend** (`resources/js/pages/aip-summary/index.tsx`):

**Tab Structure** (lines 392-431):

| Tab value | Label | Scope | Visible |
|-----------|-------|-------|---------|
| `"original"` | "Original Plan" | `scope=original` | Always |
| `"saip-{id}"` | "Supplemental AIP No. X" | `scope=supplemental` | Per SAIP created |
| `"combined"` | "Combined View" | `scope=combined` | Always |

**Tab switching** → `handleScopeChange(newScope, newSaipId?)` (lines 238-251):
```ts
router.get('/aip/{fiscalYear}/summary', {
    scope: newScope,
    supplemental_aip_id: newSaipId || undefined
}, { preserveState: true, preserveScroll: true })
```

**Create SAIP** (lines 253-272):

**Step 1 — Confirmation dialog opens:**
`handleCreateSaip()` (line 253) sets `isCreateSaipDialogOpen = true`, showing the AlertDialog (lines 594-618) with title "Create Supplemental AIP?" and description "Are you sure you want to create a new Supplemental Annual Investment Program (SAIP) for this office and fiscal year?"

**Step 2 — User clicks "Create":**
`handleCreateSaipConfirm()` (lines 257-272) fires:
```ts
router.post('/supplemental-aips', {
    fiscal_year_id: fiscalYear.id,
}, { preserveScroll: true })
```

**Step 3 — Backend `SupplementalAipController::store` (lines 11-40):**
1. Validates `fiscal_year_id` (required) and `office_id` (nullable)
2. Gets the user's `office_id` (default)
3. **Admin/control-office check** — if user is `admin` or `office_id === 2` and an `office_id` was sent in the request, overrides to the requested office. Since the frontend **doesn't send** `office_id`, this branch is skipped — the SAIP is always created for the user's own office.
4. Counts existing SAIPs: `SELECT COUNT(*) FROM supplemental_aips WHERE fiscal_year_id = ? AND office_id = ?`
5. Names it `"Supplemental AIP No. {count + 1}"`
6. Creates the record:
   ```sql
   INSERT INTO supplemental_aips (fiscal_year_id, office_id, name, created_at, updated_at)
   VALUES (?, ?, 'Supplemental AIP No. 1', NOW(), NOW())
   ```
7. Redirects back with `success: "Supplemental AIP No. X created successfully."`

**Step 4 — Page re-renders:**
The Inertia response re-renders `aip-summary/index.tsx` with the updated `supplementalAips` prop (now includes the new SAIP). The tab list at lines 414-422 maps over `supplementalAips` and renders a new `<TabsTrigger>` for the SAIP, appearing between "Original Plan" and "Combined View". The active tab stays on "Original Plan" — it does **not** auto-navigate to the new SAIP.

**Delete SAIP** (lines 274-291):

**Step 1 — Confirmation dialog opens:**
`handleDeleteSaip()` (line 274) sets `isDeleteSaipDialogOpen = true`, showing an AlertDialog (lines 620-645) with title "Delete Supplemental AIP?" and description warning that all associated PPAs, funding allocations, and SPPMP items will be permanently deleted.

**Step 2 — User clicks "Delete":**
`handleDeleteSaipConfirm()` (lines 278-291):
```ts
router.delete(`/supplemental-aips/${currentScope.supplemental_aip_id}`, {
    preserveScroll: true,
    onSuccess: () => handleScopeChange('original')
})
```

**Step 3 — Backend `SupplementalAipController::destroy`** (lines 42-63):

Runs in a single DB transaction:

| Order | Action | SQL effect | Deletes what |
|-------|--------|------------|--------------|
| a | Get funding source IDs | `SELECT id FROM ppa_funding_sources WHERE supplemental_aip_id = ?` | — |
| b | Delete PPMPs | `DELETE FROM ppmps WHERE ppa_funding_source_id IN (?)` | All SPPMP items created under this SAIP's funding sources |
| c | Delete funding sources | `DELETE FROM ppa_funding_sources WHERE supplemental_aip_id = ?` | All funding allocations made for this SAIP |
| d | Delete AIP entries | `DELETE FROM aip_entries WHERE supplemental_aip_id = ?` | All AIP entries created when importing PPAs into this SAIP |
| e | Delete PPAs | `DELETE FROM ppas WHERE supplemental_aip_id = ?` | **Nothing currently** — see note below |
| f | Delete SAIP | `DELETE FROM supplemental_aips WHERE id = ?` | The SAIP record itself |

**Step 4 — Redirect back:**
On success → navigates to `scope=original`. Page reloads, the deleted SAIP's tab is gone.

**What's actually deleted today:**
- ✅ All **SPPMP items** created under this SAIP's funding sources
- ✅ All **funding allocations** (`ppa_funding_sources`) made for this SAIP
- ✅ All **AIP entries** created when importing PPAs into this SAIP
- ✅ The **SAIP record** itself

**What survives:**
- ✅ The original AIP entries for the same PPAs — completely untouched
- ✅ The original funding allocations — untouched
- ✅ The **PPA library records** — untouched (see note below)
- ✅ Any PPMP items under the original AIP's funding sources — untouched

**Note on `$supplementalAip->ppas()->delete()` (line 56):**

This runs `DELETE FROM ppas WHERE supplemental_aip_id = ?`. Currently **no code path ever sets** `supplemental_aip_id` on PPA records — the `import()` flow only creates AIP entries, never touches the PPA. So this line is **dead code today** and deletes nothing.

It exists for a **future flow**: when a user creates a brand-new PPA *directly within a SAIP* (not importing an existing library PPA), that PPA would be tagged with `supplemental_aip_id = {saipId}` and should be deleted when the SAIP is destroyed since it doesn't exist anywhere else. This is **not a bug** — it's correct behavior for that future flow.

### Data Model Relationships

```
SupplementalAip
  ├── ppas()              → HasMany(Ppa, 'supplemental_aip_id')
  ├── aipEntries()        → HasMany(AipEntry, 'supplemental_aip_id')
  └── ppaFundingSources() → HasMany(PpaFundingSource, 'supplemental_aip_id')
```

**Scope filtering across 3 tables:**

| Table | Original | Supplemental |
|-------|----------|-------------|
| `ppas` | `supplemental_aip_id IS NULL` | `supplemental_aip_id = {saipId}` |
| `aip_entries` | `supplemental_aip_id IS NULL` | `supplemental_aip_id = {saipId}` |
| `ppa_funding_sources` | `supplemental_aip_id IS NULL` | `supplemental_aip_id = {saipId}` |

### Known Issues

**Issue #1 — Hardcoded office_id `=== 2`:**
`SupplementalAipController::store()` line 22 hardcodes office ID 2 for control-office override. Fragile across environments.

**Issue #2 — No DB unique constraint on `aip_entries(ppa_id, supplemental_aip_id)`:**
The migration adds uniqueness on `ppa_funding_sources` but not on `aip_entries`. The `firstOrCreate` in `import()` provides runtime protection but no DB-level enforcement against race conditions.

---

## Flow 2: Importing PPAs into a SAIP

### Overview

When on a SAIP tab, the user clicks "Import from Library" to select PPAs from the library and link them to the SAIP. This creates new **AIP entries** scoped to the SAIP — the original AIP entries for the same PPAs are untouched.

### Step 1 — "Import from Library" button is clicked

Only rendered when `currentScope.scope !== 'combined'` (line 517 of `aip-summary/index.tsx`). On a SAIP tab, it's visible.

### Step 2 — `handleImportLibrary()` fires (lines 293-314)

```ts
router.get('/aip/{fiscalYear}/summary', {
    ...filters,
    scope: currentScope.scope,             // "supplemental"
    supplemental_aip_id: currentScope.supplemental_aip_id,  // the SAIP ID
    dialog_id: null,                       // start at root
    dialog_boundary_id: null,
    dialog_page: 1,
}, {
    preserveState: true,
    preserveScroll: true,
    only: ['dialogPpaTree', 'dialogCurrent', 'filters'],  // partial reload
    onSuccess: () => setIsSelectorOpen(true),
})
```

This is a **partial Inertia reload** — only `dialogPpaTree`, `dialogCurrent`, and `filters` are fetched from the backend.

### Step 3 — Backend lazy-loads `dialogPpaTree` (lines 109-154)

The `dialogPpaTree` lazy prop runs this query:

```php
Ppa::whereIn('office_id', $officeIds)
    ->where('fiscal_year_id', $yearId)
    ->where('parent_id', $targetParentId)  // null = root level
    ->where(function ($q) use ($scope, $saipId) {
        if ($scope === 'supplemental' && $saipId) {
            $q->whereNull('supplemental_aip_id')        // all library PPAs
              ->orWhere('supplemental_aip_id', $saipId); // + any created for this SAIP
        }
    })
    ->orderBy('sort_order')
    ->withCount('children')
    ->paginate(50)
```

**Behavior in supplemental scope:** Shows all PPAs from the library (`supplemental_aip_id IS NULL`) plus any PPAs specifically created for this SAIP. The full library is available for selection.

### Step 4 — Import dialog renders (`PpaSelectorDialog`)

**File:** `resources/js/pages/aip-summary/ppa-selector-dialog.tsx`

**Props received:**

| Prop | Value |
|------|-------|
| `dialogPpaTree` | Paginated PPA tree from backend |
| `dialogCurrent` | Breadcrumb ancestors for navigation |
| `existingPpaIds` | PPA IDs **already in this SAIP** (computed from the scoped `aipEntries` prop) |
| `supplementalAipId` | The current SAIP's ID |

**Key prop derivation at line 534:**
```tsx
existingPpaIds={Array.from(existingPpaIds(aipEntries))}
```

The `aipEntries` prop is already scoped by the backend to only contain the current SAIP's entries, so `existingPpaIds` only flags PPAs already imported into this SAIP — not the original AIP.

**Selection logic — `handleToggle` (lines 96-126):**
- **Upward selection when toggling ON:** The selected PPA + its ancestors from `dialogCurrent` (breadcrumbs) are auto-added to the selection set (unless already existing in this SAIP)
- **Downward unselection when toggling OFF:** The deselected PPA + all its descendants (found recursively) are removed from the selection set

Already-imported PPAs show as disabled (`_isAdded` flag from `existingIdsSet`).

### Step 5 — User clicks "Import Selected"

`handleImport()` (lines 177-193) sends:
```ts
router.post('/aip/{fiscalYearId}/import', {
    ppa_ids: Array.from(selectedItems.keys()),  // includes ancestors
    supplemental_aip_id: supplementalAipId,
})
```

### Step 6 — Backend `AipEntryController::import()` (lines 214-245)

**Route:** `POST /aip/{fiscalYear}/import`

**Validation** (lines 216-219):
- `ppa_ids` — required array, each must exist in `ppas` table
- `supplemental_aip_id` — nullable, must exist in `supplemental_aips` table if provided

**Transaction** (lines 224-238) — for each PPA ID:

```php
AipEntry::firstOrCreate(
    [
        'ppa_id' => $ppaId,
        'supplemental_aip_id' => $saipId,    // the SAIP's ID (non-null)
    ],
    [
        'start_date' => $fiscalYear->year . '-01-01',
        'end_date' => $fiscalYear->year . '-12-31',
        'expected_output' => 'To be defined.',
        'is_supplemental' => true,
    ],
);
```

This inserts a row into `aip_entries`:

| Column | Value |
|--------|-------|
| `ppa_id` | The selected PPA's ID |
| `supplemental_aip_id` | The SAIP's ID |
| `is_supplemental` | `1` (true) |
| `start_date` | `{year}-01-01` |
| `end_date` | `{year}-12-31` |
| `expected_output` | `'To be defined.'` |

The PPA record itself is **not modified** — its `supplemental_aip_id` stays `null`. Only the AIP entry row carries the SAIP linkage.

**Funding sources are NOT imported.** The `import()` method only creates an `AipEntry` row — no `PpaFundingSource` records are inserted. The SAIP entry starts with **zero allocations** (no PS, MOOE, FE, CO amounts). Funding sources must be added separately through the edit dialog.

| Data created during import | Data NOT created |
|---------------------------|------------------|
| `aip_entries` row | `ppa_funding_sources` rows |
| Link to PPA (`ppa_id`) | PS / MOOE / FE / CO amounts |
| SAIP linkage (`supplemental_aip_id`) | CCET adaptation / mitigation |
| Default dates & output | Any funding allocation |

This is because `ppa_funding_sources` rows are also scoped by `supplemental_aip_id` — they're created independently when the user opens the edit dialog and adds funding sources for the SAIP entry.

### Step 7 — Redirect back

- `onSuccess` → `selectedItems` cleared, dialog closed (lines 187-189)
- Page reloads — the SAIP-scoped `aipEntries` now includes the newly imported PPAs
- The table under the SAIP tab shows the new entries with their default values

### Key Design Principle: SAIP Entries Are Independent Records

The same PPA can have **separate AIP entries** for original and each SAIP:

```
ppa_library: { id: 42, name: "Project Alpha", ... }
                    │
        ┌───────────┴───────────┐
        │                       │
  aip_entry (original)    aip_entry (SAIP #1)
  ├─ supplemental_aip_id: NULL  ├─ supplemental_aip_id: 1
  ├─ is_supplemental: false      ├─ is_supplemental: true
  ├─ expected_output: "X"        ├─ expected_output: "Y"     ← independent
  ├─ start_date: 2027-01-01      ├─ start_date: 2027-06-01   ← independent
  └─ end_date: 2027-12-31        └─ end_date: 2027-12-31     ← independent
```

Edits to the SAIP entry (output, dates, funding sources) via `AipEntryController::update()` (line 266) affect **only that specific AipEntry row**. The original entry's fields are completely isolated.

### Ancestor Auto-Selection Caveat

When a user selects a child PPA in the dialog, `handleToggle` (lines 113-122) also auto-selects all ancestors from the breadcrumb trail (`dialogCurrent`). These ancestor PPAs are included in the `ppa_ids` sent to the import endpoint. This means:

- For a selected child, its parent, grandparent, etc. also get AIP entries created in the SAIP
- `firstOrCreate` prevents duplicates if an ancestor was already imported
- This is intentional — it ensures the tree structure is preserved in the SAIP

## PPMP Structure & Grouping

### How PPMP items are organized

PPMP items are **not** created directly on a PPA. They are created on a **ppa_funding_source + expense_class** combination within a PPA. This is the fundamental grouping unit.

### The hierarchy

```
PPA (e.g. "Manpower Services")
  │
  └── PpaFundingSource (e.g. "GF Proper")
        │
        ├── Expense Class: MOOE
        │     ├── PPMP Item 1 (e.g. "Office Supplies" from price list)
        │     ├── PPMP Item 2 (e.g. "Printing Services")
        │     └── PPMP Item 3 (e.g. "Training Expenses")
        │
        └── Expense Class: CO
              ├── PPMP Item 1 (e.g. "Laptop")
              └── PPMP Item 2 (e.g. "Office Furniture")
```

### Why this grouping

In the **PPMP page** (`resources/js/pages/ppmp/index.tsx`), the user selects:

1. **Expense Class** (MOOE or CO) — via dropdown at line 431-444
2. **Funding Source** (e.g. GF Proper) — via dropdown at line 447-488

These two selections filter which PPMP items are displayed. Each `Ppmp` record is tied to a `ppa_funding_source_id`, and its expense class comes from the associated `PpmpPriceList → ChartOfAccountPpmpCategory → ChartOfAccount.expense_class`.

### Concrete example

For PPA "Manpower Services" with funding source "GF Proper":

| PpaFundingSource row | Expense Class | PPMP items possible |
|---------------------|---------------|-------------------|
| `ppa_funding_sources.id = 5` (MOOE allocation) | MOOE | Any MOOE-class price list items added |
| `ppa_funding_sources.id = 5` (CO allocation) | CO | Any CO-class price list items added |

Note: A single `ppa_funding_source` row can have allocations for both MOOE and CO (via `mooe_amount` and `co_amount` columns). However, the PPMP items are separated by expense class — you select MOOE to see/manage MOOE items, CO to see/manage CO items.

### Monthly quantities & amounts

Each PPMP item has 12 pairs of month quantity/amount columns (`jan_qty`/`jan_amount` … `dec_qty`/`dec_amount`). When a quantity is updated (`PpmpController::updateMonthlyQuantity`), the amount is auto-calculated as `qty * unit_price` and the total is synced back to `ppa_funding_sources` via `updatePpaFundingSourceTotals()` (lines 215-251).

## Flow 3: Funding Source Allocation in SAIP

### What this is

When viewing a SAIP tab in AIP Summary, clicking **Edit** on a PPA row opens the `AipEntryFormDialog`. This dialog lets the user allocate **PS, MOOE, FE, and CO amounts** to funding sources for that SAIP entry — creating separate `ppa_funding_sources` rows scoped to the SAIP, independent of the original plan.

### Why separate rows are needed

The same PPA can have different funding allocations per SAIP. For example:

```
PPA: "Manpower Services" (GF Proper)
  ├── Original:   PS=500,000 | MOOE=200,000
  ├── SAIP #1:    PS=300,000 | MOOE=100,000   ← separate row
  └── SAIP #2:    PS=  0     | MOOE=400,000   ← separate row
```

Each SAIP gets its own `ppa_funding_sources` row identified by `(aip_entry_id, funding_source_id, supplemental_aip_id)`.

### Step-by-step flow

#### Step 1 — User clicks Edit on a SAIP tab

`index.tsx:handleEditDialogOpen` (lines 342-345) sets `selectedEntry` (the Ppa) and opens `<AipEntryFormDialog>`, passing `supplementalAipId = currentScope.supplemental_aip_id`.

#### Step 2 — Dialog resolves the correct AIP entry

`aip-entry-form-dialog.tsx:118-121`:
```ts
const entry = data?.aip_entries?.find(
    e => e.supplemental_aip_id === (supplementalAipId || null)
) || data?.aip_entries?.[0] || null;
```

For a SAIP tab (`supplementalAipId` is a number), it finds the `aip_entry` whose `supplemental_aip_id` matches that SAIP's ID. The entry was already scoped by the backend's eager load filter.

#### Step 3 — Form populates with existing SAIP-scoped funding sources

`useEffect` (lines 232-260):
```ts
const currentSources = currentEntry && currentEntry.supplemental_aip_id === (supplementalAipId || null)
    ? currentEntry.ppa_funding_sources || []
    : [];
```

**Only** funding sources where `supplemental_aip_id` matches the current SAIP are loaded — any original-plan funding sources for the same PPA are excluded.

#### Step 4 — User sets amounts and submits

`onSubmit` (lines 203-229) sends:
```ts
router.put(`/aip-entries/${entry.id}`, {
    ...values,                          // includes ppa_funding_sources[] array
    ppa_id: data?.id,
    fiscal_year_id: fiscalYear.id,
    supplemental_aip_id: supplementalAipId,   // the SAIP's ID
})
```

#### Step 5 — Backend `AipEntryController::update()` (lines 266-365)

**Detect scope** (line 275):
```php
$saipId = $validated['supplemental_aip_id'] ?? null;
```

**Scope all queries by `supplemental_aip_id`** (lines 277-286):
```php
$currentFundingSourceQuery = $aipEntry->ppaFundingSources();
if ($saipId) {
    $currentFundingSourceQuery->where('supplemental_aip_id', $saipId);
} else {
    $currentFundingSourceQuery->whereNull('supplemental_aip_id');
}
```

All reads, diffs, and deletions of funding sources are isolated by `supplemental_aip_id` — original plan rows are never touched.

**Compute removals** (lines 288-295): Diff old vs new `funding_source_id` values within the scoped set.

**Guard against PPMP-linked removals** (lines 297-317): Before deleting a funding source, checks if any PPMP items reference it (also scoped by `supplemental_aip_id`).

**Transaction** (lines 320-362):
1. Updates `aip_entry` metadata (`expected_output`, `start_date`, `end_date`)
2. Updates `office_id` on the PPA
3. Deletes removed funding sources (scoped delete)
4. Upserts remaining funding sources via `updateOrCreate`:

```php
$aipEntry->ppaFundingSources()->updateOrCreate(
    [
        'funding_source_id' => $source['funding_source_id'],
        'supplemental_aip_id' => $saipId ?: null,
    ],
    [
        'ps_amount' => $source['ps_amount'],
        'mooe_amount' => $source['mooe_amount'],
        'fe_amount' => $source['fe_amount'],
        'co_amount' => $source['co_amount'],
        'ccet_adaptation' => $source['ccet_adaptation'] ?? 0,
        'ccet_mitigation' => $source['ccet_mitigation'] ?? 0,
        'is_supplemental' => (bool)$saipId,
    ],
);
```

The composite unique key `(aip_entry_id, funding_source_id, supplemental_aip_id)` means:
- **Original entries** (`$saipId = null`): `supplemental_aip_id` is `null`, `is_supplemental` is `false`
- **SAIP entries** (`$saipId` is the SAIP's DB ID): `supplemental_aip_id` is the SAIP ID, `is_supplemental` is `true`

### Result

Each SAIP gets its own **independent set** of `ppa_funding_sources` rows. Quoting the migration's unique constraint:

```sql
UNIQUE KEY `pfs_aip_funding_supplemental_unique`
  (`aip_entry_id`, `funding_source_id`, `supplemental_aip_id`)
```

This allows the same `(aip_entry_id, funding_source_id)` pair to exist **twice** — once for original (`supplemental_aip_id = NULL`) and once per SAIP.

### Key files

| File | Role |
|------|------|
| `resources/js/pages/aip-summary/aip-entry-form-dialog.tsx` | Edit dialog UI, form submission |
| `resources/js/pages/aip-summary/index.tsx:342-345,538-547` | Opens dialog, passes `supplementalAipId` |
| `app/Http/Controllers/AipEntryController.php:266-365` | `update()` — scoped upsert logic |
| `app/Models/PpaFundingSource.php` | Model with `supplemental_aip_id` fillable |
| `database/migrations/2026_05_20_000000_create_supplemental_aips_tables.php` | Adds `supplemental_aip_id` column + unique constraint |
| `database/migrations/2026_05_13_032006_add_unique_constraint_to_ppa_funding_sources_table.php` | Initial unique constraint on `(aip_entry_id, funding_source_id)` |

## Flow 4: Combined View in AIP Summary

### What this is

The **Combined View** tab merges all scopes (original + all SAIPs) into a single tree, showing each PPA once per funding source with summed amounts and the **latest SAIP's** non-numeric fields (start/end dates, expected output).

### Backend data loading

`AipEntryController::index()` with `scope=combined`:

- `$aipEntryFilter` — no `WHERE` clause → **all** `aip_entries` (original + all SAIPs) are loaded
- `$fundingSourceFilter` — no `WHERE` clause → **all** `ppa_funding_sources` across all scopes are loaded
- Main query `whereHas('aipEntries')` — no condition → any PPA with at least one entry is included
- Same applies recursively to all 3 levels of children

### Frontend merge logic

`expandPpaByFundingSource` in `index.tsx:125-233` (also duplicated in `export-to-excel.ts:14-90` and `export-to-pdf-dialog.tsx:130-167`):

**Step 1** — Collect all funding sources from all AIP entries:
```ts
let sources = activeAips.flatMap((aip) => aip.ppa_funding_sources || []);
```

**Step 2** — (Combined mode only) Group by `funding_source_id` and sum amounts:
```ts
const grouped = new Map<number, typeof sources>();
sources.forEach((src) => {
    const list = grouped.get(src.funding_source_id) || [];
    list.push(src);
    grouped.set(src.funding_source_id, list);
});
sources = Array.from(grouped.entries()).map(([fsId, list]) => {
    const base = { ...list[0] };
    // Sum amounts across all source rows in the group
    list.forEach((item) => {
        ps += parseFloat(item.ps_amount || '0');
        mooe += parseFloat(item.mooe_amount || '0');
        ...
    });
    base.ps_amount = ps.toString();
    base.mooe_amount = mooe.toString();
    // ...
});
```

**Step 3** — Point non-numeric fields to the latest SAIP entry. After summing, the merged source's `aip_entry_id` is overridden to the latest entry (by `supplemental_aip_id` descending):
```ts
const entryIds = [...new Set(list.map((s) => s.aip_entry_id))];
const latestEntry = entryIds
    .map((id) => activeAips.find((a) => a.id === id))
    .filter(Boolean)
    .sort((a, b) => (b.supplemental_aip_id ?? -1) - (a.supplemental_aip_id ?? -1))[0];
if (latestEntry) {
    base.aip_entry_id = latestEntry.id;
}
```

**Step 4** — Each merged source becomes a row with `aip_entry` set to the latest entry:
```ts
return sources.map((fs, index) => {
    const parentAip = activeAips.find((aip) => aip.id === fs.aip_entry_id) || null;
    return { ...ppa, current_fs: fs, aip_entry: parentAip, ... };
});
```

### Column rendering

The table columns render non-numeric fields from `row.original.aip_entry` (not `aip_entries[0]`). This was fixed in `columns.tsx` — the accessor was changed from `'aip_entries'` (which resolved to the array and took `[0]`) to `'aip_entry'` (which resolves to the correctly-set latest entry):

| Column | Before (broken) | After (fixed) |
|--------|----------------|---------------|
| Start Date | `info.getValue()?.[0]?.start_date` | `info.getValue()?.start_date` |
| End Date | `info.getValue()?.[0]?.end_date` | `info.getValue()?.end_date` |
| Expected Output | `info.getValue()?.[0]?.expected_output` | `info.getValue()?.expected_output` |

### Zero-sources fallback

If a PPA has AIP entries but **no** `ppa_funding_sources` in any scope, the combined view shows a single row. Previously this used `activeAips[0]` (always the original). Now it picks the latest entry:
```ts
const latestAip = [...activeAips].sort(
    (a, b) => (b.supplemental_aip_id ?? -1) - (a.supplemental_aip_id ?? -1),
)[0];
```

### Files that had the same issue

| File | Line | Fix |
|------|------|-----|
| `index.tsx:expandPpaByFundingSource` | 170-181 | `aip_entry_id` overridden to latest entry in merge block |
| `index.tsx:expandPpaByFundingSource` | 193-198 | Zero-sources fallback uses latest entry |
| `columns.tsx:start_date,end_date,expected_output` | 113-143 | Accessor changed from `aip_entries` to `aip_entry` |
| `export-to-excel.ts:expandPpaByFundingSource` | 54-70 | Same merge block fix |
| `export-to-excel.ts:zero-sources fallback` | 78-83 | Same fallback fix |
| `export-to-excel.ts:row building` | 276 | `item.aip_entry` instead of `item.aip_entries?.[0]` |
| `export-to-pdf-dialog.tsx:row building` | 130-167 | Latest entry override after combined merge |

### Known limitation

The combined view is **read-only** (`readOnly: true`) — no editing is allowed because a single row represents data from multiple scopes. The PPMP navigation link would navigate to only one scope's PPMP page using the latest entry's ID.

## Flow 5: SPPMP (Supplemental PPMP) Page

### Navigating to PPMP

From the AIP Summary page, clicking the PPMP action on a PPA row navigates to:
```
GET /aip/{fiscalYear}/summary/{aipEntry}/ppmp
→ PpmpController::index
```

The `aipEntry` in the route is the AIP entry specific to the current scope (original or SAIP). The backend (`PpmpController.php:23-124`) loads:

| Data | What it loads | Scope awareness |
|------|--------------|-----------------|
| `aipEntry` | The specific AIP entry from the route | Scoped to the tab the user came from |
| `allAipEntries` | **All** AIP entries for this PPA (original + all SAIPs) | Unscoped — includes everything |
| `ppmps` | All PPMP items across **all** `aip_entry_id`s for this PPA | Unscoped — includes original + supplemental |
| `fundingSources` | All funding sources that appear in any scope for this PPA | Unscoped — includes original + supplemental |
| `isSupplemental` | Whether the route's AIP entry is supplemental | Determines initial tab |

### Tab structure

The frontend (`resources/js/pages/ppmp/index.tsx`) builds tabs dynamically (lines 198-217):

| Tab | Value | Shows |
|-----|-------|-------|
| "Original" | `"original"` | PPMP items where `ppa_funding_source.aip_entry_id` = original entry's ID |
| "Supplemental PPMP No. X" | `"supplemental_{entryId}"` | PPMP items where `ppa_funding_source.aip_entry_id` = that SAIP entry's ID |
| "Combined" | `"combined"` | All PPMP items merged and summed by `ppmp_price_list_id` |

Tabs are only shown when `hasSupplementalEntries` is true — now also requires at least one `ppa_funding_source` on the entry (lines 198-202):
```ts
const hasSupplementalEntries = allAipEntries.some(
    (e) => e.supplemental_aip_id && (e.ppa_funding_sources?.length ?? 0) > 0,
);
```

Each supplemental tab's label transforms the SAIP name via `name.replace('AIP', 'PPMP')` (line 212), so "Supplemental AIP No. 1" displays as **"Supplemental PPMP No. 1"**. The SAIP's database `name` field is unchanged.

**Initial tab** — reads from URL first, falls back to route context:
```ts
const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab) return urlTab;
    return isSupplemental ? `supplemental_${aipEntry.id}` : 'original';
};
const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
```
- If the URL has `?tab=supplemental_5`, that tab is restored (survives refresh)
- If the user came from a SAIP tab in AIP Summary, opens directly on that SAIP's tab
- If neither, defaults to "Original"

**Tab switching updates the URL** — on tab change, `router.get` with `only: []` updates `?tab=` to enable deep-linking and refresh persistence, without refetching any backend data.

### How item filtering works

**Step 1 — `activePpmpItems`** (lines 243-264): Filter by tab scope
- **Original tab**: `ppmps` where `aip_entry_id` = the entry with `supplemental_aip_id IS NULL`
- **Supplemental tab**: `ppmps` where `aip_entry_id` = that specific SAIP entry's ID
- **Combined tab**: All `ppmps` (no filter)

**Step 2 — `filteredPpmpItems`** (lines 266-335): Filter by user's dropdown selections
- `funding_source_id` matches the selected funding source
- `expense_class` (from the price list's chart of account) matches the selected expense class

**Combined mode** (lines 279-327): Groups items by `ppmp_price_list_id`, summing all 12 months' quantities and amounts across original + supplemental items.

### The "SPPMP group" concept

Adding a funding source to Manpower Services in a SAIP creates a new `ppa_funding_sources` row scoped to that SAIP's `aip_entry_id`. On the PPMP page, switching to the SAIP tab shows that new funding source in the dropdown. The user can then add price list items under it — those items **are the SPPMPs**.

```
PPMP page — Supplemental tab view:

PPA: "Manpower Services"
  │
  ├── Funding Source: GF Proper (SAIP-scoped aip_entry_id)
  │     ├── Expense Class: MOOE  ← select this
  │     │     └── (Add items here → these become SPPMPs)
  │     └── Expense Class: CO    ← or select this
  │           └── (Add items here → these become SPPMPs)
  │
  └── (Original funding sources are also shown if they exist)
```

There is no separate "SPPMP" table — SPPMPs are just `Ppmp` records whose `ppa_funding_source.aip_entry_id` belongs to a SAIP. The badge in the columns (`columns.tsx:267`) distinguishes them:

```tsx
ppmp.ppa_funding_source?.supplemental_aip_id
  ? <Badge>Supplemental</Badge>
  : <Badge>Original</Badge>
```

### Creating SPPMP items

The `PpmpController::store()` (lines 137-154) creates a `Ppmp` record linked to a `ppa_funding_source_id`:

```php
$ppmp = Ppmp::firstOrCreate([
    'ppa_funding_source_id' => $validated['ppa_funding_source_id'],
    'ppmp_price_list_id' => $validated['ppmp_price_list_id'],
]);
```

Since the `ppa_funding_source_id` already belongs to a SAIP-scoped row, the resulting PPMP item is automatically an SPPMP. No explicit scope flag needed.

**Duplicate prevention:** The `ppmps` table has a unique constraint on `(ppa_funding_source_id, ppmp_price_list_id)` (`ppmps_price_list_unique`). Combined with `firstOrCreate`, the same price list item cannot be added twice to the same funding source. This is by design — each item per funding source should appear only once. All monthly quantities for that item are managed within the single row.

### Updating quantities & syncing totals

`PpmpController::updateMonthlyQuantity()` (lines 156-181):
1. Receives a month + quantity
2. Computes `amount = qty × unit_price` (from `PpmpPriceList.price`)
3. Updates the specific month's qty/amount on the PPMP record
4. Calls `updatePpaFundingSourceTotals()` (lines 215-251):
   - Sums all amounts for the same `ppa_funding_source_id` + expense class
   - Updates the corresponding column (`mooe_amount`, `co_amount`, `ps_amount`, or `fe_amount`) on the `ppa_funding_sources` bridge record

This syncing works identically for original and supplemental — the scope is carried by the `ppa_funding_source_id` chain.

### Deleting SPPMP items

`PpmpController::destroy()` (lines 202-213):
1. Gets the `ppa_funding_source` bridge and expense class from the PPMP item
2. Deletes the PPMP record
3. Recalculates totals on the bridge record — same as update path

### Verification: code matches the documented logic

| Description | Code location | Matches? |
|------------|--------------|----------|
| Loads all AIP entries for the PPA | `PpmpController.php:35-37` | ✅ |
| Loads all PPMP items across all scopes | `PpmpController.php:41-88` | ✅ |
| Determines supplemental from route entry | `PpmpController.php:32` | ✅ |
| SPPMP badge via `supplemental_aip_id` | `columns.tsx:267` | ✅ |
| Store links to `ppa_funding_source_id` (no scope awareness needed) | `PpmpController.php:142-146` | ✅ |
| Tab filtering by `aip_entry_id` | `ppmp/index.tsx:243-264` | ✅ |
| Combined view merges by price list item | `ppmp/index.tsx:279-327` | ✅ |
| Editing quantities syncs totals back to bridge | `PpmpController.php:156-181, 215-251` | ✅ |

---

## Potential Edge Cases / Future Considerations

### 1. Same PPA imported into multiple SAIPs

Supported by design. Each SAIP import creates a separate `aip_entry` row scoped by `supplemental_aip_id`. Funding sources, outputs, and dates are fully independent per SAIP.

### 2. Edit dialog entry resolution (`aip-entry-form-dialog.tsx:118-121`)

The frontend finds the correct AIP entry matching the current scope:
```ts
const entry = data?.aip_entries?.find(e => e.supplemental_aip_id === (supplementalAipId || null))
           || data?.aip_entries?.[0]
           || null;
```

This works correctly because the backend pre-filters `aipEntries` by scope. However:
- The fallback `data?.aip_entries?.[0]` is **dead code** — it's never reached since the backend scopes the eager load
- If it were reached, `expected_output`, `start_date`, `end_date` would be pre-filled from a wrong-scope entry (lines 244-246), though funding sources are guarded by scope match (lines 238-240)

### 3. Missing `POST /aip-entries` route (`aip-entry-form-dialog.tsx:228`)

The `onSubmit` function has a fallback path:
```ts
if (isEdit && entry) {
    router.put(`/aip-entries/${entry.id}`, payload);
} else {
    router.post(`/aip-entries`, payload);  // no route exists → 404
}
```

No `POST /aip-entries` route is defined in `web.php`. This path is currently unreachable (see point 2), but would cause a 404 error if triggered by future changes.

### 4. `$supplementalAip->ppas()->delete()` — dead code for future flow

`SupplementalAipController::destroy()` line 56 calls `$supplementalAip->ppas()->delete()`. Currently no code path sets `supplemental_aip_id` on PPA records, so this deletes nothing. It exists for a future "create PPA directly in SAIP" flow where a PPA would be tagged with the SAIP's ID and should be deleted when the SAIP is destroyed.

### 5. Resource timing / stale data

Since the SAIP tabs switch via `router.get()` with `preserveState: true`, stale props could briefly show before the server responds. The Inertia partial reload (`only: ['dialogPpaTree', 'dialogCurrent', 'filters']`) for the import dialog mitigates this but the main page data reloads fully on tab switch.

### 6. Duplicate price list item feedback (future enhancement)

Currently, when a user adds a price list item that already exists in the PPMP for that funding source, `PpmpController::store()` silently returns the existing record via `firstOrCreate`. The user gets no indication that the item was already added.

**Desired behavior:** Show a dialog or toast notification: *"This item is already in the PPMP. You can update its monthly quantities directly in the table."*

**Implementation approach:**
1. Change `firstOrCreate` to `firstOrNew` + check if record already existed
2. Return a flag in the response or throw a validation error
3. Frontend catches the response and shows the notification instead of closing the dialog

### 7. SAIP with no funding source → no PPMP tab

A SAIP that has no funding source allocated to any of its AIP entries will **not** produce a PPMP tab on the PPMP page. Both `tabsList` and `hasSupplementalEntries` in `ppmp/index.tsx:198-217` filter by `(entry.ppa_funding_sources?.length ?? 0) > 0`. This prevents a dead-end tab with an empty funding source dropdown from appearing.

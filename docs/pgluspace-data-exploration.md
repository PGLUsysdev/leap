# PGLU Space Data API — exploration findings

What the [PGLU Space Data API](pgluspace-data-api.md) actually returns when you walk it:
observed values, how the endpoints relate, data quality problems, and query recipes.

- **Base URL:** `https://api-workspace.launion.gov.ph/api/data/v1`
- **Explored:** October 2026
- **Token scopes:** `departments`, `divisions`, `positions`, `salary_grades`, `employees`, `qualification_standards`
- **Rate limit:** 60 requests/minute
- **Observed token:** `LEAP`, prefix `pdapi_s8NJmncT`, expires `2027-01-03`

In LEAP, reach the API through `App\Services\WorkspaceApiClient` — it already handles the
bearer token, retries, and the page walk:

```php
app(WorkspaceApiClient::class)->employees(['dept_code' => '1007'])->count();
```

Two caches sit on top of it for the lookups the API cannot batch or reuse:

- `App\Services\WorkspacePositionCatalog` — employees carry a `pos_code` but no title,
  and `/positions` resolves codes only one at a time, so the masterlist is fetched once
  and cached by `pos_code`.
- `App\Services\WorkspaceSalarySchedule` — `/salary-grades` returns every grade in one
  response, cached by grade for the monthly rates.

The personnel schedule resolves both — see
[Office → department mapping](#15-office--department-mapping) and the section on what it
renders today.

---

## 1. Overview

The API exposes La Union provincial government's HR and organizational data:

- **Organizational structure** — departments and divisions
- **Positions** — the province's position masterlist
- **Salaries** — the salary schedule by grade and step
- **Employees** — active and inactive personnel records
- **Qualification standards** — the DBM Index of Occupational Services

All endpoints are read-only (`GET`), return JSON, and are paginated with a consistent wrapper.

## 2. Authentication

Every request requires a bearer token:

```http
Authorization: Bearer $PGLUSPACE_DATA_TOKEN
Accept: application/json
```

Test the connection and inspect the token with `GET /me`.

### Token metadata (`/me`)

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Token name (e.g. `LEAP`) |
| `token_prefix` | string | First characters, safe to display |
| `scopes` | array | Resources readable by this token |
| `rate_limit_per_minute` | integer | Usually `60` |
| `expires_at` | date-time | `null` if it never expires |

## 3. Response conventions

Every list endpoint returns:

```json
{
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 41,
    "last_page": 1
  }
}
```

| Meta field | Meaning |
| --- | --- |
| `current_page` | Current page number |
| `per_page` | Rows per page |
| `total` | Total rows matching the filter |
| `last_page` | Number of pages at this `per_page` |

**Key rule:** always compare `data.length` to `meta.total` to detect incomplete results.

## 4. Endpoint catalog

| # | Endpoint | Scope | Rows | Max `per_page` |
| --- | --- | --- | --- | --- |
| 1 | `/me` | any | 1 | — |
| 2 | `/departments` | `departments` | 41 | 1000 |
| 3 | `/divisions` | `divisions` | 292 | 1000 |
| 4 | `/positions` | `positions` | 661 | 1000 |
| 5 | `/salary-grades` | `salary_grades` | 37 | 1000 |
| 6 | `/employees` | `employees` | 3203 | **500** |
| 7 | `/qs/sources` | `qualification_standards` | 1 | 1000 |
| 8 | `/qs/occupational-services` | `qualification_standards` | 20 | 1000 |
| 9 | `/qs/occupational-groups` | `qualification_standards` | 211 | 1000 |
| 10 | `/qs/position-classes` | `qualification_standards` | 2562 | 1000 |

## 5. Endpoint reference

### 5.1 `/me` — token info

**Parameters:** none

**Response:**

```json
{
  "data": {
    "name": "LEAP",
    "token_prefix": "pdapi_s8NJmncT",
    "scopes": ["departments", "divisions", "positions", "salary_grades", "employees", "qualification_standards"],
    "rate_limit_per_minute": 60,
    "expires_at": "2027-01-03T10:29:07+08:00"
  }
}
```

Use this to verify connection, check scopes, and confirm the token hasn't expired.

### 5.2 `/departments` — offices

**Scope:** `departments` — **Total:** 41

**Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `page` | integer | Default `1` |
| `per_page` | integer | Default `100`, max `1000` |
| `dept_code` | string | Exact office code |

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Internal DB ID |
| `dept_code` | string | Business key — referenced by employees and divisions |
| `dept_name` | string | Full official name |
| `dept_ab` | string | Abbreviation (e.g. `PICTO`) |
| `short_name` | string | Display name |

**Example — PICTO:**

```json
{
  "id": 432,
  "dept_code": "1022",
  "dept_name": "PROVINCIAL INFORMATION AND COMMUNICATIONS TECHNOLOGY OFFICE",
  "dept_ab": "PICTO",
  "short_name": "PICTO"
}
```

**Key offices observed:**

| `dept_code` | Abbrev | Name |
| --- | --- | --- |
| `1000` | OPG | Office of the Provincial Governor |
| `1001` | OPVG | Office of the Vice-Governor |
| `1002` | SPO | Sangguniang Panlalawigan |
| `1004` | PTO | Provincial Treasurer |
| `1007` | PEO | Provincial Engineer |
| `1012` | PHO | Provincial Health Officer |
| `1022` | PICTO | Provincial ICT Office |
| `1048` | LUMC | La Union Medical Center |

### 5.3 `/divisions` — divisions

**Scope:** `divisions` — **Total:** 292

**Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `page` | integer | Default `1` |
| `per_page` | integer | Default `100`, max `1000` |
| `dept_code` | string | Divisions of one office |

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Division ID |
| `dept_code` | string | Parent office |
| `name` | string | Division name |

**Example — Engineer's Office (`dept_code=1007`), 7 divisions:**

1. ADMINISTRATIVE UNIT
2. CONSTRUCTION UNIT
3. MACHINERY AND EQUIPMENT SECTION
4. MAINTENANCE AND MOTORPOOL UNIT
5. PLANNING AND PROGRAMMING DIVISION
6. QUALITY CONTROL UNIT
7. ROADS AND BRIDGES MAINTENANCE SECTION

> ⚠️ **Critical limitation:** every employee has `division_id: null`. The
> `/employees` → `/divisions` link is **broken**. Divisions are organizational metadata
> only, not usable for grouping employees.

### 5.4 `/positions` — provincial position masterlist

**Scope:** `positions` — **Total:** 661

**Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `page` | integer | Default `1` |
| `per_page` | integer | Default `100`, max `1000` |
| `pos_code` | string | Exact position code |
| `salary_grade` | integer | Positions at one SG |

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Position ID |
| `pos_code` | string | Business key — referenced by employees |
| `pos_name` | string | Position title |
| `short_name` | string | Short title (often null) |
| `salary_grade` | integer | SG for the position |

**Example:**

```json
{
  "id": 500,
  "pos_code": "2B002",
  "pos_name": "COMPUTER PROGRAMMER I",
  "short_name": null,
  "salary_grade": 11
}
```

### 5.5 `/salary-grades` — salary schedule

**Scope:** `salary_grades` — **Total:** 37

**Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `page` | integer | Default `1` |
| `per_page` | integer | Default `100`, max `1000` |
| `year` | integer | Schedule year |
| `salary_grade` | integer | One SG |

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Row ID |
| `salary_grade` | integer | SG number |
| `year` | integer | Schedule year (all 2025) |
| `effectivity_date` | date | `null` in current data |
| `steps` | object | `{ "1": 30024, "2": 30308, ... }` |

**Example — SG-11 (2025):**

| Step | Monthly Rate |
| --- | --- |
| 1 | ₱30,024 |
| 2 | ₱30,308 |
| 3 | ₱30,597 |
| 4 | ₱30,889 |
| 5 | ₱31,185 |
| 6 | ₱31,486 |
| 7 | ₱31,790 |
| 8 | ₱32,099 |

**Increment pattern:** ~1% per step (₱284–₱309 per step).

**Grades 1–33 are real schedules.** Steps rise monotonically across the range
(SG-29 step 1 = ₱184,697 → SG-30 = ₱203,200 → SG-32 = ₱347,888 → SG-33 = ₱438,844).

> ⚠️ **SG-31 step 1 is a genuine typo, not a marker.** It reads `14061`, which is
> SG-1 step 1 verbatim. Steps 2–8 of SG-31 sit correctly on the trend
> (₱304,464 → ₱340,347, between SG-30 and SG-32), so the grade itself is sound and
> only the first step is wrong. Do not treat this as evidence of a marker pattern.
>
> SG-34 has no employees and an odd schedule of its own — step 1 `31282`, step 2
> `7380.45`, with step 2 below step 1.

**Grades 34–37 are not salary schedules.** They are placeholder rows backing the
[marker grades](#6-salary-grade-markers-above-33) in the employee feed:

| `salary_grade` | `steps` | Active employees |
| --- | --- | ---: |
| 34 | `{1: 31282, 2: 7380.45}` | 0 |
| 35 | `{1: 20000}` | 202 |
| 36 | `{1: 32659.5, 2: 33192.5}` | 8 |
| 37 | `{1: 13530}` | 260 |

None of these follow the ~1% step ladder, and 35/37 have a single flat step.

### 5.6 `/employees` — employees

**Scope:** `employees` — **Total:** 3203 (33 pages at `per_page=100`)

**Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `page` | integer | Default `1` |
| `per_page` | integer | Default `100`, **max `500`** |
| `employment_status` | string | `A` active (default), `I` inactive, `D` old file, `R`, or `all` |
| `dept_code` | string | Employees of one office |
| `appointment_status` | string | Comma-separated: `PERMANENT,CASUAL` |
| `pers_id` | string | One employee |
| `updated_since` | string | Date or date-time; rows changed since (best effort) |

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `pers_id` | string | Employee ID (string, not integer) |
| `last_name`, `first_name`, `middle_name` | string | Name parts |
| `name_ext` | string | `JR.`, `III`, etc. |
| `full_name` | string | Pre-formatted |
| `dept_code` | string, nullable | Office |
| `dept_name` | string, nullable | Office name |
| `division_id` | integer, **always null** | Broken link |
| `division_name` | string, **always null** | |
| `pos_code` | string, nullable | Position code |
| `position_title` | string, nullable | Title (can be null) |
| `salary_grade` | integer, nullable | Native field. Values above 33 are [markers](#6-salary-grade-markers-above-33), not payable grades |
| `step` | integer, nullable | Native field. Not bounded by 8 — values up to 15 occur |
| `appointment_status` | string, nullable | See list below |
| `employment_status` | string | `A`, `I`, `D`, `R` |
| `dte_hired` | date, nullable | Date hired, as stored |
| `updated_at` | date-time, nullable | Last DB change |

**Appointment statuses observed:**

12 distinct values, counted over every row with `employment_status=all` (11,083
records). "Active" is the endpoint default (`employment_status=A`, 3,203 records),
so the two counts differ a lot for some values. Grouped by budget treatment; `ID` is
the classification number.

| ID | `appointment_status` | Category | Budget form | Active | All |
| ---: | --- | --- | --- | ---: | ---: |
| 1 | `PERMANENT` | Plantilla | LBP Form 3 | 1419 | 2715 |
| 2 | `TEMPORARY` | Plantilla | LBP Form 3 | 20 | 1205 |
| 7 | `COTERMINOUS` | Plantilla | LBP Form 3 | 79 | 272 |
| 8 | `ELECTED` | Plantilla | LBP Form 3 | 16 | 63 |
| 3 | `CASUAL` | Non-plantilla | LBP Form 3A | 558 | 1287 |
| 4 | `CONTRACTUAL` | Non-plantilla | LBP Form 3A | 12 | 1405 |
| 5 | `CONTRACT OF SERVICE` | Non-plantilla | Neither — MOOE | 309 | 452 |
| 6 | `JOB ORDER` | Non-plantilla | Neither — MOOE | 253 | 690 |
| 9 | `CONSULTANT` | Non-plantilla | Neither — MOOE | 6 | 47 |
| 10 | `OJT` | Trainee | Neither | 468 | 1390 |
| 11 | `VOLUNTEER` | Volunteer | Neither | 3 | 102 |
| — | *(null)* | — | — | 60 | 1453 |

**Budget treatment per status:** Plantilla items (`PERMANENT`, `TEMPORARY`,
`COTERMINOUS`, `ELECTED`) occupy LBP Form 3 positions. Non-plantilla positions funded
under PS (`CASUAL`, `CONTRACTUAL`) use LBP Form 3A. Everything else is charged to
MOOE — `CONTRACT OF SERVICE` under Consulting/General Services, `JOB ORDER` under
Job Order/General Services, `CONSULTANT` under Professional Services — and so is in
neither PS nor LBP Form 3/3A. `OJT` is a student placement with no employment or PS
allocation; `VOLUNTEER` is unpaid with no PS allocation.

`CONTRACTUAL` and `CONTRACT OF SERVICE` are distinct values and are budgeted
differently: Form 3A under PS versus MOOE, respectively.

Reading notes:

- **Values are upper case and trimmed** — no whitespace or casing variants exist in
  the data, which makes the case-sensitive filter a quiet hazard rather than a dirty-data
  one: `appointment_status=permanent` returns 0 rows, not an error.
- **`null` is a value in its own right.** 1,453 rows overall and 60 active rows carry
  no appointment status, so filtering has to decide what to do with them.
- **`TEMPORARY` and `CONTRACTUAL` are not active/inactive discriminators.** They jump
  ~60x from active to all, far more than `PERMANENT` or `CONTRACT OF SERVICE`.
- **`SPES`** appeared in earlier notes on this endpoint but is absent from the current
  data; `VOLUNTEER` is new.

### Personnel schedule: which appointments are listed

`PersonnelScheduleController` keeps an allowlist of six appointments and drops everything
else before rendering, so the schedule does **not** list every active employee. The
figures below are a snapshot of the current behaviour.

| | Values | Active employees |
| --- | --- | ---: |
| **Listed** | `PERMANENT`, `CASUAL`, `COTERMINOUS`, `TEMPORARY`, `ELECTED`, `CONTRACTUAL` | 2,104 of 3,203 (66%) |
| **Hidden** | `OJT`, `CONTRACT OF SERVICE`, `JOB ORDER`, `CONSULTANT`, *(null)*, `VOLUNTEER` | 1,099 of 3,203 (34%) |

Of the 1,099 hidden: 468 `OJT`, 309 `CONTRACT OF SERVICE`, 253 `JOB ORDER`, 6
`CONSULTANT`, 60 with no appointment status, and 3 `VOLUNTEER`.

Matching is case-insensitive and trimmed, because the API's own `appointment_status`
filter is case-sensitive: a differently-cased row would otherwise slip through
unnoticed.

**Open questions before this is final:**

- **The 60 active rows with no `appointment_status`** are excluded. If those are really
  plantilla rows whose appointment was never recorded, real positions are being dropped.
  Worth checking which departments they cluster in.
- **`CONTRACT OF SERVICE` is hidden while `CONTRACTUAL` (12 active) is listed.** The two
  names are similar but distinct values; if the intent was to hide contractual hiring,
  `CONTRACTUAL` was probably meant to go too.
- **`TEMPORARY` is listed** while 468 `OJT` interns are hidden, even though `TEMPORARY`
  jumps ~60x from 20 active to 1,205 overall. If the intent is "plantilla only", the
  split between `TEMPORARY` and `COTERMINOUS` needs a decision.
- **Four of the listed values arrive without a grade or step** — `CASUAL`, `TEMPORARY`,
  `CONTRACTUAL`, `ELECTED`. They can be listed on the schedule but not priced from the API.
- **A hidden employee may still be load-bearing elsewhere.** Nothing else consumes
  `/employees` yet, so this only affects the personnel schedule today.

**Privacy:** birth date, contact info, address, government IDs, and pay amounts are **never exposed**.

**Example:**

```json
{
  "pers_id": "33085",
  "full_name": "TORIBIO JASPER VANJO NASTOR",
  "dept_code": "1022",
  "dept_name": "PROVINCIAL INFORMATION AND COMMUNICATIONS TECHNOLOGY OFFICE",
  "pos_code": "2B002",
  "position_title": "COMPUTER PROGRAMMER I",
  "salary_grade": 11,
  "step": 3,
  "appointment_status": "CONTRACT OF SERVICE",
  "employment_status": "A",
  "dte_hired": "2025-11-17",
  "updated_at": "2026-05-12T08:11:06+08:00"
}
```

### 5.7 `/qs/sources` — qualification standard sources

**Scope:** `qualification_standards` — **Total:** 1

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Source ID |
| `reference_no` | string | e.g. `DBM Budget Circular No. 2022-2` |
| `title` | string | Full issuance title |
| `issuer` | string | `Department of Budget and Management` |
| `issue_date` | date | `2022-04-05` |
| `notes` | string | Parsing notes and caveats |

> ⚠️ **Important caveat from notes:** this is the **national** IOS (for NGAs/GOCCs). The
> LGU-specific IOS is issued separately under **DBM LBC No. 137** and is **not loaded**.
> La Union positions may not map cleanly.

### 5.8 `/qs/occupational-services` — occupational services

**Scope:** `qualification_standards` — **Total:** 20
**Parameters:** `source_id` (integer)
**Fields:** `id`, `source_id`, `service_code`, `service_name`

**All 20 services:**

| ID | Code | Name |
| --- | --- | --- |
| 1 | 01-GA | General Administrative Service |
| 2 | 02-FS | Financial Service |
| 3 | 03-PS | Planning Service |
| 4 | 04-AE | Architecture and Engineering Service |
| 5 | 05-TC | Transportation, Communication and Public Utilities |
| 6 | 06-CT | Crafts, Trades and Related Service |
| 7 | 07-SS | Social Sciences and Welfare Service |
| 8 | 08-IA | Information, Art and Recreation Service |
| 9 | 09-MH | Medicine and Health Service |
| 10 | 10-EL | Education, Library, Museum and Archival |
| 11 | 11-AA | Agrarian, Agricultural and Environmental |
| 12 | 12-TT | Trade, Tourism and Industry Service |
| 13 | 13-MP | Mathematics, Physical and Biological Sciences |
| 14 | 14-DS | Defense and Security Service |
| 15 | 15-LJ | Legal and Judicial Service |
| 16 | 16-FR | Foreign Relations Service |
| 17 | 17-MS | Miscellaneous Service |
| 18 | 18-ES | Executive Service |
| 19 | 19-LS | Legislative Service |
| 20 | 20-CM | Corporate Management |

### 5.9 `/qs/occupational-groups` — occupational groups

**Scope:** `qualification_standards` — **Total:** 211
**Parameters:** `occupational_service_id` (integer)
**Fields:** `id`, `occupational_service_id`, `group_code`, `group_name`

**Example — Service 1 (General Administrative) groups:**

| ID | Code | Name |
| --- | --- | --- |
| 1 | ADS | Administrative |
| 2 | CBS | Court/Board Secretaries |
| 3 | CSET | Clerical/Secretarial/Stenographic |
| 4 | EAS | Executive Assistance |
| 5 | EJLS | Executive/Judicial/Legislative Staff Assistance |
| 6 | HRM | Human Resource Management |
| 7 | RM | Records Management |
| 8 | SUM | Supply Management |

**Notable:** Group 30 under Service 3 = Information Technology.

### 5.10 `/qs/position-classes` — position classes

**Scope:** `qualification_standards` — **Total:** 2562

**Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `page` | integer | Default `1` |
| `per_page` | integer | Default `100`, max `1000` |
| `occupational_service_id` | integer | Classes of one service |
| `occupational_group_id` | integer | Classes of one group |
| `class_id` | string | Exact class ID |
| `salary_grade` | integer | Classes at one SG |
| `search` | string | Part of title (2–100 chars) |

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Position class ID |
| `occupational_service_id` | integer | Service |
| `occupational_group_id` | integer | Group |
| `class_id` | string | National code (e.g. `COMPRO1`) |
| `position_title` | string | Official title |
| `salary_grade` | integer | SG per national index |
| `source_pdf_page` | integer | Page in source DBM PDF |
| `for_deletion` | boolean | Marked for deletion in index |
| `needs_review` | boolean | Imported row awaiting review |

**Example — Computer Programmer I:**

```json
{
  "id": 419,
  "occupational_service_id": 3,
  "occupational_group_id": 30,
  "class_id": "COMPRO1",
  "position_title": "Computer Programmer I",
  "salary_grade": 11,
  "source_pdf_page": 23,
  "for_deletion": false,
  "needs_review": false
}
```

## 6. Salary grade markers above 33

`salary_grade` on `/employees` is a native field, but the source system also reuses the
column to tag employment types. Values above 33 are those tags, not payable grades.

Measured across all 3,203 active employees, 471 rows carry a grade above 33:

| `salary_grade` | Rows | `appointment_status` breakdown | Position titles |
| --- | ---: | --- | --- |
| **35** | 202 | 144 `OJT`, 42 `CONTRACT OF SERVICE`, 8 `PERMANENT`, 8 `CONSULTANT`, 5 `VOLUNTEER`, 3 `CASUAL`, 3 `TEMPORARY`, 1 `PERMANENT` | `SPES` 144, `NURSE` 38, `CONSULTANT` 8, `VOLUNTEER` 5, `PARTIME MEDICAL SPECIALIST` 3, 4 single medical/clerical titles |
| **36** | 8 | 8 `PERMANENT` | `MEDICAL SPECIALIST II (PART TIME)` 8 |
| **37** | 260 | 250 `JOB ORDER`, 4 `CONTRACT OF SERVICE`, 3 null, 1 `CASUAL`, 1 `OJT`, 1 `TEMPORARY` | `JOB ORDER EMPLOYEE` 260 |
| **40** | 1 | 1 `CONTRACT OF SERVICE` | `DATA ENCODER` 1 |

What this means in practice:

- **SG 37 is job order, cleanly.** All 260 rows are titled `JOB ORDER EMPLOYEE`, though
  10 sit under other appointment statuses, so the appointment field and the grade
  disagree on those.
- **SG 35 is not "SPES".** `SPES` is the largest single title (144 of 202) but the rest
  are nurses, consultants, volunteers and casual staff — treat 35 as a general
  non-plantilla flag, not a student-employment marker.
- **SG 36 is specific, not generic.** All 8 are part-time medical specialists and all
  are `PERMANENT`; its `/salary-grades` rates carry decimals (`32659.5`), consistent
  with a part-time arrangement.
- **SG 40 is almost certainly a data error**, not a fifth marker: one row, no
  `/salary-grades` entry, and a real title.

```php
// Guard before any salary lookup.
$grade = $employee['salary_grade'] ?? null;

$isPayableGrade = is_int($grade) && $grade >= 1 && $grade <= 33;
```

Looking a marker up in `/salary-grades` returns a real number — SG-37 step 1 is
₱13,530 and SG-35 step 1 is ₱20,000 — which would be reported as pay for a job-order
worker who has none. Rule the markers out first.

Grades 29, 33 and 34 appear in `/salary-grades` but no active employee holds them.

## 7. The two-masterlist problem

The API has **two separate position tables** describing the same domain from different systems:

| | `/positions` | `/qs/position-classes` |
| --- | --- | --- |
| **Owner** | La Union province | DBM (national) |
| **Key** | `pos_code` | `class_id` |
| **Total rows** | 661 | 2,562 |
| **Purpose** | Operational (what the province uses) | Reference (national standard) |
| **Source** | Provincial HR system | DBM Circular 2022-2 |

### They share no foreign key

```text
/positions              /qs/position-classes
   pos_code: 2B002         class_id: COMPRO1
        │                       │
        ✗ no shared key ✗       │
        │                       │
        └──── position_title ───┘
              "COMPUTER PROGRAMMER I"
```

**The only bridge is `position_title`.** There is no `class_id` on `/positions` and no
`pos_code` on `/qs/position-classes`.

### Observed correspondence

| Attribute | `/positions` (2B002) | `/qs/position-classes` (COMPRO1) | Match? |
| --- | --- | --- | --- |
| Title | COMPUTER PROGRAMMER I | Computer Programmer I | ✅ |
| SG | 11 | 11 | ✅ |
| Code | 2B002 | COMPRO1 | ❌ different systems |

**Finding:** La Union's position `2B002` maps to national class `COMPRO1`, and salary
grades align — the province follows national standards for this role.

### How to join the two tables

1. **Exact title match** — works when titles are standardized (as here)
2. **Fuzzy match** — when variations exist ("Computer Programmer 1" vs "I")
3. **Manual mapping table** — a maintained spreadsheet mapping `pos_code ↔ class_id`
4. **Case-insensitive comparison** — always normalize before matching

## 8. Data model & relationships

### Working links

```text
/departments ──dept_code──► /employees        ✅
/departments ──dept_code──► /divisions        ✅
/employees   ──dept_code──► /departments      ✅
/employees   ──pos_code───► /positions        ✅
/positions   ──salary_grade──► /salary-grades ✅
/employees   ──salary_grade──► /salary-grades ✅ (only for grades 1-33)
/qs/occupational-services ──id──► /qs/occupational-groups  ✅
/qs/occupational-groups   ──id──► /qs/position-classes     ✅
```

### Broken links

```text
/employees ──division_id──► /divisions   ❌ ALWAYS NULL
```

### Implicit links (title matching only)

```text
/positions.pos_name ↔ /qs/position-classes.position_title
```

### Full traversal graph

```text
                    /me
                     │
              /departments
             ┌───────┴───────┐
             │               │
          dept_code      dept_code
             │               │
        /divisions       /employees
                         │    │
                    pos_code  salary_grade
                         │    │
                  /positions  │
                         │    │
                    salary_grade
                         │    │
                  /salary-grades
                         │
                    (employee → position → grade → rate)
                    ⚠️ employee.salary_grade must be 1-33 to be payable

       /qs/sources
            │
            ▼
   /qs/occupational-services
            │
            ▼
   /qs/occupational-groups
            │
            ▼
   /qs/position-classes ◄── (matched by position_title, no key)
```

## 9. Real exploration paths

### Path 1: employee → department → position → salary

```text
1. GET /employees?pers_id=33085
   → dept_code=1022, pos_code=2B002

2. GET /departments?dept_code=1022
   → dept_ab=PICTO, short_name=PICTO

3. GET /positions?pos_code=2B002
   → salary_grade=11

4. GET /salary-grades?salary_grade=11
   → steps["1"]=30024, steps["8"]=32099
```

**Answer:** a Computer Programmer I at PICTO has a plantilla benchmark of
₱30,024–₱32,099/month (SG-11). Jasper's COS appointment doesn't show an SG, so his
actual contract rate is unknown.

### Path 2: employee → qualification standard tree

```text
1. GET /employees?pers_id=33085
   → position_title="COMPUTER PROGRAMMER I"

2. GET /qs/position-classes?search=Computer%20Programmer
   → class_id=COMPRO1, SG=11, service_id=3, group_id=30

3. GET /qs/occupational-groups?occupational_service_id=3
   → group 30 = Information Technology

4. GET /qs/occupational-services
   → service 3 = Planning Service
```

**Answer:** the role belongs to the national "Planning Service" family, IT group.

### Path 3: department → divisions → (dead end)

```text
1. GET /departments?dept_code=1007
   → Office of the Provincial Engineer

2. GET /divisions?dept_code=1007
   → 7 divisions (Administrative Unit, Construction Unit, ...)

3. GET /employees?dept_code=1007&per_page=500
   → 177 employees, all with division_id=null

→ Cannot assign employees to specific divisions.
```

## 10. Data quality issues found

| Issue | Endpoint | Detail |
| --- | --- | --- |
| `division_id` always null | `/employees` | Breaks employee → division link |
| `salary_grade` null on incomplete records | `/employees` | 62 active rows have both `salary_grade` and `position_title` null; 17 more have a null grade with a title |
| Grades above 33 used as markers | `/employees` | 471 active rows carry a type flag instead of a grade — see §6 |
| SG-40 has no salary schedule | `/employees` / `/salary-grades` | One `DATA ENCODER` row; grades stop at 37 |
| `step` above 8 | `/employees` | 30 rows at steps 11-15, unpaired with any grade in 24 of them |
| SG-31 step 1 typo | `/salary-grades` | Reads `14061` (SG-1 step 1); steps 2-8 are on-trend, so the grade is sound |
| SG-34 descending steps | `/salary-grades` | Step 1 `31282` > step 2 `7380.45`; no employee holds it |
| Null `dept_code` | `/employees` | Some employees have no office assigned |
| Null `position_title` | `/employees` | Some positions not populated |
| `effectivity_date` always null | `/salary-grades` | Schedule dates not tracked |
| National vs. LGU IOS mismatch | `/qs/sources` | Notes admit LGU index not loaded |

**Impact on LEAP:** the PS Breakdown needs each incumbent's salary grade **and step**
(`MockPersonnelData` today fabricates both). Under the current schema this is mostly
solvable — a grade of 1–33 plus a step resolves directly against `/salary-grades`.
The risk is no longer missing data but *wrong* data: a marker grade would resolve to a
real-looking rate. Of the 2,110 active employees the personnel schedule currently
lists, 2,068 (98%) hold a payable grade, 23 carry a marker, and 19 have no grade:

| Listed appointment | Grade 1–33 | Marker | No grade |
| --- | ---: | ---: | ---: |
| `PERMANENT` | 1392 | 16 | 11 |
| `CASUAL` | 556 | 2 | 0 |
| `COTERMINOUS` | 78 | 0 | 1 |
| `TEMPORARY` | 11 | 2 | 7 |
| `ELECTED` | 16 | 0 | 0 |
| `CONTRACTUAL` | 12 | 0 | 0 |
| `CONSULTANT` | 3 | 3 | 0 |

The rows with no payable grade still need a rate from somewhere else — a LEAP-side
allowance or a `contractual_rate` override — and the 23 marker rows must be excluded
before any lookup or they will read as ₱13,530–₱20,000 pay.

### What the personnel schedule shows today

The schedule renders `{grade}/{step}` (e.g. `11/3`, or just `15` with no step) into
**both** the current-year and budget-year columns, taken from the employee's own
`salary_grade` and `step`. The amount columns get the schedule's **monthly** rate for
that grade/step annualized (`× 12`), in both years as well, as a fixed 2-decimal
string. **Increase/Decrease** is the proposed amount less the current one, computed
rather than assumed — so it is `0.00` on every row today, because the two years carry
the same figure. Marker grades and missing grades render blank rather than as a bogus
grade or rate.

Rounding uses `round($monthly * 12, 2)` because a few rates carry decimals — SG-36 step 1
is `32659.5`, which annualizes to `391914.00` rather than a float artefact.

| Office | `dept_code` | Listed | Payable grade | Priced | Grade but no step |
| --- | --- | ---: | ---: | ---: | ---: |
| PICTO | `1022` | 32 | 32 | 32 | 0 |
| OPG | `1000` | 79 | 75 | 68 | 7 |
| BACSU | `1023` | 18 | 18 | 17 | 1 |

PICTO's 32 rows total ₱9,911,856.00 a year; OPG ₱24,813,180.00 and BACSU ₱4,616,280.00.

**A grade can render while its amount stays blank.** Two distinct cases, both
deliberately left blank rather than guessed:

- **No step.** 8 rows (7 in OPG, 1 in BACSU) are `CASUAL` at grade 1 with a null step.
  A grade has 8 rates, so there is nothing to resolve without the step.
- **No published rate for that step.** The schedule carries 8 steps for most grades but
  fewer for others (SG-33 has 2), and steps of 9+ pair with a real grade yet no rate.

A null on either year also leaves Increase/Decrease null — there is no difference to
report, which is different from reporting a zero difference.

**Steps above 8 are source-data errors, and none of them reach a schedule.** 28 listed
rows pair a payable grade with a step of 11–15 when a real grade has 8 steps — all 28
sit in `1048` (LUMC), which has no LEAP office, so no office schedule renders them.
They are rendered faithfully rather than capped: silently dropping a step on a pay form
would be worse than showing it, but they should be corrected upstream before LUMC is
mapped and these rows start appearing.

## 11. Practical query recipes

### Count permanent employees in one office

```text
GET /employees?dept_code=1012&appointment_status=PERMANENT&per_page=1
→ read meta.total
```

### Everyone in one office

```text
GET /employees?dept_code=1007&per_page=500
```

### Look up one employee

```text
GET /employees?pers_id=33085
```

### Find a department's divisions

```text
GET /divisions?dept_code=1007
```

### Find positions at a specific SG

```text
GET /positions?salary_grade=15
```

### Find a national class by title

```text
GET /qs/position-classes?search=Programmer
```

### Everyone hired recently

```text
GET /employees?updated_since=2026-09-01&per_page=500
```

## 12. Gotchas & rules of thumb

1. **`pers_id` is a string**, not an integer. Use `"33085"`, not `33085`.
2. **`per_page` max is 500 on `/employees`** but 1000 elsewhere. Don't mix them up.
3. **`appointment_status` is case-sensitive.** `permanent` won't match `PERMANENT`.
4. **`salary_grade` above 33 is a type marker, not a grade.** Filter to 1-33 before any salary lookup — see §6.
4b. **There is no `sg_step` field.** `salary_grade` and `step` are native; code that split `"11/3"` will break.
5. **`division_id` is dead.** Don't build features on it.
6. **Always check `data.length` vs `meta.total`** before claiming completeness.
7. **Filter first, paginate second.** Don't download 3203 rows when you need 5.
8. **To get a count, ask for `per_page=1`** and read `meta.total`.
9. **Two position tables exist.** `/positions` (local) and `/qs/position-classes`
   (national). Match by title.
10. **`search` needs 2+ characters** and must be URL-encoded (spaces → `%20`).
11. **`updated_since` is "best effort"** — not reliable for exact incremental syncs.
12. **`dept_code` may be null** on some employees. Handle gracefully.

## 13. Pagination reference

| Endpoint | Total | Pages at max `per_page` |
| --- | --- | --- |
| `/departments` | 41 | 1 (at 1000) |
| `/divisions` | 292 | 1 (at 1000) |
| `/positions` | 661 | 1 (at 1000) |
| `/salary-grades` | 37 | 1 (at 1000) |
| `/employees` | 3203 | 7 (at 500) |
| `/qs/sources` | 1 | 1 |
| `/qs/occupational-services` | 20 | 1 |
| `/qs/occupational-groups` | 211 | 1 (at 1000) |
| `/qs/position-classes` | 2562 | 3 (at 1000) |

## 14. Rate limits

**60 requests/minute** per token. At 60 req/min:

- Full `/employees` walk (7 requests at `per_page=500`) → ~7 seconds
- Full `/qs/position-classes` walk (3 requests) → ~3 seconds
- Full province aggregation → well within limit

**Rule:** if you loop through pages, add a small delay or trust the limit.
`WorkspaceApiClient` retries failed responses (including `429`) with the delay from
`WORKSPACE_RETRY_DELAY_MS`.

## 15. Office → department mapping

`/departments` is the only bridge between LEAP offices and the API. The office ↔ code
pairing is hardcoded in `App\Models\Office::DEPT_CODES` (keyed by `offices.id`) rather
than stored per row, because the codes are stable external identifiers that the app
never edits. `$office->deptCode()` returns the code, walking up `parent_id` so a
sub-unit reports its parent's code, and `Office::forDeptCode()` resolves back.

**Rule: only offices with no `parent_id` carry a code.** Sub-units (SDU, DMU, IINMU,
ASU under PICTO; AS, PS under BACSU) share their parent's department, which is also how
the API reports them. `POPS` and `PHB` are top-level with no upstream counterpart.

| Office | Acronym | `dept_code` | Office | Acronym | `dept_code` |
| ---: | --- | --- | ---: | --- | --- |
| 1 | OPG | `1000` | 20 | PHB | — |
| 2 | BACSU | `1023` | 21 | GAD | `923` |
| 3 | IASU | `1038` | 22 | PESO | `126` |
| 4 | SSU | `1035` | 23 | PYESDO | `747` |
| 5 | POPS | — | 24 | PSWDO | `1013` |
| 6 | LUPJ | `1036` | 25 | PHO | `1012` |
| 7 | OVG | `1001` | 26 | BDH | `1043` |
| 8 | OSP | `1002` | 27 | BalDH | `1044` |
| 9 | PTO | `1004` | 28 | CDH | `1045` |
| 10 | OPAss | `1005` | 29 | NDH | `1046` |
| 11 | OPAcc | `1006` | 30 | RDH | `1047` |
| 12 | PBO | `1008` | 31 | PCDO | `165` |
| 13 | OPPDC | `1009` | 32 | PEO | `1007` |
| 14 | PLO | `1010` | 33 | OPAg | `1015` |
| 15 | OPAdmin | `1011` | 34 | OPVet | `1016` |
| 16 | PGSO | `1014` | 35 | PG-ENRO | `1018` |
| 17 | PIO | `1021` | 36 | PDRRMO | `1041` |
| 18 | PICTO | `1022` | 37 | LUPTO | `1040` |
| 19 | PHRMDO | `1209` | 38 | LEEIPO | `1031` |

Codes do not mirror the acronyms: upstream abbreviates differently (`OVG` → `OPVG`,
`OPAss` → `OPAssessor`, `OPPDC` → `PPDC`, `PG-ENRO` → `PGENRO`), and `offices.code`
cannot hold these values — it is a locally-invented, non-unique ordinal that feeds
`Office::fullCode()`. Joining on `acronym` is therefore not an option.

### Upstream departments with no LEAP office

Five of the 41 departments resolve to nothing, and they hold 302 active employees:

| `dept_code` | `dept_ab` | `dept_name` | Active employees |
| --- | --- | --- | ---: |
| `1048` | LUMC | LA UNION MEDICAL CENTER | **289** |
| `1042` | PGLU SEF | PGLU SPECIAL EDUCATION FUND | 11 |
| `2010` | LUMC - MD | LUMC - MEDICAL DEPARTMENT | 2 |
| `2020` | LUMC - NS | LUMC - NURSING SERVICES | 0 |
| `2030` | LUMC - HOPPS | LUMC - HOSPITAL OPERATIONS AND PATIENT SUPPORT SERVICES | 0 |

LUMC is the province's main hospital and has no row in `offices` at all — 9% of active
employees cannot be attributed. It has no `OPG-` prefix, so upstream treats it as a
top-level department, not an OPG division. Its three sub-departments (`2010`/`2020`/`2030`)
are separate upstream departments rather than children, which is the opposite of how
LEAP nests sub-units, so they would need either child rows under LUMC or an explicit
"counts toward LUMC" override.

## 16. Summary

The PGLU Space Data API is a **read-only, paginated, scoped** REST API covering:

- **Organizational structure** — 41 departments, 292 divisions (divisions not linked
  to employees)
- **Positions** — 661 local + 2,562 national reference classes (no shared key; match
  by title)
- **Salaries** — 37 SG rows × 8 steps, 2025 schedule
- **Employees** — 3,203 records, active by default; 12 `appointment_status` values,
  11,083 records with `employment_status=all`
- **Qualifications** — full DBM IOS tree

**Known weaknesses:** `division_id` broken, grades above 33 doubling as employment-type
markers (471 active rows), `salary_grade` null on incomplete records, no LGU-specific
QS index, an SG-31 step-1 typo, and five departments — LUMC above all — with no LEAP
office, stranding 302 active employees.

**Strongest feature:** the consistent `{data, meta}` wrapper makes pagination and
scripting predictable across all endpoints.

**The key architectural insight:** two parallel masterlists (local + national) describe
the same domain without sharing keys. Bridging them requires title matching — an
inference, not a join.

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

> ⚠️ **Data quality issue:** SG-31 Step 1 shows `14061` — a value that belongs to SG-1.
> Likely a data entry error.

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
| `sg_step` | string, nullable | Raw `"grade/step"` e.g. `"11/3"` |
| `salary_grade` | integer, nullable | Parsed from `sg_step` |
| `step` | integer, nullable | Parsed from `sg_step` |
| `appointment_status` | string, nullable | See list below |
| `employment_status` | string | `A`, `I`, `D`, `R` |
| `dte_hired` | date, nullable | Date hired, as stored |
| `updated_at` | date-time, nullable | Last DB change |

**Appointment statuses observed:**

- `PERMANENT` — plantilla position
- `CASUAL`
- `JOB ORDER`
- `CONTRACT OF SERVICE`
- `COTERMINOUS` — tied to an official's term
- `ELECTED`
- `TEMPORARY`
- `OJT` — intern/trainee
- `SPES` — Special Program for Employment of Students

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
  "sg_step": null,
  "salary_grade": null,
  "step": null,
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

## 6. The two-masterlist problem

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

## 7. Data model & relationships

### Working links

```text
/departments ──dept_code──► /employees        ✅
/departments ──dept_code──► /divisions        ✅
/employees   ──dept_code──► /departments      ✅
/employees   ──pos_code───► /positions        ✅
/positions   ──salary_grade──► /salary-grades ✅
/employees   ──sg_step────► /salary-grades    ✅ (when sg_step present)
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
                    pos_code  sg_step
                         │    │
                  /positions  │
                         │    │
                    salary_grade
                         │    │
                  /salary-grades
                         │
                    (employee → position → grade → rate)

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

## 8. Real exploration paths

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

## 9. Data quality issues found

| Issue | Endpoint | Detail |
| --- | --- | --- |
| `division_id` always null | `/employees` | Breaks employee → division link |
| `sg_step` often null | `/employees` | Some PERMANENT employees missing SG data |
| Inconsistent `salary_grade` | `/employees` | Not purely tied to appointment type |
| SG-31 Step 1 anomaly | `/salary-grades` | `14061` (belongs to SG-1) |
| Null `dept_code` | `/employees` | Some employees have no office assigned |
| Null `position_title` | `/employees` | Some positions not populated |
| `effectivity_date` always null | `/salary-grades` | Schedule dates not tracked |
| National vs. LGU IOS mismatch | `/qs/sources` | Notes admit LGU index not loaded |

**Impact on LEAP:** the PS Breakdown needs each incumbent's salary grade **and step**
(`MockPersonnelData` today fabricates both). The API supplies `sg_step` only for
plantilla rows — COS, job order, and casual records arrive with `salary_grade` and
`step` null, so their pay rate has to come from somewhere else (a LEAP-side
allowance or a `contractual_rate` override).

## 10. Practical query recipes

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

## 11. Gotchas & rules of thumb

1. **`pers_id` is a string**, not an integer. Use `"33085"`, not `33085`.
2. **`per_page` max is 500 on `/employees`** but 1000 elsewhere. Don't mix them up.
3. **`appointment_status` is case-sensitive.** `permanent` won't match `PERMANENT`.
4. **`salary_grade` on employees is best-effort.** It's parsed from `sg_step`, which is often null.
5. **`division_id` is dead.** Don't build features on it.
6. **Always check `data.length` vs `meta.total`** before claiming completeness.
7. **Filter first, paginate second.** Don't download 3203 rows when you need 5.
8. **To get a count, ask for `per_page=1`** and read `meta.total`.
9. **Two position tables exist.** `/positions` (local) and `/qs/position-classes`
   (national). Match by title.
10. **`search` needs 2+ characters** and must be URL-encoded (spaces → `%20`).
11. **`updated_since` is "best effort"** — not reliable for exact incremental syncs.
12. **`dept_code` may be null** on some employees. Handle gracefully.

## 12. Pagination reference

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

## 13. Rate limits

**60 requests/minute** per token. At 60 req/min:

- Full `/employees` walk (7 requests at `per_page=500`) → ~7 seconds
- Full `/qs/position-classes` walk (3 requests) → ~3 seconds
- Full province aggregation → well within limit

**Rule:** if you loop through pages, add a small delay or trust the limit.
`WorkspaceApiClient` retries failed responses (including `429`) with the delay from
`WORKSPACE_RETRY_DELAY_MS`.

## 14. Summary

The PGLU Space Data API is a **read-only, paginated, scoped** REST API covering:

- **Organizational structure** — 41 departments, 292 divisions (divisions not linked
  to employees)
- **Positions** — 661 local + 2,562 national reference classes (no shared key; match
  by title)
- **Salaries** — 37 SG rows × 8 steps, 2025 schedule
- **Employees** — 3,203 records, active by default
- **Qualifications** — full DBM IOS tree

**Known weaknesses:** `division_id` broken, `sg_step` inconsistently populated, no
LGU-specific QS index, SG-31 data anomaly.

**Strongest feature:** the consistent `{data, meta}` wrapper makes pagination and
scripting predictable across all endpoints.

**The key architectural insight:** two parallel masterlists (local + national) describe
the same domain without sharing keys. Bridging them requires title matching — an
inference, not a join.

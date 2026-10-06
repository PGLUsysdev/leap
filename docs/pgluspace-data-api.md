# PGLU Space Data API — reference

Read-only data API for the Provincial Government of La Union (PGLU) Space platform.
Reference for endpoints, auth, pagination, and response shapes.

For what the data actually looks like — observed values, relationship map, data quality
issues, and query recipes — see [pgluspace-data-exploration.md](pgluspace-data-exploration.md).

## Base URL

```text
https://api-workspace.launion.gov.ph/api/data/v1
```

## Authentication

All endpoints require a bearer token:

```http
Authorization: Bearer $PGLUSPACE_DATA_TOKEN
Accept: application/json
```

> In LEAP the token lives in `.env` as `WORKSPACE_TOKEN`, with the base URL as
> `WORKSPACE_BASE_URL`. `config/services.php` reads both and
> `App\Services\WorkspaceApiClient` sends them — use the client rather than raw
> `curl` in app code. The `$PGLUSPACE_DATA_TOKEN` name below is the vendor's
> own example and is not read by this app.

Use `GET /me` to inspect the token's name, prefix, scopes, rate limit, and expiry.

---

## Common conventions

### Pagination

List endpoints accept:

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`. Max varies by endpoint. |

### List response wrapper

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

### Scopes

Available scopes observed:

- `departments`
- `divisions`
- `positions`
- `salary_grades`
- `employees`
- `qualification_standards`

---

## Endpoint summary

| Method | Endpoint | Required scope | Purpose |
| --- | --- | --- | --- |
| GET | `/me` | Any valid token | Token details and connection test |
| GET | `/departments` | `departments` | Provincial offices |
| GET | `/divisions` | `divisions` | Divisions under offices |
| GET | `/positions` | `positions` | Position masterlist |
| GET | `/salary-grades` | `salary_grades` | Salary schedule by grade and step |
| GET | `/employees` | `employees` | Employee records |
| GET | `/qs/sources` | `qualification_standards` | Qualification standards sources |
| GET | `/qs/occupational-services` | `qualification_standards` | Occupational services |
| GET | `/qs/occupational-groups` | `qualification_standards` | Occupational groups |
| GET | `/qs/position-classes` | `qualification_standards` | Position classes |

---

## 1. GET `/me`

Returns information about the token making the request. Use it to test a connection.

**Scope:** Any valid token
**Parameters:** None

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/me"
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `name` | string, nullable | Token name given by administrator. |
| `token_prefix` | string, nullable | First characters of token; identifies it without revealing it. |
| `scopes` | array, nullable | Resources this token may read. |
| `rate_limit_per_minute` | integer, nullable | Requests allowed per minute. |
| `expires_at` | string, date-time, nullable | When token stops working; `null` if it does not expire. |

### Example response

```json
{
  "data": {
    "name": "LEAP",
    "token_prefix": "pdapi_s8NJmncT",
    "scopes": [
      "departments",
      "divisions",
      "positions",
      "salary_grades",
      "employees",
      "qualification_standards"
    ],
    "rate_limit_per_minute": 60,
    "expires_at": "2027-01-03T10:29:07+08:00"
  }
}
```

---

## 2. GET `/departments`

Provincial offices.

**Scope:** `departments`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `dept_code` | string | Exact office code. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Department ID. |
| `dept_code` | string, nullable | Office code; employees and divisions refer to it. |
| `dept_name` | string, nullable | Full office name. |
| `dept_ab` | string, nullable | Abbreviation, e.g. `PICTO`. |
| `short_name` | string, nullable | Short display name. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/departments"
```

### Example response

```json
{
  "data": [
    {
      "id": 414,
      "dept_code": "1000",
      "dept_name": "OFFICE OF THE PROVINCIAL GOVERNOR",
      "dept_ab": "OPG",
      "short_name": "Provincial Governor"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 41,
    "last_page": 1
  }
}
```

---

## 3. GET `/divisions`

Divisions under each office.

**Scope:** `divisions`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `dept_code` | string | Divisions of one office. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Division ID; `employees.division_id` refers to it. |
| `dept_code` | string, nullable | Office the division belongs to. |
| `name` | string, nullable | Division name. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/divisions"
```

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "dept_code": "1000",
      "name": "ADMINISTRATIVE DIVISION"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 292,
    "last_page": 3
  }
}
```

---

## 4. GET `/positions`

Position masterlist.

**Scope:** `positions`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `pos_code` | string | Exact position code. |
| `salary_grade` | integer | Positions at one salary grade. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Position ID. |
| `pos_code` | string, nullable | Position code; `employees.pos_code` refers to it. |
| `pos_name` | string, nullable | Position title. |
| `short_name` | string, nullable | Short title. |
| `salary_grade` | integer, nullable | Salary grade of the position. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/positions"
```

### Example response

```json
{
  "data": [
    {
      "id": 304,
      "pos_code": "12313",
      "pos_name": "ACCOUNTANT I",
      "short_name": null,
      "salary_grade": 12
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 661,
    "last_page": 7
  }
}
```

---

## 5. GET `/salary-grades`

Monthly rate for each salary grade and step.

**Scope:** `salary_grades`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `year` | integer | Schedule year. |
| `salary_grade` | integer | One salary grade. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Row ID. |
| `salary_grade` | integer, nullable | Salary grade. |
| `year` | integer, nullable | Schedule year. |
| `effectivity_date` | string, date, nullable | Date the schedule took effect. |
| `steps` | object, nullable | Monthly rate keyed by step number, e.g. `{"1": 14061, "2": 14164}`. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/salary-grades"
```

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "salary_grade": 1,
      "year": 2025,
      "effectivity_date": null,
      "steps": {
        "1": 14061,
        "2": 14164,
        "3": 14278,
        "4": 14393,
        "5": 14509,
        "6": 14626,
        "7": 14743,
        "8": 14862
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 37,
    "last_page": 1
  }
}
```

---

## 6. GET `/employees`

Employees with their office, division, position, and appointment.

> Active employees only unless `employment_status` says otherwise.
> Birth, contact, address, government-ID, and pay-amount fields are never exposed.

**Scope:** `employees`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `500`. |
| `employment_status` | string | `A` active, default; `I` inactive; `D` old file; `R`; or `all`. |
| `dept_code` | string | Employees of one office. |
| `appointment_status` | string | Comma-separated, e.g. `PERMANENT,CASUAL`. |
| `pers_id` | string | One employee. |
| `updated_since` | string | Date or date-time; rows changed since then, best effort. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `pers_id` | string, nullable | Employee ID number. |
| `last_name` | string, nullable | Last name. |
| `first_name` | string, nullable | First name. |
| `middle_name` | string, nullable | Middle name. |
| `name_ext` | string, nullable | Name extension, e.g. `JR.` |
| `full_name` | string, nullable | Full name as recorded. |
| `dept_code` | string, nullable | Office code. |
| `dept_name` | string, nullable | Office name. |
| `division_id` | integer, nullable | Division ID, when assigned. |
| `division_name` | string, nullable | Division name, when assigned. |
| `pos_code` | string, nullable | Position code. |
| `position_title` | string, nullable | Position title. |
| `sg_step` | string, nullable | Salary grade and step as recorded, e.g. `"11/8"`. |
| `salary_grade` | integer, nullable | Salary grade parsed from `sg_step`. |
| `step` | integer, nullable | Step parsed from `sg_step`. |
| `appointment_status` | string, nullable | e.g. `PERMANENT`, `CASUAL`, `JOB ORDER`. |
| `employment_status` | string, nullable | `A` active, `I` inactive, `D` old file, `R`. |
| `dte_hired` | string, date, nullable | Date hired, exactly as stored. |
| `updated_at` | string, date-time, nullable | When record last changed. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/employees"
```

### Example response

```json
{
  "data": [
    {
      "pers_id": "32136",
      "last_name": "ABA",
      "first_name": "JERICHO LAWRENCE",
      "middle_name": "ESTANDIAN",
      "name_ext": null,
      "full_name": "ABA JERICHO LAWRENCE ESTANDIAN",
      "dept_code": "1040",
      "dept_name": "LA UNION PROVINCIAL TOURISM OFFICE",
      "division_id": null,
      "division_name": null,
      "pos_code": "95613",
      "position_title": "JOB ORDER EMPLOYEE",
      "sg_step": null,
      "salary_grade": null,
      "step": null,
      "appointment_status": "JOB ORDER",
      "employment_status": "A",
      "dte_hired": "2023-06-01",
      "updated_at": "2026-05-12T08:11:06+08:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 3203,
    "last_page": 33
  }
}
```

---

# Qualification Standards (`qsdb`)

These endpoints require scope `qualification_standards`.

---

## 7. GET `/qs/sources`

Issuances the Index of Occupational Services was taken from, e.g. DBM Budget Circular No. 2018-4.

**Scope:** `qualification_standards`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Source ID. |
| `reference_no` | string, nullable | Issuance reference number. |
| `title` | string, nullable | Issuance title. |
| `issuer` | string, nullable | Issuing agency. |
| `issue_date` | string, date, nullable | Date issued. |
| `notes` | string, nullable | Notes on how the data was taken. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/qs/sources"
```

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "reference_no": "DBM Budget Circular No. 2022-2",
      "title": "Index of Occupational Services, Occupational Groups, Classes and Salary Grades, CY 2022 Edition",
      "issuer": "Department of Budget and Management",
      "issue_date": "2022-04-05",
      "notes": "Parsed from uploaded CY 2022 Volumes I-III; ..."
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 1,
    "last_page": 1
  }
}
```

---

## 8. GET `/qs/occupational-services`

Top level of the Index of Occupational Services.

**Scope:** `qualification_standards`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `source_id` | integer | Services from one source. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Service ID. |
| `source_id` | integer, nullable | Source the service comes from. |
| `service_code` | string, nullable | Service code. |
| `service_name` | string, nullable | Service name. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/qs/occupational-services"
```

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "source_id": 1,
      "service_code": "01-GA",
      "service_name": "GENERAL ADMINISTRATIVE SERVICE"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 20,
    "last_page": 1
  }
}
```

---

## 9. GET `/qs/occupational-groups`

Groups within each occupational service.

**Scope:** `qualification_standards`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `occupational_service_id` | integer | Groups of one service. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Group ID. |
| `occupational_service_id` | integer, nullable | Service the group belongs to. |
| `group_code` | string, nullable | Group code. |
| `group_name` | string, nullable | Group name. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/qs/occupational-groups"
```

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "occupational_service_id": 1,
      "group_code": "ADS",
      "group_name": "Administrative"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 211,
    "last_page": 3
  }
}
```

---

## 10. GET `/qs/position-classes`

Position classes with their salary grade, from the Index of Occupational Services.

**Scope:** `qualification_standards`

### Query parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `page` | integer | Page number. Default `1`. |
| `per_page` | integer | Rows per page. Default `100`, max `1000`. |
| `occupational_service_id` | integer | Classes of one service. |
| `occupational_group_id` | integer | Classes of one group. |
| `class_id` | string | Exact class ID, e.g. `ADA1`. |
| `salary_grade` | integer | Classes at one salary grade. |
| `search` | string | Part of the position title, 2–100 characters. |

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | integer | Position class ID. |
| `occupational_service_id` | integer, nullable | Service. |
| `occupational_group_id` | integer, nullable | Group. |
| `class_id` | string, nullable | Class ID. |
| `position_title` | string, nullable | Position title. |
| `salary_grade` | integer, nullable | Salary grade. |
| `source_pdf_page` | integer, nullable | Page of the source issuance. |
| `for_deletion` | boolean, nullable | Marked for deletion in the index. |
| `needs_review` | boolean, nullable | Imported row still awaiting review. |

```bash
curl -H "Authorization: Bearer $PGLUSPACE_DATA_TOKEN" \
     -H "Accept: application/json" \
     "https://api-workspace.launion.gov.ph/api/data/v1/qs/position-classes"
```

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "occupational_service_id": 1,
      "occupational_group_id": 1,
      "class_id": "ADA1",
      "position_title": "Administrative Aide I",
      "salary_grade": 1,
      "source_pdf_page": 2,
      "for_deletion": false,
      "needs_review": false
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 2562,
    "last_page": 26
  }
}
```

---

## Notes

- All list endpoints return `{ "data": [...], "meta": { ... } }`.
- `/me` returns `{ "data": { ... } }` without `meta`.
- Rate limit is per token and exposed by `/me`, e.g. `60` requests per minute.
- Token expiry is exposed by `/me` as `expires_at`; `null` means it does not expire.
- Employee privacy: birth, contact, address, government-ID, and pay-amount fields are never exposed.

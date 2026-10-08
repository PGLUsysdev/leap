# PPMP Price List API — v1

Partner-facing documentation for read-only access to the PPMP Price List catalog.

---

## Overview

This API provides read-only access to the PPMP (Philippine Procurement Management Plan) price list catalog. It is intended for authorized partner systems only. Access is granted per-account, scoped to the `read:procurement` ability, and rate-limited per token.

**Current version:** `v1`
**Protocol:** HTTPS only (production)
**Format:** JSON (`application/json`)

---

## Base URL

| Environment         | Base URL                                    |
| ------------------- | ------------------------------------------- |
| Production          | `https://your-domain.gov.ph/api/v1`         |
| Staging             | `https://staging.your-domain.gov.ph/api/v1` |
| Local (development) | `http://127.0.0.1:8000/api/v1`              |

All endpoints below are relative to the base URL.

---

## Authentication

Every request must include a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

Additionally, always send the `Accept` header:

```
Accept: application/json
```

> ⚠️ **Important:** The `Accept: application/json` header is required. Without it, error responses may be returned in HTML format instead of JSON.

### Token format

Tokens look like:

```
2|lnpv0t5nIy3xSVURSFSP4Ra1l2VY6ozJjmfpU3We1a7f9d3c
```

The `2|` prefix is the token's internal ID separator — **include it** in the header. Do not trim it.

### Token scope

Your token is scoped to specific abilities. For this API, the token must include:

```
read:procurement
```

If your token lacks this scope, all requests return `403 Forbidden`.

### Token expiry

Tokens are issued with a fixed expiry (typically 1 year). You will receive the expiry date along with your token. Before it expires, contact us to request a new one — do not wait until the last day.

### Revoking a token

If a token is lost, compromised, or no longer needed, contact us to revoke it immediately. Revocation takes effect on the next request.

---

## Rate limiting

| Limit               | Value     |
| ------------------- | --------- |
| Requests per minute | 120       |
| Scope               | Per token |

Rate-limit information is included in every response header:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
```

If you exceed the limit, you receive:

```json
HTTP/1.1 429 Too Many Requests

{
  "message": "Rate limit exceeded. Try again later."
}
```

**Recommendation:** Implement exponential backoff in your client. If you expect to exceed 120 requests/minute, contact us — we can raise your limit.

---

## Endpoints

### 1. List price list items

```
GET /ppmp-price-lists
```

Returns a paginated list of price list items, sorted by `sort_order` ascending by default.

#### Query parameters

| Name                                | Type     | Default      | Description                                                       |
| ----------------------------------- | -------- | ------------ | ----------------------------------------------------------------- |
| `page`                              | integer  | `1`          | Page number                                                       |
| `per_page`                          | integer  | `50`         | Items per page (min 1, max 200)                                   |
| `ppmp_category_id`                  | integer  | —            | Filter by PPMP category ID                                        |
| `chart_of_account_id`               | integer  | —            | Filter by chart of account ID                                     |
| `chart_of_account_ppmp_category_id` | integer  | —            | Filter by internal COA–category pair ID                           |
| `search`                            | string   | —            | Case-insensitive substring match on `description` (max 100 chars) |
| `min_price`                         | decimal  | —            | Minimum price (inclusive)                                         |
| `max_price`                         | decimal  | —            | Maximum price (inclusive)                                         |
| `updated_since`                     | ISO 8601 | —            | Return only items updated at or after this timestamp              |
| `sort`                              | string   | `sort_order` | Sort column (see below)                                           |

#### Sortable columns

Prefix with `-` for descending order:

- `id`
- `item_number`
- `sort_order`
- `description`
- `price`
- `unit_of_measurement`
- `updated_at`

Unknown columns fall back to `sort_order` silently (no error).

#### Example requests

**Basic list:**

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer 2|lnpv0t5nIy3xSVURSFSP4Ra1l2VY6ozJjmfpU3We1a7f9d3c" \
     "https://your-domain.gov.ph/api/v1/ppmp-price-lists"
```

**Filter by category and COA:**

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer <your-token>" \
     "https://your-domain.gov.ph/api/v1/ppmp-price-lists?ppmp_category_id=330&chart_of_account_id=2240"
```

**Search and sort descending by price:**

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer <your-token>" \
     "https://your-domain.gov.ph/api/v1/ppmp-price-lists?search=pad&sort=-price&per_page=20"
```

**Incremental sync — everything changed since a date:**

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer <your-token>" \
     "https://your-domain.gov.ph/api/v1/ppmp-price-lists?updated_since=2026-10-01T00:00:00Z&per_page=200"
```

#### Response

```json
{
    "data": [
        {
            "id": 12926,
            "item_number": 1,
            "sort_order": 1,
            "description": "Accountable Forms #51 - Official Receipt w/ La Union & RP Seal",
            "unit_of_measurement": "pad",
            "price": "148.00",
            "chart_of_account": {
                "id": 2240,
                "account_number": "020",
                "account_title": "Accountable Forms Expenses",
                "path": "5-02-03-020"
            },
            "ppmp_category": {
                "id": 330,
                "name": "ACCOUNTABLE FORMS",
                "is_non_procurement": false,
                "is_additional": false
            },
            "updated_at": "2026-09-23T00:48:01+00:00"
        }
    ],
    "links": {
        "first": "https://your-domain.gov.ph/api/v1/ppmp-price-lists?page=1",
        "last": "https://your-domain.gov.ph/api/v1/ppmp-price-lists?page=66",
        "prev": null,
        "next": "https://your-domain.gov.ph/api/v1/ppmp-price-lists?page=2"
    },
    "meta": {
        "current_page": 1,
        "per_page": 50,
        "total": 3284,
        "last_page": 66
    }
}
```

---

### 2. Get a single price list item

```
GET /ppmp-price-lists/{id}
```

Returns a single item by its ID.

#### Path parameters

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| `id` | integer | The item's unique ID |

#### Example request

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer <your-token>" \
     "https://your-domain.gov.ph/api/v1/ppmp-price-lists/12926"
```

#### Response

```json
{
    "data": {
        "id": 12926,
        "item_number": 1,
        "sort_order": 1,
        "description": "Accountable Forms #51 - Official Receipt w/ La Union & RP Seal",
        "unit_of_measurement": "pad",
        "price": "148.00",
        "chart_of_account": {
            "id": 2240,
            "account_number": "020",
            "account_title": "Accountable Forms Expenses",
            "path": "5-02-03-020"
        },
        "ppmp_category": {
            "id": 330,
            "name": "ACCOUNTABLE FORMS",
            "is_non_procurement": false,
            "is_additional": false
        },
        "updated_at": "2026-09-23T00:48:01+00:00"
    }
}
```

---

## Field reference

| Field                              | Type       | Notes                                                           |
| ---------------------------------- | ---------- | --------------------------------------------------------------- |
| `id`                               | integer    | Stable unique identifier. Never changes.                        |
| `item_number`                      | integer    | Display number (matches `sort_order` for the current UI)        |
| `sort_order`                       | integer    | Position in the catalog                                         |
| `description`                      | string     | Item description                                                |
| `unit_of_measurement`              | string     | Unit (e.g. `pc`, `pad`, `box`, `kg`)                            |
| `price`                            | **string** | Money value. **Always a string** — parse as decimal, not float. |
| `chart_of_account.id`              | integer    | Internal COA ID                                                 |
| `chart_of_account.account_number`  | string     | COA account number                                              |
| `chart_of_account.account_title`   | string     | COA display title                                               |
| `chart_of_account.path`            | string     | Hierarchical path (e.g. `5-02-03-020`)                          |
| `ppmp_category.id`                 | integer    | Internal category ID                                            |
| `ppmp_category.name`               | string     | Category display name                                           |
| `ppmp_category.is_non_procurement` | boolean    | True for non-procurement sentinel items                         |
| `ppmp_category.is_additional`      | boolean    | True for "additional items" sentinel items                      |
| `updated_at`                       | string     | ISO 8601 with timezone (UTC)                                    |

### ⚠️ Money formatting

`price` is returned as a **string**, not a number, to preserve decimal precision. In your client:

- ✅ Parse as `decimal` / `BigDecimal` / `numeric`
- ❌ Do not parse as `float` / `double` — you will lose precision

Example (JavaScript):

```js
// ❌ Wrong
const price = parseFloat(item.price); // 148 (fine here, but not always)

// ✅ Right
const price = new Decimal(item.price); // exact
```

### ⚠️ Timestamps

All timestamps are ISO 8601 with timezone, in UTC:

```
2026-09-23T00:48:01+00:00
```

Parse them as timezone-aware datetimes. Do not assume the server's local timezone.

---

## Error responses

All errors return JSON with a `message` field.

| Status                      | Meaning                                           | Example body                                                                    |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `401 Unauthorized`          | Missing or invalid token                          | `{"message":"Unauthenticated."}`                                                |
| `403 Forbidden`             | Valid token, but missing `read:procurement` scope | `{"message":"Invalid ability provided."}`                                       |
| `404 Not Found`             | Item ID does not exist                            | `{"message":"No query results for model [App\\Models\\PpmpPriceList] 999999."}` |
| `422 Unprocessable Entity`  | Invalid query parameter                           | See validation example below                                                    |
| `429 Too Many Requests`     | Rate limit exceeded                               | `{"message":"Rate limit exceeded. Try again later."}`                           |
| `500 Internal Server Error` | Server-side error                                 | `{"message":"Server Error"}`                                                    |

### Validation error example (422)

Request:

```
GET /ppmp-price-lists?per_page=999
```

Response:

```json
HTTP/1.1 422 Unprocessable Entity

{
  "message": "The per page field must not be greater than 200. (and 1 more error)",
  "errors": {
    "per_page": [
      "The per page field must not be greater than 200."
    ]
  }
}
```

---

## Incremental sync pattern

For systems that mirror the catalog, use `updated_since`:

**Initial sync (one time):**

```
GET /ppmp-price-lists?per_page=200&page=1
GET /ppmp-price-lists?per_page=200&page=2
... continue until page == last_page
```

**Periodic sync (e.g. hourly):**

```
GET /ppmp-price-lists?updated_since=<last_sync_timestamp>&per_page=200&page=1
... paginate as needed
```

Store the latest `updated_at` from the response as your new sync checkpoint.

**Notes:**

- `updated_since` is inclusive
- The result includes both new and modified items
- Deletions are not currently propagated via this API — plan for a periodic full sync to detect removed items

---

## Best practices

1. **Always send both headers** — `Accept: application/json` and `Authorization: Bearer ...`
2. **Cache aggressively** — the catalog changes infrequently. Store responses locally; only refetch when your cache is stale or on your sync schedule.
3. **Paginate responsibly** — use `per_page=200` for full syncs (fewer requests), `per_page=20` for UI-driven fetches (faster first paint).
4. **Handle rate limits** — implement exponential backoff on 429. Do not retry immediately.
5. **Respect money as strings** — parse decimals, not floats.
6. **Store tokens securely** — in environment variables or a secrets manager, never in source code or git.
7. **Monitor for 401s** — if you start seeing 401s, your token may have been revoked or expired. Contact us.
8. **Log requests** — keep a record of what you called and when, to help us help you debug.

---

## Changelog

| Version | Date       | Changes                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------- |
| `v1`    | 2026-10-08 | Initial release — `GET /ppmp-price-lists`, `GET /ppmp-price-lists/{id}` |

Future changes to `v1` will be additive only (new optional fields, new query parameters). Breaking changes will be published under `/v2/` with at least 6 months' notice.

---

## Support

| Channel          | Contact                          |
| ---------------- | -------------------------------- |
| Technical issues | `api-support@your-domain.gov.ph` |
| Token revocation | `api-support@your-domain.gov.ph` |
| Escalation       | `it-head@your-domain.gov.ph`     |

When reporting an issue, include:

- The exact request (URL + method + headers minus the token value)
- The response you received
- The timestamp (UTC)

---

## Appendix — Common scenarios

### Build a two-dropdown filter UI

1. Fetch categories: _(endpoint not yet available — coming in a future release)_
2. User picks a category → fetch COAs for that category
3. User picks a COA → `GET /ppmp-price-lists?ppmp_category_id=<id>&chart_of_account_id=<id>`

### Download the full catalog

```bash
for page in $(seq 1 66); do
  curl -s -H "Accept: application/json" \
       -H "Authorization: Bearer $TOKEN" \
       "https://your-domain.gov.ph/api/v1/ppmp-price-lists?per_page=200&page=$page" \
       > "pricelist-page-$page.json"
done
```

### Nightly incremental sync

```bash
curl -s -H "Accept: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     "https://your-domain.gov.ph/api/v1/ppmp-price-lists?updated_since=$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)&per_page=200" \
     > nightly-sync.json
```

---

_Document version: 1.0 — Last updated: 2026-10-08_

# API

All responses use `{ success, data, error }`. API prefix: `/api/v1`. Requests that change state require the guest cookie; the server sets it automatically and validates the request origin.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/mysteries` | Validate and synchronously generate a mystery |
| GET | `/mysteries` | Paginated session-owned history |
| GET | `/mysteries/:id` | Public case DTO; solution omitted until closed |
| GET | `/mysteries/:id/evidence?type=message` | Evidence list, optionally filtered |
| GET | `/mysteries/:id/evidence/:evidenceId` | Evidence detail |
| PATCH | `/mysteries/:id/progress` | Reviewed evidence, private notes, flagged suspects |
| POST | `/mysteries/:id/accusation` | One atomic final accusation; then reveals solution |
| POST | `/mysteries/:id/reveal-solution` | Explicitly abandon and reveal, without a wrong guess |

Creation accepts `scenario` (20–3000 characters), `difficulty`, `suspectCount` (3–6), and `evidencePreferences`. Unsupported fields are rejected. Errors have stable `error.code` values and do not include internal provider details.

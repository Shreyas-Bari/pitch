# PITCH API Specification --- Final v2

## 1. Contract rules

Base path:

``` text
/api/v1
```

Use: - JSON for normal requests/responses. - ISO 8601 timestamps. -
Opaque string IDs. - Standard HTTP status codes. - Pagination on list
endpoints. - Centralized frontend API client. - Backend validation and
authorization on every protected endpoint.

Money must use a documented integer representation with
`currency: "INR"` and no floating-point arithmetic.

## 2. Authentication

``` http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me

POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
PATCH /api/v1/auth/change-password
```

Authentication strategy: - Short-lived access token. - Secure HttpOnly
refresh token. - Do not store long-lived auth tokens in localStorage. -
Centralized API interceptor attaches the access token. - On 401, refresh
once; if refresh fails, clear auth state and redirect to login. - Never
create refresh loops.

Shared authenticated user endpoint:

``` http
GET /api/v1/users/me
PATCH /api/v1/users/me
DELETE /api/v1/users/me
```

## 3. Companies and committees

``` http
GET   /api/v1/companies
GET   /api/v1/companies/:companyId
PATCH /api/v1/companies/me

GET   /api/v1/companies/me/history
POST  /api/v1/companies/me/history
PATCH /api/v1/companies/me/history/:historyId
DELETE /api/v1/companies/me/history/:historyId

GET   /api/v1/companies/:companyId/reviews
GET   /api/v1/companies/:companyId/verified-history

GET   /api/v1/committees
GET   /api/v1/committees/:committeeId
PATCH /api/v1/committees/me

GET   /api/v1/committees/me/history
GET   /api/v1/committees/:committeeId/reviews
GET   /api/v1/committees/:committeeId/verified-history
```

Self-reported history is editable by its owner. Verified history is
system-generated from completed PITCH deals and cannot be manually
edited.

## 4. Events

``` http
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/:eventId
PATCH  /api/v1/events/:eventId
DELETE /api/v1/events/:eventId

POST   /api/v1/events/:eventId/publish
POST   /api/v1/events/:eventId/unpublish
POST   /api/v1/events/:eventId/archive

GET    /api/v1/committees/me/events

POST   /api/v1/events/:eventId/media
DELETE /api/v1/events/:eventId/media/:mediaId
```

Only committees create events. Only the owning committee can edit/manage
its events. Public discovery exposes only published public events.

Supported list parameters:

``` text
?page=1&limit=20
?search=
?sort=
?order=
?status=
?category=
?location=
?eventType=
```

## 5. Sponsorship packages

``` http
GET    /api/v1/events/:eventId/packages
POST   /api/v1/events/:eventId/packages
PATCH  /api/v1/packages/:packageId
DELETE /api/v1/packages/:packageId
```

Packages are offers, not final agreements.

## 6. Saved events

``` http
GET    /api/v1/users/me/saved-events
POST   /api/v1/events/:eventId/save
DELETE /api/v1/events/:eventId/save
```

Duplicate save returns a predictable conflict or idempotent success.

## 7. Search and recommendations

``` http
GET /api/v1/search
GET /api/v1/recommendations/events
GET /api/v1/recommendations/companies
```

v1 recommendations are deterministic.

Signals: - Industry - Event category - Audience - Location - Budget -
Sponsorship interests

Matching score remains: - Category 25% - Audience 25% - Budget 20% -
Location 15% - Event type 15%

No ML requirement.

## 8. Applications

``` http
POST  /api/v1/events/:eventId/applications
GET   /api/v1/events/:eventId/applications
GET   /api/v1/applications
GET   /api/v1/applications/:applicationId
PATCH /api/v1/applications/:applicationId

POST  /api/v1/applications/:applicationId/accept
POST  /api/v1/applications/:applicationId/reject
POST  /api/v1/applications/:applicationId/withdraw
```

Rules: - Company only for submission. - Event must be PUBLISHED. - One
active application per company/event. - Owning committee manages
applications. - Acceptance can establish mutual interest.

## 9. Invitations

``` http
POST /api/v1/events/:eventId/invitations
GET  /api/v1/invitations
GET  /api/v1/invitations/:invitationId
POST /api/v1/invitations/:invitationId/accept
POST /api/v1/invitations/:invitationId/decline
POST /api/v1/invitations/:invitationId/cancel
```

Committee sends. Company accepts/declines.

## 10. Conversations and chat

``` http
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:conversationId
GET    /api/v1/conversations/:conversationId/messages
POST   /api/v1/conversations/:conversationId/messages
PATCH  /api/v1/messages/:messageId
DELETE /api/v1/messages/:messageId
POST   /api/v1/conversations/:conversationId/read
POST   /api/v1/conversations/:conversationId/archive
```

Chat is a business workspace, not a WhatsApp replacement.

Only eligible parties can communicate.

Socket.IO handles realtime delivery; REST remains authoritative
persistence.

Socket events:

``` text
conversation:join
conversation:leave
message:send
message:new
message:read
typing:start
typing:stop
```

## 11. Contact sharing

``` http
POST /api/v1/conversations/:conversationId/contact-share
GET  /api/v1/conversations/:conversationId/contact-shares
```

Only eligible participants after mutual interest can share contact
details.

## 12. Deals

``` http
POST  /api/v1/deals
GET   /api/v1/deals
GET   /api/v1/deals/:dealId
PATCH /api/v1/deals/:dealId

GET   /api/v1/deals/:dealId/timeline
POST  /api/v1/deals/:dealId/cancel

POST  /api/v1/deals/:dealId/agree
GET   /api/v1/deals/:dealId/agreement
```

A deal can be created from an accepted application or invitation.

Deal state machine:

``` text
INTERESTED
→ DISCUSSION
→ NEGOTIATING
→ PROPOSAL
→ COUNTER_PROPOSAL
→ AGREED
→ MOU_DRAFT
→ AWAITING_SIGNATURES
→ PARTIALLY_SIGNED
→ EXECUTED
→ FULFILLMENT
→ COMPLETED
```

Exception states: `DECLINED`, `CANCELLED`, `DISPUTED`, `EXPIRED`.

Backend rejects invalid transitions with `409 Conflict`.

`AGREED` means commercial terms are accepted. It does not mean the
agreement is executed.

## 13. Proposals

``` http
GET  /api/v1/deals/:dealId/proposals
POST /api/v1/deals/:dealId/proposals
GET  /api/v1/proposals/:proposalId

POST /api/v1/proposals/:proposalId/counter
POST /api/v1/proposals/:proposalId/accept
POST /api/v1/proposals/:proposalId/decline
POST /api/v1/proposals/:proposalId/withdraw
```

Proposals contain structured contributions, benefits, obligations,
delivery requirements and terms.

Counter-proposals create new immutable proposal versions.

## 14. MoU

``` http
POST /api/v1/deals/:dealId/mou
GET  /api/v1/deals/:dealId/mou

GET  /api/v1/mous/:mouId
GET  /api/v1/mous/:mouId/preview
GET  /api/v1/mous/:mouId/download
POST /api/v1/mous/:mouId/versions
GET  /api/v1/mous/:mouId/versions
GET  /api/v1/mous/:mouId/versions/:versionId
```

MoU generation is template-driven.

A signed version is immutable. Changes require a new proposal and new
MoU version.

## 15. Signatures

``` http
GET  /api/v1/mous/:mouId/signing-status
POST /api/v1/mous/:mouId/sign
GET  /api/v1/mous/:mouId/signatures
GET  /api/v1/mous/:mouId/executed-document
```

Signature records: - User - Role - Full name - Designation - Authority
reference - Consent - Timestamp - MoU version - Document hash -
Signature representation

All required signatures are required before `EXECUTED`.

## 16. Fulfillment

``` http
GET  /api/v1/deals/:dealId/fulfillment
POST /api/v1/deals/:dealId/fulfillment
PATCH /api/v1/fulfillment/:fulfillmentId
POST /api/v1/fulfillment/:fulfillmentId/complete

POST /api/v1/fulfillment/:fulfillmentId/evidence
GET  /api/v1/fulfillment/:fulfillmentId/evidence
```

Supports partial fulfillment and evidence.

## 17. Completion and reviews

``` http
POST /api/v1/deals/:dealId/complete
GET  /api/v1/deals/:dealId/completion

GET  /api/v1/deals/:dealId/reviews
POST /api/v1/deals/:dealId/reviews
PATCH /api/v1/reviews/:reviewId
```

Only completed PITCH deals can be reviewed.

One review per direction per deal.

## 18. Notifications

``` http
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
POST   /api/v1/notifications/:notificationId/read
POST   /api/v1/notifications/read-all
DELETE /api/v1/notifications/:notificationId
```

Notifications are persisted in MongoDB and may be pushed through
Socket.IO.

## 19. Uploads

``` http
POST   /api/v1/uploads/image
POST   /api/v1/uploads/document
DELETE /api/v1/uploads/:fileId
```

Backend validates user, MIME type, size and ownership. Cloudinary is
used for supported media/documents. MongoDB stores references/metadata.

## 20. Admin

``` http
GET   /api/v1/admin/users
GET   /api/v1/admin/users/:userId
PATCH /api/v1/admin/users/:userId/status

GET   /api/v1/admin/events
PATCH /api/v1/admin/events/:eventId/status

GET   /api/v1/admin/deals
GET   /api/v1/admin/deals/:dealId

GET   /api/v1/admin/reports
GET   /api/v1/admin/reports/:reportId
PATCH /api/v1/admin/reports/:reportId

GET /api/v1/admin/analytics/overview
GET /api/v1/admin/analytics/events
GET /api/v1/admin/analytics/deals
GET /api/v1/admin/analytics/users

GET /api/v1/admin/audit-logs
```

Admin-only.

## 21. Reports

``` http
POST /api/v1/reports
GET  /api/v1/reports/me
GET  /api/v1/reports/:reportId
```

## 22. Health

``` http
GET /api/v1/health
GET /api/v1/health/db
```

## 23. Response conventions

Success:

``` json
{
  "success": true,
  "data": {}
}
```

List:

``` json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

Error:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": {}
  }
}
```

Status codes: `200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500`.

Never expose stack traces, passwords, tokens, secrets or raw database
errors.

## 24. API security

Backend enforces: - Authentication - Role authorization - Resource
ownership - Participant access - State transitions - Request
validation - Rate limiting - Secure cookies/tokens - CORS - File
validation - Request size limits - Audit logging

Frontend button visibility is never considered authorization.

## 25. Testing requirement

Every endpoint should test: - Happy path - Unauthenticated - Wrong
role - Wrong owner - Invalid ID - Invalid body - Invalid state -
Duplicate action - Not found - Server/database failure

Eventually expose OpenAPI/Swagger documentation at:

``` text
/api/v1/docs
```

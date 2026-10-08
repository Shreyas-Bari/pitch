# PITCH — API Specification (Final)

## Base
All application APIs use `/api/v1`. Backend is authoritative for authentication, authorization, ownership, validation, state transitions, versioning and workflow rules.

## Authentication
- Short-lived JWT access token.
- Secure HttpOnly refresh cookie.
- Refresh-token rotation/session handling.
- Token-version invalidation for security changes.
- Central frontend API client.
- Do not store long-lived refresh tokens in localStorage.
- Protected routes redirect unauthenticated users to login.

## Standard handling
Frontend must correctly handle `2xx`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `5xx` responses where exposed by the backend. Never silently turn API errors into blank UI.

## API areas
### Auth
Register, login, refresh, logout, forgot password, reset password, change password, current user/session.

### Profiles
Current user; company/committee profile; public profiles; owner/admin private data; profile completeness; self-reported history.

### Events
Public discovery/detail; committee create; owner update; publish/archive; event management; gallery/banner; filters/search.

### Packages
List/create/update/archive/activate/detail.

### Saved events
Save, unsave, list saved.

### Applications
Company apply; company application list; committee application list; accept/reject/manage.

### Invitations
Committee invite; company invitation list; accept/reject.

### Search/matching
Event/company/committee discovery and deterministic matching according to the database specification.

### Conversations/messages
List/open authorized conversations; list/send messages; mark read; attachments; structured cards; contact sharing.

Message types:
`TEXT`, `IMAGE`, `DOCUMENT`, `EVENT_CARD`, `PACKAGE_CARD`, `PROPOSAL`, `COUNTER_PROPOSAL`, `CONTACT`, `MOU_CARD`, `SYSTEM`.

### Deals
Create/open, get, timeline, lifecycle actions, agreement/cancel, dispute.

### Proposals
Create, counter, accept, decline, withdraw, history. Historical proposals are immutable.

### MoU
Create, get, preview, download, versions, new/amended version.

### Signatures
Signature state, sign final version, required-signature validation, version/hash display.

### Fulfillment
List/update fulfillment, partial fulfillment, evidence, fulfilled/disputed, completion confirmation.

### Reviews/reputation
Eligibility, create review, retrieve reputation, duplicate prevention.

### Notifications
List, unread count, mark read/all read where supported.

### Uploads/documents
Use backend upload endpoints and external storage metadata. Never assume local filesystem paths.

### Admin
Users, companies, committees, events, deals, reports/disputes, analytics, audit logs.

## Socket.IO
Socket.IO is for realtime delivery; REST/database persistence is authoritative.
- Authorize conversation room joins.
- Handle connect/reconnect/disconnect.
- Persist read state before broadcasting when required.
- Support new-message/read-state events.
- Do not bypass REST authorization.

## Frontend API rules
- One API client and centralized endpoint definitions.
- No duplicated axios instances.
- No hard-coded localhost URLs in components.
- Base URL from environment configuration.
- Centralize auth/error handling.
- Use backend DTOs/contracts; do not depend on raw MongoDB internals.

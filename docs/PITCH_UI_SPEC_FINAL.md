# PITCH — UI / UX Specification (Final)

## Product direction
PITCH should feel like a modern sponsorship marketplace combining Instagram-style visual discovery with LinkedIn-style professional credibility.

Visual:
- desktop-first
- light mode primary
- white/light surfaces
- deep navy/blue accents
- photography-heavy event discovery
- approximately 10% restrained glassmorphism
- clean modern > visual/social > glass

Avoid generic B2B SaaS layouts, desktop bottom navigation, excessive glass, escrow/payment visuals and fake verification/certified-signing claims.

## Routes
### Public
`/`, `/about`, `/events`, `/events/:id`, `/companies`, `/companies/:id`, `/committees`, `/committees/:id`, `/how-it-works`, `/login`, `/register`

### Company
`/company/dashboard`, `/company/events`, `/company/events/:id`, `/company/saved`, `/company/applications`, `/company/invitations`, `/company/conversations`, `/company/deals`, `/company/deals/:id`, `/company/profile`, `/company/settings`

### Committee
`/committee/dashboard`, `/committee/events`, `/committee/events/create`, `/committee/events/:id/edit`, `/committee/events/:id`, `/committee/companies`, `/committee/applications`, `/committee/invitations`, `/committee/conversations`, `/committee/deals`, `/committee/deals/:id`, `/committee/profile`, `/committee/settings`

### Shared
`/messages`, `/messages/:conversationId`, `/deals/:id`, `/mou/:id`, `/notifications`

### Admin
`/admin/dashboard`, `/admin/users`, `/admin/companies`, `/admin/committees`, `/admin/events`, `/admin/deals`, `/admin/reports`, `/admin/analytics`

## Primary approved visual screens
1. Landing
2. Events Discovery
3. Event Details
4. Company Profile
5. Committee Profile
6. Company Dashboard
7. Committee Dashboard
8. Messages & Chat
9. Deal & Negotiation
10. MoU Review & Signing

Use these as visual anchors; do not invent unrelated pages.

## Shared components
AppShell, public header, authenticated navigation, buttons, form controls, tabs, cards, event cards, profile cards, badges/status pills, modals/drawers, confirmations, toasts, skeletons, empty/error states, pagination, breadcrumbs, file upload, timelines, proposal comparison, contribution editor and signature status cards.

## Events discovery
Prioritize large imagery plus title, committee/college, category, date, location, audience, sponsorship information, package signals, save action and filters/search/sort. Only published active sponsorship opportunities are marketplace opportunities.

## Event details
Hero/banner, gallery, event overview, committee, college/location, dates, audience/reach, sponsorship target, packages/benefits and apply/manage actions. Packages are not contracts.

## Profiles
Professional credibility through identity, description, category/industry, location, website/socials, audience/interests and PITCH completed-deal reputation. External history must say `SELF-REPORTED` and cannot count toward PITCH reputation.

## Dashboards
Company: recommendations, saved events, applications, invitations, conversations, deals, pending actions, notifications.
Committee: events, applications, invitations, conversations, deals, pending MoU/signatures, fulfillment, notifications.

## Chat
Message list, timestamps, sender, event/package/proposal/MoU cards, document/image attachments, structured contact sharing, read state, realtime updates and reconnect state. PITCH chat is a business workspace.

## Deal & negotiation
Show deal status/timeline, event/company/committee context, contribution breakdown, benefits, obligations, terms, proposal history, current proposal, counter proposal, allowed actions, MoU state, fulfillment and disputes.

Support multiple contribution types including cash, product, food, beverage, merchandise, equipment, service, venue, transportation, gift hamper and other. Never force every sponsorship into one cash amount.

## Proposals
Show version, sender, timestamp, contributions, benefits, obligations, delivery requirements, terms, parent/counter relationship and status. Never visually overwrite prior versions.

## MoU
Show status, version, parties, event, agreed terms, PDF preview/download, SHA-256 hash, signature checklist and version history. Use `Payment & Fulfillment Status`; never use escrow/reserve language. Use demo-signing language, not certified e-signature language.

## Fulfillment
Show expected vs received amount/quantity, progress, due date, evidence, notes and status. Support `PENDING`, `PARTIALLY_FULFILLED`, `FULFILLED`, `DISPUTED`.

## Reviews
Only completed PITCH deals generate reputation. Do not count self-reported external events.

## Notifications
Unread indicator, notification list and action links for applications, invitations, messages, proposals, MoU/signatures, fulfillment and reviews.

## Admin
Dashboard, users, companies, committees, events, deals, reports/disputes and analytics. Use readable tables, filters, search, status indicators and detail views.

## Responsive/accessibility
Desktop-first but support tablet/mobile. Keyboard navigation, visible focus, semantic labels, accessible form errors, sufficient contrast, responsive tables/cards and usable modals/drawers. Never convey essential information by color alone.

## Data boundary
Use real backend data. Never fabricate payment, escrow, verification, legal certification, deal completion or API endpoints. When data is unavailable, show loading/empty/error states.

## Implementation strategy
Build in controlled stages:
1. Foundation.
2. Public marketplace.
3. Company/committee dashboards.
4. Communication.
5. Deal/MoU/fulfillment/reviews.
6. Admin.
7. Integration and QA.

Each stage must preserve earlier work and stop after its requested scope.

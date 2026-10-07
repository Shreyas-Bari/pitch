# PITCH UI Specification --- Final v1

## 1. Source

This specification is derived from the supplied Stitch export:

`stitch_pitch_sponsorship_marketplace(1).zip`

The export contains 10 desktop screens, each with `code.html` and
`screen.png`, plus the Stitch design system in
`campus_commerce_marketplace/DESIGN.md`.

Screens: 1. Landing Page 2. Events Discovery 3. Event Details 4. Company
Profile 5. Committee Profile 6. Company Dashboard 7. Committee Dashboard
8. Messages & Chat 9. Deal & Negotiation 10. MoU Review & Signing

## 2. Design direction

PITCH uses an Editorial SaaS Hybrid: - Visual discovery inspired by
social platforms. - Professional credibility inspired by business
networking products. - Structured workflows inspired by B2B SaaS. -
Desktop-first. - Photography/media-forward on discovery and profile
surfaces. - Operational density on dashboards and negotiation screens. -
Light mode is the primary presentation. - Dark mode should be supported
intentionally. - Glassmorphism is minimal and only used for selected
overlays/hero treatments.

The Stitch design system describes the product as a high-trust
marketplace connecting enterprise sponsors and student leaders.

## 3. Design tokens

### Core palette

Primary surfaces: - Canvas: `#F8F9FF` - White surface: `#FFFFFF` -
Surface containers: `#EFF4FF`, `#E5EEFF`, `#DCE9FF`, `#D3E4FE` - Main
text: `#0B1C30` - Muted text: `#45464D` - Outline: `#76777D` - Outline
variant: `#C6C6CD`

Brand/action: - Deep navy: `#0F172A` / Stitch primary dark family -
Electric blue: `#2563EB` - Blue hover: `#3B82F6`

Semantic: - Success/verified/signed: Emerald -
Warning/review/negotiating: Amber - Information/application: Electric
blue - Error: `#BA1A1A`

Sponsorship tiers: - Title: Indigo - Gold: Amber - Silver: Slate

### Typography

Primary editorial font: `Plus Jakarta Sans`

Use for: - Hero headings - Event titles - Company/committee names -
Profile storytelling - Section headings

Dense UI font: `Inter`

Use for: - Metrics - Financial values - Status labels - Metadata -
Tables - Small labels

Key sizes: - Hero desktop: 48px / 56px / 800 - Hero mobile: 32px / 40px
/ 800 - Headline large: 32px / 40px / 700 - Headline medium: 24px / 32px
/ 600 - Headline small: 18px / 26px / 600 - Body large: 16px / 24px -
Body medium: 14px / 20px - Body small: 12px / 16px - Labels: 11--13px
Inter, semibold

### Spacing

Base grid: 8px.

-   xs: 4px
-   sm: 8px
-   md: 16px
-   lg: 24px
-   xl: 40px
-   Desktop gutter: 24px
-   Mobile gutter: 16px

### Radius

-   Controls: 8px
-   Cards: 16px
-   Large media cards: 24px
-   Pills: 9999px

### Elevation

Prefer borders and tonal layering over heavy shadows.

Level 1: - White surface - 1px slate border - Very subtle shadow

Level 2: - Hover/dropdown - Slightly stronger shadow

Level 3: - Modal/drawer - Backdrop blur and stronger shadow

## 4. Responsive architecture

Desktop \>= 1280px: - 12-column grid - max width approximately
1280--1440px - 24px gutters

Tablet 768--1279px: - 8-column grid - 20px gutters

Mobile \<768px: - 4-column grid - 16px gutters - Discovery media becomes
single-column - Operational side rails collapse into drawers

Do not convert the desktop application into a generic mobile
bottom-navigation app.

## 5. Global navigation

Public pages: - PITCH brand - Discover Events - Companies - Committees -
How It Works - Login/Register - Theme control where appropriate

Authenticated pages: - Role-specific workspace navigation -
Notifications - Messages - Profile/account - Theme control

Company workspace navigation: - Dashboard - Discover Events - Saved -
Applications - Invitations - Conversations - Deals - Profile - Settings

Committee workspace navigation: - Dashboard - Events - Companies -
Applications - Invitations - Conversations - Deals - Profile - Settings

Admin: - Dashboard - Users - Companies - Committees - Events - Deals -
Reports - Analytics - Audit Logs

## 6. Landing Page

Route: `/`

Purpose: - Explain PITCH immediately. - Show the marketplace concept. -
Drive discovery and registration. - Establish visual identity.

Major sections from Stitch: 1. Hero: "Where Brands Meet Campus
Communities." 2. Featured Events 3. Event cards for major campus events
4. Two-sided marketplace explanation 5. Committee value proposition 6.
Company value proposition 7. Platform workflow 8. Final CTA

Visual behavior: - Large editorial hero. - Strong event photography. -
Large event cards. - High contrast typography. - Avoid generic SaaS hero
grids.

Primary CTA: - Discover Events

Secondary CTA: - List Your Event / Join PITCH depending on
authentication state.

## 7. Events Discovery

Route: `/events`

Purpose: Primary discovery feed.

Required UI: - Search - Filters - Category filters - Location filter -
Sponsorship budget filter - Event date filter - Active Campus Events
heading - Media-forward event cards - Sponsorship target/scale -
Committee/college identity - Save event action

Event card: - Large media - Event title - College - Location - Date -
Audience - Sponsorship target - Category - Verification/history signals
where available - CTA

The Stitch screen uses high-density filters while retaining a visual
discovery feel.

## 8. Event Details

Route: `/events/:id`

Purpose: Turn an event into a sponsorship opportunity.

Required sections: - Hero event image - Event title -
College/committee - Date/location - Event description - Audience
demographics/reach - Activation formats - Sponsorship packages -
Available benefits - Sponsorship target - Committee information - CTA to
apply/connect

Activation cards should support examples such as: - Experiential
stalls - Naming rights - LED screen branding - Student kit/lanyard
branding - Workshops - Mainstage branding

Package cards: - Tier - Price/target - Benefits - Availability - Sponsor
count - CTA

## 9. Company Profile

Route: `/companies/:id`

Purpose: Build sponsor credibility.

Sections represented by Stitch: - Company identity - About - Sponsorship
criteria & budget limits - Target demographics/minimum scale - Mandatory
sponsor deliverables checklist - Recent campus activations - PITCH
Verified Deals

Important distinction: - PITCH Verified Deals are generated from
completed PITCH deals. - External/self-reported activations must be
visibly labeled self-reported.

Profile should feel closer to a professional business profile than a
settings page.

## 10. Committee Profile

Route: `/committees/:id`

Sections represented by Stitch: - Committee identity - About -
Affiliated societies/divisions - Active sponsorship opportunities -
Enterprise/brand partners - Authorized committee POCs - Campus
infrastructure

Show: - College - Committee category - Location - Social links - Contact
details when permitted - Verified deal/history indicators

## 11. Company Dashboard

Route: `/company/dashboard`

Purpose: Operational sponsor workspace.

Stitch sections: - Welcome header - Incoming Proposals & Pitches -
Fulfillment Deadlines & Deliverables - Algorithmic Matches - Recent
Activity & MoU Ledger

Dashboard priority: 1. Active deals 2. Urgent fulfillment 3. Incoming
proposals 4. Recommended events 5. Recent activity

Use: - Metric cards - Status badges - Compact data lists - Deadline
indicators - Event/deal thumbnails

## 12. Committee Dashboard

Route: `/committee/dashboard`

Purpose: Operational organizer workspace.

Stitch sections: - Active Sponsorship Deals - Incoming Brand Proposals -
Execution & Fulfillment Checklist - Smart Recommendations - Critical
Deadlines

Priority: 1. Active deals 2. Incoming applications/proposals 3.
Fulfillment 4. Recommendations 5. Deadlines

## 13. Messages & Chat

Routes: `/messages` `/messages/:conversationId`

Layout: - Left conversation list - Main chat - Right-side deal/event
context

Conversation list: - Entity avatar/logo - Conversation/event title -
Last message - Timestamp - Unread state

Chat: - Text - Attachments - Event cards - Package cards - Proposal
cards - Counter-proposal cards - Contact share - MoU card - System
messages

Deal Context: - Event - Sponsorship context - Current status -
Package/proposal - Deal CTA

Chat is a professional business workspace, not a WhatsApp clone.

## 14. Deal & Negotiation

Route: `/deals/:id`

The Stitch screen is a structured negotiation workspace.

Required sections: - Deal title - Parties - Event - Negotiation
Roadmap - Deliverables & Scope Matrix - Negotiation Redline Feed -
Current proposal - Counter-proposal controls - Agreement action - Deal
timeline

Roadmap should represent:

DISCUSSION → NEGOTIATING → PROPOSAL → COUNTER-PROPOSAL → AGREED → MOU →
SIGN → EXECUTE → FULFILL → COMPLETE

Deliverables matrix: - Party responsible - Deliverable - Quantity - Due
date - Status - Evidence where applicable

Negotiation feed: - Versioned proposals - Sender - Timestamp - Changes -
Accept/counter/decline actions

Never overwrite proposal history.

## 15. MoU Review & Signing

Route: `/mou/:id`

The Stitch screen presents the agreement as a document workspace with: -
Document header - Version - Event - Parties - Section navigation -
Contract text - Execution area - Signature status

Required UI states: 1. Draft 2. Under review 3. Awaiting signatures 4.
Partially signed 5. Executed 6. Superseded

Signing panel: - Signer name - Designation - Authority reference -
Agreement checkbox - Timestamp after signing - Version - SHA-256 hash -
Signature state

After both required parties sign: - Lock version - Show executed
status - Show both signatures - Show hash - Enable PDF download - Move
deal to EXECUTED

## 16. Important implementation reconciliation: payment/escrow

The supplied Stitch MoU screen visually contains an "Escrow Reserve" /
"PITCH Verified Escrow Facility" concept.

This must **NOT** be implemented as real escrow/payment processing in
the current PITCH product.

The approved product/API rules explicitly define PITCH as a sponsorship
marketplace and deal-management platform with **no payment
gateway/payment processing**.

Therefore:

Allowed: - Agreed amount - Payment schedule - Paid/received/pending
records - External payment reference - Fulfillment tracking - Payment
evidence upload

Not implemented: - PITCH wallet - Escrow account - RBI payment
pipeline - Actual fund custody - Automatic disbursement

If the Stitch visual is retained, replace the escrow wording with a
neutral "Payment & Fulfillment Status" component.

## 17. Important implementation reconciliation: legal signature claims

The supplied Stitch MoU HTML contains UIDAI-style authentication/hash
wording and legal-binding/escrow language.

Do not implement those as real identity verification or certified
e-signature.

PITCH v1 signing is: - User authenticated - Correct role - Signer name -
Designation - Authority reference - Agreement checkbox - Timestamp -
User ID - MoU version - SHA-256 document hash

The UI must describe this as a platform signing/consent workflow, not as
Aadhaar eSign, DSC, or certified legal e-signature.

## 18. Shared components

Build reusable components:

### Layout

-   PublicNavbar
-   WorkspaceSidebar
-   WorkspaceHeader
-   PageContainer
-   Footer

### Identity

-   CompanyAvatar
-   CommitteeAvatar
-   VerifiedBadge
-   ProfileHeader

### Discovery

-   EventCard
-   EventGrid
-   FilterBar
-   CategoryPill
-   SponsorshipTierBadge

### Data

-   MetricCard
-   StatusBadge
-   DataList
-   DataTable
-   DeadlineIndicator
-   ProgressIndicator

### Deal

-   DealCard
-   DealStatus
-   DealTimeline
-   NegotiationRoadmap
-   DeliverablesMatrix
-   ProposalCard
-   CounterProposalCard
-   ContributionRow

### Chat

-   ConversationList
-   MessageBubble
-   AttachmentMessage
-   EventMessageCard
-   ProposalMessageCard
-   ContactShareCard

### MoU

-   MouViewer
-   MouSectionNav
-   SignaturePanel
-   SigningStatus
-   DocumentHashCard

### General

-   Modal
-   Drawer
-   Dropdown
-   Tabs
-   Toast
-   EmptyState
-   LoadingState
-   ErrorState
-   ConfirmDialog

## 19. UX states

Every major data page must support: - Loading - Empty - Error -
Success - Disabled - Unauthorized - Not found

Workflow actions must provide immediate status feedback.

Examples: - Application submitted - Invitation accepted - Proposal
sent - Counter-proposal received - Proposal accepted - MoU generated -
Signature recorded - Deal executed - Fulfillment updated - Deal
completed - Review submitted

## 20. Accessibility

Required: - Keyboard navigation - Visible focus states - Semantic
buttons/links - Form labels - Error messaging - Sufficient contrast -
Accessible modal/drawer behavior - Alt text for meaningful images -
Avoid color-only status communication

## 21. Data/UI boundary

The UI must consume API DTOs, not raw MongoDB documents.

Loading states must not use fake static data once the corresponding API
exists.

During development, seed/demo data may reproduce the Stitch screens, but
it must be replaceable by API responses.

## 22. Stitch implementation rule

The supplied Stitch HTML is a visual reference, not the production
architecture.

Do not copy the static HTML application directly.

Rebuild the screens as: - React components - Tailwind/shadcn
primitives - Shared design tokens - API-backed data - Reusable layouts -
Responsive states

Preserve the visual intent, hierarchy, spacing, typography, imagery and
interaction patterns.

## 23. Final screen-to-route mapping

  Stitch screen          Production route
  ---------------------- -----------------------------
  Landing Page           `/`
  Events Discovery       `/events`
  Event Details          `/events/:id`
  Company Profile        `/companies/:id`
  Committee Profile      `/committees/:id`
  Company Dashboard      `/company/dashboard`
  Committee Dashboard    `/committee/dashboard`
  Messages & Chat        `/messages/:conversationId`
  Deal & Negotiation     `/deals/:id`
  MoU Review & Signing   `/mou/:id`

## 24. Definition of visual completion

The implementation is visually complete when: - All 10 Stitch screens
have production equivalents. - Desktop composition closely matches the
supplied designs. - Shared components are reused. - Typography and
spacing follow the design tokens. - Event imagery remains a major visual
element. - Dashboard density remains professional. - Deal/MoU screens
remain document/workflow oriented. - Mobile/tablet layouts are
responsive without destroying the desktop information architecture. -
Light and dark themes are intentional. - No generic SaaS redesign
replaces the approved Stitch direction.

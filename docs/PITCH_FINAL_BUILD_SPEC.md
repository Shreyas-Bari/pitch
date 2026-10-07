# PITCH — FINAL BUILD SPECIFICATION
## Source of Truth for Code-Generating Agents

**Project:** PITCH  
**Tagline:** Where Brands Meet Campus Communities  
**Document purpose:** This file is the authoritative implementation specification for building the PITCH web application. A code-generating agent such as Antigravity should use this document as the primary source of truth and implement the system in the order defined in the build sequence.

---

# 0. AGENT OPERATING RULES

This section is specifically for the coding agent.

## 0.1 Treat this file as the source of truth

The agent must:

- Follow the business rules in this document.
- Follow the architecture in this document.
- Follow the data model in this document.
- Follow the route and API contract in this document.
- Follow the implementation sequence in this document.
- Avoid inventing alternate workflows that conflict with this document.
- Prefer simple, reliable implementations over unnecessary complexity.
- Keep the product functional end-to-end before adding cosmetic or advanced features.

When a lower-level implementation choice is unspecified, choose the simplest maintainable solution that preserves the business rules.

## 0.2 Do not change the product model

The following are fixed:

- PITCH is a two-sided sponsorship marketplace.
- Only committees can create events.
- Companies can discover and apply to events.
- Committees can browse and invite companies.
- Sponsorship can be cash, products, food/beverages, merchandise, equipment, services, venue, transportation, gift hampers, or other resources.
- Multiple contribution types may exist in one deal.
- PITCH does not process payments.
- Contact sharing is allowed after mutual interest.
- External communication is allowed.
- Chat is a business workspace, not a WhatsApp replacement.
- Proposals are structured and versioned.
- The MoU is the formal closing mechanism.
- Both parties must sign the final MoU for the deal to become EXECUTED.
- Executed MoUs are locked.
- Reviews are only available after a completed PITCH deal.
- Completed PITCH deals create PITCH verified history and reputation.
- Historical events outside PITCH may be displayed as self-reported history.
- Self-reported history does not create PITCH reputation or reviews.
- Matching is deterministic and rule-based; no ML model is required.
- In-app notifications are required.
- Admin functionality is required but should remain practical and simple.

## 0.3 Do not over-engineer

Do not introduce:

- A payment gateway
- WhatsApp API
- A machine-learning matching model
- Microservices
- Kubernetes
- A complex event bus
- A separate search infrastructure
- A complex identity-verification workflow
- A legally certified e-signature provider for the academic version

unless explicitly requested later.

The target is a polished full-stack college project that behaves like a realistic product.

## 0.4 Build in vertical slices

Each phase should leave the application runnable.

Do not build every model first and postpone integration until the end.

Prefer:

```text
Phase
→ backend endpoint
→ database operation
→ frontend service
→ frontend page/component
→ test
→ working feature
```

## 0.5 Do not break working features

Before adding a new phase:

- Run the application.
- Verify the previous phase.
- Keep existing API contracts stable unless there is a documented reason to change them.
- Update dependent code if a schema changes.

## 0.6 Use realistic demo data

Avoid placeholder-looking content such as:

```text
Company 1
Event 2
Lorem ipsum
Test event
```

Use realistic college-event and business data.

---

# 0.5 FINAL SOURCE FILES

This build specification is used together with these five final Markdown files:

1. `PITCH_DATABASE_FINAL.md` — MongoDB/Mongoose persistence contract
2. `PITCH_API_FINAL.md` — `/api/v1` frontend/backend contract
3. `PITCH_MOU_FINAL.md` — MoU generation, versioning, hashing and signing contract
4. `PITCH_UI_SPEC_FINAL.md` — Stitch-derived visual and interaction contract
5. `PITCH_FINAL_BUILD_SPEC.md` — this master Antigravity implementation instruction

If a lower-level implementation detail conflicts with these files, stop and resolve the specification conflict before silently inventing behavior.


**Payment boundary:** PITCH records agreed payment terms and fulfillment evidence but does not process, custody, escrow, or automatically disburse sponsorship funds in v1.

---

# 1. PRODUCT DEFINITION

## 1.1 What PITCH is

PITCH is a two-sided sponsorship marketplace connecting:

**College Committees**
with
**Companies / Brands**

A committee creates an event and publishes sponsorship opportunities. Companies discover suitable opportunities and apply. Committees can also proactively discover companies and invite them.

After mutual interest, both parties can communicate through PITCH and externally. Structured proposals allow negotiation of cash and non-cash contributions. Once the commercial terms are agreed, PITCH generates a dynamic MoU from the deal. Both parties review and digitally sign the MoU. After both signatures, the agreement becomes EXECUTED. The platform then tracks fulfillment, completion, and reviews.

## 1.2 Core product lifecycle

```text
DISCOVER
  ↓
CONNECT
  ↓
COMMUNICATE
  ↓
NEGOTIATE
  ↓
AGREE
  ↓
MOU
  ↓
SIGN
  ↓
EXECUTE
  ↓
FULFILL
  ↓
COMPLETE
  ↓
REVIEW
  ↓
REPUTATION
```

## 1.3 One-sentence definition

> PITCH is a two-sided college sponsorship marketplace and deal-management platform that takes sponsorship opportunities from discovery to structured negotiation, MoU execution, fulfillment, and trusted post-deal reputation.

---

# 2. FINAL PRODUCT RULES

These rules resolve all previously ambiguous behavior.

## 2.1 Roles

Exactly three application roles:

```text
COMPANY
COMMITTEE
ADMIN
```

A `User` represents login/authentication identity.

A `CompanyProfile` or `CommitteeProfile` stores role-specific business information.

## 2.2 Event ownership

Every event must belong to exactly one committee.

Only the committee that owns an event may:

- Edit it
- Publish it
- Archive it
- Manage its sponsorship packages
- View applications for it
- Manage invitations for it

Admin may moderate any event.

Companies cannot create events.

## 2.3 Event publishing

An event can exist as:

```text
DRAFT
PUBLISHED
ONGOING
COMPLETED
ARCHIVED
```

Only `PUBLISHED` events are publicly discoverable as active sponsorship opportunities.

A draft is visible to its owning committee and admins only.

## 2.4 Sponsorship packages

Packages are optional but strongly recommended for an event.

A committee may create:

```text
Title Sponsor
Gold Sponsor
Silver Sponsor
Associate Sponsor
Custom Sponsorship
```

The package can define a cash price and/or a set of benefits.

Important:

**A package is a marketing offer. A final deal is a negotiated agreement.**

Do not assume the final deal exactly equals the package.

## 2.5 Sponsorship contributions

A deal can contain one or more contribution items.

Supported contribution types:

```text
CASH
PRODUCT
FOOD
BEVERAGE
MERCHANDISE
EQUIPMENT
SERVICE
VENUE
TRANSPORTATION
GIFT_HAMPER
OTHER
```

A mixed deal is valid.

Example:

```text
₹50,000 CASH
+
2,000 BEVERAGES
+
500 MERCHANDISE
```

## 2.6 Payment handling

PITCH records sponsorship terms but does not transfer money.

For cash contributions, the application tracks:

```text
Agreed amount
Expected date
Received amount
Pending amount
Status
```

Actual payment happens outside PITCH.

## 2.7 Mutual interest

For this specification, a relationship is considered **mutually interested** when:

- A company has submitted an application to an event and the committee has accepted it; OR
- A committee has invited a company and the company has accepted the invitation; OR
- A conversation has otherwise been explicitly created between both parties through an allowed marketplace action.

Once mutual interest exists, contact sharing is allowed.

The platform does not attempt to prevent users from taking the conversation to:

- WhatsApp
- Email
- Phone
- Meetings

## 2.8 Chat

Chat is a structured business communication workspace.

Supported content:

```text
TEXT
IMAGE
DOCUMENT
EVENT_CARD
PACKAGE_CARD
PROPOSAL
COUNTER_PROPOSAL
CONTACT
MOU_CARD
SYSTEM
```

Chat should not try to duplicate every feature of WhatsApp.

## 2.9 Proposals

A proposal is a structured business object, not merely a message.

A proposal contains:

- Deal
- Version
- Sender
- Contributions
- Benefits
- Obligations
- Terms
- Delivery requirements/dates
- Parent proposal if it is a counter
- Status
- Timestamp

Previous versions must never be overwritten.

## 2.10 Deal agreement

An accepted proposal creates or updates the canonical deal terms.

Once a proposal is accepted:

```text
Deal status → AGREED
```

However:

**AGREED does not mean the legal/formal closing is complete.**

The formal closing is the MoU.

## 2.11 MoU

A MoU is generated from the agreed deal.

The MoU is versioned.

Example:

```text
MoU v1
↓
MoU v2
↓
MoU v3 Final
```

Each version is immutable after creation.

If an unsigned MoU needs editing:

```text
new version
```

If an executed MoU needs changing:

```text
amendment/new version
+
new signatures
```

Never silently mutate an already signed version.

## 2.12 Digital signing

Academic/demo signing flow:

1. User opens MoU.
2. User reviews final document.
3. User enters:
   - Full legal/official name
   - Designation
4. User checks:
   - “I confirm that I have reviewed and agree to sign this MoU.”
5. User selects **Sign Document**.
6. Backend records:
   - User ID
   - Role
   - Name
   - Designation
   - Timestamp
   - MoU version ID
   - Document SHA-256 hash
7. Repeat for the other party.
8. Only when both required parties have signed does the deal become `EXECUTED`.

This is a project demonstration of digital signing and document integrity, not a claim of regulated legal e-signature certification.

## 2.13 Deal execution

Rule:

```text
Company signed? YES
Committee signed? YES
        ↓
MoU EXECUTED
        ↓
Deal EXECUTED
```

One signature:

```text
PARTIALLY_SIGNED
```

Zero signatures:

```text
AWAITING_SIGNATURES
```

## 2.14 Fulfillment

Fulfillment starts after execution.

Each contribution item can have its own fulfillment state.

Statuses:

```text
PENDING
PARTIALLY_FULFILLED
FULFILLED
DISPUTED
```

A deal may be completed when all required contribution obligations are fulfilled, or when the committee/admin explicitly marks the deal completed according to the agreed terms.

The implementation should support both:

- automatic progress calculation
- explicit completion action by an authorized participant

The UI must never imply that a deal is financially complete simply because the MoU was signed.

## 2.15 Reviews

Reviews are available only when:

```text
Deal status = COMPLETED
```

A user may review only the other participant in the deal.

Review validation must verify:

- Reviewer participated in the deal.
- Reviewed entity participated in the same deal.
- Deal is completed.
- Reviewer has not already submitted that review for the deal.

## 2.16 Reputation

Only completed PITCH deals affect PITCH reputation.

Possible metrics:

```text
PITCH Rating
Completed PITCH Deals
Review Count
PITCH Facilitated Sponsorship Value
```

Self-reported historical activity does not affect these metrics.

## 2.17 Self-reported history

Users may add old activity that occurred outside PITCH.

Committee example:

```text
Self-Reported Event
TechFest 2026
```

This may include media and event details.

It must be labeled clearly:

> SELF-REPORTED EVENT

Do not label it as “PITCH Verified.”

Do not create PITCH reviews for it.

Do not count it toward PITCH completed deals.

Do not invent external sponsorship verification.

## 2.18 Verification terminology

Do not use `isVerified = true` to imply that PITCH legally verified a user's identity or company unless an actual verification workflow exists.

Preferred terminology:

- `PITCH Verified Deal`
- `PITCH Verified History`
- `Self-Reported History`

An account may have ordinary platform status fields such as `isActive`.

Identity/business verification can remain a future capability.

---

# 3. TECHNOLOGY STACK

## 3.1 Frontend

```text
React
Vite
React Router
Tailwind CSS
shadcn/ui
Axios
React Hook Form
Zod
Recharts
Socket.IO Client
Lucide React
```

### Why

React:
- Component-based UI
- Strong ecosystem
- Good for dynamic dashboards and chat

Vite:
- Fast development/build
- Simple modern React setup

Tailwind:
- Rapid responsive styling
- Consistent design tokens
- Useful under project time constraints

shadcn/ui:
- Reusable professional UI components
- Customizable rather than a rigid theme

React Router:
- Client-side route management
- Role-based dashboard navigation

React Hook Form + Zod:
- Efficient forms
- Validation
- Good UX for complex deal/event forms

Axios:
- Centralized HTTP client

Recharts:
- Admin analytics

Socket.IO Client:
- Real-time chat and notifications

## 3.2 Backend

```text
Node.js
Express.js
Mongoose
JWT
HTTP-only Cookies
bcrypt
Multer
Socket.IO
```

### Why

Node/Express:
- Same JavaScript ecosystem
- Lightweight
- Fast to implement REST APIs
- Appropriate for MERN architecture

Mongoose:
- Schemas and validation
- MongoDB models
- References/population
- Query support

JWT + HTTP-only cookies:
- Session/authentication mechanism
- Cookie is not directly accessible to normal frontend JavaScript

bcrypt:
- Secure password hashing

Multer:
- Handles multipart file uploads

Socket.IO:
- Realtime message and notification delivery

## 3.3 Database

```text
MongoDB Atlas
```

Why:
- Flexible document structure
- Works naturally with JavaScript/MERN
- Easy cloud setup
- Suitable for nested contributions and evolving deal structures

## 3.4 Storage

```text
Cloudinary
```

Use for:

- Logos
- Event banners
- Event galleries
- Chat images/documents where appropriate
- Fulfillment evidence
- Generated MoU files if hosted there

Do not store binary files directly in MongoDB.

## 3.5 Deployment

```text
Frontend → Vercel
Backend  → Render
Database → MongoDB Atlas
Media    → Cloudinary
Code     → GitHub
```

---

# 4. SYSTEM ARCHITECTURE

## 4.1 High-level architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                                                              │
│  Companies              Committees               Admin       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       PITCH FRONTEND                         │
│                                                              │
│ React + Vite                                                 │
│ React Router                                                 │
│ Tailwind + shadcn/ui                                        │
│ Axios                                                        │
│ React Context                                                │
│ Socket.IO Client                                             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                    HTTPS / REST / WebSocket
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       PITCH BACKEND                          │
│                                                              │
│ Express                                                      │
│ ├── Auth                                                      │
│ ├── RBAC                                                      │
│ ├── Events                                                    │
│ ├── Packages                                                  │
│ ├── Applications                                              │
│ ├── Invitations                                               │
│ ├── Conversations                                             │
│ ├── Messages                                                  │
│ ├── Proposals                                                 │
│ ├── Deals                                                     │
│ ├── MoUs                                                      │
│ ├── Signatures                                                │
│ ├── Fulfillment                                               │
│ ├── Reviews                                                   │
│ ├── Notifications                                             │
│ └── Admin                                                     │
└────────────┬───────────────────┬──────────────────────────────┘
             │                   │
             ▼                   ▼
      ┌──────────────┐   ┌────────────────┐
      │ MongoDB Atlas│   │   Cloudinary    │
      │              │   │                │
      │ Application  │   │ Images         │
      │ data         │   │ Documents      │
      │              │   │ MoUs           │
      └──────────────┘   └────────────────┘
             │
             │
             ▼
      ┌───────────────────┐
      │ MoU / PDF Service │
      │                   │
      │ Template          │
      │ PDF               │
      │ SHA-256           │
      └───────────────────┘
```

## 4.2 Backend request architecture

```text
HTTP Request
   ↓
Route
   ↓
Authentication Middleware
   ↓
Authorization / Role Middleware
   ↓
Validation Middleware
   ↓
Controller
   ↓
Service
   ↓
Mongoose Model
   ↓
MongoDB
```

For cross-cutting effects:

```text
Service
 ├── Database operation
 ├── Notification Service
 ├── Socket Event
 ├── Audit Service
 ├── Cloudinary Service
 └── PDF/MoU Service
```

---

# 5. REPOSITORY STRUCTURE

Final repository:

```text
PITCH/
│
├── frontend/
├── backend/
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── product-spec.md
│
├── .gitignore
├── README.md
└── package.json                  # optional root scripts/workspace
```

This master document should be stored as:

```text
docs/product-spec.md
```

---

# 6. COMPLETE FRONTEND STRUCTURE

```text
frontend/
├── package.json
├── vite.config.js
├── index.html
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── assets/
    │   ├── images/
    │   ├── icons/
    │   └── logos/
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Dialog.jsx
    │   │   ├── Input.jsx
    │   │   ├── Textarea.jsx
    │   │   ├── Select.jsx
    │   │   ├── Checkbox.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Tabs.jsx
    │   │   ├── Table.jsx
    │   │   ├── Dropdown.jsx
    │   │   ├── Tooltip.jsx
    │   │   └── Loading.jsx
    │   │
    │   ├── layout/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── DashboardLayout.jsx
    │   │   └── PageHeader.jsx
    │   │
    │   ├── events/
    │   │   ├── EventCard.jsx
    │   │   ├── EventHero.jsx
    │   │   ├── EventFilters.jsx
    │   │   ├── EventStats.jsx
    │   │   ├── EventGallery.jsx
    │   │   ├── SponsorshipPackageCard.jsx
    │   │   └── EventStatusBadge.jsx
    │   │
    │   ├── companies/
    │   │   ├── CompanyCard.jsx
    │   │   ├── CompanyProfile.jsx
    │   │   ├── CompanyFilters.jsx
    │   │   └── MatchScore.jsx
    │   │
    │   ├── committees/
    │   │   ├── CommitteeCard.jsx
    │   │   └── CommitteeProfile.jsx
    │   │
    │   ├── applications/
    │   │   ├── ApplicationCard.jsx
    │   │   └── ApplicationStatus.jsx
    │   │
    │   ├── invitations/
    │   │   └── InvitationCard.jsx
    │   │
    │   ├── chat/
    │   │   ├── ConversationList.jsx
    │   │   ├── ConversationItem.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── MessageBubble.jsx
    │   │   ├── MessageInput.jsx
    │   │   ├── AttachmentPreview.jsx
    │   │   ├── PackageMessage.jsx
    │   │   ├── ProposalMessage.jsx
    │   │   ├── ContactCard.jsx
    │   │   ├── EventMessage.jsx
    │   │   ├── MouMessage.jsx
    │   │   └── QuickReplies.jsx
    │   │
    │   ├── deals/
    │   │   ├── DealCard.jsx
    │   │   ├── DealTimeline.jsx
    │   │   ├── ProposalCard.jsx
    │   │   ├── ProposalVersionList.jsx
    │   │   ├── ContributionCard.jsx
    │   │   ├── ContributionForm.jsx
    │   │   ├── FulfillmentTracker.jsx
    │   │   └── DealStatusBadge.jsx
    │   │
    │   ├── mou/
    │   │   ├── MouViewer.jsx
    │   │   ├── MouEditor.jsx
    │   │   ├── MouVersionList.jsx
    │   │   ├── SignatureForm.jsx
    │   │   └── SignatureStatus.jsx
    │   │
    │   ├── reviews/
    │   │   ├── ReviewCard.jsx
    │   │   ├── ReviewForm.jsx
    │   │   └── RatingStars.jsx
    │   │
    │   ├── notifications/
    │   │   ├── NotificationBell.jsx
    │   │   └── NotificationItem.jsx
    │   │
    │   └── admin/
    │       ├── StatsCard.jsx
    │       ├── UserTable.jsx
    │       ├── CompanyTable.jsx
    │       ├── CommitteeTable.jsx
    │       ├── EventTable.jsx
    │       ├── DealTable.jsx
    │       ├── ReportTable.jsx
    │       └── AnalyticsChart.jsx
    │
    ├── pages/
    │   ├── public/
    │   │   ├── Home.jsx
    │   │   ├── About.jsx
    │   │   ├── Events.jsx
    │   │   ├── EventDetails.jsx
    │   │   ├── Companies.jsx
    │   │   ├── CompanyDetails.jsx
    │   │   ├── Committees.jsx
    │   │   ├── CommitteeDetails.jsx
    │   │   ├── HowItWorks.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   │
    │   ├── company/
    │   │   ├── Dashboard.jsx
    │   │   ├── Events.jsx
    │   │   ├── EventDetails.jsx
    │   │   ├── SavedEvents.jsx
    │   │   ├── Applications.jsx
    │   │   ├── Invitations.jsx
    │   │   ├── Conversations.jsx
    │   │   ├── Deals.jsx
    │   │   ├── DealDetails.jsx
    │   │   ├── Profile.jsx
    │   │   └── Settings.jsx
    │   │
    │   ├── committee/
    │   │   ├── Dashboard.jsx
    │   │   ├── Events.jsx
    │   │   ├── CreateEvent.jsx
    │   │   ├── EditEvent.jsx
    │   │   ├── EventDetails.jsx
    │   │   ├── Companies.jsx
    │   │   ├── Applications.jsx
    │   │   ├── Invitations.jsx
    │   │   ├── Conversations.jsx
    │   │   ├── Deals.jsx
    │   │   ├── DealDetails.jsx
    │   │   ├── Profile.jsx
    │   │   └── Settings.jsx
    │   │
    │   ├── messages/
    │   │   └── Messages.jsx
    │   │
    │   ├── deals/
    │   │   └── DealDetails.jsx
    │   │
    │   ├── mou/
    │   │   └── MouDetails.jsx
    │   │
    │   ├── notifications/
    │   │   └── Notifications.jsx
    │   │
    │   └── admin/
    │       ├── Dashboard.jsx
    │       ├── Users.jsx
    │       ├── Companies.jsx
    │       ├── Committees.jsx
    │       ├── Events.jsx
    │       ├── Deals.jsx
    │       ├── Reports.jsx
    │       └── Analytics.jsx
    │
    ├── layouts/
    │   ├── PublicLayout.jsx
    │   ├── CompanyLayout.jsx
    │   ├── CommitteeLayout.jsx
    │   └── AdminLayout.jsx
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── NotificationContext.jsx
    │   └── SocketContext.jsx
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useSocket.js
    │   ├── useNotifications.js
    │   └── useDebounce.js
    │
    ├── services/
    │   ├── api.js
    │   ├── authService.js
    │   ├── eventService.js
    │   ├── companyService.js
    │   ├── committeeService.js
    │   ├── packageService.js
    │   ├── applicationService.js
    │   ├── invitationService.js
    │   ├── conversationService.js
    │   ├── messageService.js
    │   ├── proposalService.js
    │   ├── dealService.js
    │   ├── mouService.js
    │   ├── fulfillmentService.js
    │   ├── reviewService.js
    │   └── notificationService.js
    │
    ├── routes/
    │   ├── AppRoutes.jsx
    │   ├── ProtectedRoute.jsx
    │   └── RoleRoute.jsx
    │
    └── utils/
        ├── constants.js
        ├── formatCurrency.js
        ├── formatDate.js
        ├── permissions.js
        ├── validators.js
        └── storage.js
```

---

# 7. COMPLETE BACKEND STRUCTURE

```text
backend/
├── package.json
├── server.js
├── .env
├── .env.example
└── src/
    ├── config/
    │   ├── db.js
    │   ├── cloudinary.js
    │   └── env.js
    │
    ├── models/
    │   ├── User.js
    │   ├── Company.js
    │   ├── Committee.js
    │   ├── Event.js
    │   ├── SponsorshipPackage.js
    │   ├── Application.js
    │   ├── Invitation.js
    │   ├── Conversation.js
    │   ├── Message.js
    │   ├── Proposal.js
    │   ├── Deal.js
    │   ├── Mou.js
    │   ├── MouVersion.js
    │   ├── Signature.js
    │   ├── Fulfillment.js
    │   ├── Review.js
    │   ├── Notification.js
    │   ├── Document.js
    │   ├── Dispute.js
    │   └── AuditLog.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── companyController.js
    │   ├── committeeController.js
    │   ├── eventController.js
    │   ├── packageController.js
    │   ├── applicationController.js
    │   ├── invitationController.js
    │   ├── conversationController.js
    │   ├── messageController.js
    │   ├── proposalController.js
    │   ├── dealController.js
    │   ├── mouController.js
    │   ├── signatureController.js
    │   ├── fulfillmentController.js
    │   ├── reviewController.js
    │   ├── notificationController.js
    │   └── adminController.js
    │
    ├── services/
    │   ├── authService.js
    │   ├── eventService.js
    │   ├── matchingService.js
    │   ├── notificationService.js
    │   ├── applicationService.js
    │   ├── invitationService.js
    │   ├── conversationService.js
    │   ├── messageService.js
    │   ├── proposalService.js
    │   ├── dealService.js
    │   ├── mouService.js
    │   ├── pdfService.js
    │   ├── signatureService.js
    │   ├── cloudinaryService.js
    │   ├── fulfillmentService.js
    │   ├── reviewService.js
    │   └── auditService.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── companyRoutes.js
    │   ├── committeeRoutes.js
    │   ├── eventRoutes.js
    │   ├── packageRoutes.js
    │   ├── applicationRoutes.js
    │   ├── invitationRoutes.js
    │   ├── conversationRoutes.js
    │   ├── messageRoutes.js
    │   ├── proposalRoutes.js
    │   ├── dealRoutes.js
    │   ├── mouRoutes.js
    │   ├── fulfillmentRoutes.js
    │   ├── reviewRoutes.js
    │   ├── notificationRoutes.js
    │   └── adminRoutes.js
    │
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── roleMiddleware.js
    │   ├── validationMiddleware.js
    │   ├── uploadMiddleware.js
    │   └── errorMiddleware.js
    │
    ├── validators/
    │   ├── authValidator.js
    │   ├── companyValidator.js
    │   ├── committeeValidator.js
    │   ├── eventValidator.js
    │   ├── packageValidator.js
    │   ├── applicationValidator.js
    │   ├── proposalValidator.js
    │   ├── dealValidator.js
    │   ├── mouValidator.js
    │   └── reviewValidator.js
    │
    ├── utils/
    │   ├── jwt.js
    │   ├── password.js
    │   ├── hashDocument.js
    │   ├── generateMou.js
    │   ├── matchScore.js
    │   ├── contactLinks.js
    │   └── constants.js
    │
    ├── sockets/
    │   ├── socket.js
    │   ├── chatSocket.js
    │   └── notificationSocket.js
    │
    └── seed/
        ├── seed.js
        ├── seedUsers.js
        ├── seedCompanies.js
        ├── seedCommittees.js
        ├── seedEvents.js
        ├── seedDeals.js
        └── seedNotifications.js
```

---

# 8. FRONTEND ROUTES

## 8.1 Public routes

```text
/
 /about
 /events
 /events/:id
 /companies
 /companies/:id
 /committees
 /committees/:id
 /how-it-works
 /login
 /register
```

## 8.2 Company routes

```text
/company/dashboard
/company/events
/company/events/:id
/company/saved
/company/applications
/company/invitations
/company/conversations
/company/deals
/company/deals/:id
/company/profile
/company/settings
```

## 8.3 Committee routes

```text
/committee/dashboard
/committee/events
/committee/events/create
/committee/events/:id/edit
/committee/events/:id
/committee/companies
/committee/applications
/committee/invitations
/committee/conversations
/committee/deals
/committee/deals/:id
/committee/profile
/committee/settings
```

## 8.4 Shared routes

```text
/messages
/messages/:conversationId
/deals/:id
/mou/:id
/notifications
```

## 8.5 Admin routes

```text
/admin/dashboard
/admin/users
/admin/companies
/admin/committees
/admin/events
/admin/deals
/admin/reports
/admin/analytics
```

---

# 9. BACKEND API CONTRACT

Base prefix:

```text
/api
```

All protected endpoints require authenticated user context unless explicitly stated.

## 9.1 Auth

```http
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## 9.2 Companies

```http
GET    /api/companies
GET    /api/companies/:id
GET    /api/companies/:id/reviews
PUT    /api/companies/:id
```

## 9.3 Committees

```http
GET    /api/committees
GET    /api/committees/:id
GET    /api/committees/:id/reviews
PUT    /api/committees/:id
```

## 9.4 Events

```http
GET    /api/events
GET    /api/events/:id
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
POST   /api/events/:id/publish
POST   /api/events/:id/archive
```

Permissions:

```text
GET public event → public for published events
POST → COMMITTEE only
PUT → owning COMMITTEE or ADMIN
DELETE → owning COMMITTEE or ADMIN
PUBLISH → owning COMMITTEE or ADMIN
ARCHIVE → owning COMMITTEE or ADMIN
```

## 9.5 Packages

```http
GET    /api/events/:eventId/packages
POST   /api/events/:eventId/packages
GET    /api/packages/:id
PUT    /api/packages/:id
DELETE /api/packages/:id
```

Only the owning committee can manage its event packages.

## 9.6 Applications

```http
POST   /api/events/:id/apply
GET    /api/applications
GET    /api/applications/:id
PUT    /api/applications/:id/status
```

Rules:

- Company creates application.
- Committee can see applications for its event.
- Committee can accept/reject.
- Company can see its own applications.

## 9.7 Invitations

```http
POST   /api/companies/:id/invite
GET    /api/invitations
GET    /api/invitations/:id
PUT    /api/invitations/:id
```

Rules:

- Committee creates invitations.
- Target company accepts/declines.
- Committee sees invitations it sent.

## 9.8 Conversations

```http
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id
```

Conversation participants must be validated.

## 9.9 Messages

```http
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
PUT    /api/messages/:id/read
```

REST is the source of persistence.

Socket.IO is the source of real-time delivery.

## 9.10 Proposals

```http
POST   /api/deals/:dealId/proposals
GET    /api/deals/:dealId/proposals
GET    /api/proposals/:id
POST   /api/proposals/:id/accept
POST   /api/proposals/:id/counter
POST   /api/proposals/:id/decline
```

## 9.11 Deals

```http
POST   /api/deals
GET    /api/deals
GET    /api/deals/:id
PUT    /api/deals/:id
POST   /api/deals/:id/complete
POST   /api/deals/:id/cancel
```

Creation should normally occur from an accepted application/invitation or another validated mutual-interest flow.

## 9.12 MoUs

```http
POST   /api/deals/:dealId/mou
GET    /api/mou/:id
GET    /api/mou/:id/versions
POST   /api/mou/:id/versions
GET    /api/mou/:id/pdf
```

## 9.13 Signatures

```http
POST   /api/mou/:id/sign
GET    /api/mou/:id/signatures
```

A user may sign only as an authorized participant of that deal and only once per version.

## 9.14 Fulfillment

```http
GET    /api/deals/:dealId/fulfillment
POST   /api/deals/:dealId/fulfillment
PUT    /api/fulfillment/:id
```

## 9.15 Reviews

```http
POST   /api/deals/:dealId/review
GET    /api/companies/:id/reviews
GET    /api/committees/:id/reviews
```

## 9.16 Notifications

```http
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

## 9.17 Admin

```http
GET    /api/admin/users
GET    /api/admin/companies
GET    /api/admin/committees
GET    /api/admin/events
GET    /api/admin/deals
GET    /api/admin/reports
GET    /api/admin/analytics
GET    /api/admin/audit-logs

PUT    /api/admin/users/:id/status
PUT    /api/admin/events/:id/status
PUT    /api/admin/reports/:id/status
```

---

# 10. API RESPONSE STANDARD

Success:

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "You are not authorized to create an event"
}
```

Validation:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

Recommended status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

---

# 11. DATABASE MODEL

## 11.1 Logical collections

```text
users
companies
committees
events
sponsorshipPackages
applications
invitations
conversations
messages
proposals
deals
mous
mouVersions
signatures
fulfillments
reviews
notifications
documents
disputes
auditLogs
```

## 11.2 Why separate MoU and MoUVersion

`Mou` represents the agreement container.

`MouVersion` represents immutable document versions.

This resolves versioning ambiguity.

Structure:

```text
Deal
 ↓
MoU
 ├── MoU Version 1
 ├── MoU Version 2
 └── MoU Version 3 (final)
```

A signature points to a specific `MouVersion`.

---

# 12. USER MODEL

```js
{
  _id,
  name,
  email,
  passwordHash,
  role,                 // COMPANY | COMMITTEE | ADMIN
  avatar,
  isActive,
  lastLoginAt,
  createdAt,
  updatedAt
}
```

Constraints:

- `email` unique
- role required
- password never returned in API responses

---

# 13. COMPANY MODEL

```js
{
  _id,
  userId,
  companyName,
  industry,
  description,
  website,
  location,
  targetAudience: [],
  budgetMin,
  budgetMax,
  interests: [],
  logo,
  socialLinks: {
    instagram,
    linkedin,
    website
  },
  contact: {
    phone,
    email
  },
  selfReportedHistory: [],
  createdAt,
  updatedAt
}
```

Do not use `isVerified` here to imply verified identity.

---

# 14. COMMITTEE MODEL

```js
{
  _id,
  userId,
  committeeName,
  collegeName,
  collegeEmail,
  description,
  category,
  location,
  logo,
  socialLinks: {
    instagram,
    linkedin,
    website
  },
  contact: {
    phone,
    email
  },
  selfReportedEvents: [],
  createdAt,
  updatedAt
}
```

---

# 15. EVENT MODEL

```js
{
  _id,
  committeeId,
  title,
  description,
  college,
  location,
  category,
  eventType,
  startDate,
  endDate,
  expectedAudience,
  socialReach,
  sponsorshipTarget,
  banner,
  gallery: [],
  status,
  visibility,
  createdAt,
  updatedAt
}
```

### Event status

```text
DRAFT
PUBLISHED
ONGOING
COMPLETED
ARCHIVED
```

### Visibility

```text
PUBLIC
PRIVATE
```

Default published sponsorship events should be public.

---

# 16. SPONSORSHIP PACKAGE MODEL

```js
{
  _id,
  eventId,
  name,
  description,
  cashPrice,
  benefits: [],
  maxSponsors,
  currentSponsors,
  status,
  createdAt,
  updatedAt
}
```

Package status:

```text
AVAILABLE
LIMITED
SOLD_OUT
INACTIVE
```

The package is not the final deal.

---

# 17. APPLICATION MODEL

```js
{
  _id,
  eventId,
  companyId,
  message,
  proposedPackageId,
  status,
  createdAt,
  updatedAt
}
```

Status:

```text
PENDING
ACCEPTED
REJECTED
WITHDRAWN
```

Uniqueness rule:

```text
One active application per company per event.
```

A company should not be able to create duplicate pending applications.

---

# 18. INVITATION MODEL

```js
{
  _id,
  eventId,
  committeeId,
  companyId,
  message,
  status,
  createdAt,
  updatedAt
}
```

Status:

```text
PENDING
ACCEPTED
DECLINED
EXPIRED
```

---

# 19. CONVERSATION MODEL

A conversation links one event, one company, and one committee.

```js
{
  _id,
  eventId,
  companyId,
  committeeId,
  status,
  lastMessageId,
  createdAt,
  updatedAt
}
```

Rules:

- Both participants must be valid.
- Participants must be allowed to communicate.
- A conversation should normally exist per sponsorship context.
- If the same company and committee discuss multiple unrelated events, each event may have its own conversation.

Status:

```text
ACTIVE
ARCHIVED
BLOCKED
```

---

# 20. MESSAGE MODEL

```js
{
  _id,
  conversationId,
  senderUserId,
  type,
  content,
  attachments: [],
  metadata: {},
  readBy: [],
  createdAt,
  updatedAt
}
```

Types:

```text
TEXT
IMAGE
DOCUMENT
EVENT_CARD
PACKAGE_CARD
PROPOSAL
COUNTER_PROPOSAL
CONTACT
MOU_CARD
SYSTEM
```

Examples of metadata:

```js
{
  packageId: "...",
  proposalId: "...",
  eventId: "...",
  mouId: "...",
  contactType: "WHATSAPP"
}
```

---

# 21. CONTRIBUTION MODEL

Use a schema/subdocument that can be embedded in proposals/deals/fulfillment where practical.

```js
{
  _id,
  type,
  name,
  description,
  amount,
  quantity,
  unit,
  estimatedValue,
  expectedDate,
  status
}
```

Rules:

- `amount` applies primarily to CASH.
- `quantity` applies to physical/service units where appropriate.
- `estimatedValue` can be used for non-cash contributions.
- Contribution status must not imply actual payment processing.

---

# 22. DEAL MODEL

```js
{
  _id,
  eventId,
  companyId,
  committeeId,
  status,
  currentProposalId,
  contributions: [],
  benefits: [],
  obligations: [],
  terms: [],
  mouId,
  executedAt,
  completedAt,
  createdAt,
  updatedAt
}
```

## Deal statuses

```text
INTERESTED
DISCUSSION
NEGOTIATING
PROPOSAL
COUNTER_PROPOSAL
AGREED
MOU_DRAFT
AWAITING_SIGNATURES
PARTIALLY_SIGNED
EXECUTED
FULFILLMENT
COMPLETED
DECLINED
CANCELLED
DISPUTED
EXPIRED
```

Recommended transitions:

```text
INTERESTED
→ DISCUSSION
→ NEGOTIATING
→ PROPOSAL
→ COUNTER_PROPOSAL
→ PROPOSAL / NEGOTIATING
→ AGREED
→ MOU_DRAFT
→ AWAITING_SIGNATURES
→ PARTIALLY_SIGNED
→ EXECUTED
→ FULFILLMENT
→ COMPLETED
```

---

# 23. PROPOSAL MODEL

```js
{
  _id,
  dealId,
  version,
  senderUserId,
  contributions: [],
  benefits: [],
  obligations: [],
  deliveryRequirements: [],
  terms: [],
  parentProposalId,
  status,
  createdAt,
  updatedAt
}
```

Status:

```text
PENDING
ACCEPTED
COUNTERED
DECLINED
SUPERSEDED
```

Version rule:

```text
Version 1
Version 2
Version 3
...
```

Never modify an old proposal to become a new proposal.

---

# 24. MOU MODEL

```js
{
  _id,
  dealId,
  currentVersionId,
  status,
  createdAt,
  updatedAt
}
```

Status:

```text
DRAFT
UNDER_REVIEW
AWAITING_SIGNATURES
PARTIALLY_SIGNED
EXECUTED
SUPERSEDED
```

---

# 25. MOU VERSION MODEL

A version is immutable after creation.

```js
{
  _id,
  mouId,
  versionNumber,
  generatedFromProposalId,
  parties,
  eventDetails,
  contributions,
  benefits,
  obligations,
  deliveryRequirements,
  terms,
  templateIdentifier,
  pdfUrl,
  documentHash,
  status,
  createdByUserId,
  createdAt
}
```

Status:

```text
DRAFT
FINAL
SIGNED
SUPERSEDED
```

A `SIGNED` version must not be modified.

---

# 26. SIGNATURE MODEL

```js
{
  _id,
  mouVersionId,
  userId,
  role,
  fullName,
  designation,
  agreedToTerms,
  signedAt,
  documentHash,
  status,
  createdAt
}
```

Status:

```text
SIGNED
REVOKED
```

For normal demo flow, only `SIGNED` is needed.

---

# 27. FULFILLMENT MODEL

```js
{
  _id,
  dealId,
  contributionIndex,
  contributionName,
  expectedAmount,
  expectedQuantity,
  receivedAmount,
  receivedQuantity,
  status,
  dueDate,
  evidenceFiles: [],
  notes,
  updatedByUserId,
  createdAt,
  updatedAt
}
```

Status:

```text
PENDING
PARTIALLY_FULFILLED
FULFILLED
DISPUTED
```

---

# 28. REVIEW MODEL

```js
{
  _id,
  dealId,
  reviewerUserId,
  reviewedUserId,
  reviewedEntityType,
  rating,
  title,
  comment,
  createdAt,
  updatedAt
}
```

`reviewedEntityType`:

```text
COMPANY
COMMITTEE
```

Rules:

- One review per direction per deal.
- A user cannot review themselves.
- Deal must be completed.
- Reviewer must be a deal participant.

---

# 29. NOTIFICATION MODEL

```js
{
  _id,
  recipientUserId,
  type,
  title,
  body,
  relatedEntityType,
  relatedEntityId,
  actionUrl,
  read,
  createdAt
}
```

Notification types:

```text
NEW_APPLICATION
NEW_INVITATION
APPLICATION_ACCEPTED
APPLICATION_REJECTED
INVITATION_ACCEPTED
INVITATION_DECLINED
NEW_MESSAGE
NEW_PROPOSAL
COUNTER_PROPOSAL
PROPOSAL_ACCEPTED
PROPOSAL_DECLINED
MOU_CREATED
MOU_UPDATED
SIGNATURE_REQUESTED
MOU_SIGNED
DEAL_EXECUTED
CONTRIBUTION_DUE
CONTRIBUTION_RECEIVED
DEAL_COMPLETED
REVIEW_AVAILABLE
DISPUTE_CREATED
```

---

# 30. DOCUMENT MODEL

For uploaded/generated files:

```js
{
  _id,
  ownerUserId,
  entityType,
  entityId,
  fileName,
  fileType,
  mimeType,
  url,
  size,
  hash,
  createdAt
}
```

Use this only when centralized document tracking is useful.

Do not duplicate every file into multiple records unless needed.

---

# 31. DISPUTE MODEL

```js
{
  _id,
  dealId,
  reportedByUserId,
  reason,
  description,
  evidence: [],
  status,
  adminNotes,
  createdAt,
  updatedAt
}
```

Status:

```text
OPEN
UNDER_REVIEW
RESOLVED
REJECTED
```

---

# 32. AUDIT LOG MODEL

```js
{
  _id,
  actorUserId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  timestamp
}
```

Important audited events:

```text
EVENT_CREATED
EVENT_UPDATED
EVENT_PUBLISHED
APPLICATION_ACCEPTED
APPLICATION_REJECTED
INVITATION_ACCEPTED
PROPOSAL_CREATED
PROPOSAL_COUNTERED
PROPOSAL_ACCEPTED
MOU_CREATED
MOU_VERSION_CREATED
SIGNATURE_RECORDED
DEAL_EXECUTED
DEAL_COMPLETED
REVIEW_CREATED
DISPUTE_CREATED
```

---

# 33. DATABASE INDEXES

Required/strongly recommended:

```text
users.email UNIQUE

events.committeeId
events.status
events.category
events.location
events.startDate

applications.eventId
applications.companyId
applications.status

invitations.eventId
invitations.companyId
invitations.status

conversations.eventId
conversations.companyId
conversations.committeeId

messages.conversationId + createdAt

proposals.dealId + version

deals.eventId
deals.companyId
deals.committeeId
deals.status

mouVersions.mouId + versionNumber

reviews.dealId
reviews.reviewedUserId

notifications.recipientUserId + read
```

---

# 34. AUTHENTICATION

## 34.1 Register

Flow:

```text
Register form
↓
Zod frontend validation
↓
POST /api/auth/register
↓
Backend validation
↓
Email uniqueness check
↓
bcrypt password hashing
↓
User creation
↓
Role profile creation
↓
Authentication cookie
↓
Frontend authenticated state
```

## 34.2 Login

```text
Email + password
↓
Find user
↓
bcrypt compare
↓
Create JWT
↓
Set secure HTTP-only cookie
↓
Return user profile
```

## 34.3 Logout

```text
POST /api/auth/logout
↓
Clear cookie
```

## 34.4 Current user

```http
GET /api/auth/me
```

Used when the frontend starts.

---

# 35. AUTHORIZATION

## 35.1 Backend middleware

Implement:

```text
authMiddleware
roleMiddleware
```

`authMiddleware`:

- Reads authentication cookie
- Verifies JWT
- Loads/identifies user
- Adds user context to request

`roleMiddleware`:

- Checks role
- Rejects unauthorized role

## 35.2 Ownership checks

Also implement ownership checks in controllers/services.

Examples:

- Company may update only its own CompanyProfile.
- Committee may update only its own CommitteeProfile.
- Committee may update only events it owns.
- User may read only conversations they participate in.
- Deal participants may read/write their own deal workflow.
- Only an authorized signer can sign an MoU.
- Only admins can access admin APIs.

---

# 36. MATCHING ENGINE

File:

```text
backend/src/services/matchingService.js
```

or helper:

```text
backend/src/utils/matchScore.js
```

## 36.1 Weighting

```text
Category      25%
Audience      25%
Budget        20%
Location      15%
Event Type    15%
----------------
Total        100%
```

## 36.2 Output

```json
{
  "score": 92,
  "reasons": [
    "Technology category match",
    "Engineering audience",
    "Mumbai location",
    "Budget compatible",
    "Tech festival"
  ]
}
```

## 36.3 Deterministic rules

No AI model.

Possible rules:

- Exact category = full points
- Related category = partial points
- No match = zero

Audience comparison should consider configured interests/target audiences.

Budget compatibility should compare event sponsorship requirements against company budget range.

Location should reward same city/region.

Event type should compare company preferences with event type.

---

# 37. CONTACT SHARING

Contact sharing becomes available after mutual interest.

Contact information can be represented by:

```js
{
  name,
  designation,
  phone,
  email,
  whatsapp
}
```

Generate external links where possible:

```text
WhatsApp
Email
Call
Website
```

The backend should store only what the user has provided.

Do not integrate with WhatsApp APIs.

---

# 38. FILE UPLOAD FLOW

```text
Browser
↓
React form
↓
multipart/form-data
↓
Express
↓
Multer
↓
Cloudinary
↓
URL
↓
MongoDB metadata
```

Validate:

- MIME type
- Extension
- Size
- Maximum number of uploads

---

# 39. MOU GENERATION

The supplied PITCH MoU template is incorporated into the final MoU specification and is the source for the document structure, party fields, deliverables, payment fields, legal sections, execution blocks and Annexure A.

The system must therefore keep the document generation layer template-driven.

Do not hard-code the entire business logic into a page component.

Use:

```text
mouService.js
pdfService.js
generateMou.js
```

## 39.1 Data population

Populate placeholders from:

```text
Committee
Company
College
Event
Deal
Contributions
Benefits
Obligations
Dates
Terms
Signatories
```

## 39.2 PDF generation

```text
Accepted Deal
↓
MoU data object
↓
Template rendering
↓
PDF generation
↓
Save PDF
↓
SHA-256 hash
↓
Create MoU Version
```

## 39.3 Hashing

Use SHA-256 over the final document bytes.

Store:

```text
documentHash
```

in the MoU version and signature records.

---

# 40. SOCKET.IO

## 40.1 Purpose

Use Socket.IO for:

- New chat messages
- Message read state
- Typing indicator
- New notifications

## 40.2 Rooms

Use:

```text
conversation:<conversationId>
user:<userId>
```

## 40.3 Message flow

```text
User sends message
↓
REST POST
↓
Validate participant
↓
Persist in MongoDB
↓
Emit message:new
↓
Conversation room receives message
```

REST persistence must remain authoritative.

---

# 41. NOTIFICATION FLOW

Example:

```text
Company submits application
↓
Application Service
↓
Application saved
↓
Notification Service
↓
Notification created for committee
↓
Socket event to committee user room
↓
Committee sees notification instantly
```

Do not rely exclusively on Socket.IO.

Notifications must also be stored in MongoDB.

---

# 42. UI/UX REQUIREMENTS

Visual branding is intentionally not locked yet, but the product must feel like a real professional marketplace.

Required characteristics:

- Responsive
- Mobile friendly
- Desktop friendly
- Consistent spacing
- Professional typography
- Strong hierarchy
- Clear CTAs
- Status badges
- Modern cards
- Useful empty states
- Loading/skeleton states
- Error states
- Confirmation dialogs
- Toasts
- Search/filter controls
- Deal timelines
- MoU review/signing UX
- Clear verified-vs-self-reported distinction

Avoid a generic “CRUD admin template everywhere” appearance.

---

# 43. COMPANY DASHBOARD

Recommended sections:

```text
Overview
Recommended Events
Saved Events
Applications
Invitations
Conversations
Active Deals
Upcoming Fulfillment
Recent Notifications
Profile Reputation
```

KPIs can include:

```text
Applications
Active Deals
Executed MoUs
Completed Deals
```

---

# 44. COMMITTEE DASHBOARD

Recommended sections:

```text
Overview
My Events
Applications
Invitations
Companies
Conversations
Active Deals
Fulfillment
Notifications
Profile Reputation
```

KPIs:

```text
Published Events
Applications Received
Active Deals
Executed MoUs
Completed Deals
```

---

# 45. EVENT DISCOVERY

Company-facing event discovery should support:

- Keyword search
- Category
- Location
- Event type
- Date
- Expected audience
- Sponsorship range
- Package availability
- Match score

Example card:

```text
Oscillation 2027
Technology Festival
TSEC Mumbai
2,500 expected attendees

Sponsorship starts at ₹10,000

92% Match
```

---

# 46. COMPANY DIRECTORY

Committee-facing company discovery should support:

- Search
- Industry
- Location
- Budget
- Interest/category
- Target audience

Company card may show:

```text
Company name
Industry
Location
Target audience
Budget range
Website
PITCH reputation
Completed PITCH deals
Match score
Invite button
```

---

# 47. EVENT DETAIL PAGE

Recommended structure:

```text
Event Hero
Event Overview
Dates
Location
Expected Audience
Social Reach
Sponsorship Target

About Event

Sponsorship Packages

Why Sponsor?

Committee Information

Past Event / History

Apply CTA
```

Only published events should expose an active sponsorship CTA publicly.

---

# 48. APPLICATION UX

Company:

```text
Apply to Sponsor
↓
Message
↓
Optional preferred package
↓
Submit
```

Committee:

```text
Application received
↓
View company profile
↓
View match score
↓
Accept / Reject
```

Acceptance can create or enable conversation.

---

# 49. INVITATION UX

Committee:

```text
Browse companies
↓
Open company
↓
Invite to event
↓
Add optional message
↓
Send invitation
```

Company:

```text
Invitation received
↓
View event
↓
View committee
↓
Accept / Decline
```

Acceptance should enable the relationship/conversation.

---

# 50. DEAL CREATION RULE

A deal should not appear without a valid relationship context.

Primary deal creation sources:

```text
Accepted Application
OR
Accepted Invitation
```

The system should ensure:

```text
event
+
company
+
committee
```

all correspond to the same valid relationship.

---

# 51. DEAL PAGE

Recommended sections:

```text
Deal Header
Company
Committee
Event

Deal Status

Deal Timeline

Current Proposal

Proposal History

Contributions

Benefits

Obligations

MoU

Fulfillment

Activity / Audit

Review
```

---

# 52. PROPOSAL UI

Proposal card should visually distinguish:

```text
Contribution
Benefit
Obligation
Terms
Version
Sender
Status
```

Actions:

```text
Accept
Counter
Decline
```

The UI should make it obvious which version is current.

---

# 53. DEAL TIMELINE

Example:

```text
✓ Interest
✓ Discussion
✓ Negotiating
✓ Proposal v1
✓ Counter Proposal v2
✓ Accepted
✓ MoU Created
✓ Company Signed
✓ Committee Signed
✓ Executed
● Fulfillment
○ Completed
```

This should be one of the most visually important components of the product.

---

# 54. MOU REVIEW UI

Show:

```text
MoU version
Created from proposal
Last updated
Document preview/link
Document hash
Party information
Terms
Contributions
Benefits
Obligations
Signature status
```

Signature area:

```text
Full Name
Designation
[ ] I confirm that I have reviewed and agree to sign this MoU.

[ Sign Document ]
```

After signing:

```text
✓ Signed
Timestamp
Version
Document hash
```

---

# 55. FULFILLMENT UI

Example:

```text
Contribution                    Expected    Received      Status

Cash                            ₹50,000     ₹50,000       ✓ Fulfilled

Energy Drinks                   2,000       1,500         ● Partial

Merchandise                     500         0             Pending
```

Progress:

```text
2 / 3 contributions fulfilled
```

---

# 56. REVIEWS UI

After completion:

```text
Rate your experience
★★★★★

Title
Comment

Submit Review
```

Profile shows:

```text
PITCH Reputation
4.8 ★

12 completed deals

Recent Reviews
```

---

# 57. HISTORY UI

## PITCH Verified History

Use a clear visual indicator:

```text
✓ PITCH VERIFIED DEAL
```

## Self-Reported History

Use:

```text
SELF-REPORTED
```

Do not use the same visual treatment.

---

# 58. ADMIN PANEL

## Dashboard metrics

```text
Total Users
Companies
Committees
Published Events
Active Deals
Completed Deals
Facilitated Sponsorship Value
Open Reports
```

## Users

Admin can:

- View
- Search
- Filter by role
- Activate/deactivate

## Events

Admin can:

- View
- Search
- Filter
- Moderate
- Archive if necessary

## Deals

Admin can:

- View
- Inspect status
- Inspect participants
- Inspect MoU
- Inspect fulfillment
- Inspect disputes

## Reports/disputes

Admin can:

- View
- Change status
- Add notes
- Review evidence

## Analytics

Use Recharts.

Keep analytics understandable and based on real database data.

---

# 59. SECURITY REQUIREMENTS

Mandatory:

- bcrypt for passwords
- JWT authentication
- HTTP-only auth cookie
- Secure cookie settings in production
- CORS configuration
- Request validation
- Role-based authorization
- Ownership checks
- Upload validation
- `.env` secrets
- Error handling without leaking secrets
- No password in API responses
- No trusting frontend role claims without backend verification

Recommended:

- Rate limiting
- Request logging
- Basic abuse protection
- Audit logging

Do not put:

```text
MONGODB_URI
JWT_SECRET
CLOUDINARY_API_SECRET
```

in client code or GitHub.

---

# 60. ENVIRONMENT VARIABLES

Backend:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=
JWT_SECRET=

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Optional:

```env
SOCKET_ORIGIN=
```

Frontend should use only public/non-secret environment variables.

---

# 61. ERROR HANDLING

Backend:

- Central `errorMiddleware.js`
- Consistent API response shape
- Useful client-safe errors
- Server logs for unexpected errors

Frontend:

- Toasts for actions
- Inline validation
- Empty states
- Retry controls
- Redirect to login on expired auth

---

# 62. FORM VALIDATION

Important forms:

```text
Register
Login
Company Profile
Committee Profile
Create Event
Edit Event
Create Package
Application
Invitation
Proposal
Counter Proposal
MoU
Signature
Fulfillment
Review
Dispute
```

Use Zod on frontend and equivalent backend validation.

Never rely only on frontend validation.

---

# 63. SEED DATA

Create a seed system.

Suggested committee:

```text
TSEC Entrepreneurship Cell
Thadomal Shahani Engineering College
Mumbai
```

Suggested events:

```text
Oscillation 2027
TechFest 2027
Cultural Confluence 2027
SportsMania 2027
```

Suggested companies:

```text
TechNova
ByteWorks
Hydra Beverages
CampusWear
FinEdge
```

Suggested sponsorship packages:

```text
Title Sponsor
Gold Sponsor
Silver Sponsor
Associate Sponsor
```

Suggested demo contribution:

```text
₹50,000 cash
+
2,000 beverage units
+
500 merchandise units
```

Seed enough data to demonstrate:

- discovery
- match score
- applications
- invitations
- chat
- proposals
- MoU
- fulfillment
- reviews
- history
- notifications
- admin analytics

---

# 64. DEMO ACCOUNTS

Create:

```text
Company demo user
Committee demo user
Admin demo user
```

Do not hard-code insecure production credentials.

Provide credentials only through development/seed documentation.

---

# 65. RECOMMENDED DEMO FLOW

```text
1. Open PITCH homepage
2. Log in as Company
3. Browse events
4. Filter technology events
5. Open Oscillation 2027
6. Show packages
7. Apply
8. Switch to Committee
9. Open Applications
10. Accept application
11. Open conversation
12. Share package
13. Send proposal
14. Counter proposal
15. Accept final proposal
16. Create MoU
17. Review MoU
18. Company signs
19. Committee signs
20. Show EXECUTED
21. Open fulfillment
22. Add/complete fulfillment
23. Complete deal
24. Submit review
25. Open profile
26. Show PITCH Verified Deal
27. Open admin dashboard
28. Show analytics/audit information
```

This demo path should work end-to-end.

---

# 66. IMPLEMENTATION SEQUENCE — DO THIS ONE BY ONE

This is the mandatory development order.

## STEP 1 — Repository and tooling

Implement:

```text
PITCH/
frontend/
backend/
docs/
.gitignore
README.md
```

Install required packages.

Verify:

```text
frontend runs
backend runs
```

Acceptance:

- React app opens.
- Express server starts.
- Basic health route works.

---

## STEP 2 — MongoDB connection and configuration

Implement:

```text
config/db.js
config/env.js
```

Connect to MongoDB Atlas.

Add:

```text
.env
.env.example
```

Acceptance:

- Backend connects successfully.
- Server fails cleanly when database connection is unavailable.

---

## STEP 3 — Base backend architecture

Implement:

```text
routes
controllers
services
models
middleware
validators
utils
```

Create:

```http
GET /api/health
```

Acceptance:

- Consistent response structure.
- Central error middleware.
- Folder structure established.

---

## STEP 4 — User authentication

Implement:

```text
User model
Register
Login
Logout
GET /auth/me
JWT
HTTP-only cookie
bcrypt
authMiddleware
```

Acceptance:

- Company can register.
- Committee can register.
- Admin seed account works.
- Login persists.
- Logout works.

---

## STEP 5 — Role-based authorization

Implement:

```text
roleMiddleware
ProtectedRoute
RoleRoute
```

Test:

```text
Company cannot access committee creation routes.
Committee cannot access admin routes.
Non-authenticated users cannot access private dashboards.
```

Acceptance:

- Backend rejects unauthorized roles even if API is called manually.

---

## STEP 6 — Profiles

Implement:

```text
Company model
Committee model
Company profile API
Committee profile API
Profile pages
Profile editing
Logos
Contacts
Social links
```

Acceptance:

- Both roles can create and edit complete profiles.
- Public profile pages work.

---

## STEP 7 — Events

Implement:

```text
Event model
Create Event
Edit Event
Publish
Archive
Public event discovery
Event details
```

Acceptance:

- Only committees can create.
- Companies can browse published events.
- Ownership is enforced.

---

## STEP 8 — Sponsorship packages

Implement:

```text
Package model
Create package
Edit package
Delete package
Package list
Package cards
Availability
```

Acceptance:

- Committee can define packages.
- Company can view them publicly.

---

## STEP 9 — Search, filters, and matching

Implement:

```text
Event search
Event filters
Company directory
Company filters
Match score
```

Acceptance:

- Search and filters work against database data.
- Match score is deterministic and explainable.

---

## STEP 10 — Applications

Implement:

```text
Apply to event
View applications
Accept
Reject
Withdraw
```

Acceptance:

- Duplicate active applications are prevented.
- Committee sees applications only for its events.
- Company sees only its applications.

---

## STEP 11 — Invitations

Implement:

```text
Committee → Invite Company
Company → Accept / Decline
```

Acceptance:

- Invitation state changes correctly.
- Accepted invitation enables relationship/conversation.

---

## STEP 12 — Notifications

Implement:

```text
Notification model
Notification service
Notification APIs
Notification bell
Notification list
Read
Read all
```

At minimum notify:

```text
New application
Application accepted/rejected
New invitation
Invitation accepted/declined
```

---

## STEP 13 — Conversation and REST chat

Implement:

```text
Conversation model
Message model
Create conversation
Get messages
Send text
Read message
```

Acceptance:

- Only participants can access.
- Messages persist.

---

## STEP 14 — Socket.IO

After REST chat is stable, implement:

```text
SocketContext
socket server
conversation rooms
message:new
notification:new
```

Optional enhancements:

```text
typing
read receipts
online status
```

Do not delay the rest of the product for optional realtime features.

---

## STEP 15 — Rich chat messages and contact sharing

Implement:

```text
Package cards
Event cards
Proposal cards
MOU cards
Contact cards
Quick replies
```

Add external actions:

```text
Open WhatsApp
Send Email
Call
Website
```

Acceptance:

- Mutual-interest participants can exchange contact information.

---

## STEP 16 — Contribution system

Implement:

```text
Contribution schema
Contribution form
Cash contribution
Product contribution
Service contribution
Mixed contribution
```

Acceptance:

- Deal can contain multiple contribution types.

---

## STEP 17 — Deal creation and lifecycle

Implement:

```text
Deal model
Create deal
Deal page
Deal timeline
Status transitions
```

Acceptance:

- Deals are tied to a valid event + company + committee relationship.
- Unauthorized users cannot access other people's deals.

---

## STEP 18 — Proposal and counter-proposal system

Implement:

```text
Proposal model
Versioning
Create
Accept
Counter
Decline
History
```

Acceptance:

```text
v1
↓
v2
↓
v3
```

and all versions remain viewable.

---

## STEP 19 — Deal agreement

When the final proposal is accepted:

```text
Deal status → AGREED
```

Then allow:

```text
Create MoU
```

Do not jump directly to EXECUTED.

---

## STEP 20 — MoU template engine

Before final UI polish, build the document engine.

Implement:

```text
MoU model
MoUVersion model
Template data mapping
PDF generation
```

Acceptance:

- A real deal can generate a PDF populated with its actual terms.

---

## STEP 21 — MoU versioning

Implement:

```text
v1
v2
v3
```

Rules:

- Versions immutable.
- Current version is identifiable.
- Old versions remain viewable.
- Signatures attach to a version.

---

## STEP 22 — Digital signing

Implement:

```text
Signature model
Sign form
SHA-256 hash
Timestamp
Signature status
```

Acceptance:

- Company can sign.
- Committee can sign.
- A participant cannot sign twice for the same version.
- A non-participant cannot sign.
- `EXECUTED` occurs only after both required parties have signed.

---

## STEP 23 — Fulfillment

Implement:

```text
Fulfillment model
Contribution tracking
Partial fulfillment
Evidence
```

Acceptance:

- Cash and non-cash contributions can be tracked separately.
- Partial quantities work.

---

## STEP 24 — Deal completion

Implement:

```text
Complete deal action
Completion validation
Completed timestamp
```

Recommended rule:

- MoU must be executed.
- Required fulfillment obligations should be fulfilled or explicitly confirmed by an authorized participant/admin.

Acceptance:

```text
EXECUTED
↓
FULFILLMENT
↓
COMPLETED
```

---

## STEP 25 — Reviews and reputation

Implement:

```text
Review model
Review form
Review list
Rating aggregation
Profile reputation
```

Acceptance:

- Review blocked before completion.
- Only deal participants can review.
- One review per direction per deal.
- Completed deals affect reputation.

---

## STEP 26 — Self-reported history

Implement:

```text
Self-reported events
Self-reported company history
Profile display
Clear labels
```

Acceptance:

- History is visible.
- No fake PITCH verification.
- No reputation credit.

---

## STEP 27 — Admin dashboard

Implement:

```text
Dashboard
Users
Companies
Committees
Events
Deals
Reports
Analytics
Audit logs
```

Acceptance:

- Admin can inspect core platform state.
- Non-admin cannot access it.

---

## STEP 28 — Audit and disputes

Implement:

```text
AuditLog
Dispute
Admin notes/status
```

Acceptance:

- Important workflow events are traceable.
- Deal dispute can be opened and inspected.

---

## STEP 29 — Production hardening

Implement:

```text
CORS
secure cookies
rate limiting where practical
upload validation
clean error handling
input validation
ownership checks
```

Acceptance:

- No obvious permission bypasses.
- Secrets not exposed.

---

## STEP 30 — Demo seed and final UX

Implement:

```text
seed data
demo accounts
loading states
empty states
error states
toasts
responsive layout
navigation polish
```

Acceptance:

- Complete demo flow works without manually editing database records.

---

## STEP 31 — Deployment

Deploy:

```text
Frontend → Vercel
Backend → Render
MongoDB → Atlas
Cloudinary → configured
```

Set production environment variables.

Acceptance:

- Full workflow operates on deployed URLs.

---

# 67. DEVELOPMENT PRIORITY

If a feature must be delayed, use this order.

## Tier A — Absolutely required

```text
Authentication
RBAC
Profiles
Events
Packages
Discovery
Applications
Invitations
Chat
Contributions
Proposals
Deals
MoU
Digital signing
Notifications
Fulfillment
Completion
Reviews
Reputation
Admin
```

## Tier B — Important

```text
Match score
Self-reported history
Audit logs
Disputes
Attachments
```

## Tier C — Optional polish

```text
Typing indicators
Online status
Advanced analytics
Email notifications
Advanced search
Additional animation
```

Never sacrifice the end-to-end sponsorship lifecycle for a cosmetic feature.

---

# 68. TESTING MATRIX

## Authentication

```text
[ ] Register company
[ ] Register committee
[ ] Duplicate email blocked
[ ] Correct password login
[ ] Wrong password blocked
[ ] Logout
[ ] Current session restore
```

## Authorization

```text
[ ] Company cannot create event
[ ] Committee can create event
[ ] Company cannot access admin
[ ] Committee cannot access admin
[ ] User cannot access unrelated conversation
[ ] User cannot access unrelated deal
```

## Events

```text
[ ] Create
[ ] Edit
[ ] Publish
[ ] Archive
[ ] Search
[ ] Filter
[ ] Public view
```

## Sponsorship

```text
[ ] Create package
[ ] Edit package
[ ] Remove package
[ ] Show availability
```

## Applications

```text
[ ] Apply
[ ] Prevent duplicate active application
[ ] Accept
[ ] Reject
[ ] Withdraw
```

## Invitations

```text
[ ] Invite
[ ] Accept
[ ] Decline
```

## Chat

```text
[ ] Create conversation
[ ] Send text
[ ] Retrieve messages
[ ] Rich message
[ ] Contact share
[ ] External links
[ ] Realtime delivery
```

## Deals

```text
[ ] Create
[ ] Proposal
[ ] Counter proposal
[ ] Accept
[ ] Decline
[ ] Version history
[ ] Timeline
```

## MoU

```text
[ ] Generate
[ ] Correct data population
[ ] Generate PDF
[ ] Create version
[ ] SHA-256
[ ] Company sign
[ ] Committee sign
[ ] Execute only after both
[ ] Lock signed version
```

## Fulfillment

```text
[ ] Cash
[ ] Product
[ ] Partial
[ ] Complete
[ ] Evidence
```

## Reviews

```text
[ ] Block before complete
[ ] Allow after complete
[ ] Prevent duplicate
[ ] Correct profile aggregation
```

## Admin

```text
[ ] Dashboard
[ ] Users
[ ] Events
[ ] Deals
[ ] Reports
[ ] Analytics
[ ] Audit
```

---

# 69. PERFORMANCE / QUALITY GUIDELINES

Use pagination for:

```text
Events
Companies
Messages
Applications
Invitations
Deals
Notifications
Reviews
Admin tables
```

Avoid returning enormous collections by default.

Use loading/skeleton states.

Lazy-load large pages when useful.

Optimize images through Cloudinary.

Do not perform expensive matching calculations for every render. Compute server-side or cache appropriate results.

---

# 70. DOCUMENTATION TO KEEP IN REPOSITORY

The final repository should contain:

```text
docs/
├── product-spec.md
├── architecture.md
├── database.md
├── api.md
├── deployment.md
└── demo-script.md
```

The current document is the master product specification.

---

# 71. FUTURE EXTENSIONS

These are not part of the required first version, but the architecture should not prevent them:

```text
Formal e-sign provider
Payment gateway
Email automation
Calendar integration
CRM integrations
Advanced recommendation engine
Identity/business verification
Multi-contact company accounts
Team members
Advanced reporting
Contract amendments
Automated reminders
Dispute resolution workflow
```

Do not implement these unless requested.

---

# 72. FINAL NON-NEGOTIABLE ACCEPTANCE CRITERIA

PITCH is functionally complete only when this can be performed:

```text
1. Company registers.
2. Committee registers.
3. Committee completes profile.
4. Company completes profile.
5. Committee creates event.
6. Committee creates sponsorship packages.
7. Committee publishes event.
8. Company discovers event.
9. Company views event and package details.
10. Company applies.
11. Committee receives application.
12. Committee accepts.
13. Conversation is available.
14. Parties can exchange contact information.
15. Parties can communicate externally if desired.
16. Parties create/modify structured proposal terms.
17. Counter-proposals are versioned.
18. Final proposal is accepted.
19. Deal becomes AGREED.
20. MoU is generated from actual deal data.
21. MoU PDF is generated.
22. MoU version is stored.
23. SHA-256 hash is stored.
24. Company signs.
25. Committee signs.
26. Deal becomes EXECUTED.
27. Executed MoU version becomes locked.
28. Fulfillment can be tracked.
29. Partial fulfillment is supported.
30. Deal becomes COMPLETED.
31. Reviews become available.
32. Review appears on the partner profile.
33. Completed deal appears in PITCH Verified History.
34. Old events can appear in Self-Reported History.
35. Self-reported history does not affect PITCH reputation.
36. Notifications are generated for major actions.
37. Admin can inspect users/events/deals/reports/analytics/audit records.
38. Non-authorized users cannot bypass permissions through direct API calls.
```

---

# 73. FINAL ARCHITECTURAL SUMMARY

```text
                         ┌─────────────────────┐
                         │       COMPANY       │
                         └──────────┬──────────┘
                                    │
                             Discover / Apply
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                           PITCH                              │
│                                                              │
│                 TWO-SIDED MARKETPLACE                       │
│                                                              │
│   Events ↔ Companies ↔ Applications ↔ Invitations             │
│                         ↕                                    │
│                     Conversations                            │
│                         ↕                                    │
│                 Proposals / Counter                         │
│                         ↕                                    │
│                       Deals                                  │
│                         ↕                                    │
│                        MoU                                   │
│                         ↕                                    │
│                     Signatures                               │
│                         ↕                                    │
│                      EXECUTED                                │
│                         ↕                                    │
│                    Fulfillment                               │
│                         ↕                                    │
│                     COMPLETED                                │
│                         ↕                                    │
│                       Reviews                                │
│                         ↕                                    │
│                     Reputation                               │
└──────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                              Create / Invite
                                    │
                         ┌──────────┴──────────┐
                         │      COMMITTEE      │
                         └─────────────────────┘

                         ┌─────────────────────┐
                         │        ADMIN        │
                         │ Moderation / Data   │
                         │ Reports / Analytics │
                         │ Audit / Disputes    │
                         └─────────────────────┘
```

---

# 74. FINAL STACK SUMMARY

```text
FRONTEND
React
Vite
React Router
Tailwind CSS
shadcn/ui
Axios
React Hook Form
Zod
Recharts
Socket.IO Client
Lucide React

BACKEND
Node.js
Express
Mongoose
JWT
HTTP-only Cookies
bcrypt
Multer
Socket.IO

DATA / STORAGE
MongoDB Atlas
Cloudinary

DOCUMENTS
PDF generation
SHA-256 hashing

DEV / DEPLOYMENT
Git
GitHub
Vercel
Render
Postman
```

---

# 75. FINAL PRODUCT STATEMENT

> **PITCH is a two-sided sponsorship marketplace where college committees publish events and sponsorship opportunities, companies discover and apply to those opportunities, both parties communicate and negotiate through a structured business workspace, and once an agreement is reached, PITCH transforms the final deal into a versioned MoU that both parties sign. Executed deals move into fulfillment and, after completion, create trusted PITCH history, reviews, and reputation.**

This statement, the business rules above, and the implementation sequence are the final source of truth for the project.

# PITCH Database Specification — MongoDB / Mongoose Final v2

## Purpose

This document is the database source of truth for PITCH Final.

PITCH is a sponsorship marketplace connecting:

```text
COMPANIES ↔ COLLEGE COMMITTEES
```

The database must support the complete lifecycle:

```text
REGISTER
→ PROFILE
→ EVENT
→ SPONSORSHIP PACKAGE
→ APPLICATION / INVITATION
→ CHAT
→ CONTACT SHARING
→ DEAL
→ PROPOSAL / NEGOTIATION
→ AGREEMENT
→ MoU
→ DIGITAL SIGNATURE
→ EXECUTED DEAL
→ FULFILLMENT
→ COMPLETION
→ REVIEW
→ VERIFIED HISTORY
```

This document is intended for the backend developer and should be used together with:

```text
PITCH_API_FINAL.md
```

The API contract defines how clients interact with the backend. This document defines how the backend persists the data.

---

# 1. Database Technology

## Primary database

```text
MongoDB Atlas
```

## ODM

```text
Mongoose
```

## Database style

PITCH uses a document-oriented model with references between major entities.

Do not put the entire application into one huge User document.

Use separate collections for major business entities.

---

# 2. Core Collections

The initial PITCH database consists of:

```text
users
companies
committees
events
sponsorshipPackages
applications
invitations
savedEvents
conversations
messages
contactShares
deals
proposals
mous
mouVersions
signatures
fulfillments
fulfillmentEvidence
reviews
notifications
selfReportedHistory
files
reports
auditLogs
```

Some small data structures may be embedded where appropriate.

---

# 3. General MongoDB Rules

Every major collection should have:

```text
_id
createdAt
updatedAt
```

Use Mongoose timestamps:

```js
{ timestamps: true }
```

IDs are MongoDB ObjectIds.

Frontend treats IDs as opaque strings.

Never expose internal database credentials.

---

# 4. User Model

Collection:

```text
users
```

The User represents authentication/account identity.

It does NOT contain the entire Company or Committee profile.

## Schema

```js
{
  _id: ObjectId,

  email: String,
  passwordHash: String,

  role: "COMPANY" | "COMMITTEE" | "ADMIN",

  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "DEACTIVATED",

  emailVerified: Boolean,

  lastLoginAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Rules

```text
email → required + unique + normalized lowercase
passwordHash → never returned by API
role → immutable after account creation unless admin-controlled
```

## Indexes

```text
unique(email)
role
status
```

---

# 5. Company Model

Collection:

```text
companies
```

A Company is the business-facing organization profile linked to a User.

## Schema

```js
{
  _id: ObjectId,

  userId: ObjectId, // ref User

  name: String,
  legalName: String,

  logoFileId: ObjectId, // ref File
  coverFileId: ObjectId, // ref File

  description: String,

  industry: String,

  website: String,

  location: {
    city: String,
    state: String,
    country: String
  },

  contact: {
    phone: String
  },

  socialLinks: {
    linkedin: String,
    instagram: String,
    website: String
  },

  sponsorshipPreferences: {
    eventCategories: [String],
    preferredLocations: [String],
    targetAudience: [String],
    budgetMin: Number,
    budgetMax: Number,
    contributionTypes: [
      "CASH",
      "PRODUCT",
      "SERVICE",
      "MIXED"
    ]
  },

  isProfileComplete: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
User 1 ─── 1 Company
```

One Company account owns one Company profile.

## Indexes

```text
userId unique
name
industry
location.city
location.state
```

---

# 6. Committee Model

Collection:

```text
committees
```

A Committee represents a college/event organizing body.

## Schema

```js
{
  _id: ObjectId,

  userId: ObjectId, // ref User

  name: String,

  college: {
    name: String,
    location: {
      city: String,
      state: String,
      country: String
    }
  },

  logoFileId: ObjectId,
  coverFileId: ObjectId,

  description: String,

  committeeType: String,

  website: String,

  socialLinks: {
    instagram: String,
    linkedin: String,
    website: String
  },

  contact: {
    phone: String
  },

  isProfileComplete: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
User 1 ─── 1 Committee
```

## Indexes

```text
userId unique
name
college.name
college.location.city
```

---

# 7. File Model

Collection:

```text
files
```

MongoDB stores metadata/reference, while actual media can live in Cloudinary.

## Schema

```js
{
  _id: ObjectId,

  ownerUserId: ObjectId, // ref User

  provider: "CLOUDINARY",

  publicId: String,
  url: String,

  resourceType: "IMAGE" | "RAW" | "DOCUMENT",

  mimeType: String,
  originalName: String,
  sizeBytes: Number,

  purpose:
    "PROFILE_IMAGE"
    | "EVENT_IMAGE"
    | "CHAT_ATTACHMENT"
    | "FULFILLMENT_EVIDENCE"
    | "MOU_DOCUMENT"
    | "OTHER",

  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

```text
ownerUserId
provider + publicId unique
```

---

# 8. Event Model

Collection:

```text
events
```

Only Committees create events.

## Schema

```js
{
  _id: ObjectId,

  committeeId: ObjectId, // ref Committee

  title: String,
  slug: String,

  description: String,

  category: String,

  eventType: String,

  eventDate: Date,
  endDate: Date,

  location: {
    mode: "PHYSICAL" | "ONLINE" | "HYBRID",
    venue: String,
    city: String,
    state: String,
    country: String
  },

  expectedAudience: {
    min: Number,
    max: Number
  },

  audienceDescription: String,

  estimatedReach: Number,

  socialReach: {
    instagram: Number,
    linkedin: Number,
    other: Number
  },

  bannerFileId: ObjectId,

  mediaFileIds: [ObjectId],

  sponsorshipRequirements: {
    contributionTypes: [
      "CASH",
      "PRODUCT",
      "SERVICE",
      "MIXED"
    ],
    budgetMin: Number,
    budgetMax: Number
  },

  tags: [String],

  status:
    "DRAFT"
    | "PUBLISHED"
    | "ONGOING"
    | "COMPLETED"
    | "ARCHIVED",

  publishedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationships

```text
Committee 1 ─── N Events
Event 1 ─── N SponsorshipPackages
Event 1 ─── N Applications
Event 1 ─── N Invitations
Event N ─── N Companies through Applications/Invitations
```

## Indexes

```text
committeeId
status
eventDate
category
location.city
location.state
tags
slug unique
```

---

# 9. Sponsorship Package Model

Collection:

```text
sponsorshipPackages
```

## Schema

```js
{
  _id: ObjectId,

  eventId: ObjectId, // ref Event

  title: String,

  description: String,

  contributionTypes: [
    "CASH",
    "PRODUCT",
    "SERVICE",
    "MIXED"
  ],

  cashRequirement: {
    amount: Number,
    currency: String
  },

  nonCashRequirements: [
    {
      type: "PRODUCT" | "SERVICE",
      description: String,
      quantity: Number,
      unit: String
    }
  ],

  benefits: [
    {
      title: String,
      description: String
    }
  ],

  availability: Number,

  status: "AVAILABLE" | "FULL" | "INACTIVE",

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
Event 1 ─── N SponsorshipPackages
```

---

# 10. Application Model

Collection:

```text
applications
```

Represents a Company's application to sponsor an Event.

## Schema

```js
{
  _id: ObjectId,

  eventId: ObjectId, // ref Event
  companyId: ObjectId, // ref Company

  packageId: ObjectId, // ref SponsorshipPackage, optional

  message: String,

  proposedContribution: {
    types: [
      "CASH",
      "PRODUCT",
      "SERVICE",
      "MIXED"
    ],

    cash: {
      amount: Number,
      currency: String
    },

    nonCash: [
      {
        type: "PRODUCT" | "SERVICE",
        description: String,
        quantity: Number,
        unit: String
      }
    ]
  },

  status:
    "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "WITHDRAWN",

  respondedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationships

```text
Company 1 ─── N Applications
Event 1 ─── N Applications
Package 1 ─── N Applications
```

## Unique constraint

A company should not have multiple active applications for the same event/package combination.

Recommended application-level uniqueness strategy:

```text
eventId + companyId
```

with business logic preventing duplicate active applications.

---

# 11. Invitation Model

Collection:

```text
invitations
```

Represents a Committee directly approaching a Company.

## Schema

```js
{
  _id: ObjectId,

  eventId: ObjectId,
  committeeId: ObjectId,
  companyId: ObjectId,

  packageId: ObjectId,

  message: String,

  status:
    "PENDING"
    | "ACCEPTED"
    | "DECLINED"
    | "CANCELLED"
    | "EXPIRED",

  expiresAt: Date,

  respondedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
Committee 1 ─── N Invitations
Company 1 ─── N Invitations
Event 1 ─── N Invitations
```

---

# 12. Saved Event Model

Collection:

```text
savedEvents
```

A join collection between Company/User and Event.

## Schema

```js
{
  _id: ObjectId,

  companyId: ObjectId,
  eventId: ObjectId,

  createdAt: Date
}
```

## Unique index

```text
companyId + eventId unique
```

## Relationship

```text
Company N ─── N Events
```

through:

```text
SavedEvent
```

---

# 13. Conversation Model

Collection:

```text
conversations
```

A conversation exists between eligible participants.

## Schema

```js
{
  _id: ObjectId,

  participantCompanyId: ObjectId,
  participantCommitteeId: ObjectId,

  eventId: ObjectId, // optional
  dealId: ObjectId, // optional

  status: "ACTIVE" | "ARCHIVED",

  lastMessageId: ObjectId,

  lastMessageAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
Company 1 ─── N Conversations
Committee 1 ─── N Conversations
Conversation N ─── 1 Event (optional)
Conversation N ─── 1 Deal (optional)
```

A conversation should normally represent one Company ↔ Committee relationship.

---

# 14. Message Model

Collection:

```text
messages
```

Messages are separate from conversations because conversations can contain many messages.

## Schema

```js
{
  _id: ObjectId,

  conversationId: ObjectId,

  senderUserId: ObjectId,

  type:
    "TEXT"
    | "IMAGE"
    | "FILE"
    | "SYSTEM",

  text: String,

  fileId: ObjectId,

  replyToMessageId: ObjectId,

  editedAt: Date,

  deletedAt: Date,

  readBy: [
    {
      userId: ObjectId,
      readAt: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

```text
conversationId + createdAt
senderUserId
```

---

# 15. Contact Share Model

Collection:

```text
contactShares
```

## Schema

```js
{
  _id: ObjectId,

  conversationId: ObjectId,

  sharedByUserId: ObjectId,

  contact: {
    email: String,
    phone: String,
    whatsapp: String,
    other: String
  },

  createdAt: Date
}
```

Contact information should only become available when the backend determines that the parties are eligible to exchange contact details.

---

# 16. Deal Model

Collection:

```text
deals
```

This is one of the most important collections.

A Deal represents the sponsorship relationship that proceeds toward an MoU.

## Schema

```js
{
  _id: ObjectId,

  eventId: ObjectId,

  companyId: ObjectId,

  committeeId: ObjectId,

  applicationId: ObjectId,

  invitationId: ObjectId,

  conversationId: ObjectId,

  status:
    "INTERESTED"
     | "DISCUSSION"
     | "NEGOTIATING"
     | "PROPOSAL"
     | "COUNTER_PROPOSAL"
     | "AGREED"
     | "MOU_DRAFT"
     | "AWAITING_SIGNATURES"
     | "PARTIALLY_SIGNED"
     | "EXECUTED"
     | "FULFILLMENT"
     | "COMPLETED"
     | "DECLINED"
     | "CANCELLED"
     | "DISPUTED"
     | "EXPIRED",

  currentProposalId: ObjectId,

  agreedTermsId: ObjectId,

  agreedAt: Date,

  executedAt: Date,

  completedAt: Date,

  cancelledAt: Date,

  cancellationReason: String,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationships

```text
Event ──────────┐
Company ────────┤
Committee ──────┤
Application ────┤
Invitation ─────┤
Conversation ────┤
                ▼
               Deal
                │
                ├── Proposals
                ├── MoU
                ├── Fulfillment
                ├── Reviews
                └── Timeline/Audit
```

## Important

A Deal should not be created from arbitrary frontend input.

It must originate from an eligible application/invitation workflow.

---

# 17. Proposal Model

Collection:

```text
proposals
```

Each proposal is an immutable negotiation version.

Do NOT overwrite old proposals.

## Schema

```js
{
  _id: ObjectId,

  dealId: ObjectId,

  createdByUserId: ObjectId,

  version: Number,

  basedOnProposalId: ObjectId,

  contribution: {
    types: [
      "CASH",
      "PRODUCT",
      "SERVICE",
      "MIXED"
    ],

    cash: {
      amount: Number,
      currency: String
    },

    nonCash: [
      {
        type: "PRODUCT" | "SERVICE",
        description: String,
        quantity: Number,
        unit: String
      }
    ]
  },

  benefits: [
    {
      title: String,
      description: String
    }
  ],

  deliverables: [
    {
      party: "COMPANY" | "COMMITTEE",
      description: String,
      dueDate: Date
    }
  ],

  terms: String,

  status:
    "DRAFT"
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "WITHDRAWN"
    | "SUPERSEDED",

  respondedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
Deal 1 ─── N Proposals
```

Proposal history must remain available for the deal timeline.

---

# 18. Agreement / Final Terms

The agreed terms should be stored as a snapshot rather than relying only on a mutable proposal.

Recommended embedded structure inside Deal or separate collection:

```text
dealAgreements
```

For better auditability, use a separate collection.

## Schema

```js
{
  _id: ObjectId,

  dealId: ObjectId,

  acceptedProposalId: ObjectId,

  snapshot: {
    contribution: {},
    benefits: [],
    deliverables: [],
    terms: String
  },

  agreedBy: [
    {
      userId: ObjectId,
      role: "COMPANY" | "COMMITTEE",
      agreedAt: Date
    }
  ],

  status: "AGREED" | "SUPERSEDED",

  createdAt: Date,
  updatedAt: Date
}
```

This snapshot becomes the source for MoU generation.

---

# 19. MoU Model

Collection:

```text
mous
```

One Deal has one logical MoU with potentially multiple versions.

## Schema

```js
{
  _id: ObjectId,

  dealId: ObjectId,

  currentVersionId: ObjectId,

  status:
    "DRAFT"
    | "PENDING_SIGNATURE"
    | "PARTIALLY_SIGNED"
    | "EXECUTED"
    | "VOID",

  createdAt: Date,
  updatedAt: Date
}
```

## Relationship

```text
Deal 1 ─── 1 MoU
MoU 1 ─── N MoUVersions
```

---

# 20. MoU Version Model

Collection:

```text
mouVersions
```

Every generated/revised MoU is a separate version.

## Schema

```js
{
  _id: ObjectId,

  mouId: ObjectId,

  versionNumber: Number,

  sourceAgreementId: ObjectId,

  documentFileId: ObjectId,

  documentHash: String,

  status:
    "DRAFT"
    | "READY_FOR_SIGNATURE"
    | "PARTIALLY_SIGNED"
    | "EXECUTED"
    | "VOID",

  generatedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Critical rule

Once a version is signed:

```text
IMMUTABLE
```

Never overwrite the signed PDF or its hash.

---

# 21. Signature Model

Collection:

```text
signatures
```

## Schema

```js
{
  _id: ObjectId,

  mouId: ObjectId,

  mouVersionId: ObjectId,

  signerUserId: ObjectId,

  signerRole: "COMPANY" | "COMMITTEE",

  signatureType:
    "PLATFORM"
    | "EXTERNAL_PROVIDER",

  signatureData: String,

  consentText: String,

  signedAt: Date,

  ipAddress: String,

  userAgent: String,

  documentHashAtSigning: String,

  createdAt: Date,
  updatedAt: Date
}
```

## Important

The exact legal/e-signature mechanism can be finalized later.

The database should still preserve the concept of:

```text
who signed
what version
when
under what consent
what document hash
```

---

# 22. Fulfillment Model

Collection:

```text
fulfillments
```

A Deal can have multiple fulfillment obligations.

## Schema

```js
{
  _id: ObjectId,

  dealId: ObjectId,

  responsibleParty:
    "COMPANY"
    | "COMMITTEE",

  type:
    "CASH"
    | "PRODUCT"
    | "SERVICE"
    | "PROMOTION"
    | "BOOTH"
    | "MERCHANDISE"
    | "OTHER",

  description: String,

  quantity: Number,
  unit: String,

  dueDate: Date,

  status:
    "PENDING"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "COMPLETED"
    | "DISPUTED"
    | "CANCELLED",

  completedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

Examples:

```text
Company → provide 500 beverage cans
Company → provide ₹50,000
Committee → provide logo placement
Committee → provide social media promotion
Committee → provide booth space
```

---

# 23. Fulfillment Evidence Model

Collection:

```text
fulfillmentEvidence
```

## Schema

```js
{
  _id: ObjectId,

  fulfillmentId: ObjectId,

  uploadedByUserId: ObjectId,

  fileId: ObjectId,

  description: String,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 24. Review Model

Collection:

```text
reviews
```

Only completed PITCH deals can generate reviews.

## Schema

```js
{
  _id: ObjectId,

  dealId: ObjectId,

  reviewerUserId: ObjectId,

  revieweeCompanyId: ObjectId,
  revieweeCommitteeId: ObjectId,

  rating: Number,

  title: String,

  comment: String,

  status: "PUBLISHED" | "HIDDEN" | "REMOVED",

  createdAt: Date,
  updatedAt: Date
}
```

Exactly one review per reviewer per deal.

Recommended unique constraint:

```text
dealId + reviewerUserId unique
```

---

# 25. Self-Reported History Model

Collection:

```text
selfReportedHistory
```

This stores historical information that did NOT occur through PITCH.

## Schema

```js
{
  _id: ObjectId,

  ownerType: "COMPANY" | "COMMITTEE",

  ownerId: ObjectId,

  title: String,

  description: String,

  eventName: String,

  partnerName: String,

  date: Date,

  mediaFileIds: [ObjectId],

  verificationStatus: "SELF_REPORTED",

  createdAt: Date,
  updatedAt: Date
}
```

## Important distinction

PITCH must show:

```text
SELF-REPORTED
```

separately from:

```text
PITCH VERIFIED
```

Self-reported history must never automatically become verified history.

---

# 26. Verified History

Do not allow users to directly create verified-history records.

Verified history should be derived from completed PITCH deals.

Conceptually:

```text
Completed Deal
      ↓
Verified Sponsorship History
```

The application can query completed deals to construct this section.

A separate materialized collection is optional later if performance requires it.

For v1:

```text
NO MANUAL VERIFIED-HISTORY COLLECTION REQUIRED
```

---

# 27. Notification Model

Collection:

```text
notifications
```

## Schema

```js
{
  _id: ObjectId,

  recipientUserId: ObjectId,

  type:
    "APPLICATION_RECEIVED"
    | "APPLICATION_ACCEPTED"
    | "APPLICATION_REJECTED"
    | "INVITATION_RECEIVED"
    | "INVITATION_ACCEPTED"
    | "NEW_MESSAGE"
    | "NEW_PROPOSAL"
    | "COUNTER_PROPOSAL"
    | "PROPOSAL_ACCEPTED"
    | "MOU_GENERATED"
    | "MOU_SIGNED"
    | "DEAL_EXECUTED"
    | "FULFILLMENT_UPDATE"
    | "DEAL_COMPLETED"
    | "NEW_REVIEW",

  title: String,
  message: String,

  entityType: String,
  entityId: ObjectId,

  readAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

```text
recipientUserId + createdAt
recipientUserId + readAt
```

---

# 28. Report Model

Collection:

```text
reports
```

## Schema

```js
{
  _id: ObjectId,

  reporterUserId: ObjectId,

  targetType:
    "USER"
    | "EVENT"
    | "MESSAGE"
    | "DEAL"
    | "COMPANY"
    | "COMMITTEE",

  targetId: ObjectId,

  reason: String,

  description: String,

  status:
    "OPEN"
    | "UNDER_REVIEW"
    | "RESOLVED"
    | "DISMISSED",

  resolution: String,

  resolvedByUserId: ObjectId,

  resolvedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 29. Audit Log Model

Collection:

```text
auditLogs
```

Important system actions should be auditable.

## Schema

```js
{
  _id: ObjectId,

  actorUserId: ObjectId,

  action: String,

  entityType: String,

  entityId: ObjectId,

  metadata: Object,

  ipAddress: String,

  userAgent: String,

  createdAt: Date
}
```

Examples:

```text
USER_LOGIN
EVENT_CREATED
EVENT_PUBLISHED
APPLICATION_ACCEPTED
DEAL_CREATED
PROPOSAL_ACCEPTED
MOU_GENERATED
MOU_SIGNED
DEAL_EXECUTED
FULFILLMENT_COMPLETED
DEAL_COMPLETED
ADMIN_SUSPENDED_USER
```

Audit logs should generally be append-only.

---

# 30. Database Relationship Map

High-level relationship:

```text
                         ┌──────────────┐
                         │    USER      │
                         └──────┬───────┘
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
                COMPANY     COMMITTEE     ADMIN
                    │           │
                    │           │
                    │           ├──────────────┐
                    │           │              │
                    │           ▼              ▼
                    │         EVENTS      INVITATIONS
                    │           │              │
                    │           ▼              │
                    │      PACKAGES            │
                    │           │              │
                    ├───────────┼──────────────┘
                    │           │
                    ▼           ▼
              APPLICATIONS   INVITATIONS
                    │           │
                    └─────┬─────┘
                          ▼
                       DEAL
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
       PROPOSALS       AGREEMENT      CHAT
            │             │             │
            │             ▼             ▼
            │            MoU       CONVERSATION
            │             │             │
            │             ▼             ▼
            │        MoU VERSION     MESSAGES
            │             │
            │             ▼
            │         SIGNATURES
            │             │
            └─────────────┤
                          ▼
                    FULFILLMENTS
                          │
                          ▼
                      COMPLETED
                          │
                          ▼
                       REVIEWS
```

---

# 31. Detailed Relationship Table

| Parent | Child | Relationship |
|---|---|---|
| User | Company | 1:1 |
| User | Committee | 1:1 |
| Committee | Event | 1:N |
| Event | SponsorshipPackage | 1:N |
| Company | Application | 1:N |
| Event | Application | 1:N |
| Committee | Invitation | 1:N |
| Company | Invitation | 1:N |
| Event | Invitation | 1:N |
| Company | SavedEvent | 1:N |
| Event | SavedEvent | 1:N |
| Company | Conversation | 1:N |
| Committee | Conversation | 1:N |
| Conversation | Message | 1:N |
| Conversation | ContactShare | 1:N |
| Event | Deal | 1:N |
| Company | Deal | 1:N |
| Committee | Deal | 1:N |
| Deal | Proposal | 1:N |
| Deal | Agreement | 1:N |
| Deal | MoU | 1:1 |
| MoU | MoUVersion | 1:N |
| MoUVersion | Signature | 1:N |
| Deal | Fulfillment | 1:N |
| Fulfillment | Evidence | 1:N |
| Deal | Review | 1:N |
| User | Notification | 1:N |
| User | Report | 1:N |
| User | AuditLog | 1:N |

---

# 32. Reference vs Embedded Data

## Use references for:

Major independent entities:

```text
User
Company
Committee
Event
Application
Invitation
Conversation
Message
Deal
Proposal
MoU
Signature
Fulfillment
Review
Notification
```

## Embed for:

Small values belonging tightly to their parent:

```text
Event.location
Event.audience
Company.location
Company.socialLinks
Proposal.contribution
Proposal.deliverables
Fulfillment basic details
```

The rule is:

> If the object needs its own lifecycle, permissions or querying, make it a collection. If it is small and belongs entirely to one parent, embed it.

---

# 33. Important Indexes

At minimum:

## Users

```text
email unique
role
status
```

## Companies

```text
userId unique
name
industry
location.city
```

## Committees

```text
userId unique
name
college.name
```

## Events

```text
committeeId
status
eventDate
category
location.city
tags
slug unique
```

## Packages

```text
eventId
status
```

## Applications

```text
eventId + companyId
companyId + status
eventId + status
```

## Invitations

```text
eventId + companyId
companyId + status
committeeId + status
```

## Saved Events

```text
companyId + eventId unique
```

## Conversations

```text
participantCompanyId
participantCommitteeId
dealId
lastMessageAt
```

## Messages

```text
conversationId + createdAt
```

## Deals

```text
companyId + status
committeeId + status
eventId
status
```

## Proposals

```text
dealId + version
dealId + status
```

## MoUs

```text
dealId unique
```

## MoU Versions

```text
mouId + versionNumber unique
documentHash
```

## Signatures

```text
mouVersionId
signerUserId
```

## Fulfillment

```text
dealId
responsibleParty
status
dueDate
```

## Reviews

```text
dealId + reviewerUserId unique
revieweeCompanyId
revieweeCommitteeId
```

## Notifications

```text
recipientUserId + createdAt
recipientUserId + readAt
```

---

# 34. Soft Deletion

Do not immediately hard-delete important business records.

For entities such as:

```text
User
Company
Committee
Event
Deal
MoU
```

prefer status/deactivation fields.

Examples:

```text
User → DEACTIVATED
Event → CANCELLED
Deal → CANCELLED
MoU → VOID
```

Historical deal/MoU records must remain available for auditability.

---

# 35. Data Integrity Rules

Backend must enforce:

### Event

```text
event.committeeId
```

must refer to the committee that owns it.

### Application

```text
application.companyId
```

must refer to the applying company.

### Invitation

```text
invitation.committeeId
```

must own the event.

### Deal

```text
deal.companyId
deal.committeeId
deal.eventId
```

must all correspond to the same sponsorship context.

### Proposal

```text
proposal.dealId
```

must refer to the deal being negotiated.

### MoU

```text
mou.dealId
```

must refer to the corresponding deal.

### Signature

```text
signature.mouVersionId
```

must refer to the version actually being signed.

### Fulfillment

```text
fulfillment.dealId
```

must refer to the deal whose terms created that obligation.

### Review

```text
review.dealId
```

must refer to a COMPLETED PITCH deal.

---

# 36. Business Rules Stored in Database

Database constraints should support, but not replace, application business logic.

Examples:

```text
One User → one Company OR one Committee profile
One Event → one owning Committee
One SavedEvent → unique company/event pair
One active application → company/event
One Deal → one company + one committee + one event
One Deal → one MoU
One MoU → many versions
One MoU version → multiple signatures
One reviewer → one review per deal
```

Complex state transitions remain service-layer logic.

---

# 37. Transaction Requirements

MongoDB transactions should be used when multiple writes must succeed together.

Important examples:

### Accept application → create deal

```text
Application ACCEPTED
+
Deal CREATED
+
Notification CREATED
```

### Accept proposal → agree terms

```text
Proposal ACCEPTED
+
Agreement CREATED
+
Deal status → AGREED
+
Notification
```

### Final signature

```text
Signature CREATED
+
MoU status updated
+
Deal status updated if all required signatures exist
+
Notification
```

These operations should be atomic where practical.

---

# 38. MoU Snapshot Rule

The MoU must NOT dynamically read mutable profile/deal fields after it has been generated.

At generation time:

```text
Agreed Deal
    ↓
Populate MoU
    ↓
Generate PDF
    ↓
Calculate SHA-256
    ↓
Store MoUVersion
```

The generated version becomes a historical snapshot.

If the parties later change terms:

```text
New agreement
    ↓
New MoU version
```

Never modify an already signed version.

---

# 39. Verified History Rule

Do NOT allow:

```text
POST /verified-history
```

for normal Company/Committee users.

Instead:

```text
COMPLETED DEAL
      ↓
system-derived verified history
```

A profile can therefore show:

```text
PITCH VERIFIED
```

and separately:

```text
SELF-REPORTED
```

This preserves trust.

---

# 40. Search Strategy

For v1, MongoDB indexes and standard queries are sufficient.

Searchable event fields:

```text
title
description
category
tags
location
committee name
```

Searchable company fields:

```text
name
industry
location
sponsorship interests
```

Searchable committee fields:

```text
name
college
location
```

If search requirements become significantly more advanced, Atlas Search can be introduced later without redesigning the core relationships.

---

# 41. Recommendation Data

No dedicated recommendation collection is required for v1.

Calculate a simple matching score from:

```text
Company industry
Company preferred event categories
Company target audience
Company preferred location
Company budget
Event category
Event audience
Event location
Event sponsorship requirements
```

Return recommendations dynamically.

A future recommendation cache can be introduced if needed.

---

# 42. Chat Data Strategy

Never store an entire conversation as one MongoDB document.

Use:

```text
Conversation
    ↓
Messages
```

This keeps message history scalable and queryable.

For message retrieval:

```text
conversationId
+
createdAt
```

should be indexed.

---

# 43. Notification Data Strategy

Notifications are persisted.

Realtime delivery can be added through Socket.IO, but the notification must still be stored so that:

```text
User offline
    ↓
Notification remains unread
    ↓
User returns
    ↓
Notification appears
```

---

# 44. Security-sensitive fields

Never return these through normal API responses:

```text
User.passwordHash
Refresh token values
Private signing secrets
Cloudinary API secret
Internal security configuration
```

IP address/user-agent may be restricted to authorized/admin contexts.

---

# 45. Seed Data

Seed data should be created separately from schema definitions.

Recommended seed categories:

```text
1 Admin
2–3 Companies
2–3 Committees
5–10 Events
Multiple packages
Applications
Invitations
Conversations
Messages
Sample proposals
Sample deals
One executed demo deal
Fulfillment examples
Reviews
Notifications
```

Seed data should never be required for production correctness.

---

# 46. Database Environment Configuration

Backend should use environment variables.

Example:

```env
MONGODB_URI=mongodb+srv://...
```

Never commit:

```text
MongoDB credentials
Cloudinary secrets
JWT secrets
Refresh-token secrets
```

to GitHub.

Use `.env.example` with placeholder names only.

---

# 47. Mongoose Model Organization

Recommended backend structure:

```text
backend/
└── src/
    ├── models/
    │   ├── User.js
    │   ├── Company.js
    │   ├── Committee.js
    │   ├── Event.js
    │   ├── SponsorshipPackage.js
    │   ├── Application.js
    │   ├── Invitation.js
    │   ├── SavedEvent.js
    │   ├── Conversation.js
    │   ├── Message.js
    │   ├── ContactShare.js
    │   ├── Deal.js
    │   ├── Proposal.js
    │   ├── DealAgreement.js
    │   ├── MoU.js
    │   ├── MoUVersion.js
    │   ├── Signature.js
    │   ├── Fulfillment.js
    │   ├── FulfillmentEvidence.js
    │   ├── Review.js
    │   ├── Notification.js
    │   ├── SelfReportedHistory.js
    │   ├── File.js
    │   ├── Report.js
    │   └── AuditLog.js
```

Exact filenames can use the team's chosen naming convention.

---

# 48. Implementation Order

Backend database models should be implemented in this order.

## Phase 1

```text
User
Company
Committee
File
```

## Phase 2

```text
Event
SponsorshipPackage
SavedEvent
SelfReportedHistory
```

## Phase 3

```text
Application
Invitation
Conversation
Message
ContactShare
```

## Phase 4

```text
Deal
Proposal
DealAgreement
```

## Phase 5

```text
MoU
MoUVersion
Signature
```

## Phase 6

```text
Fulfillment
FulfillmentEvidence
Review
```

## Phase 7

```text
Notification
Report
AuditLog
```

---

# 49. Frontend Mapping

Frontend should think in terms of API resources rather than collections.

Examples:

```text
Events page
    ↓
GET /events
    ↓
Event API response
    ↓
EventCard
```

```text
Company dashboard
    ↓
GET /deals
GET /applications
GET /invitations
GET /notifications
    ↓
Dashboard components
```

```text
Deal page
    ↓
GET /deals/:dealId
GET /deals/:dealId/proposals
GET /deals/:dealId/fulfillment
GET /deals/:dealId/reviews
```

Frontend does not query MongoDB directly.

---

# 50. Final Database Lifecycle

The complete database lifecycle is:

```text
USER
 │
 ├── COMPANY
 │     │
 │     ├── Saved Events
 │     ├── Applications
 │     ├── Invitations
 │     ├── Conversations
 │     ├── Deals
 │     ├── Reviews
 │     └── Self-Reported History
 │
 └── COMMITTEE
       │
       ├── Events
       ├── Packages
       ├── Invitations
       ├── Conversations
       ├── Deals
       ├── Reviews
       └── Self-Reported History

EVENT
 │
 ├── PACKAGES
 ├── APPLICATIONS
 ├── INVITATIONS
 └── DEALS
       │
       ├── PROPOSALS
       ├── AGREEMENT
       ├── MOU
       │     └── VERSIONS
       │           └── SIGNATURES
       ├── FULFILLMENTS
       │     └── EVIDENCE
       └── REVIEWS
```

---

# 51. Final Rules for Backend Developer

1. Use MongoDB Atlas + Mongoose.
2. Do not put all data inside User.
3. Use references for independent business entities.
4. Embed only small tightly-coupled structures.
5. Add timestamps to major collections.
6. Add indexes before production deployment.
7. Enforce ownership in the service/controller layer.
8. Use database constraints where appropriate.
9. Use transactions for multi-document critical operations.
10. Keep proposal and MoU history immutable.
11. Never modify signed MoU versions.
12. Never manually create verified history.
13. Keep self-reported history separate.
14. Keep chat messages separate from conversations.
15. Store large files outside MongoDB.
16. Never expose secrets.
17. Never let the frontend bypass backend business rules.
18. Keep database schemas aligned with the API contract.
19. Update this document when a database contract changes.
20. Test all important relationships and state transitions.

---

# 52. Definition of Done

The database layer is considered ready when:

```text
[ ] MongoDB Atlas connected
[ ] All required Mongoose models created
[ ] References defined
[ ] Enums defined
[ ] Required fields defined
[ ] Validation defined
[ ] Indexes created
[ ] Unique constraints created
[ ] Ownership rules implemented
[ ] Deal state rules implemented
[ ] MoU versioning implemented
[ ] Signature records implemented
[ ] Fulfillment implemented
[ ] Review constraints implemented
[ ] Audit logging implemented
[ ] Seed scripts created
[ ] Database connection error handling implemented
[ ] API responses match PITCH_API_FINAL.md
```

---

# 53. Source-of-Truth Relationship

The PITCH technical documents should be treated as:

```text
UI SPEC
   ↓
API SPEC
   ↓
DATABASE SPEC
   ↓
IMPLEMENTATION
```

The database must support the API contract.

The API must support the UI requirements.

If a requirement changes, update the relevant specification before changing implementation.

This prevents frontend, backend and database development from drifting apart.


# Final v2 Reconciliation Notes

This final schema supersedes conflicting portions of earlier v1 drafts.

1. Deal lifecycle uses the detailed PITCH state machine: INTERESTED → DISCUSSION → NEGOTIATING → PROPOSAL → COUNTER_PROPOSAL → AGREED → MOU_DRAFT → AWAITING_SIGNATURES → PARTIALLY_SIGNED → EXECUTED → FULFILLMENT → COMPLETED, with DECLINED/CANCELLED/DISPUTED/EXPIRED exception states.
2. Sponsorship contributions support CASH, PRODUCT, FOOD, BEVERAGE, MERCHANDISE, EQUIPMENT, SERVICE, VENUE, TRANSPORTATION, GIFT_HAMPER and OTHER.
3. DealAgreement is the immutable commercial snapshot used to generate the MoU.
4. MoUVersion stores the exact agreement snapshot plus PDF/hash references.
5. Signed MoU versions are immutable.
6. PITCH does not process or hold sponsorship payments. Payment fields record agreed/external payment information only.
7. PITCH signing is a platform consent/signature workflow, not a certified government e-signature service.
8. Verified History is derived from COMPLETED PITCH deals; users cannot create verified-history records manually.

# PITCH — Database Specification (Final)

## Purpose
Authoritative data/business contract for PITCH, a two-sided college sponsorship marketplace and deal-management platform.

## Roles
Exactly: `COMPANY`, `COMMITTEE`, `ADMIN`.

## Core models
### User
`_id, name, email, passwordHash, role, avatar, isActive, lastLoginAt, tokenVersion, createdAt, updatedAt`

### Company
`_id, userId, companyName, industry, description, website, location, targetAudience[], budgetMin, budgetMax, interests[], logo, socialLinks{instagram,linkedin,website}, contact{phone,email}, legalDetails{legalName,legalStatus,registeredAddress,cin,pan,gstin}, selfReportedHistory[], createdAt, updatedAt`

### Committee
`_id, userId, committeeName, collegeName, collegeEmail, description, category, location, logo, socialLinks{instagram,linkedin,website}, contact{phone,email}, legalDetails{legalEntityName,legalStatus,registeredAddress,registrationNumber,pan}, selfReportedEvents[], createdAt, updatedAt`

### Event
`_id, committeeId, title, description, college, location, category, eventType, startDate, endDate, expectedAudience, socialReach, sponsorshipTarget, banner, gallery[], status, visibility, publishedAt, createdAt, updatedAt`

Statuses: `DRAFT`, `PUBLISHED`, `ONGOING`, `COMPLETED`, `ARCHIVED`. Only `PUBLISHED` events are public active sponsorship opportunities.

### SponsorshipPackage
`_id, eventId, name, description, cashPrice, benefits[], maxSponsors, currentSponsors, status, createdAt, updatedAt`

Packages are offers, not final deals.

### Application
`_id, eventId, companyId, message, proposedPackageId, status, createdAt, updatedAt`

### Invitation
`_id, eventId, committeeId, companyId, message, status, createdAt, updatedAt`

### Conversation
`_id, eventId, companyId, committeeId, status, lastMessageId, createdAt, updatedAt`

### Message
`_id, conversationId, senderUserId, type, content, attachments[], metadata{}, readBy[], createdAt, updatedAt`

Types: `TEXT`, `IMAGE`, `DOCUMENT`, `EVENT_CARD`, `PACKAGE_CARD`, `PROPOSAL`, `COUNTER_PROPOSAL`, `CONTACT`, `MOU_CARD`, `SYSTEM`. `FILE` may remain only for backward compatibility if already implemented.

### Contribution
`_id, type, name, description, amount, quantity, unit, estimatedValue, expectedDate, status`

Types: `CASH`, `PRODUCT`, `FOOD`, `BEVERAGE`, `MERCHANDISE`, `EQUIPMENT`, `SERVICE`, `VENUE`, `TRANSPORTATION`, `GIFT_HAMPER`, `OTHER`.

### Deal
`_id, eventId, companyId, committeeId, status, currentProposalId, contributions[], benefits[], obligations[], terms[], mouId, paymentDetails{}, executedAt, completedAt, createdAt, updatedAt`

Statuses:
`INTERESTED`, `DISCUSSION`, `NEGOTIATING`, `PROPOSAL`, `COUNTER_PROPOSAL`, `AGREED`, `MOU_DRAFT`, `AWAITING_SIGNATURES`, `PARTIALLY_SIGNED`, `EXECUTED`, `FULFILLMENT`, `COMPLETED`, `DECLINED`, `CANCELLED`, `DISPUTED`, `EXPIRED`.

Canonical transitions:
```text
INTERESTED -> DISCUSSION/DECLINED/CANCELLED/EXPIRED
DISCUSSION -> NEGOTIATING/DECLINED/CANCELLED/EXPIRED
NEGOTIATING -> PROPOSAL/DECLINED/CANCELLED/EXPIRED
PROPOSAL -> COUNTER_PROPOSAL/AGREED/NEGOTIATING/DECLINED/CANCELLED/EXPIRED
COUNTER_PROPOSAL -> PROPOSAL/AGREED/NEGOTIATING/DECLINED/CANCELLED/EXPIRED
AGREED -> MOU_DRAFT/NEGOTIATING/CANCELLED/DISPUTED
MOU_DRAFT -> AWAITING_SIGNATURES/NEGOTIATING/CANCELLED/DISPUTED
AWAITING_SIGNATURES -> PARTIALLY_SIGNED/EXECUTED/MOU_DRAFT/CANCELLED/DISPUTED
PARTIALLY_SIGNED -> EXECUTED/CANCELLED/DISPUTED
EXECUTED -> FULFILLMENT/COMPLETED/DISPUTED/CANCELLED
FULFILLMENT -> COMPLETED/DISPUTED/CANCELLED
DISPUTED -> FULFILLMENT/COMPLETED/CANCELLED
```
Terminal: `COMPLETED`, `DECLINED`, `CANCELLED`, `EXPIRED`. `RESOLVED` is invalid.

### Proposal
`_id, dealId, version, senderUserId, contributions[], benefits[], obligations[], deliveryRequirements[], terms[], parentProposalId, status, createdAt, updatedAt`

Proposals are versioned and historical versions must not be overwritten.

### Mou
`_id, dealId, currentVersionId, status, mouDetails{referenceNumber,place,validityStart,validityEnd,stampDutyResponsibility,jurisdiction,disputeResolution}, createdAt, updatedAt`

### MouVersion
`_id, mouId, versionNumber, generatedFromProposalId, parties, eventDetails, contributions, benefits, obligations, deliveryRequirements, terms, templateIdentifier, pdfUrl, documentHash, status, createdByUserId, createdAt`

Each version has one authoritative SHA-256 `documentHash`. Signed versions are immutable.

### Signature
`_id, mouVersionId, userId, role, fullName, designation, authorityReference, agreedToTerms, signedAt, documentHash, status, createdAt`

Academic/demo signing only; not certified legal e-signature.

### Fulfillment
`_id, dealId, contributionIndex, contributionName, expectedAmount, expectedQuantity, receivedAmount, receivedQuantity, status, dueDate, evidenceFiles[], notes, updatedByUserId, createdAt, updatedAt`

Statuses: `PENDING`, `PARTIALLY_FULFILLED`, `FULFILLED`, `DISPUTED`.

### Review
`_id, dealId, reviewerUserId, reviewedUserId, reviewedEntityType, rating, title, comment, createdAt, updatedAt`

Only after `COMPLETED`; only participants; one review per direction per deal.

### Notification
`_id, recipientUserId, type, title, body, relatedEntityType, relatedEntityId, actionUrl, read, createdAt`

### Document
`_id, ownerUserId, entityType, entityId, fileName, fileType, mimeType, url, size, hash, createdAt`

### Dispute
`_id, dealId, reportedByUserId, reason, description, evidence[], status, adminNotes, createdAt, updatedAt`

### AuditLog
`_id, actorUserId, action, entityType, entityId, oldValue, newValue, timestamp`

## Business rules
- Every event belongs to exactly one committee.
- Only committees create events.
- Only the owning committee can edit/publish/archive/manage packages/applications/invitations; admins can moderate.
- Companies discover events and apply; committees can invite companies.
- Mutual interest can open a business conversation.
- External WhatsApp/email/phone/meetings are allowed after mutual interest; PITCH is not a WhatsApp replacement.
- No payment processing. Cash is recorded as agreed/received/pending; transfer occurs externally.
- PITCH reputation comes only from completed PITCH deals.
- Older external history is `SELF-REPORTED` and does not count toward PITCH reputation.
- Do not use `isVerified` to imply identity/business verification.
- Match score: Category 25%, Audience 25%, Budget 20%, Location 15%, Event type 15%.

# PITCH MoU Integration Specification --- Final v2

## 1. Source template

The supplied PITCH MoU is a 5-page template containing: - Parties and
purpose - Organiser/sponsor deliverables - Payment details - Term -
Legal/authority/IP/confidentiality/liability provisions -
Cancellation/default/refund - Dispute resolution -
Notices/execution/general terms - Signatory and witness blocks -
Annexure A deliverables menu

The template says bracketed fields must be replaced before signing and
that it is a general template requiring appropriate institutional/legal
review.

## 2. Core principle

The MoU is generated only from an agreed deal.

``` text
Accepted final proposal
→ AGREE
→ MoU data snapshot
→ Template rendering
→ PDF
→ SHA-256 hash
→ MoUVersion
→ Review
→ Signature 1
→ Signature 2
→ EXECUTED
```

`AGREED` is not the same as `EXECUTED`.

## 3. Template identifier

Store:

``` text
templateIdentifier = "PITCH_MOU_V1"
```

Future legal/template changes create a new template identifier/version
rather than silently changing historical documents.

## 4. Page 1 mapping

### Header

Dynamic: - Organisation name - Partner name - MoU reference - Date -
Place - Validity

### First Party

Source: `Committee.legalDetails`, `Committee.contact`, committee
representative.

Fields: - Organisation/committee name - Institution/registered address -
Legal status - Registration number - PAN - Representative -
Designation - Email - Phone - Legal contracting entity

### Second Party

Source: `Company.legalDetails`, `Company.contact`, company
representative.

Fields: - Company name - Registered address - Legal status -
CIN/registration number - PAN - GSTIN - Representative - Designation -
Email - Phone

### Purpose and background

Source: `Event` + `Deal`.

Populate: - Event name - Event type - Description - Date(s) -
Venue/online - Expected audience - Online impressions/social reach -
Type of support - Sponsorship category

The support type can be derived from Deal contributions/terms.

## 5. Page 2 mapping

### Organiser → Sponsor deliverables

Map to:

``` text
Deal.benefits[]
Deal.obligations[]
Deal.terms[]
```

Examples: - Logo/branding - Digital promotion - Event recognition -
On-ground presence - Reporting - Additional benefits - Exclusivity

### Sponsor → Organiser deliverables

Map to:

``` text
Deal.contributions[]
Deal.obligations[]
Deal.terms[]
```

Examples: - Cash sponsorship - Payment schedule - Products - Prizes -
Equipment - Speakers/judges - Refreshments - Brand assets

### Payment details

Store a snapshot inside `Deal.paymentDetails` and again inside the
generated MoUVersion snapshot.

Fields: - Beneficiary name - Account number - Bank - Branch - IFSC -
GSTIN - PAN - Accounts email - Payment schedule - GST rate

PITCH does not process the actual payment in v1.

## 6. Page 3 legal clauses

The approved template wording should remain template-controlled.

Do not have an AI model dynamically invent or rewrite legal clauses.

Dynamic variables may include: - Event - Parties - Jurisdiction - Cure
period - Refund terms - Notice periods - Stamp-duty responsibility -
Dispute-resolution settings

The application only fills approved variable fields.

## 7. Page 4 execution

### First party signer

Capture: - Full name - Designation - Authority reference - Date -
Place - User ID - Role - Consent - Timestamp - MoU version - Document
hash

### Second party signer

Same structure.

### Witnesses

Support: - Name - Signature representation - Optional witness details

The academic/demo signing flow is a platform consent/signature record.
Do not represent it as a legally certified Aadhaar eSign/DSC service
unless an actual certified provider is integrated.

## 8. Page 5 Annexure A

The Annexure A deliverables menu becomes the structured negotiation
vocabulary.

Organiser-side examples: - Logo on
posters/banners/tickets/certificates - Website/social mentions -
Announcements/on-screen slides - Photos/videos - Hackathon problem
statements - Mentors/judges - Recruitment access with consent -
Workshops - Sports branding - Naming rights - Ground/court branding -
Seminar speaker slots - Stage/lanyard/delegate branding -
Stall/exhibition - Cultural-fest rights - Sampling -
Training/social-drive branding

Sponsor-side examples: - Cash - Logo/brand guidelines - Promotional
approval - Social reshare/tag - Prizes - Internships/goodies -
Mentors/judges - Equipment - Refreshments - Venue/AV/catering - Prize
money - Learning materials/tools/licences - Trainers/volunteers -
Funding

Only selected/negotiated items enter the final Deal and MoU.

## 9. MoU snapshot

When generated, create an immutable commercial/legal snapshot:

``` js
{
  parties,
  eventDetails,
  contributions,
  organiserDeliverables,
  sponsorDeliverables,
  paymentDetails,
  term,
  legalSettings,
  signatories,
  witnesses
}
```

Never regenerate an old signed document from current profiles.

If the company later changes its address, GSTIN or representative, an
old signed MoU remains unchanged.

## 10. Versioning

Example:

``` text
Proposal v1
→ Counter v2
→ Accepted v3
→ MoU v1
→ Signing
```

If an executed agreement needs modification:

``` text
New proposal/amendment
→ New MoU version
→ New PDF
→ New SHA-256
→ New signatures
```

Never edit a signed version.

## 11. PDF generation

Required services:

``` text
mouService
pdfService
generateMou
hashDocument
```

Flow:

``` text
Deal
→ buildMoUData()
→ render PITCH_MOU_V1
→ generate PDF
→ calculate SHA-256
→ store PDF URL
→ store hash
→ create MouVersion
```

## 12. Signing

Before signing: - Current MoU version must be FINAL. - Signer must be an
authorized participant. - Signer must belong to the correct role. - User
must confirm agreement. - Current version hash is captured.

On first signature: `Mou.status = PARTIALLY_SIGNED` and Deal status
becomes `PARTIALLY_SIGNED`.

On second required signature: - Signature recorded. - MoUVersion becomes
`SIGNED`. - MoU becomes `EXECUTED`. - Deal becomes `EXECUTED`. -
`executedAt` is set. - Version becomes immutable.

## 13. Document integrity

Store the SHA-256 hash of the exact generated PDF.

Each signature stores the hash of the version signed.

On download/view, the platform can display:

``` text
MoU Version: 2
Document Hash: <SHA-256>
Status: EXECUTED
Signed by: Company + Committee
```

## 14. Fulfillment handoff

After execution:

``` text
EXECUTED
→ create fulfillment items from Deal contributions/obligations
→ PENDING
→ PARTIALLY_FULFILLED
→ FULFILLED
→ COMPLETED
```

Fulfillment evidence is uploaded separately and linked to the relevant
fulfillment item.

## 15. Review/reputation handoff

Only after Deal becomes `COMPLETED`:

``` text
Review unlocked
→ review submitted
→ partner profile updated
→ completed deal appears in PITCH Verified History
```

Self-reported history remains clearly labeled and does not affect
verified reputation.

## 16. MoU UI requirements

The UI should provide:

### Preview

-   Document-like presentation
-   Version number
-   Parties
-   Event
-   Commercial terms
-   Deliverables
-   Payment
-   Signatories
-   Hash/status

### Review

-   Section navigation
-   Highlight dynamic fields
-   Download/preview
-   Confirm review

### Signing

-   Signer information
-   Designation
-   Authority reference
-   Agreement checkbox
-   Signature action
-   Timestamp
-   Version/hash display

### Executed state

-   Both signatures
-   Locked version
-   PDF download
-   Hash
-   Execution date
-   Deal status

## 17. Legal/content boundary

PITCH must preserve the approved template wording.

The application should not: - Invent legal clauses - Rewrite legal
clauses using AI - Claim certified legal e-signature without a real
provider - Claim that PITCH verifies a company's legal identity unless
verification actually exists

The template itself states that it is a general template and not legal
advice; final drafts should be checked by the institution/legal/accounts
team.

## 18. Final MoU lifecycle

``` text
NEGOTIATION
    ↓
FINAL PROPOSAL
    ↓
AGREED
    ↓
MOU_DRAFT
    ↓
GENERATE PDF
    ↓
SHA-256
    ↓
AWAITING_SIGNATURES
    ↓
PARTIALLY_SIGNED
    ↓
EXECUTED
    ↓
FULFILLMENT
    ↓
COMPLETED
    ↓
REVIEW
    ↓
PITCH VERIFIED HISTORY
```

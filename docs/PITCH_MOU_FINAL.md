# PITCH — MoU, Versioning & Signing Specification (Final)

## Purpose
The MoU is the formal closing mechanism after a sponsorship proposal is accepted.

Lifecycle:
`AGREED -> MOU_DRAFT -> AWAITING_SIGNATURES -> PARTIALLY_SIGNED -> EXECUTED`

Accepted proposal is not formal execution.

## Template
Identifier: `PITCH_MOU_V1`

Five-page structure:
1. Parties, purpose, event/context.
2. Deliverables and contribution/payment terms.
3. Legal/operational clauses.
4. Execution/signature section.
5. Annexure A with detailed agreed deliverables.

Template-controlled wording must remain controlled. Do not dynamically invent legal clauses.

## Generation
1. Final proposal is accepted.
2. Backend creates immutable agreement snapshot.
3. Snapshot is used to generate MoU data.
4. PDF is generated from `PITCH_MOU_V1`.
5. SHA-256 hash is calculated.
6. `MouVersion` stores PDF URL and hash.
7. Parties review the exact version.
8. Required parties sign.
9. Deal becomes `EXECUTED` only after all required parties sign.

## Snapshot
Preserve the exact agreed parties, event, contributions, benefits, obligations, delivery requirements, terms and applicable MoU/payment details at generation time. Later profile changes must not silently change an existing version.

## Versioning
Every version contains version number, source proposal, template identifier, PDF, hash, creator, timestamp and status.
Signed versions are immutable. Any executed-agreement change requires a new/amended version, new PDF/hash and signatures again where required.

## Signing
This is an academic/demo signing workflow, not a certified legal e-signature.

Record:
- userId
- role
- fullName
- designation
- authorityReference if applicable
- agreement checkbox
- timestamp
- MoU version
- SHA-256 document hash
- signature status

Use UI language such as:
- Review & Sign
- I have reviewed and agree to this MoU
- Digital signature recorded by PITCH
- Document SHA-256

Do not claim UIDAI verification, certified e-signature, legally certified signing or Aadhaar-based signing.

## MoU UI
Show parties, event, status, version, dates, contributions, benefits, obligations, PDF preview/download, hash, signature checklist and version history. Signed versions must visibly appear locked/immutable.

## Payments
PITCH has no payment gateway, escrow or wallet.
Use **Payment & Fulfillment Status**, not escrow/reserve/payment-processing language.

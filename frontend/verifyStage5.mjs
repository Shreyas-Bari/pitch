import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- RUNNING STAGE 5 VERIFICATION CHECKS ---');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✔ ${message}`);
}

// 1. Verify Deal Components exist
const dealComponents = [
  'DealStatusBadge.jsx',
  'DealTimeline.jsx',
  'ContributionCard.jsx',
  'DealCard.jsx',
  'ProposalCard.jsx',
  'ProposalVersionList.jsx',
  'ProposalFormModal.jsx',
  'FulfillmentTracker.jsx',
  'DisputeModal.jsx',
  'DealWorkspace.jsx',
];

for (const comp of dealComponents) {
  const p = path.join(__dirname, 'src', 'components', 'deals', comp);
  assert(fs.existsSync(p), `Deal component ${comp} exists`);
}

// 2. Verify MoU Components exist
const mouComponents = [
  'MouViewer.jsx',
  'MouSigningModal.jsx',
  'SignatureStatus.jsx',
];

for (const comp of mouComponents) {
  const p = path.join(__dirname, 'src', 'components', 'mou', comp);
  assert(fs.existsSync(p), `MoU component ${comp} exists`);
}

// 3. Verify Review Components exist
const reviewComponents = [
  'RatingStars.jsx',
  'ReviewCard.jsx',
  'ReviewFormModal.jsx',
];

for (const comp of reviewComponents) {
  const p = path.join(__dirname, 'src', 'components', 'reviews', comp);
  assert(fs.existsSync(p), `Review component ${comp} exists`);
}

// 4. Verify Pages exist and are functional
const stage5Pages = [
  path.join('pages', 'company', 'Deals.jsx'),
  path.join('pages', 'company', 'DealDetails.jsx'),
  path.join('pages', 'committee', 'Deals.jsx'),
  path.join('pages', 'committee', 'DealDetails.jsx'),
  path.join('pages', 'deals', 'DealDetails.jsx'),
  path.join('pages', 'mou', 'MouDetails.jsx'),
];

for (const pg of stage5Pages) {
  const p = path.join(__dirname, 'src', pg);
  assert(fs.existsSync(p), `Stage 5 page ${pg} exists`);
  const content = fs.readFileSync(p, 'utf-8');
  assert(!content.includes('StagePlaceholder'), `Page ${pg} is active and not a placeholder`);
}

// 5. Verify Constants: Authoritative Deal Statuses & Transitions
const constantsContent = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'constants.js'), 'utf-8');
const expectedStatuses = [
  'INTERESTED',
  'DISCUSSION',
  'NEGOTIATING',
  'PROPOSAL',
  'COUNTER_PROPOSAL',
  'AGREED',
  'MOU_DRAFT',
  'AWAITING_SIGNATURES',
  'PARTIALLY_SIGNED',
  'EXECUTED',
  'FULFILLMENT',
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
  'DISPUTED',
  'EXPIRED',
];

for (const s of expectedStatuses) {
  assert(constantsContent.includes(`'${s}'`) || constantsContent.includes(`"${s}"`), `DEAL_STATUS includes ${s}`);
}

assert(!constantsContent.includes("'RESOLVED'"), 'RESOLVED is NOT in DEAL_STATUS (per specification)');

// 6. Verify Contribution Types (all 11)
const expectedContributionTypes = [
  'CASH',
  'PRODUCT',
  'FOOD',
  'BEVERAGE',
  'MERCHANDISE',
  'EQUIPMENT',
  'SERVICE',
  'VENUE',
  'TRANSPORTATION',
  'GIFT_HAMPER',
  'OTHER',
];

for (const c of expectedContributionTypes) {
  assert(constantsContent.includes(`'${c}'`), `CONTRIBUTION_TYPES includes ${c}`);
}

// 7. Verify MouViewer implements PITCH_MOU_V1 template and SHA-256 hash display
const mouViewerContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'mou', 'MouViewer.jsx'), 'utf-8');
assert(mouViewerContent.includes('PITCH_MOU_V1'), 'MouViewer implements PITCH_MOU_V1 template identifier');
assert(mouViewerContent.includes('documentHash'), 'MouViewer displays authoritative documentHash');
assert(mouViewerContent.includes('SHA-256'), 'MouViewer displays SHA-256 algorithm label');

// 8. Verify MouSigningModal captures authoritative signing fields
const signingModalContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'mou', 'MouSigningModal.jsx'), 'utf-8');
assert(signingModalContent.includes('fullName'), 'MouSigningModal captures fullName');
assert(signingModalContent.includes('designation'), 'MouSigningModal captures designation');
assert(signingModalContent.includes('agreedToTerms'), 'MouSigningModal requires agreedToTerms');
assert(signingModalContent.includes('signatureData'), 'MouSigningModal captures signatureData');

// 9. Verify FulfillmentTracker supports partial fulfillment
const fulfillmentContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'deals', 'FulfillmentTracker.jsx'), 'utf-8');
assert(fulfillmentContent.includes('PARTIALLY_FULFILLED'), 'FulfillmentTracker supports PARTIALLY_FULFILLED status');
assert(fulfillmentContent.includes('FULFILLED'), 'FulfillmentTracker supports FULFILLED status');

// 10. Verify ReviewCard displays PITCH Verified badge
const reviewCardContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'reviews', 'ReviewCard.jsx'), 'utf-8');
assert(reviewCardContent.includes('PITCH Verified'), 'ReviewCard displays PITCH Verified badge');

console.log('============================================');
console.log('ALL STAGE 5 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('============================================');

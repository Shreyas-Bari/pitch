import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- RUNNING STAGE 4 VERIFICATION CHECKS ---');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✔ ${message}`);
}

// 1. Verify all required chat components exist
const chatComponents = [
  'ChatWorkspace.jsx',
  'ContactShareModal.jsx',
  'ConversationHeader.jsx',
  'ConversationItem.jsx',
  'ConversationList.jsx',
  'MessageBubble.jsx',
  'MessageComposer.jsx',
  'StructuredMessageCard.jsx',
];

for (const comp of chatComponents) {
  const p = path.join(__dirname, 'src', 'components', 'chat', comp);
  assert(fs.existsSync(p), `Chat component ${comp} exists`);
}

// 2. Verify routes in AppRoutes.jsx
const appRoutesContent = fs.readFileSync(path.join(__dirname, 'src', 'routes', 'AppRoutes.jsx'), 'utf-8');
assert(appRoutesContent.includes('/company/conversations'), 'Route /company/conversations is registered');
assert(appRoutesContent.includes('/company/conversations/:conversationId'), 'Route /company/conversations/:conversationId is registered');
assert(appRoutesContent.includes('/committee/conversations'), 'Route /committee/conversations is registered');
assert(appRoutesContent.includes('/committee/conversations/:conversationId'), 'Route /committee/conversations/:conversationId is registered');
assert(appRoutesContent.includes('/messages'), 'Route /messages is registered');
assert(appRoutesContent.includes('/messages/:conversationId'), 'Route /messages/:conversationId is registered');

// 3. Verify StructuredMessageCard handles authoritative message types
const structCardContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'chat', 'StructuredMessageCard.jsx'), 'utf-8');
const expectedTypes = [
  'EVENT_CARD',
  'PACKAGE_CARD',
  'CONTACT',
  'PROPOSAL',
  'COUNTER_PROPOSAL',
  'MOU_CARD',
  'IMAGE',
  'DOCUMENT',
];

for (const t of expectedTypes) {
  assert(structCardContent.includes(t), `StructuredMessageCard supports ${t}`);
}

// 4. Verify MessageBubble handles SYSTEM messages and current user differentiation
const bubbleContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'chat', 'MessageBubble.jsx'), 'utf-8');
assert(bubbleContent.includes('SYSTEM'), 'MessageBubble supports SYSTEM message type');
assert(bubbleContent.includes('isCurrentUser'), 'MessageBubble differentiates outgoing vs incoming');
assert(bubbleContent.includes('isReadByPartner'), 'MessageBubble evaluates readBy state');

// 5. Verify ChatWorkspace implements Socket.IO room lifecycle & events
const workspaceContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'chat', 'ChatWorkspace.jsx'), 'utf-8');
const socketEvents = [
  'conversation:join',
  'conversation:leave',
  'message:new',
  'message:read',
  'typing:start',
  'typing:stop',
];

for (const ev of socketEvents) {
  assert(workspaceContent.includes(ev), `ChatWorkspace implements Socket.IO event "${ev}"`);
}

// 6. Verify deduplication logic in ChatWorkspace
assert(workspaceContent.includes('prev.some((m) => m._id === newMsg._id)'), 'ChatWorkspace implements ID-based message deduplication for incoming socket messages');
assert(workspaceContent.includes('prev.some((m) => m._id === createdMessage._id)'), 'ChatWorkspace implements ID-based message deduplication for REST-sent messages');

// 7. Verify ContactShareModal calls conversationService.shareContact
const modalContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'chat', 'ContactShareModal.jsx'), 'utf-8');
assert(modalContent.includes('conversationService.shareContact'), 'ContactShareModal calls conversationService.shareContact');
assert(modalContent.includes('whatsapp'), 'ContactShareModal supports WhatsApp coordination');

// 8. Verify Stage 5 boundary preservation
assert(!workspaceContent.includes('generateMoU'), 'No Stage 5 MoU generation in Stage 4');
assert(!workspaceContent.includes('signMoU'), 'No Stage 5 MoU signatures in Stage 4');
assert(!workspaceContent.includes('submitFulfillment'), 'No Stage 5 fulfillment in Stage 4');
assert(!workspaceContent.includes('createReview'), 'No Stage 5 reviews in Stage 4');

console.log('============================================');
console.log('ALL STAGE 4 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('============================================');

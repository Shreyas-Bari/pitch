/**
 * PITCH — Model Registry
 * Central export for all 27 authoritative Mongoose models defined across:
 * - docs/PITCH_DATABASE_FINAL.md (25 models: 24 core collections + dealAgreements)
 * - docs/PITCH_FINAL_BUILD_SPEC.md (2 additional models: Dispute & Document)
 *
 * Exact counts:
 * - Authoritative Models: 27
 * - Authoritative Collections: 27
 * - Model Directory Files: 28 (27 model files + 1 index.js registry)
 */

const User = require('./User');
const Company = require('./Company');
const Committee = require('./Committee');
const File = require('./File');
const Event = require('./Event');
const SponsorshipPackage = require('./SponsorshipPackage');
const Application = require('./Application');
const Invitation = require('./Invitation');
const SavedEvent = require('./SavedEvent');
const Conversation = require('./Conversation');
const Message = require('./Message');
const ContactShare = require('./ContactShare');
const Deal = require('./Deal');
const Proposal = require('./Proposal');
const DealAgreement = require('./DealAgreement');
const Mou = require('./Mou');
const MouVersion = require('./MouVersion');
const Signature = require('./Signature');
const Fulfillment = require('./Fulfillment');
const FulfillmentEvidence = require('./FulfillmentEvidence');
const Review = require('./Review');
const SelfReportedHistory = require('./SelfReportedHistory');
const Notification = require('./Notification');
const Report = require('./Report');
const AuditLog = require('./AuditLog');
const Dispute = require('./Dispute');
const Document = require('./Document');

module.exports = {
  User,
  Company,
  Committee,
  File,
  Event,
  SponsorshipPackage,
  Application,
  Invitation,
  SavedEvent,
  Conversation,
  Message,
  ContactShare,
  Deal,
  Proposal,
  DealAgreement,
  Mou,
  MouVersion,
  Signature,
  Fulfillment,
  FulfillmentEvidence,
  Review,
  SelfReportedHistory,
  Notification,
  Report,
  AuditLog,
  Dispute,
  Document,
};

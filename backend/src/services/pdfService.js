const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const { TEMPLATE_IDENTIFIER, HASH_ALGORITHM } = require('../utils/constants');

/**
 * PITCH MoU PDF Rendering Service
 * Source of Truth: docs/PITCH_MOU_FINAL.md & docs/PITCH_FINAL_BUILD_SPEC.md Section 39
 *
 * Implements the authoritative 5-page PITCH_MOU_V1 template structure:
 * - Page 1: Parties, Reference/Date/Place, Legal details, Purpose & Event Background, Sponsorship Support
 * - Page 2: Organiser Deliverables, Sponsor Deliverables, Payment Terms, Term & Duration
 * - Page 3: Legal Nature, IP, Confidentiality, Liability, Cancellation/Default, Dispute Resolution, Governing Law
 * - Page 4: Notices, Stamp Duty, Entire Agreement, Severability, Assignment, Counterparts, Signatories & Witnesses
 * - Page 5: Annexure A (Deliverables menu, In-kind valuation, Exclusivity, Proof requirements)
 */

/**
 * Generate 5-page MoU PDF document as a binary Buffer.
 * @param {Object} options
 * @param {Object} options.mou - Mou container
 * @param {number} options.versionNumber - Version number
 * @param {Object} options.snapshot - Full agreementSnapshot
 * @returns {Promise<{ buffer: Buffer, documentHash: string, pageCount: number }>}
 */
function generateMouPdf({ mou, versionNumber = 1, snapshot = {} }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        autoFirstPage: true,
        size: 'A4',
        margin: 45,
        info: {
          Title: `PITCH MoU v${versionNumber} - ${snapshot.eventDetails?.title || 'Sponsorship'}`,
          Author: 'PITCH Campus Sponsorship Marketplace',
          Subject: 'Memorandum of Understanding for College Sponsorship',
          Keywords: 'PITCH, MoU, Sponsorship, Agreement',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        resolve({
          buffer,
          documentHash: hash,
          pageCount: 5,
        });
      });
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1e3a8a';
      const secondaryColor = '#3b82f6';
      const textColor = '#1f2937';
      const mutedColor = '#6b7280';

      const parties = snapshot.parties || {};
      const committee = parties.committee || {};
      const company = parties.company || {};
      const event = snapshot.eventDetails || {};
      const payment = snapshot.paymentDetails || {};
      const legal = snapshot.legalSettings || {};
      const signatories = Array.isArray(snapshot.signatories) ? snapshot.signatories : [];
      const witnesses = Array.isArray(snapshot.witnesses) ? snapshot.witnesses : [];

      const refNo = `PITCH/MOU/${mou?._id ? mou._id.toString().substring(18).toUpperCase() : 'DEMO'}/V${versionNumber}`;
      const effectiveDateStr = snapshot.term?.effectiveDate
        ? new Date(snapshot.term.effectiveDate).toLocaleDateString('en-IN')
        : new Date().toLocaleDateString('en-IN');
      const place = legal.jurisdiction || 'Mumbai, India';

      // ====================================================
      // PAGE 1: Parties, Header, Legal Details, Purpose & Support
      // ====================================================
      doc.rect(40, 40, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.5);

      doc.fontSize(16).fillColor(primaryColor).text('MEMORANDUM OF UNDERSTANDING', { align: 'center', bold: true });
      doc.fontSize(9).fillColor(secondaryColor).text(`TEMPLATE: ${TEMPLATE_IDENTIFIER} | VERSION ${versionNumber}`, { align: 'center' });
      doc.moveDown(0.8);

      // Reference Meta Box
      doc.fontSize(8.5).fillColor(textColor);
      doc.text(`Reference No: ${refNo}        Date of Execution: ${effectiveDateStr}        Place: ${place}`);
      doc.text(`Validity: ${snapshot.term?.duration || 'Event Term & Completion'}        Status: Commercial Sponsorship Agreement`);
      doc.moveDown(0.8);

      doc.fontSize(11).fillColor(primaryColor).text('BETWEEN THE FOLLOWING PARTIES:', { underline: true });
      doc.moveDown(0.4);

      // First Party Block
      doc.fontSize(9.5).fillColor(textColor).text('1. FIRST PARTY (ORGANISER / COLLEGE COMMITTEE):', { bold: true });
      doc.fontSize(8.5).fillColor(textColor);
      doc.text(`Organisation: ${committee.organisationName || committee.name || '[Organisation Name]'}`);
      doc.text(`Institution / Campus Address: ${committee.institutionAddress || '[Institution Address]'}`);
      doc.text(`Legal Status: ${committee.legalStatus || 'Recognised Student Body / Institutional Committee'} | Reg. No: ${committee.registrationNumber || 'N/A'}`);
      doc.text(`PAN: ${committee.pan || 'N/A'} | GSTIN: ${committee.gstin || 'N/A'} | Contracting Entity: ${committee.legalContractingEntity || committee.organisationName || '[College/University]'}`);
      doc.text(`Authorized Representative: ${committee.representative?.name || '[Representative Name]'} (${committee.representative?.designation || 'Convener/Secretary'})`);
      doc.text(`Official Contact: Email: ${committee.representative?.email || committee.contact?.email || 'N/A'} | Phone: ${committee.representative?.phone || committee.contact?.phone || 'N/A'}`);
      doc.moveDown(0.6);

      // Second Party Block
      doc.fontSize(9.5).fillColor(textColor).text('2. SECOND PARTY (SPONSOR / CORPORATE PARTNER):', { bold: true });
      doc.fontSize(8.5).fillColor(textColor);
      doc.text(`Company Name: ${company.companyName || company.name || '[Company Name]'}`);
      doc.text(`Registered Address: ${company.registeredAddress || '[Registered Corporate Address]'}`);
      doc.text(`Legal Status: ${company.legalStatus || 'Private Limited / Corporate Entity'} | CIN: ${company.cin || 'N/A'}`);
      doc.text(`PAN: ${company.pan || 'N/A'} | GSTIN: ${company.gstin || 'N/A'}`);
      doc.text(`Authorized Representative: ${company.representative?.name || '[Representative Name]'} (${company.representative?.designation || 'Head of Partnerships'})`);
      doc.text(`Official Contact: Email: ${company.representative?.email || company.contact?.email || 'N/A'} | Phone: ${company.representative?.phone || company.contact?.phone || 'N/A'}`);
      doc.moveDown(0.8);

      // Purpose & Event Background
      doc.fontSize(11).fillColor(primaryColor).text('PURPOSE AND BACKGROUND', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(8.5).fillColor(textColor);
      doc.text(
        `WHEREAS the Organiser is hosting the institutional campus event titled "${event.title || 'Campus Event'}" (${event.eventType || event.category || 'Annual Festival'}) scheduled for ${event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN') : 'the designated dates'} at ${event.venue || 'Campus Venue'}, catering to an expected student audience of ${event.expectedAudience?.min || 500} to ${event.expectedAudience?.max || 5000}+ participants;`
      );
      doc.moveDown(0.3);
      doc.text(
        `AND WHEREAS the Sponsor desires to partner with the Organiser to support the Event and receive commercial sponsorship benefits, on-ground visibility, and digital promotion as mutually agreed herein.`
      );
      doc.moveDown(0.6);

      // Sponsorship Category & Support
      doc.fontSize(9.5).fillColor(primaryColor).text('SPONSORSHIP CATEGORY & TYPE OF SUPPORT:');
      doc.fontSize(8.5).fillColor(textColor);
      const contribTypes = snapshot.contributions?.types || [];
      const cashAmt = snapshot.contributions?.cash?.amount || 0;
      doc.text(`Sponsorship Classification: ${contribTypes.length ? contribTypes.join(', ') : 'Mixed Sponsorship'}`);
      doc.text(`Agreed Financial Consideration: INR ${cashAmt.toLocaleString('en-IN')} (Exclusive of statutory taxes where applicable)`);
      doc.text(`In-Kind / Product Support: ${(snapshot.contributions?.nonCash || []).map((nc) => `${nc.quantity || 1} ${nc.unit || 'units'} of ${nc.type || 'PRODUCT'}`).join(', ') || 'None'}`);

      doc.fontSize(7.5).fillColor(mutedColor).text('Page 1 of 5 — PITCH MoU Final v2', 45, doc.page.height - 35, { align: 'center' });

      // ====================================================
      // PAGE 2: Deliverables, Financial Terms & Term
      // ====================================================
      doc.addPage();
      doc.rect(40, 40, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor(primaryColor).text('CLAUSE 1 — DELIVERABLES, OBLIGATIONS & FINANCIAL TERMS', { align: 'center', bold: true });
      doc.moveDown(0.8);

      // Organiser Deliverables
      doc.fontSize(10).fillColor(primaryColor).text('1.1 ORGANISER DELIVERABLES (ORGANISER → SPONSOR):', { bold: true });
      doc.fontSize(8.5).fillColor(textColor);
      const benefits = Array.isArray(snapshot.benefits) && snapshot.benefits.length ? snapshot.benefits : (snapshot.organiserDeliverables || []);
      if (benefits.length > 0) {
        benefits.forEach((b, idx) => {
          const title = b.title || b.description || `Deliverable ${idx + 1}`;
          const desc = b.description && b.title ? ` — ${b.description}` : '';
          doc.text(`• ${title}${desc}`);
        });
      } else {
        doc.text('• Prominent sponsor branding across event banners, digital posters, and official website.');
        doc.text('• On-ground display stall space and marketing announcement slots during mainstage presentations.');
        doc.text('• Logo placement on student participant certificates and promotional merchandise.');
      }
      doc.moveDown(0.6);

      // Sponsor Deliverables
      doc.fontSize(10).fillColor(primaryColor).text('1.2 SPONSOR DELIVERABLES (SPONSOR → ORGANISER):', { bold: true });
      doc.fontSize(8.5).fillColor(textColor);
      const sponsorDeliverables = Array.isArray(snapshot.sponsorDeliverables) && snapshot.sponsorDeliverables.length
        ? snapshot.sponsorDeliverables
        : Array.isArray(snapshot.deliverables) ? snapshot.deliverables.filter(d => d.party === 'COMPANY') : [];
      
      if (cashAmt > 0) {
        doc.text(`• Financial Sponsorship: INR ${cashAmt.toLocaleString('en-IN')} as per agreed schedule.`);
      }
      if (snapshot.contributions?.nonCash && snapshot.contributions.nonCash.length > 0) {
        snapshot.contributions.nonCash.forEach((nc) => {
          doc.text(`• ${nc.quantity || 1} ${nc.unit || 'units'} of ${nc.type}: ${nc.description || nc.name || 'Agreed non-cash support'}.`);
        });
      }
      if (sponsorDeliverables.length > 0) {
        sponsorDeliverables.forEach((sd) => {
          doc.text(`• ${sd.description || sd.title}`);
        });
      }
      doc.moveDown(0.6);

      // Payment Details
      doc.fontSize(10).fillColor(primaryColor).text('1.3 PAYMENT & FINANCIAL DETAILS:', { bold: true });
      doc.fontSize(8.5).fillColor(textColor);
      doc.text(`Beneficiary Name: ${payment.beneficiaryName || committee.organisationName || '[College Account]'}`);
      doc.text(`Bank Name: ${payment.bankName || 'State Bank of India'} | Branch: ${payment.branch || 'Main Campus Branch'}`);
      doc.text(`Account Number: ${payment.accountNumber ? 'XXXXXXXX' + payment.accountNumber.slice(-4) : 'As shared officially'} | IFSC Code: ${payment.ifscCode || 'SBIN000XXXX'}`);
      doc.text(`PAN: ${payment.pan || committee.pan || 'N/A'} | GSTIN: ${payment.gstin || committee.gstin || 'N/A'} | Accounts Email: ${payment.accountsEmail || committee.representative?.email || 'N/A'}`);
      doc.text(`Applicable GST Rate: ${payment.gstRate || 18}% | Currency: ${payment.currency || 'INR'}`);
      doc.moveDown(0.3);
      doc.fontSize(7.5).fillColor(mutedColor).text(
        'NOTICE: PITCH is a technology marketplace and deal-governance platform. PITCH does not custody, process, or escrow funds. All disbursements and invoices are settled directly between the contracting institutions.',
        { italic: true }
      );
      doc.moveDown(0.6);

      // Term
      doc.fontSize(10).fillColor(primaryColor).text('1.4 TERM AND DURATION:', { bold: true });
      doc.fontSize(8.5).fillColor(textColor);
      doc.text(
        `This MoU shall take effect on ${effectiveDateStr} and remain valid until ${snapshot.term?.expiryDate ? new Date(snapshot.term.expiryDate).toLocaleDateString('en-IN') : 'the completion of all post-event reporting and deliverables'}, unless terminated earlier in accordance with the provisions of Clause 2.5.`
      );

      doc.fontSize(7.5).fillColor(mutedColor).text('Page 2 of 5 — PITCH MoU Final v2', 45, doc.page.height - 35, { align: 'center' });

      // ====================================================
      // PAGE 3: Legal Clauses, IP, Confidentiality, Dispute
      // ====================================================
      doc.addPage();
      doc.rect(40, 40, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor(primaryColor).text('CLAUSE 2 — STATUTORY & LEGAL TERMS', { align: 'center', bold: true });
      doc.moveDown(0.8);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.1 LEGAL NATURE OF THE AGREEMENT');
      doc.fontSize(8).fillColor(textColor).text(
        'This Memorandum of Understanding represents a legally binding commercial agreement between the Parties with respect to the sponsorship rights, deliverables, and financial commitments set forth herein.'
      );
      doc.moveDown(0.4);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.2 INTELLECTUAL PROPERTY & TRADEMARKS');
      doc.fontSize(8).fillColor(textColor).text(
        'Each Party retains sole and exclusive ownership of its respective trademarks, trade names, and logos. The Sponsor grants the Organiser a limited, non-exclusive, revocable licence to display the Sponsor mark solely for Event promotion. The Organiser grants the Sponsor a limited, non-exclusive licence to associate with the Event name for the agreed term.'
      );
      doc.moveDown(0.4);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.3 CONFIDENTIALITY & DATA PROTECTION');
      doc.fontSize(8).fillColor(textColor).text(
        'The Parties agree that financial terms, student contact information, and internal operations disclosed during negotiations constitute Confidential Information. Any sharing of attendee or student data must comply with applicable Indian data protection laws and require prior consent. Student data shall not be transferred to third-party brokers.'
      );
      doc.moveDown(0.4);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.4 LIMITATION OF LIABILITY');
      doc.fontSize(8).fillColor(textColor).text(
        'Neither Party shall be liable for indirect, incidental, special, or consequential damages. The maximum aggregate liability of either Party arising out of or related to this MoU shall not exceed the total financial consideration actually paid or agreed to be paid under this agreement.'
      );
      doc.moveDown(0.4);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.5 DEFAULT, CURE PERIOD & CANCELLATION');
      doc.fontSize(8).fillColor(textColor).text(
        `In the event of material breach or failure to deliver agreed sponsorship elements, the aggrieved Party shall provide written notice specifying a cure period of ${legal.curePeriodDays || 15} days. If the default is not cured, the aggrieved Party may terminate the MoU. Refund terms: ${legal.refundTerms || 'Pro-rata refund of unexecuted cash deliverables upon event cancellation by Organiser; non-refundable if cancelled by Sponsor after campaign launch.'}`
      );
      doc.moveDown(0.4);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.6 DISPUTE RESOLUTION');
      doc.fontSize(8).fillColor(textColor).text(
        `Any dispute, controversy, or claim arising out of or relating to this MoU shall be resolved through good-faith negotiation within 15 days. If unresolved, it shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. ${legal.disputeResolution || 'The arbitration proceedings shall take place in ' + place + '.'}`
      );
      doc.moveDown(0.4);

      doc.fontSize(9.5).fillColor(primaryColor).text('2.7 GOVERNING LAW AND JURISDICTION');
      doc.fontSize(8).fillColor(textColor).text(
        `This agreement shall be governed by and construed in accordance with the laws of the Republic of India. Subject to arbitration, the courts situated at ${place} shall have exclusive jurisdiction.`
      );

      doc.fontSize(7.5).fillColor(mutedColor).text('Page 3 of 5 — PITCH MoU Final v2', 45, doc.page.height - 35, { align: 'center' });

      // ====================================================
      // PAGE 4: General Terms & Execution Section
      // ====================================================
      doc.addPage();
      doc.rect(40, 40, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor(primaryColor).text('CLAUSE 3 — GENERAL PROVISIONS & EXECUTION', { align: 'center', bold: true });
      doc.moveDown(0.8);

      doc.fontSize(8).fillColor(textColor);
      doc.text(`3.1 NOTICES: All legal notices shall be sent to the official representative emails specified on Page 1 with a notice period of ${legal.noticePeriodDays || 30} days.`);
      doc.text(`3.2 STAMP DUTY: Any applicable stamp duty shall be ${legal.stampDutyResponsibility || 'shared equally between the Parties'}.`);
      doc.text('3.3 ENTIRE AGREEMENT: This MoU, including Annexure A, supersedes all prior verbal or written understandings between the Parties regarding this sponsorship.');
      doc.text('3.4 SEVERABILITY: If any provision is found invalid, the remaining provisions shall remain fully enforceable.');
      doc.text('3.5 ASSIGNMENT: Neither Party may assign or sub-contract its rights without prior written consent.');
      doc.text('3.6 COUNTERPARTS: This MoU may be executed electronically via the PITCH platform in counterparts, each having equal evidentiary value.');
      doc.moveDown(1);

      doc.fontSize(11).fillColor(primaryColor).text('IN WITNESS WHEREOF, THE PARTIES HAVE EXECUTED THIS MOU:', { underline: true });
      doc.moveDown(0.8);

      // Signatory Table / Blocks
      const boxWidth = 240;
      const boxHeight = 120;
      const startY = doc.y;

      // First Party Signer Box
      doc.rect(45, startY, boxWidth, boxHeight).strokeColor('#d1d5db').stroke();
      doc.fontSize(9).fillColor(primaryColor).text('FIRST PARTY (COMMITTEE)', 55, startY + 10, { bold: true });
      const committeeSigner = signatories.find(s => s.role === 'COMMITTEE') || {};
      doc.fontSize(8).fillColor(textColor);
      doc.text(`Name: ${committeeSigner.name || committee.representative?.name || '[Authorized Signatory]'}`, 55, startY + 30);
      doc.text(`Designation: ${committeeSigner.designation || committee.representative?.designation || 'Authorized Convener'}`, 55, startY + 45);
      doc.text(`Authority: ${committeeSigner.authorityReference || 'Institutional Resolution'}`, 55, startY + 60);
      doc.text(`Status: ${committeeSigner.signedAt ? 'DIGITALLY SIGNED (' + new Date(committeeSigner.signedAt).toLocaleDateString('en-IN') + ')' : 'AWAITING SIGNATURE'}`, 55, startY + 75, { bold: true });
      if (committeeSigner.signatureData) {
        doc.fontSize(7).fillColor(secondaryColor).text(`Sign Data: ${committeeSigner.signatureData.substring(0, 30)}...`, 55, startY + 95);
      }

      // Second Party Signer Box
      doc.rect(doc.page.width - 45 - boxWidth, startY, boxWidth, boxHeight).strokeColor('#d1d5db').stroke();
      doc.fontSize(9).fillColor(primaryColor).text('SECOND PARTY (SPONSOR)', doc.page.width - 35 - boxWidth, startY + 10, { bold: true });
      const companySigner = signatories.find(s => s.role === 'COMPANY') || {};
      doc.fontSize(8).fillColor(textColor);
      doc.text(`Name: ${companySigner.name || company.representative?.name || '[Authorized Signatory]'}`, doc.page.width - 35 - boxWidth, startY + 30);
      doc.text(`Designation: ${companySigner.designation || company.representative?.designation || 'Head of Partnerships'}`, doc.page.width - 35 - boxWidth, startY + 45);
      doc.text(`Authority: ${companySigner.authorityReference || 'Corporate Authority'}`, doc.page.width - 35 - boxWidth, startY + 60);
      doc.text(`Status: ${companySigner.signedAt ? 'DIGITALLY SIGNED (' + new Date(companySigner.signedAt).toLocaleDateString('en-IN') + ')' : 'AWAITING SIGNATURE'}`, doc.page.width - 35 - boxWidth, startY + 75, { bold: true });
      if (companySigner.signatureData) {
        doc.fontSize(7).fillColor(secondaryColor).text(`Sign Data: ${companySigner.signatureData.substring(0, 30)}...`, doc.page.width - 35 - boxWidth, startY + 95);
      }

      // Witnesses Block below
      doc.y = startY + boxHeight + 20;
      doc.fontSize(9).fillColor(primaryColor).text('WITNESS ATTESTATION:');
      doc.fontSize(8).fillColor(textColor);
      doc.text(`Witness 1: ${witnesses[0]?.name || 'Faculty Mentor / Advisory In-Charge'} (${witnesses[0]?.designation || 'Institution Staff Advisor'})`);
      doc.text(`Witness 2: ${witnesses[1]?.name || 'Legal & Financial Representative'} (${witnesses[1]?.designation || 'Corporate Counsel'})`);

      doc.fontSize(7.5).fillColor(mutedColor).text('Page 4 of 5 — PITCH MoU Final v2', 45, doc.page.height - 35, { align: 'center' });

      // ====================================================
      // PAGE 5: Annexure A (Deliverables Matrix & Proof Requirements)
      // ====================================================
      doc.addPage();
      doc.rect(40, 40, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor(primaryColor).text('ANNEXURE A — DELIVERABLES MENU & EXECUTION MATRIX', { align: 'center', bold: true });
      doc.moveDown(0.8);

      doc.fontSize(9.5).fillColor(primaryColor).text('A.1 STRUCTURED DELIVERABLES MENU & ACTIVATIONS:');
      doc.fontSize(8).fillColor(textColor);
      doc.text('• Digital Branding: Official social media reshare, handles tagging, website sponsor banner placement.');
      doc.text('• On-Ground Activation: Exhibition stall / booth setup space (10x10 ft minimum), LED screen logo rotations.');
      doc.text('• Collateral Inclusions: Logo inclusion on student lanyard cards, delegate kits, and certificates of merit.');
      doc.text('• Stage Recognition: Minimum two (2) verbal acknowledgements during opening and closing ceremonies.');
      doc.moveDown(0.6);

      doc.fontSize(9.5).fillColor(primaryColor).text('A.2 IN-KIND VALUATION & PRODUCT COMMITMENTS:');
      doc.fontSize(8).fillColor(textColor);
      if (snapshot.contributions?.nonCash && snapshot.contributions.nonCash.length > 0) {
        snapshot.contributions.nonCash.forEach((nc, idx) => {
          doc.text(`Item ${idx + 1}: ${nc.type} | Name: ${nc.name || nc.description || 'Support'} | Quantity: ${nc.quantity || 1} ${nc.unit || 'units'} | Estimated Value: INR ${(nc.estimatedValue || 0).toLocaleString('en-IN')}`);
        });
      } else {
        doc.text('No separate in-kind materials recorded. All sponsorship obligations are structured as direct cash support.');
      }
      doc.moveDown(0.6);

      doc.fontSize(9.5).fillColor(primaryColor).text('A.3 EXCLUSIVITY & BRAND COMMITMENTS:');
      doc.fontSize(8).fillColor(textColor);
      doc.text(`Industry Category: ${company.industry || 'Exclusive Partnership'}. Organiser commits that no competing brand in the same specific core product tier will be awarded equal or higher co-title sponsorship rights without prior written disclosure.`);
      doc.moveDown(0.6);

      doc.fontSize(9.5).fillColor(primaryColor).text('A.4 PROOF OF FULFILLMENT REQUIREMENTS:');
      doc.fontSize(8).fillColor(textColor);
      doc.text('The Organiser must provide verifiable fulfillment evidence within 14 days of Event conclusion:');
      doc.text('1. High-resolution photographs showing physical banner placement, stalls, and stage banners.');
      doc.text('2. Screenshots and engagement analytics of official social media postings.');
      doc.text('3. Event participation audit summary report signed by the Student Convener.');
      doc.text('4. Evidence uploaded directly to the PITCH Deal Fulfillment tracking workspace.');
      doc.moveDown(1.5);

      // Document Integrity Footer on Page 5
      doc.rect(45, doc.y, doc.page.width - 90, 45).fillAndStroke('#f3f4f6', '#d1d5db');
      const boxY = doc.y;
      doc.fontSize(8).fillColor(primaryColor).text('DOCUMENT INTEGRITY & PLATFORM GOVERNANCE', 55, boxY + 8, { bold: true });
      doc.fontSize(7.5).fillColor(textColor).text(`Template: ${TEMPLATE_IDENTIFIER} | Version: ${versionNumber} | Algorithm: ${HASH_ALGORITHM}`, 55, boxY + 20);
      doc.text(`SHA-256 Digest is calculated across all five pages and sealed upon execution.`, 55, boxY + 32);

      doc.fontSize(7.5).fillColor(mutedColor).text('Page 5 of 5 — PITCH MoU Final v2', 45, doc.page.height - 35, { align: 'center' });

      // Finalize PDF stream
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateMouPdf,
};

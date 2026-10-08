const express = require('express');
const mouController = require('../controllers/mouController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateGenerateMou, validateSignMou } = require('../validators/mouValidator');

const router = express.Router();

/**
 * MoU & Signature Routes
 * Source of Truth: docs/PITCH_API_FINAL.md Sections 14-15 & docs/PITCH_MOU_FINAL.md
 */

router.use(authenticate);

// MoU Container & Document
router.get('/:mouId', mouController.getMouById);
router.get('/:mouId/preview', mouController.getMouPreview);
router.get('/:mouId/download', mouController.downloadMou);
router.get('/:mouId/pdf', mouController.downloadMou); // Alias

// MoU Versioning
router.post(
  '/:mouId/versions',
  validateRequest({ body: validateGenerateMou }),
  mouController.createNewVersion
);
router.get('/:mouId/versions', mouController.getVersions);
router.get('/:mouId/versions/:versionId', mouController.getVersionById);
router.get('/:mouId/versions/:versionId/download', mouController.downloadVersionPdf);

// Digital Signing & Verification
router.get('/:mouId/signing-status', mouController.getSigningStatus);
router.post(
  '/:mouId/sign',
  validateRequest({ body: validateSignMou }),
  mouController.signMou
);
router.get('/:mouId/signatures', mouController.getSignatures);
router.get('/:mouId/executed-document', mouController.getExecutedDocument);

module.exports = router;

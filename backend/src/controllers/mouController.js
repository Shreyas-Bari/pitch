const mouService = require('../services/mouService');
const signatureService = require('../services/signatureService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * MoU & Signature Controller
 * Source of Truth: docs/PITCH_API_FINAL.md Sections 14-15 & docs/PITCH_MOU_FINAL.md
 */

async function getMouById(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const mou = await mouService.getMouById({
      mouId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, mou, 200);
  } catch (err) {
    next(err);
  }
}

async function getMouPreview(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const versionId = req.query.versionId;
    const preview = await mouService.getMouPreview({
      mouId,
      versionId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, preview, 200);
  } catch (err) {
    next(err);
  }
}

async function downloadMou(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const versionId = req.query.versionId;
    const { buffer, documentHash, fileName } = await mouService.getMouPdfBuffer({
      mouId,
      versionId,
      userId: req.user._id,
      role: req.user.role,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Document-Hash', documentHash);
    res.setHeader('X-Hash-Algorithm', 'SHA-256');

    return res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}

async function createNewVersion(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const result = await mouService.createNewMouVersion({
      mouId,
      userId: req.user._id,
      role: req.user.role,
      options: req.body,
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function getVersions(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const versions = await mouService.getMouVersions({
      mouId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, versions, 200);
  } catch (err) {
    next(err);
  }
}

async function getVersionById(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const versionId = req.params.versionId;
    const version = await mouService.getMouVersionById({
      mouId,
      versionId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, version, 200);
  } catch (err) {
    next(err);
  }
}

async function downloadVersionPdf(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const versionId = req.params.versionId;
    const { buffer, documentHash, fileName } = await mouService.getMouPdfBuffer({
      mouId,
      versionId,
      userId: req.user._id,
      role: req.user.role,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Document-Hash', documentHash);
    res.setHeader('X-Hash-Algorithm', 'SHA-256');

    return res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}

const signatureController = require('./signatureController');

module.exports = {
  getMouById,
  getMouPreview,
  downloadMou,
  createNewVersion,
  getVersions,
  getVersionById,
  downloadVersionPdf,
  ...signatureController,
};

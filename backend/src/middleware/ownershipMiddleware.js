const mongoose = require('mongoose');
const { Company, Committee, Event } = require('../models');
const { ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');

/**
 * Backend Ownership Authorization Middleware.
 * Enforces resource ownership and relationship validation.
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md Section 35.2
 */

/**
 * Enforce that the requested Company resource belongs to the authenticated user.
 * Admin can manage/moderate if allowAdmin is true (default).
 * @param {Object} [options]
 * @param {string} [options.paramName='companyId']
 * @param {boolean} [options.allowAdmin=true]
 * @returns {Function} Express middleware
 */
function requireCompanyOwnership(options = {}) {
  const paramName = options.paramName || 'companyId';
  const allowAdmin = options.allowAdmin !== false;

  return async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.', null, 'UNAUTHORIZED'));
      }

      const resourceId = req.params[paramName] || req.params.id;
      if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
        return next(ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID'));
      }

      const company = await Company.findById(resourceId);
      if (!company) {
        return next(ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND'));
      }

      // Admin bypass for administrative moderation
      if (allowAdmin && req.user.role === ROLES.ADMIN) {
        req.company = company;
        req.resource = company;
        return next();
      }

      // User must have COMPANY role
      if (req.user.role !== ROLES.COMPANY) {
        return next(
          ApiError.forbidden(
            'Access denied. Insufficient permissions to access company resources.',
            null,
            'FORBIDDEN'
          )
        );
      }

      // User must own this company profile
      if (!company.userId.equals(req.user._id)) {
        return next(
          ApiError.forbidden(
            'Access denied. You do not own this company resource.',
            null,
            'FORBIDDEN'
          )
        );
      }

      req.company = company;
      req.resource = company;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Enforce that the requested Committee resource belongs to the authenticated user.
 * Admin can manage/moderate if allowAdmin is true (default).
 * @param {Object} [options]
 * @param {string} [options.paramName='committeeId']
 * @param {boolean} [options.allowAdmin=true]
 * @returns {Function} Express middleware
 */
function requireCommitteeOwnership(options = {}) {
  const paramName = options.paramName || 'committeeId';
  const allowAdmin = options.allowAdmin !== false;

  return async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.', null, 'UNAUTHORIZED'));
      }

      const resourceId = req.params[paramName] || req.params.id;
      if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
        return next(ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID'));
      }

      const committee = await Committee.findById(resourceId);
      if (!committee) {
        return next(ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND'));
      }

      // Admin bypass for administrative moderation
      if (allowAdmin && req.user.role === ROLES.ADMIN) {
        req.committee = committee;
        req.resource = committee;
        return next();
      }

      // User must have COMMITTEE role
      if (req.user.role !== ROLES.COMMITTEE) {
        return next(
          ApiError.forbidden(
            'Access denied. Insufficient permissions to access committee resources.',
            null,
            'FORBIDDEN'
          )
        );
      }

      // User must own this committee profile
      if (!committee.userId.equals(req.user._id)) {
        return next(
          ApiError.forbidden(
            'Access denied. You do not own this committee resource.',
            null,
            'FORBIDDEN'
          )
        );
      }

      req.committee = committee;
      req.resource = committee;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Enforce that the requested Event resource belongs to the authenticated user's Committee.
 * Resolves event ownership through event.committeeId.
 * Admin can manage/moderate if allowAdmin is true (default).
 * @param {Object} [options]
 * @param {string} [options.paramName='eventId']
 * @param {boolean} [options.allowAdmin=true]
 * @returns {Function} Express middleware
 */
function requireEventOwnership(options = {}) {
  const paramName = options.paramName || 'eventId';
  const allowAdmin = options.allowAdmin !== false;

  return async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.', null, 'UNAUTHORIZED'));
      }

      const eventId = req.params[paramName] || req.params.id;
      if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        return next(ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID'));
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return next(ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND'));
      }

      // Admin bypass for administrative moderation
      if (allowAdmin && req.user.role === ROLES.ADMIN) {
        req.event = event;
        req.resource = event;
        return next();
      }

      // User must have COMMITTEE role to own events
      if (req.user.role !== ROLES.COMMITTEE) {
        return next(
          ApiError.forbidden(
            'Access denied. Insufficient permissions to manage events.',
            null,
            'FORBIDDEN'
          )
        );
      }

      // Resolve authenticated user's Committee document
      const userCommittee = await Committee.findOne({ userId: req.user._id });
      if (!userCommittee) {
        return next(
          ApiError.forbidden(
            'Access denied. Committee profile not found for user.',
            null,
            'FORBIDDEN'
          )
        );
      }

      // Event must belong to the user's committee
      if (!event.committeeId.equals(userCommittee._id)) {
        return next(
          ApiError.forbidden(
            'Access denied. You do not own this event.',
            null,
            'FORBIDDEN'
          )
        );
      }

      req.event = event;
      req.committee = userCommittee;
      req.resource = event;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Generic resource ownership verification middleware.
 * @param {Object} config
 * @param {Model} config.model - Mongoose model
 * @param {string} [config.paramName='id'] - Request param containing resource ID
 * @param {string} [config.ownerField='userId'] - Field on model containing owner ID
 * @param {boolean} [config.allowAdmin=true] - Whether admin can access
 * @param {string} [config.resourceName='Resource'] - Resource name for error messages
 * @returns {Function} Express middleware
 */
function requireOwnership(config = {}) {
  const {
    model,
    paramName = 'id',
    ownerField = 'userId',
    allowAdmin = true,
    resourceName = 'Resource',
  } = config;

  return async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.', null, 'UNAUTHORIZED'));
      }

      const resourceId = req.params[paramName];
      if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
        return next(ApiError.badRequest(`Invalid ${resourceName} ID format`, null, 'INVALID_ID'));
      }

      const doc = await model.findById(resourceId);
      if (!doc) {
        return next(ApiError.notFound(`${resourceName} not found`, null, 'NOT_FOUND'));
      }

      if (allowAdmin && req.user.role === ROLES.ADMIN) {
        req.resource = doc;
        return next();
      }

      const docOwner = doc[ownerField];
      const isOwner = docOwner && (
        docOwner.equals ? docOwner.equals(req.user._id) : docOwner.toString() === req.user._id.toString()
      );

      if (!isOwner) {
        return next(
          ApiError.forbidden(
            `Access denied. You do not own this ${resourceName.toLowerCase()}.`,
            null,
            'FORBIDDEN'
          )
        );
      }

      req.resource = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requireCompanyOwnership,
  requireCommitteeOwnership,
  requireEventOwnership,
  requireOwnership,
};

const { Event, Company, Committee } = require('../models');
const matchingService = require('../services/matchingService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { EVENT_STATUS } = require('../utils/constants');

/**
 * Search & Recommendations Controller
 * Sources: docs/PITCH_API_FINAL.md Section 7 & docs/PITCH_FINAL_BUILD_SPEC.md Section 36
 */

async function search(req, res, next) {
  try {
    const q = (req.query.search || req.query.q || '').trim();
    const type = (req.query.type || 'all').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const results = {};

    if (type === 'events' || type === 'all') {
      const eventFilter = { status: EVENT_STATUS.PUBLISHED };
      if (q) {
        eventFilter.$or = [
          { title: { $regex: new RegExp(q, 'i') } },
          { description: { $regex: new RegExp(q, 'i') } },
          { category: { $regex: new RegExp(q, 'i') } },
          { tags: { $in: [new RegExp(q, 'i')] } },
          { 'location.city': { $regex: new RegExp(q, 'i') } },
        ];
      }
      if (req.query.category) {
        eventFilter.category = { $regex: new RegExp(`^${req.query.category.trim()}$`, 'i') };
      }
      if (req.query.city) {
        eventFilter['location.city'] = { $regex: new RegExp(req.query.city.trim(), 'i') };
      }
      if (req.query.budgetMin) {
        eventFilter['sponsorshipRequirements.budgetMax'] = { $gte: Number(req.query.budgetMin) };
      }
      if (req.query.budgetMax) {
        eventFilter['sponsorshipRequirements.budgetMin'] = { $lte: Number(req.query.budgetMax) };
      }

      const [eventTotal, events] = await Promise.all([
        Event.countDocuments(eventFilter),
        Event.find(eventFilter)
          .populate('committeeId', 'name college logoFileId verificationStatus')
          .populate('bannerFileId')
          .sort({ eventDate: 1 })
          .skip(skip)
          .limit(limit),
      ]);

      if (type === 'events') {
        return sendPaginated(res, events, {
          page,
          limit,
          total: eventTotal,
          totalPages: Math.ceil(eventTotal / limit) || 1,
        });
      }

      results.events = events;
      results.eventsTotal = eventTotal;
    }

    if (type === 'companies' || type === 'all') {
      const companyFilter = {};
      if (q) {
        companyFilter.$or = [
          { name: { $regex: new RegExp(q, 'i') } },
          { industry: { $regex: new RegExp(q, 'i') } },
          { description: { $regex: new RegExp(q, 'i') } },
          { 'location.city': { $regex: new RegExp(q, 'i') } },
        ];
      }
      if (req.query.industry) {
        companyFilter.industry = { $regex: new RegExp(`^${req.query.industry.trim()}$`, 'i') };
      }

      const [companyTotal, companies] = await Promise.all([
        Company.countDocuments(companyFilter),
        Company.find(companyFilter)
          .select('name description industry website location logoFileId coverFileId sponsorshipPreferences isProfileComplete createdAt')
          .populate('logoFileId')
          .populate('coverFileId')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit),
      ]);

      if (type === 'companies') {
        return sendPaginated(res, companies, {
          page,
          limit,
          total: companyTotal,
          totalPages: Math.ceil(companyTotal / limit) || 1,
        });
      }

      results.companies = companies;
      results.companiesTotal = companyTotal;
    }

    return sendSuccess(res, { results }, 200);
  } catch (err) {
    next(err);
  }
}

async function getEventRecommendations(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const recommendations = await matchingService.getRecommendedEvents(req.user._id, limit);
    return sendSuccess(res, { recommendations }, 200);
  } catch (err) {
    next(err);
  }
}

async function getCompanyRecommendations(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const recommendations = await matchingService.getRecommendedCompanies(req.user._id, req.query.eventId, limit);
    return sendSuccess(res, { recommendations }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  search,
  getEventRecommendations,
  getCompanyRecommendations,
};

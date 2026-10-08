const { Event, Company, Committee } = require('../models');
const ApiError = require('../utils/apiError');
const { EVENT_STATUS } = require('../utils/constants');

/**
 * Matching Engine & Scoring
 * Sources:
 * - docs/PITCH_FINAL_BUILD_SPEC.md Section 36
 * - docs/PITCH_API_FINAL.md Section 7
 *
 * Deterministic Rules:
 * - Category: 25%
 * - Audience: 25%
 * - Budget: 20%
 * - Location: 15%
 * - Event Type: 15%
 * Total: 100%
 */

function calculateMatchScore(company, event) {
  const reasons = [];
  let categoryScore = 0;
  let audienceScore = 0;
  let budgetScore = 0;
  let locationScore = 0;
  let eventTypeScore = 0;

  const prefs = company.sponsorshipPreferences || {};
  const eventCategories = Array.isArray(prefs.eventCategories) ? prefs.eventCategories : [];
  const preferredLocations = Array.isArray(prefs.preferredLocations) ? prefs.preferredLocations : [];
  const targetAudience = Array.isArray(prefs.targetAudience) ? prefs.targetAudience : [];

  // 1. Category Matching (Max 25 pts)
  const eCat = (event.category || '').toLowerCase();
  const cInd = (company.industry || '').toLowerCase();

  const exactCategoryMatch = eventCategories.some(c => c.toLowerCase() === eCat);
  const relatedCategoryMatch = eventCategories.some(c => eCat.includes(c.toLowerCase()) || c.toLowerCase().includes(eCat));

  if (exactCategoryMatch) {
    categoryScore = 25;
    reasons.push(`${event.category} category match`);
  } else if (relatedCategoryMatch || (cInd && (eCat.includes(cInd) || cInd.includes(eCat)))) {
    categoryScore = 18;
    reasons.push(`Related industry and category alignment (${event.category})`);
  } else if (eventCategories.length === 0) {
    categoryScore = 12; // Neutral baseline when no preferences set
    reasons.push(`Open category alignment (${event.category})`);
  } else {
    categoryScore = 5;
  }

  // 2. Audience Matching (Max 25 pts)
  const audDesc = (event.audienceDescription || '').toLowerCase();
  const eventTags = Array.isArray(event.tags) ? event.tags.map(t => t.toLowerCase()) : [];
  const audMatch = targetAudience.some(ta => {
    const t = ta.toLowerCase();
    return audDesc.includes(t) || eventTags.some(tag => tag.includes(t));
  });

  if (audMatch) {
    audienceScore = 25;
    reasons.push(`Target audience match (${targetAudience.join(', ')})`);
  } else if (event.estimatedReach >= 500 || (event.expectedAudience && event.expectedAudience.max >= 500)) {
    audienceScore = 18;
    reasons.push(`Audience reach aligns with campaign targets`);
  } else {
    audienceScore = 10;
  }

  // 3. Budget Matching (Max 20 pts)
  const cMin = prefs.budgetMin || 0;
  const cMax = prefs.budgetMax || 0;
  const eReq = event.sponsorshipRequirements || {};
  const eMin = eReq.budgetMin || 0;
  const eMax = eReq.budgetMax || 0;

  if (cMax > 0 && eMin > 0) {
    // Both define ranges
    if (cMax >= eMin && (cMin <= eMax || eMax === 0)) {
      budgetScore = 20;
      reasons.push(`Budget compatible`);
    } else if (cMax * 1.3 >= eMin) {
      budgetScore = 12;
      reasons.push(`Budget within negotiable range`);
    } else {
      budgetScore = 4;
    }
  } else {
    // Flexible / unconstrained budget
    budgetScore = 15;
    reasons.push(`Flexible budget parameters`);
  }

  // 4. Location Matching (Max 15 pts)
  const eLocMode = event.location?.mode;
  const eCity = (event.location?.city || '').toLowerCase();
  const cCity = (company.location?.city || '').toLowerCase();

  if (eLocMode === 'ONLINE') {
    locationScore = 15;
    reasons.push(`Online event accessible anywhere`);
  } else if (cCity && eCity && (cCity === eCity || eCity.includes(cCity) || cCity.includes(eCity))) {
    locationScore = 15;
    reasons.push(`${event.location?.city || 'Local'} location match`);
  } else if (preferredLocations.some(pl => pl.toLowerCase() === eCity || eCity.includes(pl.toLowerCase()))) {
    locationScore = 15;
    reasons.push(`Preferred location match (${event.location?.city})`);
  } else if (eLocMode === 'HYBRID') {
    locationScore = 12;
    reasons.push(`Hybrid event with remote reach`);
  } else {
    locationScore = 6;
  }

  // 5. Event Type Matching (Max 15 pts)
  const eType = (event.eventType || '').toLowerCase();
  if (['festival', 'hackathon', 'conference', 'competition'].includes(eType)) {
    eventTypeScore = 15;
    reasons.push(`${event.eventType} format aligns with brand exposure`);
  } else {
    eventTypeScore = 10;
  }

  const totalScore = Math.min(100, Math.max(0, categoryScore + audienceScore + budgetScore + locationScore + eventTypeScore));

  return {
    score: totalScore,
    breakdown: {
      category: categoryScore,
      audience: audienceScore,
      budget: budgetScore,
      location: locationScore,
      eventType: eventTypeScore,
    },
    reasons,
  };
}

async function getRecommendedEvents(companyUserId, limit = 10) {
  const company = await Company.findOne({ userId: companyUserId });
  if (!company) {
    throw ApiError.badRequest('Company profile required for event recommendations', null, 'PROFILE_REQUIRED');
  }

  const events = await Event.find({ status: EVENT_STATUS.PUBLISHED })
    .populate('committeeId', 'name college logoFileId verificationStatus')
    .populate('bannerFileId');

  const scoredEvents = events.map(event => {
    const match = calculateMatchScore(company, event);
    return {
      event,
      score: match.score,
      reasons: match.reasons,
      breakdown: match.breakdown,
    };
  });

  scoredEvents.sort((a, b) => b.score - a.score);

  return scoredEvents.slice(0, Math.min(50, Math.max(1, limit)));
}

async function getRecommendedCompanies(committeeUserId, eventId = null, limit = 10) {
  const committee = await Committee.findOne({ userId: committeeUserId });
  if (!committee) {
    throw ApiError.badRequest('Committee profile required for company recommendations', null, 'PROFILE_REQUIRED');
  }

  let event = null;
  if (eventId) {
    event = await Event.findOne({ _id: eventId, committeeId: committee._id });
    if (!event) {
      throw ApiError.notFound('Event not found or not owned by committee', null, 'EVENT_NOT_FOUND');
    }
  } else {
    // Get latest active/published event from this committee
    event = await Event.findOne({ committeeId: committee._id, status: EVENT_STATUS.PUBLISHED }).sort({ createdAt: -1 });
    if (!event) {
      event = await Event.findOne({ committeeId: committee._id }).sort({ createdAt: -1 });
    }
  }

  const companies = await Company.find({ isProfileComplete: true });

  if (!event) {
    // If committee has no events yet, return top complete companies
    return companies.slice(0, limit).map(company => ({
      company,
      score: 50,
      reasons: ['Profile verified and active on PITCH'],
    }));
  }

  const scoredCompanies = companies.map(company => {
    const match = calculateMatchScore(company, event);
    return {
      company,
      score: match.score,
      reasons: match.reasons,
      breakdown: match.breakdown,
      forEvent: { _id: event._id, title: event.title },
    };
  });

  scoredCompanies.sort((a, b) => b.score - a.score);

  return scoredCompanies.slice(0, Math.min(50, Math.max(1, limit)));
}

module.exports = {
  calculateMatchScore,
  getRecommendedEvents,
  getRecommendedCompanies,
};

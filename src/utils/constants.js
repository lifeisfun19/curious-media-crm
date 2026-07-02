// Design tokens & data constants — mirrors the approved HTML dashboard 1:1.
// Do not change values here without re-approving the design.

export const CATS = [
  "Entertainment",
  "Comedy",
  "Emotional",
  "Informative",
  "Pranks",
  "Lifestyle",
  "Education",
];

export const LANGS = [
  "Telugu",
  "Tamil",
  "Hindi",
  "Malayalam",
  "Kannada",
  "Bengali",
  "English",
];

export const PLATFORMS = ["Instagram", "YouTube", "Twitter", "LinkedIn"];

export const GENDERS = ["Male", "Female", "Others"];

export const CAT_COLORS = {
  Entertainment: "#1E6FE0",
  Comedy: "#2BAE9E",
  Emotional: "#E0524B",
  Informative: "#6E5BD6",
  Pranks: "#2BAE66",
  Lifestyle: "#E08A3B",
  Education: "#3F8FE0",
};

export const LANG_COLORS = {
  Telugu: "#1E6FE0",
  Tamil: "#2BAE9E",
  Hindi: "#E0524B",
  Malayalam: "#6E5BD6",
  Kannada: "#2BAE66",
  Bengali: "#E08A3B",
  English: "#3F8FE0",
};

export const GENDER_COLORS = {
  Male: "#1E6FE0",
  Female: "#3F8FE0",
  Others: "#6E5BD6",
};

// Niche = renamed from "Category" per Phase 2 spec (same color map, same values)
export const NICHE_COLORS = CAT_COLORS;
export const NICHES = CATS;

// Tier ranges (raw "tier" concept). Renamed to "Category" on the All Creators
// page per Phase 2 spec, but the underlying ranges/colors/labels are unchanged.
export const TIER_RANGES = {
  nano: [1000, 9999],
  micro: [10000, 99999],
  mega: [100000, 499999],
  celebrity: [1000000, Infinity],
};

export const TIER_COLORS = {
  nano: "#2BAE66",
  micro: "#3F8FE0",
  mega: "#E08A3B",
  celebrity: "#E0524B",
};

export const TIER_LABELS = {
  nano: "Nano",
  micro: "Micro",
  mega: "Mega",
  celebrity: "Celebrity",
};

export const TIER_RANGE_LABELS = {
  nano: "1K\u201310K",
  micro: "10K\u2013100K",
  mega: "100K\u2013500K",
  celebrity: "1M+",
};

export const TIERS = ["nano", "micro", "mega", "celebrity"];

// Negotiation status options for campaign-creator links (Phase 4)
export const NEGOTIATION_STATUSES = [
  "Not Contacted",
  "Contacted",
  "In Discussion",
  "Negotiating",
  "Confirmed",
  "Declined",
];

export const NEGOTIATION_STATUS_COLORS = {
  "Not Contacted": "#8FA3BC",
  Contacted: "#3F8FE0",
  "In Discussion": "#E08A3B",
  Negotiating: "#6E5BD6",
  Confirmed: "#2BAE66",
  Declined: "#E0524B",
};

export const CAMPAIGN_STATUSES = ["Planning", "Active", "Paused", "Completed"];

export const CAMPAIGN_STATUS_COLORS = {
  Planning: "#8FA3BC",
  Active: "#2BAE66",
  Paused: "#E08A3B",
  Completed: "#1E6FE0",
};

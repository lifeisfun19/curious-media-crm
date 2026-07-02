// Formatting + helper functions — ported 1:1 from the approved HTML's <script>.

import { TIER_RANGES } from "./constants";

export function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

export function parseN(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim().toLowerCase().replace(/,/g, "");
  let m = 1;
  if (s.endsWith("k")) {
    m = 1e3;
    s = s.slice(0, -1);
  } else if (s.endsWith("m")) {
    m = 1e6;
    s = s.slice(0, -1);
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * m);
}

export function hex2rgba(h, a) {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function getTier(f) {
  if (f >= 1000000) return "celebrity";
  if (f >= 100000) return "mega";
  if (f >= 10000) return "micro";
  return "nano";
}

export function isUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function inTier(followers, activeTierSet) {
  if (activeTierSet.size === 0) return true;
  for (const t of activeTierSet) {
    const [lo, hi] = TIER_RANGES[t];
    if (followers >= lo && followers <= hi) return true;
  }
  return false;
}

export function topVal(rows, field) {
  if (!rows.length) return "\u2014";
  const c = {};
  rows.forEach((r) => {
    c[r[field]] = (c[r[field]] || 0) + 1;
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
}

export function uniqValues(rows, field) {
  const s = new Set();
  rows.forEach((r) => {
    if (r[field]) s.add(r[field]);
  });
  return Array.from(s).sort();
}

// ---------------------------------------------------------------------------
// Multi-platform helpers
//
// A creator can now be on several platforms at once. Canonical shape:
//   creator.platforms = [{ platform: "Instagram", link: "https://..." }, ...]
//
// These helpers centralise reading that array (with a fallback for any
// stray legacy record that still only has single `platform`/`profileLink`
// fields) so the rest of the app never has to special-case the shape.
// ---------------------------------------------------------------------------

export function creatorPlatforms(creator) {
  if (Array.isArray(creator?.platforms) && creator.platforms.length) {
    return creator.platforms;
  }
  if (creator?.platform) {
    return [{ platform: creator.platform, link: creator.profileLink || "" }];
  }
  return [];
}

export function platformNames(creator) {
  return creatorPlatforms(creator).map((p) => p.platform);
}

export function primaryPlatform(creator) {
  return creatorPlatforms(creator)[0]?.platform || "";
}

export function primaryLink(creator) {
  return creatorPlatforms(creator)[0]?.link || "";
}

export function linkForPlatform(creator, platformName) {
  return creatorPlatforms(creator).find((p) => p.platform === platformName)?.link || "";
}

// Count creators per platform — a creator with 3 platforms counts once
// toward each of those 3 platforms (this is the "match/count under ALL
// platforms" rule for multi-platform creators).
export function platformCounts(rows) {
  const counts = {};
  rows.forEach((r) => {
    platformNames(r).forEach((p) => {
      counts[p] = (counts[p] || 0) + 1;
    });
  });
  return counts;
}

export function topPlatform(rows) {
  const counts = platformCounts(rows);
  const entries = Object.entries(counts);
  if (!entries.length) return "\u2014";
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// Normalised name key, used as a fallback dedup key for rows with no phone.
export function normaliseName(name) {
  return String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

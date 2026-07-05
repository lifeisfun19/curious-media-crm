// Formatting + helper functions — ported 1:1 from the approved HTML's <script>.

import { TIER_RANGES, PLATFORMS } from "./constants";

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
// Platform helpers
//
// Each creator RECORD represents exactly one (person, platform) pair —
// canonical shape: creator.platform = "Instagram", creator.profileLink =
// "https://...". A real person on both Instagram and YouTube is two
// separate creator records (own id, own followers/commercial/remark),
// sharing the same name/phone/email. This is intentional: it's what lets
// "2 entries for a creator on 2 platforms" and per-platform dedup work.
//
// These helpers still read from a legacy `creator.platforms` array first
// if one happens to be present (e.g. old imported/pasted data), falling
// back to the singular fields, so the rest of the app never has to
// special-case the shape.
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

// ---------------------------------------------------------------------------
// Platform grouping for tables that split a multi-platform creator into one
// row per platform (e.g. a creator on Instagram + YouTube shows up as two
// separate rows, one under each platform group).
// ---------------------------------------------------------------------------

const PLATFORM_GROUP_ORDER = [...PLATFORMS, "No platform"];

/**
 * Flattens a list of items into one row per platform per item, then groups
 * those rows by platform (in PLATFORMS order, with platform-less items in
 * a trailing "No platform" group). Items with several platforms appear
 * once under each of their platforms.
 *
 * `getCreator(item)` returns the underlying creator record for an item —
 * for a plain creator row that's the identity function; for a campaign
 * creator-link that's `(link) => getCreatorById(link.creatorId)`.
 *
 * Returns: [{ name, rows: [{ item, creator, platform }] }, ...] — only
 * groups with at least one row are included.
 */
export function groupByPlatform(items, getCreator) {
  const groups = new Map(PLATFORM_GROUP_ORDER.map((p) => [p, []]));

  items.forEach((item) => {
    const creator = getCreator(item);
    if (!creator) return;
    const platforms = creatorPlatforms(creator);
    if (platforms.length === 0) {
      groups.get("No platform").push({ item, creator, platform: null });
    } else {
      platforms.forEach((p) => {
        if (!groups.has(p.platform)) groups.set(p.platform, []);
        groups.get(p.platform).push({ item, creator, platform: p });
      });
    }
  });

  return PLATFORM_GROUP_ORDER
    .map((name) => ({ name, rows: groups.get(name) || [] }))
    .filter((g) => g.rows.length > 0);
}

// ---------------------------------------------------------------------------
// Payment info helpers — used by the campaign "Payment Info" dialog and the
// "Payment Status" tab. A payment record on a campaign↔creator link looks
// like either:
//   { type: "upi", upiId }
//   { type: "bank", accountHolder, accountNumber, ifsc, bankName }
// ---------------------------------------------------------------------------

// Masks all but the last 4 digits of an account number for display, e.g.
// "1234567890" -> "•••• •••• 7890".
export function maskAccountNumber(num) {
  const s = String(num ?? "").replace(/\s+/g, "");
  if (!s) return "";
  if (s.length <= 4) return s;
  const last4 = s.slice(-4);
  return "•••• •••• " + last4;
}

// Short one-line summary of a payment info record, for table cells.
export function summarizePaymentInfo(info) {
  if (!info || !info.type) return "";
  if (info.type === "upi") {
    return info.upiId ? `UPI · ${info.upiId}` : "UPI";
  }
  if (info.type === "bank") {
    const acc = info.accountNumber ? maskAccountNumber(info.accountNumber) : "";
    return [info.bankName, acc].filter(Boolean).join(" · ") || "Bank";
  }
  return "";
}

// Full, human-readable payment info block for an email body / preview.
export function formatPaymentInfoLines(info) {
  if (!info || !info.type) return ["Not provided yet"];
  if (info.type === "upi") {
    return [`Payment method: UPI`, `UPI ID: ${info.upiId || "—"}`];
  }
  return [
    `Payment method: Bank Transfer`,
    `Account holder: ${info.accountHolder || "—"}`,
    `Account number: ${info.accountNumber || "—"}`,
    `IFSC code: ${info.ifsc || "—"}`,
    `Bank name: ${info.bankName || "—"}`,
  ];
}

// Builds a mailto: URL pre-filled with creator + campaign + payment
// details, so "forwarding to email" just opens the user's own email app
// with a ready-to-send draft (no backend / email service required).
export function buildPaymentMailto({ to, creator, campaignName, amount, paymentInfo }) {
  const subject = `Payment details — ${creator?.name || "Creator"} — ${campaignName || ""}`.trim();
  const bodyLines = [
    `Creator: ${creator?.name || "—"}`,
    `Phone: ${creator?.phone || "—"}`,
    `Platform: ${creator?.platform || primaryPlatform(creator) || "—"}`,
    `Campaign: ${campaignName || "—"}`,
    `Payment amount: ${amount || "—"}`,
    "",
    ...formatPaymentInfoLines(paymentInfo),
  ];
  const toPart = to ? encodeURIComponent(to) : "";
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
  return `mailto:${toPart}?${query}`;
}

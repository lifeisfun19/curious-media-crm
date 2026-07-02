// CSV import parser for creator data exported from Google Sheets.
// Handles: K/M formatted followers, phone normalisation for dedup,
// strict row-level validation with per-row error reporting.

import { parseN, normaliseName } from "./format";
import { PLATFORMS } from "./constants";

// Canonical column name mapping — case-insensitive, trims whitespace.
// Maps whatever header name the sheet uses → internal field name.
const HEADER_MAP = {
  name: "name",
  creator: "name",
  "creator name": "name",

  platform: "platform",

  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  "mobile number": "phone",
  contact: "phone",

  email: "email",
  "email address": "email",

  gender: "gender",

  niche: "category",
  category: "category",
  "content category": "category",

  language: "language",
  lang: "language",

  followers: "followers",
  "follower count": "followers",
  "followers count": "followers",
  subscriber: "followers",
  subscribers: "followers",

  link: "profileLink",
  "profile link": "profileLink",
  "channel link": "profileLink",
  "creator link": "profileLink",
  url: "profileLink",
};

// Multi-platform columns — one link column per platform, e.g.
// "Instagram Link", "YouTube Link", "Twitter Link", "LinkedIn Link".
// Header key here is the already-normalised (lowercase, letters+spaces
// only) header text; value is the canonical platform name from PLATFORMS.
const PLATFORM_LINK_HEADER_MAP = {
  "instagram link": "Instagram",
  instagram: "Instagram",
  "youtube link": "YouTube",
  youtube: "YouTube",
  "twitter link": "Twitter",
  twitter: "Twitter",
  "x link": "Twitter",
  "linkedin link": "LinkedIn",
  linkedin: "LinkedIn",
};

// Fields that must be present and non-empty for a row to be valid.
const REQUIRED_FIELDS = ["name", "followers"];

// Normalise a phone number to digits-only for dedup comparison.
// "+91 70003 38800" → "917000338800"
export function normalisePhone(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

/**
 * Parse a raw CSV string into structured creator rows.
 *
 * Returns:
 *   { rows: [...], errors: [...] }
 *
 * If errors is non-empty the caller should surface them to the user and
 * NOT import anything — the user needs to fix their file first.
 *
 * Each error is: { rowNum, name, message }
 * Each row is a partial creator object ready for merging into context.
 */
export function parseCsvImport(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ rowNum: null, name: null, message: "File appears to be empty or has no data rows." }],
    };
  }

  // Parse header row — handle quoted fields too.
  const headers = parseCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/[^a-z ]/g, "").trim()
  );

  // Map header index → internal field name.
  const fieldIndex = {}; // { fieldName: colIndex }
  const platformColIndex = {}; // { "Instagram": colIndex, ... }
  headers.forEach((h, i) => {
    const mapped = HEADER_MAP[h];
    if (mapped && !(mapped in fieldIndex)) {
      fieldIndex[mapped] = i;
    }
    const platMapped = PLATFORM_LINK_HEADER_MAP[h];
    if (platMapped && !(platMapped in platformColIndex)) {
      platformColIndex[platMapped] = i;
    }
  });
  const hasPlatformColumns = Object.keys(platformColIndex).length > 0;

  // Check that at minimum Name and Followers columns exist.
  const missingCols = REQUIRED_FIELDS.filter((f) => !(f in fieldIndex));
  if (missingCols.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowNum: 1,
          name: null,
          message: `Required column(s) not found in CSV header: ${missingCols.join(", ")}. 
Found headers: ${headers.join(", ")}`,
        },
      ],
    };
  }

  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // 1-based, header is row 1
    const cols = parseCsvLine(lines[i]);

    // Google Sheets exports pad the sheet out to its full row/column range,
    // so trailing "rows" are often just a string of commas with no real
    // content (",,,,,,,,,"). That's not a data-entry mistake — skip it
    // silently rather than flagging it as an error.
    const isBlankRow = cols.every((c) => !c || !c.trim());
    if (isBlankRow) continue;

    const get = (field) =>
      fieldIndex[field] !== undefined
        ? (cols[fieldIndex[field]] ?? "").trim()
        : "";

    const name = get("name");
    const followersRaw = get("followers");
    const followers = parseN(followersRaw);

    const rowErrors = [];

    if (!name) {
      rowErrors.push("Name is empty");
    }

    if (!followersRaw) {
      rowErrors.push("Followers is empty");
    } else if (followers === 0 && followersRaw !== "0") {
      rowErrors.push(`Followers value "${followersRaw}" could not be parsed (expected e.g. 950K, 1.2M, or 950000)`);
    }

    if (rowErrors.length > 0) {
      errors.push({
        rowNum,
        name: name || "(no name)",
        message: rowErrors.join("; "),
      });
      continue;
    }

    // Build the platforms[] array. If the sheet has per-platform link
    // columns (Instagram Link / YouTube Link / ...), use one entry per
    // non-empty column. Otherwise fall back to the legacy single
    // Platform + Link columns.
    let platforms = [];
    if (hasPlatformColumns) {
      Object.entries(platformColIndex).forEach(([platName, colIdx]) => {
        const link = (cols[colIdx] ?? "").trim();
        if (link) platforms.push({ platform: platName, link });
      });
    }
    if (platforms.length === 0) {
      platforms = [
        { platform: get("platform") || "Instagram", link: get("profileLink") },
      ];
    }

    rows.push({
      name,
      platforms,
      phone: get("phone"),
      email: get("email"),
      gender: get("gender") || "Others",
      category: get("category") || "Entertainment",
      language: get("language") || "Hindi",
      followers,
      avgViews: Math.round(followers * 0.08),
      commercial: "",
      remark: "",
    });
  }

  return { rows, errors };
}

/**
 * Merge imported rows into the existing creators array.
 * Dedup rule: skip if normalised phone already exists.
 * Sort result alphabetically by name (case-insensitive).
 *
 * Returns: { merged: [...creators], added: number, skipped: number }
 */
export function mergeCreators(existing, incoming) {
  // Build a set of normalised phones already in the list.
  const existingPhones = new Set(
    existing
      .map((c) => normalisePhone(c.phone))
      .filter((p) => p.length > 0)
  );
  // Fallback dedup key for rows with no phone number at all: name only.
  const existingNames = new Set(existing.map((c) => normaliseName(c.name)));

  let added = 0;
  let skipped = 0;
  let nextId = Date.now(); // unique enough for in-memory ids

  const newOnes = [];
  for (const row of incoming) {
    const normPhone = normalisePhone(row.phone);
    const normName = normaliseName(row.name);

    // Skip if phone matches an existing creator (and phone is non-empty).
    if (normPhone && existingPhones.has(normPhone)) {
      skipped++;
      continue;
    }
    // No phone to go on — fall back to matching by name so the same
    // creator pasted twice doesn't create two rows.
    if (!normPhone && existingNames.has(normName)) {
      skipped++;
      continue;
    }

    // Register this key so we don't add the same creator twice within the
    // same import batch either.
    if (normPhone) existingPhones.add(normPhone);
    existingNames.add(normName);

    newOnes.push({
      id: "imp_" + nextId++,
      ...row,
    });
    added++;
  }

  const merged = [...existing, ...newOnes].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  return { merged, added, skipped };
}

/**
 * Sync imported rows into the existing creators array.
 * Unlike mergeCreators (which always skips duplicate phones), this matches
 * rows to existing creators by normalised phone and *updates* the existing
 * record's fields in place when a match is found. Rows with no phone match
 * are appended as new creators. Used for the "live sheet link" flow, where
 * the whole point is that edits made in the sheet should flow through.
 *
 * Rows with no phone fall back to matching by normalised name, so a sheet
 * that doesn't collect phone numbers can still update existing rows
 * instead of piling up duplicates.
 *
 * When `mirror` is true, this treats the sheet as the full source of
 * truth: any existing creator that isn't matched by *any* incoming row
 * (by phone or by name) is removed from the result. This is how
 * deletions made in the sheet propagate into the app. Leave it false to
 * only ever add/update (never delete) — the safer default.
 *
 * Returns: { merged: [...creators], added: number, updated: number, removed: number }
 */
export function syncCreators(existing, incoming, { mirror = false } = {}) {
  // Map normalised phone/name -> index in existing array, for fast lookup.
  const phoneIndex = new Map();
  const nameIndex = new Map();
  existing.forEach((c, i) => {
    const p = normalisePhone(c.phone);
    if (p) phoneIndex.set(p, i);
    const n = normaliseName(c.name);
    if (n && !nameIndex.has(n)) nameIndex.set(n, i);
  });

  const result = [...existing];
  const matchedIdx = new Set();
  let added = 0;
  let updated = 0;
  let nextId = Date.now();

  for (const row of incoming) {
    const normPhone = normalisePhone(row.phone);
    const normName = normaliseName(row.name);
    let matchIdx = normPhone ? phoneIndex.get(normPhone) : undefined;
    if (matchIdx === undefined && !normPhone) matchIdx = nameIndex.get(normName);

    if (matchIdx !== undefined) {
      // Update existing creator in place, keeping its id.
      result[matchIdx] = {
        ...result[matchIdx],
        ...row,
      };
      matchedIdx.add(matchIdx);
      updated++;
    } else {
      const newCreator = { id: "sync_" + nextId++, ...row };
      result.push(newCreator);
      matchedIdx.add(result.length - 1);
      if (normPhone) phoneIndex.set(normPhone, result.length - 1);
      if (normName && !nameIndex.has(normName)) nameIndex.set(normName, result.length - 1);
      added++;
    }
  }

  let finalResult = result;
  let removed = 0;
  if (mirror) {
    finalResult = result.filter((_, i) => matchedIdx.has(i));
    removed = result.length - finalResult.length;
  }

  const merged = finalResult.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  return { merged, added, updated, removed };
}

// ---------------------------------------------------------------------------
// Internal: minimal CSV line parser (handles quoted fields with commas/newlines)
// ---------------------------------------------------------------------------
function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

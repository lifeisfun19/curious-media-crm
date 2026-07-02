// Live "linked sheet" sync — lets the user paste a Google Sheet URL once,
// then hit "Sync now" whenever the sheet has changed to pull the latest
// rows into the Creators table (adding new creators, updating existing
// ones matched by phone number).

const STORAGE_KEY = "cm_linked_sheet";

/**
 * Turn whatever URL the user pasted into a CSV-exportable URL.
 *
 * Accepts:
 *  - A normal "share" link: https://docs.google.com/spreadsheets/d/<id>/edit#gid=123
 *  - A "Publish to web" CSV link: https://docs.google.com/.../pub?output=csv
 *  - A direct .csv URL (any host)
 *
 * For a normal Google Sheets share link we rewrite it to the CSV export
 * endpoint, which works as long as the sheet is shared "Anyone with the
 * link can view" — no separate "Publish to web" step required.
 */
export function normaliseSheetUrl(rawUrl) {
  const url = String(rawUrl ?? "").trim();
  if (!url) return "";

  // Already a CSV export / publish link — use as-is.
  if (/output=csv|\/pub\?/.test(url) || url.toLowerCase().endsWith(".csv")) {
    return url;
  }

  // Normal Google Sheets share URL — rewrite to the CSV export endpoint.
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const id = match[1];
    const gidMatch = url.match(/[?#&]gid=(\d+)/);
    // Only pin a gid if the URL actually specified one. A plain share link
    // (no #gid=...) has no reliable way to know the first tab's gid — it's
    // NOT always 0, e.g. on sheets that were copied/imported — so forcing
    // gid=0 causes Google to return HTTP 400 on those. Omitting gid
    // entirely makes the export endpoint default to the first visible tab.
    if (gidMatch) {
      return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gidMatch[1]}`;
    }
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  }

  // Fall back to whatever was pasted.
  return url;
}

/**
 * Google Apps Script web app endpoints (script.google.com/.../exec, or the
 * script.googleusercontent.com/macros/echo redirect it resolves to) often
 * don't return raw CSV text — they wrap it. Two common shapes we see:
 *   1. A JSON-encoded string: "\"name,followers\\nAda,950000\""
 *   2. Real quotes but literal backslash-n instead of actual newlines.
 * Unwrap those so the CSV line-splitter downstream sees real rows.
 */
function unwrapEchoResponse(text) {
  let t = text.trim();

  // Case 1: the whole payload is a JSON string literal — parse it to get
  // the real content (this also turns \n, \t, \" etc. into real chars).
  if (t.startsWith('"') && t.endsWith('"')) {
    try {
      const parsed = JSON.parse(t);
      if (typeof parsed === "string") return parsed;
    } catch {
      // Not valid JSON — fall through and try the regex approach below.
    }
  }

  // Case 2: no real line breaks in the text, but literal "\n" sequences —
  // the content was escaped without being JSON-quoted. Unescape it.
  if (!/\r|\n/.test(t) && /\\n/.test(t)) {
    t = t.replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"');
  }

  return t;
}

/**
 * Fetch CSV text from a linked sheet URL. Throws a friendly Error on
 * failure (private sheet, network issue, CORS block, etc).
 */
export async function fetchSheetCsv(url) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error(
      "Couldn't reach that link. Check your internet connection and that the URL is correct."
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Access denied. Make sure the sheet is shared as \"Anyone with the link can view\", then try again."
        : response.status === 400
        ? "The sheet couldn't be loaded (HTTP 400) — this usually means the tab reference in the link is wrong. Open the exact tab you want in Google Sheets, copy the URL from the address bar (it should end in #gid=...), and paste that in."
        : `The sheet couldn't be loaded (HTTP ${response.status}). Double-check the link.`
    );
  }

  let text = await response.text();
  text = unwrapEchoResponse(text);

  // Google returns an HTML sign-in page (not CSV) for private sheets.
  if (/^\s*<!DOCTYPE html|^\s*<html/i.test(text)) {
    throw new Error(
      "That link isn't publicly viewable. Set sharing to \"Anyone with the link can view\" and try again."
    );
  }

  if (!text.trim()) {
    if (/script\.googleusercontent\.com\/macros\/echo/i.test(url)) {
      throw new Error(
        "That echo/proxy link came back empty — it's a temporary, session-scoped URL (the \"user_content_key\" only works for the browser session that generated it), so this app can't fetch it directly. " +
          "Instead, paste your regular Google Sheets share link (Share → Anyone with the link → Viewer), or your Apps Script deployment's stable /exec URL if you're using a script."
      );
    }
    throw new Error(
      "The link loaded but came back empty. Double-check it points directly at the sheet's data, and that sharing is set to \"Anyone with the link can view\"."
    );
  }

  return text;
}

export function getSavedSheetLink() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSheetLink({ url, lastSyncedAt }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, lastSyncedAt }));
  } catch {
    // Ignore storage failures (e.g. private browsing) — sync still works
    // for the current session, it just won't persist across reloads.
  }
}

export function clearSavedSheetLink() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

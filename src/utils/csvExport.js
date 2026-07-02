// CSV export helper — builds a CSV string from creator rows and triggers
// a browser download. No external dependency needed for this simple case.

import { PLATFORMS } from "./constants";
import { linkForPlatform, platformNames } from "./format";

// One row per creator; each platform gets its own "<Platform> Link" column
// so a creator on Instagram + YouTube shows both links on a single row.
// This is the same shape ImportCreatorsModal/csvImport.js reads back in,
// so export → edit in Sheets → sync round-trips cleanly.
const CSV_COLUMNS = [
  { key: "name", label: "Creator" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Gender" },
  { key: "category", label: "Niche" },
  { key: "language", label: "Language" },
  { key: "followers", label: "Followers" },
  { key: "tier", label: "Category" },
  { key: "commercial", label: "Commercial" },
  { key: "remark", label: "Remarks" },
  ...PLATFORMS.map((p) => ({ key: `platform:${p}`, label: `${p} Link` })),
];

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function creatorsToCsv(rows, getTierLabel) {
  const header = CSV_COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const lines = rows.map((r) =>
    CSV_COLUMNS.map((c) => {
      if (c.key === "tier") return csvEscape(getTierLabel(r.followers));
      if (c.key.startsWith("platform:")) {
        return csvEscape(linkForPlatform(r, c.key.slice("platform:".length)));
      }
      return csvEscape(r[c.key]);
    }).join(",")
  );
  return [header, ...lines].join("\r\n");
}

// Campaign creator export — core creator info plus the campaign-specific
// fields (commercial, negotiation status, lock status, remarks) that live
// on the creator↔campaign link rather than the creator record itself.
const CAMPAIGN_CSV_COLUMNS = [
  { key: "name", label: "Creator" },
  { key: "platform", label: "Platform(s)" },
  { key: "followers", label: "Followers" },
  { key: "tier", label: "Category" },
  { key: "commercial", label: "Commercial" },
  { key: "negotiationStatus", label: "Negotiation Status" },
  { key: "lockStatus", label: "Lock Status" },
  { key: "remark", label: "Remarks" },
];

export function campaignCreatorsToCsv(links, getCreatorById, getTierLabel) {
  const header = CAMPAIGN_CSV_COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const lines = links
    .map((link) => {
      const creator = getCreatorById(link.creatorId);
      if (!creator) return null;
      return CAMPAIGN_CSV_COLUMNS.map((c) => {
        if (c.key === "tier") return csvEscape(getTierLabel(creator.followers));
        if (c.key === "platform") return csvEscape(platformNames(creator).join(" / "));
        if (c.key in link) return csvEscape(link[c.key]);
        return csvEscape(creator[c.key]);
      }).join(",");
    })
    .filter(Boolean);
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename, csvString) {
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

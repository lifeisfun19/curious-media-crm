import { Lock, Unlock, X } from "lucide-react";
import Badge from "../ui/Badge";
import TierBadge from "../ui/TierBadge";
import EditableCell from "../ui/EditableCell";
import { fmt, hex2rgba, platformNames } from "../../utils/format";
import {
  LANG_COLORS,
  NEGOTIATION_STATUSES,
  NEGOTIATION_STATUS_COLORS,
} from "../../utils/constants";

/**
 * Table of creators inside a single campaign. Each row shows the creator's
 * core info (read-only, pulled from the master creator record) plus the
 * campaign-specific fields: Commercial, Negotiation Status, Lock Status,
 * Remarks — all editable per-campaign so the same creator can have different
 * values in different campaigns.
 */
export default function CampaignCreatorsTable({
  links,
  getCreatorById,
  onUpdateLink,
  onRemoveLink,
}) {
  if (links.length === 0) {
    return (
      <div
        className="rounded-[13px] border px-5 py-[60px] text-center text-[13px] leading-[1.8]"
        style={{ background: "var(--panel)", borderColor: "var(--ln)", color: "var(--ink3)" }}
      >
        No creators added yet.
        <br />
        Select creators on the All Creators page and use "Move to Campaign".
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-[13px] border shadow-[0_1px_2px_rgba(16,36,62,.04)]"
      style={{ background: "var(--panel)", borderColor: "var(--ln)", maxHeight: 560 }}
    >
      <table
        className="table-fixed border-collapse text-xs"
        style={{ width: "100%", minWidth: 951 }}
      >
        <thead>
          <tr>
            {[
              ["", 36],
              ["Creator", 140],
              ["Platform", 90],
              ["Followers", 85],
              ["Category", 90],
              ["Commercial", 130],
              ["Negotiation Status", 150],
              ["Lock Status", 90],
              ["Remarks", 140],
            ].map(([label, width]) => (
              <th
                key={label}
                className="sticky top-0 z-10 whitespace-nowrap border-b px-3 py-2.5 text-left text-[10px] uppercase tracking-[.06em]"
                style={{ background: "var(--up)", borderColor: "var(--ln)", color: "var(--ink3)", width }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const creator = getCreatorById(link.creatorId);
            if (!creator) return null;
            const lc = LANG_COLORS[creator.language] || "#1E6FE0";
            const locked = link.lockStatus === "locked";
            const negColor =
              NEGOTIATION_STATUS_COLORS[link.negotiationStatus] || "#8FA3BC";

            return (
              <tr key={link.creatorId}>
                <td className="border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <button
                    type="button"
                    title="Remove from campaign"
                    onClick={() => onRemoveLink(link.creatorId)}
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border transition-colors"
                    style={{ borderColor: "var(--ln)", color: "var(--ink3)" }}
                  >
                    <X size={12} />
                  </button>
                </td>

                <td className="overflow-hidden border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <div className="flex min-w-0 items-center gap-1.5 font-medium">
                    <span
                      className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                      style={{ background: lc }}
                    />
                    <span
                      className="block max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ color: "var(--ink)" }}
                    >
                      {creator.name}
                    </span>
                  </div>
                </td>

                <td className="border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <Badge color="#1E6FE0">{platformNames(creator).join(" / ") || "\u2014"}</Badge>
                </td>

                <td
                  className="border-b px-3 py-2"
                  style={{ borderColor: "var(--ln)", color: "var(--ink)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {fmt(creator.followers)}
                </td>

                <td className="border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <TierBadge followers={creator.followers} />
                </td>

                <td className="overflow-visible border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <EditableCell
                    value={link.commercial}
                    label="Commercial"
                    variant="link"
                    onSave={(val) => onUpdateLink(link.creatorId, { commercial: val })}
                  />
                </td>

                <td className="border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <select
                    value={link.negotiationStatus}
                    onChange={(e) =>
                      onUpdateLink(link.creatorId, { negotiationStatus: e.target.value })
                    }
                    className="w-full rounded-full border px-2 py-1 text-[11px] outline-none"
                    style={{
                      color: negColor,
                      borderColor: hex2rgba(negColor, 0.35),
                      background: hex2rgba(negColor, 0.08),
                    }}
                  >
                    {NEGOTIATION_STATUSES.map((s) => (
                      <option key={s} value={s} style={{ color: "#10243E" }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateLink(link.creatorId, {
                        lockStatus: locked ? "unlocked" : "locked",
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                    style={{
                      borderColor: locked ? "#2BAE66" : "var(--ln)",
                      color: locked ? "#2BAE66" : "var(--ink2)",
                      background: locked ? "rgba(43,174,102,.08)" : "var(--up)",
                    }}
                  >
                    {locked ? <Lock size={11} /> : <Unlock size={11} />}
                    {locked ? "Locked" : "Unlocked"}
                  </button>
                </td>

                <td className="overflow-visible border-b px-3 py-2" style={{ borderColor: "var(--ln)" }}>
                  <EditableCell
                    value={link.remark}
                    label="Remark"
                    variant="pill"
                    onSave={(val) => onUpdateLink(link.creatorId, { remark: val })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

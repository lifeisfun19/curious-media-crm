import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Plus, Trash2 } from "lucide-react";
import { PLATFORMS } from "../../utils/constants";
import { creatorPlatforms } from "../../utils/format";

const PLATFORM_ICONS = {
  Instagram: "\ud83d\udcf8",
  YouTube: "\u25b6",
  Twitter: "\ud835\udd4f",
  LinkedIn: "\ud83d\udcbc",
};

const PLATFORM_COLOR = "#1E6FE0";

/**
 * Table cell for a creator's platforms. Shows the primary platform as a
 * badge (+N more, if any), and clicking it opens a dropdown panel listing
 * every platform + link on this creator, each openable, with inline
 * add/remove controls so the row can be edited without leaving the table.
 */
export default function PlatformsCell({ creator, onChange }) {
  const [open, setOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newLink, setNewLink] = useState("");
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const platforms = creatorPlatforms(creator);
  const primary = platforms[0];
  const extraCount = platforms.length - 1;
  const available = PLATFORMS.filter((p) => !platforms.some((cp) => cp.platform === p));

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const pw = 260;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
    if (top + 260 > window.innerHeight) top = rect.top - 266;
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !anchorRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  function removePlatform(platName) {
    onChange(platforms.filter((p) => p.platform !== platName));
  }

  function updateLink(platName, link) {
    onChange(platforms.map((p) => (p.platform === platName ? { ...p, link } : p)));
  }

  function addPlatform() {
    if (!newPlatform) return;
    onChange([...platforms, { platform: newPlatform, link: newLink.trim() }]);
    setNewPlatform("");
    setNewLink("");
  }

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] text-[11px] font-medium transition-colors"
        style={{
          borderColor: "rgba(30,111,224,.28)",
          background: "rgba(30,111,224,.08)",
          color: PLATFORM_COLOR,
        }}
        title="Click to view all platforms"
      >
        {primary ? (
          <>
            <span>{PLATFORM_ICONS[primary.platform] || "\ud83d\udd17"}</span>
            {primary.platform}
          </>
        ) : (
          <span style={{ color: "var(--ink3)" }}>No platform</span>
        )}
        {extraCount > 0 && (
          <span
            className="ml-0.5 rounded-full px-1.5 py-[1px] text-[10px]"
            style={{ background: "rgba(30,111,224,.16)" }}
          >
            +{extraCount}
          </span>
        )}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-50 w-[260px] rounded-[10px] border p-3 shadow-[0_8px_32px_rgba(16,36,62,.18)]"
          style={{ top: pos.top, left: pos.left, background: "var(--panel)", borderColor: "var(--ln)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>
            Platforms for {creator.name}
          </h4>

          <div className="mb-2 flex max-h-[160px] flex-col gap-1.5 overflow-auto">
            {platforms.length === 0 && (
              <div className="text-[11px]" style={{ color: "var(--ink3)" }}>
                No platforms added yet.
              </div>
            )}
            {platforms.map((p) => (
              <div
                key={p.platform}
                className="flex items-center gap-1.5 rounded-[7px] border px-2 py-1.5"
                style={{ borderColor: "var(--ln)", background: "var(--up)" }}
              >
                <span className="text-sm">{PLATFORM_ICONS[p.platform] || "\ud83d\udd17"}</span>
                <span className="w-[62px] flex-shrink-0 text-[11px] font-medium" style={{ color: "var(--ink)" }}>
                  {p.platform}
                </span>
                <input
                  type="text"
                  value={p.link}
                  onChange={(e) => updateLink(p.platform, e.target.value)}
                  placeholder="Link…"
                  className="min-w-0 flex-1 rounded-[6px] border px-1.5 py-1 text-[10px] outline-none"
                  style={{ borderColor: "var(--ln)", color: "var(--ink2)", background: "var(--panel)" }}
                />
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    title="Open link"
                    style={{ color: "var(--am)" }}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => removePlatform(p.platform)}
                  title="Remove platform"
                  style={{ color: "#E0524B" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {available.length > 0 && (
            <div className="flex items-center gap-1.5 border-t pt-2" style={{ borderColor: "var(--ln)" }}>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="rounded-[6px] border px-1.5 py-1 text-[10px] outline-none"
                style={{ borderColor: "var(--ln)", color: "var(--ink)", background: "var(--up)" }}
              >
                <option value="">Add platform…</option>
                {available.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Link"
                className="min-w-0 flex-1 rounded-[6px] border px-1.5 py-1 text-[10px] outline-none"
                style={{ borderColor: "var(--ln)", color: "var(--ink2)", background: "var(--up)" }}
              />
              <button
                type="button"
                onClick={addPlatform}
                disabled={!newPlatform}
                title="Add platform"
                className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[6px] text-white disabled:opacity-40"
                style={{ background: "var(--am)" }}
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

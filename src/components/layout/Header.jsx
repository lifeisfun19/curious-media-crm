export default function Header({ onGearClick }) {
  return (
    <header className="bg-white border-b border-[#D7E6F2] px-8 py-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div
            className="flex items-center gap-2 uppercase tracking-[0.13em] text-[11px] mb-[5px]"
            style={{
              color: "var(--ink3)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span className="pulse-dot" />
            INFLUENCER DASHBOARD
          </div>

          <h1
            className="text-[30px] font-semibold"
            style={{
              fontFamily: "Fraunces, serif",
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Curious <span style={{ color: "var(--am)" }}>Media </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[11px] shadow-[0_1px_2px_rgba(16,36,62,.04)]"
            style={{
              borderColor: "var(--ln)",
              background: "var(--panel)",
              color: "var(--ink2)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#2BAE66" }} />
            Sample data
          </div>

          <button
            type="button"
            onClick={onGearClick}
            title="Import creators from CSV"
            aria-label="Import creators from CSV"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border text-[15px] shadow-[0_1px_2px_rgba(16,36,62,.04)] transition-colors"
            style={{ borderColor: "var(--ln)", background: "var(--panel)", color: "var(--ink2)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--up)";
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--panel)";
              e.currentTarget.style.color = "var(--ink2)";
            }}
          >
            ⚙
          </button>
        </div>
      </div>
    </header>
  );
}

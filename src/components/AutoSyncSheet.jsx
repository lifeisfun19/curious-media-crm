import { useEffect, useRef } from "react";
import { useCreators } from "../hooks/useCreators";
import { useToast } from "../hooks/useToast";
import { getSavedSheetLink, saveSheetLink, syncFromSheetUrl } from "../utils/sheetSync";

// Anywhere in 5-10s per the requested range — 7s splits the difference.
const AUTO_SYNC_INTERVAL_MS = 7000;

/**
 * Renders nothing. Mounted once near the app root so it keeps running no
 * matter which page/tab is open. While a sheet is linked (see
 * ImportCreatorsModal), this quietly re-syncs it on an interval — only
 * touching state (and showing a toast) when something actually changed, so
 * it never spams the user with "0 added, 0 updated" every few seconds.
 */
export default function AutoSyncSheet() {
  const { creators, setCreators } = useCreators();
  const showToast = useToast();
  const creatorsRef = useRef(creators);
  const syncingRef = useRef(false);

  useEffect(() => {
    creatorsRef.current = creators;
  }, [creators]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const linked = getSavedSheetLink();
      if (!linked?.url || syncingRef.current) return;

      syncingRef.current = true;
      try {
        const { merged, added, updated, removed } = await syncFromSheetUrl(
          linked.url,
          creatorsRef.current,
          { mirror: Boolean(linked.mirror) }
        );

        if (added > 0 || updated > 0 || removed > 0) {
          setCreators(merged);
          showToast(
            `Auto-synced: ${added} added, ${updated} updated` +
              (linked.mirror ? `, ${removed} removed` : ""),
            true
          );
        }

        saveSheetLink({ ...linked, lastSyncedAt: new Date().toISOString() });
      } catch {
        // Swallow errors on background sync (e.g. a brief network hiccup) —
        // the user isn't actively waiting on this, so don't interrupt them
        // with a toast every 7 seconds. Manual "Sync now" still surfaces
        // errors normally.
      } finally {
        syncingRef.current = false;
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [setCreators, showToast]);

  return null;
}
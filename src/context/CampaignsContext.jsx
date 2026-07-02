import {
  useMemo,
  useState,
  useCallback,
} from "react";
import { generateMockCampaigns } from "../data/campaigns";
import { CampaignsContext } from "./campaignsContextDef";

let nextCampaignNum = 3;

export function CampaignsProvider({ children }) {
  const [campaigns, setCampaigns] = useState(() => generateMockCampaigns());

  const createCampaign = useCallback((campaignInput) => {
    const id = "camp_" + nextCampaignNum++;
    const newCampaign = {
      id,
      name: campaignInput.name || "Untitled Campaign",
      client: campaignInput.client || "",
      budget: campaignInput.budget || 0,
      timelineStart: campaignInput.timelineStart || "",
      timelineEnd: campaignInput.timelineEnd || "",
      owner: campaignInput.owner || "",
      status: campaignInput.status || "Planning",
      createdAt: new Date().toISOString(),
      creatorLinks: [],
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    return id;
  }, []);

  const updateCampaign = useCallback((campaignId, fields) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, ...fields } : c))
    );
  }, []);

  const deleteCampaign = useCallback((campaignId) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  }, []);

  const getCampaignById = useCallback(
    (campaignId) => campaigns.find((c) => c.id === campaignId),
    [campaigns]
  );

  // Add creators (by id) to a campaign, skipping any already linked.
  const addCreatorsToCampaign = useCallback((campaignId, creatorIds) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        const existingIds = new Set(c.creatorLinks.map((l) => l.creatorId));
        const newLinks = creatorIds
          .filter((cid) => !existingIds.has(cid))
          .map((cid) => ({
            creatorId: cid,
            commercial: "",
            negotiationStatus: "Not Contacted",
            lockStatus: "unlocked",
            remark: "",
          }));
        return { ...c, creatorLinks: [...c.creatorLinks, ...newLinks] };
      })
    );
  }, []);

  const removeCreatorFromCampaign = useCallback((campaignId, creatorId) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id !== campaignId
          ? c
          : {
              ...c,
              creatorLinks: c.creatorLinks.filter(
                (l) => l.creatorId !== creatorId
              ),
            }
      )
    );
  }, []);

  const updateCreatorLink = useCallback((campaignId, creatorId, fields) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id !== campaignId
          ? c
          : {
              ...c,
              creatorLinks: c.creatorLinks.map((l) =>
                l.creatorId === creatorId ? { ...l, ...fields } : l
              ),
            }
      )
    );
  }, []);

  // Which campaigns a given creator currently belongs to (creator can be in many).
  const getCampaignsForCreator = useCallback(
    (creatorId) =>
      campaigns.filter((c) =>
        c.creatorLinks.some((l) => l.creatorId === creatorId)
      ),
    [campaigns]
  );

  const value = useMemo(
    () => ({
      campaigns,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaignById,
      addCreatorsToCampaign,
      removeCreatorFromCampaign,
      updateCreatorLink,
      getCampaignsForCreator,
    }),
    [
      campaigns,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaignById,
      addCreatorsToCampaign,
      removeCreatorFromCampaign,
      updateCreatorLink,
      getCampaignsForCreator,
    ]
  );

  return (
    <CampaignsContext.Provider value={value}>
      {children}
    </CampaignsContext.Provider>
  );
}

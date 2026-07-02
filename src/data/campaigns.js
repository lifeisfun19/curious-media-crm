// Seed campaigns so My Campaigns / Campaign Details have something to show
// on first load. Each campaign holds an array of creator links with
// campaign-specific fields (commercial, negotiationStatus, lockStatus, remark).

export function generateMockCampaigns() {
  return [
    {
      id: "camp_1",
      name: "Summer Launch 2026",
      client: "Nimbus Beverages",
      budget: 450000,
      timelineStart: "2026-07-01",
      timelineEnd: "2026-08-15",
      owner: "Aarav Shah",
      status: "Active",
      createdAt: "2026-06-10T10:00:00.000Z",
      creatorLinks: [],
    },
    {
      id: "camp_2",
      name: "Festive Collection",
      client: "Lumière Apparel",
      budget: 280000,
      timelineStart: "2026-09-01",
      timelineEnd: "2026-10-10",
      owner: "Priya Menon",
      status: "Planning",
      createdAt: "2026-06-15T10:00:00.000Z",
      creatorLinks: [],
    },
  ];
}

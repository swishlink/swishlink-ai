export type PlayerProfile = {
  archetype: string;
  ratings: { threePoint: number; finishing: number; handles: number };
  nbaComparison: string;
};

const ARCHETYPES: PlayerProfile[] = [
  {
    archetype: "Sharpshooter",
    ratings: { threePoint: 88, finishing: 62, handles: 71 },
    nbaComparison: "Klay Thompson",
  },
  {
    archetype: "Slasher",
    ratings: { threePoint: 58, finishing: 91, handles: 78 },
    nbaComparison: "Zach LaVine",
  },
  {
    archetype: "Floor General",
    ratings: { threePoint: 72, finishing: 74, handles: 94 },
    nbaComparison: "Chris Paul",
  },
  {
    archetype: "Two-Way Wing",
    ratings: { threePoint: 76, finishing: 82, handles: 79 },
    nbaComparison: "Kawhi Leonard",
  },
  {
    archetype: "Glass Cleaner",
    ratings: { threePoint: 45, finishing: 87, handles: 55 },
    nbaComparison: "Julius Randle",
  },
];

function hashVideoId(videoId: string): number {
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = ((hash << 5) - hash + videoId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getProfile(videoId: string): PlayerProfile {
  const hash = hashVideoId(videoId);
  const base = ARCHETYPES[hash % ARCHETYPES.length];
  const v1 = ((hash >> 4) % 11) - 5;
  const v2 = ((hash >> 8) % 11) - 5;
  const v3 = ((hash >> 12) % 11) - 5;
  return {
    ...base,
    ratings: {
      threePoint: Math.min(99, Math.max(40, base.ratings.threePoint + v1)),
      finishing: Math.min(99, Math.max(40, base.ratings.finishing + v2)),
      handles: Math.min(99, Math.max(40, base.ratings.handles + v3)),
    },
  };
}

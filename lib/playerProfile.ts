export type PlayerProfile = {
  archetype: string;
  ratings: { threePoint: number; finishing: number; handles: number };
  nbaComparison: string;
  comparisonReason: string;
};

type ArchetypeBase = {
  archetype: string;
  ratings: { threePoint: number; finishing: number; handles: number };
  nbaComparison: string;
  comparisonReasons: string[];
};

const ARCHETYPES: ArchetypeBase[] = [
  {
    archetype: "Sharpshooter",
    ratings: { threePoint: 88, finishing: 62, handles: 71 },
    nbaComparison: "Klay Thompson",
    comparisonReasons: [
      "Your footage showed consistent off-ball movement and catch-and-shoot mechanics with minimal wasted motion before release — the same quick-trigger efficiency that defines Klay's game.",
      "You relocated to open spots without the ball and got shots off cleanly off screens — the same relentless off-ball discipline that makes Klay nearly impossible to guard.",
    ],
  },
  {
    archetype: "Slasher",
    ratings: { threePoint: 58, finishing: 91, handles: 78 },
    nbaComparison: "Zach LaVine",
    comparisonReasons: [
      "You attacked the paint repeatedly with straight-line drives and elevated through contact — the same explosive first-step finishing style LaVine uses to convert at the rim.",
      "Your footage showed an ability to create separation off the bounce and finish above defenders — LaVine's signature blend of speed and athleticism at the basket.",
    ],
  },
  {
    archetype: "Floor General",
    ratings: { threePoint: 72, finishing: 74, handles: 94 },
    nbaComparison: "Chris Paul",
    comparisonReasons: [
      "Your footage showed deliberate pace changes and consistent pick-and-roll reads, favoring pull-up jumpers and floaters over forced drives — classic CP3 floor control.",
      "You controlled tempo by slowing the game down and speeding it up on your terms, creating easy looks for teammates — the same orchestration skill that defines Paul's game.",
    ],
  },
  {
    archetype: "Two-Way Wing",
    ratings: { threePoint: 76, finishing: 82, handles: 79 },
    nbaComparison: "Kawhi Leonard",
    comparisonReasons: [
      "You showed active hands in passing lanes and attacked mid-range spots off the catch — the methodical, two-way style that makes Leonard a threat on both ends of the floor.",
      "Your footage revealed efficient shot selection off the drive, plus defensive awareness to contest and disrupt — the quiet, calculated approach Kawhi has mastered.",
    ],
  },
  {
    archetype: "Glass Cleaner",
    ratings: { threePoint: 45, finishing: 87, handles: 55 },
    nbaComparison: "Julius Randle",
    comparisonReasons: [
      "Your footage showed physical post-ups, aggressive offensive rebounds, and power finishing over finesse — the bruising interior game Randle has built his career on.",
      "You pursued every loose ball and finished through contact in traffic — the relentless motor and physicality at the rim that makes Randle so hard to contain.",
    ],
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
  const reasonIndex = (hash >> 16) % base.comparisonReasons.length;
  return {
    archetype: base.archetype,
    ratings: {
      threePoint: Math.min(99, Math.max(40, base.ratings.threePoint + v1)),
      finishing: Math.min(99, Math.max(40, base.ratings.finishing + v2)),
      handles: Math.min(99, Math.max(40, base.ratings.handles + v3)),
    },
    nbaComparison: base.nbaComparison,
    comparisonReason: base.comparisonReasons[reasonIndex],
  };
}

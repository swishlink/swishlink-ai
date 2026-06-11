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

const RATING_COLORS: Record<string, string> = {
  "3PT": "bg-orange-400",
  Finishing: "bg-sky-400",
  Handles: "bg-emerald-400",
};

export default function PlayerProfileCard({ profile }: { profile: PlayerProfile }) {
  const ratings = [
    { label: "3PT", value: profile.ratings.threePoint },
    { label: "Finishing", value: profile.ratings.finishing },
    { label: "Handles", value: profile.ratings.handles },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1120] text-white p-6 mt-6">
      <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">
        Player Profile
      </span>
      <h3 className="text-2xl font-bold mt-1">{profile.archetype}</h3>
      <p className="text-sm text-gray-400 mt-1 mb-6">
        NBA Comparison:{" "}
        <span className="font-semibold text-white">{profile.nbaComparison}</span>
      </p>

      <div className="grid grid-cols-3 gap-6">
        {ratings.map(({ label, value }) => (
          <div key={label}>
            <div className="text-4xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
              {label}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-800">
              <div
                className={`h-1.5 rounded-full ${RATING_COLORS[label]}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

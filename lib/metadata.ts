export const factions = [
  {
    id: 0,
    name: "USDC Guard",
    icon: "USDC",
    description: "Steady flock leaders with a bright USDC-blue scarf.",
    color: "from-sky-400 to-cyan-300",
    accent: "#1BB7C9"
  },
  {
    id: 1,
    name: "Bridge Birds",
    icon: "BIRD",
    description: "Fast movers with coral feathers and route instincts.",
    color: "from-coral to-orange-300",
    accent: "#FF7B6B"
  },
  {
    id: 2,
    name: "Agent Owls",
    icon: "OWL",
    description: "Curious strategists with soft purple glow trails.",
    color: "from-lilac to-violet-300",
    accent: "#B9A6FF"
  },
  {
    id: 3,
    name: "Builder Beaks",
    icon: "BUILD",
    description: "Hands-on players with mint-green builder energy.",
    color: "from-mint to-emerald-300",
    accent: "#7BE6B2"
  }
] as const;

export const fallbackLeaderboard = [
  { user: "0xA11ce00000000000000000000000000000000001", username: "SunnyNest", faction: 0, highScore: 8200, level: 7, demo: true },
  { user: "0xB1rd000000000000000000000000000000000002", username: "BridgePeep", faction: 1, highScore: 7600, level: 6, demo: true },
  { user: "0x0w10000000000000000000000000000000000003", username: "AgentHoot", faction: 2, highScore: 6900, level: 5, demo: true },
  { user: "0xBui1d0000000000000000000000000000000004", username: "MintBuilder", faction: 3, highScore: 6100, level: 5, demo: true }
];

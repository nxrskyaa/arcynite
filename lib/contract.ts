export const arcyniteQuestAbi = [
  {
    type: "function",
    name: "createCitizen",
    stateMutability: "nonpayable",
    inputs: [
      { name: "username", type: "string" },
      { name: "faction", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "submitFlockScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "score", type: "uint256" },
      { name: "flockSize", type: "uint32" },
      { name: "coins", type: "uint32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getCitizen",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "username", type: "string" },
          { name: "faction", type: "uint8" },
          { name: "xp", type: "uint256" },
          { name: "level", type: "uint256" },
          { name: "gmStreak", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "exists", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getGameStats",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "highScore", type: "uint256" },
          { name: "totalScore", type: "uint256" },
          { name: "totalRuns", type: "uint256" },
          { name: "bestFlockSize", type: "uint32" },
          { name: "totalCoins", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getUserSummary",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "username", type: "string" },
      { name: "faction", type: "uint8" },
      { name: "level", type: "uint256" },
      { name: "xp", type: "uint256" },
      { name: "highScore", type: "uint256" },
      { name: "unusedCountA", type: "uint256" },
      { name: "unusedCountB", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getLeaderboard",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "user", type: "address" },
          { name: "username", type: "string" },
          { name: "faction", type: "uint8" },
          { name: "highScore", type: "uint256" },
          { name: "level", type: "uint256" }
        ]
      }
    ]
  }
] as const;

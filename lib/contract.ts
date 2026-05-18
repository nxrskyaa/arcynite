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
    name: "sendGM",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "createAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "role", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "completeQuest",
    stateMutability: "nonpayable",
    inputs: [{ name: "questId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "unlockZone",
    stateMutability: "nonpayable",
    inputs: [{ name: "zoneId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "submitFlockScore",
    stateMutability: "payable",
    inputs: [
      { name: "score", type: "uint256" },
      { name: "flockSize", type: "uint32" },
      { name: "coins", type: "uint32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "scoreSubmitFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "claimBadge",
    stateMutability: "nonpayable",
    inputs: [{ name: "badgeId", type: "uint256" }],
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
    name: "getProgress",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "questsCompleted", type: "uint256" },
          { name: "badgesClaimed", type: "uint256" },
          { name: "zonesUnlocked", type: "uint256" }
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
      { name: "questsCompleted", type: "uint256" },
      { name: "badgesClaimed", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getAgent",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "hasAgent", type: "bool" },
      { name: "agentName", type: "string" },
      { name: "agentRole", type: "string" },
      { name: "agentCreatedAt", type: "uint64" }
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
  },
  {
    type: "function",
    name: "getFactionStats",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "xp", type: "uint256" },
          { name: "score", type: "uint256" },
          { name: "members", type: "uint256" },
          { name: "runs", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getContractBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "canClaimBadge",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "badgeId", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "hasCompletedQuest",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "questId", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "hasClaimedBadge",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "badgeId", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "hasUnlockedZone",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "zoneId", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  }
] as const;

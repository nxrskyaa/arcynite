import {
  BadgeCheck,
  Banknote,
  Bird,
  Bot,
  Castle,
  Crown,
  FlameKindling,
  Gem,
  Landmark,
  MapPin,
  Medal,
  Mountain,
  ShipWheel,
  Sparkles,
  Trophy
} from "lucide-react";

export const factions = [
  {
    id: 0,
    name: "USDC Guard",
    icon: "USDC",
    description: "Steady citizens who teach gas, safety, and stable onboarding.",
    color: "from-sky-400 to-cyan-300"
  },
  {
    id: 1,
    name: "Bridge Birds",
    icon: "BIRD",
    description: "Fast pathfinders who help new users cross into Arc.",
    color: "from-coral to-orange-300"
  },
  {
    id: 2,
    name: "Agent Owls",
    icon: "OWL",
    description: "Curious builders who pair human quests with AI companions.",
    color: "from-lilac to-violet-300"
  },
  {
    id: 3,
    name: "Builder Beaks",
    icon: "BUILD",
    description: "Hands-on makers raising the city one onboarding loop at a time.",
    color: "from-mint to-emerald-300"
  }
] as const;

export const roles = ["Researcher", "Builder", "Scout", "Trader", "Guardian"] as const;

export const zones = [
  {
    id: 0,
    name: "Flock Gate",
    icon: Castle,
    text: "Mint your citizen profile and choose the flock that will guide your Arc path.",
    action: "Create profile",
    state: "completed"
  },
  {
    id: 1,
    name: "USDC Bank",
    icon: Landmark,
    text: "Arc uses USDC as native gas, making costs familiar from the first click.",
    action: "Learn USDC gas",
    state: "unlocked"
  },
  {
    id: 2,
    name: "Bridge Harbor",
    icon: ShipWheel,
    text: "Learn how bridges bring assets and citizens safely into the city.",
    action: "Visit harbor",
    state: "unlocked"
  },
  {
    id: 3,
    name: "Agent Academy",
    icon: Bot,
    text: "Create an AI agent profile to help explain routes, quests, and strategy.",
    action: "Train agent",
    state: "unlocked"
  },
  {
    id: 4,
    name: "Flock Rally Arena",
    icon: FlameKindling,
    text: "Run the onboarding rally offchain, then submit your best score on Arc.",
    action: "Play rally",
    state: "unlocked"
  },
  {
    id: 5,
    name: "Badge Nest",
    icon: Medal,
    text: "Collect testnet achievement badges for profile, quest, and rally milestones.",
    action: "Claim badges",
    state: "unlocked"
  },
  {
    id: 6,
    name: "Command Board",
    icon: MapPin,
    text: "Track onboarding quests and record progress with onchain completion.",
    action: "Open quests",
    state: "unlocked"
  },
  {
    id: 7,
    name: "Leaderboard Tower",
    icon: Trophy,
    text: "Compare flock scores, faction strength, and city citizens onchain.",
    action: "View ranks",
    state: "unlocked"
  },
  {
    id: 8,
    name: "Arc Fountain",
    icon: Gem,
    text: "A celebratory zone for city progress and future Arc community rituals.",
    action: "Coming soon",
    state: "coming"
  }
] as const;

export const quests = [
  {
    id: 0,
    title: "Create Profile",
    description: "Become an Arcynite citizen at Flock Gate.",
    story: "Your passport starts at Flock Gate. A citizen profile makes the rest of Arcynite personal and onchain.",
    concept: "Arc Testnet actions are tied to your wallet identity, so the app can read your profile, faction, level, and progress.",
    learn: ["Why the city checks getCitizen(address)", "How faction choice shapes leaderboard flavor", "Why profile creation gates later achievements"],
    steps: ["Connect wallet", "Switch to Arc Testnet", "Create your citizen profile"],
    actionLabel: "Create at Flock Gate",
    gate: "Create a citizen profile first.",
    zone: "Flock Gate",
    xp: 50
  },
  {
    id: 1,
    title: "Send First GM",
    description: "Say GM to the city and start your streak.",
    story: "Arcynite citizens use GM as a small daily check-in before starting quests.",
    concept: "sendGM() is a simple write that teaches wallet confirmation and transaction feedback without complex inputs.",
    learn: ["How a basic contract write feels", "Where Arcscan confirmations appear", "How GM streaks become onboarding momentum"],
    steps: ["Open Command Board", "Send GM", "Confirm the transaction"],
    actionLabel: "Send GM",
    gate: "Read the GM lesson, then send GM.",
    zone: "Command Board",
    xp: 25
  },
  {
    id: 2,
    title: "Visit USDC Bank",
    description: "Discover why USDC gas makes onboarding friendlier.",
    story: "The USDC Bank explains Arc's most approachable trick: gas in a familiar stable currency.",
    concept: "Arc Testnet uses USDC as native currency, making transaction cost language easier for new users.",
    learn: ["Why native USDC gas helps onboarding", "How wallet network config displays USDC", "Why stable gas copy matters in UX"],
    steps: ["Visit USDC Bank", "Read the gas primer", "Mark the visit ready"],
    actionLabel: "Mark bank visit ready",
    gate: "Open the USDC Bank lesson first.",
    zone: "USDC Bank",
    xp: 35
  },
  {
    id: 3,
    title: "Learn USDC Gas",
    description: "Complete the USDC gas primer.",
    story: "Now that you have seen the bank, learn what users should look for before signing.",
    concept: "Gas fees should be presented as clear testnet onboarding costs, not token rewards or financial promises.",
    learn: ["Read network fee prompts", "Explain native currency decimals", "Avoid reward-style language"],
    steps: ["Review USDC gas notes", "Check the network chip", "Complete the primer"],
    actionLabel: "Complete gas lesson",
    gate: "Finish the USDC lesson steps.",
    zone: "USDC Bank",
    xp: 45
  },
  {
    id: 4,
    title: "Visit Bridge Harbor",
    description: "Inspect the harbor where new assets arrive.",
    story: "Bridge Harbor is the city checkpoint for thinking about movement between networks.",
    concept: "Bridge UX should teach safety, source/destination checks, and waiting for confirmations.",
    learn: ["Check source and destination networks", "Understand bridge confirmation delay", "Treat bridge flows as safety-sensitive"],
    steps: ["Visit Bridge Harbor", "Read the safety card", "Mark the harbor inspected"],
    actionLabel: "Mark harbor visit ready",
    gate: "Read the Bridge Harbor lesson first.",
    zone: "Bridge Harbor",
    xp: 35
  },
  {
    id: 5,
    title: "Learn Bridge",
    description: "Finish the bridge safety lesson.",
    story: "A good citizen can explain bridge safety before sending anyone across.",
    concept: "The app keeps bridge learning educational only; no token rewards or real asset movement are required.",
    learn: ["Separate education from asset transfer", "Explain bridge risk plainly", "Use Arcscan for transaction traceability"],
    steps: ["Read the bridge lesson", "Review the risk notes", "Complete the lesson"],
    actionLabel: "Complete bridge lesson",
    gate: "Finish the bridge lesson steps.",
    zone: "Bridge Harbor",
    xp: 45
  },
  {
    id: 6,
    title: "Create AI Agent",
    description: "Register your first helper agent.",
    story: "Agent Academy lets your citizen carry a tiny helper identity through the city.",
    concept: "createAgent(name, role) stores hasAgent, agentName, agentRole, and agentCreatedAt for your wallet.",
    learn: ["What getAgent(address) returns", "Why agent role is profile metadata", "How the profile updates after createAgent"],
    steps: ["Open Agent Academy", "Choose a role", "Create the agent onchain"],
    actionLabel: "Create agent first",
    gate: "Create an agent in Agent Academy.",
    zone: "Agent Academy",
    xp: 60
  },
  {
    id: 7,
    title: "Play Arc Flock Rally",
    description: "Run the rally once without an onchain submit.",
    story: "The rally is intentionally offchain while you play, so gameplay stays instant.",
    concept: "Only the final result is submitted. The game itself is local and does not auto-submit.",
    learn: ["Why gameplay is offchain", "Which items help or hurt", "Why score submission is a separate decision"],
    steps: ["Open Rally Arena", "Play one local run", "Review the result panel"],
    actionLabel: "Play a local run first",
    gate: "Finish one local rally run.",
    zone: "Flock Rally Arena",
    xp: 40
  },
  {
    id: 8,
    title: "Submit First Score",
    description: "Record your rally result on Arc Testnet.",
    story: "A finished rally can become an onchain achievement once the user chooses to submit it.",
    concept: "submitFlockScore(score, flockSize, coins) records integer results and may require scoreSubmitFee.",
    learn: ["Validate score before sending", "Understand optional submit fee", "Refresh leaderboard and badges after success"],
    steps: ["Finish a run", "Review score, flock, and coins", "Submit score on Arc"],
    actionLabel: "Submit score first",
    gate: "Submit a valid rally score on Arc.",
    zone: "Flock Rally Arena",
    xp: 75
  },
  {
    id: 9,
    title: "Claim First Badge",
    description: "Claim a collectible city achievement.",
    story: "Badge Nest turns progress into collectible testnet achievements.",
    concept: "canClaimBadge and hasClaimedBadge decide the button state; claimBadge writes the collectible state.",
    learn: ["Why badge eligibility is read before writes", "How claim buttons should be disabled", "How achievements stay testnet-only"],
    steps: ["Open Badge Nest", "Find a claimable badge", "Claim it onchain"],
    actionLabel: "Claim a badge first",
    gate: "Claim at least one badge.",
    zone: "Badge Nest",
    xp: 50
  },
  {
    id: 10,
    title: "Complete Beginner Path",
    description: "Wrap the first Arcynite onboarding trail.",
    story: "The beginner path is complete when profile, learning, rally, and badge systems all make sense.",
    concept: "This final quest ties together reads, writes, local gameplay, and onchain achievement refreshes.",
    learn: ["Follow the full onboarding loop", "Use Arcscan links for trust", "Understand offchain vs onchain state"],
    steps: ["Create profile", "Learn Arc basics", "Submit a rally score or claim a badge"],
    actionLabel: "Complete beginner path",
    gate: "Complete the core learning path first.",
    zone: "Command Board",
    xp: 120
  }
] as const;

export const badges = [
  { id: 0, name: "Genesis Citizen", icon: Sparkles, description: "Created a citizen profile." },
  { id: 1, name: "GM Starter", icon: Bird, description: "Sent a first GM from Arcynite City." },
  { id: 2, name: "USDC Learner", icon: Banknote, description: "Completed the USDC gas lesson." },
  { id: 3, name: "Bridge Explorer", icon: ShipWheel, description: "Visited Bridge Harbor." },
  { id: 4, name: "Agent Initiate", icon: Bot, description: "Created an AI agent profile." },
  { id: 5, name: "Quest Rookie", icon: BadgeCheck, description: "Completed early city quests." },
  { id: 6, name: "Arc Pathfinder", icon: Mountain, description: "Unlocked the core city route." },
  { id: 7, name: "Daily Citizen", icon: Crown, description: "Kept the city streak alive." },
  { id: 8, name: "Flock Player", icon: FlameKindling, description: "Played Arc Flock Rally." },
  { id: 9, name: "Arcynite Legionnaire", icon: Castle, description: "Joined the active testnet legion." },
  { id: 10, name: "Flock Commander", icon: Trophy, description: "Posted a powerful rally result." }
] as const;

export const fallbackLeaderboard = [
  { user: "0xA11ce00000000000000000000000000000000001", username: "SunnyNest", faction: 0, highScore: 8200, level: 7 },
  { user: "0xB1rd000000000000000000000000000000000002", username: "BridgePeep", faction: 1, highScore: 7600, level: 6 },
  { user: "0x0w10000000000000000000000000000000000003", username: "AgentHoot", faction: 2, highScore: 6900, level: 5 }
];

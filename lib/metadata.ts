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
  { id: 0, title: "Create Profile", description: "Become an Arcynite citizen at Flock Gate.", xp: 50 },
  { id: 1, title: "Send First GM", description: "Say GM to the city and start your streak.", xp: 25 },
  { id: 2, title: "Visit USDC Bank", description: "Discover why USDC gas makes onboarding friendlier.", xp: 35 },
  { id: 3, title: "Learn USDC Gas", description: "Complete the USDC gas primer.", xp: 45 },
  { id: 4, title: "Visit Bridge Harbor", description: "Inspect the harbor where new assets arrive.", xp: 35 },
  { id: 5, title: "Learn Bridge", description: "Finish the bridge safety lesson.", xp: 45 },
  { id: 6, title: "Create AI Agent", description: "Register your first helper agent.", xp: 60 },
  { id: 7, title: "Play Arc Flock Rally", description: "Run the rally once without an onchain submit.", xp: 40 },
  { id: 8, title: "Submit First Score", description: "Record your rally result on Arc Testnet.", xp: 75 },
  { id: 9, title: "Claim First Badge", description: "Claim a collectible city achievement.", xp: 50 },
  { id: 10, title: "Complete Beginner Path", description: "Wrap the first Arcynite onboarding trail.", xp: 120 }
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

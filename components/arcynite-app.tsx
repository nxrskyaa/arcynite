"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Gamepad2,
  Loader2,
  LogOut,
  Map,
  Medal,
  Send,
  Sparkles,
  Trophy,
  UserRound,
  Wallet
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract
} from "wagmi";
import { ArcFlockRally, type RallyResult } from "@/components/game/arc-flock-rally";
import { arcExplorer, arcTestnet, arcyniteContractAddress, shortAddress, txUrl } from "@/lib/arc";
import { arcyniteQuestAbi } from "@/lib/contract";
import { badges, factions, fallbackLeaderboard, quests, roles, zones } from "@/lib/metadata";
import {
  normalizeAgent,
  normalizeCitizen,
  normalizeFactionStats,
  normalizeGameStats,
  normalizeLeaderboard,
  normalizeProgress
} from "@/lib/normalize";

type Section = "city" | "gate" | "rally" | "academy" | "quests" | "badges" | "leaderboard" | "profile";

type TxState = {
  label: string;
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  error?: string;
};

type UserSummary = {
  username: string;
  faction: number;
  level: number;
  xp: number;
  highScore: number;
  questsCompleted: number;
  badgesClaimed: number;
};

const sectionLabels: { id: Section; label: string; icon: typeof Map }[] = [
  { id: "city", label: "City", icon: Map },
  { id: "gate", label: "Gate", icon: UserRound },
  { id: "rally", label: "Rally", icon: Gamepad2 },
  { id: "academy", label: "Agent", icon: Bot },
  { id: "quests", label: "Quests", icon: BadgeCheck },
  { id: "badges", label: "Badges", icon: Medal },
  { id: "leaderboard", label: "Ranks", icon: Trophy },
  { id: "profile", label: "Profile", icon: UserRound }
];

function field<T>(value: T | undefined, fallback: T) {
  return value ?? fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function decodeTxError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (message.includes("NO_CITIZEN")) return "Create your Arcynite profile first";
  if (message.includes("INVALID_SCORE")) return "Score must be greater than 0";
  if (message.includes("INVALID_FLOCK_SIZE")) return "Flock size must be greater than 0";
  if (message.includes("INSUFFICIENT_FEE")) return "Score submit fee is required";
  if (message.includes("PAUSED")) return "Contract is paused";
  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) return "Transaction rejected in wallet";
  return message || "Transaction failed.";
}

function normalizeUserSummary(value: unknown): UserSummary {
  const tuple = Array.isArray(value) ? value : [];
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const read = (index: number, key: string, fallback: unknown) => record[key] ?? tuple[index] ?? fallback;
  return {
    username: String(read(0, "username", "")),
    faction: Number(read(1, "faction", 0)),
    level: Number(read(2, "level", 0)),
    xp: Number(read(3, "xp", 0)),
    highScore: Number(read(4, "highScore", 0)),
    questsCompleted: Number(read(5, "questsCompleted", 0)),
    badgesClaimed: Number(read(6, "badgesClaimed", 0))
  };
}

function ArcyniteMark({ compact = false }: { compact?: boolean }) {
  if (!compact) {
    return (
      <div className="relative mb-6 h-32 w-64 sm:h-40 sm:w-80">
        <Image
          src="/brand/arcynite-logo.png"
          alt="Arcynite"
          fill
          priority
          sizes="320px"
          className="object-contain object-left drop-shadow-[0_18px_28px_rgba(34,60,88,0.16)]"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-16 shrink-0 overflow-visible">
        <Image
          src="/brand/arcynite-logo.png"
          alt="Arcynite"
          fill
          sizes="64px"
          className="object-contain drop-shadow-[0_12px_22px_rgba(34,60,88,0.18)]"
        />
      </div>
      <div>
        <p className="font-display text-2xl font-bold leading-none text-ink">Arcynite</p>
      </div>
    </div>
  );
}

function MiniCity() {
  const buildings = [
    { className: "left-[11%] top-[43%] h-24 w-20 bg-coral", label: "Gate" },
    { className: "left-[29%] top-[25%] h-40 w-24 bg-lagoon", label: "USDC" },
    { className: "left-[49%] top-[35%] h-32 w-24 bg-lilac", label: "Agent" },
    { className: "right-[12%] top-[45%] h-24 w-24 bg-sun", label: "Rally" }
  ];

  return (
    <div className="relative mx-auto aspect-[1.12/1] w-full max-w-[610px]">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-x-8 bottom-2 h-20 rounded-[100%] bg-ink/10 blur-2xl" />
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-6 rounded-[48px] bg-gradient-to-br from-mint via-skyglass to-sun/85 shadow-toy [transform:rotateX(58deg)_rotateZ(-35deg)]" />
      <div className="absolute left-[20%] top-[58%] h-14 w-72 rounded-[100%] bg-lagoon/15 blur-md" />
      <div className="absolute left-[26%] top-[54%] h-3 w-[48%] rotate-[-18deg] rounded-full bg-white/70 shadow-soft" />
      <div className="absolute left-[37%] top-[37%] h-3 w-[35%] rotate-[20deg] rounded-full bg-white/60 shadow-soft" />
      {buildings.map((building, index) => (
        <motion.div
          key={building.className}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 + index * 0.08 }}
          className={`absolute rounded-[22px] border-4 border-white/70 shadow-soft ${building.className}`}
        >
          <div className="mx-auto mt-[-18px] h-10 w-12 rounded-t-full bg-white/80" />
          <div className="mx-auto mt-4 grid w-12 grid-cols-2 gap-2">
            <span className="h-3 rounded-full bg-white/60" />
            <span className="h-3 rounded-full bg-white/60" />
            <span className="h-3 rounded-full bg-white/60" />
            <span className="h-3 rounded-full bg-white/60" />
          </div>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-ink shadow-soft">{building.label}</span>
        </motion.div>
      ))}
      <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }} transition={{ duration: 3.8, repeat: Infinity }} className="absolute left-[42%] top-[10%] grid size-24 place-items-center rounded-full bg-white/85 shadow-soft">
        <Sparkles className="size-10 text-lagoon" />
      </motion.div>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[18%] right-[8%] rounded-[24px] bg-white/90 px-4 py-3 text-sm font-extrabold text-ink shadow-soft">USDC gas</motion.div>
      <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute left-[7%] top-[17%] rounded-[24px] bg-white/90 px-4 py-3 text-sm font-extrabold text-ink shadow-soft">Quest route</motion.div>
    </div>
  );
}

export function ArcyniteApp() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [activeSection, setActiveSection] = useState<Section>("city");
  const [tx, setTx] = useState<TxState>({ label: "", status: "idle" });
  const [username, setUsername] = useState("");
  const [faction, setFaction] = useState(0);
  const [agentName, setAgentName] = useState("");
  const [agentRole, setAgentRole] = useState<(typeof roles)[number]>("Researcher");
  const [lessonProgress, setLessonProgress] = useState<Record<number, number>>({});
  const [localRallyRun, setLocalRallyRun] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const connectedToArc = isConnected && chainId === arcTestnet.id;
  const contract = { address: arcyniteContractAddress, abi: arcyniteQuestAbi, chainId: arcTestnet.id } as const;

  const citizenRead = useReadContract({
    ...contract,
    functionName: "getCitizen",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const progressRead = useReadContract({
    ...contract,
    functionName: "getProgress",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const gameStatsRead = useReadContract({
    ...contract,
    functionName: "getGameStats",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const userSummaryRead = useReadContract({
    ...contract,
    functionName: "getUserSummary",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const agentRead = useReadContract({
    ...contract,
    functionName: "getAgent",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const leaderboardRead = useReadContract({
    ...contract,
    functionName: "getLeaderboard",
    query: { enabled: connectedToArc }
  });

  const factionStatsRead = useReadContract({
    ...contract,
    functionName: "getFactionStats",
    query: { enabled: connectedToArc }
  });

  const questReads = useReadContracts({
    contracts: quests.map((quest) => ({
      ...contract,
      functionName: "hasCompletedQuest",
      args: address ? [address, BigInt(quest.id)] : undefined
    })),
    query: { enabled: Boolean(address) }
  });

  const badgeClaimedReads = useReadContracts({
    contracts: badges.map((badge) => ({
      ...contract,
      functionName: "hasClaimedBadge",
      args: address ? [address, BigInt(badge.id)] : undefined
    })),
    query: { enabled: Boolean(address) }
  });

  const badgeClaimableReads = useReadContracts({
    contracts: badges.map((badge) => ({
      ...contract,
      functionName: "canClaimBadge",
      args: address ? [address, BigInt(badge.id)] : undefined
    })),
    query: { enabled: Boolean(address) }
  });

  const zoneReads = useReadContracts({
    contracts: zones.map((zone) => ({
      ...contract,
      functionName: "hasUnlockedZone",
      args: address ? [address, BigInt(zone.id)] : undefined
    })),
    query: { enabled: Boolean(address) }
  });

  const citizen = normalizeCitizen(citizenRead.data);
  const progress = normalizeProgress(progressRead.data);
  const gameStats = normalizeGameStats(gameStatsRead.data);
  const userSummary = normalizeUserSummary(userSummaryRead.data);
  const agent = normalizeAgent(agentRead.data);
  const leaderboard = normalizeLeaderboard(leaderboardRead.data);
  const factionStats = normalizeFactionStats(factionStatsRead.data);
  const hasProfile = Boolean(connectedToArc && citizen.exists);

  const completedQuestIds = useMemo(
    () => new Set((questReads.data ?? []).flatMap((item, index) => (item.status === "success" && item.result ? [index] : []))),
    [questReads.data]
  );

  const claimedBadgeIds = useMemo(
    () => new Set((badgeClaimedReads.data ?? []).flatMap((item, index) => (item.status === "success" && item.result ? [index] : []))),
    [badgeClaimedReads.data]
  );

  const claimableBadgeIds = useMemo(
    () => new Set((badgeClaimableReads.data ?? []).flatMap((item, index) => (item.status === "success" && item.result ? [index] : []))),
    [badgeClaimableReads.data]
  );

  const unlockedZoneIds = useMemo(
    () => new Set((zoneReads.data ?? []).flatMap((item, index) => (item.status === "success" && item.result ? [index] : []))),
    [zoneReads.data]
  );

  useEffect(() => {
    const rawLessons = window.localStorage.getItem("arcynite-lesson-progress");
    if (rawLessons) setLessonProgress(JSON.parse(rawLessons) as Record<number, number>);
    setLocalRallyRun(Boolean(window.localStorage.getItem("arcynite-rally-played")));
    setScoreSubmitted(Boolean(window.localStorage.getItem("arcynite-score-submitted")));
  }, []);

  function setQuestStep(questId: number, step: number) {
    setLessonProgress((current) => {
      const next = { ...current, [questId]: Math.max(step, current[questId] ?? 0) };
      window.localStorage.setItem("arcynite-lesson-progress", JSON.stringify(next));
      return next;
    });
  }

  async function refreshReads() {
    await Promise.allSettled([
      citizenRead.refetch(),
      progressRead.refetch(),
      gameStatsRead.refetch(),
      userSummaryRead.refetch(),
      agentRead.refetch(),
      leaderboardRead.refetch(),
      factionStatsRead.refetch(),
      questReads.refetch(),
      badgeClaimedReads.refetch(),
      badgeClaimableReads.refetch(),
      zoneReads.refetch()
    ]);
  }

  async function connectWallet() {
    const connector = connectors[0];
    if (!connector) return;
    await connectAsync({ connector, chainId: arcTestnet.id });
  }

  async function switchToArc() {
    await switchChainAsync({ chainId: arcTestnet.id });
  }

  async function runTx(label: string, functionName: string, args: readonly unknown[] = []) {
    if (!connectedToArc) {
      setTx({ label, status: "error", error: "Connect to Arc Testnet first." });
      return false;
    }

    try {
      setTx({ label, status: "pending" });
      const hash = await writeContractAsync({
        ...contract,
        functionName: functionName as never,
        args: args as never
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setTx({ label, status: "success", hash });
      await refreshReads();
      return true;
    } catch (error) {
      setTx({
        label,
        status: "error",
        error: decodeTxError(error)
      });
      return false;
    }
  }

  async function createCitizen() {
    const ok = await runTx("Create citizen", "createCitizen", [username.trim() || "Arcynite Citizen", faction]);
    if (ok) {
      setQuestStep(0, 4);
      setActiveSection("city");
    }
  }

  async function createAgent() {
    if (!connectedToArc) {
      setTx({ label: "Create agent", status: "error", error: "Connect to Arc Testnet first." });
      return;
    }

    try {
      setTx({ label: "Create agent", status: "pending" });
      const hash = await writeContractAsync({
        ...contract,
        functionName: "createAgent",
        args: [agentName.trim() || "Arcynite Agent", agentRole]
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setTx({ label: "Create agent", status: "success", hash });
      await Promise.allSettled([citizenRead.refetch(), progressRead.refetch(), userSummaryRead.refetch(), agentRead.refetch()]);
      setQuestStep(6, 4);
    } catch (error) {
      setTx({ label: "Create agent", status: "error", error: decodeTxError(error) });
    }
  }

  async function submitScore(result: RallyResult) {
    const finalScore = Math.floor(result.score);
    const finalFlockSize = Math.floor(result.flockSize);
    const coinsCollected = Math.floor(result.coins);
    const uint32Max = 4_294_967_295;
    const args = [BigInt(finalScore), Math.min(finalFlockSize, uint32Max), Math.min(Math.max(coinsCollected, 0), uint32Max)] as const;

    console.log({
      finalScore,
      finalFlockSize,
      coinsCollected,
      args: [args[0].toString(), args[1], args[2]]
    });

    if (!isConnected) {
      setTx({ label: "Submit flock score", status: "error", error: "Connect wallet first." });
      return;
    }
    if (!connectedToArc) {
      setTx({ label: "Submit flock score", status: "error", error: "Connect to Arc Testnet first." });
      return;
    }
    const citizenCheck = publicClient
      ? normalizeCitizen(
          await publicClient.readContract({
            ...contract,
            functionName: "getCitizen",
            args: [address!]
          })
        )
      : citizen;
    if (!citizenCheck.exists) {
      setTx({ label: "Submit flock score", status: "error", error: "Create your Arcynite profile first" });
      return;
    }
    if (!Number.isInteger(finalScore) || finalScore <= 0) {
      setTx({ label: "Submit flock score", status: "error", error: "Score must be greater than 0" });
      return;
    }
    if (!Number.isInteger(finalFlockSize) || finalFlockSize <= 0 || finalFlockSize > uint32Max) {
      setTx({ label: "Submit flock score", status: "error", error: "Flock size must be greater than 0" });
      return;
    }
    if (!Number.isInteger(coinsCollected) || coinsCollected < 0 || coinsCollected > uint32Max) {
      setTx({ label: "Submit flock score", status: "error", error: "Coins must be a valid integer" });
      return;
    }

    try {
      setTx({ label: "Submit flock score", status: "pending" });
      const fee = publicClient
        ? await publicClient.readContract({
            ...contract,
            functionName: "scoreSubmitFee"
          })
        : BigInt(0);
      const hash = await writeContractAsync({
        ...contract,
        functionName: "submitFlockScore",
        args,
        value: fee > BigInt(0) ? fee : undefined
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setTx({ label: "Submit flock score", status: "success", hash });
      window.localStorage.setItem("arcynite-score-submitted", "1");
      setScoreSubmitted(true);
      setQuestStep(8, 4);
      await Promise.allSettled([
        gameStatsRead.refetch(),
        userSummaryRead.refetch(),
        progressRead.refetch(),
        leaderboardRead.refetch(),
        factionStatsRead.refetch(),
        badgeClaimableReads.refetch()
      ]);
    } catch (error) {
      setTx({ label: "Submit flock score", status: "error", error: decodeTxError(error) });
    }
  }

  const currentFaction = factions[field(citizen.faction, 0)] ?? factions[0];
  const txLink = tx.hash ? txUrl(tx.hash) : undefined;
  const activeNavItem = sectionLabels.find((item) => item.id === activeSection) ?? sectionLabels[0];
  const walletLabel = connectedToArc ? "Arc Testnet" : isConnected ? "Wrong chain" : "Preview mode";
  const scoreSubmitDisabledReason = !isConnected
    ? "Connect wallet first"
    : !connectedToArc
      ? "Switch to Arc Testnet"
      : !citizen.exists
        ? "Create your Arcynite profile first"
        : tx.status === "pending"
          ? "Transaction pending"
          : undefined;

  return (
    <main className="min-h-screen">
      <Hero
        isConnected={isConnected}
        connectedToArc={connectedToArc}
        hasProfile={hasProfile}
        address={address}
        connecting={connecting}
        switching={switching}
        onConnect={connectWallet}
        onSwitch={switchToArc}
        onExplore={() => setActiveSection(hasProfile ? "city" : "gate")}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-3 z-20 mb-5 overflow-hidden rounded-[30px] border border-white/80 bg-white/86 shadow-[0_18px_48px_rgba(38,50,75,0.13)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center justify-between gap-3 lg:w-[205px] lg:justify-start">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-12 shrink-0">
                  <Image src="/brand/arcynite-logo.png" alt="Arcynite" fill sizes="48px" className="object-contain drop-shadow-[0_8px_14px_rgba(34,60,88,0.18)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold leading-none text-ink">Arcynite</p>
                  <p className="mt-1 truncate text-xs font-extrabold uppercase tracking-[0.12em] text-lagoon">{activeNavItem.label}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold lg:hidden ${connectedToArc ? "bg-mint/45 text-ink" : "bg-sun/45 text-ink"}`}>
                {walletLabel}
              </span>
            </div>

            <div className="min-w-0 flex-1 overflow-x-auto rounded-[22px] bg-skyglass/58 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-1">
                {sectionLabels.map((item) => {
                  const Icon = item.icon;
                  const selected = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      className={`relative flex items-center gap-1.5 rounded-[18px] px-3 py-2.5 text-[13px] font-extrabold transition ${
                        selected ? "text-white" : "text-ink/62 hover:bg-white/70 hover:text-ink"
                      }`}
                    >
                      {selected ? <motion.span layoutId="activeNavPill" className="absolute inset-0 rounded-[18px] bg-ink shadow-[0_10px_22px_rgba(38,50,75,0.18)]" /> : null}
                      <Icon className="relative size-4" />
                      <span className="relative">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 lg:w-[220px] lg:justify-end">
              <span className={`hidden rounded-full px-3 py-2 text-xs font-extrabold lg:inline-flex ${connectedToArc ? "bg-mint/45 text-ink" : "bg-sun/45 text-ink"}`}>
                {walletLabel}
              </span>
              {isConnected ? (
                <>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-ink shadow-[inset_0_0_0_1px_rgba(38,50,75,0.08)]">{shortAddress(address)}</span>
                  <button className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1px_rgba(38,50,75,0.08)] transition hover:bg-coral/15" onClick={() => disconnect()} aria-label="Disconnect wallet">
                    <LogOut className="size-4" />
                  </button>
                </>
              ) : (
                <button className="toy-button bg-lagoon px-5 py-2.5 text-sm font-extrabold text-white" onClick={connectWallet}>
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <StatusBar
          connectedToArc={connectedToArc}
          isConnected={isConnected}
          tx={tx}
          txLink={txLink}
          onSwitch={switchToArc}
          switching={switching}
        />

        {!isConnected ? (
          <EmptyState title="Connect a wallet to enter Arcynite City" body="You can preview the city below, but contract-backed profile, quests, badges, and leaderboards unlock after wallet connection." />
        ) : !connectedToArc ? (
          <EmptyState title="Switch to Arc Testnet" body="Arcynite writes achievements to the deployed ArcyniteQuest contract on Arc Testnet." />
        ) : !hasProfile && activeSection !== "gate" ? (
          <EmptyState title="Flock Gate is waiting" body="Create your citizen profile first, choose a faction, then the city opens up." action="Open Flock Gate" onAction={() => setActiveSection("gate")} />
        ) : null}

        {activeSection === "city" ? (
          <CityMap
            hasProfile={hasProfile}
            unlockedZoneIds={unlockedZoneIds}
            completedQuestIds={completedQuestIds}
            onSection={setActiveSection}
            onUnlock={(zoneId) => runTx("Unlock zone", "unlockZone", [BigInt(zoneId)])}
          />
        ) : null}

        {activeSection === "gate" ? (
          <FlockGate
            username={username}
            setUsername={setUsername}
            faction={faction}
            setFaction={setFaction}
            citizen={citizen}
            connectedToArc={connectedToArc}
            pending={tx.status === "pending"}
            onCreate={createCitizen}
          />
        ) : null}

        {activeSection === "rally" ? (
          <ArcFlockRally
            onSubmit={submitScore}
            submitting={tx.status === "pending"}
            lastTxUrl={txLink}
            submitDisabledReason={scoreSubmitDisabledReason}
            onRunComplete={() => {
              window.localStorage.setItem("arcynite-rally-played", "1");
              setLocalRallyRun(true);
              setQuestStep(7, 4);
            }}
          />
        ) : null}

        {activeSection === "academy" ? (
          <AgentAcademy
            agent={agent}
            faction={currentFaction.name}
            owner={shortAddress(address)}
            name={agentName}
            role={agentRole}
            setName={setAgentName}
            setRole={setAgentRole}
            pending={tx.status === "pending"}
            onCreate={createAgent}
          />
        ) : null}

        {activeSection === "quests" ? (
          <QuestCenter
            completedQuestIds={completedQuestIds}
            claimedBadgeIds={claimedBadgeIds}
            pending={tx.status === "pending"}
            hasProfile={citizen.exists}
            hasAgent={agent.created}
            localRallyRun={localRallyRun}
            scoreSubmitted={scoreSubmitted || gameStats.totalRuns > 0}
            lessonProgress={lessonProgress}
            onLessonStep={setQuestStep}
            onComplete={(questId) => runTx("Complete quest", "completeQuest", [BigInt(questId)])}
            onGM={() => runTx("Send GM", "sendGM")}
          />
        ) : null}

        {activeSection === "badges" ? (
          <BadgeNest
            claimedBadgeIds={claimedBadgeIds}
            claimableBadgeIds={claimableBadgeIds}
            pending={tx.status === "pending"}
            onClaim={(badgeId) => runTx("Claim badge", "claimBadge", [BigInt(badgeId)])}
          />
        ) : null}

        {activeSection === "leaderboard" ? <Leaderboard leaderboard={leaderboard} factionStats={factionStats} /> : null}

        {activeSection === "profile" ? (
          <Profile
            address={address}
            citizen={citizen}
            progress={progress}
            gameStats={gameStats}
            userSummary={userSummary}
            agent={agent}
            factionName={currentFaction.name}
          />
        ) : null}
      </section>
    </main>
  );
}

function Hero({
  isConnected,
  connectedToArc,
  hasProfile,
  address,
  connecting,
  switching,
  onConnect,
  onSwitch,
  onExplore
}: {
  isConnected: boolean;
  connectedToArc: boolean;
  hasProfile: boolean;
  address?: `0x${string}`;
  connecting: boolean;
  switching: boolean;
  onConnect: () => void;
  onSwitch: () => void;
  onExplore: () => void;
}) {
  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[540px] max-w-7xl items-center gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <ArcyniteMark />
          <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.96] text-ink sm:text-6xl xl:text-7xl">A playable Arc Testnet city, not a claim board.</h1>
          <p className="mt-5 max-w-xl text-lg font-bold leading-8 text-ink/68">
            Follow city lessons, learn USDC gas and bridge safety, train an agent, play the rally, then record real testnet achievements on Arc.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!isConnected ? (
              <button className="toy-button bg-coral px-6 py-4 font-extrabold text-white" onClick={onConnect} disabled={connecting}>
                <Wallet className="mr-2 inline size-5" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : !connectedToArc ? (
              <button className="toy-button bg-sun px-6 py-4 font-extrabold text-ink" onClick={onSwitch} disabled={switching}>
                <Sparkles className="mr-2 inline size-5" />
                {switching ? "Switching..." : "Switch to Arc Testnet"}
              </button>
            ) : (
              <button className="toy-button bg-lagoon px-6 py-4 font-extrabold text-white" onClick={onExplore}>
                {hasProfile ? "Enter City Map" : "Create Citizen"}
                <ChevronRight className="ml-2 inline size-5" />
              </button>
            )}
            <a className="toy-button bg-white px-6 py-4 font-extrabold text-ink" href={arcExplorer} target="_blank">
              Arcscan
              <ExternalLink className="ml-2 inline size-4" />
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-extrabold text-ink/65">
            <span className="ribbon px-4 py-2">Arc Testnet</span>
            <span className="ribbon px-4 py-2">Guided lessons</span>
            <span className="ribbon px-4 py-2">{isConnected ? shortAddress(address) : "Wallet ready"}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative rounded-[38px] bg-white/42 p-4 shadow-[0_30px_80px_rgba(38,50,75,0.08)] ring-1 ring-white/70"
        >
          <MiniCity />
        </motion.div>
      </div>
    </section>
  );
}

function StatusBar({
  isConnected,
  connectedToArc,
  switching,
  tx,
  txLink,
  onSwitch
}: {
  isConnected: boolean;
  connectedToArc: boolean;
  switching: boolean;
  tx: TxState;
  txLink?: string;
  onSwitch: () => void;
}) {
  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
      <div className="soft-panel rounded-[24px] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm font-extrabold">
          <span className={connectedToArc ? "text-emerald-600" : "text-coral"}>
            {connectedToArc ? "Connected to Arc Testnet" : isConnected ? "Wrong network" : "Wallet disconnected"}
          </span>
          <span className="text-ink/45">Contract {shortAddress(arcyniteContractAddress)}</span>
          {tx.status === "pending" ? (
            <span className="text-lagoon">
              <Loader2 className="mr-1 inline size-4 animate-spin" />
              {tx.label} pending
            </span>
          ) : null}
          {tx.status === "success" ? (
            <a className="text-emerald-600 underline" href={txLink} target="_blank">
              {tx.label} confirmed on Arcscan
            </a>
          ) : null}
          {tx.status === "error" ? <span className="text-coral">{tx.error}</span> : null}
        </div>
      </div>
      {isConnected && !connectedToArc ? (
        <button className="toy-button bg-sun px-5 py-3 font-extrabold text-ink" onClick={onSwitch} disabled={switching}>
          {switching ? "Switching..." : "Add / switch Arc"}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-6 soft-panel rounded-[28px] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="mt-1 max-w-3xl font-semibold text-ink/65">{body}</p>
        </div>
        {action ? (
          <button className="toy-button bg-lagoon px-5 py-3 font-extrabold text-white" onClick={onAction}>
            {action}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CityMap({
  hasProfile,
  unlockedZoneIds,
  completedQuestIds,
  onSection,
  onUnlock
}: {
  hasProfile: boolean;
  unlockedZoneIds: Set<number>;
  completedQuestIds: Set<number>;
  onSection: (section: Section) => void;
  onUnlock: (zoneId: number) => void;
}) {
  const route: Record<number, Section> = {
    0: "gate",
    3: "academy",
    4: "rally",
    5: "badges",
    6: "quests",
    7: "leaderboard"
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="soft-panel relative overflow-hidden rounded-[32px] p-5 sm:p-7">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.65),rgba(233,249,255,0.22))]" />
        <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-4xl font-bold">Arcynite City Map</h2>
            <p className="mt-2 max-w-2xl font-semibold text-ink/62">A cleaner city board for profile creation, Arc lessons, rally play, badges, and rankings.</p>
          </div>
          <div className="rounded-2xl bg-ink px-4 py-3 text-sm font-extrabold text-white">9 zones</div>
        </div>
        <div className="relative mb-5 overflow-hidden rounded-[32px] bg-gradient-to-br from-mint/70 via-skyglass to-sun/60 p-5 shadow-inner">
          <div className="absolute inset-x-10 bottom-5 h-10 rounded-full bg-ink/10 blur-xl" />
          <div className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {zones.slice(0, 8).map((zone, index) => {
              const Icon = zone.icon;
              const completed = completedQuestIds.has(zone.id) || (zone.id === 0 && hasProfile);
              return (
                <motion.button
                  key={zone.id}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => onSection(route[zone.id] ?? "quests")}
                  className={`relative min-h-28 rounded-[26px] border-2 p-3 text-left shadow-soft ${
                    completed ? "border-mint bg-white" : "border-white/70 bg-white/72"
                  }`}
                >
                  <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4 + index * 0.12, repeat: Infinity }} className="grid size-11 place-items-center rounded-2xl bg-lagoon text-white">
                    <Icon className="size-5" />
                  </motion.span>
                  <p className="mt-3 font-display text-base font-bold leading-tight">{zone.name}</p>
                  <span className={`absolute right-3 top-3 size-3 rounded-full ${completed ? "bg-mint" : "bg-sun"}`} />
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => {
            const Icon = zone.icon;
            const isUnlocked = zone.id === 0 || unlockedZoneIds.has(zone.id) || zone.state === "unlocked" || hasProfile;
            const completed = completedQuestIds.has(zone.id) || (zone.id === 0 && hasProfile);
            const coming = zone.state === "coming";
            return (
              <motion.div
                whileHover={{ y: -5 }}
                key={zone.id}
                className={`group rounded-[24px] border p-4 shadow-[0_10px_30px_rgba(38,50,75,0.08)] transition ${
                  coming
                    ? "border-dashed border-ink/15 bg-white/48"
                    : completed
                      ? "border-mint/70 bg-white"
                      : isUnlocked
                        ? "border-white/80 bg-white/82"
                        : "border-ink/10 bg-white/48 opacity-70"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-skyglass text-lagoon ring-1 ring-lagoon/10">
                    <Icon className="size-6" />
                  </span>
                  <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-extrabold text-ink/62">
                    {coming ? "Coming soon" : completed ? "Completed" : isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold">{zone.name}</h3>
                <p className="mt-2 min-h-20 text-sm font-semibold leading-6 text-ink/58">{zone.text}</p>
                <button
                  className="mt-4 flex w-full items-center justify-between rounded-2xl bg-lagoon px-4 py-3 text-sm font-extrabold text-white transition group-hover:bg-ink disabled:bg-ink/20"
                  disabled={coming}
                  onClick={() => {
                    if (!isUnlocked) onUnlock(zone.id);
                    else onSection(route[zone.id] ?? "quests");
                  }}
                >
                  <span>{isUnlocked ? zone.action : "Unlock zone"}</span>
                  <ChevronRight className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="soft-panel rounded-[28px] p-5">
          <h3 className="font-display text-2xl font-bold">Factions</h3>
          <div className="mt-4 space-y-3">
            {factions.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/65 p-4 ring-1 ring-ink/5">
                <div className="flex items-center gap-3">
                  <span className={`rounded-xl bg-gradient-to-br ${item.color} px-3 py-2 text-xs font-extrabold text-white`}>{item.icon}</span>
                  <span className="font-display text-lg font-bold">{item.name}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="soft-panel rounded-[28px] p-5">
          <h3 className="font-display text-2xl font-bold">Arc ritual</h3>
          <button className="mt-4 w-full rounded-2xl bg-coral px-5 py-3 font-extrabold text-white shadow-soft transition hover:bg-ink" onClick={() => onSection("quests")}>
            Open Command Board
          </button>
        </div>
      </div>
    </div>
  );
}

function FlockGate({
  username,
  setUsername,
  faction,
  setFaction,
  citizen,
  connectedToArc,
  pending,
  onCreate
}: {
  username: string;
  setUsername: (value: string) => void;
  faction: number;
  setFaction: (value: number) => void;
  citizen: ReturnType<typeof normalizeCitizen>;
  connectedToArc: boolean;
  pending: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="soft-panel rounded-[34px] p-6">
        <h2 className="font-display text-4xl font-bold">Flock Gate</h2>
        <p className="mt-2 font-semibold leading-7 text-ink/65">Create an onchain citizen profile, choose a faction, and unlock the bright center of Arcynite City.</p>
        {citizen.exists ? (
          <div className="mt-6 rounded-3xl bg-mint/30 p-5">
            <CheckCircle2 className="mb-3 size-8 text-emerald-600" />
            <h3 className="font-display text-2xl font-bold">{citizen.username}</h3>
            <p className="font-bold text-ink/65">Level {citizen.level} citizen in {factions[citizen.faction]?.name ?? factions[0].name}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-extrabold text-ink/65">Citizen username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="SunnyArc"
                className="mt-2 w-full rounded-3xl border-2 border-white bg-white/85 px-5 py-4 font-bold outline-none focus:border-lagoon"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {factions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFaction(item.id)}
                  className={`rounded-3xl border-2 p-4 text-left shadow-soft transition ${
                    faction === item.id ? "border-lagoon bg-white" : "border-white/70 bg-white/65"
                  }`}
                >
                  <span className={`inline-block rounded-2xl bg-gradient-to-br ${item.color} px-3 py-2 text-xs font-extrabold text-white`}>{item.icon}</span>
                  <h3 className="mt-3 font-display text-xl font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink/60">{item.description}</p>
                </button>
              ))}
            </div>
            <button className="toy-button w-full bg-coral px-5 py-4 font-extrabold text-white disabled:opacity-60" onClick={onCreate} disabled={!connectedToArc || pending}>
              {pending ? "Creating..." : "Create Citizen on Arc"}
            </button>
          </div>
        )}
      </div>
      <div className="soft-panel rounded-[34px] p-6">
        <h3 className="font-display text-3xl font-bold">Gate preview</h3>
        <div className="mt-6 rounded-[30px] bg-gradient-to-br from-white via-skyglass to-mint/45 p-6 shadow-inner">
          <ArcyniteMark />
          <div className="mt-6 grid gap-3">
            {["Choose faction", "Create citizen", "Enter city"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 font-extrabold text-ink/70">
                <span className="grid size-8 place-items-center rounded-full bg-lagoon text-sm text-white">{index + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentAcademy({
  agent,
  faction,
  owner,
  name,
  role,
  setName,
  setRole,
  pending,
  onCreate
}: {
  agent: ReturnType<typeof normalizeAgent>;
  faction: string;
  owner: string;
  name: string;
  role: (typeof roles)[number];
  setName: (value: string) => void;
  setRole: (value: (typeof roles)[number]) => void;
  pending: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="soft-panel rounded-[34px] p-6">
        <h2 className="font-display text-4xl font-bold">Agent Academy</h2>
        <p className="mt-2 font-semibold text-ink/65">Create a simple AI agent profile that travels with your faction through Arcynite.</p>
        <div className="mt-6 space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Agent name" className="w-full rounded-3xl border-2 border-white bg-white px-5 py-4 font-bold outline-none focus:border-lagoon" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {roles.map((item) => (
              <button key={item} className={`rounded-2xl px-4 py-3 font-extrabold ${role === item ? "bg-ink text-white" : "bg-white text-ink"}`} onClick={() => setRole(item)}>
                {item}
              </button>
            ))}
          </div>
          <button className="toy-button w-full bg-lagoon px-5 py-4 font-extrabold text-white" onClick={onCreate} disabled={pending}>
            {pending ? "Creating..." : "Create Agent"}
          </button>
        </div>
      </div>
      <div className="soft-panel rounded-[34px] p-6">
        <h3 className="font-display text-3xl font-bold">Agent card</h3>
        <div className="mt-6 rounded-[32px] bg-gradient-to-br from-lilac/70 via-white to-mint/60 p-6 shadow-soft">
          <Bot className="size-14 text-lagoon" />
          <h4 className="mt-4 font-display text-3xl font-bold">{agent.created ? agent.name : name || "Arcynite Agent"}</h4>
          <p className="font-extrabold text-ink/65">{agent.created ? agent.role : role}</p>
          <div className="mt-5 grid gap-2 text-sm font-bold text-ink/65">
            <span>Faction {faction}</span>
            <span>Owner {owner}</span>
            <span>Status {agent.created ? "Created onchain" : "Draft profile"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestCenter({
  completedQuestIds,
  claimedBadgeIds,
  pending,
  hasProfile,
  hasAgent,
  localRallyRun,
  scoreSubmitted,
  lessonProgress,
  onLessonStep,
  onComplete,
  onGM
}: {
  completedQuestIds: Set<number>;
  claimedBadgeIds: Set<number>;
  pending: boolean;
  hasProfile: boolean;
  hasAgent: boolean;
  localRallyRun: boolean;
  scoreSubmitted: boolean;
  lessonProgress: Record<number, number>;
  onLessonStep: (questId: number, step: number) => void;
  onComplete: (questId: number) => void;
  onGM: () => void;
}) {
  const requirement = (questId: number) => {
    if (questId === 0) return { ready: hasProfile, text: "Create your profile at Flock Gate first." };
    if (questId === 6) return { ready: hasAgent, text: "Create an agent in Agent Academy first." };
    if (questId === 7) return { ready: localRallyRun, text: "Play one local rally run first." };
    if (questId === 8) return { ready: scoreSubmitted, text: "Submit a valid rally score first." };
    if (questId === 9) return { ready: claimedBadgeIds.size > 0, text: "Claim at least one badge first." };
    if (questId === 10) return { ready: hasProfile && (scoreSubmitted || claimedBadgeIds.size > 0), text: "Finish the beginner loop first." };
    return { ready: true, text: "" };
  };

  return (
    <div className="soft-panel overflow-hidden rounded-[34px] p-6">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold">Command Board</h2>
          <p className="mt-2 max-w-3xl font-semibold text-ink/65">Follow the Arcynite learning trail first. Each card teaches an Arc Testnet concept before the onchain completion button unlocks.</p>
        </div>
        <button className="toy-button bg-sun px-5 py-3 font-extrabold text-ink" onClick={onGM} disabled={pending}>
          <Send className="mr-2 inline size-4" />
          Send GM
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {quests.map((quest) => {
          const completed = completedQuestIds.has(quest.id);
          const step = lessonProgress[quest.id] ?? 0;
          const lessonReady = step > quest.steps.length;
          const currentStep = quest.steps[Math.max(0, Math.min(step - 1, quest.steps.length - 1))];
          const gate = requirement(quest.id);
          const canComplete = lessonReady && gate.ready && !completed;
          const actionText =
            completed
              ? "Completed"
              : step === 0
                ? "Start lesson"
                : step < quest.steps.length
                  ? "Next"
                  : step === quest.steps.length
                    ? "Mark lesson ready"
                    : gate.ready
                      ? "Complete on Arc"
                      : quest.actionLabel;
          return (
            <motion.div
              key={quest.id}
              whileHover={{ y: -4 }}
              className={`relative overflow-hidden rounded-[30px] border-2 p-5 shadow-soft ${
                completed ? "border-mint bg-mint/24" : lessonReady ? "border-sun/80 bg-white/86" : "border-white bg-white/72"
              }`}
            >
              <div className="absolute -right-8 -top-8 size-24 rounded-full bg-skyglass/70" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-lagoon">{quest.zone}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold">{quest.title}</h3>
                </div>
                <span className="ribbon shrink-0 px-3 py-1 text-xs font-extrabold">{quest.xp} XP</span>
              </div>
              <p className="relative mt-2 text-sm font-semibold text-ink/62">{quest.story}</p>
              <div className="relative mt-4 rounded-3xl bg-skyglass/50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-ink/45">Arc concept</p>
                <p className="mt-1 text-sm font-bold leading-6 text-ink/68">{quest.concept}</p>
              </div>
              <div className="relative mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl bg-white/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink/45">What you learn</p>
                  <div className="mt-3 space-y-2">
                    {quest.learn.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm font-bold text-ink/66">
                        <Sparkles className="mt-0.5 size-4 shrink-0 text-lagoon" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink/45">Lesson steps</p>
                  <div className="mt-3 space-y-2">
                    {quest.steps.map((item, index) => {
                      const active = step === index + 1;
                      const done = step > index + 1;
                      return (
                        <div key={item} className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold ${done ? "bg-mint/35 text-ink" : active ? "bg-sun/45 text-ink" : "bg-ink/5 text-ink/50"}`}>
                          <span className="grid size-6 place-items-center rounded-full bg-white text-xs">{done ? "✓" : index + 1}</span>
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {!gate.ready && lessonReady && !completed ? <p className="relative mt-4 rounded-2xl bg-coral/12 px-4 py-3 text-sm font-extrabold text-coral">{gate.text}</p> : null}
              {step > 0 && !lessonReady ? <p className="relative mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-ink/62">Current step: {currentStep}</p> : null}
              <button
                className="toy-button relative mt-4 w-full bg-lagoon px-4 py-3 text-sm font-extrabold text-white disabled:bg-ink/20"
                disabled={completed || pending || (lessonReady && !gate.ready)}
                onClick={() => {
                  if (step === 0) onLessonStep(quest.id, 1);
                  else if (step < quest.steps.length) onLessonStep(quest.id, step + 1);
                  else if (step === quest.steps.length) onLessonStep(quest.id, quest.steps.length + 1);
                  else if (canComplete) onComplete(quest.id);
                }}
              >
                {actionText}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeNest({
  claimedBadgeIds,
  claimableBadgeIds,
  pending,
  onClaim
}: {
  claimedBadgeIds: Set<number>;
  claimableBadgeIds: Set<number>;
  pending: boolean;
  onClaim: (badgeId: number) => void;
}) {
  return (
    <div className="soft-panel rounded-[34px] p-6">
      <h2 className="font-display text-4xl font-bold">Badge Nest</h2>
      <p className="mt-2 font-semibold text-ink/65">Claim colorful testnet achievements as your onboarding journey grows.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((badge) => {
          const Icon = badge.icon;
          const claimed = claimedBadgeIds.has(badge.id);
          const claimable = claimableBadgeIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -5 }}
              className={`rounded-[30px] border-2 p-5 text-center shadow-soft ${claimed ? "border-sun bg-sun/25" : claimable ? "border-mint bg-white" : "border-white bg-white/60"}`}
            >
              <div className={`mx-auto flex size-20 items-center justify-center rounded-[28px] ${claimed ? "bg-sun text-ink" : claimable ? "bg-mint text-ink" : "bg-ink/10 text-ink/40"}`}>
                <Icon className="size-9" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{badge.name}</h3>
              <p className="mt-2 min-h-12 text-sm font-semibold text-ink/60">{badge.description}</p>
              <button className="toy-button mt-4 w-full bg-coral px-4 py-3 text-sm font-extrabold text-white disabled:bg-ink/20" disabled={!claimable || claimed || pending} onClick={() => onClaim(badge.id)}>
                {claimed ? "Claimed" : claimable ? "Claim Badge" : "Locked"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard({
  leaderboard,
  factionStats
}: {
  leaderboard: typeof fallbackLeaderboard;
  factionStats: ReturnType<typeof normalizeFactionStats>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="soft-panel rounded-[34px] p-6">
        <h2 className="font-display text-4xl font-bold">Leaderboard Tower</h2>
        <div className="mt-6 overflow-hidden rounded-[28px] border-2 border-white bg-white/80">
          {leaderboard.map((row, index) => (
            <div key={`${row.user}-${index}`} className="grid grid-cols-[60px_1fr_110px] items-center gap-3 border-b border-ink/5 px-4 py-4 last:border-b-0 sm:grid-cols-[70px_1fr_160px_110px]">
              <span className="font-display text-2xl font-bold">#{index + 1}</span>
              <div>
                <p className="font-display text-xl font-bold">{row.username}</p>
                <p className="text-sm font-bold text-ink/55">{shortAddress(row.user)} · {factions[row.faction]?.name ?? factions[0].name}</p>
              </div>
              <span className="hidden font-extrabold text-ink/65 sm:block">Level {row.level}</span>
              <span className="rounded-full bg-sun/50 px-3 py-2 text-center text-sm font-extrabold">{formatNumber(row.highScore)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="soft-panel rounded-[34px] p-6">
        <h3 className="font-display text-3xl font-bold">Faction stats</h3>
        <div className="mt-5 space-y-3">
          {factions.map((item) => {
            const stats = factionStats[item.id];
            return (
              <div key={item.id} className="rounded-3xl bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-xl font-bold">{item.name}</span>
                  <span className={`rounded-2xl bg-gradient-to-br ${item.color} px-3 py-1 text-xs font-extrabold text-white`}>{item.icon}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-ink/62">
                  <span>XP {formatNumber(stats.xp)}</span>
                  <span>Score {formatNumber(stats.score)}</span>
                  <span>Members {formatNumber(stats.members)}</span>
                  <span>Runs {formatNumber(stats.runs)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Profile({
  address,
  citizen,
  progress,
  gameStats,
  userSummary,
  agent,
  factionName
}: {
  address?: `0x${string}`;
  citizen: ReturnType<typeof normalizeCitizen>;
  progress: ReturnType<typeof normalizeProgress>;
  gameStats: ReturnType<typeof normalizeGameStats>;
  userSummary: UserSummary;
  agent: ReturnType<typeof normalizeAgent>;
  factionName: string;
}) {
  const stats = [
    ["Wallet", shortAddress(address)],
    ["Faction", factionName],
    ["XP", formatNumber(userSummary.xp || citizen.xp)],
    ["Level", formatNumber(userSummary.level || citizen.level)],
    ["GM streak", formatNumber(citizen.gmStreak)],
    ["High score", formatNumber(userSummary.highScore || gameStats.highScore)],
    ["Total score", formatNumber(gameStats.totalScore)],
    ["Total runs", formatNumber(gameStats.totalRuns)],
    ["Best flock", formatNumber(gameStats.bestFlockSize)],
    ["Total coins", formatNumber(gameStats.totalCoins)],
    ["Quests completed", formatNumber(userSummary.questsCompleted || progress.questsCompleted)],
    ["Badges claimed", formatNumber(userSummary.badgesClaimed || progress.badgesClaimed)],
    ["Zones unlocked", formatNumber(progress.zonesUnlocked)],
    ["Agent Created", agent.created ? "1" : "0"],
    ["Agent timestamp", agent.createdAt ? formatNumber(agent.createdAt) : "Not created"],
    ["Agent", agent.created ? `${agent.name} · ${agent.role}` : "Not created"]
  ];

  return (
    <div className="soft-panel rounded-[34px] p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ArcyniteMark compact />
        <div>
          <h2 className="font-display text-4xl font-bold">{citizen.exists ? citizen.username : "Arcynite Citizen"}</h2>
          <p className="mt-1 font-semibold text-ink/65">Your onchain citizen summary and rally progress.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white/75 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink/45">{label}</p>
            <p className="mt-1 break-words font-display text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

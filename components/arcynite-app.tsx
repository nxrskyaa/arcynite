"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Loader2, LogOut, Play, Trophy, Wallet, WifiOff } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { ArcFlockRally, type RallyResult } from "@/components/game/arc-flock-rally";
import { arcExplorer, arcTestnet, arcyniteContractAddress, shortAddress, txUrl } from "@/lib/arc";
import { arcyniteQuestAbi } from "@/lib/contract";
import { factions } from "@/lib/metadata";
import { normalizeCitizen, normalizeGameStats, normalizeLeaderboard, normalizeUserSummary } from "@/lib/normalize";

type TxState = {
  label: string;
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  error?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function decodeTxError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  console.error(error);
  if (message.includes("NO_CITIZEN")) return "Create your Arcynite profile first";
  if (message.includes("INVALID_SCORE")) return "Score must be greater than 0";
  if (message.includes("INVALID_FLOCK_SIZE")) return "Flock size must be greater than 0";
  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) return "Transaction rejected";
  if (lower.includes("chain")) return "Switch to Arc Testnet";
  return message || "Transaction failed";
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative shrink-0 ${compact ? "size-12" : "h-24 w-44 sm:h-28 sm:w-56"}`}>
      <Image src="/brand/arcynite-logo.png" alt="Arcynite" fill priority={!compact} sizes={compact ? "48px" : "224px"} className="object-contain object-left drop-shadow-[0_14px_24px_rgba(38,50,75,0.16)]" />
    </div>
  );
}

function HeroArt() {
  const pads = [
    { className: "left-[11%] top-[44%] bg-coral", label: "Profile" },
    { className: "left-[33%] top-[25%] bg-lagoon", label: "Play" },
    { className: "left-[55%] top-[38%] bg-lilac", label: "Submit" },
    { className: "right-[10%] top-[50%] bg-sun", label: "Rank" }
  ];
  return (
    <div className="relative mx-auto aspect-[1.15/1] w-full max-w-[620px]">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-x-10 bottom-8 h-20 rounded-full bg-ink/10 blur-2xl" />
      <div className="absolute inset-4 rounded-[46px] bg-gradient-to-br from-mint via-skyglass to-sun/80 shadow-toy [transform:rotateX(58deg)_rotateZ(-35deg)]" />
      <div className="absolute left-[20%] top-[58%] h-4 w-[54%] -rotate-12 rounded-full bg-white/75 shadow-soft" />
      <div className="absolute left-[36%] top-[39%] h-4 w-[40%] rotate-[18deg] rounded-full bg-white/65 shadow-soft" />
      {pads.map((pad, index) => (
        <motion.div key={pad.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: [0, -5, 0] }} transition={{ delay: index * 0.12, duration: 3 + index * 0.2, repeat: Infinity, repeatType: "mirror" }} className={`absolute h-28 w-24 rounded-[26px] border-4 border-white/80 shadow-soft ${pad.className}`}>
          <div className="mx-auto mt-[-18px] h-11 w-14 rounded-t-full bg-white/85" />
          <div className="mx-auto mt-5 grid w-12 grid-cols-2 gap-2">
            <span className="h-3 rounded-full bg-white/65" />
            <span className="h-3 rounded-full bg-white/65" />
            <span className="h-3 rounded-full bg-white/65" />
            <span className="h-3 rounded-full bg-white/65" />
          </div>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-ink shadow-soft">{pad.label}</span>
        </motion.div>
      ))}
      <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute left-[43%] top-[9%] grid size-24 place-items-center rounded-full bg-white/90 shadow-soft">
        <Play className="size-10 fill-lagoon text-lagoon" />
      </motion.div>
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
  const connectedToArc = isConnected && chainId === arcTestnet.id;
  const contract = { address: arcyniteContractAddress, abi: arcyniteQuestAbi, chainId: arcTestnet.id } as const;
  const [tx, setTx] = useState<TxState>({ label: "", status: "idle" });
  const [username, setUsername] = useState("");
  const [faction, setFaction] = useState(0);

  const citizenRead = useReadContract({ ...contract, functionName: "getCitizen", args: address ? [address] : undefined, query: { enabled: Boolean(address) } });
  const gameStatsRead = useReadContract({ ...contract, functionName: "getGameStats", args: address ? [address] : undefined, query: { enabled: Boolean(address) } });
  const summaryRead = useReadContract({ ...contract, functionName: "getUserSummary", args: address ? [address] : undefined, query: { enabled: Boolean(address) } });
  const leaderboardRead = useReadContract({ ...contract, functionName: "getLeaderboard", query: { enabled: connectedToArc } });

  const citizen = normalizeCitizen(citizenRead.data);
  const stats = normalizeGameStats(gameStatsRead.data);
  const summary = normalizeUserSummary(summaryRead.data);
  const leaderboard = normalizeLeaderboard(leaderboardRead.data);
  const currentFaction = factions[citizen.faction] ?? factions[faction] ?? factions[0];
  const txLink = tx.hash ? txUrl(tx.hash) : undefined;
  const usernameValid = username.trim().length >= 3 && username.trim().length <= 24;
  const submitDisabledReason = !isConnected
    ? "Connect wallet to submit your score"
    : !connectedToArc
      ? "Switch to Arc Testnet"
      : !citizen.exists
        ? "Create profile before submitting score"
        : tx.status === "pending"
          ? "Transaction pending"
          : undefined;

  async function refreshProfile() {
    await Promise.allSettled([citizenRead.refetch(), gameStatsRead.refetch(), summaryRead.refetch()]);
  }

  async function connectWallet() {
    const connector = connectors[0];
    if (!connector) return;
    await connectAsync({ connector, chainId: arcTestnet.id });
  }

  async function switchToArc() {
    await switchChainAsync({ chainId: arcTestnet.id });
  }

  async function createProfile() {
    if (!isConnected) {
      setTx({ label: "Create profile", status: "error", error: "Connect wallet first" });
      return;
    }
    if (!connectedToArc) {
      setTx({ label: "Create profile", status: "error", error: "Switch to Arc Testnet" });
      return;
    }
    if (!usernameValid) {
      setTx({ label: "Create profile", status: "error", error: "Username must be 3-24 characters" });
      return;
    }
    try {
      setTx({ label: "Create profile", status: "pending" });
      const hash = await writeContractAsync({ ...contract, functionName: "createCitizen", args: [username.trim(), faction] });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setTx({ label: "Create profile", status: "success", hash });
      await refreshProfile();
    } catch (error) {
      setTx({ label: "Create profile", status: "error", error: decodeTxError(error) });
    }
  }

  async function submitFlockScoreOnchain(result: RallyResult) {
    const finalScore = Math.floor(result.score);
    const finalFlockSize = Math.floor(result.flockSize);
    const coinsCollected = Math.floor(result.coins);
    const args = [BigInt(finalScore), finalFlockSize, coinsCollected] as const;
    console.log({ finalScore, finalFlockSize, coinsCollected, args: [args[0].toString(), args[1], args[2]] });
    if (submitDisabledReason) {
      setTx({ label: "Submit score", status: "error", error: submitDisabledReason });
      return false;
    }
    if (!Number.isInteger(finalScore) || finalScore <= 0) {
      setTx({ label: "Submit score", status: "error", error: "Score must be greater than 0" });
      return false;
    }
    if (!Number.isInteger(finalFlockSize) || finalFlockSize <= 0) {
      setTx({ label: "Submit score", status: "error", error: "Flock size must be greater than 0" });
      return false;
    }
    if (!Number.isInteger(coinsCollected) || coinsCollected < 0) {
      setTx({ label: "Submit score", status: "error", error: "Coins must be a valid integer" });
      return false;
    }
    try {
      setTx({ label: "Submit score", status: "pending" });
      const hash = await writeContractAsync({ ...contract, functionName: "submitFlockScore", args });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setTx({ label: "Submit score", status: "success", hash });
      await Promise.allSettled([gameStatsRead.refetch(), summaryRead.refetch(), leaderboardRead.refetch()]);
      return true;
    } catch (error) {
      setTx({ label: "Submit score", status: "error", error: decodeTxError(error) });
      return false;
    }
  }

  const leaderboardRows = useMemo(
    () => leaderboard.map((row) => ({ ...row, isCurrent: Boolean(address && row.user.toLowerCase() === address.toLowerCase()) })),
    [address, leaderboard]
  );

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <motion.nav initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[30px] border border-white/80 bg-white/78 p-3 shadow-soft backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Logo compact />
          <div>
            <p className="font-display text-xl font-bold leading-none text-ink">Arcynite</p>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-lagoon">Arc Flock Rally</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`hidden rounded-full px-3 py-2 text-xs font-extrabold sm:inline-flex ${connectedToArc ? "bg-mint/45 text-ink" : "bg-sun/50 text-ink"}`}>{connectedToArc ? "Arc Testnet" : isConnected ? "Wrong chain" : "Not connected"}</span>
          {isConnected ? (
            <>
              <span className="rounded-full bg-white px-3 py-2 text-sm font-extrabold text-ink shadow-[inset_0_0_0_1px_rgba(38,50,75,0.08)]">{shortAddress(address)}</span>
              <button aria-label="Disconnect wallet" className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1px_rgba(38,50,75,0.08)]" onClick={() => disconnect()}>
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <button className="toy-button bg-lagoon px-5 py-3 text-sm font-extrabold text-white" onClick={connectWallet} disabled={connecting}>
              <Wallet className="mr-2 inline size-4" />
              {connecting ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </motion.nav>

      <section className="mx-auto grid max-w-7xl items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
          <Logo />
          <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.96] text-ink sm:text-7xl">Play. Grow your flock. Rise on Arc Testnet.</h1>
          <p className="mt-5 max-w-xl text-lg font-bold leading-8 text-ink/68">A cozy onchain mini game where every run is instant, and only your final score goes to Arc.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!isConnected ? (
              <button className="toy-button bg-coral px-6 py-4 font-extrabold text-white" onClick={connectWallet}>
                Connect Wallet to Play Arcynite
              </button>
            ) : !connectedToArc ? (
              <button className="toy-button bg-sun px-6 py-4 font-extrabold text-ink" onClick={switchToArc} disabled={switching}>
                {switching ? "Switching..." : "Switch to Arc Testnet"}
              </button>
            ) : (
              <a className="toy-button bg-lagoon px-6 py-4 font-extrabold text-white" href="#rally">Play Arc Flock Rally</a>
            )}
            <a className="toy-button bg-white px-6 py-4 font-extrabold text-ink" href={arcExplorer} target="_blank">
              Arcscan <ExternalLink className="ml-2 inline size-4" />
            </a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[42px] bg-white/45 p-4 shadow-[0_30px_80px_rgba(38,50,75,0.1)] ring-1 ring-white/70">
          <HeroArt />
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 pb-16 lg:grid-cols-[300px_minmax(520px,1fr)_300px]">
        <ProfilePanel
          isConnected={isConnected}
          connectedToArc={connectedToArc}
          address={address}
          username={username}
          setUsername={setUsername}
          faction={faction}
          setFaction={setFaction}
          citizen={citizen}
          stats={stats}
          summary={summary}
          pending={tx.status === "pending"}
          usernameValid={usernameValid}
          onCreate={createProfile}
          onSwitch={switchToArc}
        />
        <section id="rally">
          <ArcFlockRally
            factionAccent={currentFaction.accent}
            onSubmit={submitFlockScoreOnchain}
            submitting={tx.status === "pending"}
            submitDisabledReason={submitDisabledReason}
            lastTxUrl={txLink}
          />
          <TxPanel tx={tx} txLink={txLink} />
        </section>
        <LeaderboardPanel rows={leaderboardRows} currentAddress={address} />
      </section>
    </main>
  );
}

function TxPanel({ tx, txLink }: { tx: TxState; txLink?: string }) {
  if (tx.status === "idle") return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-[26px] border border-white/80 bg-white/78 p-4 shadow-soft">
      {tx.status === "pending" ? <p className="font-extrabold text-lagoon"><Loader2 className="mr-2 inline size-4 animate-spin" />{tx.label} pending</p> : null}
      {tx.status === "success" ? (
        <a className="font-extrabold text-emerald-600 underline" href={txLink} target="_blank">
          {tx.label} confirmed on Arcscan
        </a>
      ) : null}
      {tx.status === "error" ? <p className="font-extrabold text-coral">{tx.error}</p> : null}
    </motion.div>
  );
}

function ProfilePanel({
  isConnected,
  connectedToArc,
  address,
  username,
  setUsername,
  faction,
  setFaction,
  citizen,
  stats,
  summary,
  pending,
  usernameValid,
  onCreate,
  onSwitch
}: {
  isConnected: boolean;
  connectedToArc: boolean;
  address?: `0x${string}`;
  username: string;
  setUsername: (value: string) => void;
  faction: number;
  setFaction: (value: number) => void;
  citizen: ReturnType<typeof normalizeCitizen>;
  stats: ReturnType<typeof normalizeGameStats>;
  summary: ReturnType<typeof normalizeUserSummary>;
  pending: boolean;
  usernameValid: boolean;
  onCreate: () => void;
  onSwitch: () => void;
}) {
  const selectedFaction = factions[citizen.exists ? citizen.faction : faction] ?? factions[0];
  return (
    <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="soft-panel rounded-[34px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-lagoon">Player</p>
          <h2 className="font-display text-3xl font-bold">{citizen.exists ? citizen.username : "Create Profile"}</h2>
        </div>
        <span className={`rounded-2xl bg-gradient-to-br ${selectedFaction.color} px-3 py-2 text-xs font-extrabold text-white`}>{selectedFaction.icon}</span>
      </div>
      {!isConnected ? (
        <div className="mt-6 rounded-3xl bg-white/70 p-4 text-sm font-bold text-ink/65">
          <WifiOff className="mb-2 size-7 text-coral" />
          Connect Wallet to Play Arcynite.
        </div>
      ) : !connectedToArc ? (
        <button className="toy-button mt-6 w-full bg-sun px-5 py-4 font-extrabold text-ink" onClick={onSwitch}>
          Switch to Arc Testnet
        </button>
      ) : citizen.exists ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white/72 p-4">
            <CheckCircle2 className="mb-2 size-7 text-emerald-600" />
            <p className="font-display text-2xl font-bold">{summary.username || citizen.username}</p>
            <p className="text-sm font-bold text-ink/58">{selectedFaction.name} - {shortAddress(address)}</p>
          </div>
          {[
            ["High score", formatNumber(summary.highScore || stats.highScore)],
            ["Total runs", formatNumber(stats.totalRuns)],
            ["Total score", formatNumber(stats.totalScore)],
            ["Best flock", formatNumber(stats.bestFlockSize)],
            ["Total coins", formatNumber(stats.totalCoins)]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-white/65 px-4 py-3 text-sm font-extrabold">
              <span className="text-ink/55">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-extrabold text-ink/60">Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="SunnyArc" className="mt-2 w-full rounded-3xl border-2 border-white bg-white/85 px-5 py-4 font-bold outline-none focus:border-lagoon" />
          </label>
          <div className="grid gap-3">
            {factions.map((item) => (
              <button key={item.id} onClick={() => setFaction(item.id)} className={`rounded-3xl border-2 p-4 text-left transition ${faction === item.id ? "border-lagoon bg-white shadow-soft" : "border-white/70 bg-white/58"}`}>
                <div className="flex items-center gap-3">
                  <span className={`rounded-2xl bg-gradient-to-br ${item.color} px-3 py-2 text-xs font-extrabold text-white`}>{item.icon}</span>
                  <span className="font-display text-xl font-bold">{item.name}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink/58">{item.description}</p>
              </button>
            ))}
          </div>
          <button className="toy-button w-full bg-coral px-5 py-4 font-extrabold text-white disabled:opacity-55" onClick={onCreate} disabled={pending || !usernameValid}>
            {pending ? "Creating..." : "Create Profile"}
          </button>
          {!usernameValid && username.length > 0 ? <p className="text-sm font-extrabold text-coral">Username must be 3-24 characters.</p> : null}
        </div>
      )}
    </motion.aside>
  );
}

function LeaderboardPanel({
  rows,
  currentAddress
}: {
  rows: Array<{ user: string; username: string; faction: number; highScore: number; level: number; demo?: boolean; isCurrent?: boolean }>;
  currentAddress?: string;
}) {
  return (
    <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="soft-panel rounded-[34px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-lagoon">Leaderboard</p>
          <h2 className="font-display text-3xl font-bold">Top Flocks</h2>
        </div>
        <Trophy className="size-8 text-sun" />
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((row, index) => {
          const faction = factions[row.faction] ?? factions[0];
          return (
            <motion.div
              key={`${row.user}-${index}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`rounded-3xl border p-4 ${row.isCurrent ? "border-lagoon bg-mint/22" : "border-white/70 bg-white/68"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-ink font-display text-lg font-bold text-white">#{index + 1}</span>
                  <div>
                    <p className="font-display text-lg font-bold">{row.username}</p>
                    <p className="text-xs font-bold text-ink/52">{shortAddress(row.user)} {currentAddress && row.isCurrent ? "- You" : ""}</p>
                  </div>
                </div>
                <span className={`rounded-xl bg-gradient-to-br ${faction.color} px-2 py-1 text-[10px] font-extrabold text-white`}>{faction.icon}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-extrabold text-ink/62">
                <span>Level {row.level}</span>
                <span>{formatNumber(row.highScore)} pts</span>
              </div>
              {row.demo ? <p className="mt-2 text-xs font-extrabold text-ink/38">Demo row until onchain leaderboard has entries</p> : null}
            </motion.div>
          );
        })}
      </div>
    </motion.aside>
  );
}

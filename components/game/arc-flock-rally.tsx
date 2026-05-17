"use client";

import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Send } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type RallyResult = {
  score: number;
  flockSize: number;
  coins: number;
  combo: number;
  survivalTime: number;
};

type EntityKind =
  | "citizen"
  | "coin"
  | "crystal"
  | "core"
  | "shard"
  | "gas"
  | "bot"
  | "cloud"
  | "crate"
  | "bridge";

type Entity = {
  id: number;
  lane: number;
  y: number;
  kind: EntityKind;
};

const collectibles: EntityKind[] = ["citizen", "coin", "crystal", "core", "shard"];
const hazards: EntityKind[] = ["gas", "bot", "cloud", "crate", "bridge"];

const spriteIndex: Record<EntityKind | "leader", number> = {
  leader: 0,
  citizen: 1,
  coin: 6,
  crystal: 7,
  core: 8,
  shard: 9,
  gas: 10,
  bot: 11,
  cloud: 12,
  crate: 14,
  bridge: 15
};

function laneToX(lane: number, width: number) {
  return width * (0.27 + lane * 0.23);
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement | null,
  index: number,
  x: number,
  y: number,
  size: number,
  fallback: string
) {
  if (sheet?.complete && sheet.naturalWidth > 0) {
    const cols = 6;
    const rows = 5;
    const cellW = sheet.naturalWidth / cols;
    const cellH = sheet.naturalHeight / rows;
    const sx = (index % cols) * cellW;
    const sy = Math.floor(index / cols) * cellH;
    ctx.drawImage(sheet, sx, sy, cellW, cellH, x - size / 2, y - size / 2, size, size);
    return;
  }

  ctx.fillStyle = fallback;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, size * 0.25);
  ctx.fill();
}

export function ArcFlockRally({
  onSubmit,
  submitting,
  lastTxUrl
}: {
  onSubmit: (result: RallyResult) => void;
  submitting: boolean;
  lastTxUrl?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const pointerStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lane, setLane] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [flockSize, setFlockSize] = useState(1);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(1);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [result, setResult] = useState<RallyResult | null>(null);
  const [history, setHistory] = useState<RallyResult[]>([]);

  useEffect(() => {
    const image = new window.Image();
    image.src = "/brand/flock-rally-sprites.png";
    sheetRef.current = image;

    const raw = window.localStorage.getItem("arcynite-rally-history");
    if (raw) setHistory(JSON.parse(raw) as RallyResult[]);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setLane(1);
    setTimeLeft(60);
    setScore(0);
    setFlockSize(1);
    setCoins(0);
    setCombo(1);
    setEntities([]);
    setResult(null);
  }, []);

  const start = useCallback(() => {
    reset();
    setRunning(true);
  }, [reset]);

  const finish = useCallback(
    (nextScore = score, nextFlock = flockSize, nextCoins = coins, nextCombo = combo, nextTimeLeft = timeLeft) => {
      const finalResult = {
        score: Math.max(0, Math.round(nextScore)),
        flockSize: Math.max(0, Math.round(nextFlock)),
        coins: Math.max(0, Math.round(nextCoins)),
        combo: Math.max(1, Math.round(nextCombo)),
        survivalTime: Math.round(60 - nextTimeLeft)
      };
      setRunning(false);
      setPaused(false);
      setResult(finalResult);
      setHistory((current) => {
        const next = [finalResult, ...current].slice(0, 8);
        window.localStorage.setItem("arcynite-rally-history", JSON.stringify(next));
        return next;
      });
    },
    [coins, combo, flockSize, score, timeLeft]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!running || paused) return;
      if (event.key === "ArrowLeft") setLane((value) => Math.max(0, value - 1));
      if (event.key === "ArrowRight") setLane((value) => Math.min(2, value + 1));
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, running]);

  useEffect(() => {
    if (!running || paused) return;

    let last = performance.now();
    let spawnClock = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      spawnClock += dt;

      setTimeLeft((value) => {
        const next = Math.max(0, value - dt);
        if (next <= 0) finish(score, flockSize, coins, combo, next);
        return next;
      });

      setEntities((current) => {
        let nextScore = score;
        let nextFlock = flockSize;
        let nextCoins = coins;
        let nextCombo = combo;
        let nextEntities = current
          .map((entity) => ({ ...entity, y: entity.y + (142 + nextCombo * 10) * dt }))
          .filter((entity) => entity.y < 620);

        if (spawnClock > 0.55) {
          spawnClock = 0;
          const kindPool = Math.random() > 0.35 ? collectibles : hazards;
          nextEntities = [
            ...nextEntities,
            {
              id: now + Math.random(),
              lane: Math.floor(Math.random() * 3),
              y: -40,
              kind: kindPool[Math.floor(Math.random() * kindPool.length)]
            }
          ];
        }

        nextEntities = nextEntities.filter((entity) => {
          const hit = entity.lane === lane && entity.y > 430 && entity.y < 520;
          if (!hit) return true;

          if (entity.kind === "citizen") {
            nextFlock += 1;
            nextScore += 120 * nextCombo;
          } else if (entity.kind === "coin") {
            nextCoins += 1;
            nextScore += 80 * nextCombo;
          } else if (entity.kind === "crystal") {
            nextScore += 300 * nextCombo;
          } else if (entity.kind === "core") {
            nextCombo = Math.min(9, nextCombo + 1);
            nextScore += 180 * nextCombo;
          } else if (entity.kind === "shard") {
            nextScore += 450 + nextFlock * 20;
          } else if (entity.kind === "gas") {
            nextScore -= 160;
            nextFlock -= 1;
          } else if (entity.kind === "bot") {
            nextFlock -= 2;
          } else if (entity.kind === "cloud") {
            nextCombo = Math.max(1, nextCombo - 1);
          } else if (entity.kind === "crate") {
            nextScore -= 220;
          } else {
            nextFlock -= 1;
            nextScore -= 100;
          }
          return false;
        });

        setScore(Math.max(0, nextScore));
        setFlockSize(Math.max(0, nextFlock));
        setCoins(nextCoins);
        setCombo(nextCombo);

        if (nextFlock <= 0) finish(nextScore, nextFlock, nextCoins, nextCombo);
        return nextEntities;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [coins, combo, finish, flockSize, lane, paused, running, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#dff8ff");
    sky.addColorStop(1, "#fff0c7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(123, 230, 178, 0.48)";
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.ellipse(70 + i * 76, 95 + ((i % 2) * 30), 58, 20, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 3; i += 1) {
      const x = laneToX(i, width);
      ctx.fillStyle = i === lane ? "rgba(255, 209, 102, 0.34)" : "rgba(255, 255, 255, 0.52)";
      ctx.beginPath();
      ctx.moveTo(x - 66, 100);
      ctx.lineTo(x + 76, 100);
      ctx.lineTo(x + 112, height);
      ctx.lineTo(x - 116, height);
      ctx.closePath();
      ctx.fill();
    }

    entities.forEach((entity) => {
      const x = laneToX(entity.lane, width);
      drawSprite(ctx, sheetRef.current, spriteIndex[entity.kind], x, entity.y, 74, hazards.includes(entity.kind) ? "#ff7b6b" : "#7be6b2");
    });

    const leaderX = laneToX(lane, width);
    ctx.fillStyle = "rgba(38, 50, 75, 0.16)";
    ctx.beginPath();
    ctx.ellipse(leaderX, 526, 64, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, sheetRef.current, spriteIndex.leader, leaderX, 480, 96, "#1bb7c9");
  }, [entities, lane]);

  const touchStart = (clientX: number) => {
    pointerStartRef.current = clientX;
  };

  const touchEnd = (clientX: number) => {
    const startX = pointerStartRef.current;
    pointerStartRef.current = null;
    if (startX === null || !running || paused) return;
    const delta = clientX - startX;
    if (Math.abs(delta) < 22) return;
    setLane((value) => Math.max(0, Math.min(2, value + (delta > 0 ? 1 : -1))));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="soft-panel overflow-hidden rounded-[28px] p-3">
        <div className="relative overflow-hidden rounded-[22px] border-2 border-white/80">
          <canvas
            ref={canvasRef}
            width={760}
            height={560}
            className="block aspect-[19/14] w-full touch-none"
            onPointerDown={(event) => touchStart(event.clientX)}
            onPointerUp={(event) => touchEnd(event.clientX)}
          />
          <div className="pointer-events-none absolute left-4 right-4 top-4 grid grid-cols-2 gap-2 text-sm font-extrabold text-ink sm:grid-cols-4">
            <div className="ribbon px-3 py-2">Score {Math.round(score)}</div>
            <div className="ribbon px-3 py-2">Flock {flockSize}</div>
            <div className="ribbon px-3 py-2">Coins {coins}</div>
            <div className="ribbon px-3 py-2">Time {Math.ceil(timeLeft)}s</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="toy-button bg-ink px-5 py-3 font-extrabold text-white" onClick={start}>
            <Play className="mr-2 inline size-4" />
            Start Rally
          </button>
          <button
            className="toy-button bg-white px-5 py-3 font-extrabold text-ink"
            onClick={() => setPaused((value) => !value)}
            disabled={!running}
          >
            <Pause className="mr-2 inline size-4" />
            {paused ? "Resume" : "Pause"}
          </button>
          <button className="toy-button bg-white px-5 py-3 font-extrabold text-ink" onClick={reset}>
            <RotateCcw className="mr-2 inline size-4" />
            Reset
          </button>
          <p className="text-sm font-bold text-ink/65">Arrow keys, drag, or swipe to change lanes.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="soft-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Image src="/brand/flock-rally-sprites.png" alt="" width={58} height={58} className="rounded-2xl bg-white object-cover" />
            <div>
              <h3 className="font-display text-2xl font-bold">Arc Flock Rally</h3>
              <p className="text-sm font-semibold text-ink/60">Offchain run. Onchain submit after game over.</p>
            </div>
          </div>
          {result ? (
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-sun/40 p-4">
              <p className="text-sm font-extrabold uppercase tracking-wide text-ink/60">Run complete</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-bold">
                <span>Score {result.score}</span>
                <span>Flock {result.flockSize}</span>
                <span>Coins {result.coins}</span>
                <span>Combo x{result.combo}</span>
                <span className="col-span-2">Survived {result.survivalTime}s</span>
              </div>
              <button
                className="toy-button mt-4 w-full bg-coral px-5 py-3 font-extrabold text-white disabled:opacity-60"
                onClick={() => onSubmit(result)}
                disabled={submitting}
              >
                <Send className="mr-2 inline size-4" />
                {submitting ? "Submitting..." : "Submit Score on Arc"}
              </button>
              {lastTxUrl ? (
                <a className="mt-3 block text-center text-sm font-extrabold text-lagoon underline" href={lastTxUrl} target="_blank">
                  View transaction on Arcscan
                </a>
              ) : null}
            </motion.div>
          ) : (
            <div className="rounded-3xl bg-white/70 p-4 text-sm font-semibold text-ink/65">
              Collect citizens, USDC coins, Arc crystals, Agent cores, and Bridge shards. Avoid city hazards until the timer ends.
            </div>
          )}
        </div>

        <div className="soft-panel rounded-[28px] p-5">
          <h3 className="font-display text-xl font-bold">Local run history</h3>
          <div className="mt-3 space-y-2">
            {history.length ? (
              history.slice(0, 4).map((run, index) => (
                <div key={`${run.score}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold">
                  <span>#{index + 1} Score {run.score}</span>
                  <span>{run.flockSize} flock</span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-white/70 px-3 py-2 text-sm font-semibold text-ink/60">No offchain runs yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

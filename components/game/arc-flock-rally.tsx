"use client";

import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type RallyResult = {
  score: number;
  flockSize: number;
  coins: number;
  combo: number;
  survivalTime: number;
};

type EntityKind = "citizen" | "coin" | "crystal" | "core" | "shard" | "gas" | "bot" | "cloud" | "crate" | "bridge";

type Entity = {
  id: number;
  lane: number;
  t: number;
  kind: EntityKind;
  bob: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  text?: string;
};

type Snapshot = {
  running: boolean;
  paused: boolean;
  lane: number;
  timeLeft: number;
  score: number;
  flockSize: number;
  coins: number;
  combo: number;
};

type SimState = Snapshot & {
  visualLane: number;
  entities: Entity[];
  particles: Particle[];
  spawnClock: number;
  distance: number;
  shake: number;
  result: RallyResult | null;
};

const initialSim: SimState = {
  running: false,
  paused: false,
  lane: 1,
  visualLane: 1,
  timeLeft: 60,
  score: 0,
  flockSize: 1,
  coins: 0,
  combo: 1,
  entities: [],
  particles: [],
  spawnClock: 0,
  distance: 0,
  shake: 0,
  result: null
};

const collectibleKinds: EntityKind[] = ["citizen", "coin", "coin", "crystal", "core", "shard"];
const hazardKinds: EntityKind[] = ["gas", "bot", "cloud", "crate", "bridge"];

const entityMeta: Record<EntityKind, { label: string; color: string; hazard?: boolean }> = {
  citizen: { label: "+1 flock", color: "#45B7FF" },
  coin: { label: "+USDC", color: "#FFD166" },
  crystal: { label: "+crystal", color: "#55DDE0" },
  core: { label: "combo", color: "#A98BFF" },
  shard: { label: "bridge", color: "#5AE1A5" },
  gas: { label: "gas spike", color: "#FF7B6B", hazard: true },
  bot: { label: "scam bot", color: "#FF6A88", hazard: true },
  cloud: { label: "slow cloud", color: "#9696FF", hazard: true },
  crate: { label: "failed tx", color: "#C9874C", hazard: true },
  bridge: { label: "broken tile", color: "#B29B77", hazard: true }
};

const collectGuide: { kind: EntityKind; title: string; detail: string }[] = [
  { kind: "citizen", title: "Citizens", detail: "+flock size" },
  { kind: "coin", title: "USDC Coins", detail: "+score +coins" },
  { kind: "crystal", title: "Arc Crystals", detail: "bonus score" },
  { kind: "core", title: "Agent Cores", detail: "+combo" },
  { kind: "shard", title: "Bridge Shards", detail: "big bonus" }
];

const avoidGuide: { kind: EntityKind; title: string; detail: string }[] = [
  { kind: "gas", title: "Gas Spikes", detail: "-score -flock" },
  { kind: "bot", title: "Scam Bots", detail: "-2 flock" },
  { kind: "cloud", title: "Volatility", detail: "-combo" },
  { kind: "crate", title: "Failed Tx", detail: "-score" },
  { kind: "bridge", title: "Broken Tiles", detail: "-flock" }
];

function seedRunEntities(): Entity[] {
  const kinds: EntityKind[] = ["coin", "citizen", "crystal", "gas", "core", "coin", "shard", "crate", "coin"];
  return kinds.map((kind, index) => ({
    id: 1000 + index,
    lane: [1, 0, 2, 1, 0, 2, 1, 0, 2][index],
    t: -0.08 + index * 0.13,
    kind,
    bob: index * 0.7
  }));
}

function GuideDot({ kind }: { kind: EntityKind }) {
  const meta = entityMeta[kind];
  return (
    <span className="relative grid size-9 shrink-0 place-items-center rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgba(38,50,75,0.08)]">
      <span className="absolute inset-1 rounded-xl opacity-20" style={{ backgroundColor: meta.color }} />
      <span className="relative text-sm font-black text-ink">
        {kind === "citizen" ? "B" : kind === "coin" ? "$" : kind === "crystal" ? "C" : kind === "core" ? "A" : kind === "shard" ? "H" : kind === "gas" ? "!" : kind === "bot" ? "X" : kind === "cloud" ? "~" : kind === "crate" ? "TX" : "BR"}
      </span>
    </span>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lanePoint(lane: number, t: number, width: number, height: number) {
  const eased = t * t * (3 - 2 * t);
  const center = width / 2;
  const topSpacing = width * 0.115;
  const bottomSpacing = width * 0.245;
  const spacing = lerp(topSpacing, bottomSpacing, eased);
  return {
    x: center + (lane - 1) * spacing,
    y: lerp(78, height - 58, eased),
    scale: lerp(0.48, 1.22, eased)
  };
}

function roundedPolygon(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, radius = 10) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const [px, py] = points[(index - 1 + points.length) % points.length];
    const [nx, ny] = points[(index + 1) % points.length];
    const a1 = Math.atan2(py - y, px - x);
    const a2 = Math.atan2(ny - y, nx - x);
    ctx.lineTo(x + Math.cos(a1) * radius, y + Math.sin(a1) * radius);
    ctx.quadraticCurveTo(x, y, x + Math.cos(a2) * radius, y + Math.sin(a2) * radius);
  });
  ctx.closePath();
}

function drawIsoBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, depth: number, color: string, roof: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(38,50,75,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, depth + 16, w * 0.62, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  roundedPolygon(ctx, [
    [-w / 2, -h / 2],
    [0, -h / 2 - depth],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [0, h / 2 + depth],
    [-w / 2, h / 2]
  ], 7);
  ctx.fill();

  ctx.fillStyle = roof;
  roundedPolygon(ctx, [
    [-w / 2, -h / 2],
    [0, -h / 2 - depth],
    [w / 2, -h / 2],
    [0, -h / 2 + depth * 0.55]
  ], 7);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.44)";
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.roundRect(i * 13 - 4, -2, 8, 14, 4);
    ctx.fill();
  }
  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(38,50,75,0.13)";
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#A96F36";
  ctx.beginPath();
  ctx.roundRect(-5, -2, 10, 24, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(-7, -10, 17, 0, Math.PI * 2);
  ctx.arc(8, -13, 19, 0, Math.PI * 2);
  ctx.arc(1, -29, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, leader = false, wing = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 52, size / 52);
  ctx.fillStyle = "rgba(38,50,75,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 23, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(-12, -12, 4, 0, 0, 34);
  body.addColorStop(0, "#FFFFFF");
  body.addColorStop(0.25, color);
  body.addColorStop(1, leader ? "#1599CA" : color);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 19, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = leader ? "#166AA5" : "rgba(38,50,75,0.16)";
  ctx.beginPath();
  ctx.ellipse(-18, 5 + Math.sin(wing) * 3, 13, 7, -0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(17, 3 - Math.sin(wing) * 3, 10, 6, 0.48, 0, Math.PI * 2);
  ctx.fill();

  if (leader) {
    ctx.strokeStyle = "#FFE7A3";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-1, -1, 21, 0.18, Math.PI * 1.08);
    ctx.stroke();
    ctx.fillStyle = "#48D6F0";
    ctx.beginPath();
    ctx.moveTo(-3, -25);
    ctx.lineTo(8, -43);
    ctx.lineTo(15, -22);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#FFB23F";
  ctx.beginPath();
  ctx.moveTo(19, -3);
  ctx.lineTo(33, 2);
  ctx.lineTo(19, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#202A44";
  ctx.beginPath();
  ctx.arc(9, -7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(10.5, -8.5, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawToken(ctx: CanvasRenderingContext2D, kind: EntityKind, x: number, y: number, size: number, pulse: number) {
  const meta = entityMeta[kind];
  ctx.save();
  ctx.translate(x, y + Math.sin(pulse) * size * 0.05);
  ctx.scale(size / 64, size / 64);
  ctx.fillStyle = "rgba(38,50,75,0.14)";
  ctx.beginPath();
  ctx.ellipse(0, 26, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === "coin") {
    const g = ctx.createLinearGradient(-22, -24, 22, 24);
    g.addColorStop(0, "#FFF6B8");
    g.addColorStop(0.45, "#FFD166");
    g.addColorStop(1, "#F29B2E");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "#1876C9";
    ctx.font = "900 27px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 2);
  } else if (kind === "crystal") {
    const g = ctx.createLinearGradient(-16, -30, 18, 28);
    g.addColorStop(0, "#DDFBFF");
    g.addColorStop(0.42, "#55DDE0");
    g.addColorStop(1, "#2A9DFF");
    ctx.fillStyle = g;
    roundedPolygon(ctx, [[0, -31], [18, -4], [7, 30], [-11, 30], [-22, -4]], 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (kind === "core") {
    const g = ctx.createRadialGradient(-8, -12, 4, 0, 0, 30);
    g.addColorStop(0, "#FFFFFF");
    g.addColorStop(0.38, "#C8A8FF");
    g.addColorStop(1, "#7A4CF5");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 33, 10, -0.55, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "shard") {
    ctx.fillStyle = "#58DCA0";
    roundedPolygon(ctx, [[-24, -13], [10, -23], [28, 8], [-4, 24]], 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(-10, -8, 23, 7);
    ctx.fillRect(2, 4, 16, 7);
  } else if (kind === "citizen") {
    drawBird(ctx, 0, 0, 56, "#64D9FF", false, pulse);
  } else if (kind === "gas") {
    ctx.fillStyle = "#FF6B5F";
    roundedPolygon(ctx, [[0, -31], [13, 4], [2, 4], [13, 31], [-12, -2], [-1, -2]], 3);
    ctx.fill();
    ctx.strokeStyle = "#FFF1B8";
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (kind === "bot") {
    ctx.fillStyle = "#F2F6FA";
    ctx.beginPath();
    ctx.roundRect(-26, -22, 52, 42, 15);
    ctx.fill();
    ctx.strokeStyle = "#B7C6D7";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#25304A";
    ctx.beginPath();
    ctx.roundRect(-17, -10, 34, 18, 8);
    ctx.fill();
    ctx.strokeStyle = "#FF6A88";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(-4, 3);
    ctx.moveTo(-4, -2);
    ctx.lineTo(-9, 3);
    ctx.moveTo(5, -2);
    ctx.lineTo(10, 3);
    ctx.moveTo(10, -2);
    ctx.lineTo(5, 3);
    ctx.stroke();
  } else if (kind === "cloud") {
    ctx.fillStyle = "#AFA8FF";
    [-18, -2, 15].forEach((cx, index) => {
      ctx.beginPath();
      ctx.arc(cx, index === 1 ? -8 : 0, index === 1 ? 22 : 16, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#7C6FE8";
    ctx.beginPath();
    ctx.roundRect(-28, 2, 57, 18, 9);
    ctx.fill();
  } else if (kind === "crate") {
    ctx.fillStyle = "#C9874C";
    ctx.beginPath();
    ctx.roundRect(-25, -22, 50, 44, 8);
    ctx.fill();
    ctx.strokeStyle = "#7A4B2B";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "#FFE0A4";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(10, 8);
    ctx.moveTo(10, -8);
    ctx.lineTo(-10, 8);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#B9A483";
    roundedPolygon(ctx, [[-31, -12], [3, -24], [32, -6], [-2, 20]], 6);
    ctx.fill();
    ctx.strokeStyle = "#806C55";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-9, -17);
    ctx.lineTo(11, 13);
    ctx.stroke();
  }

  ctx.restore();
  if (kind !== "citizen") {
    ctx.save();
    ctx.fillStyle = meta.hazard ? "rgba(255,91,96,0.13)" : "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(x, y, size * 0.55 + Math.sin(pulse) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScene(ctx: CanvasRenderingContext2D, sim: SimState, width: number, height: number, now: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  if (sim.shake > 0) {
    ctx.translate((Math.random() - 0.5) * sim.shake, (Math.random() - 0.5) * sim.shake);
  }

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#DDF8FF");
  sky.addColorStop(0.52, "#F4FEF9");
  sky.addColorStop(1, "#FFE7AD");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  for (let i = 0; i < 7; i += 1) {
    const x = (i * 160 - (sim.distance * 22) % 160) - 40;
    ctx.beginPath();
    ctx.ellipse(x, 60 + (i % 2) * 24, 54, 15, -0.12, 0, Math.PI * 2);
    ctx.ellipse(x + 42, 56 + (i % 2) * 24, 32, 11, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 8; i += 1) {
    const x = (i * 128 - (sim.distance * 52) % 128) - 60;
    const y = 118 + (i % 3) * 22;
    drawIsoBlock(ctx, x, y, 58, 40, 20, i % 2 ? "#80D8FF" : "#FDBB75", i % 3 ? "#BCA8FF" : "#5AE1A5");
  }

  const topLeft = lanePoint(0, 0, width, height);
  const topRight = lanePoint(2, 0, width, height);
  const botLeft = lanePoint(0, 1, width, height);
  const botRight = lanePoint(2, 1, width, height);
  const road = ctx.createLinearGradient(0, 90, 0, height);
  road.addColorStop(0, "#93E8C8");
  road.addColorStop(0.48, "#FFF1A8");
  road.addColorStop(1, "#5ADCB1");
  ctx.fillStyle = road;
  roundedPolygon(ctx, [
    [topLeft.x - 78, topLeft.y - 8],
    [topRight.x + 78, topRight.y - 8],
    [botRight.x + 126, botRight.y + 46],
    [botLeft.x - 126, botLeft.y + 46]
  ], 22);
  ctx.fill();

  for (let i = 0; i < 9; i += 1) {
    const t = ((i / 9 + sim.distance * 0.15) % 1);
    const left = lanePoint(0, t, width, height);
    const right = lanePoint(2, t, width, height);
    const scale = left.scale * 0.58;
    const side = i % 2 === 0 ? -1 : 1;
    const base = side < 0 ? left : right;
    const x = base.x + side * (112 + 18 * base.scale);
    const y = base.y + 12 * base.scale;
    if (i % 3 === 0) {
      drawIsoBlock(ctx, x, y, 52 * scale, 38 * scale, 18 * scale, i % 2 ? "#6FD4FF" : "#FDBB75", i % 4 ? "#BCA8FF" : "#55DCA3");
    } else {
      drawTree(ctx, x, y, scale, i % 2 ? "#66D89A" : "#FFA7BD");
    }
  }

  for (let lane = 0; lane < 3; lane += 1) {
    const p0 = lanePoint(lane, 0.02, width, height);
    const p1 = lanePoint(lane, 1, width, height);
    const laneGrad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
    laneGrad.addColorStop(0, "rgba(255,255,255,0.2)");
    laneGrad.addColorStop(1, lane === sim.lane ? "rgba(255,209,102,0.42)" : "rgba(255,255,255,0.28)");
    ctx.strokeStyle = laneGrad;
    ctx.lineWidth = lane === sim.lane ? 64 : 42;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(width / 2 + (lane - 1) * 72, height * 0.45, p1.x, p1.y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(38,50,75,0.11)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i += 1) {
    const t = ((i / 16 + sim.distance * 0.22) % 1);
    const left = lanePoint(0, t, width, height);
    const right = lanePoint(2, t, width, height);
    ctx.beginPath();
    ctx.moveTo(left.x - 84 * left.scale, left.y);
    ctx.lineTo(right.x + 84 * right.scale, right.y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 5;
  ctx.setLineDash([22, 24]);
  for (let lane = 0; lane < 2; lane += 1) {
    const topA = lanePoint(lane + 0.5, 0.03, width, height);
    const botA = lanePoint(lane + 0.5, 0.98, width, height);
    ctx.beginPath();
    ctx.moveTo(topA.x, topA.y);
    ctx.quadraticCurveTo(width / 2 + (lane - 0.5) * 70, height * 0.48, botA.x, botA.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const sorted = [...sim.entities].sort((a, b) => a.t - b.t);
  sorted.forEach((entity) => {
    const p = lanePoint(entity.lane, clamp(entity.t, 0, 1), width, height);
    drawToken(ctx, entity.kind, p.x, p.y, 58 * p.scale, now * 0.008 + entity.bob);
  });

  const leader = lanePoint(sim.visualLane, 0.88, width, height);
  for (let i = Math.min(sim.flockSize - 1, 8); i > 0; i -= 1) {
    const offsetLane = ((i % 3) - 1) * 0.08;
    const follower = lanePoint(sim.visualLane + offsetLane, 0.88 - i * 0.034, width, height);
    drawBird(ctx, follower.x, follower.y + Math.sin(now * 0.008 + i) * 3, 44 * follower.scale, ["#64D9FF", "#FF91A8", "#FFD166", "#73DFA9"][i % 4], false, now * 0.012 + i);
  }
  drawBird(ctx, leader.x, leader.y + Math.sin(now * 0.01) * 4, 64 * leader.scale, "#35C9EA", true, now * 0.014);

  sim.particles.forEach((particle) => {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    if (particle.text) {
      ctx.font = "900 24px Arial";
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.82)";
      ctx.strokeText(particle.text, particle.x, particle.y);
      ctx.fillText(particle.text, particle.x, particle.y);
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 5 + alpha * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  ctx.restore();
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
  const pointerStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const simRef = useRef<SimState>({ ...initialSim });
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSim);
  const [result, setResult] = useState<RallyResult | null>(null);
  const [history, setHistory] = useState<RallyResult[]>([]);

  const publishSnapshot = useCallback(() => {
    const sim = simRef.current;
    setSnapshot({
      running: sim.running,
      paused: sim.paused,
      lane: sim.lane,
      timeLeft: sim.timeLeft,
      score: sim.score,
      flockSize: sim.flockSize,
      coins: sim.coins,
      combo: sim.combo
    });
  }, []);

  const addParticle = useCallback((x: number, y: number, color: string, text?: string) => {
    simRef.current.particles.push({
      id: performance.now() + Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 70,
      vy: text ? -45 : -90 - Math.random() * 80,
      life: text ? 0.72 : 0.55,
      maxLife: text ? 0.72 : 0.55,
      color,
      text
    });
  }, []);

  const finish = useCallback(() => {
    const sim = simRef.current;
    if (!sim.running && sim.result) return;
    const finalResult: RallyResult = {
      score: Math.max(0, Math.round(sim.score)),
      flockSize: Math.max(0, Math.round(sim.flockSize)),
      coins: Math.max(0, Math.round(sim.coins)),
      combo: Math.max(1, Math.round(sim.combo)),
      survivalTime: Math.round(60 - sim.timeLeft)
    };
    sim.running = false;
    sim.paused = false;
    sim.result = finalResult;
    setResult(finalResult);
    setHistory((current) => {
      const next = [finalResult, ...current].slice(0, 8);
      window.localStorage.setItem("arcynite-rally-history", JSON.stringify(next));
      return next;
    });
    publishSnapshot();
  }, [publishSnapshot]);

  const reset = useCallback(() => {
    simRef.current = { ...initialSim, entities: [], particles: [] };
    setResult(null);
    publishSnapshot();
  }, [publishSnapshot]);

  const start = useCallback(() => {
    simRef.current = { ...initialSim, running: true, entities: seedRunEntities(), particles: [] };
    setResult(null);
    publishSnapshot();
  }, [publishSnapshot]);

  const changeLane = useCallback((delta: number) => {
    const sim = simRef.current;
    if (!sim.running || sim.paused) return;
    sim.lane = clamp(sim.lane + delta, 0, 2);
    publishSnapshot();
  }, [publishSnapshot]);

  useEffect(() => {
    const raw = window.localStorage.getItem("arcynite-rally-history");
    if (raw) setHistory(JSON.parse(raw) as RallyResult[]);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") changeLane(-1);
      if (event.key === "ArrowRight") changeLane(1);
      if (event.key === " " && simRef.current.running) {
        simRef.current.paused = !simRef.current.paused;
        publishSnapshot();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeLane, publishSnapshot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const loop = (now: number) => {
      const sim = simRef.current;
      const dt = Math.min(0.035, (now - (lastFrameRef.current || now)) / 1000);
      lastFrameRef.current = now;

      if (sim.running && !sim.paused) {
        sim.timeLeft = Math.max(0, sim.timeLeft - dt);
        sim.distance += dt * (1.7 + sim.combo * 0.06);
        sim.spawnClock += dt;
        sim.visualLane += (sim.lane - sim.visualLane) * Math.min(1, dt * 10);
        sim.shake = Math.max(0, sim.shake - dt * 28);

        const spawnRate = Math.max(0.3, 0.52 - sim.combo * 0.018);
        if (sim.spawnClock >= spawnRate) {
          sim.spawnClock = 0;
          const isHazard = Math.random() < 0.34;
          const pool = isHazard ? hazardKinds : collectibleKinds;
          sim.entities.push({
            id: now + Math.random(),
            lane: Math.floor(Math.random() * 3),
            t: -0.08,
            kind: pool[Math.floor(Math.random() * pool.length)],
            bob: Math.random() * Math.PI * 2
          });
        }

        sim.entities = sim.entities
          .map((entity) => ({ ...entity, t: entity.t + dt * (0.38 + sim.combo * 0.012) }))
          .filter((entity) => {
            const hit = entity.lane === sim.lane && entity.t > 0.79 && entity.t < 0.95;
            if (!hit) return entity.t < 1.12;

            const point = lanePoint(entity.lane, entity.t, canvas.width, canvas.height);
            const meta = entityMeta[entity.kind];
            if (entity.kind === "citizen") {
              sim.flockSize += 1;
              sim.score += 130 * sim.combo;
              addParticle(point.x, point.y - 40, meta.color, "+flock");
            } else if (entity.kind === "coin") {
              sim.coins += 1;
              sim.score += 90 * sim.combo;
              addParticle(point.x, point.y - 40, meta.color, "+USDC");
            } else if (entity.kind === "crystal") {
              sim.score += 320 * sim.combo;
              addParticle(point.x, point.y - 40, meta.color, "+crystal");
            } else if (entity.kind === "core") {
              sim.combo = Math.min(9, sim.combo + 1);
              sim.score += 180 * sim.combo;
              addParticle(point.x, point.y - 40, meta.color, `combo x${sim.combo}`);
            } else if (entity.kind === "shard") {
              sim.score += 460 + sim.flockSize * 25;
              addParticle(point.x, point.y - 40, meta.color, "+bridge");
            } else {
              sim.combo = Math.max(1, sim.combo - 1);
              sim.score = Math.max(0, sim.score - (entity.kind === "crate" ? 220 : 140));
              sim.flockSize -= entity.kind === "bot" ? 2 : 1;
              sim.shake = 12;
              addParticle(point.x, point.y - 38, meta.color, meta.label);
            }
            for (let i = 0; i < 8; i += 1) addParticle(point.x, point.y, meta.color);
            return false;
          });

        sim.particles = sim.particles
          .map((particle) => ({
            ...particle,
            life: particle.life - dt,
            x: particle.x + particle.vx * dt,
            y: particle.y + particle.vy * dt,
            vy: particle.vy + 120 * dt
          }))
          .filter((particle) => particle.life > 0);

        if (sim.timeLeft <= 0 || sim.flockSize <= 0) finish();
        publishSnapshot();
      } else {
        sim.visualLane += (sim.lane - sim.visualLane) * Math.min(1, dt * 8);
      }

      drawScene(ctx, sim, canvas.width, canvas.height, now);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [addParticle, finish, publishSnapshot]);

  const pointerStart = (clientX: number) => {
    pointerStartRef.current = clientX;
  };

  const pointerEnd = (clientX: number) => {
    const startX = pointerStartRef.current;
    pointerStartRef.current = null;
    if (startX === null) return;
    const delta = clientX - startX;
    if (Math.abs(delta) < 20) return;
    changeLane(delta > 0 ? 1 : -1);
  };

  const togglePause = () => {
    const sim = simRef.current;
    if (!sim.running) return;
    sim.paused = !sim.paused;
    publishSnapshot();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="soft-panel overflow-hidden rounded-[28px] p-3">
        <div className="relative overflow-hidden rounded-[22px] border-2 border-white/80 bg-skyglass">
          <canvas
            ref={canvasRef}
            width={880}
            height={620}
            className="block aspect-[44/31] w-full touch-none"
            onPointerDown={(event) => pointerStart(event.clientX)}
            onPointerUp={(event) => pointerEnd(event.clientX)}
            onPointerCancel={() => {
              pointerStartRef.current = null;
            }}
          />
          <div className="pointer-events-none absolute left-4 right-4 top-4 grid grid-cols-2 gap-2 text-sm font-extrabold text-ink sm:grid-cols-5">
            <div className="ribbon px-3 py-2">Score {Math.round(snapshot.score)}</div>
            <div className="ribbon px-3 py-2">Flock {snapshot.flockSize}</div>
            <div className="ribbon px-3 py-2">Coins {snapshot.coins}</div>
            <div className="ribbon px-3 py-2">Combo x{snapshot.combo}</div>
            <div className="ribbon px-3 py-2">Time {Math.ceil(snapshot.timeLeft)}s</div>
          </div>
          {!snapshot.running && !result ? (
            <div className="absolute inset-0 grid place-items-center bg-white/16 backdrop-blur-[1px]">
              <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-4 max-w-md rounded-[28px] bg-white/90 p-5 text-center shadow-soft ring-1 ring-white/80">
                <Sparkles className="mx-auto mb-2 size-9 text-lagoon" />
                <h3 className="font-display text-3xl font-bold">Arc Flock Rally</h3>
                <p className="mt-2 text-sm font-bold text-ink/62">Move left and right across 3 lanes. Take glowing rewards, dodge red/brown hazards, survive 60 seconds, then submit the final score on Arc.</p>
                <div className="mt-4 grid gap-2 text-left text-xs font-extrabold sm:grid-cols-3">
                  <span className="rounded-2xl bg-mint/45 px-3 py-2 text-ink">1. Swipe / arrows</span>
                  <span className="rounded-2xl bg-sun/45 px-3 py-2 text-ink">2. Collect rewards</span>
                  <span className="rounded-2xl bg-coral/18 px-3 py-2 text-ink">3. Avoid hazards</span>
                </div>
              </motion.div>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="toy-button bg-ink px-5 py-3 font-extrabold text-white" onClick={start}>
            <Play className="mr-2 inline size-4" />
            Start Rally
          </button>
          <button className="toy-button bg-white px-5 py-3 font-extrabold text-ink disabled:opacity-55" onClick={togglePause} disabled={!snapshot.running}>
            <Pause className="mr-2 inline size-4" />
            {snapshot.paused ? "Resume" : "Pause"}
          </button>
          <button className="toy-button bg-white px-5 py-3 font-extrabold text-ink" onClick={reset}>
            <RotateCcw className="mr-2 inline size-4" />
            Reset
          </button>
          <p className="text-sm font-bold text-ink/65">Arrow keys, space, drag, or swipe. The center stays clear for play.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="soft-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-skyglass to-mint shadow-soft ring-1 ring-white/80">
              <Sparkles className="size-7 text-lagoon" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold">Arc Flock Rally</h3>
              <p className="text-sm font-semibold text-ink/60">2.5D city run. Onchain submit after game over.</p>
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
            <div className="space-y-4">
              <div className="rounded-3xl bg-white/70 p-4">
                <h4 className="font-display text-lg font-bold text-ink">How to play</h4>
                <div className="mt-3 space-y-2 text-sm font-bold text-ink/65">
                  <p>Move between 3 lanes with arrow keys, swipe, or drag.</p>
                  <p>Collect bright Arc items to grow score and combo.</p>
                  <p>Avoid warning-colored hazards. If flock reaches 0, the run ends.</p>
                </div>
              </div>
              <div className="rounded-3xl bg-mint/25 p-4">
                <h4 className="font-display text-lg font-bold text-ink">Collect these</h4>
                <div className="mt-3 grid gap-2">
                  {collectGuide.map((item) => (
                    <div key={item.kind} className="flex items-center gap-3 rounded-2xl bg-white/72 px-3 py-2">
                      <GuideDot kind={item.kind} />
                      <div>
                        <p className="text-sm font-extrabold text-ink">{item.title}</p>
                        <p className="text-xs font-bold text-ink/55">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-coral/12 p-4">
                <h4 className="font-display text-lg font-bold text-ink">Avoid these</h4>
                <div className="mt-3 grid gap-2">
                  {avoidGuide.map((item) => (
                    <div key={item.kind} className="flex items-center gap-3 rounded-2xl bg-white/72 px-3 py-2">
                      <GuideDot kind={item.kind} />
                      <div>
                        <p className="text-sm font-extrabold text-ink">{item.title}</p>
                        <p className="text-xs font-bold text-ink/55">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

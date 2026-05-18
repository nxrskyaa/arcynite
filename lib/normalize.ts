import { fallbackLeaderboard } from "@/lib/metadata";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function fromTuple<T>(value: unknown, index: number, key: string, fallback: T): T {
  const record = asRecord(value);
  const tuple = Array.isArray(value) ? value : [];
  return (record[key] ?? tuple[index] ?? fallback) as T;
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.length) return Number(value);
  return fallback;
}

export function normalizeCitizen(value: unknown) {
  const username = fromTuple<string>(value, 0, "username", "");
  const faction = toNumber(fromTuple(value, 1, "faction", 0));
  const xp = toNumber(fromTuple(value, 2, "xp", 0));
  const level = toNumber(fromTuple(value, 3, "level", xp > 0 ? 1 : 0));
  const exists = Boolean(fromTuple(value, 6, "exists", Boolean(username)));
  return { username, faction, xp, level, exists };
}

export function normalizeGameStats(value: unknown) {
  return {
    highScore: toNumber(fromTuple(value, 0, "highScore", 0)),
    totalScore: toNumber(fromTuple(value, 1, "totalScore", 0)),
    totalRuns: toNumber(fromTuple(value, 2, "totalRuns", 0)),
    bestFlockSize: toNumber(fromTuple(value, 3, "bestFlockSize", 1)),
    totalCoins: toNumber(fromTuple(value, 4, "totalCoins", 0))
  };
}

export function normalizeUserSummary(value: unknown) {
  return {
    username: String(fromTuple(value, 0, "username", "")),
    faction: toNumber(fromTuple(value, 1, "faction", 0)),
    level: toNumber(fromTuple(value, 2, "level", 0)),
    xp: toNumber(fromTuple(value, 3, "xp", 0)),
    highScore: toNumber(fromTuple(value, 4, "highScore", 0))
  };
}

export function normalizeLeaderboard(value: unknown) {
  const rows = Array.isArray(value) ? value : [];
  if (!rows.length) return fallbackLeaderboard;
  return rows.map((row) => ({
    user: String(fromTuple(row, 0, "user", "")),
    username: String(fromTuple(row, 1, "username", "Citizen")),
    faction: toNumber(fromTuple(row, 2, "faction", 0)),
    highScore: toNumber(fromTuple(row, 3, "highScore", 0)),
    level: toNumber(fromTuple(row, 4, "level", 1)),
    demo: false
  }));
}

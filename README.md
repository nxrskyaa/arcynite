# Arcynite

Arcynite is a colorful isometric onboarding game for Arc Testnet. Players create an onchain citizen profile, choose a faction, explore Arcynite City, complete onboarding quests, create an AI agent profile, play Arc Flock Rally, submit scores onchain, claim badges, and compete on leaderboards.

The app is intentionally a no-backend MVP: contract data comes from ArcyniteQuest, offchain rally run history is stored in `localStorage`, and all achievement writes use Arc Testnet.

## Arc Testnet

- Network: Arc Testnet
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Native currency: `USDC`
- Contract name: `ArcyniteQuest`
- Contract address: `0x4939CBE982724ac5CC463a0C56B17aFC939C1EfC`

## Environment

Copy `.env.example` to `.env.local` and update values if a new deployment is used.

```bash
NEXT_PUBLIC_ARCYNITE_CONTRACT_ADDRESS=0x4939CBE982724ac5CC463a0C56B17aFC939C1EfC
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_EXPLORER=https://testnet.arcscan.app
```

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run typecheck
npm run build
```

## Deploy On Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from `.env.example`.
4. Deploy with the default Next.js settings.

## Updating Contract Settings

To point the app at a new contract or RPC, update these environment variables:

- `NEXT_PUBLIC_ARCYNITE_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ARC_RPC_URL`
- `NEXT_PUBLIC_ARC_EXPLORER`

The chain metadata is defined in `lib/arc.ts`, and the compact contract ABI is defined in `lib/contract.ts`.

## Onchain Actions

Arcynite integrates these `ArcyniteQuest` writes:

- `createCitizen(string username, uint8 faction)`
- `sendGM()`
- `createAgent(string name, string role)`
- `completeQuest(uint256 questId)`
- `unlockZone(uint256 zoneId)`
- `submitFlockScore(uint256 score, uint32 flockSize, uint32 coins)`
- `claimBadge(uint256 badgeId)`

The UI refreshes citizen, progress, game stats, agent, badge, quest, zone, faction, and leaderboard reads after successful transactions. Transaction success states include Arcscan links.

## Arcynite Concept

Arcynite is designed as a premium casual mobile-game onboarding world rather than a crypto dashboard. The visual system uses a bright floating island city, soft toy-like cards, playful ribbons, faction colors, collectible badges, and smooth Framer Motion transitions.

Factions:

- `0` USDC Guard
- `1` Bridge Birds
- `2` Agent Owls
- `3` Builder Beaks

Zones:

- `0` Flock Gate
- `1` USDC Bank
- `2` Bridge Harbor
- `3` Agent Academy
- `4` Flock Rally Arena
- `5` Badge Nest
- `6` Command Board
- `7` Leaderboard Tower
- `8` Arc Fountain

## Arc Flock Rally

Arc Flock Rally is a 60-second HTML Canvas crowd-runner. Gameplay is offchain, and users submit only the final result onchain after game over. Desktop controls use arrow keys and drag; mobile controls use swipe.

There are no gambling mechanics, token rewards, or automatic score submissions.

# Arcynite

Arcynite is a focused onchain mini game for Arc Testnet.

Core flow: connect wallet, create a citizen profile, play Arc Flock Rally, submit the final score onchain, and climb the leaderboard.

The app has no backend. Gameplay runs offchain in HTML Canvas, local run history and sound preferences use `localStorage`, and only profile creation plus final score submission are written to the deployed `ArcyniteQuest` contract.

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
npm run lint
npm run build
```

## Deploy On Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the public environment variables from `.env.example`.
4. Deploy with the default Next.js settings.

## Updating Contract Settings

To point the app at a new contract or RPC, update:

- `NEXT_PUBLIC_ARCYNITE_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ARC_RPC_URL`
- `NEXT_PUBLIC_ARC_EXPLORER`

Chain metadata lives in `lib/arc.ts`. The minimal MVP ABI lives in `lib/contract.ts`.

## Onchain Actions

Arcynite MVP uses only these writes:

- `createCitizen(string username, uint8 faction)`
- `submitFlockScore(uint256 score, uint32 flockSize, uint32 coins)`

Reads:

- `getCitizen(address user)`
- `getGameStats(address user)`
- `getLeaderboard()`
- `getUserSummary(address user)`

Score submission uses argument order `[score, flockSize, coins]` and does not send `msg.value`.

## Factions

- `0` USDC Guard
- `1` Bridge Birds
- `2` Agent Owls
- `3` Builder Beaks

## Arc Flock Rally

Arc Flock Rally is a 60-second pseudo-isometric lane runner. Move across three lanes, collect citizens and Arc rewards, avoid hazards, and submit only the final game-over result.

Controls:

- Desktop: Arrow Left, Arrow Right, A, D, mouse drag
- Mobile: swipe or touch drag across the canvas

There are no gambling mechanics, token rewards, or automatic score submissions.

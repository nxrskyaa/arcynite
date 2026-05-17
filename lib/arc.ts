import { defineChain, type Address } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network"]
    }
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: process.env.NEXT_PUBLIC_ARC_EXPLORER ?? "https://testnet.arcscan.app"
    }
  },
  testnet: true
});

export const arcyniteContractAddress = (process.env.NEXT_PUBLIC_ARCYNITE_CONTRACT_ADDRESS ??
  "0x4939CBE982724ac5CC463a0C56B17aFC939C1EfC") as Address;

export const arcExplorer = process.env.NEXT_PUBLIC_ARC_EXPLORER ?? "https://testnet.arcscan.app";

export function shortAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function txUrl(hash?: string) {
  return hash ? `${arcExplorer}/tx/${hash}` : arcExplorer;
}

import { Chain } from "viem";
import { lcai, lcaiTestnet } from "./chains";

/**
 * DUNA Members governance — a standalone OpenZeppelin Governor, separate from
 * the main LCAI DAO (own contract, own indexer, no timelock). Outcomes are
 * advisory: the DUNA team applies them manually.
 */
const chainId = Number(process.env.NEXT_PUBLIC_DUNA_CHAIN_ID || lcaiTestnet.id);

const baseChain: Chain = [lcaiTestnet, lcai].find((c) => c.id === chainId) ?? lcaiTestnet;
const rpcOverride = process.env.NEXT_PUBLIC_DUNA_RPC_URL;

const dunaChain: Chain = rpcOverride
  ? { ...baseChain, rpcUrls: { default: { http: [rpcOverride] } } }
  : baseChain;

const governor = (process.env.NEXT_PUBLIC_DUNA_GOVERNOR_ADDRESS || undefined) as
  | `0x${string}`
  | undefined;

const dunaConfig = {
  chain: dunaChain,
  governor,
  /** Checkpoint indexer name in lcai-dao-api */
  indexer: "duna",
  /** Average block time, used only for time estimates (governor uses block numbers) */
  blockTimeSeconds: Number(process.env.NEXT_PUBLIC_DUNA_BLOCK_TIME || 2.1),
  voteToken: {
    symbol: "LCAI",
    decimals: 18,
    address: "0x0000000000000000000000000000000000001001" as `0x${string}`,
  },
};

export const isDunaConfigured = !!dunaConfig.governor;

export const MembershipAction = {
  Add: 0,
  Remove: 1,
} as const;

export type MembershipAction = (typeof MembershipAction)[keyof typeof MembershipAction];

export default dunaConfig;

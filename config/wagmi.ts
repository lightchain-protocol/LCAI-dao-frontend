import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import config from ".";
import dunaConfig, { isDunaConfigured } from "./duna";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Wallet-selectable networks: the main DAO chains, plus the DUNA Members chain
// when configured. `config.chains` (used by useCurrentChain) is unchanged, so the
// main DAO keeps resolving to its own chain.
export const networks = (
  isDunaConfigured && !config.chains.some((c) => c.id === dunaConfig.chain.id)
    ? [...config.chains, dunaConfig.chain]
    : config.chains
) as typeof config.chains;

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

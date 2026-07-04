import { Token } from "@/types";
import { lcai, lcaiTestnet } from "./chains";
import { Chain } from "viem";
import { mainnet } from "viem/chains";

const config = {
  chains: [lcai] as [Chain, ...Chain[]],

  indexerName: {
    [mainnet.id]: "mainnet",
    [lcaiTestnet.id]: "lcai",
    [lcai.id]: "lcai",
  },

  blockTimeSeconds: {
    [mainnet.id]: 12,
    [lcaiTestnet.id]: 6,
    [lcai.id]: 6,
  } as Record<number, number>,

  totalSupply: {
    [mainnet.id]: 10e9,
    [lcaiTestnet.id]: 10e9,
    [lcai.id]: 10e9,
  } as Record<number, number>,

  predefinedContracts: {
    [mainnet.id]: [
      {
        name: "Lightchain Treasury",
        address: "0x07A716a551E5f4CA7D6C71Da9dF1cb1429Dba826",
      },
    ],
    [lcai.id]: [
      {
        name: "Lightchain Treasury",
        address: "0x786eDe8C42Ca54E54c9dCECa9b30052CF4743389",
      },
      {
        name: "Lightchain Governor",
        address: "0xDef8DCb2DcDD78102FeBDEe91F0fa3bb61c70840",
      },
      // {
      //   name: "Lightchain AI Config",
      //   address: "0x24D11533C354092ed6E18b964257819cE78Ce77D",
      // },
    ],
    [lcaiTestnet.id]: [
      {
        name: "Lightchain Treasury",
        address: "0x482EfC1eA15289915e11689240E8A0f80C39E668",
      },
      {
        name: "Lightchain Governor",
        address: "0xb18ef7bc408EE7136DdD9901Bc51695eE661Cd56",
      },
      // {
      //   name: "Lightchain AI Config",
      //   address: "0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e",
      // },
    ],
  } as Record<number, { name: string; address: `0x${string}` }[]>,

  timeLock: {
    [mainnet.id]: `0xbE1c37F8C4DA77dD06F4A8AC5098Ec70273093d7`,
    [lcai.id]: `0xc783376c8237E8f1ed17d825CE7CBB4c22e3cAE5`,
    [lcaiTestnet.id]: `0x6BFa8dcaE5DE285a2E8E893681638dBcd39B8d55`,
  } as Record<number, `0x${string}`>,

  governor: {
    [mainnet.id]: `0x6dfa413B5900a1a7947BC75E68AbBA093cB2492d`,
    [lcai.id]: `0xD216A0c0050EdC3a9E0449EcFDf178A1652b4b68`,
    [lcaiTestnet.id]: `0xfd8491594D806CdEf676012E714EAAb7e806dD24`,
  } as Record<number, `0x${string}`>,

  aiConfig: {
    [lcai.id]: `0x24D11533C354092ed6E18b964257819cE78Ce77D`,
    [lcaiTestnet.id]: `0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e`,
  } as Record<number, `0x${string}`>,

  underlyingToken: {
    [mainnet.id]: {
      address: "0x9ca8530ca349c966fe9ef903df17a75b8a778927",
      symbol: "LCAI",
      name: "LCAI",
      logoURI: "/images/brand/lcai.svg",
      decimals: 18,
    },
    [lcai.id]: {
      symbol: "LCAI",
      name: "LCAI",
      logoURI: "/images/brand/lcai.svg",
      decimals: 18,
    },
    [lcaiTestnet.id]: {
      symbol: "LCAI",
      name: "LCAI",
      logoURI: "/images/brand/lcai.svg",
      decimals: 18,
    },
  } as Record<number, Token>,

  voteToken: {
    [mainnet.id]: {
      name: "LCAIBallot",
      symbol: "LCAIB",
      decimals: 18,
      address: "0x75F3D01c4D960FE986A598B7954A3b786B29cE49",
    },
    [lcai.id]: {
      name: "LCAI",
      symbol: "LCAI",
      decimals: 18,
      address: `0x0000000000000000000000000000000000001001`,
    },
    [lcaiTestnet.id]: {
      name: "LCAI",
      symbol: "LCAI",
      decimals: 18,
      address: `0x0000000000000000000000000000000000001001`,
    },
  } as Record<number, Token>,

  treasury: {
    [mainnet.id]: "0x07A716a551E5f4CA7D6C71Da9dF1cb1429Dba826",
    [lcai.id]: "0x786eDe8C42Ca54E54c9dCECa9b30052CF4743389",
    [lcaiTestnet.id]: "0x482EfC1eA15289915e11689240E8A0f80C39E668",
  } as Record<number, `0x${string}`>,

  lcaiEthPair: {
    [mainnet.id]: "0x0D047a370611437a1B8e6c2a95eA36f69fdDa3Be",
  } as Record<number, `0x${string}`>,

  wETH: {
    [mainnet.id]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  } as Record<number, `0x${string}`>,

  chainlinkAggregator: {
    [mainnet.id]: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  } as Record<number, `0x${string}`>,
};

export default config;

// Native-votes precompile (INativeVotes) governance-power views. These are not
// part of the ERC20Votes ABI. getTotalVotingPower subtracts staked LCAI from
// the raw total supply, so it is the on-chain quorum denominator (the votable
// sum). getPastTotalSupply is the raw tracked supply; the difference between
// them is the excluded stake.
export default [
  {
    inputs: [{ internalType: "uint256", name: "blockNumber", type: "uint256" }],
    name: "getTotalVotingPower",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "timepoint", type: "uint256" }],
    name: "getPastTotalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

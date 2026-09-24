"use client";

import { useConnection } from "wagmi";
import {
  decodeEventLog,
  encodePacked,
  encodeFunctionData,
  keccak256,
  parseEther,
  SimulateContractReturnType,
} from "viem";
import useContracts from "./useContracts";
import useWeb3Clients from "./useWeb3Clients";
import { ContractAction, SimulationAction } from "@/types";
import useCurrentChain from "./useCurrentChain";
import config from "@/config";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3000";

const SIMULATE_URL = `${API_ENDPOINT}/api/simulate`;

// Friendly label shown in the pre-submit preview when a proposal has no
// real actions and falls back to the safe no-op placeholder.
const NO_OP_SIGNATURE_LABEL = "Signal proposal — no on-chain action";

/**
 * Generate full function signature from ABI and method name.
 * e.g., "transferERC20(address,address,uint256)"
 */
function getFunctionSignature(
  abi: ContractAction["abi"],
  methodName: string | undefined
): string | null {
  if (!abi || !methodName) return null;

  const fn = abi.find((item) => item.name === methodName);
  if (!fn || !fn.inputs) return methodName;

  const types = fn.inputs.map((input) => input.type).join(",");
  return `${methodName}(${types})`;
}

/**
 * Races a promise against a timeout so wallet calls that never resolve
 * (e.g. a dropped WalletConnect relay session) fail loudly instead of
 * hanging the UI indefinitely.
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

export function useGovernance() {
  const chain = useCurrentChain();
  const { address } = useConnection();
  const { governorContract } = useContracts();
  const { publicClient, walletClient } = useWeb3Clients();

  /**
   * Builds a single, unconditionally safe no-op action for signal-only
   * proposals: a plain zero-value transfer to the Timelock, with no
   * calldata.
   *
   * This is just a normal transfer — it triggers the Timelock's
   * receive() function and does nothing else. No state is read or
   * written, so there's no dependency on timing and no chance of ever
   * conflicting with a separate, legitimate change to the delay that
   * happens while this proposal is still pending.
   */
  const buildNoOpAction = () => {
    const timelockAddress = config.timeLock[chain.id];
    if (!timelockAddress) {
      throw new Error("Timelock address not configured for this chain");
    }

    return { target: timelockAddress, value: 0n, calldata: "0x" as const };
  };

  /**
   * Simulate actions via Tenderly (REST API).
   * Returns simulation results for display.
   */
  const simulateActions = async (
    contractActions: ContractAction[]
  ): Promise<SimulationAction[]> => {
    const timelockAddress = config.timeLock[chain.id];
    if (!timelockAddress) {
      throw new Error("Timelock address not configured for this chain");
    }

    let actions: { to: string; calldata: string; value: string }[];
    let decodedExecutions: { signature: string | null }[];

    if (contractActions.length === 0) {
      const noOp = buildNoOpAction();
      actions = [
        { to: noOp.target, calldata: noOp.calldata, value: "0" },
      ];
      decodedExecutions = [{ signature: NO_OP_SIGNATURE_LABEL }];
    } else {
      actions = contractActions.map((action) => ({
        to: action.target,
        calldata:
          action.abi && action.method
            ? encodeFunctionData({
                abi: action.abi,
                functionName: action.method,
                args: Object.values(action.args || {}),
              })
            : "0x",
        value: action.value || "0",
      }));

      decodedExecutions = contractActions.map((action) => {
        const signature = getFunctionSignature(action.abi, action.method);
        return {
          signature,
        };
      });
    }

    const res = await fetch(SIMULATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chainId: chain.id,
        timelockAddress,
        actions,
        decodedExecutions,
      }),
    });

    if (!res.ok) {
      const body = await res
        .json()
        .catch(() => ({ error: "Simulation failed" }));
      throw new Error(body.error || "Failed to simulate actions");
    }

    const payload = (await res.json()) as { results?: SimulationAction[] };
    const results = payload.results;
    if (!results) {
      throw new Error("No simulation results returned");
    }

    return results;
  };

  /**
   * Simulate actions via a direct RPC dry-run (eth_call), for chains
   * where Tenderly isn't available yet (e.g. native LightchainAI, id 9200).
   *
   * Calls are made "from" the Timelock address, since that's the actual
   * account that executes proposal actions on-chain — simulating from the
   * connected wallet instead could pass/fail differently if a target
   * contract has address-based permission checks.
   *
   * Trade-off vs. Tenderly: no call trace, no gas breakdown, no shareable
   * sandbox link — just a real pass/fail per action, with the revert
   * reason surfaced when the RPC provides one.
   */
  const simulateActionsNative = async (
    contractActions: ContractAction[]
  ): Promise<SimulationAction[]> => {
    const timelockAddress = config.timeLock[chain.id];
    if (!timelockAddress) {
      throw new Error("Timelock address not configured for this chain");
    }

    const actionsToSimulate =
      contractActions.length === 0
        ? [
            {
              ...buildNoOpAction(),
              signature: NO_OP_SIGNATURE_LABEL,
            },
          ]
        : contractActions.map((action) => ({
            target: action.target,
            value: action.value ? parseEther(action.value) : 0n,
            calldata: (action.abi && action.method
              ? encodeFunctionData({
                  abi: action.abi,
                  functionName: action.method,
                  args: Object.values(action.args || {}),
                })
              : "0x") as `0x${string}`,
            signature: getFunctionSignature(action.abi, action.method),
          }));

    const simulatedAt = Math.floor(Date.now() / 1000);

    const results = await Promise.all(
      actionsToSimulate.map(async (action, index) => {
        try {
          await publicClient.call({
            account: timelockAddress as `0x${string}`,
            to: action.target as `0x${string}`,
            data: action.calldata,
            value: action.value,
          });

          return {
            action_index: index,
            target: action.target,
            function_selector: action.signature,
            status: "passed",
            tenderly_simulation_id: null,
            tenderly_sandbox_url: null,
            error_message: null,
            simulated_at: simulatedAt,
          } satisfies SimulationAction;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Simulation call reverted";

          return {
            action_index: index,
            target: action.target,
            function_selector: action.signature,
            status: "failed",
            tenderly_simulation_id: null,
            tenderly_sandbox_url: null,
            error_message: message,
            simulated_at: simulatedAt,
          } satisfies SimulationAction;
        }
      })
    );

    return results;
  };
  
  const createProposal = async (
    contractActions: ContractAction[],
    description: string
  ) => {
    if (!address || !walletClient) throw new Error("Wallet not connected");

    let targets: `0x${string}`[];
    let values: bigint[];
    let calldatas: `0x${string}`[];

    if (contractActions.length === 0) {
      // Governor.propose() reverts with GovernorInvalidProposalLength on
      // empty arrays, so signal-only proposals need a placeholder action.
      const noOp = buildNoOpAction();
      targets = [noOp.target as `0x${string}`];
      values = [noOp.value];
      calldatas = [noOp.calldata];
    } else {
      targets = contractActions.map((action) => action.target);
      values = contractActions.map((action) =>
        action.value ? parseEther(action.value) : 0n
      );
      calldatas = contractActions.map((action) =>
        encodeFunctionData({
          abi: action.abi || [],
          functionName: action.method,
          args: Object.values(action.args || {}),
        })
      );
    }

    const { request } = await governorContract.simulate.propose(
      [targets, values, calldatas, description],
      { account: address }
    );

    const hash = await walletClient.writeContract(request);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });

    const eventLog = decodeEventLog({
      abi: governorContract.abi,
      eventName: "ProposalCreated",
      topics: receipt.logs[0].topics,
      data: receipt.logs[0].data,
      strict: false,
    });

    return eventLog.args.proposalId;
  };

  const castVote = async (
    proposalId: string | number,
    support: number,
    reason?: string
  ) => {
    if (!address || !walletClient) throw new Error("Wallet not connected");

    let simulation:
      | SimulateContractReturnType<typeof governorContract.abi, "castVote">
      | SimulateContractReturnType<
          typeof governorContract.abi,
          "castVoteWithReason"
        >;

    if (reason) {
      simulation = await governorContract.simulate.castVoteWithReason(
        [BigInt(proposalId), support, reason],
        { account: address }
      );
    } else {
      simulation = await governorContract.simulate.castVote(
        [BigInt(proposalId), support],
        { account: address }
      );
    }

    const hash = await withTimeout(
      walletClient.writeContract(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        simulation.request as unknown as any
      ),
      60_000,
      "Wallet did not respond in time. Please check your wallet app and try again."
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });

    return receipt;
  };

  // cancel, queue, and execute share an identical flow: hash the description,
  // simulate, write, and wait for the receipt. The only difference is the method name.
  const executeLifecycleAction = async (
    action: "cancel" | "queue" | "execute",
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string
  ) => {
    if (!address || !walletClient) throw new Error("Wallet not connected");

    const descriptionHash = keccak256(encodePacked(["string"], [description]));

    // cancel is proposer-only, so the simulation must run as the connected wallet
    const { request } = (await governorContract.simulate[action](
      [targets, values, calldatas, descriptionHash],
      { account: address }
    )) as SimulateContractReturnType<
      typeof governorContract.abi,
      typeof action
    >;

    const hash = await walletClient.writeContract(request);

    return publicClient.waitForTransactionReceipt({ hash });
  };

  const cancel = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string
  ) =>
    executeLifecycleAction("cancel", targets, values, calldatas, description);

  const queue = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string
  ) => executeLifecycleAction("queue", targets, values, calldatas, description);

  const execute = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string
  ) =>
    executeLifecycleAction("execute", targets, values, calldatas, description);

  return {
    createProposal,
    simulateActions,
    simulateActionsNative,
    castVote,
    cancel,
    queue,
    execute,
  };
}
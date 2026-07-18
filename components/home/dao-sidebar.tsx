"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { Separator } from "@/components/ui/separator";
import useDelegation from "@/hooks/useDelegation";
import { useActiveProposalNotVotedForWallet } from "@/hooks/useActiveProposalNotVotedForWallet";
import {
  EMPTY_PROPOSAL_GOVERNANCE_SIGNALS,
  type ProposalGovernanceSignals,
} from "@/hooks/useProposalGovernanceSignals";
import {
  cn,
  compactNumber,
  formatCompactTimeLeftFromUnix,
  formatNumber,
} from "@/lib/utils";
import type { SpaceStats, Delegation } from "@/types";
import useCurrentChain from "@/hooks/useCurrentChain";
import config from "@/config";
import useTreasury from "@/hooks/useTreasury";
import useDexPrice from "@/hooks/useDexPrice";
import { mainnet } from "viem/chains";

interface DaoSidebarProps {
  spaceStats: SpaceStats | null;
  governanceSignals?: ProposalGovernanceSignals;
  governanceSignalsFromServer?: ProposalGovernanceSignals | null;
  userDelegation: Delegation | null;
  onDelegateClick: () => void;
  onBallotsLockerClick: () => void;
  onActiveProposalsClick?: () => void;
  isLoading?: boolean;
}

export function DaoSidebar({
  spaceStats,
  governanceSignals = EMPTY_PROPOSAL_GOVERNANCE_SIGNALS,
  governanceSignalsFromServer = null,
  userDelegation,
  onDelegateClick,
  onBallotsLockerClick,
  onActiveProposalsClick,
  isLoading,
}: DaoSidebarProps) {
  const chain = useCurrentChain();
  const { address, isConnected } = useConnection();
  const { fetchDelegationState, hasTokenContract } = useDelegation();
  const [votingPower, setVotingPower] = useState<string>("0");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [currentDelegate, setCurrentDelegate] = useState<string | null>(null);
  const { totalBalanceUSD: treasuryTotalBalanceUSD } = useTreasury();
  const { data: dexPrice } = useDexPrice();

  const voteToken = config.voteToken[chain.id];
  const underlyingToken = config.underlyingToken[chain.id];

  const loadUserData = useCallback(async () => {
    if (!address || !hasTokenContract) return;
    try {
      const state = await fetchDelegationState(address);
      setVotingPower(state.votingPowerFormatted);
      setTokenBalance(state.tokenBalanceFormatted);
      setCurrentDelegate(state.currentDelegate);
    } catch (error) {
      console.error("Failed to load user delegation state:", error);
    }
  }, [address, hasTokenContract, fetchDelegationState]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Use blockchain data as primary source, fall back to indexed data
  const hasDelegated = currentDelegate !== null || userDelegation !== null;
  const delegateAddress = currentDelegate || userDelegation?.delegate || null;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const govDisplay = governanceSignals;
  const govFromServer = governanceSignalsFromServer;
  const proposalTotalDisplay = spaceStats?.proposalCount || 0;

  const [urgencyClock, setUrgencyClock] = useState(0);
  useEffect(() => {
    if (govFromServer?.nextEndTime == null) return;
    const id = window.setInterval(() => {
      setUrgencyClock((n) => n + 1);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [govFromServer?.nextEndTime]);

  const endsInCompact = useMemo(() => {
    const endUnix = govFromServer?.nextEndTime;
    if (endUnix == null) return null;
    return formatCompactTimeLeftFromUnix(Number(endUnix));
  }, [govFromServer?.nextEndTime, urgencyClock]);

  const msRemainingUntilEnd = useMemo(() => {
    const endUnix = govFromServer?.nextEndTime;
    if (endUnix == null) return null;
    return Math.max(0, Number(endUnix) * 1000 - Date.now());
  }, [govFromServer?.nextEndTime, urgencyClock]);

  const endsInSublineColorClass = useMemo(() => {
    if (msRemainingUntilEnd == null) return "text-content-default";
    const ms = msRemainingUntilEnd;
    if (ms <= 6 * 60 * 60 * 1000) return "text-content-error-light";
    if (ms < 24 * 60 * 60 * 1000) return "text-content-warning-light";
    return "text-content-default";
  }, [msRemainingUntilEnd]);

  const useMockGovernance =
    process.env.NEXT_PUBLIC_USE_MOCK_PROPOSALS === "true";

  const showActiveVotingStatus =
    govDisplay.activeCount > 0 && (isConnected || useMockGovernance);

  const { notVotedCount: walletNotVoted, isLoading: walletNotVotedLoading } =
    useActiveProposalNotVotedForWallet(govDisplay.activeProposalIds);

  const activeNotVotedCount = useMemo(() => {
    if (!showActiveVotingStatus) return null;
    if (!isConnected || govDisplay.activeProposalIds.length === 0) {
      return null;
    }
    if (walletNotVotedLoading) return undefined;
    if (walletNotVoted === null) return undefined;
    return walletNotVoted;
  }, [
    showActiveVotingStatus,
    isConnected,
    govDisplay.activeProposalIds,
    walletNotVotedLoading,
    walletNotVoted,
  ]);

  const showActiveNotVotedParenthetical =
    typeof activeNotVotedCount === "number" && activeNotVotedCount > 0;
  const showActiveAllVotedLine =
    typeof activeNotVotedCount === "number" && activeNotVotedCount === 0;

  const showActiveEndsIn =
    govFromServer != null &&
    govFromServer.activeCount > 0 &&
    endsInCompact != null &&
    !showActiveAllVotedLine;

  const activeSublineClass = "w-full pl-3 text-xs leading-snug";

  const activeRowShellClass = cn(
    "flex w-full flex-col gap-0.5 rounded-md py-0.5 text-left",
    onActiveProposalsClick &&
      "transition-colors hover:bg-surface-soft active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  const activeRowInner = (
    <>
      <div className="flex w-full justify-between gap-2 items-start text-sm">
        <span className="shrink-0 font-semibold text-content-primary">
          Active
        </span>
        <span className="min-w-0 text-right font-mono tabular-nums leading-snug">
          <span className="font-semibold text-content-primary">
            {compactNumber(govDisplay.activeCount)}
          </span>
          {showActiveNotVotedParenthetical ? (
            <span className="font-normal">
              <span className="text-content-secondary"> (</span>
              <span className="text-content-warning-light">
                {activeNotVotedCount} not voted
              </span>
              <span className="text-content-secondary">)</span>
            </span>
          ) : null}
        </span>
      </div>
      {showActiveAllVotedLine && (
        <p
          className={cn(
            activeSublineClass,
            "font-sans font-normal text-content-success-light",
          )}
        >
          ✓ All voted
        </p>
      )}
      {showActiveEndsIn && (
        <p
          className={cn(
            activeSublineClass,
            "tabular-nums font-mono",
            endsInSublineColorClass,
          )}
        >
          Ends in {endsInCompact}
        </p>
      )}
    </>
  );

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{spaceStats?.name || "Lightchain AI DAO"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between gap-2 text-sm items-start py-0.5">
                  <span className="shrink-0 text-content-secondary">
                    Proposals
                  </span>
                  <span className="min-w-0 text-right font-mono tabular-nums">
                    <span className="font-medium text-content-primary">
                      {compactNumber(proposalTotalDisplay)}
                    </span>{" "}
                    <span className="font-sans font-normal text-content-secondary">
                      total
                    </span>
                  </span>
                </div>
                {onActiveProposalsClick ? (
                  <button
                    type="button"
                    onClick={onActiveProposalsClick}
                    className={activeRowShellClass}
                  >
                    {activeRowInner}
                  </button>
                ) : (
                  <div className={activeRowShellClass}>{activeRowInner}</div>
                )}
                <div className="flex justify-between gap-2 text-sm items-start py-0.5">
                  <span className="shrink-0 text-content-secondary">
                    Pending
                  </span>
                  <span className="min-w-0 text-right font-normal text-content-secondary font-mono tabular-nums">
                    {compactNumber(govDisplay.pendingCount)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-content-secondary">Delegates</span>
                <span className="font-medium text-content-primary">
                  {compactNumber(spaceStats?.delegateCount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-content-secondary">Treasury</span>
                <span className="font-medium text-content-primary">
                  ~${formatNumber(treasuryTotalBalanceUSD)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-content-secondary">LCAI Price</span>
                <span className="font-medium text-content-primary">
                  {dexPrice?.lcaiPrice
                    ? `~$${formatNumber(dexPrice.lcaiPrice, 6)}`
                    : "-"}
                </span>
              </div>
            </div>

            {isConnected && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-content-primary">
                    Your Voting Power
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-content-secondary">Voting Power</span>
                    <span className="font-medium text-content-primary">
                      {compactNumber(parseFloat(votingPower))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-content-secondary">
                      {voteToken?.symbol} Balance
                    </span>
                    <span className="font-medium text-content-primary">
                      {compactNumber(parseFloat(tokenBalance))}
                    </span>
                  </div>
                  {delegateAddress &&
                    delegateAddress !==
                      "0x0000000000000000000000000000000000000000" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-content-secondary">
                          Delegated to
                        </span>
                        <span className="font-medium text-content-primary">
                          {delegateAddress.toLowerCase() ===
                          address?.toLowerCase()
                            ? "Self"
                            : truncateAddress(delegateAddress)}
                        </span>
                      </div>
                    )}
                  {/* Show hint when user has tokens but no voting power */}
                  {parseFloat(tokenBalance) > 0 &&
                    parseFloat(votingPower) === 0 &&
                    !hasDelegated && (
                      <p className="text-xs text-amber-500">
                        Delegate to yourself to activate your voting power
                      </p>
                    )}
                </div>
              </>
            )}

            <Separator />

            {/* Helper text for ballots */}
            {chain.id === mainnet.id && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Need voting power?
                  </span>{" "}
                  Wrap your {underlyingToken.symbol} tokens into{" "}
                  {voteToken.symbol} to vote on proposals and participate in
                  governance.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {chain.id === mainnet.id && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onBallotsLockerClick}
                  >
                    Wrap/Unwrap
                  </Button>
                )}
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onDelegateClick}
                  disabled={!isConnected}
                >
                  {!isConnected
                    ? "Connect"
                    : hasDelegated
                    ? "Delegate"
                    : "Delegate"}
                </Button>
              </div>
              {isConnected && address && (
                <Button
                  variant="outline"
                  className="w-full"
                  href={`/profile/${address}`}
                >
                  View profile
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

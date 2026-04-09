"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useDeferredValue,
} from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { Button } from "@/components/common/Button";
import { faPlus } from "@fortawesome/pro-regular-svg-icons";
import ProposalFilter from "@/components/proposal/ProposalFilter";
import type { ProposalFilters } from "@/components/proposal/ProposalFilter";
import { ProposalListItem } from "@/components/proposal/proposal-list-item";
import LoadingBlock from "@/components/loading-block";
import useGraphqlApi from "@/hooks/useGraphqlApi";
import { useGovernorHasVotedBatch } from "@/hooks/useGovernorHasVotedBatch";
import { sortProposalsByPriorityDesc } from "@/lib/sortProposalsByPriorityDesc";
import { cn } from "@/lib/utils";
import { ProposalState } from "@/lib/constents";
import type { ProposalSortOption, ProposalsFilter } from "@/types";

interface ProposalsListProps {
  spaceId: string;
  /** Increment from parent (e.g. sidebar) to apply Active status filter when opening this tab. */
  activeListFocusToken?: number;
}

export function ProposalsList({
  spaceId,
  activeListFocusToken = 0,
}: ProposalsListProps) {
  const { theme } = useTheme();
  const api = useGraphqlApi();
  const { address, isConnected } = useConnection();

  const [filters, setFilters] = useState<ProposalFilters>({
    status: "all",
    createdBy: "all",
    search: "",
    sortBy: "priority-desc",
    hasExecution: "all",
    minVotes: "",
  });

  const lastActiveFocusToken = useRef(0);
  useEffect(() => {
    if (activeListFocusToken > lastActiveFocusToken.current) {
      lastActiveFocusToken.current = activeListFocusToken;
      setFilters((prev) => ({ ...prev, status: "active" }));
    }
  }, [activeListFocusToken]);

  const handleFilterChange = useCallback((name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Build API filter from UI state
  const apiFilter = useMemo((): ProposalsFilter => {
    const f: ProposalsFilter = {};

    const apiStateMap: Record<string, ProposalsFilter["state"]> = {
      active: "active",
      pending: "pending",
      succeeded: "closed",
      queued: "closed",
      defeated: "closed",
      expired: "closed",
      executed: "closed",
    };

    if (filters.status === "canceled") {
      f.state = "closed";
      f.cancelled = true;
    } else if (filters.status !== "all" && apiStateMap[filters.status]) {
      f.state = apiStateMap[filters.status];
    }

    // Min votes
    if (filters.minVotes && parseInt(filters.minVotes) > 0) {
      f.vote_count_gte = parseInt(filters.minVotes);
    }

    return f;
  }, [filters.status, filters.minVotes]);

  const { isLoading, data: proposalsFromApi = [] } = useQuery({
    queryKey: [
      "proposals-list",
      filters.search,
      filters.sortBy,
      filters.status,
      filters.minVotes,
    ],
    queryFn: () =>
      api.loadProposals(
        { limit: 50, skip: 0 },
        Math.floor(Date.now() / 1000),
        apiFilter,
        filters.search,
        filters.sortBy as ProposalSortOption,
      ),
  });

  const proposals = proposalsFromApi;

  // Client-side filtering for createdBy (needs wallet address) and hasExecution
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      // Client-side sub-filter: API only supports active/pending/closed,
      // so we refine closed results by exact ProposalState
      const stateMap: Record<string, number[]> = {
        succeeded: [4],  // ProposalState.Succeeded
        queued: [5],     // ProposalState.Queued
        defeated: [3],   // ProposalState.Defeated
        canceled: [2],   // ProposalState.Canceled
        expired: [6],    // ProposalState.Expired
        executed: [7],   // ProposalState.Executed
      };
      if (
        filters.status !== "all" &&
        stateMap[filters.status] &&
        !stateMap[filters.status].includes(proposal.state)
      ) {
        return false;
      }

      // CreatedBy filter
      if (filters.createdBy === "me" && address) {
        if (proposal.author.id.toLowerCase() !== address.toLowerCase()) {
          return false;
        }
      }

      // Has execution filter
      if (filters.hasExecution === "yes" && proposal.executions.length === 0) {
        return false;
      }
      if (filters.hasExecution === "no" && proposal.executions.length > 0) {
        return false;
      }

      return true;
    });
  }, [proposals, filters.status, filters.createdBy, filters.hasExecution, address]);

  const proposalIdsForVoteLookup = useMemo(() => {
    if (filters.sortBy === "priority-desc") {
      return filteredProposals.map((p) => p.proposal_id);
    }
    return filteredProposals
      .filter((p) => p.state === ProposalState.Active)
      .map((p) => p.proposal_id);
  }, [filteredProposals, filters.sortBy]);

  const { byProposalId, isLoading: voteBatchLoading } =
    useGovernorHasVotedBatch(proposalIdsForVoteLookup);

  const sortedFilteredProposals = useMemo(() => {
    if (filters.sortBy !== "priority-desc") {
      return filteredProposals;
    }
    return sortProposalsByPriorityDesc(filteredProposals, {
      isConnected,
      address,
      byProposalId,
      voteBatchLoading,
    });
  }, [
    filteredProposals,
    filters.sortBy,
    byProposalId,
    voteBatchLoading,
    address,
    isConnected,
  ]);

  const displayProposals = useDeferredValue(sortedFilteredProposals);

  const priorityVoteSortPending =
    filters.sortBy === "priority-desc" &&
    isConnected &&
    !!address &&
    voteBatchLoading;

  return (
    <div>
      <ProposalFilter filters={filters} onFilterChange={handleFilterChange} />

      <div className="mt-4">
        {isLoading ? (
          <LoadingBlock />
        ) : displayProposals.length ? (
          <div
            className={cn(
              "divide-y divide-border-default transition-opacity duration-200",
              priorityVoteSortPending && "opacity-60",
            )}
          >
            {displayProposals.map((proposal) => (
              <ProposalListItem
                key={proposal.id}
                proposal={proposal}
                walletHasVotedOnActive={
                  proposal.state === ProposalState.Active
                    ? isConnected && address
                      ? voteBatchLoading || !byProposalId
                        ? null
                        : (byProposalId[proposal.proposal_id] ?? null)
                      : undefined
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center pt-15 pb-15">
            <Image
              className="max-w-30 sm:max-w-max"
              src={
                theme === "dark"
                  ? "/images/icons/folder-black.png"
                  : "/images/icons/folder-white.png"
              }
              width={167}
              height={132}
              alt="Folder icon"
            />
            <div className="text-center">
              <h4 className="text-2xl font-semibold leading-[1.20] -tracking-[0.24px] text-content-primary mb-2">
                No proposals found
              </h4>
              <p className="text-content-default -tracking-[0.16px]">
                Create your first proposal
              </p>
            </div>
            <Button
              leftIcon={faPlus}
              href="/proposal/create"
              variant="primary"
              size="lg"
            >
              Create Proposal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

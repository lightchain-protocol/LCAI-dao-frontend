"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../common/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";
import {
  faArrowDownWideShort,
  faBan,
  faBolt,
  faChartLine,
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
  faClock,
  faClockRotateLeft,
  faHourglassHalf,
  faMagnifyingGlass,
  faPlus,
  faSliders,
  faSquareCheck,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import type { ProposalSortOption } from "@/types";

export interface ProposalFilters {
  status: string;
  createdBy: string;
  search: string;
  sortBy: ProposalSortOption;
  hasExecution: string;
  minVotes: string;
}

interface ProposalFilterProps {
  filters: ProposalFilters;
  onFilterChange: (name: string, value: string) => void;
}

const selectTriggerClass =
  "px-2.5 py-1.5 rounded-full border bg-surface-x-soft border-border-default text-sm sm:text-lg font-semibold leading-[1.3] tracking-[-0.18px] text-content-primary focus-visible:ring-0 shadow-none";
const selectContentClass =
  "rounded-2xl border border-border-default bg-surface-soft backdrop-blur-xl py-3 min-w-[224px]";
const selectItemClass =
  "py-2.5 px-2 font-semibold leading-[1] tracking-[-0.16px] text-content-secondary cursor-pointer hover:bg-surface-x-soft outline-none";

const ProposalFilter = ({ filters, onFilterChange }: ProposalFilterProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-2xl">
      {/* Search input */}
      <div className="relative">
        <button className="absolute top-1/2 left-4 -translate-y-1/2 text-content-primary">
          <FontAwesomeIcon className="size-[18px]" icon={faMagnifyingGlass} />
        </button>
        <input
          className="h-14 w-full border border-border-default text-content-primary outline-none focus:border-primary placeholder:text-content-soft text-body-15 ring-0 bg-surface-x-soft rounded-t-2xl py-2 pr-4 pl-11"
          type="search"
          placeholder="Search Proposal, id and others"
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>

      {/* Filter section */}
      <div className="flex flex-wrap justify-between gap-x-5 gap-y-3 py-3 px-4 border-x border-b border-border-default">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-4">
          {/* Status Filter */}
          <Select
            onValueChange={(v) => onFilterChange("status", v)}
            value={filters.status}
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Active Proposals" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="all" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4"
                  icon={faTableCells}
                />
                All
              </SelectItem>
              <SelectItem value="active" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4 text-content-success-light"
                  icon={faChartLine}
                />
                Active
              </SelectItem>
              <SelectItem value="pending" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4"
                  icon={faHourglassHalf}
                />
                Pending
              </SelectItem>
              <SelectItem value="succeeded" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4 text-content-success-light"
                  icon={faSquareCheck}
                />
                Succeeded
              </SelectItem>
              <SelectItem value="queued" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4"
                  icon={faClock}
                />
                Queued
              </SelectItem>
              <SelectItem value="defeated" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4 text-red-500"
                  icon={faCircleXmark}
                />
                Defeated
              </SelectItem>
              <SelectItem value="canceled" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4"
                  icon={faBan}
                />
                Canceled
              </SelectItem>
              <SelectItem value="expired" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4"
                  icon={faClockRotateLeft}
                />
                Expired
              </SelectItem>
              <SelectItem value="executed" className={selectItemClass}>
                <FontAwesomeIcon
                  className="inline-block size-4 text-content-success-light"
                  icon={faCircleCheck}
                />
                Executed
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            onValueChange={(v) => onFilterChange("sortBy", v)}
            value={filters.sortBy}
          >
            <SelectTrigger
              className={cn(selectTriggerClass, "gap-1.5 [&_[data-slot=select-value]]:min-w-0")}
            >
              <FontAwesomeIcon
                className="inline-block size-4 shrink-0"
                icon={faArrowDownWideShort}
              />
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <SelectValue placeholder="Newest" />
                {filters.sortBy === "priority-desc" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-content-secondary hover:text-content-primary inline-flex shrink-0 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="What Priority sort means"
                        onClick={(e) => e.preventDefault()}
                      >
                        <FontAwesomeIcon
                          icon={faCircleInfo}
                          className="pointer-events-none size-3.5"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={6}
                      className="max-w-[min(20rem,calc(100vw-2rem))] text-pretty"
                    >
                      Priority = proposals needing your vote, ending soonest
                      first
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem
                value="priority-desc"
                className={selectItemClass}
                title="Priority = proposals needing your vote, ending soonest first"
              >
                <FontAwesomeIcon
                  className="inline-block size-4 text-content-warning-light"
                  icon={faBolt}
                />
                Priority
              </SelectItem>
              <SelectItem value="created-desc" className={selectItemClass}>
                Newest First
              </SelectItem>
              <SelectItem value="created-asc" className={selectItemClass}>
                Oldest First
              </SelectItem>
              <SelectItem value="vote_count-desc" className={selectItemClass}>
                Most Votes
              </SelectItem>
              <SelectItem value="scores_total-desc" className={selectItemClass}>
                Most Participation
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-2.5 py-1.5 rounded-full border bg-surface-x-soft border-border-default text-sm sm:text-lg font-semibold leading-[1.3] tracking-[-0.18px] text-content-primary hover:bg-surface-soft transition-colors"
          >
            <FontAwesomeIcon
              className="inline-block size-4 mr-1"
              icon={faSliders}
            />
            Filters
          </button>
        </div>

        <Button
          leftIcon={faPlus}
          href="/proposal/create"
          variant="outline"
          size="lg"
        >
          Create Proposal
        </Button>
      </div>

      {/* Advanced filters row */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3 px-4 rounded-b-2xl border-x border-b border-border-default bg-surface-x-soft">
          {/* Min Votes */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-content-secondary whitespace-nowrap">
              Min Votes
            </label>
            <input
              type="number"
              min="0"
              className="w-20 px-2.5 py-1.5 rounded-full border bg-surface-x-soft border-border-default text-sm font-semibold text-content-primary outline-none focus:border-primary"
              placeholder="0"
              value={filters.minVotes}
              onChange={(e) => onFilterChange("minVotes", e.target.value)}
            />
          </div>
        </div>
      )}

      {!showAdvanced && <div className="rounded-b-2xl" />}
    </div>
  );
};

export default ProposalFilter;

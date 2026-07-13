"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { compactNumber } from "@/lib/utils";
import type { Delegate } from "@/types";
import CopyButton from "../CopyButton";

interface DelegateListItemProps {
  delegate: Delegate;
  rank?: number;
  onClick?: () => void;
}

export function DelegateListItem({
  delegate,
  rank,
  onClick,
}: DelegateListItemProps) {
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const generateAvatarUrl = (address: string) => {
    return `https://effigy.im/a/${address}.png`;
  };

  const truncatedAddress = truncateAddress(delegate.address);
  const displayName = delegate.label ?? truncatedAddress;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 ${
        onClick ? "cursor-pointer hover:bg-surface-soft transition-colors" : ""
      }`}
      onClick={onClick}
    >
      {rank && (
        <span className="w-6 text-center text-sm font-medium text-content-secondary">
          {rank}
        </span>
      )}

      <Avatar className="h-10 w-10">
        <AvatarImage
          src={generateAvatarUrl(delegate.address)}
          alt={displayName}
        />
        <AvatarFallback>
          {delegate.address.slice(2, 4).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${delegate.address}`}
            className="font-medium text-content-primary truncate hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {displayName}
          </Link>

          {delegate.label && (
            <span className="shrink-0 text-xs text-content-secondary">
              {truncatedAddress}
            </span>
          )}

          <CopyButton
            text={delegate.address}
            className="size-6 shrink-0 text-content-muted hover:text-content-primary [&_svg:not([class*='size-'])]:size-3"
          />

          {delegate.isContract && (
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] font-normal text-content-secondary"
            >
              Contract, cannot vote
            </Badge>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-content-primary">
          {compactNumber(delegate.votingPowerParsed)}
        </p>
        <p className="text-xs text-content-secondary">voting power</p>
      </div>
    </div>
  );
}

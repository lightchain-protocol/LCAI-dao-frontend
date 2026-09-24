"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import useDunaApi from "@/hooks/useDunaApi";
import type { DiscordMember } from "@/graphqlApi/duna";
import { cn } from "@/lib/utils";

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function MemberRow({ member }: { member: DiscordMember }) {
  const display = member.nick || member.globalName;
  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={member.avatarUrl} alt="" className="size-9 rounded-full shrink-0 bg-surface-soft" />
      <div className="min-w-0">
        <div className="font-medium text-content-primary truncate">{display ?? `@${member.username}`}</div>
        <div className="text-sm text-content-secondary truncate">
          {display ? `@${member.username}` : <span className="font-mono text-xs">{member.id}</span>}
        </div>
      </div>
    </div>
  );
}

export function DiscordMemberSearch({
  value,
  onChange,
}: {
  value: DiscordMember | null;
  onChange: (member: DiscordMember | null) => void;
}) {
  const api = useDunaApi();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(query.trim(), 300);

  const { data: members = [], isFetching, error } = useQuery({
    queryKey: ["discord-member-search", debounced],
    enabled: debounced.length >= 2,
    staleTime: 60_000,
    retry: false,
    queryFn: ({ signal }) => api.searchDiscordMembers(debounced, signal),
  });

  useEffect(() => setHighlight(0), [members]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (member: DiscordMember) => {
    onChange(member);
    setQuery("");
    setOpen(false);
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-soft p-3">
        <MemberRow member={value} />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md p-1.5 text-content-secondary hover:bg-surface-soft hover:text-content-primary"
          aria-label="Clear selected member"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const showDropdown = open && debounced.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-content-secondary" />
        <Input
          value={query}
          placeholder="Search Discord members by username or nickname…"
          className="pl-9 pr-9 h-11"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!showDropdown || !members.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, members.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              select(members[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-content-secondary" />
        )}
      </div>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="mt-1.5 text-xs text-content-secondary">Type at least 2 characters.</p>
      )}

      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border-default bg-background shadow-lg"
        >
          {error ? (
            <div className="p-4 text-sm text-[#E93544]">{(error as Error).message}</div>
          ) : !isFetching && members.length === 0 ? (
            <div className="p-4 text-sm text-content-secondary">No members found for “{debounced}”.</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {members.map((m, i) => (
                <li
                  key={m.id}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(m);
                  }}
                  className={cn("cursor-pointer px-3 py-2", i === highlight && "bg-surface-soft")}
                >
                  <MemberRow member={m} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

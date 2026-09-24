import { createDunaApi } from "@/graphqlApi/duna";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3000";

export default function useDunaApi() {
  return useMemo(() => createDunaApi(API_ENDPOINT), []);
}

/** Resolves a Discord user (avatar, display name) by snowflake ID; null if not in the server. */
export function useDiscordMember(discordId: string | null | undefined) {
  const api = useDunaApi();
  return useQuery({
    queryKey: ["discord-member", discordId],
    enabled: !!discordId,
    staleTime: 5 * 60_000,
    // "Not in the server" resolves to null; errors are transient (e.g. Discord rate limits).
    retry: 2,
    retryDelay: (attempt) => 1000 * 2 ** attempt,
    queryFn: () => api.loadDiscordMember(discordId!),
  });
}

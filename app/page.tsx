"use client";

import BallotsLockerModal from "@/components/ballots-locker";
import { DelegateModal } from "@/components/delegation/delegate-modal";
import { DaoSidebar } from "@/components/home/dao-sidebar";
import { ParticipantsList } from "@/components/home/participants-list";
import { ProposalsList } from "@/components/home/proposals-list";
import { RecentProposals } from "@/components/home/recent-proposals";
import { RisingDelegates } from "@/components/home/rising-delegates";
import { StatsCard } from "@/components/home/stats-card";
import { TreasuryDashboard } from "@/components/treasury/treasury-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import config from "@/config";
import useCurrentChain from "@/hooks/useCurrentChain";
import useGraphqlApi from "@/hooks/useGraphqlApi";
import {
  EMPTY_PROPOSAL_GOVERNANCE_SIGNALS,
  useProposalGovernanceSignals,
} from "@/hooks/useProposalGovernanceSignals";
import { compactNumber } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Home, Users, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useConnection } from "wagmi";

const DASHBOARD_TAB_VALUES = [
  "home",
  "proposals",
  "participants",
  "treasury",
] as const;
type DashboardTab = (typeof DASHBOARD_TAB_VALUES)[number];

function isDashboardTab(value: string): value is DashboardTab {
  return (DASHBOARD_TAB_VALUES as readonly string[]).includes(value);
}

function HomePageLoading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <div className="mb-6 h-12 w-full max-w-2xl animate-pulse rounded-xl bg-surface-soft" />
      <div className="h-64 w-full animate-pulse rounded-2xl bg-surface-soft" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const api = useGraphqlApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { address } = useConnection();
  const chain = useCurrentChain();

  const activeTab = useMemo((): DashboardTab => {
    const raw = searchParams.get("tab");
    if (raw && isDashboardTab(raw)) return raw;
    return "home";
  }, [searchParams]);

  const setActiveTab = useCallback(
    (value: string) => {
      if (!isDashboardTab(value)) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value === "home") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const [proposalsActiveFocusToken, setProposalsActiveFocusToken] =
    useState(0);
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [ballotsLockerOpen, setBallotsLockerOpen] = useState(false);

  // Get governor address as space ID
  const spaceId = config.governor[chain.id];

  // Fetch proposals
  const {
    isLoading: isLoadingProposals,
    data: proposals = [],
    refetch: refetchProposals,
  } = useQuery({
    queryKey: ["proposals"],
    queryFn: () =>
      api.loadProposals(
        { limit: 20, skip: 0 },
        Math.floor(Date.now() / 1000),
        undefined,
        "",
        "priority-desc",
      ),
  });

  const proposalsForHome = proposals;

  // Fetch delegates
  const {
    isLoading: isLoadingDelegates,
    data: delegates = [],
    refetch: refetchDelegates,
  } = useQuery({
    queryKey: ["delegates", spaceId],
    queryFn: () => api.loadDelegates(spaceId, { limit: 50, skip: 0 }),
    enabled: !!spaceId,
  });

  // Fetch space stats
  const { isLoading: isLoadingStats, data: spaceStats } = useQuery({
    queryKey: ["spaceStats", spaceId],
    queryFn: () => api.loadSpaceStats(spaceId),
    enabled: !!spaceId,
  });

  const { data: governanceSignals } = useProposalGovernanceSignals();
  const governanceSignalsDisplay =
    governanceSignals ?? EMPTY_PROPOSAL_GOVERNANCE_SIGNALS;

  // Fetch user delegation
  const { data: userDelegation } = useQuery({
    queryKey: ["userDelegation", spaceId, address],
    queryFn: () => api.loadUserDelegation(spaceId, address!),
    enabled: !!spaceId && !!address,
  });

  const handleDelegateSuccess = useCallback(() => {
    refetchDelegates();
    refetchProposals();
    queryClient.invalidateQueries({ queryKey: ["proposalGovernanceSignals"] });
  }, [queryClient, refetchDelegates, refetchProposals]);

  const handleViewAllProposals = useCallback(() => {
    setActiveTab("proposals");
  }, [setActiveTab]);

  const handleViewAllParticipants = useCallback(() => {
    setActiveTab("participants");
  }, [setActiveTab]);

  const handleSidebarActiveProposalsClick = useCallback(() => {
    setProposalsActiveFocusToken((t) => t + 1);
    setActiveTab("proposals");
  }, [setActiveTab]);
  const tabTriggerClassName =
    "flex-0 gap-2 text-base lg:text-lg font-medium leading-none tracking-[-0.18px] py-2.5 md:py-3 lg:py-4 px-3 md:px-4 lg:px-6 rounded-md md:rounded-t-2xl rounded-b-none border-none bg-[#ededf96b] dark:bg-surface-base-dark data-[state=active]:bg-[image:var(--gradient-primary)] text-content-primary data-[state=active]:text-white";

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 border-b border-border-default w-full flex gap-1 overflow-x-auto">
          <TabsTrigger value="home" className={tabTriggerClassName}>
            <Home className="h-4 w-4" />
            Home
          </TabsTrigger>
          <TabsTrigger value="proposals" className={tabTriggerClassName}>
            <FileText className="h-4 w-4" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="participants" className={tabTriggerClassName}>
            <Users className="h-4 w-4" />
            Participants
          </TabsTrigger>
          <TabsTrigger value="treasury" className={tabTriggerClassName}>
            <Wallet className="h-4 w-4" />
            Treasury
          </TabsTrigger>
          {/* <TabsTrigger value="governance" className={tabTriggerClassName}>
            <Settings className="h-4 w-4" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="ai-config" className={tabTriggerClassName}>
            <Settings className="h-4 w-4" />
            AI Config
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="home">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Proposals"
                  value={
                    <>
                      <span>{compactNumber(spaceStats?.proposalCount ?? 0)}</span>
                      <span className="text-base font-normal text-content-secondary">
                        {" "}
                        (
                        <span className="font-semibold text-content-success-light">
                          {compactNumber(governanceSignalsDisplay.activeCount)}{" "}
                          Active
                        </span>
                        )
                      </span>
                    </>
                  }
                  icon={<FileText className="h-6 w-6 text-content-primary" />}
                  className="bg-[rgba(204,206,239,0.02)] bg-[linear-gradient(143deg,rgba(255,255,255,0.04)_61.49%,rgba(12,166,249,0.16)_106.01%),url('/images/bg/bg-wave-lines.png')] bg-cover bg-center bg-no-repeat"
                />
                <StatsCard
                  title="Delegates"
                  value={spaceStats?.delegateCount || 0}
                  icon={<Users className="h-6 w-6 text-content-primary" />}
                  className="bg-[rgba(204,206,239,0.02)] bg-[linear-gradient(147deg,rgba(255,255,255,0.04)_56.39%,rgba(255,166,13,0.22)_106.26%),url('/images/bg/bg-wave-lines.png')] bg-cover bg-center bg-no-repeat"
                />
              </div>

              {/* Recent proposals */}
              <RecentProposals
                proposals={proposalsForHome}
                isLoading={isLoadingProposals}
                onViewAll={handleViewAllProposals}
              />

              {/* Rising delegates */}
              <RisingDelegates
                delegates={delegates}
                isLoading={isLoadingDelegates}
                onViewAll={handleViewAllParticipants}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <DaoSidebar
                  spaceStats={spaceStats || null}
                  governanceSignals={governanceSignalsDisplay}
                  governanceSignalsFromServer={governanceSignals ?? null}
                  userDelegation={userDelegation || null}
                  onDelegateClick={() => setDelegateModalOpen(true)}
                  onBallotsLockerClick={() => setBallotsLockerOpen(true)}
                  onActiveProposalsClick={handleSidebarActiveProposalsClick}
                  isLoading={isLoadingStats}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proposals">
          <ProposalsList
            spaceId={spaceId}
            activeListFocusToken={proposalsActiveFocusToken}
          />
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantsList
            delegates={delegates}
            isLoading={isLoadingDelegates}
          />
        </TabsContent>

        <TabsContent value="treasury">
          <TreasuryDashboard />
        </TabsContent>

        {/* <TabsContent value="governance">
          <Governance />
        </TabsContent>

        <TabsContent value="ai-config">
          <AiConfig />
        </TabsContent> */}
      </Tabs>

      <DelegateModal
        open={delegateModalOpen}
        onOpenChange={setDelegateModalOpen}
        onSuccess={handleDelegateSuccess}
      />

      <BallotsLockerModal
        open={ballotsLockerOpen}
        onOpenChange={setBallotsLockerOpen}
        onSuccess={handleDelegateSuccess}
      />
    </div>
  );
}

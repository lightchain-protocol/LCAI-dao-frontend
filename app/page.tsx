"use client";

import AiConfig from "@/components/ai-config/ai-config";
import BallotsLockerModal from "@/components/ballots-locker";
import { DelegateModal } from "@/components/delegation/delegate-modal";
import Governance from "@/components/governance/governance";
import { DaoSidebar } from "@/components/home/dao-sidebar";
import { ParticipantsList } from "@/components/home/participants-list";
import { VotingPowerView } from "@/components/home/voting-power-view";
import { ProposalsList } from "@/components/home/proposals-list";
import { RecentProposals } from "@/components/home/recent-proposals";
import { RisingDelegates } from "@/components/home/rising-delegates";
import { StatsCard } from "@/components/home/stats-card";
import { TreasuryDashboard } from "@/components/treasury/treasury-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import config from "@/config";
import useCurrentChain from "@/hooks/useCurrentChain";
import useGraphqlApi from "@/hooks/useGraphqlApi";
import { useQuery } from "@tanstack/react-query";
import { FileText, Home, Settings, Users, Vote, Wallet } from "lucide-react";
import { useCallback, useState } from "react";
import { useConnection } from "wagmi";
export default function HomePage() {
  const api = useGraphqlApi();
  const { address } = useConnection();
  const chain = useCurrentChain();
  const [activeTab, setActiveTab] = useState("home");
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
      api.loadProposals({ limit: 20, skip: 0 }, Math.floor(Date.now() / 1000)),
  });

  // Participants = addresses that have engaged with governance (delegated),
  // from the indexer. Holding LCAI alone is not participation, so this stays
  // the delegate list; the raw voting-power distribution lives in its own tab.
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

  // Fetch user delegation
  const { data: userDelegation } = useQuery({
    queryKey: ["userDelegation", spaceId, address],
    queryFn: () => api.loadUserDelegation(spaceId, address!),
    enabled: !!spaceId && !!address,
  });

  const handleDelegateSuccess = useCallback(() => {
    refetchDelegates();
    refetchProposals();
  }, [refetchDelegates, refetchProposals]);

  const handleViewAllProposals = () => setActiveTab("proposals");
  const handleViewAllParticipants = () => setActiveTab("participants");
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
          <TabsTrigger value="voting-power" className={tabTriggerClassName}>
            <Vote className="h-4 w-4" />
            Power Distribution
          </TabsTrigger>
          <TabsTrigger value="treasury" className={tabTriggerClassName}>
            <Wallet className="h-4 w-4" />
            Treasury
          </TabsTrigger>
          <TabsTrigger value="governance" className={tabTriggerClassName}>
            <Settings className="h-4 w-4" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="ai-config" className={tabTriggerClassName}>
            <Settings className="h-4 w-4" />
            AI Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Proposals"
                  value={spaceStats?.proposalCount || 0}
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
                proposals={proposals}
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
                  userDelegation={userDelegation || null}
                  onDelegateClick={() => setDelegateModalOpen(true)}
                  onBallotsLockerClick={() => setBallotsLockerOpen(true)}
                  isLoading={isLoadingStats}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proposals">
          <ProposalsList spaceId={spaceId} />
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantsList
            delegates={delegates}
            isLoading={isLoadingDelegates}
          />
        </TabsContent>

        <TabsContent value="voting-power">
          <VotingPowerView />
        </TabsContent>

        <TabsContent value="treasury">
          <TreasuryDashboard />
        </TabsContent>

        <TabsContent value="governance">
          <Governance />
        </TabsContent>

        <TabsContent value="ai-config">
          <AiConfig />
        </TabsContent>
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

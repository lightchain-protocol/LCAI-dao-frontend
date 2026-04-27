"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGovernance } from "@/hooks/useGovernance";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { ContractActionDialog } from "@/components/contract-action-dialog";
import { ContractAction, SimulationAction } from "@/types";
import { SimulationResultsTable } from "@/components/proposal/simulation-results-table";
import {
  ArrowLeft,
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
  CodeIcon,
  CoinsIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import Markdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAppKit } from "@reown/appkit/react";
import { useConnection, useBalance, useReadContract } from "wagmi";
import config from "@/config";
import $dayjs from "@/lib/dayjs";
import { Button } from "@/components/common/Button";
import {
  faCodeSimple,
  faLoader,
  faPaperPlane,
} from "@fortawesome/pro-regular-svg-icons";
import { Button as ButtonUi } from "@/components/ui/button";
import { compactNumber } from "@/lib/utils";
import useCurrentChain from "@/hooks/useCurrentChain";
import governorAbi from "@/contracts/abi/governorAbi";
import { formatEther } from "viem";
import { useTokenBalance } from "@/hooks/useTokenBalance";

const choices = [
  {
    id: "1",
    label: "For",
    icon: <CircleCheckIcon className="size-5 text-green-500" />,
  },
  {
    id: "2",
    label: "Against",
    icon: <CircleXIcon className="size-5 text-red-500" />,
  },
  {
    id: "3",
    label: "Abstain",
    icon: <CircleMinusIcon className="size-5 text-gray-500" />,
  },
] as const;

// Zod schema for form validation
const proposalFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters"),
  // discussion: z
  //   .string()
  //   .refine((val) => val === "" || z.string().url().safeParse(val).success, {
  //     message: "Must be a valid URL or empty",
  //   }),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export default function CreateProposal() {
  const router = useRouter();
  const { createProposal, simulateActions } = useGovernance();
  const [actions, setActions] = useState<ContractAction[]>([]);
  const { open } = useAppKit();
  const { isConnected } = useConnection();
  const chain = useCurrentChain();
  const { address } = useConnection();

  const voteToken = config.voteToken[chain.id];

  const voteTokenBalance = useTokenBalance({
    address: address!,
    token: voteToken.address as `0x${string}` | undefined,
  });

  const proposalMin = useReadContract({
    address: config.governor[chain.id],
    abi: governorAbi,
    functionName: "proposalThreshold",
  });

  // Initialize React Hook Form with Zod validation
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      // discussion: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [descriptionView, setDescriptionView] = useState<"edit" | "preview">(
    "edit"
  );
  const [editingAction, setEditingAction] = useState<ContractAction | null>(
    null
  );
  const [dialogType, setDialogType] = useState<"send" | "contract">("contract");
  const [simulationStatus, setSimulationStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [simulationResults, setSimulationResults] = useState<
    SimulationAction[]
  >([]);

  const openDialog = (type: "send" | "contract", action?: ContractAction) => {
    setDialogType(type);
    setEditingAction(action || null);
    setIsDialogOpen(true);
  };

  const simulateActionsMutation = useMutation({
    mutationFn: simulateActions,
    onSuccess: (results) => {
      setSimulationResults(results);
      const allPassed = results.every((r) => r.status === "passed");
      if (allPassed) {
        toast.success("All simulations passed");
        setSimulationStatus("success");
      } else {
        const failedCount = results.filter((r) => r.status === "failed").length;
        toast.error(`${failedCount} simulation(s) failed`);
        setSimulationStatus("error");
      }
    },
    onError: (error) => {
      console.error("Error simulating proposal actions:", error);
      toast.error("Execution simulation failed");
      setSimulationStatus("error");
      setSimulationResults([]);
    },
  });

  const saveAction = (action: ContractAction) => {
    if (editingAction) {
      // Update existing action
      setActions((prev) =>
        prev.map((t) => (t.id === editingAction.id ? action : t))
      );
    } else {
      // Add new action
      setActions((prev) => [...prev, action]);
    }

    // Reset simulation when actions change
    setSimulationStatus("idle");
    setSimulationResults([]);

    setIsDialogOpen(false);
    setEditingAction(null);
  };

  const deleteAction = (id: string) => {
    setActions((prev) => prev.filter((t) => t.id !== id));
    // Reset simulation when actions change
    setSimulationStatus("idle");
    setSimulationResults([]);
  };

  const handleSubmit = async (values: ProposalFormValues) => {
    // if (!actions.length) {
    //   toast.error("Please add at least one action");
    //   return;
    // }

    // Validate form data is present
    if (!values.title || !values.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (actions.length) {
      if (simulationStatus === "idle") {
        await simulateActionsMutation.mutateAsync(actions);
      }

      if (simulationStatus === "error") {
        toast.error("Execution simulation failed");
        return;
      }
    }

    if (
      voteTokenBalance.data &&
      proposalMin.data &&
      voteTokenBalance.data.value < proposalMin.data
    ) {
      toast.error(
        `You don't have enough voting power to create a proposal. You need at least ${compactNumber(
          formatEther(proposalMin.data)
        )} ${voteToken?.symbol} to create a proposal.`
      );
      return;
    }

    createProposalMutation.mutate();
  };

  const createProposalMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const fullDescription = `# ${values.title}\n\n## **Overview**\n\n${values.description}`;

      return createProposal(actions, fullDescription);
    },
    onSuccess: () => {
      toast.success("Proposal created successfully!");
      router.push("/");
    },
    onError: (error) => {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal. Please try again.");
    },
  });

  return (
    <>
      <div className="border-b border-border-default">
        <div className="container mx-auto py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-content-primary hover:text-content-secondary transition-colors duration-200"
          >
            <ArrowLeft size={16} /> New Proposal
          </Link>
        </div>
      </div>
      <div className="container mx-auto pt-8 pb-14 sm:pb-20 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_355px] gap-8 xl:gap-16">
          {/* Main Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* <div className="flex items-center w-full py-2 px-3 rounded border text-[17px] bg-rose-100 border-rose-300 text-rose-500 dark:bg-rose-700 dark:border-rose-700 dark:text-neutral-100 mb-4">
              <InfoIcon className="size-5 mr-2" />
              You need to be a member of the space in order to create a
              proposal.
            </div> */}

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter proposal title"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel className="text-sm font-medium">
                        Description (Markdown){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex rounded-md border border-border-default p-0.5 bg-muted/30">
                        <button
                          type="button"
                          onClick={() => setDescriptionView("edit")}
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            descriptionView === "edit"
                              ? "bg-background text-content-primary shadow-sm"
                              : "text-content-secondary hover:text-content-primary"
                          }`}
                        >
                          <PencilIcon className="size-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDescriptionView("preview")}
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            descriptionView === "preview"
                              ? "bg-background text-content-primary shadow-sm"
                              : "text-content-secondary hover:text-content-primary"
                          }`}
                        >
                          <EyeIcon className="size-3.5" />
                          Preview
                        </button>
                      </div>
                    </div>
                    <FormControl>
                      {descriptionView === "edit" ? (
                        <div className="border rounded-md overflow-hidden">
                          <MDXEditor
                            className="mdx_editor_root"
                            markdown={field.value}
                            onChange={field.onChange}
                            placeholder="Propose something..."
                            plugins={[
                              headingsPlugin(),
                              listsPlugin(),
                              quotePlugin(),
                              thematicBreakPlugin(),
                              linkPlugin(),
                              linkDialogPlugin(),
                              imagePlugin(),
                              tablePlugin(),
                              codeBlockPlugin({
                                defaultCodeBlockLanguage: "js",
                              }),
                              codeMirrorPlugin({
                                codeBlockLanguages: {
                                  js: "JavaScript",
                                  ts: "TypeScript",
                                  sol: "Solidity",
                                  json: "JSON",
                                },
                              }),
                              markdownShortcutPlugin(),
                              toolbarPlugin({
                                toolbarContents: () => (
                                  <>
                                    <UndoRedo />
                                    <BoldItalicUnderlineToggles />
                                    <ListsToggle />
                                    <CreateLink />
                                    <InsertImage />
                                    <InsertTable />
                                    <InsertThematicBreak />
                                    <CodeToggle />
                                  </>
                                ),
                              }),
                            ]}
                            contentEditableClassName="min-h-[200px] prose prose-sm dark:prose-invert max-w-none px-4 py-3"
                          />
                        </div>
                      ) : (
                        <div className="min-h-[200px] rounded-md border border-border-default bg-background px-4 py-3">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <Markdown>
                              {field.value || "*No content yet.*"}
                            </Markdown>
                          </div>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discussion */}
              {/* <FormField
                control={form.control}
                name="discussion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Discussion URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. https://forum.balancer.fi/t/proposal..."
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-content-secondary">
                      Link to forum discussion or other relevant resources
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Execution */}
              <Card className="py-4">
                <div className="px-6 border-b pb-4">
                  <div className="flex flex-wrap items-center justify-between">
                    <h4 className="text-xl font-semibold text-content-primary">
                      Execution
                    </h4>
                    <div className="flex items-center gap-2">
                      {/* <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => openDialog('send')}
                  >
                    <CoinsIcon />
                    Send Token
                  </Button> */}
                      <Button
                        leftIcon={faCodeSimple}
                        variant="outline"
                        type="button"
                        onClick={() => openDialog("contract")}
                      >
                        Add Contract Call
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-content-primary mb-3 uppercase">
                      Actions
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {actions.length > 0 ? (
                      actions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {/* <ArrowDownUpIcon className="h-4 w-4 text-muted-foreground" /> */}
                              {action.type === "send" ? (
                                <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <CodeIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-sm font-medium">
                              {action.method} to {action.target.slice(0, 6)}
                              ...
                              {action.target.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => openDialog(action.type, action)}
                            >
                              <PencilIcon className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => deleteAction(action.id)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty className="border border-dashed">
                        <EmptyHeader>
                          <EmptyTitle>No Actions</EmptyTitle>
                          <EmptyDescription>
                            Add actions to your proposal.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            leftIcon={faCodeSimple}
                            variant="outline"
                            type="button"
                            onClick={() => openDialog("contract")}
                          >
                            Add Contract Call
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-sm text-content-secondary">
                      {actions.length} action{actions.length === 1 ? "" : "s"}
                    </span>
                    <ButtonUi
                      variant={
                        simulationStatus === "idle"
                          ? "outline"
                          : simulationStatus === "success"
                          ? "success"
                          : "error"
                      }
                      size="sm"
                      className="h-8"
                      type="button"
                      disabled={
                        simulateActionsMutation.isPending ||
                        actions.length === 0
                      }
                      onClick={() => simulateActionsMutation.mutate(actions)}
                    >
                      {simulateActionsMutation.isPending ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheckIcon className="size-4" />
                      )}
                      Simulate Execution
                    </ButtonUi>
                  </div>

                  {/* Simulation Results */}
                  {simulationResults.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <SimulationResultsTable
                        simulations={simulationResults}
                        defaultExpanded={true}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                {isConnected ? (
                  <Button
                    variant="primary"
                    leftIcon={
                      createProposalMutation.isPending ? faLoader : faPaperPlane
                    }
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={createProposalMutation.isPending}
                  >
                    Publish
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="button"
                    size="lg"
                    className="flex-1"
                    onClick={() => open()}
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </form>
          </Form>

          {/* Sidebar */}
          <div className="lg:sticky top-10 space-y-10 rounded-2xl h-max border border-border-default bg-surface-x-soft p-6">
            {/* LCAI Governor */}
            <div>
              <div className="border-b border-border-default mb-3.5">
                <h6 className="font-medium text-content-primary text-sm mb-2.5">
                  LCAI Governor
                </h6>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary text-sm">
                    Total supply
                  </span>
                  <span className="ml-auto text-content-primary text-sm">
                    {compactNumber(config.daoSystem.totalSupply)}{" "}
                    {voteToken?.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary text-sm">
                    Proposal threshold
                  </span>
                  <span className="ml-auto text-content-primary text-sm">
                    {compactNumber(config.daoSystem.proposalThreshold)}{" "}
                    {voteToken?.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary text-sm">
                    Quorum needed
                  </span>
                  <span className="ml-auto text-content-primary text-sm">
                    {config.daoSystem.quorumNeeded}% (
                    {compactNumber(
                      (config.daoSystem.totalSupply *
                        config.daoSystem.quorumNeeded) /
                        100
                    )}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary text-sm">
                    Proposal delay
                  </span>
                  <span className="ml-auto text-content-primary text-sm">
                    {$dayjs
                      .duration(config.daoSystem.proposalDelay, "seconds")
                      .humanize()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary text-sm">
                    Voting period
                  </span>
                  <span className="ml-auto text-content-primary text-sm">
                    {$dayjs
                      .duration(config.daoSystem.votingPeriod, "seconds")
                      .humanize()}
                  </span>
                </div>
              </div>
            </div>
            {/* Choices */}
            <div>
              <h6 className="font-medium text-content-primary text-sm mb-2.5">
                Choices
              </h6>
              <div className="space-y-3">
                {choices.map((choice) => (
                  <div
                    key={choice.id}
                    className="flex items-center gap-2 bg-border rounded-lg px-2 py-2"
                  >
                    {choice.icon}
                    <span>{choice.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Timeline */}
            {/* <Card>
            <CardHeader>
              <CardTitle className="font-bold">TIMELINE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Created</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString()} ·{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Start</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-6">
                    Edit
                  </Button>
                </div>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">End</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-6">
                    Edit
                  </Button>
                </div>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card> */}
          </div>
        </div>

        {/* Contract Action Dialog */}
        <ContractActionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={saveAction}
          editingAction={editingAction}
          dialogType={dialogType}
        />
      </div>
    </>
  );
}

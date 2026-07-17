"use client";

import { useState, useCallback, useEffect } from "react";
import { useConnection } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BaseError, isAddress } from "viem";
import useDelegation from "@/hooks/useDelegation";
import { compactNumber } from "@/lib/utils";
import { toast } from "sonner";

interface DelegateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DelegateModal({
  open,
  onOpenChange,
  onSuccess,
}: DelegateModalProps) {
  const { address } = useConnection();
  const {
    delegate,
    delegateToSelf,
    fetchDelegationState,
    isConfirming,
    isConfirmed,
    hasTokenContract,
  } = useDelegation();

  const [customAddress, setCustomAddress] = useState("");
  const [mode, setMode] = useState<"self" | "custom">("self");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingPower, setVotingPower] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [currentDelegate, setCurrentDelegate] = useState<string | null>(null);

  const loadUserState = useCallback(async () => {
    if (!address || !hasTokenContract) return;
    try {
      const state = await fetchDelegationState(address);
      setVotingPower(state.votingPowerFormatted);
      setTokenBalance(state.tokenBalanceFormatted);
      setCurrentDelegate(state.currentDelegate);
    } catch (error) {
      console.error("Failed to load user state:", error);
    }
  }, [address, hasTokenContract, fetchDelegationState]);

  useEffect(() => {
    if (open) {
      loadUserState();
    }
  }, [open, loadUserState]);

  useEffect(() => {
    if (isConfirmed && isSubmitting) {
      setIsSubmitting(false);
      toast.success("Delegation successful!");
      onSuccess?.();
      onOpenChange(false);
    }
  }, [isConfirmed, isSubmitting, onSuccess, onOpenChange]);

  const handleDelegate = async () => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      if (mode === "self") {
        await delegateToSelf();
      } else {
        if (!isAddress(customAddress)) {
          toast.error("Invalid address");
          setIsSubmitting(false);
          return;
        }
        await delegate(customAddress as `0x${string}`);
      }
    } catch (error) {
      console.error("Delegation failed:", error);
      const reason =
        error instanceof BaseError
          ? error.shortMessage
          : "Delegation failed. Please try again.";
      toast.error(reason);
      setIsSubmitting(false);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const generateAvatarUrl = (addr: string) => {
    return `https://effigy.im/a/${addr}.png`;
  };

  const isLoading = isSubmitting || isConfirming;

  const isDelegatedElsewhere =
    !!currentDelegate &&
    !!address &&
    currentDelegate.toLowerCase() !== address.toLowerCase();

  const isReturningVotes = mode === "self" && isDelegatedElsewhere;
  const actionLabel = isReturningVotes ? "Return votes" : "Delegate";
  const loadingLabel = isReturningVotes ? "Returning votes..." : "Delegating...";

  // You delegate the weight of the tokens you hold (your balance), not your
  // current voting power. They differ once you delegate away or receive
  // delegations from others.
  const balanceAmount = parseFloat(tokenBalance);
  const votingPowerAmount = parseFloat(votingPower);

  // Votes others delegated to you. These are not yours to re-delegate, so they
  // never count toward the amount you can delegate.
  const ownContribution = isDelegatedElsewhere ? 0 : balanceAmount;
  const incomingVotes = Math.max(0, votingPowerAmount - ownContribution);

  // Delegation moves the weight of tokens you hold. With a zero balance there
  // is nothing to delegate, even if others delegated voting power to you.
  const canDelegate = balanceAmount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delegate Voting Power</DialogTitle>
          <DialogDescription>
            Delegate your voting power to yourself or another address. You can
            change your delegation at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentDelegate && (
            <div className="rounded-lg bg-surface-soft p-3">
              <p className="text-sm text-content-secondary">
                Currently delegated to
              </p>
              <p className="font-medium text-content-primary">
                {isDelegatedElsewhere
                  ? `${truncateAddress(currentDelegate)} (your ${compactNumber(
                      balanceAmount,
                    )} LCAI)`
                  : "Yourself"}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMode("self")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                mode === "self"
                  ? "border-primary bg-primary/5"
                  : "border-border-default hover:border-border-hover"
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={address ? generateAvatarUrl(address) : undefined}
                  alt="Your avatar"
                />
                <AvatarFallback>
                  {address?.slice(2, 4).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium text-content-primary">
                  {isDelegatedElsewhere
                    ? "Return votes to yourself"
                    : "Delegate to yourself"}
                </p>
                <p className="text-sm text-content-secondary">
                  {isDelegatedElsewhere
                    ? "Undelegate and restore your own voting power"
                    : address
                    ? truncateAddress(address)
                    : "Connect wallet"}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  mode === "self"
                    ? "border-primary bg-primary"
                    : "border-content-secondary"
                }`}
              >
                {mode === "self" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                mode === "custom"
                  ? "border-primary bg-primary/5"
                  : "border-border-default hover:border-border-hover"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-surface-soft flex items-center justify-center text-content-secondary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-content-primary">
                  Delegate to custom address
                </p>
                <p className="text-sm text-content-secondary">
                  Enter any Ethereum address
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  mode === "custom"
                    ? "border-primary bg-primary"
                    : "border-content-secondary"
                }`}
              >
                {mode === "custom" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          </div>

          {mode === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="delegateAddress">Delegate Address</Label>
              <Input
                id="delegateAddress"
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />
              {customAddress && !isAddress(customAddress) && (
                <p className="text-sm text-red-500">Invalid address format</p>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-content-secondary">Your LCAI balance</span>
              <span className="font-medium text-content-primary">
                {compactNumber(balanceAmount)} LCAI
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-content-secondary">Your voting power</span>
              <span className="font-medium text-content-primary">
                {compactNumber(votingPowerAmount)}
              </span>
            </div>
            {incomingVotes > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-content-secondary">Delegated to you</span>
                <span className="font-medium text-content-primary">
                  {compactNumber(incomingVotes)} LCAI
                </span>
              </div>
            )}
          </div>

          {canDelegate ? (
            <p className="text-xs text-content-secondary">
              You will delegate the full weight of your {compactNumber(balanceAmount)}{" "}
              LCAI. It cannot be split into a partial amount, and your tokens never
              leave your wallet.
            </p>
          ) : (
            <p className="text-xs text-amber-500">
              You hold 0 LCAI, so there is nothing to delegate. Your{" "}
              {compactNumber(votingPowerAmount)} voting power was delegated to you by
              others and cannot be re-delegated.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleDelegate}
            disabled={
              isLoading ||
              !address ||
              !canDelegate ||
              (mode === "custom" && !isAddress(customAddress))
            }
          >
            {isLoading ? loadingLabel : actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

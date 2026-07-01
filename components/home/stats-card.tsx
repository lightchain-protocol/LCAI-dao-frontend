"use client";

import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  info?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  info,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-center gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-soft border border-border-soft">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm leading-[1.42] text-content-secondary">
              {title}
            </p>
            {info && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`About ${title}`}
                    className="text-content-secondary hover:text-content-primary"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  {info}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="whitespace-nowrap text-xl font-semibold leading-[1.33] text-content-primary sm:text-2xl">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

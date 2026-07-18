"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({ title, value, icon, className }: StatsCardProps) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-center gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-soft border border-border-soft">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-[1.42] text-content-secondary">{title}</p>
          <div className="flex flex-wrap items-baseline gap-x-1 text-2xl font-semibold leading-[1.33] text-content-primary">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

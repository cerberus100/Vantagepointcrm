"use client";

import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants = {
    high: {
      className: "bg-bad/15 text-bad border-bad/30",
      label: "High"
    },
    medium: {
      className: "bg-warn/15 text-warn border-warn/30",
      label: "Medium"
    },
    low: {
      className: "bg-good/15 text-good border-good/30",
      label: "Low"
    }
  };

  const variant = variants[priority];

  return (
    <Badge 
      variant="outline" 
      className={`${variant.className} border font-medium ${className}`}
    >
      {variant.label}
    </Badge>
  );
}

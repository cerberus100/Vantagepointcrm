"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subLabel?: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

export function MetricCard({ icon: Icon, label, value, subLabel, trend }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="glass-panel p-6 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-muted text-sm font-medium">{label}</p>
            <div className="space-y-1">
              <p className="text-accent text-3xl font-bold">{value}</p>
              {subLabel && (
                <p className="text-muted text-sm">{subLabel}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-good" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-bad" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend.direction === 'up' ? 'text-good' : 'text-bad'
                  }`}>
                    {trend.value}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="accent-chip">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

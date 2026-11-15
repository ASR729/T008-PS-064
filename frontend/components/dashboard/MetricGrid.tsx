"use client";

import React from "react";
import { MetricCard } from "../ui/MetricCard";
import { MOCK_METRICS } from "../../lib/mock-data";
import { useToast } from "../ui/Toast";

export interface MetricGridProps {
  onCardClick?: (metricId: string) => void;
}

export const MetricGrid: React.FC<MetricGridProps> = ({ onCardClick }) => {
  const { addToast } = useToast();

  const handleMetricClick = (id: string, title: string, value: string) => {
    addToast({
      title: `${title} Details`,
      description: `Current simulated value: ${value}. Calculated deterministically across all active admissions.`,
      type: "info",
    });
    onCardClick?.(id);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {MOCK_METRICS.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          trend={metric.trend}
          statusColor={metric.statusColor}
          iconName={metric.iconName}
          onClick={() =>
            handleMetricClick(metric.id, metric.title, metric.value)
          }
        />
      ))}
    </div>
  );
};

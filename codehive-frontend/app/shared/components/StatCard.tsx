import React from "react";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  textDark?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  accent,
  textDark = false,
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 hover:shadow-lg hover:border-azure/50 dark:hover:border-yellow/50 transition-all duration-300 hover:-translate-y-0.5">
      <div
        className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${accent} ${
          textDark ? "text-imperial" : "text-white"
        } mb-3`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

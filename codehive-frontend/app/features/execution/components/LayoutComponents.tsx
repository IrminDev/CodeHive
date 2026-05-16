import React from "react";
import { Separator as PanelResizeHandle } from "react-resizable-panels";

export function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-azure dark:text-yellow border-b-2 border-azure dark:border-yellow"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function ResizeHandle({ direction }: { direction: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center z-10 transition-colors duration-150 ${
        direction === "horizontal"
          ? "w-1.5 cursor-col-resize bg-gray-200 dark:bg-gray-700/50 hover:bg-azure/20 dark:hover:bg-yellow/10"
          : "h-1.5 cursor-row-resize bg-gray-200 dark:bg-gray-700/50 hover:bg-azure/20 dark:hover:bg-yellow/10"
      }`}
    >
      <div
        className={`rounded-full bg-gray-400 dark:bg-gray-500 group-hover:bg-azure dark:group-hover:bg-yellow transition-colors duration-150 ${
          direction === "horizontal" ? "w-0.5 h-8" : "h-0.5 w-8"
        }`}
      />
    </PanelResizeHandle>
  );
}

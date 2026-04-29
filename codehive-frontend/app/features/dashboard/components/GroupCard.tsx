import React from "react";
import type { Group } from "../types/dashboard.types";

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden shadow-sm dark:shadow-lg border border-gray-200 dark:border-[#2a2a2a] flex flex-col h-full hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-colors cursor-pointer group">
      <div className={`${group.colorClass} p-6 h-32 flex flex-col justify-end relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
        <h3 className="text-xl font-bold text-white z-10">{group.name}</h3>
        <p className="text-white/80 text-sm z-10">{group.subject}</p>
      </div>
      
      <div className="p-5 flex flex-col gap-3 flex-grow text-gray-600 dark:text-gray-300">
        <div className="flex justify-between items-center text-sm">
          <span>Pending Practices</span>
          <span className="font-medium text-gray-900 dark:text-white">{group.pendingPractices}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>In Progress</span>
          <span className="font-medium text-gray-900 dark:text-white">{group.inProgress}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-auto pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
          <span>Next Deadline</span>
          <span className="font-medium text-gray-900 dark:text-white">{group.nextDeadline}</span>
        </div>
      </div>
    </div>
  );
};

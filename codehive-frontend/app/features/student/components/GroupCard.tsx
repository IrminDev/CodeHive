import type { Group } from "../types/group.types";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <div className="group bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 hover:border-azure/50 dark:hover:border-yellow/50 transition-all duration-500 hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5 hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col">
      <div className={`${group.colorClass} h-28 p-5 flex flex-col justify-end relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
        <h3 className="text-base font-bold text-white z-10 leading-tight">{group.name}</h3>
        <p className="text-white/75 text-xs z-10 mt-0.5">{group.subject}</p>
      </div>
      <div className="p-4 flex flex-col gap-2.5 flex-1 text-sm">
        <Row label="Pending" value={group.pendingPractices} highlight={group.pendingPractices > 0} />
        <Row label="In Progress" value={group.inProgress} />
        <div className="pt-3 mt-auto border-t border-gray-100 dark:border-gray-700/50">
          <Row label="Next Deadline" value={group.nextDeadline} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium ${highlight ? "text-azure dark:text-yellow" : "text-gray-900 dark:text-white"}`}>
        {value}
      </span>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { GroupCard } from "../components/GroupCard";
import type { Group } from "../types/dashboard.types";
import { getGroups } from "../api/dashboard.api";
import { useAuth } from "~/core/providers/AuthProvider";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const totalPending = groups.reduce(
    (acc, group) => acc + group.pendingPractices,
    0,
  );

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You have {totalPending} pending{" "}
          {totalPending === 1 ? "practice" : "practices"} across your groups
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          My Groups
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-[#1e1e1e] rounded-xl h-64 border border-gray-200 dark:border-[#2a2a2a] animate-pulse shadow-sm dark:shadow-none"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

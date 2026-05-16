import React from "react";
import { STUDENT_STATS_ICONS } from "../config/dashboard.config";

export function getStudentStats(
  totalPending: number,
  groupsCount: number,
  inProgressCount: number,
  assignmentsCount: number
) {
  return [
    {
      label: "Pending",
      value: totalPending,
      icon: STUDENT_STATS_ICONS.pending,
      accent: "from-azure to-french",
    },
    {
      label: "Groups",
      value: groupsCount,
      icon: STUDENT_STATS_ICONS.groups,
      accent: "from-french to-imperial",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: STUDENT_STATS_ICONS.inProgress,
      accent: "from-azure to-french",
    },
    {
      label: "Assignments",
      value: assignmentsCount,
      icon: STUDENT_STATS_ICONS.assignments,
      accent: "from-yellow to-gold",
    },
  ];
}

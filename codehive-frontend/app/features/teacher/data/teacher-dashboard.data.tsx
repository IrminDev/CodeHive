import React from "react";

export const MOCK_STATS_DATA = {
  totalAssignments: 12,
  activeGroups: 4,
  totalStudents: 87,
  pendingReviews: 5,
};

export const MOCK_ASSIGNMENTS = [
  { id: "1", title: "Binary Search Implementation", language: "PYTHON", status: "ACTIVE", submissions: 42, dueDate: "Jun 1, 2026" },
  { id: "2", title: "Sorting Algorithms", language: "JAVA", status: "ACTIVE", submissions: 28, dueDate: "May 25, 2026" },
  { id: "3", title: "Graph Traversal", language: "CPP", status: "PENDING", submissions: 0, dueDate: "Jun 15, 2026" },
  { id: "4", title: "Dynamic Programming Basics", language: "PYTHON", status: "ACTIVE", submissions: 17, dueDate: "May 30, 2026" },
];

export const TEACHER_STATS_CONFIG = [
  {
    label: "Total Assignments",
    value: MOCK_STATS_DATA.totalAssignments,
    gradient: "from-azure to-french",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Active Groups",
    value: MOCK_STATS_DATA.activeGroups,
    gradient: "from-french to-imperial",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Total Students",
    value: MOCK_STATS_DATA.totalStudents,
    gradient: "from-yellow to-gold",
    textDark: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
      </svg>
    ),
  },
  {
    label: "Pending Reviews",
    value: MOCK_STATS_DATA.pendingReviews,
    gradient: "from-gold to-yellow",
    textDark: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

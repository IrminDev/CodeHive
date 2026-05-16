import type { Group } from "../types/group.types";

const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Fundamentos de programación",
    subject: "Primer semestre",
    colorClass: "bg-blue-600",
    pendingPractices: 2,
    inProgress: 1,
    nextDeadline: "May 2, 2026",
  },
  {
    id: "2",
    name: "Algoritmos y Estructuras de Datos",
    subject: "Segundo semestre",
    colorClass: "bg-teal-500",
    pendingPractices: 0,
    inProgress: 1,
    nextDeadline: "May 5, 2026",
  },
  {
    id: "3",
    name: "Análisis y Diseño de Algoritmos",
    subject: "Tercer semestre",
    colorClass: "bg-orange-500",
    pendingPractices: 1,
    inProgress: 0,
    nextDeadline: "April 30, 2026",
  },
];

export async function getGroups(): Promise<Group[]> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_GROUPS), 500));
}
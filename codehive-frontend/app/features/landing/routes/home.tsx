import type { Route } from "./+types/home";
import { LandingPage } from "../pages/LandingPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CodeHive - Where Coding Meets Classroom" },
    { name: "description", content: "The modern platform for teaching programming. Create coding challenges, automate grading, and help students master programming skills — all in one collaborative platform." },
    { name: "keywords", content: "coding education, programming classroom, auto-grading, coding challenges, teach programming, online code editor" },
    { property: "og:title", content: "CodeHive - Where Coding Meets Classroom" },
    { property: "og:description", content: "Empower your teaching with CodeHive. Create coding challenges, automate grading, and help students master programming skills." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "CodeHive - Where Coding Meets Classroom" },
    { name: "twitter:description", content: "The modern platform for teaching programming. Create, evaluate, and inspire." },
  ];
}

export default function Home() {
  return <LandingPage />;
}

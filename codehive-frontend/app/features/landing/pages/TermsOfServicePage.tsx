import { Link } from "react-router";
import { LegalPage, legalLinkClass, type LegalSection } from "../components/LegalPage";

const sections: LegalSection[] = [
  {
    id: "terms-scope", title: "Using CodeHive",
    content: <>
      <p>These terms govern use of CodeHive’s programming education features. The operator is the institution or organization providing your account. Use the platform only with its authorization and in accordance with these terms, applicable law, and your institution’s course and academic integrity rules.</p>
      <p>Your institution is responsible for deciding who may use its deployment and obtaining any permissions required for its users. If you cannot meet the applicable requirements, do not use the affected service and contact your administrator.</p>
    </>,
  },
  {
    id: "terms-account", title: "Accounts and access",
    content: <>
      <p>Use your assigned account, provide accurate information, keep passwords and recovery links private, and report suspected misuse. Do not impersonate another person, share access credentials, or access groups, submissions, grades, or administrative features without permission.</p>
      <p>Access depends on your role, account status, enrollment, and assignment availability. Authorized administrators can restrict or deactivate accounts, and group owners can manage enrollment and course access. Contact your institution to resolve access decisions.</p>
    </>,
  },
  {
    id: "terms-content", title: "Coursework and content",
    content: <>
      <p>You and the applicable rights holders retain the rights you hold in uploaded materials. Submit only code, tests, explanations, or other content you are permitted to use and share. By submitting content, you permit the operator and its configured providers to store, process, execute, and display it to authorized users as needed to provide the requested features.</p>
      <p>Teachers and authorized administrators can review coursework and related history within their permissions. Do not upload secrets, unnecessary personal data, confidential third-party material, or content that violates another person’s rights. Keep your own copies of important work.</p>
    </>,
  },
  {
    id: "terms-conduct", title: "Acceptable use",
    content: <>
      <p>Use code execution for legitimate programming exercises. Do not attack the platform or others, attempt to escape the sandbox, steal data, probe accounts without authorization, distribute malicious code, evade rate limits, or intentionally exhaust shared resources.</p>
      <p>Do not bypass access controls, assistant safeguards, or teacher-set restrictions. Follow assignment collaboration and AI-use rules. Automated evaluation or AI assistance does not authorize plagiarism or misrepresentation of authorship.</p>
    </>,
  },
  {
    id: "terms-ai", title: "AI assistance",
    content: <>
      <p>AI help is available only when enabled and subject to assignment policy, answer quotas, provider availability, and eligibility. It is intended to support learning through explanations, questions, and permitted short snippets. It is not a guarantee of a complete solution, correct answer, or grade.</p>
      <p>Review the sharing notice before asking. Questions, public assignment context, and relevant earlier conversation are sent to the provider; editor code and execution context require their separate sharing choices. Verify AI output yourself and follow your teacher’s instructions.</p>
      <p>Use of Gemini-powered assistance must satisfy the <a href="https://ai.google.dev/gemini-api/terms" className={legalLinkClass}>provider’s terms</a>, including its age and regional restrictions. The Gemini API terms currently require users to be at least 18 and prohibit API clients directed toward, or likely to be accessed by, people under 18. The operator must ensure its enabled AI service is eligible for its audience.</p>
      <p>CodeHive’s educational checks can reduce inappropriate responses, but AI can still be inaccurate, incomplete, or unsuitable. Do not rely on it for medical, legal, financial, or other high-stakes decisions.</p>
    </>,
  },
  {
    id: "terms-results", title: "Evaluation, grades, and availability",
    content: <>
      <p>Automated execution compares code against configured tests and reports results; teachers control grades and written feedback. Passing tests is not a guarantee that a program is correct in every situation. Ask your teacher about grading, deadlines, and disputed results.</p>
      <p>Execution queues, maintenance, provider failures, policy changes, or technical errors may delay or interrupt service. CodeHive does not guarantee uninterrupted availability, instant evaluation, saved unsent work, or a particular educational outcome. To the extent permitted by applicable law, the service is provided as available without additional warranties; rights that cannot lawfully be excluded remain unaffected.</p>
    </>,
  },
  {
    id: "terms-retention", title: "Privacy and retained records",
    content: <>
      <p>The <Link to="/privacy" className={legalLinkClass}>Privacy Policy</Link> explains stored information, browser storage, provider sharing, and retention. Removing access, leaving a group, or deleting an assignment does not necessarily erase submission, grading, or audit history.</p>
      <p>Execution artifacts may expire while summary records and submitted source remain. Archiving or deleting a group erases its retained assistant text without resetting usage. Do not treat the platform as a permanent backup service.</p>
    </>,
  },
  {
    id: "terms-contact", title: "Questions and changes",
    content: <>
      <p>Contact the institution or CodeHive administrator that provided your account for support, privacy requests, account issues, or questions about these terms. Your institution’s agreements and applicable law may provide additional rights or requirements.</p>
      <p>These terms may be updated as the service changes. The current version’s date appears above. The operator is responsible for providing any notice or obtaining any acceptance required for changes.</p>
    </>,
  },
];

export function TermsOfServicePage() {
  return <LegalPage active="terms" title="Terms of Service" description="Ground rules for accounts, coursework, code execution, and optional AI assistance."
    summary="Use your assigned account responsibly, submit only content you may share, and follow your institution’s rules. Automated results and AI guidance can have limitations; teachers remain responsible for course grading."
    sections={sections} />;
}

import { Link } from "react-router";
import { LegalPage, legalLinkClass, type LegalSection } from "../components/LegalPage";

const sections: LegalSection[] = [
  {
    id: "privacy-scope", title: "Who this notice covers",
    content: <>
      <p>This notice describes information handled by CodeHive for students, teachers, administrators, and visitors. The operator is the institution or organization providing your CodeHive account. Contact that institution or its CodeHive administrator with privacy questions.</p>
      <p>Your institution may provide additional notices and academic record requirements. This page describes platform behavior; it does not replace those notices or applicable data protection law.</p>
    </>,
  },
  {
    id: "privacy-data", title: "Information stored and why",
    content: <dl className="space-y-4">
      <div><dt className="font-semibold text-gray-900 dark:text-gray-100">Account and access</dt><dd>Name, surname, email, enrollment number, role, permissions, account status, and creation dates identify users and control access. Passwords are stored as hashes. Recovery records contain hashed reset tokens, expiration, and use status.</dd></div>
      <div><dt className="font-semibold text-gray-900 dark:text-gray-100">Classes and academic work</dt><dd>Groups, enrollment history, assignment descriptions, examples, reference solutions, test data, submitted source code, execution results, grades, grading history, and feedback support teaching, evaluation, and progress reports.</dd></div>
      <div><dt className="font-semibold text-gray-900 dark:text-gray-100">AI assistance</dt><dd>Questions, approved answers, interaction status, timestamps, selected execution identifiers, answer usage, and model-call metadata support conversation history, help limits, reliability, and usage reporting. Technical usage records include provider/model identifiers, timing, outcomes, and token counts when available.</dd></div>
      <div><dt className="font-semibold text-gray-900 dark:text-gray-100">Notifications and operations</dt><dd>Email preferences, reminder timing, timezone, dispatch records, administrative audit events, and rate-limit/security records help deliver account/course messages, troubleshoot service issues, and prevent misuse.</dd></div>
    </dl>,
  },
  {
    id: "privacy-access", title: "Access and service providers",
    content: <>
      <p>Students can access their own work and released grades/feedback. Group owners can review student submissions, execution evidence, academic history, and AI usage statistics for their coursework. Administrative access is restricted by role and permissions. Authorized deployment operators may access stored records for maintenance and support.</p>
      <p>Hosting, database, file storage, code execution, and email services process the information needed to run the deployment. Account and course emails may contain names, assignment information, and links. Delivery depends on the operator’s configured email provider.</p>
      <p>Browsers request fonts from Google Fonts and editor assets from jsDelivr. These external requests disclose connection information, such as IP address and browser request headers, to those providers. See <a href="https://policies.google.com/privacy" className={legalLinkClass}>Google’s Privacy Policy</a>.</p>
    </>,
  },
  {
    id: "privacy-ai", title: "What is shared with AI",
    content: <>
      <p>When you ask the enabled assistant, CodeHive sends your question, public assignment details, and relevant retained conversation to Google Gemini for generation and safety review. Editor code and the latest eligible execution context are included only when you select their separate sharing controls for that question. Private assignment tests and reference source are excluded from assistant context.</p>
      <p>Your question and approved answer are stored in conversation history. Opted-in code and execution context are not saved as separate chat attachments; submitted code and execution artifacts can still exist in the normal coursework records. Teachers see AI usage statistics rather than student conversation text through the teacher usage views.</p>
      <p>Google’s treatment of inputs and outputs depends on the configured service and billing tier. Its unpaid Gemini API terms permit use for product improvement and human review; paid-service terms provide different handling. CodeHive does not promise that provider data is never retained or used for improvement. Review the <a href="https://ai.google.dev/gemini-api/terms" className={legalLinkClass}>Gemini API terms</a> and ask your administrator which service is configured.</p>
      <p>Do not include passwords, API keys, personal information, confidential material, or code you are not authorized to share in questions or shared context. Using other features does not require asking the assistant.</p>
    </>,
  },
  {
    id: "privacy-browser", title: "Browser storage",
    content: <>
      <p>Local browser storage keeps your sign-in token, theme, code drafts, workspace preferences, assistant-panel state, and acceptance of the AI sharing notice. These records help maintain your session and recover work in that browser.</p>
      <p>Signing out removes the sign-in token, but drafts and preferences may remain on the device. On shared devices, sign out and clear site data when finished. Clearing site data can remove unsent drafts and remembered settings; it does not delete coursework already stored on the server.</p>
    </>,
  },
  {
    id: "privacy-retention", title: "Retention and deletion",
    content: <>
      <p>Accounts and academic records are retained for teaching, history, administration, and the institution’s record obligations. Leaving a group, withdrawing work, deactivating an account, or deleting an assignment does not automatically erase those records.</p>
      <p>Practice execution artifacts normally expire after 24 hours; definitive execution reports and diagnostic artifacts normally expire after 90 days. Cleanup can occur later, or earlier following deletion under the configured cleanup policy. Submitted source code and summary records are retained separately; these periods are not promises to delete all academic data.</p>
      <p>Archiving or logically deleting a group erases its stored assistant questions, answers, and execution links, and cancels pending answers. Usage and ownership metadata remain. Unarchiving does not restore erased conversation text. This does not recall information already sent to an AI provider.</p>
      <p>Other logs, records, and any operator-managed backups follow the deployment’s retention practices. Ask your administrator about applicable periods and deletion requests.</p>
    </>,
  },
  {
    id: "privacy-choices", title: "Your choices and requests",
    content: <>
      <p>You can update your password in profile settings, manage available email preferences, choose whether to use AI, and leave code/execution sharing off. Essential account or security communications may be separate from optional course notifications.</p>
      <p>Contact the institution or administrator who provided your account to ask about access, corrections, deletion, privacy concerns, or where providers process information. Requests are handled according to applicable law and academic record requirements. CodeHive has no self-service option that guarantees immediate deletion of every record.</p>
    </>,
  },
  {
    id: "privacy-updates", title: "Protection and updates",
    content: <>
      <p>CodeHive uses password hashing, authenticated role-based access, and isolated code execution with resource limits. These safeguards reduce risk but cannot guarantee complete security. Keep your credentials private and report suspected unauthorized access to your administrator.</p>
      <p>This notice may change as features or providers change. Review the date above and the <Link to="/terms" className={legalLinkClass}>Terms of Service</Link>. The operator must communicate any additional notices or permissions required for its deployment.</p>
    </>,
  },
];

export function PrivacyPolicyPage() {
  return <LegalPage active="privacy" title="Privacy Policy" description="What CodeHive stores, how information supports coursework, and what is shared when you use AI assistance."
    summary="CodeHive handles account details and academic work to deliver programming courses. AI help is optional, with separate choices for sharing editor code and execution context. Contact your institution or account administrator about privacy requests."
    sections={sections} />;
}

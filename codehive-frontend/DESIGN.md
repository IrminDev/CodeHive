# CodeHive Frontend Design System

Use this guide for every new or changed CodeHive frontend view. It records patterns implemented in landing components and student pages; source tokens live in `app/styles/global.css`.

## Visual direction

- Educational developer tool: calm blue structure, gold active accents, dense but readable workspaces.
- Light mode uses white and soft gray surfaces. Dark mode uses navy surfaces, never pure black.
- Marketing pages are spacious and illustrative. Authenticated student pages are compact, task-focused, and data-dense.
- Keep rounded geometry (`rounded-lg`, `rounded-xl`, `rounded-2xl`) and subtle 1 px borders. Use sharp corners only for code/editor content when needed.

## Colors

### Brand tokens

| Token | Hex | Primary use |
| --- | --- | --- |
| `imperial` | `#00296B` | deepest blue, gradient end, dark text on gold |
| `french` | `#003F88` | hover blue, gradient middle |
| `azure` | `#00509D` | primary action, links, selected light-mode state |
| `yellow` | `#FDC500` | dark-mode accent, live/status highlight |
| `gold` | `#FFD500` | gold gradient end |
| `dark-bg` | `#060C18` | dark page background |
| `dark-surface` | `#0D1525` | dark header, panel, alternate surface |
| `dark-card` | `#162033` | dark card/input surface |

Extended tokens (`*-light`) exist for rare lighter accents. Prefer opacity variants such as `bg-azure/10` over inventing new colors.

### Theme pairing

```tsx
bg-white dark:bg-dark-card
text-gray-900 dark:text-gray-100
text-gray-500 dark:text-gray-400
border-gray-200 dark:border-gray-700/60
text-azure dark:text-yellow
bg-azure/10 dark:bg-yellow/10
border-azure/20 dark:border-yellow/20
```

Theme changes use `.dark` on the document root. Every visible color needs light and dark treatment.

### Semantic states

| State | Utility family | Student use |
| --- | --- | --- |
| Success / delivered / accepted | `green-500` | delivery and AC verdicts |
| Warning / pending | `yellow` | pending work and live indicators |
| Late | `orange-500` | overdue or late delivery |
| Error / closed / failed | `red-500` | failure panels and unavailable states |
| Runtime resource issue | `purple-500`, `pink-500` | MLE and OLE verdicts |
| Neutral / unavailable | `gray-500` | read-only and not-open states |

Use soft fills with matching borders for state pills: `bg-<color>/10 text-<color> border-<color>/20`.

## Typography

Font stack: `Inter`, then system sans-serif. Code, limits, IDs, shortcut labels, and verdict details use `font-mono`.

| Role | Classes |
| --- | --- |
| Landing hero | `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight` |
| Landing section title | `text-3xl sm:text-4xl lg:text-5xl font-bold` |
| App page title | `text-3xl font-bold` |
| Card title | `text-xl font-semibold` or `text-lg font-bold` |
| Section/panel title | `text-sm font-semibold` |
| Body | `text-sm text-gray-500 dark:text-gray-400`; marketing may use `text-lg` |
| Metadata | `text-xs` |
| Dense labels and chips | `text-[10px] font-medium` or `font-semibold uppercase tracking-wide` |

Use `gradient-text` for blue marketing emphasis and `gradient-text-gold` for gold emphasis. Do not use gradients for routine app content or long text.

## Icons

- App pages use `lucide-react`; use semantic icons, not decorative replacements for labels.
- Standard sizes: `13–14` for compact actions and metadata, `16` for list-row actions, `18` for header controls, `20–21` for navigation, `28–30` for empty/error states.
- Keep icon-button hit areas at least `w-9 h-9` or `p-2`; use `aria-label` and `title` when no visible label exists.
- Landing illustration icons may use inline SVG with `strokeWidth={1.5}`. Controls use `strokeWidth={2}`.
- Active sidebar icon: `text-yellow bg-yellow/10`. Inactive: gray with hover surface.

## Layout

### Marketing shell

```tsx
<section className="py-24 lg:py-32 relative overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* content */}
  </div>
</section>
```

- Landing header: fixed, `z-50`, `h-16 lg:h-20`; transparent before scroll, `glass` after scroll, opaque while mobile menu is open.
- Hero: `min-h-screen`, `pt-10`, two columns at `lg`, `gap-12 lg:gap-16`.
- Section heading: centered, `max-w-3xl mx-auto mb-16 lg:mb-24`.
- Landing grids: features `md:grid-cols-2 lg:grid-cols-3`; process `md:grid-cols-2 lg:grid-cols-4`.

### Authenticated application shell

```tsx
<div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg">
  <RoleSidebar active="..." />
  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
    <RoleHeader breadcrumbs={[...]} />
    <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">...</main>
  </div>
</div>
```

- Student and teacher pages use matching role shells: `StudentHeader`/`StudentSidebar` and
  `TeacherShell`. Do not create route-local headers or sidebars.
- Sidebar: `w-14`, fixed-width icon rail with `bg-gray-50 dark:bg-dark-surface` and right border.
- Header: `h-12`, compact breadcrumbs and notification/theme/profile/logout controls on right.
- Teacher navigation order is Dashboard, Assignments, Groups, Grades, Analytics. Notification
  settings live in header bell control rather than sidebar.
- Standard content widths: `max-w-5xl` for a focused group/detail page; `max-w-6xl` for group grids. Dashboard is a multi-column workspace and may fill available width.
- Use `min-w-0` on flex children containing truncating text or horizontal panels.
- Workspace/editor pages may use full viewport height and fixed lower test-result panels; normal pages scroll only their main content.

### Responsive rules

- Start one column. Add columns at `md`; reserve desktop navigation, side panels, and dense controls for `lg`.
- Hide non-essential search and metadata before `sm`; retain core action, breadcrumb/current title, and theme/logout controls.
- Buttons become `flex-col sm:flex-row` where two CTAs cannot fit safely.
- Never depend on hover alone for task state or navigation.

## Spacing and surfaces

| Context | Pattern |
| --- | --- |
| Landing container | `px-4 sm:px-6 lg:px-8` |
| Marketing section | `py-24 lg:py-32` |
| App main content | `p-6 lg:p-8` |
| Panel header | `px-5 py-3.5` or `px-5 py-4` |
| Card body | `p-5`; richer landing cards `p-6 lg:p-8` |
| Detail hero | `p-6 lg:p-7` |
| Compact actions | `px-3 py-1.5` or `px-3 py-2` |
| Major page gaps | `space-y-5` or `space-y-6` |

Base card/panel:

```tsx
rounded-2xl border border-gray-200 dark:border-gray-800/60
bg-white dark:bg-dark-surface
```

Use `bg-gray-50 dark:bg-dark-surface` for information containers and `bg-white dark:bg-dark-card` for nested inputs/detail cards. Split list rows with `divide-y divide-gray-100 dark:divide-gray-800/60`.

## Components

### Buttons

Global utility classes:

- `btn-primary`: blue gradient, white text; primary creation/submit action.
- `btn-secondary`: gold gradient, imperial text; high-contrast CTA on blue hero/footer surfaces.
- `btn-outline`: blue/yellow border; secondary action.

For compact app controls, use explicit classes instead of oversized global buttons:

```tsx
inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
border border-gray-300 dark:border-gray-700
text-gray-500 dark:text-gray-400
hover:text-gray-800 dark:hover:text-gray-100 transition-colors
```

Primary compact action:

```tsx
inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
bg-azure text-white hover:bg-french transition-colors
```

### Pills, labels, and metrics

- Use `rounded-full` for status pills and membership/delivery state.
- Use `rounded-md` for small counts and keyboard hints.
- Dense labels: `text-[10px] uppercase tracking-wide font-semibold`.
- Pair icon + label with `gap-1` or `gap-1.5`; use `font-mono` for language, time, memory, and numeric identifiers.

### Forms and inputs

```tsx
w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
bg-white dark:bg-dark-surface text-gray-900 dark:text-white
placeholder:text-gray-400 dark:placeholder:text-gray-500
focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
```

Labels use `text-sm font-medium text-gray-700 dark:text-gray-300`. Keep validation near field; reserve red panels for page/request failures.

Use shared controls instead of native select/date fields:

- `Dropdown` from `app/shared/components/ui/Dropdown.tsx` for option lists. It provides consistent Radix keyboard navigation, selected indicators, portal layering, descriptions, disabled states, and compact sizing.
- `CalendarInput` from `app/shared/components/ui/CalendarInput.tsx` for `date` and `datetime-local` values. It preserves native calendar accessibility while adding brand focus states, calendar/clock affordances, optional clearing, and compact sizing.

Do not add raw `<select>`, `<input type="date">`, or `<input type="datetime-local">` controls in feature views.

### Loading, empty, and error states

- Loading: geometry-matched `animate-pulse` gray blocks, usually `rounded-2xl`.
- Empty: centered icon, short title, one sentence, and one direct next action when available.
- Error: `rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center`; use red icon and retry when request can be retried.

## Landing decoration and motion

- Use ambient blue/gold blurred circles behind marketing content only: `w-96 h-96 rounded-full blur-3xl`.
- Hero grid uses 60 px grid lines with very low opacity; How It Works uses hex pattern via `--hex-grid-stroke`.
- `glass` is reserved for scroll-aware header or elevated overlays.
- Cards may hover with `hover:-translate-y-1`, accent border, and faint shadow. App list rows use background/color transition only.
- Existing utilities: `animate-float`, `animate-pulse-glow`, `animate-slide-up`, `animate-fade-in`, `animate-slide-in-right`, `animate-slide-in-left`, `animate-fade-scale`, and Tailwind `animate-pulse`/`animate-spin`.
- Keep interaction durations between 200–300 ms; landing reveal transitions may use 500 ms or more.

## Accessibility and implementation rules

- Maintain visible text contrast across both themes; pair all brand accents with explicit text colors.
- Native buttons for actions, `Link` for navigation. Provide `aria-label` for icon-only controls.
- Use `truncate`, `line-clamp-*`, and `min-w-0` before allowing IDs or titles to overflow.
- Preserve keyboard focus. Do not remove `focus:outline-none` unless a visible focus ring replaces it.
- Keep public examples and student-visible test inputs readable in `font-mono`, `whitespace-pre-wrap` containers.
- Do not expose private expected outputs or hidden tests outside teacher-only preview flows.

## Source views

- Landing: `app/features/landing/components/`
- Shared tokens/utilities: `app/styles/global.css`
- Student navigation: `app/features/student/components/StudentHeader.tsx`, `StudentSidebar.tsx`
- Student layouts: `app/features/student/pages/StudentDashboardPage.tsx`, `MyGroupsPage.tsx`, `StudentGroupDetailPage.tsx`, `AssignmentPage.tsx`
- Teacher shell and primitives: `app/features/teacher/components/TeacherShell.tsx`, `TeacherUI.tsx`
- Teacher workflows: `app/features/teacher/pages/`

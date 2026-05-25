# CodeHive Design System

Reference guide for building pages consistent with the landing page style.

---

## Color Palette

All colors are defined as Tailwind tokens in `app/styles/global.css`.

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `imperial` | `#00296B` | Darkest blue — gradients, dark text on light bg |
| `french` | `#003F88` | Mid blue — gradients, secondary accents |
| `azure` | `#00509D` | Primary blue — links, icons, borders, buttons |
| `yellow` | `#FDC500` | Primary gold — dark mode accents, badges, CTA |
| `gold` | `#FFD500` | Lighter gold — gradient pairs with yellow |

### Extended Shades

| Token | Usage |
|---|---|
| `azure-light` | Lighter blue tints, text in dark mode |
| `french-light` | Mid-blue text or hover states |
| `yellow-light` | Soft gold highlights |
| `gold-light` | Softer gold fills |

### Dark Mode Surfaces

| Token | Hex | Usage |
|---|---|---|
| `dark-bg` | `#0a0f1a` | Page background |
| `dark-surface` | `#111827` | Section backgrounds, alternate rows |
| `dark-card` | `#1a2234` | Cards, panels |

### Light Mode Surfaces

Use Tailwind defaults: `white`, `gray-50`, `gray-100`, `gray-200`.

---

## Dark Mode

The project uses the `class` strategy. The `.dark` class is toggled on the `<html>` element via `ThemeProvider`. Every element needs both a light and a dark variant.

**Pattern:**
```
bg-white dark:bg-dark-card
text-gray-900 dark:text-white
text-gray-600 dark:text-gray-400
border-gray-200 dark:border-gray-700/50
```

**Accent swaps** — `azure` in light mode becomes `yellow` in dark mode:
```
text-azure dark:text-yellow
bg-azure/10 dark:bg-yellow/10
border-azure/20 dark:border-yellow/20
hover:text-azure dark:hover:text-yellow
```

---

## Typography

Font family: **Inter** (loaded via `--font-sans` in `global.css`).

### Scale

| Role | Classes |
|---|---|
| Hero H1 | `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight` |
| Section H2 | `text-3xl sm:text-4xl lg:text-5xl font-bold` |
| Card H3 | `text-xl font-semibold` |
| Body large | `text-lg text-gray-600 dark:text-gray-400` |
| Body default | `text-base text-gray-600 dark:text-gray-400` |
| Label / badge | `text-sm font-medium` |
| Caption | `text-xs text-gray-500` |

### Gradient Text Utilities

```css
.gradient-text       /* blue: azure → french → imperial */
.gradient-text-gold  /* gold: yellow → gold */
```

Usage example:
```tsx
<h2>
  Everything you need to{" "}
  <span className="gradient-text">teach coding</span>
</h2>
```

---

## Layout

### Page Container

All sections use a consistent centered container:
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### Section Padding

```
py-24 lg:py-32
```

### Section Header (centered)

Every content section opens with an identical header block:
```tsx
<div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
  {/* Label badge */}
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                  bg-azure/10 dark:bg-yellow/10
                  border border-azure/20 dark:border-yellow/20 mb-6">
    <span className="text-sm font-medium text-azure dark:text-yellow">
      Section Label
    </span>
  </div>

  {/* Title */}
  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold
                 text-gray-900 dark:text-white mb-6">
    Title with a <span className="gradient-text">highlighted word</span>
  </h2>

  {/* Subtitle */}
  <p className="text-lg text-gray-600 dark:text-gray-400">
    Supporting description text.
  </p>
</div>
```

### Grids

| Columns | Classes |
|---|---|
| 2-col | `grid lg:grid-cols-2 gap-12 lg:gap-16 items-center` |
| 3-col cards | `grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8` |
| 4-col steps | `grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6` |

---

## Components

### Buttons

Three global utilities defined in `global.css`:

```css
.btn-primary   /* blue gradient, white text */
.btn-secondary /* gold gradient, imperial text */
.btn-outline   /* bordered, swaps fill on hover */
```

Always pair with `inline-flex items-center justify-center gap-2` for icon alignment.

### Cards

Standard content card:
```
bg-white dark:bg-dark-card
rounded-2xl p-6 lg:p-8
border border-gray-200 dark:border-gray-700/50
hover:border-azure/50 dark:hover:border-yellow/50
transition-all duration-500
hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5
hover:-translate-y-1
```

Larger rounded cards (e.g. creator profiles, contact form):
```
rounded-3xl p-8 lg:p-10
```

### Badge / Label Pill

```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-azure/10 dark:bg-yellow/10
                border border-azure/20 dark:border-yellow/20">
  <span className="w-2 h-2 rounded-full bg-azure dark:bg-yellow animate-pulse" />
  <span className="text-sm font-medium text-azure dark:text-yellow">
    Label text
  </span>
</div>
```

### Icon Box

Square icon container for feature cards:
```
inline-flex items-center justify-center w-14 h-14 rounded-xl
bg-gradient-to-br from-azure to-french   /* or other brand pair */
text-white
group-hover:scale-110 transition-transform duration-300
```

### Glass Panel

```css
.glass  /* bg-white/70 dark:bg-dark-card/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 */
```

Used for the hero illustration card and scroll-aware header.

### Form Inputs

```
w-full px-4 py-3 rounded-xl
border border-gray-200 dark:border-gray-700
bg-white dark:bg-dark-surface
text-gray-900 dark:text-white
placeholder:text-gray-400 dark:placeholder:text-gray-500
focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow
focus:border-transparent transition-all duration-200
```

Labels:
```
block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2
```

### Gradient CTA Banner

Full-bleed banner used in the Footer:
```
rounded-3xl
bg-gradient-to-br from-imperial via-french to-azure
p-8 lg:p-16 text-center
```

Use `btn-secondary` (gold) for the primary action inside this banner so it contrasts with the blue background.

---

## Backgrounds & Decorations

### Section Backgrounds

Alternate sections between transparent (inherits page bg) and:
```
bg-gray-50 dark:bg-dark-surface
```

Add hairline separators on alternating sections:
```
absolute top-0 / bottom-0 left-0 right-0 h-px
bg-gradient-to-r from-transparent via-azure/20 dark:via-yellow/20 to-transparent
```

### Ambient Gradient Orbs

Large, blurred orbs placed absolutely behind content:
```
absolute w-96 h-96 rounded-full blur-3xl
bg-azure/20 dark:bg-azure/10     /* blue orb */
bg-yellow/20 dark:bg-yellow/10   /* gold orb */
```

Pair them at opposite corners (top-left / bottom-right).

### Grid Pattern (hero only)

```
bg-[linear-gradient(rgba(0,80,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,80,157,0.03)_1px,transparent_1px)]
dark:bg-[linear-gradient(rgba(253,197,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(253,197,0,0.03)_1px,transparent_1px)]
bg-[size:60px_60px]
```

### Card Top Accent

A thin colored stripe on the top edge of creator / profile cards:
```
absolute top-0 left-0 right-0 h-1 rounded-t-3xl
bg-gradient-to-r from-azure to-french   /* or yellow/gold, french/imperial */
```

---

## Animations

All keyframes and utility classes are in `global.css`.

| Class | Effect |
|---|---|
| `animate-float` | Gentle vertical bob (6 s loop) — floating cards, orbs |
| `animate-pulse-glow` | Yellow glow pulse (3 s loop) — status indicators |
| `animate-slide-up` | One-shot slide up from 30 px |
| `animate-fade-in` | One-shot opacity fade |
| `animate-slide-in-right` | One-shot slide from right (page transitions) |
| `animate-slide-in-left` | One-shot slide from left (page transitions) |
| `animate-fade-scale` | One-shot scale-up fade (page transitions) |
| `animate-bounce` | Tailwind built-in — scroll indicator |
| `animate-pulse` | Tailwind built-in — live status dots |
| `animate-spin` | Tailwind built-in — loading spinners |

### Scroll-triggered Entry

Use `IntersectionObserver` + React state to stagger card entrances:
```tsx
const [visibleItems, setVisibleItems] = useState<number[]>([]);
// observer adds index to visibleItems when card enters viewport

className={`transition-all duration-500 ${
  visibleItems.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
}`}
style={{ transitionDelay: `${index * 100}ms` }}
```

### Mount Entry (single element)

```tsx
const [isVisible, setIsVisible] = useState(false);
useEffect(() => { setIsVisible(true); }, []);

className={`transition-all duration-1000 ${
  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
}`}
```

Use `delay-300` on secondary elements (e.g. hero illustration).

---

## Icons

Use inline SVG only. No icon library imports.

**Stroke pattern** (all icons follow this):
```tsx
<svg className="w-N h-N" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="..." />
</svg>
```

- `strokeWidth={1.5}` for decorative / feature icons  
- `strokeWidth={2}` for UI / action icons (arrows, checkmarks, menu)

---

## Gradients Reference

Common brand gradient pairs used throughout:

| Name | Classes |
|---|---|
| Blue primary | `from-azure to-french` |
| Blue deep | `from-french to-imperial` |
| Blue full | `from-imperial via-french to-azure` |
| Gold | `from-yellow to-gold` |
| Mixed | `from-azure to-azure-light` |
| Reversed gold | `from-gold to-yellow` |

For text use `.gradient-text` or `.gradient-text-gold` utilities.  
For backgrounds use `bg-gradient-to-br` (or `to-r`).

---

## Responsive Breakpoints

Follow Tailwind's defaults. The landing page uses three primary tiers:

| Tier | Prefix | Notes |
|---|---|---|
| Mobile | *(none)* | Single column, stacked layout |
| Tablet | `sm:` | 2-col grids, horizontal button groups |
| Desktop | `lg:` | Full multi-column grids, larger padding/type |

Navigation collapses to a hamburger below `lg`.

---

## Accessibility

- Every icon-only button has `aria-label`.
- Social link anchors carry `aria-label` matching the platform name.
- Form inputs are associated with `<label>` via matching `id` / `htmlFor`.
- Color contrast: primary text (`gray-900` / `white`) on surfaces always meets AA. Avoid using muted grays (`gray-400`, `gray-500`) as the sole conveyor of critical information.

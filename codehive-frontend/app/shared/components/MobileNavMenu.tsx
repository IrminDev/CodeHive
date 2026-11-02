import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router";

export interface MobileNavItem {
  key: string;
  label: string;
  to: string;
  icon: ReactNode;
}

/**
 * Hamburger button plus slide-in navigation drawer for phone widths (below `sm`).
 * Wider screens keep the icon rail, so the button hides itself from `sm` up.
 * Without `active`, the item whose path is the longest prefix of the current URL is highlighted.
 */
export function MobileNavMenu({ items, homeTo, title, active }: {
  items: MobileNavItem[];
  homeTo: string;
  title: string;
  active?: string;
}) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const drawerId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Close after navigating, and on Escape; move focus into the drawer and back to the trigger.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };

  const current = active ?? items
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]?.key;

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} aria-controls={drawerId}
        className="sm:hidden -ml-1 w-9 h-9 flex-shrink-0 grid place-items-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow">
        <Menu size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={close} />
          <div id={drawerId} role="dialog" aria-modal="true" aria-label={`${title} navigation`}
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col bg-gray-50 dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800/60 shadow-xl motion-safe:animate-[nav-drawer-in_200ms_ease-out]">
            <div className="h-12 flex-shrink-0 flex items-center justify-between gap-3 px-3 border-b border-gray-200 dark:border-gray-800/60">
              <Link to={homeTo} className="flex items-center gap-2.5 min-w-0">
                <div style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} className="w-8 h-8 flex-shrink-0 bg-yellow grid place-items-center">
                  <span className="text-dark-bg font-bold text-xs leading-none">&lt;/&gt;</span>
                </div>
                <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">CodeHive <span className="font-normal text-gray-400 dark:text-gray-500">· {title}</span></span>
              </Link>
              <button ref={closeButton} type="button" onClick={close} aria-label="Close navigation menu"
                className="w-9 h-9 flex-shrink-0 grid place-items-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label={`${title} navigation`} className="flex-1 overflow-y-auto p-3 space-y-1">
              {items.map((item) => {
                const isActive = item.key === current;
                return (
                  <Link key={item.key} to={item.to} aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:focus-visible:ring-yellow ${isActive
                      ? "text-azure bg-azure/10 dark:text-yellow dark:bg-yellow/10"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-card"}`}>
                    <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

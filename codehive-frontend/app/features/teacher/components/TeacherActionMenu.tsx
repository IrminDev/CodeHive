import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

import { compactButtonClass } from "./TeacherUI";

interface Anchor {
  top: number;
  right: number;
  triggerTop: number;
  placed: boolean;
}

const GAP = 4;
const VIEWPORT_MARGIN = 8;

export function ActionMenu({
  label,
  trigger,
  triggerClassName = compactButtonClass,
  width = "w-48",
  children,
}: {
  label: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  width?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = anchor !== null;

  function close() {
    setAnchor(null);
  }

  function toggle() {
    if (open) return close();
    const rect = triggerRef.current?.getBoundingClientRect();
    setAnchor({
      top: (rect?.bottom ?? 0) + GAP,
      right: Math.max(12, window.innerWidth - (rect?.right ?? 0)),
      triggerTop: rect?.top ?? 0,
      placed: false,
    });
  }

  // Rows near the bottom of the viewport would push the menu off-screen, so open it upward there.
  useLayoutEffect(() => {
    if (!anchor || anchor.placed) return;
    const height = menuRef.current?.getBoundingClientRect().height ?? 0;
    const overflowsBelow = anchor.top + height > window.innerHeight - VIEWPORT_MARGIN;
    const fitsAbove = anchor.triggerTop - GAP - height >= VIEWPORT_MARGIN;
    setAnchor({
      ...anchor,
      top: overflowsBelow && fitsAbove ? anchor.triggerTop - GAP - height : anchor.top,
      placed: true,
    });
  }, [anchor]);

  useEffect(() => {
    if (!open) return;
    const dismiss = () => setAnchor(null);
    function closeOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      dismiss();
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      dismiss();
      triggerRef.current?.focus();
    }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        {trigger ?? <MoreHorizontal size={14} />}
      </button>
      {anchor &&
        createPortal(
          // Panels clip absolute children with overflow-hidden, so the menu lives outside them.
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            style={{ top: anchor.top, right: anchor.right }}
            className={`fixed z-50 ${width} rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-dark-card`}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  );
}

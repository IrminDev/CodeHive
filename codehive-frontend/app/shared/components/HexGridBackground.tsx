import { useId } from "react";

/**
 * Decorative honeycomb grid that fills its positioned parent.
 * The stroke defaults to the theme's --hex-grid-stroke (azure in light mode, yellow in dark mode);
 * pass a fixed color for panels that keep the same background in both themes.
 */
export function HexGridBackground({ stroke = "var(--hex-grid-stroke)", className = "" }: { stroke?: string; className?: string }) {
  const patternId = `hex-grid-${useId().replace(/:/g, "")}`;

  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={patternId} x="0" y="0" width="51.96" height="90" patternUnits="userSpaceOnUse">
          <polygon points="25.98,0 51.96,15 51.96,45 25.98,60 0,45 0,15" fill="none" style={{ stroke }} strokeWidth="1" />
          <polygon points="0,45 25.98,60 25.98,90 0,105 -25.98,90 -25.98,60" fill="none" style={{ stroke }} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

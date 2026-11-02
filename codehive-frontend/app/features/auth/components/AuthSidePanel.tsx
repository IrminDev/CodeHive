import type { ReactNode } from "react";

import logo from "~/assets/logo.png";
import { HexGridBackground } from "~/shared/components/HexGridBackground";

/** Blue brand panel shown on the left of the sign-in and recovery screens (lg and up). */
export function AuthSidePanel({ mounted, children, footer }: { mounted: boolean; children: ReactNode; footer: ReactNode }) {
  return (
    <div
      className={`hidden lg:flex lg:w-1/2 relative overflow-x-hidden overflow-y-auto scrollbar-hide flex-col px-16 xl:px-24 py-10 short:py-6
        bg-gradient-to-br from-[#1565C0] via-[#003F88] to-[#001840]
        ${mounted ? "animate-slide-in-left" : "opacity-0"}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0566d9]/20 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#001840]/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
        <HexGridBackground stroke="rgba(255,255,255,0.04)" />
      </div>

      <div className="relative z-10">
        <a href="/" className="inline-flex items-center gap-3 group">
          <img src={logo} alt="CodeHive" className="h-12 w-12 transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold text-white">CodeHive</span>
        </a>
      </div>

      <div className="relative z-10 my-auto py-10 short:py-5">{children}</div>

      <div className="relative z-10 border-t border-white/10 pt-6 short:pt-4">{footer}</div>
    </div>
  );
}

/** Small pill above a panel heading, e.g. "The hive". */
export function AuthEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-yellow">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Icon tile with a title and a monospaced detail line; `stacked` puts the icon above the text for narrow columns. */
export function AuthFeature({ icon, title, detail, stacked = false }: { icon: ReactNode; title: string; detail: string; stacked?: boolean }) {
  return (
    <div className={stacked ? "flex flex-col items-start gap-3" : "flex items-start gap-4"}>
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-white/10 text-yellow" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 font-mono text-xs text-white/50">{detail}</p>
      </div>
    </div>
  );
}

import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode — Monaco Editor is not SSR-compatible
  ssr: false,
} satisfies Config;

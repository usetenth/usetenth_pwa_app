import type { Stage } from "./api";

/** Where a user belongs, given how far their setup has got. */
export function routeFor(stage: Stage): string {
  switch (stage) {
    case "needs_rule":
    case "needs_gateway":
      return "/onboarding";
    case "needs_kyc":
      return "/verify";
    case "active":
      return "/portfolio";
  }
}

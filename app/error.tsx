"use client";

import { ErrorScreen } from "@/components/ErrorScreen";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen kind="error" title="Something went wrong" message="That did not work as it should. Try again, and if it keeps happening, come back in a moment." onRetry={reset} retry home />;
}

import type { Metadata } from "next";
import { ErrorScreen } from "@/components/ErrorScreen";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <ErrorScreen kind="notfound" title="This page isn't here" message="The link may be old or mistyped. Let's get you back on track." home back />;
}

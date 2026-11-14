/** The newest notices that arrived since `seen`, oldest first; an empty list when nothing is new. */
export function arrivedSince<T extends { id: string; read: boolean }>(items: T[], seen: Set<string>): T[] {
  return items.filter((n) => !n.read && !seen.has(n.id)).reverse();
}

export function ago(iso: string, now = Date.now()): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

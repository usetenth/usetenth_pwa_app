"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { StatusArt } from "@/components/ErrorScreen";
import { isUnreachable } from "@/lib/http";
import { useReleaseLaunch } from "@/lib/launch";

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tenth-lockup.svg" alt="usetenth" className={`${className} w-auto dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tenth-lockup-dark.svg" alt="usetenth" className={`${className} hidden w-auto dark:block`} />
    </>
  );
}

export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tenth-mark.svg" alt="" className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tenth-mark-dark.svg" alt="" className={`${className} hidden dark:block`} />
    </>
  );
}

const RING = [
  [32, 11, 5.6], [44.34, 15.01, 4.4], [51.97, 25.51, 4.2], [51.97, 38.49, 4.0], [44.34, 48.99, 3.8],
  [32, 53, 3.6], [19.66, 48.99, 3.8], [12.03, 38.49, 4.0], [12.03, 25.51, 4.2], [19.66, 15.01, 4.4],
] as const;

// With `animated`, the purple dot travels around the ring.
export function DotRing({ percent, className = "h-32 w-32", animated = false }: { percent: number; className?: string; animated?: boolean }) {
  const filled = Math.max(1, Math.round(percent / 10));
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={`${percent} percent`}>
      {RING.map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill={i < filled ? "var(--violet)" : "var(--ink)"}
          opacity={i === 0 && percent < 10 ? 0.55 : 1}
          className={animated ? "ring-dot" : undefined}
          style={animated ? { animationDelay: `${i * 0.12}s` } : undefined}
        />
      ))}
    </svg>
  );
}

export function ThemeToggle() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("usetenth:theme", dark ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/80 text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

/** A bell that links to the notification list, with a dot when something is unread. */
export function BellLink({ unread }: { unread: number }) {
  return (
    <Link href="/notifications" aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/80 text-ink">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 7H4c0-1 2-2 2-7zM10 20a2 2 0 004 0" />
      </svg>
      {unread > 0 ? <span className="num absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1 text-[11px] font-semibold text-white">{unread > 9 ? "9+" : unread}</span> : null}
    </Link>
  );
}

export function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  const cls = "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/80 text-ink";
  const icon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
  return href ? (
    <Link href={href} aria-label="Back" className={cls}>
      {icon}
    </Link>
  ) : (
    <button onClick={() => router.back()} aria-label="Back" className={cls}>
      {icon}
    </button>
  );
}

interface ScreenProps {
  title?: string;
  subtitle?: string;
  back?: string | boolean;
  brand?: boolean;
  // Puts the heading under the nav bar; on by default whenever there is a back button.
  stack?: boolean;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Screen({ title, subtitle, back, brand, stack, right, footer, children }: ScreenProps) {
  useReleaseLaunch();
  // The heading sits under the nav bar so the nav only holds controls.
  const stacked = stack ?? (!!back && (brand || !!subtitle));
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <header className="flex items-center gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {back ? <BackButton href={typeof back === "string" ? back : undefined} /> : null}
        {stacked ? (
          <div className="flex-1" />
        ) : (
          <>
            {brand ? <Mark /> : null}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
              {subtitle ? <p className="text-sm text-mute">{subtitle}</p> : null}
            </div>
          </>
        )}
        {right}
      </header>
      {stacked ? (
        <div className="px-5 pb-2 pt-4">
          <div className="flex items-center gap-3">
            {brand ? <Mark className="h-10 w-10 shrink-0" /> : null}
            <h1 className="min-w-0 text-3xl font-semibold leading-tight">{title}</h1>
          </div>
          {subtitle ? <p className="mt-2 text-mute">{subtitle}</p> : null}
        </div>
      ) : null}
      <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-2">{children}</main>
      {footer ? (
        <footer className="sticky bottom-0 border-t border-line bg-bg/85 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

const TILE_ICONS = {
  tenth: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2",
  activity: "M4 6h16M4 12h16M4 18h10",
  buy: "M12 5v14M5 12h14",
  account: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
} as const;

/** A tappable tile with an icon, for the main shortcuts. */
export function NavTile({ href, icon, label }: { href: string; icon: keyof typeof TILE_ICONS; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-card px-1 pb-3 pt-3.5 text-xs font-medium shadow-sm transition active:scale-95 active:bg-chip"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet/10 text-violet">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={TILE_ICONS[icon]} />
        </svg>
      </span>
      {label}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-card/90 p-4 shadow-sm ${className}`}>{children}</section>;
}

export function Chip({ active, className = "", ...props }: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      aria-pressed={active}
      className={`num h-12 flex-1 rounded-full border text-sm transition ${
        active ? "border-violet bg-violet/10 text-violet" : "border-line bg-card text-ink"
      } ${className}`}
    />
  );
}

const btn = "flex h-14 w-full items-center justify-center rounded-full text-base font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100";

export function PrimaryButton({ href, className = "", ...props }: { href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${btn} bg-violet text-white shadow-[0_8px_24px_-8px_rgba(91,61,245,0.7)] ${className}`;
  return href ? <Link href={href} className={cls}>{props.children}</Link> : <button {...props} className={cls} />;
}

export function SecondaryButton({ href, className = "", ...props }: { href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${btn} border border-line bg-card text-ink ${className}`;
  return href ? <Link href={href} className={cls}>{props.children}</Link> : <button {...props} className={cls} />;
}

export function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--violet)]" />
      <span>
        <span className="block text-[15px] font-medium leading-snug">{label}</span>
        <span className="block text-sm text-mute">{hint}</span>
      </span>
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  className = "",
  ...props
}: { label: string; hint?: string; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block px-1 text-sm">{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        className={`h-14 w-full rounded-2xl border bg-card px-4 outline-none focus:border-violet ${error ? "border-loss" : "border-line"} ${className}`}
      />
      {error ? <p className="mt-1 px-1 text-sm text-loss">{error}</p> : hint ? <p className="mt-1 px-1 text-sm text-mute">{hint}</p> : null}
    </div>
  );
}

export function ErrorCard({ title = "Something went wrong.", children, onRetry }: { title?: string; children?: ReactNode; onRetry?: () => void }) {
  if (isUnreachable(typeof children === "string" ? children : null)) {
    return (
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <StatusArt kind="offline" className="h-20 w-20" />
        <p className="text-lg font-semibold">Can&apos;t reach usetenth</p>
        <p className="max-w-xs text-sm text-mute">Check your connection and try again. If it keeps happening, we are probably fixing something and will be back shortly.</p>
        <button
          type="button"
          onClick={onRetry ?? (() => window.location.reload())}
          className="mt-1 h-11 rounded-full bg-violet px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(91,61,245,0.7)] transition active:scale-95"
        >
          Try again
        </button>
      </Card>
    );
  }
  return (
    <Card>
      <p className="font-medium text-loss">{title}</p>
      {children ? <p className="mt-1 text-sm text-mute">{children}</p> : null}
    </Card>
  );
}

/** The brand artwork of the launch screen: the travelling dot, the name and the tagline. */
export function SplashArt({ intro = false }: { intro?: boolean }) {
  return (
    <>
      <DotRing percent={10} animated className={`${intro ? "launch-ring " : ""}h-24 w-24`} />
      <p className={`${intro ? "launch-word " : ""}text-2xl font-semibold tracking-tight`}>usetenth</p>
      <p className={`${intro ? "launch-word " : ""}text-sm text-mute`} style={intro ? { animationDelay: "0.25s" } : undefined}>Keep a tenth. Invest it.</p>
    </>
  );
}

/** What shows while a screen is getting ready: the same display as the launch screen, with no loading text. */
export function Splash() {
  return (
    <div role="status" aria-label="usetenth" className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-bg">
      <SplashArt />
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd className="num text-right">{children}</dd>
    </div>
  );
}
